import { useState } from "react";
import type { Agent, AgentStatus } from "../types/telemetry";

interface AgentStatusCardsProps {
  agents: Agent[];
  onToggleAgentStatus?: (agentId: string) => void;
}

export function AgentStatusCards({ agents, onToggleAgentStatus }: AgentStatusCardsProps) {
  const [filter, setFilter] = useState<AgentStatus | "all">("all");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const filteredAgents = agents.filter((agent) =>
    filter === "all" ? true : agent.status === filter
  );

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <section className="glass-panel agents-section">
      <div className="glass-panel__header">
        <div className="glass-panel__title-wrap">
          <span className="glass-panel__icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 12L2.5 7.5" />
              <path d="M12 12v10" />
            </svg>
          </span>
          <div>
            <h2 className="glass-panel__title">Autonomous Agents</h2>
            <p className="glass-panel__subtitle">
              {agents.filter((a) => a.status === "active").length} of {agents.length} agents operating nominally
            </p>
          </div>
        </div>

        <div className="agent-filters">
          {(["all", "active", "syncing", "warning", "idle"] as const).map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-btn ${filter === status ? "filter-btn--active" : ""}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="agent-grid">
        {filteredAgents.map((agent) => {
          const isSelected = selectedAgentId === agent.id;

          return (
            <div
              key={agent.id}
              className={`glass-card agent-card agent-card--${agent.status} ${isSelected ? "agent-card--selected" : ""}`}
              onClick={() => setSelectedAgentId(isSelected ? null : agent.id)}
            >
              <div className="agent-card__head">
                <div className="agent-card__info">
                  <span className={`status-beacon status-beacon--${agent.status}`} />
                  <div>
                    <h3 className="agent-card__name">{agent.name}</h3>
                    <span className="agent-card__role">{agent.role}</span>
                  </div>
                </div>

                <span className={`status-badge-glass status-badge-glass--${agent.status}`}>
                  {agent.status}
                </span>
              </div>

              <div className="agent-card__task">
                <span className="agent-card__task-label">Active Task</span>
                <p className="agent-card__task-text" title={agent.currentTask}>
                  {agent.currentTask}
                </p>
              </div>

              <div className="agent-card__metrics">
                <div className="metric-mini">
                  <div className="metric-mini__head">
                    <span>CPU</span>
                    <span className={agent.cpuUsage > 80 ? "text-warn" : ""}>{Math.round(agent.cpuUsage)}%</span>
                  </div>
                  <div className="glass-progress-bar">
                    <div
                      className={`glass-progress-fill ${agent.cpuUsage > 80 ? "glass-progress-fill--warn" : ""}`}
                      style={{ width: `${agent.cpuUsage}%` }}
                    />
                  </div>
                </div>

                <div className="metric-mini">
                  <div className="metric-mini__head">
                    <span>RAM</span>
                    <span className={agent.memoryUsage > 85 ? "text-warn" : ""}>{Math.round(agent.memoryUsage)}%</span>
                  </div>
                  <div className="glass-progress-bar">
                    <div
                      className={`glass-progress-fill ${agent.memoryUsage > 85 ? "glass-progress-fill--warn" : ""}`}
                      style={{ width: `${agent.memoryUsage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="agent-card__foot">
                <span>Latency: <strong>{agent.latencyMs} ms</strong></span>
                <span>Uptime: <strong>{agent.uptime}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedAgent && (
        <div className="glass-modal-inline">
          <div className="glass-modal-inline__head">
            <h4 className="glass-modal-inline__title">
              Agent Inspector: <span className="highlight-text">{selectedAgent.name}</span> ({selectedAgent.id})
            </h4>
            <div className="glass-modal-inline__actions">
              {onToggleAgentStatus && (
                <button
                  type="button"
                  className="glass-btn glass-btn--sm"
                  onClick={() => onToggleAgentStatus(selectedAgent.id)}
                >
                  Simulate Status Shift
                </button>
              )}
              <button
                type="button"
                className="glass-btn glass-btn--ghost glass-btn--sm"
                onClick={() => setSelectedAgentId(null)}
              >
                Close Inspector
              </button>
            </div>
          </div>
          <div className="glass-modal-inline__content">
            <p><strong>Role:</strong> {selectedAgent.role}</p>
            <p><strong>Current Task:</strong> {selectedAgent.currentTask}</p>
            <p><strong>Last Heartbeat:</strong> {new Date(selectedAgent.lastHeartbeat).toLocaleTimeString()}</p>
            <p><strong>Calculated Memory Overhead:</strong> {Math.round(selectedAgent.memoryUsage * 0.16 * 10) / 10} GB allocated</p>
          </div>
        </div>
      )}
    </section>
  );
}
