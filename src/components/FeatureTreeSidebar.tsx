import React, { useState } from "react";
import type { CadFeature, FeatureType } from "../types/cad";

interface FeatureTreeSidebarProps {
  features: CadFeature[];
  selectedFeatureId: string | null;
  onSelectFeature: (id: string) => void;
  onReorderFeature: (fromIndex: number, toIndex: number) => void;
  onToggleSuppress: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddFeature: (type: FeatureType) => void;
  onDeleteFeature: (id: string) => void;
  rollbackIndex: number; // Index after which operations are rolled back (-1 means no rollback, all active)
  onSetRollbackIndex: (index: number) => void;
}

const FEATURE_ICONS: Record<FeatureType, string> = {
  sketch: "📐",
  extrude: "🧊",
  revolve: "🔄",
  fillet: "⭕",
  chamfer: "📐",
  hole: "🎯",
  shell: "📦",
  cut_extrude: "✂️",
};

export const FeatureTreeSidebar: React.FC<FeatureTreeSidebarProps> = ({
  features,
  selectedFeatureId,
  onSelectFeature,
  onReorderFeature,
  onToggleSuppress,
  onToggleVisibility,
  onAddFeature,
  onDeleteFeature,
  rollbackIndex,
  onSetRollbackIndex,
}) => {
  const [filterText, setFilterText] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <aside className="feature-tree-sidebar" aria-label="CAD Feature Tree">
      <div className="feature-tree__header">
        <div className="feature-tree__title-row">
          <h2 className="feature-tree__title">
            <span className="feature-tree__icon">🌳</span> Feature History
          </h2>
          <span className="feature-tree__badge">{features.length} ops</span>
        </div>
        <p className="feature-tree__subtitle">
          Parametric model operation tree and design history
        </p>

        <div className="feature-tree__actions">
          <div className="feature-tree__search">
            <input
              type="text"
              placeholder="Search features..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="feature-tree__search-input"
              aria-label="Search features"
            />
            {filterText && (
              <button
                type="button"
                className="feature-tree__clear-search"
                onClick={() => setFilterText("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="feature-tree__add-dropdown">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => setShowAddMenu(!showAddMenu)}
              aria-expanded={showAddMenu}
            >
              + Add Feature
            </button>
            {showAddMenu && (
              <div className="feature-tree__menu" role="menu">
                <button
                  type="button"
                  onClick={() => {
                    onAddFeature("sketch");
                    setShowAddMenu(false);
                  }}
                >
                  {FEATURE_ICONS.sketch} 2D Sketch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddFeature("extrude");
                    setShowAddMenu(false);
                  }}
                >
                  {FEATURE_ICONS.extrude} Boss Extrude
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddFeature("cut_extrude");
                    setShowAddMenu(false);
                  }}
                >
                  {FEATURE_ICONS.cut_extrude} Cut Extrude
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddFeature("fillet");
                    setShowAddMenu(false);
                  }}
                >
                  {FEATURE_ICONS.fillet} Fillet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddFeature("chamfer");
                    setShowAddMenu(false);
                  }}
                >
                  {FEATURE_ICONS.chamfer} Chamfer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddFeature("hole");
                    setShowAddMenu(false);
                  }}
                >
                  {FEATURE_ICONS.hole} Hole / Bore
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddFeature("shell");
                    setShowAddMenu(false);
                  }}
                >
                  {FEATURE_ICONS.shell} Shell Wall
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="feature-tree__list-wrap">
        <div className="feature-tree__rollback-control">
          <button
            type="button"
            className={`btn btn--xs ${
              rollbackIndex === -1 ? "btn--ghost" : "btn--warning"
            }`}
            onClick={() =>
              onSetRollbackIndex(
                rollbackIndex === -1 ? features.length - 1 : -1
              )
            }
          >
            {rollbackIndex === -1
              ? "⏱️ Set Rollback Bar"
              : "▶️ End Rollback (Show All)"}
          </button>
        </div>

        <ol className="feature-tree__list">
          {features.map((feature, index) => {
            const isRolledBack =
              rollbackIndex !== -1 && index > rollbackIndex;
            const isSelected = feature.id === selectedFeatureId;
            const isFilterMatch =
              !filterText ||
              feature.name.toLowerCase().includes(filterText.toLowerCase());

            if (!isFilterMatch) return null;

            return (
              <React.Fragment key={feature.id}>
                <li
                  className={`feature-item ${isSelected ? "is-selected" : ""} ${
                    feature.suppressed ? "is-suppressed" : ""
                  } ${isRolledBack ? "is-rolled-back" : ""} ${
                    feature.status === "error" ? "has-error" : ""
                  }`}
                  onClick={() => onSelectFeature(feature.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onSelectFeature(feature.id);
                    }
                  }}
                >
                  <div className="feature-item__drag-handle" title="Reorder">
                    ⋮⋮
                  </div>

                  <span
                    className="feature-item__icon"
                    title={feature.type}
                    style={{
                      borderColor: feature.color || "var(--color-primary)",
                    }}
                  >
                    {FEATURE_ICONS[feature.type] || "⚙️"}
                  </span>

                  <div className="feature-item__details">
                    <div className="feature-item__name-row">
                      <span className="feature-item__name">{feature.name}</span>
                      {feature.suppressed && (
                        <span className="feature-item__tag tag--suppressed">
                          Suppressed
                        </span>
                      )}
                      {isRolledBack && (
                        <span className="feature-item__tag tag--rolled-back">
                          Rolled Back
                        </span>
                      )}
                    </div>
                    <div className="feature-item__sub font-mono">
                      {feature.dimensions.length} param(s) · {feature.type}
                    </div>
                  </div>

                  <div
                    className="feature-item__quick-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className={`icon-btn ${
                        feature.visible ? "active" : "muted"
                      }`}
                      title={
                        feature.visible ? "Hide Feature" : "Show Feature"
                      }
                      onClick={() => onToggleVisibility(feature.id)}
                      aria-label={`${feature.visible ? "Hide" : "Show"} ${feature.name}`}
                    >
                      {feature.visible ? "👁️" : "🙈"}
                    </button>

                    <button
                      type="button"
                      className={`icon-btn ${
                        feature.suppressed ? "active-warning" : ""
                      }`}
                      title={
                        feature.suppressed
                          ? "Unsuppress Operation"
                          : "Suppress Operation"
                      }
                      onClick={() => onToggleSuppress(feature.id)}
                      aria-label={`${feature.suppressed ? "Unsuppress" : "Suppress"} ${feature.name}`}
                    >
                      {feature.suppressed ? "🚫" : "⚡"}
                    </button>

                    <div className="feature-item__reorder-group">
                      <button
                        type="button"
                        className="icon-btn icon-btn--sm"
                        disabled={index === 0}
                        onClick={() => onReorderFeature(index, index - 1)}
                        title="Move Up in History"
                        aria-label={`Move ${feature.name} up`}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--sm"
                        disabled={index === features.length - 1}
                        onClick={() => onReorderFeature(index, index + 1)}
                        title="Move Down in History"
                        aria-label={`Move ${feature.name} down`}
                      >
                        ▼
                      </button>
                    </div>

                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => onDeleteFeature(feature.id)}
                      title="Delete Operation"
                      aria-label={`Delete ${feature.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                </li>

                {rollbackIndex === index && (
                  <li className="feature-tree__rollback-bar">
                    <span>⏱️ Rollback Bar (Operations below are paused)</span>
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </aside>
  );
};
