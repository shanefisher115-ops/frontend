import type { SystemGauges } from "../types/telemetry";

interface SystemGaugesPanelProps {
  gauges: SystemGauges;
}

export function SystemGaugesPanel({ gauges }: SystemGaugesPanelProps) {
  const cpuPct = Math.min(100, Math.max(0, gauges.cpuUsage));
  const memPct = Math.min(100, Math.max(0, gauges.memoryUsage));

  // Circular gauge geometry constants
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const cpuOffset = circumference - (cpuPct / 100) * circumference;
  const memOffset = circumference - (memPct / 100) * circumference;

  return (
    <section className="glass-panel gauges-section">
      <div className="glass-panel__header">
        <div className="glass-panel__title-wrap">
          <span className="glass-panel__icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" strokeWidth="3" />
              <line x1="6" y1="18" x2="6.01" y2="18" strokeWidth="3" />
            </svg>
          </span>
          <div>
            <h2 className="glass-panel__title">Telemetry Gauges</h2>
            <p className="glass-panel__subtitle">Core compute hardware & memory metrics</p>
          </div>
        </div>
      </div>

      <div className="gauges-grid">
        {/* CPU Gauge Glass Card */}
        <div className="glass-card gauge-card">
          <div className="gauge-card__head">
            <h3 className="gauge-card__title">CPU Telemetry</h3>
            <span className="gauge-card__stat-badge">{gauges.cpuTemp}°C Temp</span>
          </div>

          <div className="gauge-visual-wrap">
            <svg className="gauge-svg" viewBox="0 0 100 100">
              <circle
                className="gauge-bg"
                cx="50"
                cy="50"
                r={radius}
              />
              <circle
                className={`gauge-fill ${cpuPct > 80 ? "gauge-fill--danger" : ""}`}
                cx="50"
                cy="50"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={cpuOffset}
              />
            </svg>
            <div className="gauge-center-text">
              <span className="gauge-value">{cpuPct.toFixed(1)}%</span>
              <span className="gauge-label">CPU LOAD</span>
            </div>
          </div>

          <div className="cpu-cores-list">
            <div className="cpu-cores-header">
              <span>Core Breakdown ({gauges.cpuCores.length} Threads)</span>
            </div>
            <div className="cpu-cores-grid">
              {gauges.cpuCores.map((coreUsage, idx) => (
                <div key={idx} className="core-bar-item">
                  <div className="core-bar-track">
                    <div
                      className={`core-bar-fill ${coreUsage > 80 ? "core-bar-fill--warn" : ""}`}
                      style={{ height: `${coreUsage}%` }}
                    />
                  </div>
                  <span className="core-bar-num">C{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Memory Gauge Glass Card */}
        <div className="glass-card gauge-card">
          <div className="gauge-card__head">
            <h3 className="gauge-card__title">Memory Matrix</h3>
            <span className="gauge-card__stat-badge">
              {gauges.memoryUsedGb.toFixed(1)} / {gauges.memoryTotalGb.toFixed(1)} GB
            </span>
          </div>

          <div className="gauge-visual-wrap">
            <svg className="gauge-svg" viewBox="0 0 100 100">
              <circle
                className="gauge-bg"
                cx="50"
                cy="50"
                r={radius}
              />
              <circle
                className={`gauge-fill gauge-fill--cyan ${memPct > 85 ? "gauge-fill--danger" : ""}`}
                cx="50"
                cy="50"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={memOffset}
              />
            </svg>
            <div className="gauge-center-text">
              <span className="gauge-value">{memPct.toFixed(1)}%</span>
              <span className="gauge-label">RAM USED</span>
            </div>
          </div>

          <div className="memory-stats-list">
            <div className="mem-stat-row">
              <span className="mem-stat-label">Swap File Allocation</span>
              <span className="mem-stat-val">{gauges.swapUsedGb.toFixed(2)} GB</span>
            </div>
            <div className="mem-stat-row">
              <span className="mem-stat-label">Network Ingress</span>
              <span className="mem-stat-val">{(gauges.networkInKbps / 1024).toFixed(2)} MB/s</span>
            </div>
            <div className="mem-stat-row">
              <span className="mem-stat-label">Network Egress</span>
              <span className="mem-stat-val">{(gauges.networkOutKbps / 1024).toFixed(2)} MB/s</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
