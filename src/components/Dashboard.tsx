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
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    }
    return "dark";
  });
  const [announcement, setAnnouncement] = useState<string>("");

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const r = await fetchSignals();
      setResult(r);
      const now = new Date();
      setLastUpdated(now);
      setAnnouncement(`Signals updated at ${now.toLocaleTimeString()}`);
    } catch {
      setAnnouncement("Failed to load signals data.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      setAnnouncement(`Theme changed to ${nextTheme} mode`);
      return nextTheme;
    });
  }, []);

  const openModal = useCallback(() => {
    lastFocusedElement.current = document.activeElement as HTMLElement;
    setShowShortcutsModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowShortcutsModal(false);
    if (lastFocusedElement.current) {
      lastFocusedElement.current.focus();
    }
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
      // Avoid triggering shortcuts when focused inside form inputs/textareas
      const target = event.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isInput) return;

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        load();
      } else if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        toggleTheme();
      } else if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
        event.preventDefault();
        if (showShortcutsModal) {
          closeModal();
        } else {
          openModal();
        }
      } else if (event.key === "Escape" && showShortcutsModal) {
        event.preventDefault();
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [load, toggleTheme, showShortcutsModal, openModal, closeModal]);

  // Focus trap and auto-focus for help modal
  useEffect(() => {
    if (showShortcutsModal) {
      closeButtonRef.current?.focus();
    }
  }, [showShortcutsModal]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  return (
    <div className="console">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Screen Reader Live Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

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
            <h1 className="console__title" id="console-header-title">
              Primordia · Database Console
            </h1>
            <p className="console__subtitle">
              primordialorigin.com · Supabase client with mock fallback
            </p>
          </div>
        </div>

        <div className="console__header-right">
          <DatabaseStatusBadge />

          <button
            type="button"
            className="theme-toggle"
            data-theme-toggle
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode (Shortcut: T)`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode (Shortcut: T)`}
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

          <button
            type="button"
            className="action-btn"
            onClick={openModal}
            aria-label="View keyboard shortcuts (Shortcut: ?)"
            title="Keyboard shortcuts (?)"
          >
            <span aria-hidden="true">⌨️</span>
            <span className="sr-only">Keyboard Shortcuts</span>
          </button>
        </div>
      </header>

      <main id="main-content" className="console__main" tabIndex={-1}>
        <section
          className="card connection-card"
          aria-labelledby="connection-heading"
        >
          <div className="connection-card__head">
            <h2 className="card__title" id="connection-heading">
              Connection
            </h2>
            <span
              className={`mode-pill mode-pill--${databaseMode}`}
              aria-label={`Current mode: ${databaseMode === "live" ? "Live mode" : "Mock mode"}`}
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
          <div
            className="card alert-card"
            role="alert"
            aria-live="assertive"
            tabIndex={0}
          >
            <strong>Live query failed — serving mock data.</strong>
            <p>{result?.error}</p>
          </div>
        )}

        <section className="card" aria-labelledby="signals-heading">
          <div className="signals__head">
            <h2 className="card__title" id="signals-heading">
              Signals
            </h2>
            <div className="signals__controls">
              <span className="signals__source">
                {databaseMode === "live" && (
                  <span
                    className="live-pulse"
                    aria-hidden="true"
                  />
                )}
                {result?.isMock ? "source: mock dataset" : "source: supabase"}
                {lastUpdated && (
                  <span className="signals__updated">
                    · updated {timeAgo(lastUpdated)}
                  </span>
                )}
              </span>
              <button
                type="button"
                className="refresh-btn"
                onClick={load}
                disabled={isRefreshing}
                aria-label="Refresh signals data (Shortcut: R)"
                title="Refresh data (Shortcut: R)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={isRefreshing ? "spin" : ""}
                  aria-hidden="true"
                >
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                <kbd className="kbd-hint" aria-hidden="true">R</kbd>
              </button>
            </div>
          </div>

          {loading ? (
            <p className="muted" role="status">
              Loading signals data…
            </p>
          ) : (
            <div className="table-wrap" tabIndex={0} aria-label="Signals data table">
              <table>
                <caption>Active telemetry signals and status metrics</caption>
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

      {/* Keyboard Shortcuts Modal Dialog */}
      {showShortcutsModal && (
        <div
          className="modal-backdrop"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="modal-content card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-dialog-title"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="shortcuts-dialog-title" className="card__title">
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                aria-label="Close keyboard shortcuts dialog"
                ref={closeButtonRef}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <dl className="shortcuts-list">
                <div className="shortcut-item">
                  <dt>
                    <kbd>R</kbd>
                  </dt>
                  <dd>Refresh signals data</dd>
                </div>
                <div className="shortcut-item">
                  <dt>
                    <kbd>T</kbd>
                  </dt>
                  <dd>Toggle dark / light theme</dd>
                </div>
                <div className="shortcut-item">
                  <dt>
                    <kbd>?</kbd>
                  </dt>
                  <dd>Open / close keyboard shortcuts help</dd>
                </div>
                <div className="shortcut-item">
                  <dt>
                    <kbd>Esc</kbd>
                  </dt>
                  <dd>Close dialog</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      <footer className="console__footer" role="contentinfo">
        <p>
          To go live: create a Supabase project, copy your Project URL + anon
          key into <code>.env</code>, run the <code>signals</code> migration
          (see <code>src/types/signal.ts</code>), then restart the dev server
          or rebuild/redeploy. Press <kbd>?</kbd> for keyboard shortcuts.
        </p>
      </footer>
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
          aria-label={`Status for ${label}: ${configured ? "set" : "missing"}`}
        >
          {configured ? "set" : "missing"}
        </span>
        <span className="diag-value" aria-label={`Value for ${label}: ${value}`}>
          {value}
        </span>
      </dd>
    </div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const recorded = new Date(signal.recorded_at);
  const formattedTime = recorded.toLocaleString();
  return (
    <tr>
      <th scope="row" className="signal-name">
        {signal.name}
      </th>
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
          aria-label={`Intensity: ${signal.intensity} out of 100`}
        >
          <div
            className="intensity__bar"
            role="progressbar"
            aria-valuenow={signal.intensity}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${signal.name} intensity`}
          >
            <div
              className="intensity__fill"
              style={{ width: `${Math.max(0, Math.min(100, signal.intensity))}%` }}
            />
          </div>
          <span>{signal.intensity}</span>
        </div>
      </td>
      <td className="muted" title={formattedTime}>
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
