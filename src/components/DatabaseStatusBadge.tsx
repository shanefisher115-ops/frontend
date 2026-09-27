import { useState, useEffect } from "react";
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
  const [pulseAnnouncement, setPulseAnnouncement] = useState("");

  // Announce status to screen readers on mount
  useEffect(() => {
    setPulseAnnouncement(
      isLive
        ? "Database status: Connected to Supabase Live database."
        : "Database status: Using Mock Fallback data."
    );
  }, [isLive]);

  return (
    <div
      className={`status-badge ${isLive ? "status-badge--live" : "status-badge--mock"}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="status-database-mode"
      aria-label={isLive ? "Supabase Live" : "Using Mock Fallback"}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      <span>{isLive ? "🟢 Supabase Live" : "🔴 Using Mock Fallback"}</span>
      <span className="sr-only">{pulseAnnouncement}</span>
    </div>
  );
}
