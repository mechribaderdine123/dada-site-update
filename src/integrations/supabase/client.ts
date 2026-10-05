/* eslint-disable @typescript-eslint/no-explicit-any */
// The data client for the application. Although this module keeps its original
// path and export name so that existing call sites keep working, it no longer
// talks to Supabase or to the browser's local storage: every call goes to this
// project's own REST API (/api/*), which stores data in PostgreSQL and files
// in the server upload folder.
//
// NOTE: `any` is required here on purpose. The query builder's loose result
// type is what every existing call site relies on (they cast with `as`).
// Tightening these types would ripple through every route component.

import { apiRequest, isBrowser } from "@/lib/api/http";

type Row = Record<string, any>;

export type LocalUser = { id: string; email: string };
export type Session = { user: LocalUser };

type Listener = (_event: string, session: Session | null) => void;
type Filter = { column: string; op: "eq" | "in" | "is"; value: unknown };
type Order = { column: string; ascending: boolean };
type Action = "select" | "insert" | "update" | "delete" | "upsert";

type Result<T> = { data: T; error: null } | { data: null; error: Error };

/**
 * Chainable query builder. It collects the same calls the application already
 * uses (select/eq/in/order/insert/update/delete/upsert) and sends one request
 * to /api/db when the query is awaited.
 */
class Query implements PromiseLike<Result<any>> {
  private filters: Filter[] = [];
  private ordering: Order[] = [];
  private selected = "*";
  private action: Action = "select";
  private payload: unknown;
  private limitValue: number | undefined;
  private isSingle = false;

  constructor(private readonly table: string) {}

  select(columns = "*"): this {
    this.selected = columns;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: "eq", value });
    return this;
  }

  in(column: string, values: readonly unknown[]): this {
    this.filters.push({ column, op: "in", value: [...values] });
    return this;
  }

  is(column: string, value: unknown): this {
    this.filters.push({ column, op: "is", value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.ordering.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  maybeSingle(): this {
    this.isSingle = true;
    return this;
  }

  /** The name matches the Supabase API the application was written against. */
  single(): this {
    this.isSingle = true;
    return this;
  }

  insert(payload: Row | Row[]): this {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Row): this {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: Row | Row[]): this {
    this.action = "upsert";
    this.payload = payload;
    return this;
  }

  delete(): this {
    this.action = "delete";
    return this;
  }

  then<TResult1 = Result<any>, TResult2 = never>(
    onfulfilled?: ((value: Result<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as never, onrejected as never);
  }

  private async execute(): Promise<Result<any>> {
    // Server-side rendering renders pages without touching the database; the
    // data is fetched in the browser once hydrated.
    if (!isBrowser()) {
      return { data: this.isSingle ? null : [], error: null };
    }

    const result = await apiRequest("/api/db", {
      method: "POST",
      json: {
        table: this.table,
        action: this.action,
        select: this.selected,
        filters: this.filters,
        order: this.ordering,
        limit: this.limitValue,
        payload: this.payload,
        single: this.isSingle,
      },
    });

    if (result.error) return { data: null, error: result.error };
    return { data: result.data, error: null };
  }
}

// ---------------------------------------------------------------- storage --

/** Builds a public media URL for a bucket. */
function mediaUrl(bucket: string, objectPath: string): string {
  const encoded = objectPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/media/${bucket}/${encoded}`;
}

const storage = {
  from: (bucket: string) => ({
    async upload(
      path: string,
      file: File,
      // Accepted for compatibility with the original call sites; the server
      // derives the content type from the file extension.
      _options?: { contentType?: string; upsert?: boolean },
    ): Promise<Result<{ path: string }>> {
      const form = new FormData();
      form.set("bucket", bucket);
      form.set("path", path);
      form.set("file", file);
      const result = await apiRequest<{ path: string }>("/api/storage/upload", {
        method: "POST",
        body: form,
      });
      if (result.error) return { data: null, error: result.error };
      return { data: { path: result.data?.path ?? path }, error: null };
    },

    async remove(paths: string[]): Promise<Result<string[]>> {
      const result = await apiRequest<string[]>("/api/storage/remove", {
        method: "POST",
        json: { paths },
      });
      if (result.error) return { data: null, error: result.error };
      return { data: result.data ?? [], error: null };
    },

    async createSignedUrl(path: string, expiresIn = 3600): Promise<Result<{ signedUrl: string }>> {
      const query = `path=${encodeURIComponent(path)}&expires=${encodeURIComponent(String(expiresIn))}`;
      const result = await apiRequest<{ signedUrl: string }>(`/api/storage/sign?${query}`, {
        method: "GET",
      });
      if (result.error) return { data: null, error: result.error };
      return { data: { signedUrl: result.data?.signedUrl ?? "" }, error: null };
    },

    getPublicUrl(path: string): { data: { publicUrl: string } } {
      return { data: { publicUrl: mediaUrl(bucket, path) } };
    },
  }),
};

// ------------------------------------------------------------------- auth --

let cachedSession: Session | null = null;
let sessionLoaded = false;
const listeners = new Set<Listener>();

function emit(event: string) {
  listeners.forEach((listener) => listener(event, cachedSession));
}

async function loadSession(): Promise<void> {
  if (sessionLoaded || !isBrowser()) return;
  sessionLoaded = true;
  const result = await apiRequest<{ session: Session | null }>("/api/auth/session", {
    method: "GET",
  });
  cachedSession = result.data?.session ?? null;
  // Tell listeners what was found before anyone flips their loading flag off,
  // so route guards never observe a signed-out frame on a normal page load.
  emit(cachedSession ? "INITIALIZED" : "SIGNED_OUT");
}

/** Re-reads the session cookie after the server issued a fresh one. */
async function refreshSession(): Promise<void> {
  if (!isBrowser()) return;
  cachedSession = null;
  sessionLoaded = false;
  await loadSession();
  emit(cachedSession ? "SIGNED_IN" : "SIGNED_OUT");
}

const auth = {
  // Awaiting loadSession guarantees the session is resolved (and listeners
  // notified) before getSession resolves.
  async getSession(): Promise<{ data: { session: Session | null } }> {
    await loadSession();
    return { data: { session: cachedSession } };
  },

  async getUser(): Promise<{ data: { user: LocalUser | null } }> {
    await loadSession();
    return { data: { user: cachedSession?.user ?? null } };
  },

  onAuthStateChange(callback: Listener) {
    listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(callback);
          },
        },
      },
    };
  },

  async signUp(input: {
    email: string;
    password: string;
    options?: { data?: Record<string, unknown>; emailRedirectTo?: string };
  }) {
    const result = await apiRequest<{
      user: LocalUser;
      confirmationRequired: boolean;
      mailSent: boolean;
    }>("/api/auth/sign-up", {
      method: "POST",
      json: {
        email: input.email,
        password: input.password,
        profile: input.options?.data ?? {},
      },
    });
    if (result.error) return { data: { user: null, mailSent: false }, error: result.error };

    // The account waits for e-mail confirmation: no session is issued until
    // the artist follows the link in the confirmation e-mail.
    return {
      data: { user: result.data.user, mailSent: result.data.mailSent },
      error: null,
    };
  },

  /** Confirms an address with the token from the link in the e-mail. */
  async verifyEmail(token: string) {
    const result = await apiRequest<{ verified: boolean }>("/api/auth/verify-email", {
      method: "POST",
      json: { token },
    });
    if (result.error) return { data: { verified: false }, error: result.error };

    await refreshSession();
    return { data: { verified: true }, error: null };
  },

  /** Asks for another confirmation link. The answer never reveals the account. */
  async resendVerification(email: string) {
    return apiRequest<{ sent: boolean }>("/api/auth/resend-verification", {
      method: "POST",
      json: { email },
    });
  },

  async forgotPassword(email: string) {
    return apiRequest<{ sent: boolean }>("/api/auth/forgot-password", {
      method: "POST",
      json: { email },
    });
  },

  async resetPassword(token: string, password: string) {
    return apiRequest<{ reset: boolean }>("/api/auth/reset-password", {
      method: "POST",
      json: { token, password },
    });
  },

  async signInWithPassword(input: { email: string; password: string }) {
    const result = await apiRequest<{ user: LocalUser; session: Session }>("/api/auth/sign-in", {
      method: "POST",
      json: { email: input.email, password: input.password },
    });
    if (result.error) return { data: { user: null }, error: result.error };

    cachedSession = result.data.session;
    sessionLoaded = true;
    emit("SIGNED_IN");
    return { data: { user: result.data.user, session: cachedSession }, error: null };
  },

  async signOut(): Promise<{ error: Error | null }> {
    const result = await apiRequest("/api/auth/sign-out", { method: "POST", json: {} });
    cachedSession = null;
    sessionLoaded = true;
    emit("SIGNED_OUT");
    return { error: result.error };
  },

  admin: {
    async deleteUser(userId: string): Promise<{ error: Error | null }> {
      const result = await apiRequest("/api/auth/delete-account", {
        method: "POST",
        json: { userId },
      });
      return { error: result.error };
    },
  },
};

export const supabase = {
  from: (table: string) => new Query(table),
  storage,
  auth,
};
