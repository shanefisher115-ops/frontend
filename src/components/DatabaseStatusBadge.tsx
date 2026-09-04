import { databaseMode } from "../lib/supabase";

/**
 * Status badge that reflects the live/mock state of the Supabase client.
 * Reads the precomputed `databaseMode` from the client module.
 */
export function DatabaseStatusBadge() {
  const isLive = databaseMode === "live";
  return (
    <span
      className={`status-badge ${isLive ? "status-badge--live" : "status-badge--mock"}`}
      role="status"
      aria-live="polite"
      data-testid="status-database-mode"
      aria-label={`Database status: ${isLive ? "Supabase Live" : "Using Mock Fallback"}`}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      {isLive ? "🟢 Supabase Live" : "🔴 Using Mock Fallback"}
    </span>
  );
}
