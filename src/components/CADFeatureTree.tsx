import React, { useState } from "react";
import type { CADFeature, CADFeatureType } from "../types/cad";

interface CADFeatureTreeProps {
  features: CADFeature[];
  selectedFeatureId: string | null;
  rollbackIndex: number;
  searchQuery: string;
  filterType: CADFeatureType | "all";
  onSelectFeature: (id: string) => void;
  onReorderFeature: (fromIndex: number, toIndex: number) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onToggleSuppress: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddFeature: (type: CADFeatureType) => void;
  onSetRollbackIndex: (index: number) => void;
  onSearchChange: (query: string) => void;
  onFilterTypeChange: (filter: CADFeatureType | "all") => void;
  onResetHistory: () => void;
}

export function CADFeatureTree({
  features,
  selectedFeatureId,
  rollbackIndex,
  searchQuery,
  filterType,
  onSelectFeature,
  onReorderFeature,
  onMoveUp,
  onMoveDown,
  onToggleSuppress,
  onToggleVisibility,
  onAddFeature,
  onSetRollbackIndex,
  onSearchChange,
  onFilterTypeChange,
  onResetHistory,
}: CADFeatureTreeProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const filteredFeatures = features.filter((feat) => {
    const matchesSearch = feat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || feat.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onReorderFeature(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <aside className="feature-tree" aria-label="CAD Feature Tree">
      {/* Tree Toolbar */}
      <div className="feature-tree__toolbar">
        <div className="feature-tree__header">
          <div className="feature-tree__title-row">
            <h2 className="feature-tree__title">Feature Tree</h2>
            <span className="feature-count-pill">{features.length} ops</span>
          </div>

          <div className="feature-tree__top-actions">
            <div className="add-feature-dropdown">
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setShowAddMenu(!showAddMenu)}
                aria-expanded={showAddMenu}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Feature
              </button>

              {showAddMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-menu__header">Insert CAD Operation</div>
                  <FeatureTypeOption type="sketch" label="Sketch Profile" onClick={() => { onAddFeature("sketch"); setShowAddMenu(false); }} />
                  <FeatureTypeOption type="extrude" label="Extrude Boss / Cut" onClick={() => { onAddFeature("extrude"); setShowAddMenu(false); }} />
                  <FeatureTypeOption type="revolve" label="Revolve" onClick={() => { onAddFeature("revolve"); setShowAddMenu(false); }} />
                  <FeatureTypeOption type="fillet" label="Edge Fillet" onClick={() => { onAddFeature("fillet"); setShowAddMenu(false); }} />
                  <FeatureTypeOption type="chamfer" label="Chamfer" onClick={() => { onAddFeature("chamfer"); setShowAddMenu(false); }} />
                  <FeatureTypeOption type="hole" label="Hole Feature" onClick={() => { onAddFeature("hole"); setShowAddMenu(false); }} />
                  <FeatureTypeOption type="shell" label="Thin Shell" onClick={() => { onAddFeature("shell"); setShowAddMenu(false); }} />
                  <FeatureTypeOption type="pattern" label="Linear Pattern" onClick={() => { onAddFeature("pattern"); setShowAddMenu(false); }} />
                </div>
              )}
            </div>

            <button
              type="button"
              className="icon-btn"
              onClick={onResetHistory}
              title="Reset model to initial default history"
              aria-label="Reset history"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="feature-tree__filters">
          <div className="search-input-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search operations…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => onSearchChange("")}
              >
                ×
              </button>
            )}
          </div>

          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value as any)}
            aria-label="Filter feature types"
          >
            <option value="all">All Types</option>
            <option value="sketch">Sketch</option>
            <option value="extrude">Extrude</option>
            <option value="revolve">Revolve</option>
            <option value="fillet">Fillet</option>
            <option value="chamfer">Chamfer</option>
            <option value="hole">Hole</option>
            <option value="shell">Shell</option>
            <option value="pattern">Pattern</option>
          </select>
        </div>
      </div>

      {/* Feature History List */}
      <div className="feature-tree__list-wrap">
        <ul className="feature-tree__list">
          {filteredFeatures.length === 0 ? (
            <li className="feature-tree__empty-item">
              <p className="muted">No matching operations found.</p>
            </li>
          ) : (
            features.map((feature, index) => {
              const isFilteredOut = !filteredFeatures.some((f) => f.id === feature.id);
              if (isFilteredOut) return null;

              const isSelected = selectedFeatureId === feature.id;
              const isRolledBack = index >= rollbackIndex;
              const isDragOver = dragOverIndex === index;

              return (
                <React.Fragment key={feature.id}>
                  {/* Rollback Bar Marker above item if index matches rollbackIndex */}
                  {index === rollbackIndex && (
                    <li className="rollback-bar-marker" title="Rollback Bar position">
                      <div className="rollback-bar">
                        <span className="rollback-bar__handle">◆ Rollback Bar ◆</span>
                      </div>
                    </li>
                  )}

                  <li
                    className={`feature-item ${isSelected ? "feature-item--selected" : ""} ${
                      feature.suppressed ? "feature-item--suppressed" : ""
                    } ${isRolledBack ? "feature-item--rolled-back" : ""} ${
                      isDragOver ? "feature-item--drag-over" : ""
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onClick={() => onSelectFeature(feature.id)}
                  >
                    {/* Drag handle */}
                    <span className="feature-item__drag-handle" title="Drag to reorder operation">
                      ⋮⋮
                    </span>

                    {/* Type Icon */}
                    <span className="feature-item__icon" title={feature.type}>
                      <FeatureIcon type={feature.type} />
                    </span>

                    {/* Details */}
                    <div className="feature-item__details">
                      <span className="feature-item__name">{feature.name}</span>
                      <span className="feature-item__meta">
                        {feature.type} · Step {index + 1}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {feature.status !== "ok" && (
                      <span
                        className={`status-dot status-dot--${feature.status}`}
                        title={feature.statusMessage || feature.status}
                      />
                    )}

                    {/* Action buttons */}
                    <div className="feature-item__actions" onClick={(e) => e.stopPropagation()}>
                      {/* Move Up */}
                      <button
                        type="button"
                        className="item-btn"
                        disabled={index === 0}
                        onClick={() => onMoveUp(feature.id)}
                        title="Move operation up"
                      >
                        ▲
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        className="item-btn"
                        disabled={index === features.length - 1}
                        onClick={() => onMoveDown(feature.id)}
                        title="Move operation down"
                      >
                        ▼
                      </button>

                      {/* Toggle Suppress */}
                      <button
                        type="button"
                        className={`item-btn ${feature.suppressed ? "item-btn--active" : ""}`}
                        onClick={() => onToggleSuppress(feature.id)}
                        title={feature.suppressed ? "Unsuppress" : "Suppress"}
                      >
                        Ø
                      </button>

                      {/* Toggle Visibility */}
                      <button
                        type="button"
                        className={`item-btn ${!feature.visible ? "item-btn--active" : ""}`}
                        onClick={() => onToggleVisibility(feature.id)}
                        title={feature.visible ? "Hide" : "Show"}
                      >
                        {feature.visible ? "👁" : "🙈"}
                      </button>
                    </div>
                  </li>
                </React.Fragment>
              );
            })
          )}

          {/* Rollback Bar handle at the bottom if rollbackIndex === features.length */}
          {rollbackIndex === features.length && (
            <li className="rollback-bar-marker" title="Rollback Bar at end of history">
              <div
                className="rollback-bar rollback-bar--end"
                onClick={() => onSetRollbackIndex(features.length)}
              >
                <span className="rollback-bar__handle">◆ End of History ◆</span>
              </div>
            </li>
          )}
        </ul>
      </div>

      {/* Rollback slider footer */}
      <div className="feature-tree__rollback-footer">
        <label htmlFor="rollback-slider">History Rollback State</label>
        <div className="rollback-footer__control">
          <input
            id="rollback-slider"
            type="range"
            min={0}
            max={features.length}
            value={rollbackIndex}
            onChange={(e) => onSetRollbackIndex(parseInt(e.target.value, 10))}
          />
          <span className="rollback-step-badge">
            {rollbackIndex} / {features.length} Active
          </span>
        </div>
      </div>
    </aside>
  );
}

function FeatureTypeOption({
  type,
  label,
  onClick,
}: {
  type: CADFeatureType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="dropdown-item" onClick={onClick}>
      <FeatureIcon type={type} />
      <span>{label}</span>
    </button>
  );
}

export function FeatureIcon({ type }: { type: CADFeatureType }) {
  switch (type) {
    case "sketch":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3h18v18H3z" />
          <path d="M3 9h18M9 3v18" />
        </svg>
      );
    case "extrude":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case "revolve":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
        </svg>
      );
    case "fillet":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 20h16M4 4v16M20 20A16 16 0 0 0 4 4" />
        </svg>
      );
    case "chamfer":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="20" x2="20" y2="20" />
          <line x1="4" y1="4" x2="4" y2="20" />
          <line x1="4" y1="10" x2="10" y2="4" />
        </svg>
      );
    case "hole":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    case "shell":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <rect x="7" y="7" width="10" height="10" rx="1" />
        </svg>
      );
    case "pattern":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
