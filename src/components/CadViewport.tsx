import React from "react";
import type { CadFeature } from "../types/cad";

interface CadViewportProps {
  features: CadFeature[];
  selectedFeatureId: string | null;
  rollbackIndex: number;
  onSelectFeature: (id: string) => void;
}

export const CadViewport: React.FC<CadViewportProps> = ({
  features,
  selectedFeatureId,
  rollbackIndex,
  onSelectFeature,
}) => {
  // Filter active operations considering suppression and rollback bar
  const activeFeatures = features.filter((feat, idx) => {
    if (rollbackIndex !== -1 && idx > rollbackIndex) return false;
    if (feat.suppressed) return false;
    if (!feat.visible) return false;
    return true;
  });

  // Extract dimensions for visualization calculation
  const widthDim = activeFeatures
    .flatMap((f) => f.dimensions)
    .find((d) => d.name.toLowerCase().includes("width") || d.name.toLowerCase().includes("length"))?.value || 120;

  const heightDim = activeFeatures
    .flatMap((f) => f.dimensions)
    .find((d) => d.name.toLowerCase().includes("height") || d.name.toLowerCase().includes("width"))?.value || 80;

  const depthDim = activeFeatures
    .flatMap((f) => f.dimensions)
    .find((d) => d.name.toLowerCase().includes("depth") || d.name.toLowerCase().includes("thickness"))?.value || 25;

  const filletRadius = activeFeatures
    .flatMap((f) => f.dimensions)
    .find((d) => d.name.toLowerCase().includes("fillet") || d.name.toLowerCase().includes("radius"))?.value || 0;

  const holeDiameter = activeFeatures
    .flatMap((f) => f.dimensions)
    .find((d) => d.name.toLowerCase().includes("hole") || d.name.toLowerCase().includes("bore") || d.name.toLowerCase().includes("diameter"))?.value || 0;

  // Scale bounds for canvas SVG rendering
  const baseW = Math.max(40, Math.min(240, widthDim * 1.5));
  const baseH = Math.max(30, Math.min(180, heightDim * 1.5));
  const depthOffset = Math.max(10, Math.min(60, depthDim * 1.2));
  const cornerRadius = Math.min(filletRadius * 1.2, baseW / 3, baseH / 3);
  const holeR = Math.min(holeDiameter * 0.7, baseW / 3, baseH / 3);

  const cx = 300;
  const cy = 200;

  const rx = baseW / 2;
  const ry = baseH / 2;

  return (
    <div className="cad-viewport" aria-label="3D CAD Viewport Preview">
      <div className="cad-viewport__toolbar">
        <div className="viewport__badge">
          <span>📐 Interactive Parametric Viewport</span>
        </div>
        <div className="viewport__stats font-mono">
          <span>Active Ops: {activeFeatures.length}/{features.length}</span>
          <span>Depth: {depthDim}mm</span>
        </div>
      </div>

      <div className="cad-viewport__canvas-wrap">
        <svg
          className="cad-viewport__svg"
          viewBox="0 0 600 400"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="topFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="sideFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="frontFaceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
            </linearGradient>

            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="0.5"
                strokeOpacity="0.4"
              />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Coordinate Axes Indicator */}
          <g transform="translate(40, 350)" className="axes-indicator">
            <line x1="0" y1="0" x2="30" y2="0" stroke="#ef4444" strokeWidth="2" />
            <text x="35" y="4" fill="#ef4444" fontSize="10" fontWeight="bold">X</text>
            <line x1="0" y1="0" x2="0" y2="-30" stroke="#10b981" strokeWidth="2" />
            <text x="-4" y="-35" fill="#10b981" fontSize="10" fontWeight="bold">Y</text>
            <line x1="0" y1="0" x2="-20" y2="20" stroke="#3b82f6" strokeWidth="2" />
            <text x="-28" y="28" fill="#3b82f6" fontSize="10" fontWeight="bold">Z</text>
          </g>

          {/* Solid 3D Parametric Representation */}
          {activeFeatures.length > 0 ? (
            <g className="cad-model-group">
              {/* Back / Extrusion Offset Box */}
              <rect
                x={cx - rx + depthOffset}
                y={cy - ry - depthOffset}
                width={rx * 2}
                height={ry * 2}
                rx={cornerRadius}
                ry={cornerRadius}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.4"
              />

              {/* Side Connecting Extrusion Lines */}
              <line
                x1={cx - rx}
                y1={cy - ry}
                x2={cx - rx + depthOffset}
                y2={cy - ry - depthOffset}
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <line
                x1={cx + rx}
                y1={cy - ry}
                x2={cx + rx + depthOffset}
                y2={cy - ry - depthOffset}
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <line
                x1={cx + rx}
                y1={cy + ry}
                x2={cx + rx + depthOffset}
                y2={cy + ry - depthOffset}
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                opacity="0.6"
              />

              {/* Front Main Parametric Face */}
              <rect
                x={cx - rx}
                y={cy - ry}
                width={rx * 2}
                height={ry * 2}
                rx={cornerRadius}
                ry={cornerRadius}
                fill="url(#frontFaceGrad)"
                stroke="var(--color-primary)"
                strokeWidth="2"
                style={{
                  filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.25))",
                }}
              />

              {/* Center Hole cutout if active */}
              {holeR > 0 && (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={holeR}
                    fill="var(--color-bg)"
                    stroke="var(--color-primary)"
                    strokeWidth="2"
                  />
                  {/* Inner bore depth circle */}
                  <circle
                    cx={cx + depthOffset * 0.4}
                    cy={cy - depthOffset * 0.4}
                    r={holeR}
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.6"
                  />
                </g>
              )}

              {/* Dynamic Feature Overlay Highlights */}
              {features.map((feature, idx) => {
                const isSelected = feature.id === selectedFeatureId;
                const isRolledBack = rollbackIndex !== -1 && idx > rollbackIndex;

                if (!isSelected || feature.suppressed || isRolledBack) return null;

                return (
                  <g key={`highlight-${feature.id}`} className="feature-highlight-overlay">
                    <rect
                      x={cx - rx - 6}
                      y={cy - ry - 6}
                      width={rx * 2 + 12}
                      height={ry * 2 + 12}
                      rx={cornerRadius + 4}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        values="0;20"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </rect>
                    <text
                      x={cx - rx}
                      y={cy - ry - 14}
                      fill="#f59e0b"
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="var(--font-mono)"
                    >
                      ★ {feature.name}
                    </text>
                  </g>
                );
              })}
            </g>
          ) : (
            <g className="empty-viewport-msg" transform="translate(300, 200)">
              <text textAnchor="middle" fill="var(--color-text-muted)" fontSize="14">
                No active CAD operations (All features suppressed or rolled back)
              </text>
            </g>
          )}
        </svg>

        {/* Feature Quick Selection Chips Overlay */}
        <div className="cad-viewport__chips">
          <span className="chips__title">Operations:</span>
          {features.map((f, i) => {
            const isRolledBack = rollbackIndex !== -1 && i > rollbackIndex;
            return (
              <button
                key={f.id}
                type="button"
                className={`viewport-chip ${
                  f.id === selectedFeatureId ? "is-selected" : ""
                } ${f.suppressed ? "is-suppressed" : ""} ${
                  isRolledBack ? "is-rolled-back" : ""
                }`}
                onClick={() => onSelectFeature(f.id)}
              >
                {f.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
