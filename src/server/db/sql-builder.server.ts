import { QueryInputError, type TableMeta } from "./tables.server";

// Builds parameterised SQL fragments. Column identifiers always come from the
// table registry, values always travel as bound parameters.

export class SqlParams {
  private readonly values: unknown[] = [];

  bind(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }

  get params(): unknown[] {
    return this.values;
  }
}

export type FilterOperator = "eq" | "in" | "is";

export type WireFilter = {
  column: string;
  op: FilterOperator;
  value: unknown;
};

export type WireOrder = { column: string; ascending: boolean };

const MAX_IN_VALUES = 500;
const MAX_LIMIT = 1000;
export const DEFAULT_LIMIT = 500;

export function quote(identifier: string): string {
  return `"${identifier}"`;
}

export function assertColumn(meta: TableMeta, column: string): string {
  if (!meta.columns.includes(column)) {
    throw new QueryInputError(`Unknown column "${column}".`);
  }
  return column;
}

function assertAllowed(allowed: readonly string[], column: string): string {
  if (!allowed.includes(column)) {
    throw new QueryInputError(`Unknown column "${column}".`);
  }
  return column;
}

function buildFilter(allowed: readonly string[], filter: WireFilter, params: SqlParams): string {
  const column = quote(assertAllowed(allowed, filter.column));

  if (filter.op === "is") {
    if (filter.value === null) return `${column} is null`;
    if (filter.value === true) return `${column} is true`;
    if (filter.value === false) return `${column} is false`;
    throw new QueryInputError(`Unsupported "is" value for "${filter.column}".`);
  }

  if (filter.op === "in") {
    if (!Array.isArray(filter.value)) {
      throw new QueryInputError(`Filter "in" on "${filter.column}" needs an array.`);
    }
    if (filter.value.length === 0) return "false";
    if (filter.value.length > MAX_IN_VALUES) {
      throw new QueryInputError(`Filter "in" on "${filter.column}" is too large.`);
    }
    return `${column} in (${filter.value.map((value) => params.bind(value)).join(", ")})`;
  }

  if (filter.value === null) return `${column} is null`;
  return `${column} = ${params.bind(filter.value)}`;
}

export function buildWhere(
  allowed: readonly string[],
  filters: readonly WireFilter[],
  policyFilter: string | null,
  params: SqlParams,
): string {
  const clauses = filters.map((filter) => buildFilter(allowed, filter, params));
  if (policyFilter) clauses.push(`(${policyFilter})`);
  if (clauses.length === 0) return "";
  return ` where ${clauses.join(" and ")}`;
}

export function buildOrderBy(allowed: readonly string[], order: readonly WireOrder[]): string {
  if (order.length === 0) return "";
  const parts = order.map(
    (entry) => `${quote(assertAllowed(allowed, entry.column))} ${entry.ascending ? "asc" : "desc"}`,
  );
  return ` order by ${parts.join(", ")}`;
}

export function normaliseLimit(value: unknown): number {
  if (value === undefined || value === null) return DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

/** Validates the payload and keeps only the columns the caller may write. */
export function pickWritableValues(
  meta: TableMeta,
  allowed: readonly string[],
  payload: Record<string, unknown>,
  forced: Record<string, unknown>,
): Record<string, unknown> {
  const writable = allowed.length > 0 ? allowed : meta.columns;
  const values: Record<string, unknown> = {};

  for (const [column, value] of Object.entries(payload)) {
    if (!writable.includes(column)) continue;
    if (!meta.columns.includes(column)) continue;
    if (column === "id" || column === "created_at" || column === "updated_at") continue;
    values[column] = value;
  }

  for (const [column, value] of Object.entries(forced)) {
    values[column] = value;
  }

  if (Object.keys(values).length === 0) {
    throw new QueryInputError("No writable columns were provided.");
  }

  return values;
}
