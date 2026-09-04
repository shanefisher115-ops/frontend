import React from "react";
import type { PixelStreamingStats as StatsType } from "../../types/pixelstreaming";

interface PixelStreamingStatsProps {
  stats: StatsType | null;
}

export const PixelStreamingStats: React.FC<PixelStreamingStatsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="ps-stats-panel">
        <span className="ps-stats-panel__title">Stream Diagnostics</span>
        <p className="ps-stats-panel__empty">Gathering WebRTC statistics...</p>
      </div>
    );
  }

  return (
    <div className="ps-stats-panel" aria-live="polite">
      <div className="ps-stats-panel__header">
        <span className="ps-stats-panel__title">Stream Diagnostics</span>
        <span className="ps-stats-panel__live-indicator">LIVE</span>
      </div>

      <div className="ps-stats-panel__grid">
        <div className="ps-stats-panel__item">
          <span className="ps-stats-panel__label">Latency</span>
          <span className="ps-stats-panel__value">{stats.latencyMs} ms</span>
        </div>

        <div className="ps-stats-panel__item">
          <span className="ps-stats-panel__label">FPS</span>
          <span className="ps-stats-panel__value">{stats.fps}</span>
        </div>

        <div className="ps-stats-panel__item">
          <span className="ps-stats-panel__label">Resolution</span>
          <span className="ps-stats-panel__value">
            {stats.frameWidth && stats.frameHeight
              ? `${stats.frameWidth}x${stats.frameHeight}`
              : "N/A"}
          </span>
        </div>

        <div className="ps-stats-panel__item">
          <span className="ps-stats-panel__label">Bitrate</span>
          <span className="ps-stats-panel__value">
            {stats.bitrateKbps >= 1000
              ? `${(stats.bitrateKbps / 1000).toFixed(1)} Mbps`
              : `${stats.bitrateKbps} kbps`}
          </span>
        </div>

        <div className="ps-stats-panel__item">
          <span className="ps-stats-panel__label">Packets Lost</span>
          <span className="ps-stats-panel__value">{stats.packetsLost}</span>
        </div>

        {stats.codecs && (
          <div className="ps-stats-panel__item">
            <span className="ps-stats-panel__label">Codec</span>
            <span className="ps-stats-panel__value">{stats.codecs}</span>
          </div>
        )}
      </div>
    </div>
  );
};
