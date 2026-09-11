import { useState, useEffect } from "react";
import type { TelemetryWidgetData } from "../../../types/whiteboard";

interface TelemetryWidgetProps {
  data: TelemetryWidgetData;
  onChange: (updates: Partial<TelemetryWidgetData>) => void;
}

export function TelemetryWidget({ data, onChange }: TelemetryWidgetProps) {
  const [activeMetric, setActiveMetric] = useState<"cpuUsage" | "latencyMs" | "signalRate">(
    "cpuUsage"
  );

  // Live streaming simulation tick
  useEffect(() => {
    if (!data.isLive) return;

    const interval = setInterval(() => {
      const latestMetrics = [...data.metrics];
      if (latestMetrics.length > 20) {
        latestMetrics.shift();
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const lastMetric = latestMetrics[latestMetrics.length - 1] || {
        cpuUsage: 45,
        memoryMB: 1100,
        latencyMs: 20,
        signalRate: 120,
        activeConnections: 40,
      };

      const newPoint = {
        timestamp: timeStr,
        cpuUsage: Math.max(10, Math.min(98, lastMetric.cpuUsage + Math.floor(Math.random() * 11 - 5))),
        memoryMB: Math.max(800, Math.min(2048, lastMetric.memoryMB + Math.floor(Math.random() * 30 - 15))),
        latencyMs: Math.max(8, Math.min(180, lastMetric.latencyMs + Math.floor(Math.random() * 9 - 4))),
        signalRate: Math.max(50, Math.min(300, lastMetric.signalRate + Math.floor(Math.random() * 15 - 7))),
        activeConnections: Math.max(10, Math.min(100, lastMetric.activeConnections + Math.floor(Math.random() * 5 - 2))),
      };

      onChange({ metrics: [...latestMetrics, newPoint] });
    }, 2000);

    return () => clearInterval(interval);
  }, [data.isLive, data.metrics, onChange]);

  const latest = data.metrics[data.metrics.length - 1] || {
    cpuUsage: 0,
    memoryMB: 0,
    latencyMs: 0,
    signalRate: 0,
    activeConnections: 0,
  };

  const isCpuAlert = latest.cpuUsage > data.alertThresholds.cpuMax;
  const isLatencyAlert = latest.latencyMs > data.alertThresholds.latencyMaxMs;

  return (
    <div className="telemetry-widget">
      {/* Top Header Controls */}
      <div className="telemetry-widget__header">
        <div className="telemetry-widget__target">
          <input
            type="text"
            className="telemetry-input-target"
            value={data.targetSystem}
            onChange={(e) => onChange({ targetSystem: e.target.value })}
          />
          <span className={`telemetry-pill ${data.isLive ? "telemetry-pill--live" : ""}`}>
            {data.isLive ? "● LIVE STREAM" : "⏸ PAUSED"}
          </span>
        </div>

        <div className="telemetry-widget__actions">
          <button
            type="button"
            className={`telemetry-btn ${data.isLive ? "telemetry-btn--active" : ""}`}
            onClick={() => onChange({ isLive: !data.isLive })}
          >
            {data.isLive ? "Pause" : "Resume"}
          </button>
          <select
            className="telemetry-select"
            value={data.timeWindow}
            onChange={(e) =>
              onChange({
                timeWindow: e.target.value as TelemetryWidgetData["timeWindow"],
              })
            }
          >
            <option value="1m">1 min window</option>
            <option value="5m">5 min window</option>
            <option value="15m">15 min window</option>
          </select>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="telemetry-grid">
        <div
          className={`telemetry-card ${activeMetric === "cpuUsage" ? "telemetry-card--selected" : ""} ${
            isCpuAlert ? "telemetry-card--alert" : ""
          }`}
          onClick={() => setActiveMetric("cpuUsage")}
        >
          <div className="telemetry-card__title">CPU Utilization</div>
          <div className="telemetry-card__val">{latest.cpuUsage}%</div>
          {isCpuAlert && <span className="telemetry-alert-badge">HIGH LOAD</span>}
        </div>

        <div
          className={`telemetry-card ${activeMetric === "latencyMs" ? "telemetry-card--selected" : ""} ${
            isLatencyAlert ? "telemetry-card--alert" : ""
          }`}
          onClick={() => setActiveMetric("latencyMs")}
        >
          <div className="telemetry-card__title">Latency</div>
          <div className="telemetry-card__val">{latest.latencyMs}ms</div>
          {isLatencyAlert && <span className="telemetry-alert-badge">HIGH LATENCY</span>}
        </div>

        <div
          className={`telemetry-card ${activeMetric === "signalRate" ? "telemetry-card--selected" : ""}`}
          onClick={() => setActiveMetric("signalRate")}
        >
          <div className="telemetry-card__title">Signal Rate</div>
          <div className="telemetry-card__val">{latest.signalRate}/s</div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-card__title">Memory / Conns</div>
          <div className="telemetry-card__val">
            {(latest.memoryMB / 1024).toFixed(1)} GB / {latest.activeConnections}
          </div>
        </div>
      </div>

      {/* SVG Chart Plotter */}
      <div className="telemetry-chart-container">
        <div className="telemetry-chart-label">
          Real-time trend: <strong>{activeMetric.toUpperCase()}</strong>
        </div>
        <TelemetrySvgChart metrics={data.metrics} metricKey={activeMetric} />
      </div>
    </div>
  );
}

function TelemetrySvgChart({
  metrics,
  metricKey,
}: {
  metrics: TelemetryWidgetData["metrics"];
  metricKey: "cpuUsage" | "latencyMs" | "signalRate";
}) {
  if (metrics.length === 0) return null;

  const values = metrics.map((m) => m[metricKey]);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 100);
  const range = maxVal - minVal || 1;

  const width = 480;
  const height = 120;

  const points = metrics.map((m, i) => {
    const x = (i / Math.max(1, metrics.length - 1)) * width;
    const y = height - ((m[metricKey] - minVal) / range) * (height - 20) - 10;
    return `${x},${y}`;
  });

  const polylineStr = points.join(" ");
  const areaPoints = `0,${height} ${polylineStr} ${width},${height}`;

  return (
    <svg className="telemetry-svg" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="telemetryGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d39e" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#34d39e" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      <line x1="0" y1="20" x2={width} y2="20" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
      <line x1="0" y1="60" x2={width} y2="60" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
      <line x1="0" y1="100" x2={width} y2="100" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />

      {/* Fill Area */}
      <polygon points={areaPoints} fill="url(#telemetryGradient)" />

      {/* Trend line */}
      <polyline
        fill="none"
        stroke="#34d39e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylineStr}
      />

      {/* Data dots */}
      {metrics.map((m, i) => {
        const x = (i / Math.max(1, metrics.length - 1)) * width;
        const y = height - ((m[metricKey] - minVal) / range) * (height - 20) - 10;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="#34d39e"
            stroke="#141726"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}
