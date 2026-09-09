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
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    return attr === "light" ? "light" : "dark";
  });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const shortcutsTriggerRef = useRef<HTMLButtonElement>(null);
  const modalCloseButtonRef = useRef<HTMLButtonElement>(null);

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
  }, []);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const r = await fetchSignals();
      setResult(r);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    load().then(() => {
      announce("Signals refreshed.");
    });
  }, [load, announce]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      announce(`Switched to ${nextTheme} mode.`);
      return nextTheme;
    });
  }, [announce]);

  const toggleShortcutsModal = useCallback(() => {
    setShowShortcuts((prev) => !prev);
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          (activeElement as HTMLElement).isContentEditable);

      if (isInputFocused) return;

      if (event.key === "Escape" && showShortcuts) {
        event.preventDefault();
        setShowShortcuts(false);
        shortcutsTriggerRef.current?.focus();
        return;
      }

      if (event.key === "?" || (event.key.toLowerCase() === "h" && !event.ctrlKey && !event.metaKey)) {
        event.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      if ((event.key.toLowerCase() === "r" && !event.ctrlKey && !event.metaKey) || (event.altKey && event.key.toLowerCase() === "r")) {
        event.preventDefault();
        handleRefresh();
        return;
      }

      if ((event.key.toLowerCase() === "t" && !event.ctrlKey && !event.metaKey) || (event.altKey && event.key.toLowerCase() === "t")) {
        event.preventDefault();
        toggleTheme();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcuts, handleRefresh, toggleTheme]);

  // Manage focus when modal opens/closes
  useEffect(() => {
    if (showShortcuts) {
      modalCloseButtonRef.current?.focus();
    } else if (shortcutsTriggerRef.current && document.activeElement === document.body) {
      shortcutsTriggerRef.current.focus();
    }
  }, [showShortcuts]);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToSignals(load);
    const interval = setInterval(load, 15000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [load]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  return (
    <div className="console">
      {/* Skip Link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Screen reader live region for announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <header className="console__header" role="banner">
        <div className="console__brand">
          <span className="console__logo" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <circle cx="16" cy="16" r="6" fill="currentColor" opacity="0.9" />
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
            className="btn-icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh signals data (Key: R)"
            title="Refresh data (Shortcut: R)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className={isRefreshing ? "spin" : ""}
            >
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
          <button
            type="button"
            className="theme-toggle"
            data-theme-toggle
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Switch to light mode (Key: T)"
                : "Switch to dark mode (Key: T)"
            }
            aria-pressed={theme === "light"}
            title="Toggle theme (Shortcut: T)"
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
              {theme === "dark" ? (
                <>
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </>
              ) : (
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              )}
            </svg>
          </button>
          <button
            type="button"
            ref={shortcutsTriggerRef}
            className="btn-icon"
            onClick={toggleShortcutsModal}
            aria-label="View keyboard shortcuts (Key: ? or H)"
            aria-haspopup="dialog"
            aria-expanded={showShortcuts}
            title="Keyboard shortcuts (Shortcut: ? or H)"
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
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
          </button>
        </div>
      </header>

      <main id="main-content" role="main" tabIndex={-1}>
        <section className="card connection-card" aria-labelledby="connection-heading">
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
            <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>,{" "}
            then restart the dev server (or rebuild/redeploy) — the badge flips
            to 🟢 Supabase Live automatically. No code changes required.
          </p>
          <dl className="diag-grid" aria-label="Environment diagnostic results">
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
            <h2 id="signals-heading" className="card__title">
              Signals
            </h2>
            <span className="signals__source">
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
            <p className="muted" role="status" aria-busy="true">
              Loading signals data…
            </p>
          ) : (
            <div className="table-wrap">
              <table aria-label="Database Signals">
                <caption className="sr-only">
                  List of monitored database signals, showing origin, status, intensity level, and timestamp.
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

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowShortcuts(false);
              shortcutsTriggerRef.current?.focus();
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 id="shortcuts-dialog-title" className="card__title">
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                ref={modalCloseButtonRef}
                className="btn-icon"
                onClick={() => {
                  setShowShortcuts(false);
                  shortcutsTriggerRef.current?.focus();
                }}
                aria-label="Close shortcuts modal"
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
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span>Refresh signals</span>
                <span className="keyboard-hint">
                  <kbd>R</kbd>
                </span>
              </div>
              <div className="shortcut-item">
                <span>Toggle theme</span>
                <span className="keyboard-hint">
                  <kbd>T</kbd>
                </span>
              </div>
              <div className="shortcut-item">
                <span>Keyboard shortcuts help</span>
                <span className="keyboard-hint">
                  <kbd>?</kbd> or <kbd>H</kbd>
                </span>
              </div>
              <div className="shortcut-item">
                <span>Close modal</span>
                <span className="keyboard-hint">
                  <kbd>Esc</kbd>
                </span>
              </div>
            </div>
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
          role="progressbar"
          aria-valuenow={clampedIntensity}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Intensity: ${clampedIntensity} percent`}
        >
          <div className="intensity__bar" aria-hidden="true">
            <div
              className="intensity__fill"
              style={{ width: `${clampedIntensity}%` }}
            />
          </div>
          <span aria-hidden="true">{signal.intensity}</span>
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
