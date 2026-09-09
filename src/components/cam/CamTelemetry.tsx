import type {
  Vector3D,
  ToolInfo,
  CamOperation,
  ToolpathSegment,
} from "../../types/cam";
import { formatCoord, formatTime } from "../../lib/camEngine";
import { Gauge, Cpu, Wrench } from "lucide-react";

interface CamTelemetryProps {
  position: Vector3D;
  activeSegment: ToolpathSegment | null;
  activeTool: ToolInfo | null;
  activeOperation: CamOperation | null;
  progress: number;
  currentTime: number;
  totalDuration: number;
  totalDistance: number;
}

export function CamTelemetry({
  position,
  activeSegment,
  activeTool,
  activeOperation,
  progress,
  currentTime,
  totalDuration,
  totalDistance,
}: CamTelemetryProps) {
  const feedrate = activeSegment?.feedRate ?? 0;
  const spindle = activeSegment?.spindleSpeed ?? 0;
  const coolant = activeSegment?.coolant ?? false;
  const motionType = activeSegment?.motionType ?? "rapid";

  const currentDistance = activeSegment
    ? activeSegment.cumulativeDistance - activeSegment.length * (1 - (progress * totalDuration - activeSegment.startTime) / (activeSegment.endTime - activeSegment.startTime || 1))
    : 0;

  const remainingTime = Math.max(0, totalDuration - currentTime);

  return (
    <div className="cam-telemetry">
      {/* DRO Digital Readout Coordinates */}
      <div className="cam-telemetry__card cam-telemetry__dro">
        <div className="cam-telemetry__head">
          <span className="cam-telemetry__title font-mono">DRO · Machine Coordinates (G54)</span>
          <span
            className={`cam-telemetry__motion-badge cam-telemetry__motion-badge--${motionType}`}
          >
            {motionType === "rapid" ? "G0 RAPID" : motionType.toUpperCase()}
          </span>
        </div>

        <div className="cam-telemetry__axis-grid">
          <div className="cam-telemetry__axis">
            <span className="cam-telemetry__axis-label cam-telemetry__axis-label--x">X</span>
            <span className="cam-telemetry__axis-val font-mono">{formatCoord(position.x)}</span>
            <span className="cam-telemetry__axis-unit">mm</span>
          </div>

          <div className="cam-telemetry__axis">
            <span className="cam-telemetry__axis-label cam-telemetry__axis-label--y">Y</span>
            <span className="cam-telemetry__axis-val font-mono">{formatCoord(position.y)}</span>
            <span className="cam-telemetry__axis-unit">mm</span>
          </div>

          <div className="cam-telemetry__axis">
            <span className="cam-telemetry__axis-label cam-telemetry__axis-label--z">Z</span>
            <span className="cam-telemetry__axis-val font-mono">{formatCoord(position.z)}</span>
            <span className="cam-telemetry__axis-unit">mm</span>
          </div>
        </div>
      </div>

      {/* Spindle & Feed Telemetry */}
      <div className="cam-telemetry__card">
        <div className="cam-telemetry__head">
          <span className="cam-telemetry__title">
            <Gauge size={14} /> Feed & Spindle Rate
          </span>
          <span
            className={`cam-telemetry__coolant-badge ${
              coolant ? "cam-telemetry__coolant-badge--on" : ""
            }`}
          >
            {coolant ? "M8 FLOOD" : "M9 COOL OFF"}
          </span>
        </div>

        <div className="cam-telemetry__stat-row">
          <div className="cam-telemetry__stat">
            <span className="cam-telemetry__stat-label">Feedrate (F)</span>
            <span className="cam-telemetry__stat-val font-mono">
              {Math.round(feedrate)}{" "}
              <span className="cam-telemetry__unit">mm/min</span>
            </span>
          </div>

          <div className="cam-telemetry__stat">
            <span className="cam-telemetry__stat-label">Spindle (S)</span>
            <span className="cam-telemetry__stat-val font-mono">
              {spindle.toLocaleString()}{" "}
              <span className="cam-telemetry__unit">RPM</span>
            </span>
          </div>
        </div>
      </div>

      {/* Active Tool & Operation Info */}
      <div className="cam-telemetry__card">
        <div className="cam-telemetry__head">
          <span className="cam-telemetry__title">
            <Wrench size={14} /> Active Tool & Operation
          </span>
          {activeOperation && (
            <span
              className="cam-telemetry__op-chip"
              style={{ backgroundColor: activeOperation.color }}
            >
              {activeOperation.type.toUpperCase()}
            </span>
          )}
        </div>

        <div className="cam-telemetry__tool-info">
          {activeTool ? (
            <div>
              <div className="cam-telemetry__tool-name" style={{ color: activeTool.color }}>
                {activeTool.id} · {activeTool.name}
              </div>
              <div className="cam-telemetry__tool-sub">
                Ø {activeTool.diameter}mm · {activeTool.type} · {activeTool.flutes} Flutes
              </div>
            </div>
          ) : (
            <span className="muted">No active tool</span>
          )}
          {activeOperation && (
            <p className="cam-telemetry__op-desc">{activeOperation.description}</p>
          )}
        </div>
      </div>

      {/* Cut Stats */}
      <div className="cam-telemetry__card">
        <div className="cam-telemetry__head">
          <span className="cam-telemetry__title">
            <Cpu size={14} /> Machining Statistics
          </span>
          <span className="cam-telemetry__time-rem font-mono">
            ETA {formatTime(remainingTime)}
          </span>
        </div>

        <div className="cam-telemetry__stats-grid">
          <div>
            <span className="cam-telemetry__stat-label">Cut Distance</span>
            <span className="cam-telemetry__stat-val font-mono">
              {Math.max(0, currentDistance).toFixed(1)} / {totalDistance.toFixed(1)} mm
            </span>
          </div>

          <div>
            <span className="cam-telemetry__stat-label">Cycle Time</span>
            <span className="cam-telemetry__stat-val font-mono">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
