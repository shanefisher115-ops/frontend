import { useState, useEffect } from "react";
import type {
  CADFeature,
  SketchParameters,
  ExtrudeParameters,
  RevolveParameters,
  FilletParameters,
  ChamferParameters,
  HoleParameters,
  ShellParameters,
  PatternParameters,
} from "../types/cad";

interface CADPropertyInspectorProps {
  feature: CADFeature | null;
  features: CADFeature[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateParameters: (id: string, newParams: Partial<CADFeature["parameters"]>) => void;
  onUpdateName: (id: string, newName: string) => void;
  onToggleSuppress: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CADPropertyInspector({
  feature,
  features,
  isOpen,
  onClose,
  onUpdateParameters,
  onUpdateName,
  onToggleSuppress,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: CADPropertyInspectorProps) {
  if (!feature || !isOpen) {
    return (
      <aside className="property-inspector property-inspector--empty" aria-label="Property Inspector">
        <div className="property-inspector__empty-state">
          <p className="muted">Select a feature from the tree to inspect and edit parametric dimensions.</p>
        </div>
      </aside>
    );
  }

  const [nameInput, setNameInput] = useState(feature.name);
  const currentIndex = features.findIndex((f) => f.id === feature.id);
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex === features.length - 1;
  const parentFeature = feature.parentId
    ? features.find((f) => f.id === feature.parentId)
    : null;

  useEffect(() => {
    setNameInput(feature.name);
  }, [feature.id, feature.name]);

  const handleNameBlur = () => {
    if (nameInput.trim() && nameInput !== feature.name) {
      onUpdateName(feature.id, nameInput.trim());
    }
  };

  return (
    <aside className="property-inspector" aria-label="Property Inspector">
      {/* Header */}
      <div className="property-inspector__header">
        <div className="property-inspector__title-area">
          <span className={`feature-type-tag feature-type-tag--${feature.type}`}>
            {feature.type}
          </span>
          <div className="property-inspector__name-edit">
            <input
              type="text"
              className="property-inspector__name-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              title="Click to rename feature"
            />
          </div>
        </div>

        <div className="property-inspector__header-actions">
          <button
            type="button"
            className={`icon-btn ${feature.suppressed ? "icon-btn--active" : ""}`}
            onClick={() => onToggleSuppress(feature.id)}
            title={feature.suppressed ? "Unsuppress feature" : "Suppress feature"}
            aria-label="Toggle suppression"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </button>
          <button
            type="button"
            className={`icon-btn ${!feature.visible ? "icon-btn--active" : ""}`}
            onClick={() => onToggleVisibility(feature.id)}
            title={feature.visible ? "Hide feature" : "Show feature"}
            aria-label="Toggle visibility"
          >
            {feature.visible ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            title="Close drawer"
            aria-label="Close inspector drawer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status Alert Banner if warning or error */}
      {feature.status !== "ok" && (
        <div
          className={`inspector-alert inspector-alert--${feature.status}`}
          role="alert"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{feature.statusMessage || `Feature status: ${feature.status}`}</span>
        </div>
      )}

      {/* Main Form: Parametric Dimensions */}
      <div className="property-inspector__body">
        <div className="inspector-section">
          <h3 className="inspector-section__title">Parametric Dimensions</h3>
          <ParametricEditor
            feature={feature}
            onChange={(newParams) => onUpdateParameters(feature.id, newParams)}
          />
        </div>

        {/* Feature History & Dependencies */}
        <div className="inspector-section">
          <h3 className="inspector-section__title">Feature History & Hierarchy</h3>
          <dl className="info-grid">
            <div className="info-row">
              <dt>Sequence Order</dt>
              <dd>Step {currentIndex + 1} of {features.length}</dd>
            </div>
            {parentFeature && (
              <div className="info-row">
                <dt>Parent Dependency</dt>
                <dd className="parent-tag">{parentFeature.name}</dd>
              </div>
            )}
            <div className="info-row">
              <dt>Status</dt>
              <dd>
                <span className={`status-badge-sm status-badge-sm--${feature.status}`}>
                  {feature.status.toUpperCase()}
                </span>
              </dd>
            </div>
            <div className="info-row">
              <dt>Created</dt>
              <dd>{new Date(feature.created_at).toLocaleTimeString()}</dd>
            </div>
          </dl>
        </div>

        {/* Quick Actions */}
        <div className="inspector-section">
          <h3 className="inspector-section__title">Reorder & Actions</h3>
          <div className="inspector-actions">
            <div className="btn-group">
              <button
                type="button"
                className="btn btn--secondary"
                disabled={isFirst}
                onClick={() => onMoveUp(feature.id)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                Move Up
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={isLast}
                onClick={() => onMoveDown(feature.id)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                Move Down
              </button>
            </div>

            <button
              type="button"
              className="btn btn--secondary btn--full"
              onClick={() => onDuplicate(feature.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Duplicate Operation
            </button>

            <button
              type="button"
              className="btn btn--danger btn--full"
              onClick={() => onDelete(feature.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete Operation
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * Renders parameter controls matching feature type.
 */
function ParametricEditor({
  feature,
  onChange,
}: {
  feature: CADFeature;
  onChange: (newParams: Partial<CADFeature["parameters"]>) => void;
}) {
  switch (feature.type) {
    case "sketch": {
      const p = feature.parameters as SketchParameters;
      return (
        <div className="param-form">
          <div className="form-field">
            <label htmlFor="sketch-plane">Reference Plane</label>
            <select
              id="sketch-plane"
              value={p.plane}
              onChange={(e) => onChange({ plane: e.target.value as any })}
            >
              <option value="XY">XY Plane (Front)</option>
              <option value="XZ">XZ Plane (Top)</option>
              <option value="YZ">YZ Plane (Right)</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="sketch-shape">Profile Shape</label>
            <select
              id="sketch-shape"
              value={p.shape}
              onChange={(e) => onChange({ shape: e.target.value as any })}
            >
              <option value="rectangle">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="polygon">Polygon</option>
            </select>
          </div>

          <NumberInput
            label="Width"
            value={p.width}
            unit="mm"
            min={5}
            max={500}
            step={1}
            onChange={(val) => onChange({ width: val })}
          />

          <NumberInput
            label="Height"
            value={p.height}
            unit="mm"
            min={5}
            max={500}
            step={1}
            onChange={(val) => onChange({ height: val })}
          />

          {p.shape === "circle" && (
            <NumberInput
              label="Circle Radius"
              value={p.circleRadius ?? 20}
              unit="mm"
              min={1}
              max={200}
              step={1}
              onChange={(val) => onChange({ circleRadius: val })}
            />
          )}
        </div>
      );
    }

    case "extrude": {
      const p = feature.parameters as ExtrudeParameters;
      return (
        <div className="param-form">
          <NumberInput
            label="Extrude Depth"
            value={p.depth}
            unit="mm"
            min={1}
            max={500}
            step={1}
            onChange={(val) => onChange({ depth: val })}
          />

          <div className="form-field">
            <label htmlFor="extrude-direction">Direction</label>
            <select
              id="extrude-direction"
              value={p.direction}
              onChange={(e) => onChange({ direction: e.target.value as any })}
            >
              <option value="one-sided">One Side</option>
              <option value="symmetric">Symmetric</option>
              <option value="two-sided">Two Sides</option>
            </select>
          </div>

          <NumberInput
            label="Draft Angle"
            value={p.draftAngle}
            unit="°"
            min={-45}
            max={45}
            step={0.5}
            onChange={(val) => onChange({ draftAngle: val })}
          />

          <div className="form-field">
            <label htmlFor="extrude-op">Boolean Operation</label>
            <select
              id="extrude-op"
              value={p.operation}
              onChange={(e) => onChange({ operation: e.target.value as any })}
            >
              <option value="join">Join / Add Material</option>
              <option value="cut">Cut / Remove Material</option>
              <option value="intersect">Intersect</option>
            </select>
          </div>
        </div>
      );
    }

    case "revolve": {
      const p = feature.parameters as RevolveParameters;
      return (
        <div className="param-form">
          <NumberInput
            label="Revolution Angle"
            value={p.angle}
            unit="°"
            min={1}
            max={360}
            step={5}
            onChange={(val) => onChange({ angle: val })}
          />

          <div className="form-field">
            <label htmlFor="revolve-axis">Revolution Axis</label>
            <select
              id="revolve-axis"
              value={p.axis}
              onChange={(e) => onChange({ axis: e.target.value as any })}
            >
              <option value="X">X Axis</option>
              <option value="Y">Y Axis</option>
              <option value="Z">Z Axis</option>
            </select>
          </div>
        </div>
      );
    }

    case "fillet": {
      const p = feature.parameters as FilletParameters;
      return (
        <div className="param-form">
          <NumberInput
            label="Fillet Radius"
            value={p.radius}
            unit="mm"
            min={0.5}
            max={50}
            step={0.5}
            onChange={(val) => onChange({ radius: val })}
          />

          <div className="form-field">
            <label htmlFor="fillet-selection">Edge Selection</label>
            <select
              id="fillet-selection"
              value={p.edgeSelection}
              onChange={(e) => onChange({ edgeSelection: e.target.value as any })}
            >
              <option value="all-edges">All Edges</option>
              <option value="top-edges">Top Edges Only</option>
              <option value="vertical-edges">Vertical Edges Only</option>
            </select>
          </div>
        </div>
      );
    }

    case "chamfer": {
      const p = feature.parameters as ChamferParameters;
      return (
        <div className="param-form">
          <NumberInput
            label="Chamfer Distance"
            value={p.distance}
            unit="mm"
            min={0.5}
            max={30}
            step={0.5}
            onChange={(val) => onChange({ distance: val })}
          />

          <NumberInput
            label="Chamfer Angle"
            value={p.angle}
            unit="°"
            min={15}
            max={75}
            step={5}
            onChange={(val) => onChange({ angle: val })}
          />
        </div>
      );
    }

    case "hole": {
      const p = feature.parameters as HoleParameters;
      return (
        <div className="param-form">
          <div className="form-field">
            <label htmlFor="hole-type">Hole Type</label>
            <select
              id="hole-type"
              value={p.holeType}
              onChange={(e) => onChange({ holeType: e.target.value as any })}
            >
              <option value="simple">Simple Hole</option>
              <option value="counterbore">Counterbore Hole</option>
              <option value="countersink">Countersink Hole</option>
            </select>
          </div>

          <NumberInput
            label="Hole Diameter"
            value={p.diameter}
            unit="mm"
            min={1}
            max={100}
            step={1}
            onChange={(val) => onChange({ diameter: val })}
          />

          <NumberInput
            label="Hole Depth"
            value={p.depth}
            unit="mm"
            min={1}
            max={200}
            step={1}
            onChange={(val) => onChange({ depth: val })}
          />

          <NumberInput
            label="X Center Offset"
            value={p.xOffset}
            unit="mm"
            min={-100}
            max={100}
            step={1}
            onChange={(val) => onChange({ xOffset: val })}
          />

          <NumberInput
            label="Y Center Offset"
            value={p.yOffset}
            unit="mm"
            min={-100}
            max={100}
            step={1}
            onChange={(val) => onChange({ yOffset: val })}
          />
        </div>
      );
    }

    case "shell": {
      const p = feature.parameters as ShellParameters;
      return (
        <div className="param-form">
          <NumberInput
            label="Wall Thickness"
            value={p.thickness}
            unit="mm"
            min={0.5}
            max={20}
            step={0.5}
            onChange={(val) => onChange({ thickness: val })}
          />

          <div className="form-field">
            <label htmlFor="shell-dir">Offset Direction</label>
            <select
              id="shell-dir"
              value={p.direction}
              onChange={(e) => onChange({ direction: e.target.value as any })}
            >
              <option value="inside">Inside Offset</option>
              <option value="outside">Outside Offset</option>
            </select>
          </div>
        </div>
      );
    }

    case "pattern": {
      const p = feature.parameters as PatternParameters;
      return (
        <div className="param-form">
          <NumberInput
            label="Instance Count"
            value={p.count}
            unit=""
            min={2}
            max={20}
            step={1}
            onChange={(val) => onChange({ count: val })}
          />

          <NumberInput
            label="Spacing"
            value={p.spacing}
            unit="mm"
            min={1}
            max={200}
            step={1}
            onChange={(val) => onChange({ spacing: val })}
          />

          <div className="form-field">
            <label htmlFor="pattern-dir">Pattern Axis</label>
            <select
              id="pattern-dir"
              value={p.direction}
              onChange={(e) => onChange({ direction: e.target.value as any })}
            >
              <option value="X">X Axis</option>
              <option value="Y">Y Axis</option>
              <option value="Z">Z Axis</option>
            </select>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

/**
 * Helper component for numeric input with slider + step controls.
 */
function NumberInput({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}) {
  const inputId = `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="form-field">
      <div className="form-field__label-row">
        <label htmlFor={inputId}>{label}</label>
        <span className="form-field__value-badge">
          {value} {unit}
        </span>
      </div>
      <div className="form-field__control-group">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="form-field__slider"
        />
        <input
          id={inputId}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
              onChange(val);
            }
          }}
          className="form-field__num-input"
        />
      </div>
    </div>
  );
}
