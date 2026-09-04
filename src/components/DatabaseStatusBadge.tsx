import { databaseMode } from "../lib/supabase";

/**
 * Status badge that reflects the live/mock state of the Supabase client.
 * Reads the precomputed `databaseMode` from the client module, so it updates
 * automatically when `.env` credentials change (after a dev-server restart or
 * rebuild — Vite bakes env vars in at startup, they are not hot-reloaded).
 *
 * 🔴 Using Mock Fallback  — credentials missing/placeholder
 * 🟢 Supabase Live       — both env vars configured
 */
export function DatabaseStatusBadge() {
  const isLive = databaseMode === "live";
  return (
    <div
      className={`status-badge ${isLive ? "status-badge--live" : "status-badge--mock"}`}
      role="status"
      aria-live="polite"
      data-testid="status-database-mode"
      aria-label={`Database status: ${isLive ? "Supabase Live" : "Using Mock Fallback"}`}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      <span>{isLive ? "Supabase Live" : "Using Mock Fallback"}</span>
    </div>
  );
}
