import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  const [result, setResult] = useState<FetchResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const load = useCallback((manual = false) => {
    if (manual) setIsRefreshing(true);
    fetchSignals().then((r) => {
      setResult(r);
      const now = new Date();
      setLastUpdated(now);
      if (manual) {
        setIsRefreshing(false);
      }
    });
  }, []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", nextTheme);

    const toggleBtn = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-label", `Switch to ${currentTheme} mode`);
      toggleBtn.innerHTML =
        nextTheme === "dark"
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }

  }, []);

  const handleRefreshClick = () => {
    load(true);
  };

  const toggleShortcutsModal = useCallback(() => {
    setShowShortcutsModal((prev) => !prev);
  }, []);

  // Global keyboard shortcuts (as advertised in the shortcuts modal):
  // R refresh, T theme, ?/H shortcuts help, Esc closes the dialog.
  // Skipped while typing in form controls.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowShortcutsModal(false);
        return;
      }
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (isTyping) return;

      const key = e.key.toLowerCase();
      if (key === "r") {
        load(true);
      } else if (key === "t") {
        toggleTheme();
      } else if (e.key === "?" || key === "h") {
        toggleShortcutsModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [load, toggleTheme, toggleShortcutsModal]);

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
    <div className={`console ${activeTab === "whiteboard" ? "console--full" : ""}`}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="console__header">
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
            className="btn-icon"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            aria-label="Refresh signals data (Shortcut: R)"
            title="Refresh signals data (Press 'R')"
          >
            <svg
              className={isRefreshing ? "spin" : ""}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6" />
              <path d="M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
            </svg>
          </button>

          <button
            type="button"
            className="theme-toggle"
            data-theme-toggle
            onClick={toggleTheme}
            aria-label="Toggle dark / light theme"
            title="Toggle dark / light theme"
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
            className="btn-icon"
            onClick={toggleShortcutsModal}
            aria-label="Keyboard shortcuts (Shortcut: ? or H)"
            title="Keyboard shortcuts (Press '?')"
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
        </div>
      </header>

      {activeTab === "whiteboard" ? (
        <main id="main-content">
          <WhiteboardCanvas />
        </main>
      ) : (
        <main id="main-content" className="console__main">
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
                <table aria-label="Database Signals">
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

      <footer className="console__footer" role="contentinfo">
        <p>
          Infinite Zoomable Whiteboard Canvas with 3D CAD viewports, Code Editors,
          Agent Reasoning Graphs, and Real-time Telemetry Widgets.
        </p>
      </footer>

      {showShortcutsModal && (
        <div
          className="modal-backdrop"
          onClick={toggleShortcutsModal}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-dialog-title"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="shortcuts-dialog-title" className="modal-title">
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                className="btn-icon"
                onClick={toggleShortcutsModal}
                ref={closeButtonRef}
                aria-label="Close keyboard shortcuts modal"
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
                    <kbd>?</kbd> or <kbd>H</kbd>
                  </dt>
                  <dd>Open / close keyboard shortcuts help</dd>
                </div>
                <div className="shortcut-item">
                  <dt>
                    <kbd>Esc</kbd>
                  </dt>
                  <dd>Close dialog modal</dd>
                </div>
              </dl>
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
        <span className="diag-value" aria-label={`${label} value: ${value}`}>
          {value}
        </span>
      </dd>
    </div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const recorded = useMemo(() => new Date(signal.recorded_at), [signal.recorded_at]);
  const boundedIntensity = Math.max(0, Math.min(100, signal.intensity));

  return (
    <tr>
      <td className="signal-name" scope="row">
        {signal.name}
      </td>
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
            aria-valuenow={boundedIntensity}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Intensity level for ${signal.name}: ${boundedIntensity}%`}
          >
            <div
              className="intensity__fill"
              style={{ width: `${boundedIntensity}%` }}
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
