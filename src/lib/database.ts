import { supabase, databaseMode } from "./supabase";
import { mockSignals } from "./mockData";
import type { Signal } from "../types/signal";

/**
 * Data access adapter. The rest of the app calls `fetchSignals()` and never
 * cares whether it's hitting Supabase or the mock dataset — this module routes
 * based on the credentials detected in `src/lib/supabase.ts`.
 *
 * In live mode it queries the `signals` table. Any query error (missing table,
 * RLS, network) is surfaced so the dashboard can show actionable guidance
 * instead of crashing.
 */

export interface FetchResult {
  signals: Signal[];
  mode: "live" | "mock";
  /** Present when a live query ran but failed. Null otherwise. */
  error: string | null;
  /** True when the result came from the mock dataset. */
  isMock: boolean;
}

export async function fetchSignals(): Promise<FetchResult> {
  if (databaseMode === "mock" || !supabase) {
    return {
      signals: mockSignals,
      mode: "mock",
      error: null,
      isMock: true,
    };
  }

  const { data, error } = await supabase
    .from("signals")
    .select("id, name, origin, status, intensity, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(50);

  if (error) {
    // Keep the app usable: fall back to mock data but report the live failure.
    return {
      signals: mockSignals,
      mode: "live",
      error: formatSupabaseError(error),
      isMock: true,
    };
  }

  return {
    signals: (data as Signal[]) ?? [],
    mode: "live",
    error: null,
    isMock: false,
  };
}

function formatSupabaseError(error: {
  code?: string;
  message: string;
}): string {
  // PostgREST relation-missing error → friendlier message.
  if (error.code === "42P01" || /relation .* does not exist/i.test(error.message)) {
    return "The `signals` table does not exist in your Supabase project yet. Run the migration SQL (see src/types/signal.ts) to create it.";
  }
  return `${error.code ? `[${error.code}] ` : ""}${error.message}`;
}
