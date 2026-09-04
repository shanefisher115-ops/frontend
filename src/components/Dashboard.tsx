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
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const stored = document.documentElement.getAttribute("data-theme");
      if (stored === "dark" || stored === "light") return stored;
      if (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: light)").matches
      ) {
        return "light";
      }
    }
    return "dark";
  });
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      setAnnouncement(`Switched to ${next} mode`);
      return next;
    });
  }, []);

  const load = useCallback(() => {
    fetchSignals().then((r) => {
      setResult(r);
      const now = new Date();
      setLastUpdated(now);
      setAnnouncement("Signals data refreshed");
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

  useEffect(() => {
    if (isShortcutsOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isShortcutsOpen]);

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
        if (isShortcutsOpen) {
          e.preventDefault();
          setIsShortcutsOpen(false);
        }
      } else if (e.key === "r" || e.key === "R") {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          load();
        }
      } else if (e.key === "t" || e.key === "T") {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          toggleTheme();
        }
      } else if (e.key === "?" || e.key === "h" || e.key === "H") {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setIsShortcutsOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [load, toggleTheme, isShortcutsOpen]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="live-announcer"
      >
        {announcement}
      </div>

      <header className="console__header" role="banner">
        <div className="console__brand">
          <span className="console__logo" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
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
            className="action-btn action-btn--icon-only theme-toggle"
            data-theme-toggle
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-pressed={theme === "light"}
            aria-keyshortcuts="t"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode (shortcut: T)`}
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
            className="action-btn action-btn--icon-only"
            onClick={() => setIsShortcutsOpen(true)}
            aria-label="View keyboard shortcuts"
            aria-keyshortcuts="?"
            title="Keyboard shortcuts (shortcut: ?)"
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
        </div>
      </header>

      <main id="main-content" className="console" tabIndex={-1}>
        <section className="card connection-card" aria-labelledby="connection-heading">
          <div className="connection-card__head">
            <h2 id="connection-heading" className="card__title">
              Connection
            </h2>
            <span
              className={`mode-pill mode-pill--${databaseMode}`}
              aria-label={`Database mode: ${databaseMode}`}
            >
              {databaseMode === "live" ? "Live mode" : "Mock mode"}
            </span>
          </div>
          <p className="connection-card__desc">
            The client auto-detects credentials from{" "}
            <code>frontend/primordialorigin.com/.env</code>. Add{" "}
            <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then
            restart the dev server (or rebuild/redeploy) — the badge flips to 🟢 Supabase
            Live automatically. No code changes required.
          </p>
          <dl className="diag-grid" aria-label="Environment diagnostic details">
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
            <div>
              <h2 id="signals-heading" className="card__title">
                Signals
              </h2>
              <span className="signals__source" aria-live="polite">
                {databaseMode === "live" && (
                  <span className="live-pulse" aria-hidden="true" />
                )}
                {result?.isMock ? "source: mock dataset" : "source: supabase"}
                {lastUpdated && (
                  <span className="signals__updated">
                    {" "}
                    · updated {timeAgo(lastUpdated)}
                  </span>
                )}
              </span>
            </div>
            <button
              type="button"
              className="action-btn"
              onClick={load}
              aria-label="Refresh signals data"
              aria-keyshortcuts="r"
              title="Refresh signals data (shortcut: R)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Refresh</span>
              <kbd aria-hidden="true">R</kbd>
            </button>
          </div>
          {loading ? (
            <p className="muted" role="status" aria-live="polite">
              Loading…
            </p>
          ) : (
            <div className="table-wrap">
              <table aria-labelledby="signals-heading">
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
          To go live: create a Supabase project, copy your Project URL + anon key into{" "}
          <code>.env</code>, run the <code>signals</code> migration (see{" "}
          <code>src/types/signal.ts</code>), then restart the dev server or rebuild/redeploy.
        </p>
      </footer>

      {isShortcutsOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsShortcutsOpen(false);
          }}
          role="presentation"
        >
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-dialog-title"
          >
            <div className="modal-dialog__header">
              <h2 id="shortcuts-dialog-title" className="card__title">
                Keyboard Shortcuts
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                className="modal-dialog__close"
                onClick={() => setIsShortcutsOpen(false)}
                aria-label="Close keyboard shortcuts dialog"
              >
                ✕
              </button>
            </div>
            <ul className="shortcuts-list" aria-label="Available shortcuts">
              <li className="shortcuts-list__item">
                <span>Refresh signals</span>
                <kbd>R</kbd>
              </li>
              <li className="shortcuts-list__item">
                <span>Toggle light / dark theme</span>
                <kbd>T</kbd>
              </li>
              <li className="shortcuts-list__item">
                <span>Open / close keyboard shortcuts</span>
                <kbd>?</kbd>
              </li>
              <li className="shortcuts-list__item">
                <span>Close dialog</span>
                <kbd>Esc</kbd>
              </li>
            </ul>
          </div>
        </div>
      )}
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
        <span className="diag-value" aria-label={`${label} value: ${value}`}>
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
          aria-label={`Signal intensity ${signal.intensity}%`}
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
        <time dateTime={recorded.toISOString()} title={recorded.toLocaleString()}>
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
