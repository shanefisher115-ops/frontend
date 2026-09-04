import { useState, useEffect, useCallback } from "react";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";
import { AgentStatusCards } from "./AgentStatusCards";
import { SystemGaugesPanel } from "./SystemGaugesPanel";
import { EventFeedLogs } from "./EventFeedLogs";
import { RealmStatePanel } from "./RealmStatePanel";
import { fetchSignals, subscribeToSignals, type FetchResult } from "../lib/database";
import { databaseMode, envDiagnostics } from "../lib/supabase";
import {
  initialAgents,
  initialSystemGauges,
  initialTelemetryEvents,
  initialRealms,
} from "../lib/telemetryMockData";
import type {
  Agent,
  SystemGauges,
  TelemetryEvent,
  RealmState,
  EventSeverity,
  AgentStatus,
} from "../types/telemetry";

export function Dashboard() {
  // Telemetry state
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [gauges, setGauges] = useState<SystemGauges>(initialSystemGauges);
  const [events, setEvents] = useState<TelemetryEvent[]>(initialTelemetryEvents);
  const [realms, setRealms] = useState<RealmState[]>(initialRealms);
  const [activeRealmId, setActiveRealmId] = useState<string>("realm-01");

  // Stream controls
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  // Supabase Signals integration state
  const [signalsResult, setSignalsResult] = useState<FetchResult | null>(null);

  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Clock tick
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Fetch Supabase signals
  const loadSignals = useCallback(() => {
    fetchSignals().then((r) => {
      setSignalsResult(r);
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

  // Live Telemetry Tick Simulation
  useEffect(() => {
    if (!isStreaming) return;

    const tickInterval = setInterval(() => {
      // 1. Fluctuating system CPU/Memory gauges
      setGauges((prev) => {
        const cpuDelta = (Math.random() - 0.48) * 4;
        const newCpu = Math.min(98, Math.max(10, prev.cpuUsage + cpuDelta));

        const updatedCores = prev.cpuCores.map((c) =>
          Math.min(100, Math.max(10, c + (Math.random() - 0.48) * 8))
        );

        const memDelta = (Math.random() - 0.48) * 0.2;
        const newUsedGb = Math.min(prev.memoryTotalGb, Math.max(8, prev.memoryUsedGb + memDelta));
        const newMemUsage = (newUsedGb / prev.memoryTotalGb) * 100;

        return {
          ...prev,
          cpuUsage: Math.round(newCpu * 10) / 10,
          cpuCores: updatedCores.map((c) => Math.round(c)),
          memoryUsedGb: Math.round(newUsedGb * 10) / 10,
          memoryUsage: Math.round(newMemUsage * 10) / 10,
          networkInKbps: Math.round(1200 + Math.random() * 800),
          networkOutKbps: Math.round(3000 + Math.random() * 1500),
        };
      });

      // 2. Fluctuating Agent status & metrics
      setAgents((prevAgents) =>
        prevAgents.map((agent) => {
          const cpu = Math.min(100, Math.max(5, agent.cpuUsage + (Math.random() - 0.48) * 6));
          const mem = Math.min(100, Math.max(10, agent.memoryUsage + (Math.random() - 0.48) * 4));
          const latency = Math.max(4, Math.round(agent.latencyMs + (Math.random() - 0.5) * 6));

          return {
            ...agent,
            cpuUsage: Math.round(cpu),
            memoryUsage: Math.round(mem),
            latencyMs: latency,
            lastHeartbeat: new Date().toISOString(),
          };
        })
      );

      // 3. Random event emission tick (1 in 3 chance per tick)
      if (Math.random() < 0.35) {
        const randomAgent = agents[Math.floor(Math.random() * agents.length)];
        const sampleMessages: Array<{ severity: EventSeverity; msg: string; details: string }> = [
          {
            severity: "info",
            msg: "Agent Heartbeat pulse synchronized",
            details: `Heartbeat verified for ${randomAgent.name}. Latency: ${randomAgent.latencyMs}ms.`,
          },
          {
            severity: "success",
            msg: "Subspace buffer auto-flushed",
            details: "Memory cache cleared. 256MB released.",
          },
          {
            severity: "warning",
            msg: "Minor packet variance detected",
            details: `Network frame shift observed on ${randomAgent.name} stream.`,
          },
          {
            severity: "info",
            msg: "Quantum phase check passed",
            details: "Coherence coefficient nominal at 0.998.",
          },
        ];

        const chosenEvt = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
        const newEvt: TelemetryEvent = {
          id: `evt-${Date.now()}`,
          timestamp: new Date().toISOString(),
          severity: chosenEvt.severity,
          source: randomAgent.name,
          message: chosenEvt.msg,
          details: chosenEvt.details,
        };

        setEvents((prev) => [newEvt, ...prev.slice(0, 49)]);
      }

      // 4. Realm fluctuation tick
      setRealms((prevRealms) =>
        prevRealms.map((realm) => {
          const syncDelta = (Math.random() - 0.48) * 0.4;
          const anomalyDelta = (Math.random() - 0.48) * 0.3;

          return {
            ...realm,
            quantumSyncRate: Math.min(100, Math.max(70, Math.round((realm.quantumSyncRate + syncDelta) * 10) / 10)),
            anomalyLevel: Math.min(50, Math.max(0.1, Math.round((realm.anomalyLevel + anomalyDelta) * 10) / 10)),
            nodes: realm.nodes.map((node) => ({
              ...node,
              load: Math.min(100, Math.max(10, Math.round(node.load + (Math.random() - 0.5) * 6))),
              latencyMs: Math.max(5, Math.round(node.latencyMs + (Math.random() - 0.5) * 4)),
            })),
          };
        })
      );
    }, 2500);

    return () => clearInterval(tickInterval);
  }, [isStreaming, agents]);

  // Handlers
  const handleToggleAgentStatus = (agentId: string) => {
    const statuses: AgentStatus[] = ["active", "syncing", "warning", "idle"];
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id !== agentId) return agent;
        const currentIdx = statuses.indexOf(agent.status);
        const nextStatus = statuses[(currentIdx + 1) % statuses.length];
        return { ...agent, status: nextStatus };
      })
    );

    const targetAgent = agents.find((a) => a.id === agentId);
    if (targetAgent) {
      handleEmitCustomEvent(
        "info",
        targetAgent.name,
        `Status manually transitioned for agent ${targetAgent.name}`
      );
    }
  };

  const handleEmitCustomEvent = (
    severity: EventSeverity,
    source: string,
    message: string
  ) => {
    const newEvt: TelemetryEvent = {
      id: `evt-user-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity,
      source,
      message,
      details: "Manually submitted signal from Cockpit UI.",
    };
    setEvents((prev) => [newEvt, ...prev]);
  };

  const handleTriggerRealmSync = (realmId: string) => {
    setRealms((prev) =>
      prev.map((realm) => {
        if (realm.id !== realmId) return realm;
        return {
          ...realm,
          status: "synchronized",
          quantumSyncRate: 99.9,
          anomalyLevel: 0.2,
        };
      })
    );

    const realm = realms.find((r) => r.id === realmId);
    handleEmitCustomEvent(
      "success",
      realm?.code ?? "REALM",
      `Phase recalibration complete for ${realm?.name}. Quantum sync at 99.9%.`
    );
  };

  return (
    <div className="cockpit-container">
      {/* Top Header Navigation */}
      <header className="cockpit-header">
        <div className="cockpit-brand">
          <div className="cockpit-logo-glow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <h1 className="cockpit-title">Primordia Telemetry Cockpit</h1>
            <p className="cockpit-subtitle">Glassmorphism Command Center · primordialorigin.com</p>
          </div>
        </div>

        <div className="cockpit-controls">
          <div className="live-clock">{currentTime} UTC</div>
          <DatabaseStatusBadge />
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        </div>
      </header>

      {/* 1. Real-Time Autonomous Agent Status Cards */}
      <AgentStatusCards
        agents={agents}
        onToggleAgentStatus={handleToggleAgentStatus}
      />

      {/* 2. System CPU / Memory Telemetry Gauges */}
      <SystemGaugesPanel gauges={gauges} />

      {/* 3. Event Feed Stream Logs */}
      <EventFeedLogs
        events={events}
        isStreaming={isStreaming}
        onToggleStreaming={() => setIsStreaming((prev) => !prev)}
        onClearLogs={() => setEvents([])}
        onEmitCustomEvent={handleEmitCustomEvent}
      />

      {/* 4. Active Realm State Topology */}
      <RealmStatePanel
        realms={realms}
        activeRealmId={activeRealmId}
        onSelectRealm={setActiveRealmId}
        onTriggerSync={handleTriggerRealmSync}
      />

      {/* 5. Supabase Signals Database Status & Live Stream */}
      <section className="glass-panel supabase-panel">
        <div className="glass-panel__header">
          <div className="glass-panel__title-wrap">
            <span className="glass-panel__icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </span>
            <div>
              <h2 className="glass-panel__title">Supabase Client Database Signals</h2>
              <p className="glass-panel__subtitle">
                {databaseMode === "live" ? "Connected to Supabase realtime" : "Operating on local fallback dataset"}
              </p>
            </div>
          </div>

          <span className={`status-badge-glass status-badge-glass--${databaseMode === "live" ? "synchronized" : "warning"}`}>
            {databaseMode === "live" ? "Live Supabase Mode" : "Mock Fallback Mode"}
          </span>
        </div>

        <div className="diag-grid-glass">
          <div className="diag-row-glass">
            <span><code>VITE_SUPABASE_URL</code></span>
            <span>{envDiagnostics.url.configured ? "Configured" : "Missing / Mock"} ({envDiagnostics.url.masked})</span>
          </div>
          <div className="diag-row-glass">
            <span><code>VITE_SUPABASE_ANON_KEY</code></span>
            <span>{envDiagnostics.key.configured ? "Configured" : "Missing / Mock"} ({envDiagnostics.key.masked})</span>
          </div>
        </div>

        <div className="table-wrap-glass">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Signal Name</th>
                <th>Origin</th>
                <th>Status</th>
                <th>Intensity</th>
                <th>Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {signalsResult?.signals.map((signal) => (
                <tr key={signal.id}>
                  <td><strong>{signal.name}</strong></td>
                  <td className="color-text-muted">{signal.origin}</td>
                  <td>
                    <span className={`status-badge-glass status-badge-glass--${signal.status === "active" ? "synchronized" : signal.status === "degraded" ? "warning" : "offline"}`}>
                      {signal.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div className="glass-progress-bar" style={{ width: "60px" }}>
                        <div className="intensity-fill-glass" style={{ width: `${signal.intensity}%` }} />
                      </div>
                      <span>{signal.intensity}%</span>
                    </div>
                  </td>
                  <td>{new Date(signal.recorded_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
