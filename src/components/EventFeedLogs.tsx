import { useState } from "react";
import type { TelemetryEvent, EventSeverity } from "../types/telemetry";

interface EventFeedLogsProps {
  events: TelemetryEvent[];
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onClearLogs: () => void;
  onEmitCustomEvent?: (severity: EventSeverity, source: string, message: string) => void;
}

export function EventFeedLogs({
  events,
  isStreaming,
  onToggleStreaming,
  onClearLogs,
  onEmitCustomEvent,
}: EventFeedLogsProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<EventSeverity | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Custom log emitter state
  const [customMsg, setCustomMsg] = useState("");
  const [customSeverity, setCustomSeverity] = useState<EventSeverity>("info");
  const [customSource, setCustomSource] = useState("Cockpit Operator");

  const filteredEvents = events.filter((evt) => {
    const matchesSeverity = selectedSeverity === "all" || evt.severity === selectedSeverity;
    const matchesQuery =
      searchQuery.trim() === "" ||
      evt.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.details && evt.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeverity && matchesQuery;
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim() || !onEmitCustomEvent) return;
    onEmitCustomEvent(customSeverity, customSource, customMsg.trim());
    setCustomMsg("");
  };

  return (
    <section className="glass-panel events-section">
      <div className="glass-panel__header">
        <div className="glass-panel__title-wrap">
          <span className="glass-panel__icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 11a9 9 0 0 1 9-9" />
              <path d="M4 4v7h7" />
              <path d="M20 13a9 9 0 0 1-9 9" />
              <path d="M20 20v-7h-7" />
            </svg>
          </span>
          <div>
            <h2 className="glass-panel__title">Telemetry Stream & Event Feed</h2>
            <p className="glass-panel__subtitle">Real-time system diagnostics & audit log</p>
          </div>
        </div>

        <div className="event-feed-controls">
          <button
            type="button"
            className={`glass-btn ${isStreaming ? "glass-btn--active" : ""}`}
            onClick={onToggleStreaming}
          >
            <span className={`stream-indicator ${isStreaming ? "stream-indicator--live" : ""}`} />
            {isStreaming ? "Streaming Live" : "Stream Paused"}
          </button>
          <button type="button" className="glass-btn glass-btn--ghost" onClick={onClearLogs}>
            Clear Stream
          </button>
        </div>
      </div>

      <div className="event-feed-bar">
        <div className="search-box-glass">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search events, sources, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")}>
              ×
            </button>
          )}
        </div>

        <div className="severity-chips">
          {(["all", "info", "success", "warning", "critical"] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              className={`sev-chip sev-chip--${sev} ${selectedSeverity === sev ? "sev-chip--active" : ""}`}
              onClick={() => setSelectedSeverity(sev)}
            >
              {sev.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="events-list">
        {filteredEvents.length === 0 ? (
          <div className="events-empty">
            <p>No telemetry events match your criteria.</p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isExpanded = expandedId === evt.id;
            const timeStr = new Date(evt.timestamp).toLocaleTimeString();

            return (
              <div
                key={evt.id}
                className={`event-row event-row--${evt.severity} ${isExpanded ? "event-row--expanded" : ""}`}
                onClick={() => setExpandedId(isExpanded ? null : evt.id)}
              >
                <div className="event-row__main">
                  <span className={`event-severity-tag event-severity-tag--${evt.severity}`}>
                    {evt.severity}
                  </span>
                  <span className="event-row__source">{evt.source}</span>
                  <span className="event-row__msg">{evt.message}</span>
                  <span className="event-row__time">{timeStr}</span>
                </div>

                {isExpanded && evt.details && (
                  <div className="event-row__details">
                    <code>{evt.details}</code>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {onEmitCustomEvent && (
        <form className="custom-event-form" onSubmit={handleCustomSubmit}>
          <div className="custom-event-form__inputs">
            <select
              value={customSeverity}
              onChange={(e) => setCustomSeverity(e.target.value as EventSeverity)}
              className="glass-input glass-input--select"
            >
              <option value="info">INFO</option>
              <option value="success">SUCCESS</option>
              <option value="warning">WARNING</option>
              <option value="critical">CRITICAL</option>
            </select>
            <input
              type="text"
              placeholder="Source (e.g. Operator, Supabase)"
              value={customSource}
              onChange={(e) => setCustomSource(e.target.value)}
              className="glass-input glass-input--source"
            />
            <input
              type="text"
              placeholder="Type a telemetry signal message..."
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="glass-input glass-input--msg"
            />
          </div>
          <button type="submit" className="glass-btn glass-btn--primary">
            Emit Signal
          </button>
        </form>
      )}
    </section>
  );
}
