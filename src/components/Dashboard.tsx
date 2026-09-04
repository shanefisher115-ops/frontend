import { useEffect, useState, useCallback, useRef } from "react";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";
import { fetchSignals, subscribeToSignals, type FetchResult } from "../lib/database";
import { envDiagnostics, databaseMode } from "../lib/supabase";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import type { Signal, SignalStatus } from "../types/signal";

const STATUS_LABEL: Record<SignalStatus, string> = {
  active: "Active",
  degraded: "Degraded",
  offline: "Offline",
};

export function Dashboard() {
  const [result, setResult] = useState<FetchResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<"dark" | "light">(() => {
    return document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark";
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const shortcutsTriggerRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    setIsRefetching(true);
    const r = await fetchSignals();
    setResult(r);
    setLastUpdated(new Date());
    setIsRefetching(false);
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

  const toggleTheme = useCallback(() => {
    const nextTheme = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, [themeMode]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if typing in input/textarea/select elements
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (e.key === "Escape") {
        if (filterQuery) {
          setFilterQuery("");
        } else if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
        return;
      }

      if (isInput) return;

      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        load();
      } else if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme, load, filterQuery]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  const filteredSignals = (result?.signals ?? []).filter((s) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.origin.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

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
            ref={shortcutsTriggerRef}
            type="button"
            className="theme-toggle"
            onClick={() => setIsShortcutsOpen(true)}
            aria-label="Open keyboard shortcuts modal (Press ?)"
            title="Keyboard shortcuts (?)"
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
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
            </svg>
          </button>
          <button
            type="button"
            className="theme-toggle"
            data-theme-toggle
            onClick={toggleTheme}
            aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode (Press t)`}
            title={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode (t)`}
          >
            {themeMode === "dark" ? (
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

      <main id="main-content" tabIndex={-1} className="console__main">
        <section className="card connection-card" aria-labelledby="connection-heading">
          <div className="connection-card__head">
            <h2 id="connection-heading" className="card__title">
              Connection
            </h2>
            <span
              className={`mode-pill mode-pill--${databaseMode}`}
              aria-label={`Current database mode: ${databaseMode === "live" ? "Live mode" : "Mock mode"}`}
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
          <dl className="diag-grid">
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
            <div className="signals__title-wrap">
              <h2 id="signals-heading" className="card__title">
                Signals
              </h2>
              <button
                type="button"
                className="btn-refresh"
                onClick={load}
                disabled={isRefetching}
                aria-label="Refresh signal data (Press r)"
                title="Refresh signal data (r)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={isRefetching ? "spin" : ""}
                  aria-hidden="true"
                >
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>

            <div className="signals__controls">
              <div className="search-box">
                <label htmlFor="signal-search" className="sr-only">
                  Filter signals by name, origin, or status
                </label>
                <input
                  ref={searchInputRef}
                  id="signal-search"
                  type="search"
                  className="search-input"
                  placeholder="Filter signals… (/)"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  aria-label="Filter signals by name, origin, or status (Press / to focus)"
                />
                {filterQuery && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => setFilterQuery("")}
                    aria-label="Clear filter search"
                  >
                    ×
                  </button>
                )}
              </div>

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
            <p className="muted" aria-live="polite">
              Loading signals…
            </p>
          ) : filteredSignals.length === 0 ? (
            <p className="muted" aria-live="polite">
              No signals found matching &quot;{filterQuery}&quot;.
            </p>
          ) : (
            <div className="table-wrap">
              <table aria-labelledby="signals-heading">
                <caption className="sr-only">
                  List of monitored signals showing name, origin, status, intensity, and recording time.
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
      </main>

      <footer className="console__footer" role="contentinfo">
        <p>
          To go live: create a Supabase project, copy your Project URL + anon
          key into <code>.env</code>, run the <code>signals</code> migration
          (see <code>src/types/signal.ts</code>), then restart the dev server
          or rebuild/redeploy.
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
        <div className="intensity">
          <div
            className="intensity__bar"
            role="progressbar"
            aria-valuenow={signal.intensity}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Signal intensity ${signal.intensity} out of 100`}
          >
            <div
              className="intensity__fill"
              style={{ width: `${Math.max(0, Math.min(100, signal.intensity))}%` }}
            />
          </div>
          <span>{signal.intensity}</span>
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
