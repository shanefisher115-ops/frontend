import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client with automatic mock-fallback detection.
 *
 * The dashboard reads two Vite env vars from `.env`:
 *   VITE_SUPABASE_URL        e.g. https://<ref>.supabase.co
 *   VITE_SUPABASE_ANON_KEY   the project "anon" JWT (safe to expose client-side)
 *
 * When both are present and look like real values, a live Supabase client is
 * created and `databaseMode === "live"`. When either is missing or still a
 * placeholder, no client is created and `databaseMode === "mock"` — the app
 * transparently serves mock data and the status badge shows "Using Mock
 * Fallback". Drop real values into `.env` and the badge flips to
 * "Supabase Live" on the next load. No code changes required.
 */

const PLACEHOLDER_HINTS = ["your_", "your-", "<", "example", "replace", "insert"];

function looksPlaceholder(value: string): boolean {
  const v = value.toLowerCase();
  if (v.length < 10) return true;
  return PLACEHOLDER_HINTS.some((hint) => v.includes(hint));
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabaseUrl = rawUrl.trim();
export const supabaseAnonKey = rawKey.trim();

export const hasSupabaseUrl =
  supabaseUrl.length > 0 && !looksPlaceholder(supabaseUrl);
export const hasSupabaseKey =
  supabaseAnonKey.length > 0 && !looksPlaceholder(supabaseAnonKey);

/** True only when both credentials are present and non-placeholder. */
export const isSupabaseConfigured = hasSupabaseUrl && hasSupabaseKey;

/** "live" when configured, otherwise "mock". Drives the status badge + data adapter. */
export const databaseMode: "live" | "mock" = isSupabaseConfigured
  ? "live"
  : "mock";

/**
 * The live Supabase client, or `null` when running in mock mode. Always check
 * `databaseMode` / `isSupabaseConfigured` before using — the data adapter does
 * this for you.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/** Human-readable source URL/key status, for the connection diagnostics card. */
export const envDiagnostics = {
  url: {
    value: supabaseUrl,
    configured: hasSupabaseUrl,
    masked: maskUrl(supabaseUrl),
  },
  key: {
    value: supabaseAnonKey,
    configured: hasSupabaseKey,
    masked: maskKey(supabaseAnonKey),
  },
};

function maskUrl(url: string): string {
  if (!url) return "—";
  try {
    const u = new URL(url);
    const host = u.host; // e.g. abcdefgh.supabase.co
    return `${host.slice(0, 6)}…${host.slice(-14)}`;
  } catch {
    return url.slice(0, 4) + "…" + url.slice(-6);
  }
}

function maskKey(key: string): string {
  if (!key) return "—";
  if (key.length <= 12) return "•".repeat(key.length);
  return `${key.slice(0, 5)}…${key.slice(-4)} (${key.length} chars)`;
}
