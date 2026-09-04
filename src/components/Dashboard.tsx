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
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
    ) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "dark";
  });

  const load = useCallback(() => {
    fetchSignals().then((r) => {
      setResult(r);
      setLastUpdated(new Date());
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
        setShowShortcuts(false);
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        load();
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [load, toggleTheme]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  return (
    <div className="console">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

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
            className="icon-button"
            onClick={() => setShowShortcuts((prev) => !prev)}
            aria-label="Keyboard shortcuts help (Press ?)"
            title="Keyboard shortcuts (?)"
            aria-expanded={showShortcuts}
            aria-haspopup="dialog"
          >
            <span aria-hidden="true" style={{ fontWeight: "bold", fontSize: "15px" }}>
              ?
            </span>
          </button>
          <button
            type="button"
            className="theme-toggle icon-button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode (Press T)`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode (T)`}
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

      <main id="main-content" tabIndex={-1} style={{ outline: "none", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <section className="card connection-card" aria-labelledby="connection-heading">
          <div className="connection-card__head">
            <h2 className="card__title" id="connection-heading">Connection</h2>
            <span
              className={`mode-pill mode-pill--${databaseMode}`}
              aria-label={`Connection mode: ${databaseMode === "live" ? "Live" : "Mock"}`}
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
            <h2 className="card__title" id="signals-heading">Signals</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <button
                type="button"
                className="btn-action"
                onClick={load}
                aria-label="Refresh signals data (Press R)"
                title="Refresh signals (R)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
                <span>Refresh</span>
                <kbd className="kbd-badge" aria-hidden="true">R</kbd>
              </button>
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
          </div>
          {loading ? (
            <p className="muted" aria-live="polite" aria-busy="true">Loading…</p>
          ) : (
            <div className="table-wrap">
              <table aria-label="Signals data table">
                <caption className="sr-only">
                  Live and mock signal telemetry data listing origin, status, intensity, and recorded timestamp
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

      {showShortcuts && (
        <div
          className="modal-backdrop"
          onClick={() => setShowShortcuts(false)}
          role="presentation"
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="shortcuts-dialog-title" className="modal-title">
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowShortcuts(false)}
                aria-label="Close shortcuts help"
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
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span>Refresh signals data</span>
                <kbd className="shortcut-key">R</kbd>
              </div>
              <div className="shortcut-item">
                <span>Toggle dark/light theme</span>
                <kbd className="shortcut-key">T</kbd>
              </div>
              <div className="shortcut-item">
                <span>Toggle shortcuts help</span>
                <kbd className="shortcut-key">?</kbd>
              </div>
              <div className="shortcut-item">
                <span>Close modal</span>
                <kbd className="shortcut-key">Esc</kbd>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowShortcuts(false)}
              >
                Close
              </button>
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
      <th scope="row" className="signal-name">{signal.name}</th>
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
          <span>{signal.intensity}%</span>
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
