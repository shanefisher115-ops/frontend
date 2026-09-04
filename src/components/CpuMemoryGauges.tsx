import React from "react";
import type { SystemGauges } from "../types/telemetry";
import { GlassCard } from "./GlassCard";

interface CpuMemoryGaugesProps {
  gauges: SystemGauges;
}

export const CpuMemoryGauges: React.FC<CpuMemoryGaugesProps> = ({ gauges }) => {
  const { cpu, memory, network, quantumQueue } = gauges;

  return (
    <GlassCard className="col-12">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>Telemetry Gauges</h2>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Real-time compute, memory allocation, and channel throughput metrics
          </p>
        </div>
        <span className="glass-pill">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-live)", boxShadow: "0 0 8px var(--color-live)" }} />
          Hardware Telemetry Active
        </span>
      </div>

      <div className="gauges-grid">
        {/* CPU Gauge */}
        <GaugeItem
          label="CPU Core Load"
          value={`${cpu.usagePct.toFixed(1)}%`}
          percent={cpu.usagePct}
          color={getHealthColor(cpu.usagePct, 60, 85)}
          subtext={`${cpu.coreCount} Cores · ${cpu.clockGhz} GHz`}
          detail={`${cpu.temperatureC}°C Temp`}
        />

        {/* Memory Gauge */}
        <GaugeItem
          label="Memory Allocation"
          value={`${memory.usagePct.toFixed(1)}%`}
          percent={memory.usagePct}
          color={getHealthColor(memory.usagePct, 70, 90)}
          subtext={`${memory.usedGb} GB / ${memory.totalGb} GB`}
          detail={`Swap: ${memory.swapUsedGb} GB`}
        />

        {/* Network Gauge */}
        <GaugeItem
          label="Network I/O"
          value={`${network.rxMbps.toFixed(0)}`}
          unit="Mbps"
          percent={Math.min(100, (network.rxMbps / 1000) * 100)}
          color="var(--color-info)"
          subtext={`RX: ${network.rxMbps.toFixed(1)} | TX: ${network.txMbps.toFixed(1)}`}
          detail={`${network.activeSockets} Sockets`}
        />

        {/* Quantum Queue Gauge */}
        <GaugeItem
          label="Queue Depth"
          value={`${quantumQueue.depth}`}
          unit="Items"
          percent={quantumQueue.capacityPct}
          color={getHealthColor(quantumQueue.capacityPct, 50, 80)}
          subtext={`Capacity: ${quantumQueue.capacityPct.toFixed(1)}%`}
          detail={`Avg Latency: ${quantumQueue.latencyUs}µs`}
        />
      </div>
    </GlassCard>
  );
};

interface GaugeItemProps {
  label: string;
  value: string;
  unit?: string;
  percent: number;
  color: string;
  subtext: string;
  detail: string;
}

const GaugeItem: React.FC<GaugeItemProps> = ({
  label,
  value,
  unit,
  percent,
  color,
  subtext,
  detail,
}) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="gauge-card">
      <div className="gauge-svg-container">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background Ring */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="var(--color-surface-offset)"
            strokeWidth="10"
          />
          {/* Animated Value Ring */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease",
            }}
          />
        </svg>

        <div className="gauge-center-content">
          <span className="gauge-value" style={{ color }}>
            {value}
          </span>
          {unit && <span className="gauge-unit">{unit}</span>}
        </div>
      </div>

      <div className="gauge-label">{label}</div>
      <div className="gauge-subtext">{subtext}</div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
        {detail}
      </div>
    </div>
  );
};

function getHealthColor(value: number, warnThresh: number, errThresh: number): string {
  if (value >= errThresh) return "var(--color-error)";
  if (value >= warnThresh) return "var(--color-mock)";
  return "var(--color-live)";
}
