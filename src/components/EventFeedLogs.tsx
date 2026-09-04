import React, { useState, useRef, useEffect } from "react";
import type { EventLog, LogLevel } from "../types/telemetry";
import { GlassCard } from "./GlassCard";

interface EventFeedLogsProps {
  logs: EventLog[];
  onClearLogs?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

export const EventFeedLogs: React.FC<EventFeedLogsProps> = ({
  logs,
  onClearLogs,
  isPaused = false,
  onTogglePause,
}) => {
  const [levelFilter, setLevelFilter] = useState<LogLevel | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = levelFilter === "ALL" || log.level === levelFilter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleExport = () => {
    const logText = logs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.source}]: ${l.message}`)
      .join("\n");
    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `telemetry-events-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <GlassCard className="col-12">
      <div className="event-feed-header">
        <div>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>Event Feed Logs</h2>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Real-time telemetry event stream, diagnostic logs, and signal traces
          </p>
        </div>

        <div className="event-feed-actions">
          <input
            type="text"
            className="event-search-input"
            placeholder="Search events…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button
            type="button"
            className={`btn-glass ${isPaused ? "btn-glass--active" : ""}`}
            onClick={onTogglePause}
            title={isPaused ? "Resume Live Stream" : "Pause Live Stream"}
          >
            {isPaused ? "▶ Resume" : "⏸ Pause"}
          </button>

          <button
            type="button"
            className={`btn-glass ${autoScroll ? "btn-glass--active" : ""}`}
            onClick={() => setAutoScroll(!autoScroll)}
            title="Toggle Auto Scroll"
          >
            ↓ Auto-scroll
          </button>

          <button type="button" className="btn-glass" onClick={handleExport} title="Export logs as file">
            ⤓ Export
          </button>

          {onClearLogs && (
            <button type="button" className="btn-glass" onClick={onClearLogs} title="Clear terminal logs">
              Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        {(["ALL", "INFO", "WARN", "ERROR", "SUCCESS", "REALM", "SIGNAL"] as const).map((level) => (
          <button
            key={level}
            type="button"
            className={`agent-filter-btn ${levelFilter === level ? "agent-filter-btn--active" : ""}`}
            onClick={() => setLevelFilter(level)}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="log-terminal" ref={terminalRef}>
        {filteredLogs.length === 0 ? (
          <div style={{ color: "#64748b", fontStyle: "italic", padding: "1rem", textAlign: "center" }}>
            No telemetry logs match current filters.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="log-entry">
              <span className="log-time">[{log.timestamp}]</span>
              <span className={`log-level log-level--${log.level}`}>{log.level}</span>
              <span className="log-source">[{log.source}]</span>
              <span className="log-msg">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
};
