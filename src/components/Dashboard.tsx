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
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") return attr;
    return typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [announcement, setAnnouncement] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<SignalStatus | "all">("all");
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const shortcutsButtonRef = useRef<HTMLButtonElement>(null);
  const modalCloseButtonRef = useRef<HTMLButtonElement>(null);

  // Sync theme with document element
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
      setLastUpdated(new Date());
      setAnnouncement("Refreshed signals data");
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

  // Focus close button when shortcuts modal opens
  useEffect(() => {
    if (showShortcutsModal) {
      modalCloseButtonRef.current?.focus();
    }
  }, [showShortcutsModal]);

  // Global Keyboard Shortcuts handler
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // Escape closes modal if open, or blurs input
      if (event.key === "Escape") {
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          shortcutsButtonRef.current?.focus();
          setAnnouncement("Closed keyboard shortcuts dialog");
          return;
        }
        if (isInput) {
          (target as HTMLElement).blur();
          return;
        }
      }

      // Do not trigger single-key shortcuts when typing in inputs
      if (isInput) return;

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        load();
      } else if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        toggleTheme();
      } else if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setAnnouncement("Focused signals search field");
      } else if (event.key === "?" || event.key === "h" || event.key === "H") {
        event.preventDefault();
        setShowShortcutsModal((prev) => {
          const next = !prev;
          setAnnouncement(next ? "Opened keyboard shortcuts dialog" : "Closed keyboard shortcuts dialog");
          return next;
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [load, toggleTheme, showShortcutsModal]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  // Filter signals based on search query and status filter
  const filteredSignals = (result?.signals || []).filter((s) => {
    const matchesSearch =
      searchQuery === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.origin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* Accessibility: Skip to Main Content Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Screen Reader Live Region for Announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="aria-announcer"
      >
        {announcement}
      </div>

      <main className="console" id="main-content" tabIndex={-1}>
        <header className="console__header" role="banner">
          <div className="console__brand">
            <span className="console__logo" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <circle cx="16" cy="16" r="6" fill="currentColor" opacity="0.9" />
                <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
                <circle cx="16" cy="16" r="9.5" stroke="currentColor" strokeWidth="1" opacity="0.25" />
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

            <div className="console__actions">
              <button
                type="button"
                className="icon-btn"
                onClick={load}
                aria-label="Refresh signals data (Shortcut: R)"
                title="Refresh signals data (Shortcut: R)"
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

              <button
                type="button"
                className="theme-toggle"
                data-theme-toggle
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode (Shortcut: T)`}
                aria-pressed={theme === "light"}
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
                className="icon-btn"
                ref={shortcutsButtonRef}
                onClick={() => {
                  setShowShortcutsModal(true);
                  setAnnouncement("Opened keyboard shortcuts dialog");
                }}
                aria-label="View keyboard shortcuts (Shortcut: ?)"
                title="View keyboard shortcuts (Shortcut: ?)"
              >
                <span>Shortcuts</span>
                <kbd aria-hidden="true">?</kbd>
              </button>
            </div>
          </div>
        </header>

        <section className="card connection-card" aria-labelledby="connection-heading">
          <div className="connection-card__head">
            <h2 id="connection-heading" className="card__title">
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
          <div className="card alert-card" role="alert" aria-live="assertive" aria-atomic="true">
            <strong>Live query failed — serving mock data.</strong>
            <p>{result?.error}</p>
          </div>
        )}

        <section className="card" aria-labelledby="signals-heading">
          <div className="signals__head">
            <h2 id="signals-heading" className="card__title">
              Signals
            </h2>
            <span className="signals__source" aria-label="Data source information">
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

          <div className="signals__controls">
            <div className="search-box">
              <label htmlFor="signal-search" className="sr-only">
                Search signals by name or origin
              </label>
              <span className="search-box__icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </span>
              <input
                id="signal-search"
                ref={searchInputRef}
                type="search"
                className="search-box__input"
                placeholder="Search signals... (/)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setAnnouncement(`Searching signals for "${e.target.value}"`);
                }}
                aria-label="Search signals by name or origin"
              />
              <span className="search-box__kbd">
                <kbd aria-hidden="true">/</kbd>
              </span>
            </div>

            <div className="filter-group" role="group" aria-label="Filter signals by status">
              <button
                type="button"
                className={`filter-btn ${statusFilter === "all" ? "filter-btn--active" : ""}`}
                onClick={() => {
                  setStatusFilter("all");
                  setAnnouncement("Showing all signals");
                }}
                aria-pressed={statusFilter === "all"}
              >
                All
              </button>
              {(["active", "degraded", "offline"] as SignalStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`filter-btn ${statusFilter === status ? "filter-btn--active" : ""}`}
                  onClick={() => {
                    setStatusFilter(status);
                    setAnnouncement(`Filtered signals by ${STATUS_LABEL[status]}`);
                  }}
                  aria-pressed={statusFilter === status}
                >
                  {STATUS_LABEL[status]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="muted" role="status">Loading signals…</p>
          ) : filteredSignals.length === 0 ? (
            <p className="muted" role="status">No signals match the specified criteria.</p>
          ) : (
            <div className="table-wrap">
              <table aria-label="Signals list">
                <caption className="sr-only">
                  List of database signals showing name, origin, status, intensity, and recorded timestamp.
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
                  {filteredSignals.map((s) => (
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
      </main>

      {/* Accessibility Keyboard Shortcuts Help Modal Dialog */}
      {showShortcutsModal && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setShowShortcutsModal(false);
            shortcutsButtonRef.current?.focus();
            setAnnouncement("Closed keyboard shortcuts dialog");
          }}
        >
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-dialog__head">
              <h2 id="shortcuts-modal-title" className="modal-dialog__title">
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                ref={modalCloseButtonRef}
                className="modal-close-btn"
                onClick={() => {
                  setShowShortcutsModal(false);
                  shortcutsButtonRef.current?.focus();
                  setAnnouncement("Closed keyboard shortcuts dialog");
                }}
                aria-label="Close keyboard shortcuts dialog"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-item__desc">Refresh signals data</span>
                <kbd>R</kbd>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-item__desc">Toggle light / dark theme</span>
                <kbd>T</kbd>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-item__desc">Focus signals search box</span>
                <kbd>/</kbd>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-item__desc">Toggle shortcuts help</span>
                <kbd>?</kbd> or <kbd>H</kbd>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-item__desc">Close modal / unfocus search</span>
                <kbd>Escape</kbd>
              </div>
            </div>
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
          aria-label={`Status for ${label}: ${configured ? "configured" : "missing"}`}
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
  const statusText = STATUS_LABEL[signal.status];

  return (
    <tr>
      <td className="signal-name">{signal.name}</td>
      <td className="muted">{signal.origin}</td>
      <td>
        <span
          className={`status-chip status-chip--${signal.status}`}
          aria-label={`Status: ${statusText}`}
        >
          {statusText}
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
        <time dateTime={recorded.toISOString()} aria-label={`Recorded ${timeAgo(recorded)} on ${recorded.toLocaleString()}`}>
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
