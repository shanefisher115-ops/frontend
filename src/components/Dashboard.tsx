import { useEffect, useState, useCallback } from "react";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";
import { fetchSignals, subscribeToSignals, type FetchResult } from "../lib/database";
import { envDiagnostics, databaseMode } from "../lib/supabase";
import type { Signal, SignalStatus } from "../types/signal";

const STATUS_LABEL: Record<SignalStatus, string> = {
  active: "Active",
  degraded: "Degraded",
  offline: "Offline",
};

export function Dashboard() {
  const [result, setResult] = useState<FetchResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const load = useCallback(() => {
    setIsRefreshing(true);
    fetchSignals().then((r) => {
      setResult(r);
      setLastUpdated(new Date());
      setIsRefreshing(false);
    });
  }, []);

  useEffect(() => {
    load();
    // Live updates: refetch whenever the runtime writes a row (Supabase Realtime).
    const unsubscribe = subscribeToSignals(load);
    // Fallback poll in case realtime isn't enabled on the table.
    const interval = setInterval(load, 15000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [load]);

  // Keyboard shortcuts event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.isContentEditable;

      if (isInput) return;

      if (e.key === "Escape" && showHelpModal) {
        setShowHelpModal(false);
        return;
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        load();
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        const toggleBtn = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
        toggleBtn?.click();
      } else if (e.key === "?" || e.key === "h" || e.key === "H") {
        e.preventDefault();
        setShowHelpModal((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [load, showHelpModal]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  return (
    <main id="main-content" className="console" tabIndex={-1}>
      <header className="console__header" role="banner">
        <div className="console__brand">
          <span className="console__logo" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle
                cx="16"
                cy="16"
                r="6"
                fill="currentColor"
                opacity="0.9"
              />
              <circle
                cx="16"
                cy="16"
                r="13"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.45"
              />
              <circle
                cx="16"
                cy="16"
                r="9.5"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.25"
              />
            </svg>
          </span>
          <div>
            <h1 className="console__title">Primordia · Database Console</h1>
            <p className="console__subtitle">
              primordialorigin.com · Supabase client with mock fallback
            </p>
          </div>
        </div>
        <div className="console__header-right">
          <DatabaseStatusBadge />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowHelpModal(true)}
            aria-label="Keyboard shortcuts guide"
            title="Keyboard shortcuts (?)"
          >
            <span aria-hidden="true">⌨️</span>
            <span>Shortcuts</span>
            <kbd className="kbd">?</kbd>
          </button>
          <button
            type="button"
            className="theme-toggle"
            data-theme-toggle
            aria-label="Toggle theme"
            title="Toggle theme (T)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        </div>
      </header>

      <section className="card connection-card" aria-labelledby="connection-heading">
        <div className="connection-card__head">
          <h2 id="connection-heading" className="card__title">Connection</h2>
          <span
            className={`mode-pill mode-pill--${databaseMode}`}
            aria-label={`Database mode: ${databaseMode === "live" ? "Live" : "Mock"}`}
          >
            {databaseMode === "live" ? "Live mode" : "Mock mode"}
          </span>
        </div>
        <p className="connection-card__desc">
          The client auto-detects credentials from{" "}
          <code>frontend/primordialorigin.com/.env</code>. Add{" "}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>,{" "}
          then restart the dev server (or rebuild/redeploy) — the badge flips
          to 🟢 Supabase Live automatically. No code changes required.
        </p>
        <dl className="diag-grid">
          <DiagRow
            label="VITE_SUPABASE_URL"
            configured={envDiagnostics.url.configured}
            value={envDiagnostics.url.masked}
          />
          <DiagRow
            label="VITE_SUPABASE_ANON_KEY"
            configured={envDiagnostics.key.configured}
            value={envDiagnostics.key.masked}
          />
        </dl>
      </section>

      {showError && (
        <div className="card alert-card" role="alert">
          <strong>Live query failed — serving mock data.</strong>
          <p>{result?.error}</p>
        </div>
      )}

      <section className="card" aria-labelledby="signals-heading">
        <div className="signals__head">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <h2 id="signals-heading" className="card__title">Signals</h2>
            <button
              type="button"
              className="icon-btn"
              onClick={load}
              disabled={isRefreshing}
              aria-label="Refresh signals data"
              title="Refresh signals data (R)"
            >
              <span aria-hidden="true">{isRefreshing ? "⏳" : "🔄"}</span>
              <span>Refresh</span>
              <kbd className="kbd">R</kbd>
            </button>
          </div>
          <span className="signals__source" aria-live="polite">
            {databaseMode === "live" && (
              <span className="live-pulse" aria-hidden="true" />
            )}
            {result?.isMock ? "source: mock dataset" : "source: supabase"}
            {lastUpdated && (
              <span className="signals__updated">
                · updated {timeAgo(lastUpdated)}
              </span>
            )}
          </span>
        </div>
        {loading ? (
          <p className="muted" aria-live="polite">Loading…</p>
        ) : (
          <div className="table-wrap">
            <table aria-label="Signal metrics table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Origin</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">Intensity</th>
                  <th scope="col">Recorded</th>
                </tr>
              </thead>
              <tbody>
                {result?.signals.map((s) => (
                  <SignalRow key={s.id} signal={s} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="console__footer" role="contentinfo">
        <p>
          To go live: create a Supabase project, copy your Project URL + anon
          key into <code>.env</code>, run the <code>signals</code> migration
          (see <code>src/types/signal.ts</code>), then restart the dev server
          or rebuild/redeploy.
        </p>
      </footer>

      {showHelpModal && (
        <div
          className="shortcuts-dialog-overlay"
          onClick={() => setShowHelpModal(false)}
          role="presentation"
        >
          <div
            className="shortcuts-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shortcuts-dialog__head">
              <h2 id="shortcuts-dialog-title" className="card__title">Keyboard Shortcuts</h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowHelpModal(false)}
                aria-label="Close keyboard shortcuts dialog"
              >
                ✕
              </button>
            </div>
            <ul className="shortcuts-list">
              <li>
                <span>Refresh signals</span>
                <kbd className="kbd">R</kbd>
              </li>
              <li>
                <span>Toggle color theme</span>
                <kbd className="kbd">T</kbd>
              </li>
              <li>
                <span>Toggle shortcuts guide</span>
                <kbd className="kbd">?</kbd>
              </li>
              <li>
                <span>Close dialog</span>
                <kbd className="kbd">Esc</kbd>
              </li>
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}

function DiagRow({
  label,
  configured,
  value,
}: {
  label: string;
  configured: boolean;
  value: string;
}) {
  return (
    <div className="diag-row">
      <dt>
        <code>{label}</code>
      </dt>
      <dd>
        <span
          className={`diag-state ${configured ? "diag-state--ok" : "diag-state--missing"}`}
        >
          {configured ? "set" : "missing"}
        </span>
        <span className="diag-value">{value}</span>
      </dd>
    </div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const recorded = new Date(signal.recorded_at);
  const clampedIntensity = Math.max(0, Math.min(100, signal.intensity));
  return (
    <tr>
      <td className="signal-name" scope="row">{signal.name}</td>
      <td className="muted">{signal.origin}</td>
      <td>
        <span
          className={`status-chip status-chip--${signal.status}`}
          aria-label={`Status: ${STATUS_LABEL[signal.status]}`}
        >
          {STATUS_LABEL[signal.status]}
        </span>
      </td>
      <td className="num">
        <div
          className="intensity"
          role="meter"
          aria-label="Signal intensity"
          aria-valuenow={clampedIntensity}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="intensity__bar" aria-hidden="true">
            <div
              className="intensity__fill"
              style={{ width: `${clampedIntensity}%` }}
            />
          </div>
          <span>{signal.intensity}</span>
        </div>
      </td>
      <td className="muted" title={recorded.toLocaleString()}>
        <time dateTime={recorded.toISOString()}>{timeAgo(recorded)}</time>
      </td>
    </tr>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
