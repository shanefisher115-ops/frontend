import React from "react";
import type { RealmState } from "../types/telemetry";
import { GlassCard } from "./GlassCard";

interface ActiveRealmStateProps {
  realms: RealmState[];
  activeRealmId: string;
  onSelectRealm: (realmId: string) => void;
}

export const ActiveRealmState: React.FC<ActiveRealmStateProps> = ({
  realms,
  activeRealmId,
  onSelectRealm,
}) => {
  const activeRealm = realms.find((r) => r.id === activeRealmId) ?? realms[0];

  return (
    <GlassCard className="col-12">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>Active Realm State</h2>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Dimensional phase alignment, node topology, and stability metrics
          </p>
        </div>

        {activeRealm && (
          <span className="glass-pill">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: getStatusColor(activeRealm.status),
                boxShadow: `0 0 10px ${getStatusColor(activeRealm.status)}`,
              }}
            />
            Active: {activeRealm.name} ({activeRealm.dimensionalPhase})
          </span>
        )}
      </div>

      <div className="realms-grid">
        {realms.map((realm) => {
          const isSelected = realm.id === activeRealmId;
          const statusColor = getStatusColor(realm.status);

          return (
            <GlassCard
              key={realm.id}
              interactive
              className={`realm-card ${isSelected ? "realm-card--active" : ""}`}
              onClick={() => onSelectRealm(realm.id)}
            >
              <div className="realm-head">
                <span className="realm-code">{realm.code}</span>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    color: statusColor,
                    background: `${statusColor}20`,
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    textTransform: "capitalize",
                  }}
                >
                  {realm.status}
                </span>
              </div>

              <div>
                <h3 className="realm-name">{realm.name}</h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  {realm.description}
                </p>
              </div>

              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", marginBottom: "4px" }}>
                  <span>Stability</span>
                  <strong style={{ fontFamily: "var(--font-mono)" }}>{realm.stabilityPct.toFixed(1)}%</strong>
                </div>
                <div className="realm-progress-bg">
                  <div
                    className="realm-progress-fill"
                    style={{
                      width: `${realm.stabilityPct}%`,
                      background: getStabilityGradient(realm.stabilityPct),
                    }}
                  />
                </div>
              </div>

              <div className="realm-stats-row" style={{ marginTop: "0.25rem" }}>
                <span>
                  Nodes: <strong>{realm.activeNodes}/{realm.totalNodes}</strong>
                </span>
                <span>
                  Entropy: <strong>{realm.entropy.toFixed(2)}</strong>
                </span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </GlassCard>
  );
};

function getStatusColor(status: RealmState["status"]): string {
  switch (status) {
    case "stable":
      return "var(--color-live)";
    case "fluctuating":
      return "var(--color-mock)";
    case "critical":
      return "var(--color-error)";
    case "dormant":
      return "var(--color-text-faint)";
  }
}

function getStabilityGradient(pct: number): string {
  if (pct >= 90) return "linear-gradient(90deg, #10b981, #34d39e)";
  if (pct >= 75) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
  return "linear-gradient(90deg, #ef4444, #f87171)";
}
