import { useEffect, useState, useCallback, useRef } from "react";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
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
  const [statusFilter, setStatusFilter] = useState<"all" | SignalStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      return "light";
    }
    return "dark";
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
  }, []);

  const load = useCallback(() => {
    fetchSignals().then((r) => {
      setResult(r);
      setLastUpdated(new Date());
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      announce(`Switched to ${next} mode.`);
      return next;
    });
  }, [announce]);

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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (e.key === "Escape") {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          e.preventDefault();
        } else if (searchQuery || document.activeElement === searchInputRef.current) {
          setSearchQuery("");
          searchInputRef.current?.blur();
          announce("Search filter cleared.");
          e.preventDefault();
        }
        return;
      }

      if (isInput) return;

      const keyLower = e.key.toLowerCase();

      // R or Alt+R: Refresh signals
      if (keyLower === "r" || (e.altKey && keyLower === "r")) {
        e.preventDefault();
        load();
        announce("Refreshed signals dataset.");
      }
      // T or Alt+T: Toggle theme
      else if (keyLower === "t" || (e.altKey && keyLower === "t")) {
        e.preventDefault();
        toggleTheme();
      }
      // / or S or Alt+S: Focus search filter
      else if (e.key === "/" || keyLower === "s" || (e.altKey && keyLower === "s")) {
        e.preventDefault();
        searchInputRef.current?.focus();
        announce("Focused signal search filter.");
      }
      // ? or H or Alt+H: Toggle keyboard shortcuts help dialog
      else if (e.key === "?" || keyLower === "h" || (e.altKey && keyLower === "h")) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShortcutsOpen, searchQuery, load, toggleTheme, announce]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  const allSignals = result?.signals || [];
  const filteredSignals = allSignals.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesQuery =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.origin.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const handleManualRefresh = () => {
    load();
    announce("Refreshed signal dataset.");
  };

  return (
    <div className="console">
      {/* Live region for screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <header className="console__header" role="banner">
        <div className="console__brand">
          <span className="console__logo" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
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

          <button
            type="button"
            className="btn-icon-text"
            onClick={() => setIsShortcutsOpen(true)}
            aria-label="Keyboard shortcuts guide (Shortcut: ?)"
            title="Keyboard shortcuts guide (?)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
            <span>Shortcuts</span>
            <kbd>?</kbd>
          </button>

          <button
            type="button"
            className="theme-toggle"
            data-theme-toggle
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode (Shortcut: T)`}
            aria-pressed={theme === "dark"}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode (T)`}
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="console__main" id="main-content" tabIndex={-1} role="main">
        <section className="card connection-card" aria-labelledby="connection-heading">
          <div className="connection-card__head">
            <h2 id="connection-heading" className="card__title">
              Connection
            </h2>
            <span
              className={`mode-pill mode-pill--${databaseMode}`}
              aria-label={`Database client mode: ${databaseMode === "live" ? "Live mode" : "Mock mode"}`}
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
          <dl className="diag-grid" aria-label="Supabase Environment Diagnostics">
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
            <div>
              <h2 id="signals-heading" className="card__title">
                Signals
              </h2>
              <span className="signals__source">
                {databaseMode === "live" && (
                  <span className="live-pulse" aria-hidden="true" />
                )}
                <span>
                  {result?.isMock ? "source: mock dataset" : "source: supabase"}
                  {lastUpdated && (
                    <span className="signals__updated">
                      {" "}· updated {timeAgo(lastUpdated)}
                    </span>
                  )}
                </span>
              </span>
            </div>

            <div className="controls-group">
              {/* Search / Filter Input */}
              <div className="search-box">
                <label htmlFor="signal-search" className="sr-only">
                  Filter signals by name or origin
                </label>
                <input
                  id="signal-search"
                  ref={searchInputRef}
                  type="search"
                  className="search-input"
                  placeholder="Filter signals… (/)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Filter signals by name or origin"
                />
              </div>

              {/* Status Filter buttons */}
              <div
                className="status-filter"
                role="group"
                aria-label="Filter signals by operational status"
              >
                {(["all", "active", "degraded", "offline"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`filter-btn ${statusFilter === st ? "filter-btn--active" : ""}`}
                    onClick={() => {
                      setStatusFilter(st);
                      announce(`Filtered signals by ${st} status.`);
                    }}
                    aria-pressed={statusFilter === st}
                    aria-label={`Filter by ${st} status`}
                  >
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>

              {/* Refresh button */}
              <button
                type="button"
                className="btn-icon-text"
                onClick={handleManualRefresh}
                aria-label="Refresh signal dataset (Shortcut: R)"
                title="Refresh signal dataset (R)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M22 12.5a10 10 0 0 1-18.8 4.2L2.5 16" />
                </svg>
                <span>Refresh</span>
                <kbd>R</kbd>
              </button>
            </div>
          </div>

          {loading ? (
            <p className="muted" role="status">
              Loading signals…
            </p>
          ) : filteredSignals.length === 0 ? (
            <p className="muted" role="status" style={{ padding: "var(--space-4) 0" }}>
              No signals match the current search or status filter.
            </p>
          ) : (
            <div className="table-wrap">
              <table aria-labelledby="signals-heading">
                <caption className="sr-only">
                  Table of monitored signals showing name, origin, operational status, intensity level, and recorded timestamp. Displaying {filteredSignals.length} of {allSignals.length} signals.
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
                  {filteredSignals.map((s) => (
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
          or rebuild/redeploy. Press <kbd>?</kbd> for keyboard shortcuts.
        </p>
      </footer>

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
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
          aria-label={`${label} configuration status: ${configured ? "configured" : "missing"}`}
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
      <th scope="row" className="signal-name">
        {signal.name}
      </th>
      <td className="muted">{signal.origin}</td>
      <td>
        <span
          className={`status-chip status-chip--${signal.status}`}
          aria-label={`Operational status: ${STATUS_LABEL[signal.status]}`}
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
          aria-label={`Signal intensity: ${signal.intensity} out of 100`}
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
      <td className="muted">
        <time
          dateTime={recorded.toISOString()}
          title={recorded.toLocaleString()}
          aria-label={`Recorded ${timeAgo(recorded)} (${recorded.toLocaleString()})`}
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
