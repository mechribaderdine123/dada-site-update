import { resolveCaller } from "../../auth/identity.server";
import { executeQuery, type DbAction, type DbQueryRequest } from "../../db/query.server";
import { assertSameOrigin, json, methodNotAllowed, readJson } from "../http.server";

// /api/db — the single data endpoint. Its shape mirrors the query the frontend
// client builds (table + action + filters + payload); every authorisation
// decision is made server-side in the policy layer.

type DbBody = {
  table?: string;
  action?: string;
  select?: string;
  filters?: DbQueryRequest["filters"];
  order?: DbQueryRequest["order"];
  limit?: number;
  payload?: unknown;
  single?: boolean;
};

export async function handleDbRoute(
  request: Request,
  segments: string[],
): Promise<Response | null> {
  if (segments[0] !== "db") return null;
  if (segments.length > 1)
    return json({ data: null, error: { message: "Unknown endpoint." } }, 404);
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  assertSameOrigin(request);

  const body = await readJson<DbBody>(request);
  const { actor } = await resolveCaller(request);

  const data = await executeQuery(
    {
      table: String(body.table ?? ""),
      action: String(body.action ?? "select") as DbAction,
      select: body.select,
      filters: body.filters,
      order: body.order,
      limit: body.limit,
      payload: body.payload,
      single: body.single === true,
    },
    actor,
  );

  return json({ data, error: null });
}
