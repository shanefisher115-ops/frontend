import React, { useState } from "react";
import type { CanvasWidget } from "../../types/whiteboard";

interface WidgetFrameProps {
  widget: CanvasWidget;
  isSelected: boolean;
  activeTool: "select" | "pan" | "connect";
  isConnectingFrom: boolean;
  onSelect: () => void;
  onBringToFront: () => void;
  onTogglePin: () => void;
  onToggleCollapse: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onStartDrag: (e: React.PointerEvent) => void;
  onStartResize: (e: React.PointerEvent) => void;
  onStartConnect: () => void;
  children: React.ReactNode;
}

const TYPE_ICONS: Record<CanvasWidget["type"], string> = {
  "3d-cad": "📐",
  "code-editor": "💻",
  "agent-graph": "🧠",
  telemetry: "📊",
};

export function WidgetFrame({
  widget,
  isSelected,
  activeTool,
  isConnectingFrom,
  onSelect,
  onBringToFront,
  onTogglePin,
  onToggleCollapse,
  onDuplicate,
  onDelete,
  onStartDrag,
  onStartResize,
  onStartConnect,
  children,
}: WidgetFrameProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerDownHeader = (e: React.PointerEvent) => {
    onSelect();
    onBringToFront();
    if (!widget.isPinned && activeTool === "select") {
      onStartDrag(e);
    }
  };

  return (
    <div
      className={`wb-widget-frame ${isSelected ? "wb-widget-frame--selected" : ""} ${
        widget.isPinned ? "wb-widget-frame--pinned" : ""
      } ${widget.isCollapsed ? "wb-widget-frame--collapsed" : ""} ${
        isConnectingFrom ? "wb-widget-frame--connecting" : ""
      }`}
      style={{
        transform: `translate(${widget.x}px, ${widget.y}px)`,
        width: `${widget.width}px`,
        height: widget.isCollapsed ? "auto" : `${widget.height}px`,
        zIndex: widget.zIndex,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Title / Header Bar */}
      <div
        className="wb-widget-header"
        onPointerDown={handlePointerDownHeader}
        title={
          widget.isPinned
            ? "Pinned (Unlock to move)"
            : "Click & Drag to move widget"
        }
      >
        <div className="wb-widget-header__title">
          <span className="wb-widget-header__icon">
            {TYPE_ICONS[widget.type]}
          </span>
          <span className="wb-widget-header__text">{widget.title}</span>
        </div>

        <div className="wb-widget-header__controls" onClick={(e) => e.stopPropagation()}>
          {activeTool === "connect" && (
            <button
              type="button"
              className={`wb-widget-btn ${
                isConnectingFrom ? "wb-widget-btn--active" : ""
              }`}
              onClick={onStartConnect}
              title="Connect wire from this widget"
            >
              🔗 Link
            </button>
          )}

          <button
            type="button"
            className={`wb-widget-btn ${
              widget.isPinned ? "wb-widget-btn--pinned" : ""
            }`}
            onClick={onTogglePin}
            title={widget.isPinned ? "Unpin widget position" : "Pin widget position"}
          >
            {widget.isPinned ? "📌 Pinned" : "📍 Pin"}
          </button>

          <button
            type="button"
            className="wb-widget-btn"
            onClick={onToggleCollapse}
            title={widget.isCollapsed ? "Expand widget" : "Collapse widget"}
          >
            {widget.isCollapsed ? "＋" : "－"}
          </button>

          <button
            type="button"
            className="wb-widget-btn"
            onClick={onDuplicate}
            title="Duplicate widget"
          >
            📋
          </button>

          <button
            type="button"
            className="wb-widget-btn wb-widget-btn--danger"
            onClick={onDelete}
            title="Delete widget"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Widget Body */}
      {!widget.isCollapsed && <div className="wb-widget-body">{children}</div>}

      {/* Resize Handle */}
      {!widget.isCollapsed && !widget.isPinned && (isSelected || isHovered) && (
        <div
          className="wb-widget-resize-handle"
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartResize(e);
          }}
          title="Drag to resize widget"
        />
      )}
    </div>
  );
}
