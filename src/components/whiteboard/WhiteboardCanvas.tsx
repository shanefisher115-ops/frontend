import React, { useState, useEffect, useRef } from "react";
import { useWhiteboardCanvas } from "../../lib/useWhiteboardCanvas";
import { CanvasToolbar } from "./CanvasToolbar";
import { CanvasMinimap } from "./CanvasMinimap";
import { WidgetFrame } from "./WidgetFrame";
import { CadViewportWidget } from "./widgets/CadViewportWidget";
import { CodeEditorWidget } from "./widgets/CodeEditorWidget";
import { AgentReasoningGraphWidget } from "./widgets/AgentReasoningGraphWidget";
import { TelemetryWidget } from "./widgets/TelemetryWidget";
import type { CanvasWidget, Point } from "../../types/whiteboard";

export function WhiteboardCanvas() {
  const {
    containerRef,
    transform,
    widgets,
    connections,
    selectedWidgetId,
    setSelectedWidgetId,
    activeTool,
    setActiveTool,
    isSnapToGrid,
    setIsSnapToGrid,
    connectingFromId,
    setConnectingFromId,
    panBy,
    zoomAtPoint,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContent,
    bringToFront,
    addWidget,
    updateWidgetData,
    moveWidget,
    resizeWidget,
    togglePinWidget,
    toggleCollapseWidget,
    deleteWidget,
    duplicateWidget,
    addConnection,
    deleteConnection,
    loadPreset,
    exportLayout,
    importLayout,
  } = useWhiteboardCanvas("unified-command");

  const [isPanning, setIsPanning] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [resizingWidgetId, setResizingWidgetId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

  const lastPointerPos = useRef<Point>({ x: 0, y: 0 });

  // Container resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
        setConnectingFromId(null);
      } else if (e.key === "v" && !isTextInputActive()) {
        setActiveTool("select");
      } else if (e.key === "h" && !isTextInputActive()) {
        setActiveTool("pan");
      } else if (e.key === "c" && !isTextInputActive()) {
        setActiveTool("connect");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActiveTool, setConnectingFromId]);

  function isTextInputActive() {
    const el = document.activeElement;
    return (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    );
  }

  // Wheel zoom centered at mouse cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mousePoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      zoomAtPoint(mousePoint, zoomFactor);
    } else {
      // Trackpad pan
      panBy(-e.deltaX, -e.deltaY);
    }
  };

  // Pointer Down Canvas
  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    if (e.target !== containerRef.current && !(e.target as HTMLElement).classList.contains("wb-canvas-bg")) {
      return;
    }

    setSelectedWidgetId(null);
    setConnectingFromId(null);

    // Canvas panning via middle mouse or space / pan tool or primary drag on background
    if (e.button === 1 || e.button === 0 || activeTool === "pan") {
      setIsPanning(true);
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }
  };

  // Pointer Move
  const handlePointerMoveCanvas = (e: React.PointerEvent) => {
    const dx = e.clientX - lastPointerPos.current.x;
    const dy = e.clientY - lastPointerPos.current.y;
    lastPointerPos.current = { x: e.clientX, y: e.clientY };

    if (isPanning) {
      panBy(dx, dy);
    } else if (draggedWidgetId) {
      moveWidget(draggedWidgetId, dx / transform.zoom, dy / transform.zoom);
    } else if (resizingWidgetId) {
      const target = widgets.find((w) => w.id === resizingWidgetId);
      if (target) {
        resizeWidget(
          resizingWidgetId,
          target.width + dx / transform.zoom,
          target.height + dy / transform.zoom
        );
      }
    }
  };

  // Pointer Up
  const handlePointerUpCanvas = () => {
    setIsPanning(false);
    setDraggedWidgetId(null);
    setResizingWidgetId(null);
  };

  // Jump canvas position to widget center
  const handleJumpToWidget = (widget: CanvasWidget) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const viewportW = rect ? rect.width : 1000;
    const viewportH = rect ? rect.height : 700;

    const targetCenterX = widget.x + widget.width / 2;
    const targetCenterY = widget.y + widget.height / 2;

    const newX = viewportW / 2 - targetCenterX * transform.zoom;
    const newY = viewportH / 2 - targetCenterY * transform.zoom;

    useWhiteboardCanvas.prototype; // touch reference
    setSelectedWidgetId(widget.id);
    setIsSearchOpen(false);
    panBy(newX - transform.x, newY - transform.y);
  };

  // Connection Linking
  const handleWidgetStartConnect = (widgetId: string) => {
    if (!connectingFromId) {
      setConnectingFromId(widgetId);
    } else {
      addConnection(connectingFromId, widgetId);
      setConnectingFromId(null);
    }
  };

  // Render Widget Content Switcher
  const renderWidgetContent = (widget: CanvasWidget) => {
    switch (widget.type) {
      case "3d-cad":
        return (
          <CadViewportWidget
            data={widget.data as any}
            onChange={(updates) => updateWidgetData(widget.id, updates)}
          />
        );
      case "code-editor":
        return (
          <CodeEditorWidget
            data={widget.data as any}
            onChange={(updates) => updateWidgetData(widget.id, updates)}
          />
        );
      case "agent-graph":
        return (
          <AgentReasoningGraphWidget
            data={widget.data as any}
            onChange={(updates) => updateWidgetData(widget.id, updates)}
          />
        );
      case "telemetry":
      default:
        return (
          <TelemetryWidget
            data={widget.data as any}
            onChange={(updates) => updateWidgetData(widget.id, updates)}
          />
        );
    }
  };

  const filteredWidgets = widgets.filter((w) =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="wb-container">
      {/* Top Floating Control Bar */}
      <CanvasToolbar
        zoom={transform.zoom}
        activeTool={activeTool}
        isSnapToGrid={isSnapToGrid}
        widgetCount={widgets.length}
        onSelectTool={setActiveTool}
        onToggleSnap={() => setIsSnapToGrid(!isSnapToGrid)}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onFitToContent={fitToContent}
        onAddWidget={(type) => addWidget(type)}
        onLoadPreset={loadPreset}
        onExport={() => {
          const json = exportLayout();
          navigator.clipboard.writeText(json);
          alert("Canvas layout JSON copied to clipboard!");
        }}
        onImportClick={() => setImportModalOpen(true)}
        onSearchOpen={() => setIsSearchOpen(true)}
      />

      {/* Main Zoomable & Pannable Viewport Canvas */}
      <div
        className={`wb-canvas-viewport ${isPanning || activeTool === "pan" ? "wb-canvas-viewport--panning" : ""}`}
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDownCanvas}
        onPointerMove={handlePointerMoveCanvas}
        onPointerUp={handlePointerUpCanvas}
      >
        {/* Infinite Grid Background */}
        <div
          className="wb-canvas-bg"
          style={{
            backgroundPosition: `${transform.x}px ${transform.y}px`,
            backgroundSize: `${20 * transform.zoom}px ${20 * transform.zoom}px, ${
              100 * transform.zoom
            }px ${100 * transform.zoom}px`,
          }}
        />

        {/* Scaled & Translated World Transform Group */}
        <div
          className="wb-canvas-world"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* SVG Connection Wires Overlay */}
          <svg className="wb-connections-svg">
            {connections.map((conn) => {
              const from = widgets.find((w) => w.id === conn.fromWidgetId);
              const to = widgets.find((w) => w.id === conn.toWidgetId);
              if (!from || !to) return null;

              const x1 = from.x + from.width / 2;
              const y1 = from.y + from.height / 2;
              const x2 = to.x + to.width / 2;
              const y2 = to.y + to.height / 2;

              const dx = x2 - x1;
              const cx1 = x1 + dx * 0.5;
              const cy1 = y1;
              const cx2 = x2 - dx * 0.5;
              const cy2 = y2;

              const pathStr = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

              return (
                <g key={conn.id} className="wb-connection-group">
                  <path
                    d={pathStr}
                    fill="none"
                    stroke={conn.color || "#34d39e"}
                    strokeWidth="3"
                    strokeDasharray="6 3"
                    className="wb-connection-path"
                  />
                  <circle cx={x1} cy={y1} r="5" fill={conn.color || "#34d39e"} />
                  <circle cx={x2} cy={y2} r="5" fill={conn.color || "#34d39e"} />
                  {conn.label && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 8}
                      fill="#e3e6f5"
                      fontSize="12"
                      textAnchor="middle"
                      className="wb-connection-label"
                    >
                      {conn.label}
                    </text>
                  )}
                  {/* Delete connection X */}
                  <g
                    transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}
                    className="wb-connection-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConnection(conn.id);
                    }}
                  >
                    <circle r="10" fill="#141726" stroke="#f43f5e" strokeWidth="1.5" />
                    <text x="0" y="4" fill="#f43f5e" fontSize="11" textAnchor="middle">
                      ✕
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Render All Widgets on Canvas */}
          {widgets.map((widget) => (
            <WidgetFrame
              key={widget.id}
              widget={widget}
              isSelected={widget.id === selectedWidgetId}
              activeTool={activeTool}
              isConnectingFrom={widget.id === connectingFromId}
              onSelect={() => setSelectedWidgetId(widget.id)}
              onBringToFront={() => bringToFront(widget.id)}
              onTogglePin={() => togglePinWidget(widget.id)}
              onToggleCollapse={() => toggleCollapseWidget(widget.id)}
              onDuplicate={() => duplicateWidget(widget.id)}
              onDelete={() => deleteWidget(widget.id)}
              onStartDrag={() => setDraggedWidgetId(widget.id)}
              onStartResize={() => setResizingWidgetId(widget.id)}
              onStartConnect={() => handleWidgetStartConnect(widget.id)}
            >
              {renderWidgetContent(widget)}
            </WidgetFrame>
          ))}
        </div>

        {/* Bottom Right Interactive Minimap Overlay */}
        <CanvasMinimap
          widgets={widgets}
          transform={transform}
          containerSize={containerSize}
          onPanTo={(cx, cy) => {
            const rect = containerRef.current?.getBoundingClientRect();
            const w = rect ? rect.width : 1000;
            const h = rect ? rect.height : 700;

            const newX = w / 2 - (cx + 200) * transform.zoom;
            const newY = h / 2 - (cy + 200) * transform.zoom;
            panBy(newX - transform.x, newY - transform.y);
          }}
        />

        {/* Floating Quick Action Footer Coordinates */}
        <div className="wb-footer-stats">
          <span>X: {Math.round(-transform.x / transform.zoom)}</span>
          <span>Y: {Math.round(-transform.y / transform.zoom)}</span>
          <span>Zoom: {(transform.zoom * 100).toFixed(0)}%</span>
          <span>Widgets: {widgets.length}</span>
        </div>
      </div>

      {/* Quick Jump Search Modal */}
      {isSearchOpen && (
        <div className="wb-modal-overlay" onClick={() => setIsSearchOpen(false)}>
          <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wb-modal__header">
              <h3>Search & Jump to Canvas Widget</h3>
              <button type="button" className="wb-btn-close" onClick={() => setIsSearchOpen(false)}>
                ✕
              </button>
            </div>
            <input
              type="text"
              className="wb-modal-input"
              placeholder="Search by title... (e.g. Flight, CAD, Agent)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="wb-modal-list">
              {filteredWidgets.map((w) => (
                <div
                  key={w.id}
                  className="wb-modal-item"
                  onClick={() => handleJumpToWidget(w)}
                >
                  <span className="wb-modal-item__title">{w.title}</span>
                  <span className="wb-modal-item__pos">
                    ({w.type.toUpperCase()}) X:{w.x}, Y:{w.y}
                  </span>
                </div>
              ))}
              {filteredWidgets.length === 0 && (
                <div className="wb-modal-empty">No matching widgets found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import JSON Modal */}
      {importModalOpen && (
        <div className="wb-modal-overlay" onClick={() => setImportModalOpen(false)}>
          <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wb-modal__header">
              <h3>Import Canvas Layout JSON</h3>
              <button
                type="button"
                className="wb-btn-close"
                onClick={() => setImportModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <textarea
              className="wb-modal-textarea"
              placeholder="Paste canvas layout JSON here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={8}
            />
            <div className="wb-modal__actions">
              <button
                type="button"
                className="wb-btn wb-btn--secondary"
                onClick={() => setImportModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="wb-btn wb-btn--primary"
                onClick={() => {
                  const success = importLayout(importText);
                  if (success) {
                    setImportModalOpen(false);
                    setImportText("");
                  } else {
                    alert("Invalid JSON layout format.");
                  }
                }}
              >
                Import Layout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
