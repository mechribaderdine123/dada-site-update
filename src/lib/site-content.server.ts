import { createServerFn } from "@tanstack/react-start";

import { query } from "@/server/db/pool.server";

/**
 * Reads the editable site copy from PostgreSQL during SSR.
 *
 * Previously every page rendered its bundled fallback asset on the server and
 * only fetched the real value in the browser, so visitors saw the default
 * image first and then watched it swap (and downloaded both files). Loading
 * here lets the server emit the final <img src> straight into the HTML.
 */
export const loadSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<string, string>> => {
    const rows = await query<{ key: string; value: string }>("select key, value from site_content");
    const store: Record<string, string> = {};
    for (const row of rows) store[row.key] = row.value;
    return store;
  },
);
