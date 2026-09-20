import { handleAuthRoute } from "./routes/auth.server";
import { handleDbRoute } from "./routes/db.server";
import { handleMediaRoute } from "./routes/media.server";
import { handleStorageRoute } from "./routes/storage.server";
import { failure, toApiError } from "./http.server";

// Entry point for every non-SSR request: /api/* and /media/*.

export function isServerRoute(pathname: string): boolean {
  return pathname.startsWith("/api/") || pathname === "/api" || pathname.startsWith("/media/");
}

export async function handleServerRequest(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));

    // `/media/*` is a top-level public route, unlike `/api/*` whose first
    // segment is the API prefix. Keep `media` for its handler so uploaded
    // site images resolve at the URL saved by the dashboard.
    const media = await handleMediaRoute(request, pathSegments);
    if (media) return media;

    const segments = pathSegments.slice(1);

    const auth = await handleAuthRoute(request, segments);
    if (auth) return auth;

    const db = await handleDbRoute(request, segments);
    if (db) return db;

    const storage = await handleStorageRoute(request, segments);
    if (storage) return storage;

    return failure(404, "Unknown endpoint.");
  } catch (error) {
    const { status, message } = toApiError(error);
    return failure(status, message);
  }
}

/** Headers applied to every API/media response. */
export function withSecurityHeaders(response: Response): Response {
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  return response;
}
