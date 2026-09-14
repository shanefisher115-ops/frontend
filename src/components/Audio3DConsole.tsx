import { useState } from "react";
import {
  soundDesignEngine,
  DEFAULT_3D_COORDINATES,
  type AudioCoordinate3D,
  type SoundCategory,
} from "../lib/soundDesignEngine";

export function Audio3DConsole() {
  const [isSpindleRunning, setIsSpindleRunning] = useState(false);
  const [positions, setPositions] = useState<Record<SoundCategory, AudioCoordinate3D>>({
    cutting: { ...DEFAULT_3D_COORDINATES.cutting },
    spindle: { ...DEFAULT_3D_COORDINATES.spindle },
    assistant: { ...DEFAULT_3D_COORDINATES.assistant },
  });

  const handlePlayCutting = () => {
    soundDesignEngine.playCuttingSound();
  };

  const handleToggleSpindle = () => {
    if (isSpindleRunning) {
      soundDesignEngine.stopSpindleHum();
      setIsSpindleRunning(false);
    } else {
      soundDesignEngine.playSpindleHum();
      setIsSpindleRunning(true);
    }
  };

  const handlePlayAssistant = (type: "notification" | "ready" | "alert") => {
    soundDesignEngine.playAssistantVoice(type);
  };

  const handleCoordChange = (
    category: SoundCategory,
    axis: "x" | "y" | "z",
    value: number
  ) => {
    const updated = {
      ...positions[category],
      [axis]: value,
    };
    setPositions((prev) => ({
      ...prev,
      [category]: updated,
    }));
    soundDesignEngine.updateSourcePosition(category, updated);
  };

  const handleReset = () => {
    setPositions({
      cutting: { ...DEFAULT_3D_COORDINATES.cutting },
      spindle: { ...DEFAULT_3D_COORDINATES.spindle },
      assistant: { ...DEFAULT_3D_COORDINATES.assistant },
    });
    soundDesignEngine.updateSourcePosition("cutting", DEFAULT_3D_COORDINATES.cutting);
    soundDesignEngine.updateSourcePosition("spindle", DEFAULT_3D_COORDINATES.spindle);
    soundDesignEngine.updateSourcePosition("assistant", DEFAULT_3D_COORDINATES.assistant);
  };

  return (
    <section className="card audio-3d-card">
      <div className="connection-card__head">
        <h2 className="card__title">3D Binaural Spatial Audio (HRTF)</h2>
        <span className="mode-pill mode-pill--live">HRTF Panner Active</span>
      </div>
      <p className="connection-card__desc">
        Web Audio Engine placing spatial sounds at specific 3D coordinates around the listener at origin (0, 0, 0).
      </p>

      <div className="audio-triggers">
        <div className="trigger-group">
          <label className="trigger-label">Cutting Sound</label>
          <button
            type="button"
            className="audio-btn"
            onClick={handlePlayCutting}
          >
            🔊 Play Cutting Sound
          </button>
        </div>

        <div className="trigger-group">
          <label className="trigger-label">Spindle Hum</label>
          <button
            type="button"
            className={`audio-btn ${isSpindleRunning ? "audio-btn--active" : ""}`}
            onClick={handleToggleSpindle}
          >
            {isSpindleRunning ? "⏹ Stop Spindle Hum" : "🌀 Start Spindle Hum"}
          </button>
        </div>

        <div className="trigger-group">
          <label className="trigger-label">Assistant Voice</label>
          <div className="btn-row">
            <button
              type="button"
              className="audio-btn audio-btn--small"
              onClick={() => handlePlayAssistant("notification")}
            >
              💬 Chime
            </button>
            <button
              type="button"
              className="audio-btn audio-btn--small"
              onClick={() => handlePlayAssistant("ready")}
            >
              ✅ Ready
            </button>
            <button
              type="button"
              className="audio-btn audio-btn--small"
              onClick={() => handlePlayAssistant("alert")}
            >
              ⚠️ Alert
            </button>
          </div>
        </div>
      </div>

      <div className="coords-panel">
        <div className="coords-head">
          <h3>3D Spatial Coordinates (x, y, z)</h3>
          <button
            type="button"
            className="reset-btn"
            onClick={handleReset}
          >
            Reset Positions
          </button>
        </div>

        <div className="coords-grid">
          {(["cutting", "spindle", "assistant"] as SoundCategory[]).map((cat) => (
            <div key={cat} className="coord-box">
              <strong className="coord-box__title">
                {cat === "cutting"
                  ? "Cutting Tool"
                  : cat === "spindle"
                  ? "Spindle Motor"
                  : "Assistant Voice"}
              </strong>
              <div className="coord-inputs">
                {(["x", "y", "z"] as const).map((axis) => (
                  <label key={axis} className="coord-label">
                    <span>{axis.toUpperCase()}:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={positions[cat][axis]}
                      onChange={(e) =>
                        handleCoordChange(cat, axis, parseFloat(e.target.value) || 0)
                      }
                      className="coord-input"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
