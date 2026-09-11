import { useEffect, useState, useCallback, useRef } from "react";
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
  const [isRefreshed, setIsRefreshed] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    }
    return "dark";
  });

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(() => {
    setIsRefreshed(true);
    fetchSignals().then((r) => {
      setResult(r);
      setLastUpdated(new Date());
      setTimeout(() => setIsRefreshed(false), 600);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextMode = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextMode);
      return nextMode;
    });
  }, []);

  const toggleShortcutsHelp = useCallback(() => {
    setShowShortcutsHelp((prev) => !prev);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToSignals(load);
    const interval = setInterval(load, 15000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [load]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "Escape" && showShortcutsHelp) {
        setShowShortcutsHelp(false);
        return;
      }

      if (event.key === "?" || (event.key === "h" || event.key === "H")) {
        event.preventDefault();
        toggleShortcutsHelp();
        return;
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        load();
        return;
      }

      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        toggleTheme();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [load, toggleTheme, toggleShortcutsHelp, showShortcutsHelp]);

  // Focus management for shortcuts modal
  useEffect(() => {
    if (showShortcutsHelp) {
      closeButtonRef.current?.focus();
    }
  }, [showShortcutsHelp]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  return (
    <div className="console">
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
            onClick={toggleShortcutsHelp}
            aria-label="Keyboard shortcuts help (Press ?)"
            aria-haspopup="dialog"
            aria-expanded={showShortcutsHelp}
            title="Keyboard shortcuts (?)"
          >
            <kbd className="shortcut-key">?</kbd>
          </button>
          <button
            type="button"
            className="theme-toggle"
            data-theme-toggle
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode (Press T)`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode (T)`}
          >
            {theme === "dark" ? (
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
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main id="main-content" className="console__main" tabIndex={-1}>
        <section className="card connection-card" aria-labelledby="connection-heading">
          <div className="connection-card__head">
            <h2 id="connection-heading" className="card__title">Connection</h2>
            <span className={`mode-pill mode-pill--${databaseMode}`}>
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
          <dl className="diag-grid" aria-label="Environment Diagnostics">
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
          <div className="card alert-card" role="alert" aria-live="assertive">
            <strong>Live query failed — serving mock data.</strong>
            <p>{result?.error}</p>
          </div>
        )}

        <section className="card" aria-labelledby="signals-heading">
          <div className="signals__head">
            <div className="signals__title-group">
              <h2 id="signals-heading" className="card__title">Signals</h2>
              <button
                type="button"
                className="action-btn"
                onClick={load}
                aria-label="Refresh signals dataset (Press R)"
                title="Refresh signals (R)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={isRefreshed ? "spinning" : ""}
                  aria-hidden="true"
                >
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
                <span>Refresh</span>
                <kbd className="shortcut-key">R</kbd>
              </button>
            </div>
            <span className="signals__source" aria-label="Signals data source status">
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

          <div role="status" aria-live="polite" className="sr-only">
            {loading ? "Loading signals data..." : `Loaded ${result?.signals.length ?? 0} signals.`}
          </div>

          {loading ? (
            <p className="muted" aria-busy="true">Loading…</p>
          ) : (
            <div className="table-wrap" tabIndex={0} aria-label="Signals data table">
              <table>
                <caption className="sr-only">
                  Telemetry signals including signal name, origin, status, intensity level, and recording time.
                </caption>
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
      </main>

      <footer className="console__footer" role="contentinfo">
        <p>
          To go live: create a Supabase project, copy your Project URL + anon
          key into <code>.env</code>, run the <code>signals</code> migration
          (see <code>src/types/signal.ts</code>), then restart the dev server
          or rebuild/redeploy.
        </p>
      </footer>

      {showShortcutsHelp && (
        <div
          className="modal-backdrop"
          onClick={() => setShowShortcutsHelp(false)}
          role="presentation"
        >
          <div
            className="modal-card"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="shortcuts-dialog-title" className="card__title">
                Keyboard Shortcuts
              </h3>
              <button
                type="button"
                className="close-btn"
                ref={closeButtonRef}
                onClick={() => setShowShortcutsHelp(false)}
                aria-label="Close shortcuts dialog"
              >
                ✕
              </button>
            </div>
            <ul className="shortcuts-list">
              <li>
                <span className="shortcut-desc">Refresh signals table</span>
                <kbd className="shortcut-key">R</kbd>
              </li>
              <li>
                <span className="shortcut-desc">Toggle theme (Dark / Light)</span>
                <kbd className="shortcut-key">T</kbd>
              </li>
              <li>
                <span className="shortcut-desc">Toggle keyboard shortcuts help</span>
                <kbd className="shortcut-key">?</kbd>
              </li>
              <li>
                <span className="shortcut-desc">Close dialog</span>
                <kbd className="shortcut-key">Esc</kbd>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
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
          aria-label={`${label} status: ${configured ? "configured" : "missing"}`}
        >
          {configured ? "set" : "missing"}
        </span>
        <span className="diag-value" aria-label={`Value: ${value}`}>{value}</span>
      </dd>
    </div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const recorded = new Date(signal.recorded_at);
  return (
    <tr>
      <td className="signal-name">{signal.name}</td>
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
          aria-label={`Intensity ${signal.intensity} percent`}
          aria-valuenow={signal.intensity}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="intensity__bar" aria-hidden="true">
            <div
              className="intensity__fill"
              style={{ width: `${Math.max(0, Math.min(100, signal.intensity))}%` }}
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
