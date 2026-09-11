import React, { useState, useEffect, useRef } from "react";
import type { CadWidgetData } from "../../../types/whiteboard";

interface CadViewportWidgetProps {
  data: CadWidgetData;
  onChange: (updates: Partial<CadWidgetData>) => void;
}

export function CadViewportWidget({ data, onChange }: CadViewportWidgetProps) {
  const [rotation, setRotation] = useState(data.rotation);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Auto-rotate animation frame
  useEffect(() => {
    if (!data.autoRotate) return;
    const interval = setInterval(() => {
      setRotation((prev) => {
        const next = { ...prev, y: (prev.y + 1) % 360 };
        onChange({ rotation: next });
        return next;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [data.autoRotate, onChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    const nextRotation = {
      x: Math.max(-90, Math.min(90, rotation.x + dy * 0.5)),
      y: (rotation.y + dx * 0.5) % 360,
      z: rotation.z,
    };
    setRotation(nextRotation);
    onChange({ rotation: nextRotation });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="cad-widget">
      {/* CAD Toolbar Controls */}
      <div className="cad-widget__controls">
        <div className="cad-widget__group">
          <label className="cad-label">Model:</label>
          <select
            className="cad-select"
            value={data.modelType}
            onChange={(e) =>
              onChange({ modelType: e.target.value as CadWidgetData["modelType"] })
            }
          >
            <option value="drone-chassis">Drone Core Chassis</option>
            <option value="quantum-core">Quantum Cryo Core</option>
            <option value="robot-arm">Kinematic Robot Arm</option>
            <option value="satellite-bus">Satellite Micro-Bus</option>
          </select>
        </div>

        <div className="cad-widget__group">
          <label className="cad-label">Mode:</label>
          <select
            className="cad-select"
            value={data.renderMode}
            onChange={(e) =>
              onChange({ renderMode: e.target.value as CadWidgetData["renderMode"] })
            }
          >
            <option value="shaded">Shaded</option>
            <option value="wireframe">Wireframe</option>
            <option value="xray">X-Ray</option>
          </select>
        </div>

        <div className="cad-widget__group">
          <button
            type="button"
            className={`cad-btn ${data.autoRotate ? "cad-btn--active" : ""}`}
            onClick={() => onChange({ autoRotate: !data.autoRotate })}
            title="Toggle continuous orbit rotation"
          >
            🔄 Spin
          </button>
          <button
            type="button"
            className={`cad-btn ${data.showGrid ? "cad-btn--active" : ""}`}
            onClick={() => onChange({ showGrid: !data.showGrid })}
            title="Toggle CAD ground grid"
          >
            🌐 Grid
          </button>
        </div>
      </div>

      {/* Exploded View Slider */}
      <div className="cad-widget__slider-row">
        <span className="cad-label">Explode Assembly:</span>
        <input
          type="range"
          min="0"
          max="100"
          value={data.explodedView}
          onChange={(e) => onChange({ explodedView: Number(e.target.value) })}
          className="cad-slider"
        />
        <span className="cad-val">{data.explodedView}%</span>
      </div>

      {/* 3D Render Area */}
      <div
        className="cad-widget__viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Cad3DRenderer
          modelType={data.modelType}
          renderMode={data.renderMode}
          rotation={rotation}
          explodedView={data.explodedView}
          showGrid={data.showGrid}
          colorScheme={data.colorScheme}
        />

        {/* Orbit hint overlay */}
        <div className="cad-widget__hint">
          Drag to Orbit 3D Model | Rot: X:{Math.round(rotation.x)}° Y:
          {Math.round(rotation.y)}°
        </div>
      </div>
    </div>
  );
}

// 3D Isometric Projection SVG Renderer
function Cad3DRenderer({
  modelType,
  renderMode,
  rotation,
  explodedView,
  showGrid,
  colorScheme,
}: {
  modelType: CadWidgetData["modelType"];
  renderMode: CadWidgetData["renderMode"];
  rotation: { x: number; y: number; z: number };
  explodedView: number;
  showGrid: boolean;
  colorScheme: CadWidgetData["colorScheme"];
}) {
  const radX = (rotation.x * Math.PI) / 180;

  // Colors
  const colors = {
    cyan: { main: "#38bdf8", accent: "#0284c7", wire: "#0284c7" },
    emerald: { main: "#34d39e", accent: "#059669", wire: "#10b981" },
    amber: { main: "#fbbf24", accent: "#d97706", wire: "#f59e0b" },
    violet: { main: "#c084fc", accent: "#7e22ce", wire: "#a855f7" },
  }[colorScheme];

  const explodeOffset = (explodedView / 100) * 45;

  return (
    <svg className="cad-svg" viewBox="-200 -200 400 400">
      {/* Ground Grid */}
      {showGrid && (
        <g opacity="0.25" stroke="currentColor" strokeWidth="1">
          {Array.from({ length: 9 }).map((_, i) => {
            const pos = (i - 4) * 35;
            return (
              <React.Fragment key={i}>
                <line x1={pos} y1="-140" x2={pos} y2="140" />
                <line x1="-140" y1={pos} x2="140" y2={pos} />
              </React.Fragment>
            );
          })}
        </g>
      )}

      {/* Axis Gizmo */}
      <g transform="translate(-160, 140)">
        <line x1="0" y1="0" x2="25" y2="0" stroke="#f43f5e" strokeWidth="2" />
        <text x="28" y="4" fill="#f43f5e" fontSize="10" fontWeight="bold">X</text>
        <line x1="0" y1="0" x2="0" y2="-25" stroke="#10b981" strokeWidth="2" />
        <text x="-4" y="-28" fill="#10b981" fontSize="10" fontWeight="bold">Y</text>
        <line x1="0" y1="0" x2="-15" y2="15" stroke="#3b82f6" strokeWidth="2" />
        <text x="-24" y="22" fill="#3b82f6" fontSize="10" fontWeight="bold">Z</text>
      </g>

      {/* Render 3D Model shape with simulated transformation */}
      <g transform={`rotate(${rotation.y}) scale(${1 + Math.sin(radX) * 0.15})`}>
        {modelType === "drone-chassis" && (
          <g>
            {/* Core Center Frame */}
            <rect
              x="-40"
              y="-40"
              width="80"
              height="80"
              rx="12"
              fill={renderMode === "wireframe" ? "none" : colors.main}
              fillOpacity={renderMode === "xray" ? "0.3" : "0.85"}
              stroke={colors.accent}
              strokeWidth="2.5"
            />
            {/* 4 Rotor Arms */}
            <line
              x1="-40"
              y1="-40"
              x2={-80 - explodeOffset}
              y2={-80 - explodeOffset}
              stroke={colors.wire}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <line
              x1="40"
              y1="-40"
              x2={80 + explodeOffset}
              y2={-80 - explodeOffset}
              stroke={colors.wire}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <line
              x1="-40"
              y1="40"
              x2={-80 - explodeOffset}
              y2={80 + explodeOffset}
              stroke={colors.wire}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <line
              x1="40"
              y1="40"
              x2={80 + explodeOffset}
              y2={80 + explodeOffset}
              stroke={colors.wire}
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Rotors */}
            <circle
              cx={-80 - explodeOffset}
              cy={-80 - explodeOffset}
              r="28"
              fill="none"
              stroke={colors.main}
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <circle
              cx={80 + explodeOffset}
              cy={-80 - explodeOffset}
              r="28"
              fill="none"
              stroke={colors.main}
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <circle
              cx={-80 - explodeOffset}
              cy={80 + explodeOffset}
              r="28"
              fill="none"
              stroke={colors.main}
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <circle
              cx={80 + explodeOffset}
              cy={80 + explodeOffset}
              r="28"
              fill="none"
              stroke={colors.main}
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          </g>
        )}

        {modelType === "quantum-core" && (
          <g>
            <circle
              cx="0"
              cy="0"
              r={60 + explodeOffset}
              fill="none"
              stroke={colors.main}
              strokeWidth="2"
            />
            <circle
              cx="0"
              cy="0"
              r={40 + explodeOffset * 0.5}
              fill="none"
              stroke={colors.accent}
              strokeWidth="3"
            />
            <ellipse
              cx="0"
              cy="0"
              rx="80"
              ry="25"
              fill="none"
              stroke={colors.wire}
              strokeWidth="2"
              transform={`rotate(${rotation.x})`}
            />
            <circle
              cx="0"
              cy="0"
              r="20"
              fill={colors.main}
              fillOpacity={renderMode === "wireframe" ? "0.2" : "0.9"}
            />
          </g>
        )}

        {modelType === "robot-arm" && (
          <g>
            <rect x="-30" y="60" width="60" height="20" fill={colors.accent} rx="4" />
            <line x1="0" y1="60" x2="0" y2={0 - explodeOffset} stroke={colors.wire} strokeWidth="10" />
            <circle cx="0" cy={0 - explodeOffset} r="16" fill={colors.main} />
            <line
              x1="0"
              y1={0 - explodeOffset}
              x2={40 + explodeOffset}
              y2={-60 - explodeOffset}
              stroke={colors.wire}
              strokeWidth="8"
            />
            <circle cx={40 + explodeOffset} cy={-60 - explodeOffset} r="12" fill={colors.accent} />
          </g>
        )}

        {modelType === "satellite-bus" && (
          <g>
            <rect
              x="-35"
              y="-50"
              width="70"
              height="100"
              fill={renderMode === "wireframe" ? "none" : colors.main}
              stroke={colors.accent}
              strokeWidth="2"
            />
            {/* Solar Panels */}
            <rect
              x={-120 - explodeOffset}
              y="-30"
              width="80"
              height="60"
              fill={colors.wire}
              fillOpacity="0.7"
              stroke={colors.main}
            />
            <rect
              x={40 + explodeOffset}
              y="-30"
              width="80"
              height="60"
              fill={colors.wire}
              fillOpacity="0.7"
              stroke={colors.main}
            />
          </g>
        )}
      </g>
    </svg>
  );
}
