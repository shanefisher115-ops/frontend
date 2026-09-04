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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("primordia_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
      return document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    }
    return "dark";
  });
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const shortcutsBtnRef = useRef<HTMLButtonElement>(null);
  const modalCloseBtnRef = useRef<HTMLButtonElement>(null);

  // Sync theme attribute on <html> element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("primordia_theme", theme);
  }, [theme]);

  const load = useCallback(async (manual = false) => {
    if (manual) {
      setIsRefreshing(true);
      setAnnouncement("Refreshing signals telemetry data...");
    }
    try {
      const r = await fetchSignals();
      setResult(r);
      const now = new Date();
      setLastUpdated(now);
      if (manual) {
        setAnnouncement(`Signals updated at ${now.toLocaleTimeString()}`);
      }
    } finally {
      if (manual) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToSignals(() => load());
    const interval = setInterval(() => load(), 15000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [load]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === "dark" ? "light" : "dark";
      setAnnouncement(`Switched to ${nextTheme} theme`);
      return nextTheme;
    });
  }, []);

  const toggleShortcutsModal = useCallback(() => {
    setIsShortcutsOpen((prev) => {
      const nextState = !prev;
      setAnnouncement(
        nextState
          ? "Keyboard shortcuts dialog opened"
          : "Keyboard shortcuts dialog closed"
      );
      return nextState;
    });
  }, []);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when focused in form controls
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

      if (e.key === "Escape" && isShortcutsOpen) {
        e.preventDefault();
        setIsShortcutsOpen(false);
        setAnnouncement("Keyboard shortcuts dialog closed");
        shortcutsBtnRef.current?.focus();
        return;
      }

      // Ignore modifiers for r, t, ? except Shift for ?
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        load(true);
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === "?") {
        e.preventDefault();
        toggleShortcutsModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [load, toggleTheme, toggleShortcutsModal, isShortcutsOpen]);

  // Focus trap management for shortcuts modal
  useEffect(() => {
    if (isShortcutsOpen) {
      modalCloseBtnRef.current?.focus();
    }
  }, [isShortcutsOpen]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  return (
    <div className="console">
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Screen reader live region for announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="a11y-announcement"
      >
        {announcement}
      </div>

      <header className="console__header" role="banner">
        <div className="console__brand">
          <span className="console__logo" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
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

          {/* Keyboard shortcuts trigger */}
          <button
            ref={shortcutsBtnRef}
            type="button"
            className="theme-toggle"
            onClick={toggleShortcutsModal}
            aria-label="Keyboard shortcuts help (Shortcut: ?)"
            aria-haspopup="dialog"
            aria-expanded={isShortcutsOpen}
            title="Keyboard shortcuts (Press ?)"
          >
            <span aria-hidden="true" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              ?
            </span>
          </button>

          {/* Theme toggle button */}
          <button
            type="button"
            className="theme-toggle"
            data-theme-toggle
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Switch to light mode (Shortcut: T)"
                : "Switch to dark mode (Shortcut: T)"
            }
            aria-pressed={theme === "light"}
            title={`Toggle theme (Press T)`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="console__main">
        <section
          className="card connection-card"
          aria-labelledby="connection-heading"
        >
          <div className="connection-card__head">
            <h2 id="connection-heading" className="card__title">
              Connection
            </h2>
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
            <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_ANON_KEY</code>, then restart the dev server
            (or rebuild/redeploy) — the badge flips to 🟢 Supabase Live
            automatically. No code changes required.
          </p>
          <dl className="diag-grid" aria-label="Environment diagnostics">
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
          <div
            className="card alert-card"
            role="alert"
            aria-live="assertive"
          >
            <strong>Live query failed — serving mock data.</strong>
            <p>{result?.error}</p>
          </div>
        )}

        <section className="card" aria-labelledby="signals-heading">
          <div className="signals__head">
            <div className="signals__head-title">
              <h2 id="signals-heading" className="card__title">
                Signals
              </h2>
            </div>

            <div className="signals__actions">
              <button
                type="button"
                className="action-btn"
                onClick={() => load(true)}
                disabled={isRefreshing}
                aria-label="Refresh signals data (Shortcut: R)"
                aria-busy={isRefreshing}
                title="Refresh signals (Press R)"
              >
                <svg
                  className={`action-btn__icon ${isRefreshing ? "spin" : ""}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>Refresh</span>
                <kbd className="shortcut-badge" aria-hidden="true">
                  R
                </kbd>
              </button>

              <span
                className="signals__source"
                aria-label={`Data source: ${result?.isMock ? "mock dataset" : "supabase"}`}
              >
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
          </div>

          {loading ? (
            <p className="muted" role="status" aria-live="polite">
              Loading signals data…
            </p>
          ) : (
            <div className="table-wrap">
              <table aria-label="Signals telemetry list">
                <caption className="sr-only">
                  Signals telemetry list showing name, origin, status,
                  intensity, and recorded time
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
        <p className="console__footer-shortcuts">
          <span className="muted">Shortcuts: </span>
          <kbd>R</kbd> refresh · <kbd>T</kbd> toggle theme · <kbd>?</kbd> help
        </p>
      </footer>

      {/* Keyboard Shortcuts Help Modal */}
      {isShortcutsOpen && (
        <div
          className="modal-overlay"
          onClick={() => {
            setIsShortcutsOpen(false);
            shortcutsBtnRef.current?.focus();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            aria-describedby="shortcuts-desc"
            className="card modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-dialog__head">
              <h2 id="shortcuts-title" className="card__title">
                Keyboard Shortcuts
              </h2>
              <button
                ref={modalCloseBtnRef}
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setIsShortcutsOpen(false);
                  shortcutsBtnRef.current?.focus();
                }}
                aria-label="Close keyboard shortcuts dialog"
              >
                ✕
              </button>
            </div>
            <p id="shortcuts-desc" className="muted" style={{ marginBottom: "1rem" }}>
              Use these shortcuts to navigate and control the database console efficiently:
            </p>
            <ul className="shortcuts-list">
              <li>
                <kbd>R</kbd>
                <span>Refresh signals telemetry data</span>
              </li>
              <li>
                <kbd>T</kbd>
                <span>Toggle dark / light mode</span>
              </li>
              <li>
                <kbd>?</kbd>
                <span>Open / close this keyboard shortcuts help modal</span>
              </li>
              <li>
                <kbd>Esc</kbd>
                <span>Close modal dialog</span>
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
          aria-label={`Status for ${label}: ${configured ? "configured" : "missing"}`}
        >
          {configured ? "set" : "missing"}
        </span>
        <span
          className="diag-value"
          aria-label={`Value for ${label}: ${value}`}
        >
          {value}
        </span>
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
          aria-label={`Intensity: ${signal.intensity} percent`}
        >
          <div className="intensity__bar">
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
      <td className="muted">
        <time
          dateTime={recorded.toISOString()}
          title={recorded.toLocaleString()}
          aria-label={`Recorded ${timeAgo(recorded)}, exact time ${recorded.toLocaleString()}`}
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
