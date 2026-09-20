import type { Actor } from "../policy/rules.server";
import { query as runSql } from "./pool.server";
import { buildStatement } from "./statement.server";
import type { FilterOperator, WireFilter, WireOrder } from "./sql-builder.server";
import { QueryInputError, assertKnownTable } from "./tables.server";

// Public entry point of the data API: validates the wire request, applies the
// policy layer through buildStatement, then executes the statement.

export type DbAction = "select" | "insert" | "update" | "delete" | "upsert";

export type DbQueryRequest = {
  table: string;
  action: DbAction;
  select?: string;
  filters?: Array<{ column: string; op: FilterOperator; value: unknown }>;
  order?: Array<{ column: string; ascending?: boolean }>;
  limit?: number;
  payload?: unknown;
  single?: boolean;
};

const ACTIONS: readonly DbAction[] = ["select", "insert", "update", "delete", "upsert"];
const OPERATORS: readonly FilterOperator[] = ["eq", "in", "is"];
const MAX_FILTERS = 20;
const WILDCARD = "*";

export async function executeQuery(request: DbQueryRequest, actor: Actor): Promise<unknown> {
  const table = assertKnownTable(String(request.table ?? ""));
  const action = String(request.action ?? "select") as DbAction;

  if (!ACTIONS.includes(action)) {
    throw new QueryInputError(`Unsupported action "${String(request.action)}".`);
  }

  const statement = buildStatement({
    table,
    action,
    actor,
    select: typeof request.select === "string" && request.select.trim() ? request.select : WILDCARD,
    filters: normaliseFilters(request.filters),
    order: normaliseOrder(request.order),
    limit: request.limit,
    payload: request.payload,
  });

  const rows = await runSql(statement.text, statement.params);
  if (request.single) return rows[0] ?? null;
  return rows;
}

function normaliseFilters(input: unknown): WireFilter[] {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) throw new QueryInputError("`filters` must be an array.");
  if (input.length > MAX_FILTERS) throw new QueryInputError("Too many filters.");

  return input.map((raw) => {
    if (!raw || typeof raw !== "object") throw new QueryInputError("Invalid filter.");
    const filter = raw as { column?: unknown; op?: unknown; value?: unknown };
    if (typeof filter.column !== "string") throw new QueryInputError("Filter needs a column.");
    const op = String(filter.op ?? "eq") as FilterOperator;
    if (!OPERATORS.includes(op)) throw new QueryInputError(`Unsupported filter operator "${op}".`);
    return { column: filter.column, op, value: filter.value ?? null };
  });
}

function normaliseOrder(input: unknown): WireOrder[] {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) throw new QueryInputError("`order` must be an array.");

  return input.map((raw) => {
    if (!raw || typeof raw !== "object") throw new QueryInputError("Invalid order entry.");
    const entry = raw as { column?: unknown; ascending?: unknown };
    if (typeof entry.column !== "string") throw new QueryInputError("Order needs a column.");
    return { column: entry.column, ascending: entry.ascending !== false };
  });
}
