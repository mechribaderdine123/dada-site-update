import { authorize, QueryDeniedError, type Action, type Actor } from "../policy/rules.server";
import {
  SqlParams,
  buildOrderBy,
  buildWhere,
  normaliseLimit,
  pickWritableValues,
  quote,
  type WireFilter,
  type WireOrder,
} from "./sql-builder.server";
import { QueryInputError, TABLES, parseRequestedColumns, type TableName } from "./tables.server";

// Turns a validated wire request into a single statement. The policy layer
// decides which rows and columns are reachable; this module only assembles the
// SQL around those decisions.

export type StatementRequest = {
  table: TableName;
  action: Action;
  actor: Actor;
  select: string;
  filters: WireFilter[];
  order: WireOrder[];
  limit: unknown;
  payload: unknown;
};

export type Statement = { text: string; params: unknown[] };

export function buildStatement(request: StatementRequest): Statement {
  const meta = TABLES[request.table];
  const params = new SqlParams();
  const requested = parseRequestedColumns(meta, request.select);
  const payload = toPayloadObject(request.payload);

  const decision = authorize({
    table: request.table,
    action: request.action,
    actor: request.actor,
    payload,
    requestedColumns: requested.columns,
    param: (value) => params.bind(value),
  });

  if (!decision.allowed) throw new QueryDeniedError(decision.message);

  const visible =
    decision.columns.length > 0
      ? requested.columns.filter((column) => decision.columns.includes(column))
      : requested.columns;

  if (visible.length === 0) throw new QueryInputError("No readable columns were requested.");
  const projection = visible
    .map((column) =>
      decision.maskedColumns[column]
        ? `${decision.maskedColumns[column]} as ${quote(column)}`
        : quote(column),
    )
    .join(", ");

  // Filtering and sorting are limited to columns the caller may read, except
  // when the policy narrows the read to the caller's own row.
  const touchesPrivateColumn = [...request.filters.map((f) => f.column), ...request.order.map((o) => o.column)].some(
    (column) => meta.columns.includes(column) && !meta.publicColumns.includes(column),
  );
  const filterColumns =
    decision.selfScope && touchesPrivateColumn && !request.actor?.isAdmin
      ? [...meta.columns]
      : decision.columns.length > 0
        ? decision.columns
        : [...meta.columns];
  const policyFilter =
    decision.selfScope && touchesPrivateColumn && !request.actor?.isAdmin
      ? decision.selfScope
      : decision.filter;

  const table = quote(request.table);
  const payloadColumns = decision.columns.length > 0 ? decision.columns : [];

  switch (request.action) {
    case "select": {
      const where = buildWhere(filterColumns, request.filters, policyFilter, params);
      const order = buildOrderBy(filterColumns, request.order);
      const limit = normaliseLimit(request.limit);
      return {
        text: `select ${projection} from ${table}${where}${order} limit ${limit}`,
        params: params.params,
      };
    }

    case "insert": {
      if (!meta.insertable) throw new QueryDeniedError("Rows cannot be inserted into this table.");
      const payloads = Array.isArray(request.payload) ? request.payload : [request.payload];
      const rows = payloads.map((entry) =>
        pickWritableValues(meta, payloadColumns, toPayloadObject(entry) ?? {}, decision.forcedValues),
      );
      const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
      const values = rows
        .map((row) => `(${columns.map((column) => params.bind(row[column] ?? null)).join(", ")})`)
        .join(", ");
      return {
        text: `insert into ${table} (${columns.map(quote).join(", ")}) values ${values} returning ${projection}`,
        params: params.params,
      };
    }

    case "update": {
      const values = pickWritableValues(meta, payloadColumns, payload ?? {}, decision.forcedValues);
      if (request.filters.length === 0 && !policyFilter) {
        throw new QueryInputError("Refusing to update every row: add a filter.");
      }
      const assignments = Object.entries(values)
        .map(([column, value]) => `${quote(column)} = ${params.bind(value)}`)
        .join(", ");
      const where = buildWhere(filterColumns, request.filters, policyFilter, params);
      return {
        text: `update ${table} set ${assignments}${where} returning ${projection}`,
        params: params.params,
      };
    }

    case "delete": {
      if (request.filters.length === 0 && !policyFilter) {
        throw new QueryInputError("Refusing to delete every row: add a filter.");
      }
      const where = buildWhere(filterColumns, request.filters, policyFilter, params);
      return { text: `delete from ${table}${where} returning ${projection}`, params: params.params };
    }

    case "upsert": {
      if (!meta.insertable) throw new QueryDeniedError("Rows cannot be upserted into this table.");
      // An empty policy column list means the caller may write every table
      // column. Content tables use that form, so passing only the conflict key
      // here used to discard `value` (including uploaded image URLs).
      const writableColumns =
        payloadColumns.length > 0 ? [...payloadColumns, meta.conflictTarget] : [];
      const values = pickWritableValues(
        meta,
        writableColumns,
        payload ?? {},
        decision.forcedValues,
      );
      const columns = Object.keys(values);
      const updated = columns.filter((column) => column !== meta.conflictTarget);
      const conflictAction = updated.length
        ? `do update set ${updated.map((column) => `${quote(column)} = excluded.${quote(column)}`).join(", ")}`
        : "do nothing";
      return {
        text:
          `insert into ${table} (${columns.map(quote).join(", ")}) ` +
          `values (${columns.map((column) => params.bind(values[column] ?? null)).join(", ")}) ` +
          `on conflict (${quote(meta.conflictTarget)}) ${conflictAction} returning ${projection}`,
        params: params.params,
      };
    }

    default:
      throw new QueryInputError("Unsupported action.");
  }
}

function toPayloadObject(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new QueryInputError("Payload must be a JSON object.");
  }
  const entries = Object.entries(value as Record<string, unknown>);
  for (const [, entry] of entries) {
    if (entry === null) continue;
    const type = typeof entry;
    if (type !== "string" && type !== "number" && type !== "boolean") {
      throw new QueryInputError("Payload values must be strings, numbers, booleans or null.");
    }
  }
  return value as Record<string, unknown>;
}
