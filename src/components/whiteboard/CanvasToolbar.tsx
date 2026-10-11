import { useState } from "react";
import type { WidgetType } from "../../types/whiteboard";
import { DEFAULT_PRESETS } from "../../lib/whiteboardPresets";

interface CanvasToolbarProps {
  zoom: number;
  activeTool: "select" | "pan" | "connect";
  isSnapToGrid: boolean;
  widgetCount: number;
  onSelectTool: (tool: "select" | "pan" | "connect") => void;
  onToggleSnap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToContent: () => void;
  onAddWidget: (type: WidgetType) => void;
  onLoadPreset: (presetId: string) => void;
  onExport: () => void;
  onImportClick: () => void;
  onSearchOpen: () => void;
}

export function CanvasToolbar({
  zoom,
  activeTool,
  isSnapToGrid,
  widgetCount,
  onSelectTool,
  onToggleSnap,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToContent,
  onAddWidget,
  onLoadPreset,
  onExport,
  onImportClick,
  onSearchOpen,
}: CanvasToolbarProps) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);

  return (
    <header className="wb-toolbar">
      {/* Brand & Preset Selector */}
      <div className="wb-toolbar__section">
        <div className="wb-toolbar__brand">
          <span className="wb-toolbar__logo" aria-hidden="true">
            🌐
          </span>
          <span className="wb-toolbar__title">Infinite Workspace</span>
        </div>

        <div className="wb-dropdown">
          <button
            type="button"
            className="wb-btn wb-btn--secondary wb-btn--sm"
            onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
            title="Choose workspace template"
          >
            <span>Templates</span>
            <span className="wb-chevron">▾</span>
          </button>
          {isPresetMenuOpen && (
            <div className="wb-dropdown__menu">
              <div className="wb-dropdown__header">Workspace Presets</div>
              {DEFAULT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="wb-dropdown__item"
                  onClick={() => {
                    onLoadPreset(preset.id);
                    setIsPresetMenuOpen(false);
                  }}
                >
                  <div className="wb-dropdown__item-title">{preset.name}</div>
                  <div className="wb-dropdown__item-desc">{preset.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tools & Add Widget */}
      <div className="wb-toolbar__section wb-toolbar__tools">
        <div className="wb-segmented">
          <button
            type="button"
            className={`wb-segmented__btn ${
              activeTool === "select" ? "wb-segmented__btn--active" : ""
            }`}
            onClick={() => onSelectTool("select")}
            title="Select & Drag Widgets (V)"
          >
            ↖ Select
          </button>
          <button
            type="button"
            className={`wb-segmented__btn ${
              activeTool === "pan" ? "wb-segmented__btn--active" : ""
            }`}
            onClick={() => onSelectTool("pan")}
            title="Hand Pan Canvas (H)"
          >
            ✋ Pan
          </button>
          <button
            type="button"
            className={`wb-segmented__btn ${
              activeTool === "connect" ? "wb-segmented__btn--active" : ""
            }`}
            onClick={() => onSelectTool("connect")}
            title="Connect Widgets with Link Wires (C)"
          >
            🔗 Link
          </button>
        </div>

        <div className="wb-dropdown">
          <button
            type="button"
            className="wb-btn wb-btn--primary wb-btn--sm"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          >
            <span>+ Add Widget</span>
            <span className="wb-chevron">▾</span>
          </button>
          {isAddMenuOpen && (
            <div className="wb-dropdown__menu">
              <div className="wb-dropdown__header">Select Widget Type</div>
              <button
                type="button"
                className="wb-dropdown__item"
                onClick={() => {
                  onAddWidget("3d-cad");
                  setIsAddMenuOpen(false);
                }}
              >
                <span className="wb-icon">📐</span>
                <div>
                  <div className="wb-dropdown__item-title">3D CAD Viewport</div>
                  <div className="wb-dropdown__item-desc">
                    Interactive rotatable 3D assembly & specs
                  </div>
                </div>
              </button>
              <button
                type="button"
                className="wb-dropdown__item"
                onClick={() => {
                  onAddWidget("code-editor");
                  setIsAddMenuOpen(false);
                }}
              >
                <span className="wb-icon">💻</span>
                <div>
                  <div className="wb-dropdown__item-title">Code Editor</div>
                  <div className="wb-dropdown__item-desc">
                    Multi-language sandbox & console output
                  </div>
                </div>
              </button>
              <button
                type="button"
                className="wb-dropdown__item"
                onClick={() => {
                  onAddWidget("agent-graph");
                  setIsAddMenuOpen(false);
                }}
              >
                <span className="wb-icon">🧠</span>
                <div>
                  <div className="wb-dropdown__item-title">Agent Reasoning Graph</div>
                  <div className="wb-dropdown__item-desc">
                    Visual DAG of AI agent decision steps
                  </div>
                </div>
              </button>
              <button
                type="button"
                className="wb-dropdown__item"
                onClick={() => {
                  onAddWidget("telemetry");
                  setIsAddMenuOpen(false);
                }}
              >
                <span className="wb-icon">📊</span>
                <div>
                  <div className="wb-dropdown__item-title">Telemetry Widget</div>
                  <div className="wb-dropdown__item-desc">
                    Real-time metric plots & throughput gauges
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation & Controls */}
      <div className="wb-toolbar__section">
        <button
          type="button"
          className="wb-btn wb-btn--icon"
          onClick={onSearchOpen}
          title="Search Widgets (Ctrl+K)"
        >
          🔍
        </button>

        <button
          type="button"
          className={`wb-btn wb-btn--icon ${
            isSnapToGrid ? "wb-btn--active" : ""
          }`}
          onClick={onToggleSnap}
          title={isSnapToGrid ? "Grid Snapping Enabled (20px)" : "Grid Snapping Disabled"}
        >
          🧲
        </button>

        <div className="wb-zoom-controls">
          <button
            type="button"
            className="wb-btn wb-btn--icon"
            onClick={onZoomOut}
            title="Zoom Out (-)"
          >
            -
          </button>
          <button
            type="button"
            className="wb-btn wb-btn--text"
            onClick={onResetZoom}
            title="Reset Zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="wb-btn wb-btn--icon"
            onClick={onZoomIn}
            title="Zoom In (+)"
          >
            +
          </button>
          <button
            type="button"
            className="wb-btn wb-btn--sm wb-btn--secondary"
            onClick={onFitToContent}
            title="Fit All Widgets into View"
            disabled={widgetCount === 0}
          >
            Fit View
          </button>
        </div>

        <div className="wb-actions">
          <button
            type="button"
            className="wb-btn wb-btn--icon"
            onClick={onExport}
            title="Export Canvas JSON"
          >
            💾
          </button>
          <button
            type="button"
            className="wb-btn wb-btn--icon"
            onClick={onImportClick}
            title="Import Canvas JSON"
          >
            📂
          </button>
        </div>
      </div>
    </header>
  );
}
