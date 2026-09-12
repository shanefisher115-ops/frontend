import { databaseMode } from "../lib/supabase";

/**
 * Status badge that reflects the live/mock state of the Supabase client.
 * Reads the precomputed `databaseMode` from the client module, so it updates
 * automatically when `.env` credentials change.
 */
export function DatabaseStatusBadge() {
  const isLive = databaseMode === "live";
  const labelText = isLive ? "Supabase Live" : "Using Mock Fallback";

  return (
    <div
      className={`status-badge ${isLive ? "status-badge--live" : "status-badge--mock"}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="status-database-mode"
      aria-label={`Database status: ${labelText}`}
      title={`Database status: ${labelText}`}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      <span>{labelText}</span>
    </div>
  );
}
