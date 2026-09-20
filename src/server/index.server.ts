import { ensureMigrated } from "./db/migrate.server";
import { ensureBucketFolders } from "./storage/files.server";
import { seedAdminAccount } from "./auth/seed.server";
import { handleServerRequest, withSecurityHeaders } from "./api/router.server";

// Startup work for the API: migrate the database, create the upload folders
// and seed the first administrator. It runs once, lazily, on the first request
// and is retried if the database is not reachable yet.

let bootPromise: Promise<void> | undefined;

export function ensureServerReady(): Promise<void> {
  if (!bootPromise) {
    bootPromise = boot().catch((error) => {
      bootPromise = undefined;
      throw error;
    });
  }
  return bootPromise;
}

async function boot(): Promise<void> {
  await ensureMigrated();
  await ensureBucketFolders();
  await seedAdminAccount();
}

export async function handleApiRequest(request: Request): Promise<Response> {
  try {
    await ensureServerReady();
  } catch (error) {
    console.error("[api] server is not ready:", error);
    return new Response(
      JSON.stringify({ data: null, error: { message: "The server is starting. Please retry." } }),
      { status: 503, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }

  return withSecurityHeaders(await handleServerRequest(request));
}
