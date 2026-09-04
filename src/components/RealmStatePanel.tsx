import { useState } from "react";
import type { RealmState } from "../types/telemetry";

interface RealmStatePanelProps {
  realms: RealmState[];
  activeRealmId: string;
  onSelectRealm: (realmId: string) => void;
  onTriggerSync?: (realmId: string) => void;
}

export function RealmStatePanel({
  realms,
  activeRealmId,
  onSelectRealm,
  onTriggerSync,
}: RealmStatePanelProps) {
  const currentRealm = realms.find((r) => r.id === activeRealmId) ?? realms[0];
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (!currentRealm) return null;

  return (
    <section className="glass-panel realm-section">
      <div className="glass-panel__header">
        <div className="glass-panel__title-wrap">
          <span className="glass-panel__icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </span>
          <div>
            <h2 className="glass-panel__title">Active Realm Topology</h2>
            <p className="glass-panel__subtitle">Multidimensional node health & quantum sync stability</p>
          </div>
        </div>

        <div className="realm-selector-bar">
          {realms.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`realm-tab-btn ${r.id === currentRealm.id ? "realm-tab-btn--active" : ""}`}
              onClick={() => onSelectRealm(r.id)}
            >
              <span className={`realm-status-dot realm-status-dot--${r.status}`} />
              {r.name}
            </button>
          ))}
        </div>
      </div>

      <div className="realm-content-grid">
        {/* Realm Status & Metrics */}
        <div className="glass-card realm-status-card">
          <div className="realm-status-card__head">
            <div>
              <span className="realm-code">{currentRealm.code}</span>
              <h3 className="realm-name">{currentRealm.name}</h3>
            </div>
            <span className={`status-badge-glass status-badge-glass--${currentRealm.status}`}>
              {currentRealm.status}
            </span>
          </div>

          <div className="realm-kpis">
            <div className="realm-kpi">
              <span className="realm-kpi__label">Quantum Sync Rate</span>
              <div className="realm-kpi__val-wrap">
                <span className="realm-kpi__val">{currentRealm.quantumSyncRate.toFixed(1)}%</span>
                <div className="glass-progress-bar">
                  <div
                    className="glass-progress-fill glass-progress-fill--cyan"
                    style={{ width: `${currentRealm.quantumSyncRate}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="realm-kpi">
              <span className="realm-kpi__label">Anomaly Jitter Level</span>
              <div className="realm-kpi__val-wrap">
                <span className={`realm-kpi__val ${currentRealm.anomalyLevel > 10 ? "text-warn" : ""}`}>
                  {currentRealm.anomalyLevel.toFixed(1)}%
                </span>
                <div className="glass-progress-bar">
                  <div
                    className={`glass-progress-fill ${currentRealm.anomalyLevel > 10 ? "glass-progress-fill--warn" : ""}`}
                    style={{ width: `${Math.min(100, currentRealm.anomalyLevel * 3)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="realm-details-list">
            <div className="realm-detail-item">
              <span className="label">Dimensional Phase Alignment:</span>
              <span className="val highlight-text">{currentRealm.dimensionalPhase}</span>
            </div>
            <div className="realm-detail-item">
              <span className="label">Node Mesh Topology:</span>
              <span className="val">
                {currentRealm.activeNodesCount} / {currentRealm.totalNodesCount} Online
              </span>
            </div>
          </div>

          {onTriggerSync && (
            <div className="realm-actions">
              <button
                type="button"
                className="glass-btn glass-btn--primary"
                onClick={() => onTriggerSync(currentRealm.id)}
              >
                Recalibrate Phase & Quantum Sync
              </button>
            </div>
          )}
        </div>

        {/* Realm Mesh Nodes list */}
        <div className="glass-card realm-nodes-card">
          <div className="realm-nodes-card__head">
            <h3 className="realm-nodes-title">Node Network Status</h3>
            <span className="realm-nodes-count">{currentRealm.nodes.length} edge targets</span>
          </div>

          <div className="nodes-list">
            {currentRealm.nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              return (
                <div
                  key={node.id}
                  className={`node-row ${isSelected ? "node-row--selected" : ""}`}
                  onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                >
                  <div className="node-row__left">
                    <span className={`status-beacon status-beacon--${node.status === "online" ? "active" : node.status === "degraded" ? "warning" : "offline"}`} />
                    <div>
                      <span className="node-name">{node.name}</span>
                      <span className="node-region">{node.region}</span>
                    </div>
                  </div>

                  <div className="node-row__right">
                    <div className="node-stat">
                      <span className="node-stat__label">Latency</span>
                      <span className="node-stat__val">{node.latencyMs} ms</span>
                    </div>
                    <div className="node-stat">
                      <span className="node-stat__label">Load</span>
                      <span className="node-stat__val">{node.load}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="directives-box">
            <h4 className="directives-title">Active Realm Directives</h4>
            <div className="directives-tags">
              {currentRealm.activeDirectives.map((directive, idx) => (
                <span key={idx} className="directive-tag">
                  {directive}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
