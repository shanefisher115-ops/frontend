import { supabase, databaseMode } from "./supabase";
import { mockFacts } from "./mockData";
import type { PkoFact, NewFactInput } from "../types/fact";
import type { REALTIME_SUBSCRIBE_STATES, Session } from "@supabase/supabase-js";

/**
 * Data access adapter for knowledge facts (`pko_facts`).
 *
 * Mirrors the `database.ts` adapter for signals, with one deliberate
 * difference: a live query failure does NOT fall back to mock data — mock
 * facts are only shown in explicit mock mode, so a live error is always
 * visible instead of silently dressed up as real knowledge.
 *
 * Access model (RLS on `public.pko_facts`):
 *   - SELECT / INSERT: `authenticated` and `service_role`
 *   - `anon` (the publishable key alone) is locked out
 * So the panel establishes an authenticated session before querying.
 */

export interface FactsFetchResult {
  facts: PkoFact[];
  mode: "live" | "mock";
  /** Present when a live query ran but failed. Null otherwise. */
  error: string | null;
}

export async function fetchFacts(): Promise<FactsFetchResult> {
  if (databaseMode === "mock" || !supabase) {
    return { facts: mockFacts, mode: "mock", error: null };
  }

  const { data, error } = await supabase
    .from("pko_facts")
    .select("id, topic, summary, key_points, sources, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return { facts: [], mode: "live", error: formatFactsError(error) };
  }

  return { facts: (data as PkoFact[]) ?? [], mode: "live", error: null };
}

export interface InsertFactResult {
  error: string | null;
}

/** Insert a fact. Requires an authenticated session (RLS). */
export async function insertFact(
  input: NewFactInput,
): Promise<InsertFactResult> {
  if (databaseMode === "mock" || !supabase) {
    return { error: "Mock mode — connect Supabase credentials to save facts." };
  }

  const { error } = await supabase.from("pko_facts").insert([input]);

  if (error) {
    return { error: formatFactsError(error) };
  }
  return { error: null };
}

/**
 * Subscribe to realtime changes on `public.pko_facts` (INSERT / UPDATE /
 * DELETE). The callback fires on any change — the panel refetches to stay
 * in sync. Returns an unsubscribe function (no-op in mock mode).
 *
 * `pko_facts` is a member of the `supabase_realtime` publication; delivery
 * of change events additionally follows the table's RLS read policies, so
 * events reach authenticated subscribers.
 */
export function subscribeToFacts(onChange: () => void): () => void {
  if (databaseMode === "mock" || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("pko-facts-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "pko_facts" },
      () => onChange(),
    )
    .subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        // Non-fatal: initial fetch + manual refresh still keep data fresh.
        console.warn("[pko-facts] realtime subscription failed:", status);
      }
    });

  return () => {
    supabase?.removeChannel(channel);
  };
}

// ---- Auth helpers (the fact store requires an authenticated session) ----

/** Current session, or null when signed out / mock mode. */
export async function getFactSession(): Promise<Session | null> {
  if (databaseMode === "mock" || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/** Sign in with email + password. Returns an error message on failure. */
export async function signInForFacts(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  if (databaseMode === "mock" || !supabase) {
    return { error: "Mock mode — sign-in is not available." };
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: formatAuthError(error) };
  }
  return { error: null };
}

/** Sign out the current session. */
export async function signOutFromFacts(): Promise<void> {
  if (databaseMode === "mock" || !supabase) return;
  await supabase.auth.signOut();
}

/** Fire `cb` on auth state changes; returns an unsubscribe function. */
export function onAuthStateChange(
  cb: (session: Session | null) => void,
): () => void {
  if (databaseMode === "mock" || !supabase) {
    return () => {};
  }
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session ?? null);
  });
  return () => {
    data.subscription.unsubscribe();
  };
}

// ---- Error formatting ----

export function formatFactsError(error: {
  code?: string;
  message: string;
}): string {
  if (error.code === "42P01" || /relation .* does not exist/i.test(error.message)) {
    return "The `pko_facts` table does not exist in your Supabase project yet. Run the migration SQL (see src/types/fact.ts) to create it.";
  }
  if (error.code === "42501" || /permission denied/i.test(error.message)) {
    return "Permission denied — `pko_facts` is readable by authenticated users only. Sign in above.";
  }
  return `${error.code ? `[${error.code}] ` : ""}${error.message}`;
}

function formatAuthError(error: { code?: string; message: string }): string {
  if (/invalid login credentials/i.test(error.message)) {
    return "Invalid email or password. Accounts are created in the Supabase dashboard (Authentication → Users).";
  }
  if (/email not confirmed/i.test(error.message)) {
    return "Email not confirmed yet. Confirm the address from the Supabase dashboard or disable email confirmation.";
  }
  return error.message;
}
