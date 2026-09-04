import { useEffect, useState, useCallback } from "react";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";
import { GlassCard } from "./GlassCard";
import { CpuMemoryGauges } from "./CpuMemoryGauges";
import { AgentStatusCards } from "./AgentStatusCards";
import { EventFeedLogs } from "./EventFeedLogs";
import { ActiveRealmState } from "./ActiveRealmState";
import { fetchSignals, subscribeToSignals, type FetchResult } from "../lib/database";
import { envDiagnostics, databaseMode } from "../lib/supabase";
import {
  initialAgents,
  initialGauges,
  initialLogs,
  initialRealms,
  stepAgentsData,
  stepGaugeData,
  generateRandomLog,
} from "../lib/telemetryData";
import type { Agent, EventLog, RealmState, SystemGauges } from "../types/telemetry";
import type { Signal, SignalStatus } from "../types/signal";

const SIGNAL_STATUS_LABEL: Record<SignalStatus, string> = {
  active: "Active",
  degraded: "Degraded",
  offline: "Offline",
};

export function Dashboard() {
  // Telemetry States
  const [gauges, setGauges] = useState<SystemGauges>(initialGauges);
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [realms] = useState<RealmState[]>(initialRealms);
  const [logs, setLogs] = useState<EventLog[]>(initialLogs);
  const [activeRealmId, setActiveRealmId] = useState<string>("realm-core");
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);

  // Database Signals States
  const [signalsResult, setSignalsResult] = useState<FetchResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Theme State
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark";
  });

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    setTheme(nextTheme);
  };

  const loadSignals = useCallback(() => {
    fetchSignals().then((r) => {
      setSignalsResult(r);
      setLastUpdated(new Date());
    });
  }, []);

  useEffect(() => {
    loadSignals();
    const unsubscribe = subscribeToSignals(loadSignals);
    const interval = setInterval(loadSignals, 15000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [loadSignals]);

  // Real-time telemetry simulation interval
  useEffect(() => {
    if (isStreamPaused) return;

    const streamInterval = setInterval(() => {
      setGauges((prev) => stepGaugeData(prev));
      setAgents((prev) => stepAgentsData(prev));

      // Occasion log entry addition
      if (Math.random() > 0.4) {
        const newLog = generateRandomLog();
        setLogs((prev) => [...prev.slice(-99), newLog]);
      }
    }, 2500);

    return () => clearInterval(streamInterval);
  }, [isStreamPaused]);

  const handlePingAgent = (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          return {
            ...a,
            latencyMs: Math.max(4, a.latencyMs - 5),
            lastHeartbeat: new Date().toISOString(),
          };
        }
        return a;
      })
    );

    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      const pingLog: EventLog = {
        id: `ping-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: "INFO",
        source: agent.name,
        message: `Telemetry endpoint ping acknowledged. Latency: ${agent.latencyMs}ms.`,
        realmId: agent.realmId,
      };
      setLogs((prev) => [...prev, pingLog]);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const showError = signalsResult?.error && signalsResult.isMock && databaseMode === "live";

  return (
    <div className="cockpit-container">
      {/* Top Cockpit Header */}
      <header className="cockpit-header">
        <div className="cockpit-brand">
          <span className="cockpit-logo-icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="6" fill="currentColor" opacity="0.9" />
              <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
              <circle cx="16" cy="16" r="9.5" stroke="currentColor" strokeWidth="1" opacity="0.25" />
            </svg>
          </span>
          <div>
            <h1 className="cockpit-title">Primordia · Telemetry Cockpit</h1>
            <p className="cockpit-subtitle">
              <span>primordialorigin.com</span>
              <span>·</span>
              <span>Real-time Operations & Signal Matrix</span>
            </p>
          </div>
        </div>

        <div className="cockpit-controls">
          <DatabaseStatusBadge />
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Cockpit Layout Grid */}
      <div className="cockpit-grid">
        {/* CPU/Memory Gauges Section */}
        <CpuMemoryGauges gauges={gauges} />

        {/* Active Realm State Section */}
        <ActiveRealmState
          realms={realms}
          activeRealmId={activeRealmId}
          onSelectRealm={setActiveRealmId}
        />

        {/* Agent Status Cards Section */}
        <AgentStatusCards agents={agents} onPingAgent={handlePingAgent} />

        {/* Event Feed Logs Section */}
        <EventFeedLogs
          logs={logs}
          onClearLogs={handleClearLogs}
          isPaused={isStreamPaused}
          onTogglePause={() => setIsStreamPaused(!isStreamPaused)}
        />

        {/* Supabase Connection Diagnostics & Database Signals Table */}
        <GlassCard className="col-12">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>Database Connection & Signals</h2>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                Auto-detected Supabase credentials and realtime signal stream
              </p>
            </div>
            <span className={`mode-pill mode-pill--${databaseMode}`}>
              {databaseMode === "live" ? "Live mode" : "Mock mode"}
            </span>
          </div>

          <dl className="diag-grid" style={{ marginBottom: "1.25rem" }}>
            <DiagRow label="VITE_SUPABASE_URL" configured={envDiagnostics.url.configured} value={envDiagnostics.url.masked} />
            <DiagRow label="VITE_SUPABASE_ANON_KEY" configured={envDiagnostics.key.configured} value={envDiagnostics.key.masked} />
          </dl>

          {showError && (
            <div className="card alert-card" role="alert" style={{ marginBottom: "1rem" }}>
              <strong>Live query failed — serving mock data.</strong>
              <p>{signalsResult?.error}</p>
            </div>
          )}

          <div className="signals__head">
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>Signals Stream</h3>
            <span className="signals__source">
              {databaseMode === "live" && <span className="live-pulse" aria-hidden="true" />}
              {signalsResult?.isMock ? "source: mock dataset" : "source: supabase"}
              {lastUpdated && (
                <span className="signals__updated"> · updated {timeAgo(lastUpdated)}</span>
              )}
            </span>
          </div>

          {!signalsResult ? (
            <p className="muted">Loading signals…</p>
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
                  {signalsResult.signals.map((s) => (
                    <SignalRow key={s.id} signal={s} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      <footer className="console__footer">
        <p>
          Primordia Telemetry Cockpit · Auto-detects Supabase credentials from <code>.env</code>.
          Run the <code>signals</code> migration to enable live database persistence.
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
        <span className={`diag-state ${configured ? "diag-state--ok" : "diag-state--missing"}`}>
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
          {SIGNAL_STATUS_LABEL[signal.status]}
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
