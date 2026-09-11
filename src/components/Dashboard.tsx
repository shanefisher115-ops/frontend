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
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof document !== "undefined") {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "light" || attr === "dark") return attr;
    }
    return "dark";
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", next);
      }
      return next;
    });
  }, []);

  const load = useCallback(() => {
    setIsRefreshing(true);
    return fetchSignals().then((r) => {
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

  const toggleShortcutsModal = useCallback(() => {
    setShowShortcutsModal((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") {
        setShowShortcutsModal(false);
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        load();
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === "?" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [load, toggleTheme]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
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
              className="action-btn action-btn--icon-only"
              onClick={load}
              aria-label="Refresh signals (Key: R)"
              title="Refresh signals (R)"
              aria-busy={isRefreshing}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21.5 2v6h-6M2.5 22v-6h6" />
                <path d="M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M22 12.5a10 10 0 0 1-18.8 4.3L2.5 16" />
              </svg>
            </button>
            <button
              type="button"
              className="action-btn action-btn--icon-only"
              onClick={toggleShortcutsModal}
              aria-label="Keyboard shortcuts (Key: ?)"
              title="Keyboard shortcuts (?)"
            >
              <kbd aria-hidden="true">?</kbd>
            </button>
            <button
              type="button"
              className="theme-toggle"
              data-theme-toggle
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode (T)" : "Switch to dark mode (T)"}
              aria-pressed={theme === "light"}
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

        <section className="card connection-card" aria-labelledby="connection-title">
          <div className="connection-card__head">
            <h2 id="connection-title" className="card__title">Connection</h2>
            <span
              className={`mode-pill mode-pill--${databaseMode}`}
              aria-label={`Database mode: ${databaseMode === "live" ? "Live mode" : "Mock mode"}`}
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
          <dl className="diag-grid" aria-label="Environment variable diagnostics">
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

        <section className="card" aria-labelledby="signals-title">
          <div className="signals__head">
            <h2 id="signals-title" className="card__title">Signals</h2>
            <span className="signals__source" aria-live="polite">
              {databaseMode === "live" && (
                <span className="live-pulse" aria-hidden="true" />
              )}
              <span>{result?.isMock ? "source: mock dataset" : "source: supabase"}</span>
              {lastUpdated && (
                <span className="signals__updated">
                  {" "}· updated {timeAgo(lastUpdated)}
                </span>
              )}
            </span>
          </div>
          {loading ? (
            <p className="muted" role="status">Loading…</p>
          ) : (
            <div className="table-wrap">
              <table aria-labelledby="signals-title">
                <caption className="sr-only">List of signal telemetry records and their operational status</caption>
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

        {showShortcutsModal && (
          <div
            className="shortcuts-backdrop"
            onClick={() => setShowShortcutsModal(false)}
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
                <h2 id="shortcuts-dialog-title" className="shortcuts-dialog__title">
                  Keyboard Shortcuts
                </h2>
                <button
                  type="button"
                  className="shortcuts-dialog__close"
                  onClick={() => setShowShortcutsModal(false)}
                  aria-label="Close keyboard shortcuts dialog"
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
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ul className="shortcuts-list">
                <li className="shortcuts-list__item">
                  <span>Refresh signals data</span>
                  <kbd>R</kbd>
                </li>
                <li className="shortcuts-list__item">
                  <span>Toggle theme (Dark / Light)</span>
                  <kbd>T</kbd>
                </li>
                <li className="shortcuts-list__item">
                  <span>Toggle shortcuts legend</span>
                  <kbd>?</kbd> or <kbd>K</kbd>
                </li>
                <li className="shortcuts-list__item">
                  <span>Close modal dialog</span>
                  <kbd>Esc</kbd>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </>
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
        <span className="diag-value" aria-label={`${label} value: ${value}`}>{value}</span>
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
          role="progressbar"
          aria-valuenow={signal.intensity}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Intensity: ${signal.intensity}%`}
        >
          <div className="intensity__bar" aria-hidden="true">
            <div
              className="intensity__fill"
              style={{ width: `${Math.max(0, Math.min(100, signal.intensity))}%` }}
            />
          </div>
          <span aria-hidden="true">{signal.intensity}</span>
        </div>
      </td>
      <td className="muted">
        <time
          dateTime={recorded.toISOString()}
          title={recorded.toLocaleString()}
          aria-label={`Recorded ${timeAgo(recorded)} at ${recorded.toLocaleString()}`}
        >
          {timeAgo(recorded)}
        </time>
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
