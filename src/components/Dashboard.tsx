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
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>("");

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "dark" || attr === "light") return attr;
      if (typeof window.matchMedia === "function") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const load = useCallback(() => {
    fetchSignals().then((r) => {
      setResult(r);
      setLastUpdated(new Date());
    });
  }, []);

  const handleRefresh = useCallback(() => {
    load();
    setAnnouncement("Refreshed signals data.");
  }, [load]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      setAnnouncement(`Switched to ${next} theme.`);
      return next;
    });
  }, []);

  const toggleShortcuts = useCallback(() => {
    setShowShortcuts((prev) => {
      const next = !prev;
      setAnnouncement(
        next
          ? "Keyboard shortcuts guide expanded."
          : "Keyboard shortcuts guide collapsed.",
      );
      return next;
    });
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

  // Keyboard shortcuts handler
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

      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleRefresh();
      } else if (e.key === "?" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        toggleShortcuts();
      } else if (e.key === "Escape") {
        if (showShortcuts) {
          e.preventDefault();
          setShowShortcuts(false);
          setAnnouncement("Keyboard shortcuts guide collapsed.");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme, handleRefresh, toggleShortcuts, showShortcuts]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Screen Reader Live Region for Announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

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
              onClick={handleRefresh}
              aria-label="Refresh signals dataset"
              title="Refresh signals (Key: R)"
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
                <path d="M21.5 2v6h-6M2.5 22v-6h6" />
                <path d="M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M2.5 16l1 1a10 10 0 0 0 18.8-4.3" />
              </svg>
            </button>
            <button
              type="button"
              className={`icon-btn ${showShortcuts ? "icon-btn--active" : ""}`}
              onClick={toggleShortcuts}
              aria-label="Toggle keyboard shortcuts guide"
              aria-expanded={showShortcuts}
              aria-controls="keyboard-shortcuts-guide"
              title="Keyboard shortcuts (Key: ?)"
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
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
            <button
              type="button"
              className="theme-toggle"
              data-theme-toggle
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode (Key: T)`}
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
          {showShortcuts && (
            <section
              id="keyboard-shortcuts-guide"
              className="card shortcuts-card"
              aria-labelledby="shortcuts-title"
            >
              <div className="shortcuts-card__head">
                <h2 id="shortcuts-title" className="card__title">
                  Keyboard Shortcuts
                </h2>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={toggleShortcuts}
                  aria-label="Close keyboard shortcuts guide"
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
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="shortcuts-grid">
                <div className="shortcut-item">
                  <span className="shortcut-item__label">Toggle Theme</span>
                  <kbd className="kbd">T</kbd>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-item__label">Refresh Signals</span>
                  <kbd className="kbd">R</kbd>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-item__label">Shortcuts Guide</span>
                  <kbd className="kbd">?</kbd>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-item__label">Close Guide</span>
                  <kbd className="kbd">Esc</kbd>
                </div>
              </div>
            </section>
          )}

          <section
            className="card connection-card"
            aria-labelledby="connection-title"
          >
            <div className="connection-card__head">
              <h2 id="connection-title" className="card__title">
                Connection
              </h2>
              <span
                className={`mode-pill mode-pill--${databaseMode}`}
                role="status"
                aria-label={`Database mode: ${databaseMode === "live" ? "Live mode" : "Mock mode"}`}
              >
                {databaseMode === "live" ? "Live mode" : "Mock mode"}
              </span>
            </div>
            <p className="connection-card__desc">
              The client auto-detects credentials from{" "}
              <code>frontend/primordialorigin.com/.env</code>. Add{" "}
              <code>VITE_SUPABASE_URL</code> and{" "}
              <code>VITE_SUPABASE_ANON_KEY</code>, then restart the dev server
              (or rebuild/redeploy) — the badge flips to 🟢 Supabase Live
              automatically. No code changes required.
            </p>
            <dl
              className="diag-grid"
              aria-label="Environment variable diagnostics"
            >
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
              <h2 id="signals-title" className="card__title">
                Signals
              </h2>
              <div className="signals__actions">
                <span className="signals__source" aria-live="polite">
                  {databaseMode === "live" && (
                    <span className="live-pulse" aria-hidden="true" />
                  )}
                  {result?.isMock
                    ? "source: mock dataset"
                    : "source: supabase"}
                  {lastUpdated && (
                    <span className="signals__updated">
                      · updated {timeAgo(lastUpdated)}
                    </span>
                  )}
                </span>
              </div>
            </div>
            {loading ? (
              <p className="muted" role="status" aria-live="polite">
                Loading…
              </p>
            ) : (
              <div className="table-wrap">
                <table>
                  <caption className="sr-only">
                    List of signals with origin, status, intensity, and recorded
                    time
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Origin</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="num">
                        Intensity
                      </th>
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
      </div>
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
          aria-label={`${label} configuration status: ${configured ? "set" : "missing"}`}
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
  return (
    <tr>
      <td className="signal-name">{signal.name}</td>
      <td className="muted">{signal.origin}</td>
      <td>
        <span
          className={`status-chip status-chip--${signal.status}`}
          role="status"
          aria-label={`Status: ${STATUS_LABEL[signal.status]}`}
        >
          {STATUS_LABEL[signal.status]}
        </span>
      </td>
      <td className="num">
        <div
          className="intensity"
          role="meter"
          aria-label={`Signal intensity for ${signal.name}`}
          aria-valuenow={signal.intensity}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="intensity__bar" aria-hidden="true">
            <div
              className="intensity__fill"
              style={{
                width: `${Math.max(0, Math.min(100, signal.intensity))}%`,
              }}
            />
          </div>
          <span>{signal.intensity}</span>
        </div>
      </td>
      <td className="muted" title={recorded.toLocaleString()}>
        <time dateTime={signal.recorded_at}>{timeAgo(recorded)}</time>
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
