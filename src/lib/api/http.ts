// Thin fetch wrapper for the project's own REST API. Every call returns either
// `{ data }` or `{ error }`, which keeps the calling code simple.

export type ApiResult<T> = { data: T; error: null } | { data: null; error: Error };

type RequestOptions = {
  method?: "GET" | "POST";
  json?: unknown;
  body?: BodyInit;
};

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  if (!isBrowser()) {
    return { data: null, error: new Error("This request can only run in the browser.") } as ApiResult<T>;
  }

  const headers: Record<string, string> = { accept: "application/json" };
  let body: BodyInit | undefined = options.body;

  if (options.json !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(options.json);
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? (body ? "POST" : "GET"),
      headers,
      body,
      credentials: "same-origin",
    });
  } catch {
    return { data: null, error: new Error("The server could not be reached. Check your connection.") };
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  const envelope = (parsed ?? {}) as { data?: unknown; error?: { message?: string } | null };

  if (!response.ok) {
    const message =
      envelope.error?.message ??
      (response.status === 401
        ? "You must be signed in."
        : response.status === 403
          ? "You do not have permission to do that."
          : `Request failed (${response.status}).`);
    return { data: null, error: new Error(message) };
  }

  if (envelope.error) {
    return { data: null, error: new Error(envelope.error.message ?? "Request failed.") };
  }

  return { data: (envelope.data ?? null) as T, error: null };
}
