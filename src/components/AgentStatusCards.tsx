import React, { useState } from "react";
import type { Agent, AgentStatus } from "../types/telemetry";
import { GlassCard } from "./GlassCard";

interface AgentStatusCardsProps {
  agents: Agent[];
  onPingAgent?: (agentId: string) => void;
}

export const AgentStatusCards: React.FC<AgentStatusCardsProps> = ({ agents, onPingAgent }) => {
  const [filter, setFilter] = useState<AgentStatus | "all">("all");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const filteredAgents = filter === "all" ? agents : agents.filter((a) => a.status === filter);

  const handlePing = (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    if (onPingAgent) {
      onPingAgent(agentId);
    }
  };

  return (
    <GlassCard className="col-12">
      <div className="agents-header">
        <div>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>Telemetry Agents</h2>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Monitored autonomous operational units across realms
          </p>
        </div>

        <div className="agent-filter-group">
          {(["all", "active", "syncing", "degraded", "standby", "offline"] as const).map((status) => (
            <button
              key={status}
              type="button"
              className={`agent-filter-btn ${filter === status ? "agent-filter-btn--active" : ""}`}
              onClick={() => setFilter(status)}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="agents-grid">
        {filteredAgents.map((agent) => (
          <GlassCard
            key={agent.id}
            interactive
            className="agent-card"
            onClick={() => setSelectedAgent(agent)}
          >
            <div className="agent-card-top">
              <div>
                <h3 className="agent-name">{agent.name}</h3>
                <span className="agent-role">{agent.role}</span>
              </div>
              <span className={`agent-status-badge agent-status--${agent.status}`}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "currentColor",
                  }}
                />
                {agent.status}
              </span>
            </div>

            <p className="agent-task">"{agent.currentTask}"</p>

            <div className="agent-metric-row">
              <div>
                <span style={{ color: "var(--color-text-muted)", display: "block" }}>Latency</span>
                <strong style={{ fontFamily: "var(--font-mono)", color: agent.latencyMs > 100 ? "var(--color-mock)" : "var(--color-live)" }}>
                  {agent.latencyMs} ms
                </strong>
              </div>
              <div>
                <span style={{ color: "var(--color-text-muted)", display: "block" }}>Throughput</span>
                <strong style={{ fontFamily: "var(--font-mono)" }}>
                  {agent.throughputOps.toLocaleString()} ops/s
                </strong>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>Sparkline Load</span>
                <div className="sparkline-bar-container">
                  {agent.sparkline.map((val, idx) => (
                    <div
                      key={idx}
                      className="sparkline-bar"
                      style={{ height: `${Math.max(15, val)}%` }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn-glass"
                style={{ padding: "4px 8px", height: "fit-content" }}
                onClick={(e) => handlePing(e, agent.id)}
                title="Ping agent telemetry endpoint"
              >
                Ping
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(8px)",
            zIndex: 999,
            display: "grid",
            placeItems: "center",
            padding: "1rem",
          }}
          onClick={() => setSelectedAgent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "500px" }}
          >
            <GlassCard style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>{selectedAgent.name}</h3>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>ID: {selectedAgent.id} · {selectedAgent.role}</span>
                </div>
                <button
                  type="button"
                  className="btn-glass"
                  onClick={() => setSelectedAgent(null)}
                  style={{ padding: "4px 10px" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "var(--text-sm)" }}>
                <div>
                  <strong>Status:</strong>{" "}
                  <span className={`agent-status-badge agent-status--${selectedAgent.status}`}>
                    {selectedAgent.status}
                  </span>
                </div>

                <div>
                  <strong>Current Activity:</strong>
                  <p className="agent-task" style={{ WebkitLineClamp: "none", fontStyle: "normal", marginTop: "4px" }}>
                    {selectedAgent.currentTask}
                  </p>
                </div>

                <div className="agent-metric-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                  <div>
                    <span style={{ color: "var(--color-text-muted)", display: "block" }}>Latency</span>
                    <strong>{selectedAgent.latencyMs} ms</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)", display: "block" }}>Health Score</span>
                    <strong style={{ color: selectedAgent.healthScore > 80 ? "var(--color-live)" : "var(--color-mock)" }}>
                      {selectedAgent.healthScore}%
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-muted)", display: "block" }}>Realm</span>
                    <strong>{selectedAgent.realmId}</strong>
                  </div>
                </div>

                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
                  Last Heartbeat: {new Date(selectedAgent.lastHeartbeat).toLocaleString()}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </GlassCard>
  );
};
