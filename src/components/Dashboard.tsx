import { useEffect, useState, useCallback } from "react";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";
import { WhiteboardCanvas } from "./whiteboard/WhiteboardCanvas";
import { fetchSignals, subscribeToSignals, type FetchResult } from "../lib/database";
import { envDiagnostics, databaseMode } from "../lib/supabase";
import type { Signal, SignalStatus } from "../types/signal";

const STATUS_LABEL: Record<SignalStatus, string> = {
  active: "Active",
  degraded: "Degraded",
  offline: "Offline",
};

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<"whiteboard" | "database">("whiteboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [result, setResult] = useState<FetchResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(() => {
    fetchSignals().then((r) => {
      setResult(r);
      setLastUpdated(new Date());
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

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  return (
    <div className={`console ${activeTab === "whiteboard" ? "console--full" : ""}`}>
      <header className="console__header">
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
            <h1 className="console__title">Primordia · Unified Canvas & Console</h1>
            <p className="console__subtitle">
              primordialorigin.com · Infinite CAD, Code, Agent & Telemetry Canvas
            </p>
          </div>
        </div>

        {/* View mode switcher */}
        <div className="console__tabs">
          <button
            type="button"
            className={`console__tab ${activeTab === "whiteboard" ? "console__tab--active" : ""}`}
            onClick={() => setActiveTab("whiteboard")}
          >
            🎨 Infinite Whiteboard
          </button>
          <button
            type="button"
            className={`console__tab ${activeTab === "database" ? "console__tab--active" : ""}`}
            onClick={() => setActiveTab("database")}
          >
            🗄️ Database Console
          </button>
        </div>

        <div className="console__header-right">
          <DatabaseStatusBadge />
          <button
            type="button"
            className="theme-toggle"
            data-theme-toggle
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        </div>
      </header>

      {activeTab === "whiteboard" ? (
        <main>
          <WhiteboardCanvas />
        </main>
      ) : (
        <main className="console__main">
          <section className="card connection-card">
            <div className="connection-card__head">
              <h2 className="card__title">Connection</h2>
              <span className={`mode-pill mode-pill--${databaseMode}`}>
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
            <div className="card alert-card" role="alert">
              <strong>Live query failed — serving mock data.</strong>
              <p>{result?.error}</p>
            </div>
          )}

          <section className="card">
            <div className="signals__head">
              <h2 className="card__title">Signals</h2>
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
              <p className="muted">Loading…</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Origin</th>
                      <th>Status</th>
                      <th className="num">Intensity</th>
                      <th>Recorded</th>
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
      )}

      <footer className="console__footer">
        <p>
          Infinite Zoomable Whiteboard Canvas with 3D CAD viewports, Code Editors,
          Agent Reasoning Graphs, and Real-time Telemetry Widgets.
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
        <span className={`status-chip status-chip--${signal.status}`}>
          {STATUS_LABEL[signal.status]}
        </span>
      </td>
      <td className="num">
        <div className="intensity">
          <div className="intensity__bar">
            <div
              className="intensity__fill"
              style={{ width: `${Math.max(0, Math.min(100, signal.intensity))}%` }}
            />
          </div>
          <span>{signal.intensity}</span>
        </div>
      </td>
      <td className="muted" title={recorded.toLocaleString()}>
        {timeAgo(recorded)}
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
