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
  const [announcement, setAnnouncement] = useState<string>("");
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const load = useCallback((isManual = false) => {
    if (isManual) setIsRefreshing(true);
    fetchSignals().then((r) => {
      setResult(r);
      setLastUpdated(new Date());
      if (isManual) {
        setIsRefreshing(false);
        const source = r.isMock ? "mock dataset" : "Supabase";
        setAnnouncement(`Signals data refreshed from ${source}. ${r.signals.length} signals retrieved.`);
      }
    });
  }, []);

  useEffect(() => {
    load();
    // Live updates: refetch whenever the runtime writes a row (Supabase Realtime).
    const unsubscribe = subscribeToSignals(() => load());
    // Fallback poll in case realtime isn't enabled on the table.
    const interval = setInterval(() => load(), 15000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [load]);

  // Global Keyboard Shortcuts handler
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

      if (e.key === "Escape" && showShortcutsModal) {
        setShowShortcutsModal(false);
        setAnnouncement("Keyboard shortcuts dialog closed.");
      } else if (
        (e.key === "?" || e.key === "k" || e.key === "K") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        setShowShortcutsModal((prev) => {
          const next = !prev;
          setAnnouncement(next ? "Keyboard shortcuts dialog opened." : "Keyboard shortcuts dialog closed.");
          return next;
        });
      } else if (
        (e.key === "t" || e.key === "T") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        const themeBtn = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
        if (themeBtn) {
          themeBtn.click();
          setAnnouncement("Theme toggled.");
        }
      } else if (
        (e.key === "r" || e.key === "R") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        load(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [load, showShortcutsModal]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Screen reader live region */}
      <div className="sr-only" role="status" aria-live="polite">
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
              className="theme-toggle"
              data-theme-toggle
              aria-label="Switch to light mode"
              aria-keyshortcuts="t"
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
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setShowShortcutsModal(true);
                setAnnouncement("Keyboard shortcuts dialog opened.");
              }}
              aria-label="View keyboard shortcuts"
              aria-keyshortcuts="?"
              title="Keyboard shortcuts (?)"
            >
              <kbd className="kbd">?</kbd>
            </button>
          </div>
        </header>

        <main id="main-content" className="console__main" tabIndex={-1}>
          <section className="card connection-card" aria-labelledby="connection-heading">
            <div className="connection-card__head">
              <h2 id="connection-heading" className="card__title">Connection</h2>
              <span
                className={`mode-pill mode-pill--${databaseMode}`}
                aria-label={`Mode: ${databaseMode === "live" ? "Live mode" : "Mock mode"}`}
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

          <section className="card" aria-labelledby="signals-heading">
            <div className="signals__head">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <h2 id="signals-heading" className="card__title">Signals</h2>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => load(true)}
                  aria-label="Refresh signals data"
                  aria-keyshortcuts="r"
                  title="Refresh signals data (Shortcut: R)"
                  disabled={isRefreshing}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                    style={{ animation: isRefreshing ? "spin 1s linear infinite" : undefined }}
                  >
                    <path d="M23 4v6h-6M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Refresh <kbd className="kbd">R</kbd>
                </button>
              </div>
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
              <p className="muted" role="status">Loading signals data…</p>
            ) : (
              <div className="table-wrap">
                <table aria-labelledby="signals-heading">
                  <caption className="sr-only">
                    List of database signals including name, origin, status, intensity level, and recorded timestamp
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
      </div>

      {showShortcutsModal && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setShowShortcutsModal(false);
            setAnnouncement("Keyboard shortcuts dialog closed.");
          }}
          role="presentation"
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__head">
              <h2 id="shortcuts-title" className="modal__title">
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                className="modal__close"
                onClick={() => {
                  setShowShortcutsModal(false);
                  setAnnouncement("Keyboard shortcuts dialog closed.");
                }}
                aria-label="Close keyboard shortcuts dialog"
              >
                ✕
              </button>
            </div>
            <ul className="shortcuts-list">
              <li>
                <span>Toggle light/dark theme</span>
                <kbd className="kbd">T</kbd>
              </li>
              <li>
                <span>Refresh signals data</span>
                <kbd className="kbd">R</kbd>
              </li>
              <li>
                <span>Show keyboard shortcuts</span>
                <kbd className="kbd">?</kbd> or <kbd className="kbd">K</kbd>
              </li>
              <li>
                <span>Close modal dialog</span>
                <kbd className="kbd">Esc</kbd>
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
          aria-label={`Status: ${configured ? "configured" : "missing"}`}
        >
          {configured ? "set" : "missing"}
        </span>
        <span className="diag-value" aria-label={`Value: ${value}`}>
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
          aria-label={`Intensity: ${signal.intensity}%`}
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
