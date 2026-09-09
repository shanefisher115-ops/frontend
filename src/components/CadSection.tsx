import { useState, useRef } from "react";
import { CadViewport, type CadViewportRef } from "./CadViewport";
import type { ToolpathPreset } from "../lib/toolpath";

const PRESET_OPTIONS: { id: ToolpathPreset; name: string; desc: string }[] = [
  { id: "pocket", name: "Spiral Pocketing", desc: "Adaptive 2.5D cavity roughing & finishing" },
  { id: "surface", name: "3D Wave Finishing", desc: "Complex freeform surface parallel passes" },
  { id: "contour", name: "Multi-Depth Contour", desc: "Outer profile adaptive trochoidal milling" },
  { id: "drilling", name: "Matrix Peck Drilling", desc: "Automated multi-point peck cycle pattern" },
];

export function CadSection() {
  const [wireframe, setWireframe] = useState(true);
  const [grid, setGrid] = useState(true);
  const [axes, setAxes] = useState(true);
  const [preset, setPreset] = useState<ToolpathPreset>("pocket");
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);

  const [toolState, setToolState] = useState({
    isRapid: false,
    cutDepth: 0,
    spindleRpm: 12000,
    feedRate: 1500,
  });

  const viewportRef = useRef<CadViewportRef>(null);

  return (
    <section className="card cad-card">
      <div className="cad-card__header">
        <div>
          <h2 className="card__title">3D CAD / CAM Interactive Viewport</h2>
          <p className="cad-card__subtitle">
            Real-time WebGL rendering with OrbitControls, mesh wireframe overlays, grid floor, axes gizmo, and animated cutter paths.
          </p>
        </div>
        <div className="cad-badge">
          <span className="cad-badge__dot" />
          WebGL Active
        </div>
      </div>

      <div className="cad-workspace">
        {/* Main 3D Viewport Area */}
        <div className="cad-viewport-wrapper">
          <CadViewport
            ref={viewportRef}
            showWireframe={wireframe}
            showGrid={grid}
            showAxes={axes}
            toolpathPreset={preset}
            isPlaying={isPlaying}
            speedMultiplier={speed}
            progress={progress}
            onProgressChange={setProgress}
            onToolStateChange={setToolState}
          />

          {/* Viewport Overlay Controls (Camera & Display Toggles) */}
          <div className="viewport-overlay-top">
            <div className="camera-presets">
              <span className="overlay-label">Camera:</span>
              <button
                type="button"
                className="btn-overlay"
                onClick={() => viewportRef.current?.setViewPreset("iso")}
                title="Isometric View"
              >
                ISO
              </button>
              <button
                type="button"
                className="btn-overlay"
                onClick={() => viewportRef.current?.setViewPreset("top")}
                title="Top View"
              >
                TOP
              </button>
              <button
                type="button"
                className="btn-overlay"
                onClick={() => viewportRef.current?.setViewPreset("front")}
                title="Front View"
              >
                FRONT
              </button>
              <button
                type="button"
                className="btn-overlay"
                onClick={() => viewportRef.current?.setViewPreset("side")}
                title="SIDE View"
              >
                SIDE
              </button>
              <button
                type="button"
                className="btn-overlay"
                onClick={() => viewportRef.current?.resetCamera()}
                title="Reset Camera Position"
              >
                Reset
              </button>
            </div>

            <div className="display-toggles">
              <button
                type="button"
                className={`btn-toggle ${wireframe ? "is-active" : ""}`}
                onClick={() => setWireframe(!wireframe)}
              >
                Wireframe
              </button>
              <button
                type="button"
                className={`btn-toggle ${grid ? "is-active" : ""}`}
                onClick={() => setGrid(!grid)}
              >
                Grid
              </button>
              <button
                type="button"
                className={`btn-toggle ${axes ? "is-active" : ""}`}
                onClick={() => setAxes(!axes)}
              >
                Axes Triad
              </button>
            </div>
          </div>

          {/* Real-time CAM Tool Telemetry Overlay */}
          <div className="viewport-overlay-bottom">
            <div className="telemetry-bar">
              <div className="telemetry-item">
                <span className="telemetry-label">Mode:</span>
                <span className={`telemetry-pill ${toolState.isRapid ? "pill-rapid" : "pill-cutting"}`}>
                  {toolState.isRapid ? "RAPID G0" : "CUTTING G1"}
                </span>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">Depth (Z):</span>
                <span className="telemetry-val">-{toolState.cutDepth.toFixed(2)} mm</span>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">Spindle:</span>
                <span className="telemetry-val">{toolState.spindleRpm} RPM</span>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">Feed Rate:</span>
                <span className="telemetry-val">{toolState.feedRate} mm/min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Toolpath Control Panel */}
        <div className="cad-controls-panel">
          <h3 className="panel-title">CAM Toolpath Cycles</h3>

          <div className="preset-selector">
            {PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`preset-btn ${preset === opt.id ? "is-selected" : ""}`}
                onClick={() => {
                  setPreset(opt.id);
                  setProgress(0);
                }}
              >
                <div className="preset-btn__header">
                  <span className="preset-btn__name">{opt.name}</span>
                </div>
                <div className="preset-btn__desc">{opt.desc}</div>
              </button>
            ))}
          </div>

          <div className="control-divider" />

          <h3 className="panel-title">Playback & Simulation</h3>

          <div className="playback-controls">
            <button
              type="button"
              className="btn-playback"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>
            <button
              type="button"
              className="btn-playback btn-playback--secondary"
              onClick={() => {
                setProgress(0);
                setIsPlaying(true);
              }}
            >
              🔄 Rewind
            </button>
          </div>

          <div className="scrubber-group">
            <div className="scrubber-header">
              <label htmlFor="toolpath-scrubber" className="overlay-label">
                Cycle Progress
              </label>
              <span className="scrubber-val">{Math.round(progress * 100)}%</span>
            </div>
            <input
              id="toolpath-scrubber"
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={progress}
              onChange={(e) => setProgress(parseFloat(e.target.value))}
              className="scrubber-slider"
            />
          </div>

          <div className="speed-group">
            <span className="overlay-label">Speed Multiplier:</span>
            <div className="speed-buttons">
              {[0.5, 1, 2, 4].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`btn-speed ${speed === s ? "is-active" : ""}`}
                  onClick={() => setSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
