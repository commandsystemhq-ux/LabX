import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-only Supabase client.
 *
 * Only the project URL and the *publishable* (anon) key belong in `VITE_*` variables: they ship to
 * the browser by design and access is enforced by Row Level Security (see supabase/schema.sql).
 * A service-role / secret key must never be used here, so such keys are rejected outright.
 */

export interface SupabaseEnv {
  url: string;
  key: string;
}

function jwtRole(token: string): string | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="))) as unknown;
    const role = (json as { role?: unknown } | null)?.role;
    return typeof role === "string" ? role : null;
  } catch {
    return null;
  }
}

/** Validate raw env values. Returns null (feature off) for anything missing or unsafe. */
export function parseSupabaseEnv(url: unknown, key: unknown): SupabaseEnv | null {
  if (typeof url !== "string" || typeof key !== "string") return null;
  const cleanUrl = url.trim().replace(/\/+$/, "");
  const cleanKey = key.trim();
  if (!cleanUrl || !cleanKey) return null;

  try {
    const u = new URL(cleanUrl);
    const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    if (u.protocol !== "https:" && !(local && u.protocol === "http:")) return null;
  } catch {
    return null;
  }

  if (cleanKey.startsWith("sb_secret_") || jwtRole(cleanKey) === "service_role") return null;
  return { url: cleanUrl, key: cleanKey };
}

const env = parseSupabaseEnv(
  import.meta.env["VITE_SUPABASE_URL"],
  import.meta.env["VITE_SUPABASE_ANON_KEY"],
);

export const isSupabaseConfigured = env !== null;

let client: SupabaseClient | null = null;

/** The shared client, or null on the server / when env vars are missing or invalid. */
export function getSupabase(): SupabaseClient | null {
  if (!env || typeof window === "undefined") return null;
  client ??= createClient(env.url, env.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
