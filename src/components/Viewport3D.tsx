import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import type { Signal, SignalStatus } from "../types/signal";

export interface Viewport3DProps {
  signals: Signal[];
  selectedSignalId?: string | null;
  onSelectSignal?: (signal: Signal | null) => void;
  className?: string;
}

export interface Viewport3DRef {
  resetCamera: () => void;
  toggleAutoRotate: () => void;
}

export type ViewMode = "nodes" | "pillars" | "wireframe";

interface Camera {
  yaw: number; // horizontal angle in radians
  pitch: number; // vertical angle in radians
  distance: number; // distance from target
  target: [number, number, number];
}

interface Node3D {
  signal: Signal;
  x: number;
  y: number; // height (intensity-based)
  z: number;
  radius: number;
  color: string;
  pulsePhase: number;
}

// Map status to color palette
export const STATUS_COLORS: Record<SignalStatus, { hex: string; rgb: [number, number, number] }> = {
  active: { hex: "#34d39e", rgb: [52, 211, 158] },
  degraded: { hex: "#e0a44a", rgb: [224, 164, 74] },
  offline: { hex: "#6b7280", rgb: [107, 114, 128] },
};

/** Compute 3D node spatial positions deterministically from signals */
export function compute3DNodes(signals: Signal[]): Node3D[] {
  if (!signals || signals.length === 0) return [];
  const numSignals = signals.length;
  return signals.map((signal, index) => {
    const angle = (index / numSignals) * Math.PI * 2 + (index % 2) * 0.5;
    const radius = 90 + (index % 3) * 35;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (signal.intensity / 100) * 80 - 20;
    const color = STATUS_COLORS[signal.status]?.hex || "#34d39e";

    return {
      signal,
      x,
      y,
      z,
      radius: 12 + (signal.intensity / 100) * 8,
      color,
      pulsePhase: index * 0.8,
    };
  });
}

export const Viewport3D = forwardRef<Viewport3DRef, Viewport3DProps>(function Viewport3D(
  { signals, selectedSignalId, onSelectSignal, className = "" },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Camera state
  const cameraRef = useRef<Camera>({
    yaw: Math.PI / 4,
    pitch: Math.PI / 6,
    distance: 350,
    target: [0, 0, 0],
  });

  // Controls state
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>("nodes");
  const [hoveredSignal, setHoveredSignal] = useState<Signal | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Dragging state for camera controls
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      cameraRef.current = {
        yaw: Math.PI / 4,
        pitch: Math.PI / 6,
        distance: 350,
        target: [0, 0, 0],
      };
    },
    toggleAutoRotate: () => {
      setAutoRotate((prev) => !prev);
    },
  }));

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  const nodes = React.useMemo(() => compute3DNodes(signals), [signals]);

  // Main 3D Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let startTime = performance.now();

    const render = (now: number) => {
      const time = (now - startTime) / 1000;

      // Handle canvas resize
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Camera auto-rotation
      if (autoRotate && !isDraggingRef.current) {
        cameraRef.current.yaw += 0.005;
      }

      const { yaw, pitch, distance, target } = cameraRef.current;

      // Calculate camera position in 3D
      const camX = target[0] + distance * Math.cos(pitch) * Math.sin(yaw);
      const camY = target[1] + distance * Math.sin(pitch);
      const camZ = target[2] + distance * Math.cos(pitch) * Math.cos(yaw);

      // Camera transformation vectors
      let fx = target[0] - camX;
      let fy = target[1] - camY;
      let fz = target[2] - camZ;
      const fLen = Math.hypot(fx, fy, fz) || 1;
      fx /= fLen;
      fy /= fLen;
      fz /= fLen;

      let ux = 0, uy = 1, uz = 0;

      let rx = uy * fz - uz * fy;
      let ry = uz * fx - ux * fz;
      let rz = ux * fy - uy * fx;
      const rLen = Math.hypot(rx, ry, rz) || 1;
      rx /= rLen;
      ry /= rLen;
      rz /= rLen;

      ux = fy * rz - fz * ry;
      uy = fz * rx - fx * rz;
      uz = fx * ry - fy * rx;

      const cx = width / 2;
      const cy = height / 2;
      const fov = 400;

      const project = (x: number, y: number, z: number): { x: number; y: number; scale: number; depth: number } | null => {
        const dx = x - camX;
        const dy = y - camY;
        const dz = z - camZ;

        const vx = dx * rx + dy * ry + dz * rz;
        const vy = dx * ux + dy * uy + dz * uz;
        const vz = dx * fx + dy * fy + dz * fz;

        if (vz <= 5) return null;

        const scale = fov / vz;
        const screenX = cx + vx * scale;
        const screenY = cy - vy * scale;

        return { x: screenX, y: screenY, scale, depth: vz };
      };

      // 1. Draw Grid Plane (Y = -30)
      if (showGrid) {
        ctx.strokeStyle = "rgba(100, 116, 139, 0.25)";
        ctx.lineWidth = 1;

        const gridSize = 300;
        const gridStep = 50;
        const gridY = -30;

        for (let x = -gridSize; x <= gridSize; x += gridStep) {
          const p1 = project(x, gridY, -gridSize);
          const p2 = project(x, gridY, gridSize);

          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        for (let z = -gridSize; z <= gridSize; z += gridStep) {
          const p1 = project(-gridSize, gridY, z);
          const p2 = project(gridSize, gridY, z);

          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      const projectedNodes = nodes
        .map((node) => {
          const proj = project(node.x, node.y, node.z);
          const projBase = project(node.x, -30, node.z);
          return { node, proj, projBase };
        })
        .filter((item): item is { node: Node3D; proj: NonNullable<typeof item.proj>; projBase: NonNullable<typeof item.projBase> } => item.proj !== null && item.projBase !== null)
        .sort((a, b) => b.proj.depth - a.proj.depth);

      if (viewMode === "wireframe" || viewMode === "nodes") {
        ctx.lineWidth = 1;
        for (let i = 0; i < projectedNodes.length; i++) {
          for (let j = i + 1; j < projectedNodes.length; j++) {
            const n1 = projectedNodes[i];
            const n2 = projectedNodes[j];
            const dist = Math.hypot(n1.node.x - n2.node.x, n1.node.y - n2.node.y, n1.node.z - n2.node.z);

            if (dist < 220) {
              const alpha = (1 - dist / 220) * 0.4;
              ctx.strokeStyle = `rgba(52, 211, 158, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(n1.proj.x, n1.proj.y);
              ctx.lineTo(n2.proj.x, n2.proj.y);
              ctx.stroke();
            }
          }
        }
      }

      projectedNodes.forEach(({ node, proj, projBase }) => {
        const isSelected = selectedSignalId === node.signal.id;
        const isHovered = hoveredSignal?.id === node.signal.id;

        if (viewMode === "pillars" || viewMode === "nodes") {
          ctx.beginPath();
          ctx.moveTo(projBase.x, projBase.y);
          ctx.lineTo(proj.x, proj.y);
          ctx.strokeStyle = isSelected || isHovered ? node.color : "rgba(148, 163, 184, 0.4)";
          ctx.lineWidth = isSelected ? 3 : 1.5;
          ctx.setLineDash(viewMode === "nodes" ? [3, 3] : []);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.beginPath();
          ctx.ellipse(projBase.x, projBase.y, 8 * projBase.scale * 0.05, 4 * projBase.scale * 0.05, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(100, 116, 139, 0.3)";
          ctx.fill();
        }

        const nodeRadius = node.radius * proj.scale * 0.04;
        const pulse = Math.sin(time * 3 + node.pulsePhase) * 0.2 + 1;
        const currentRadius = Math.max(3, nodeRadius * (isSelected ? 1.3 : 1) * pulse);

        const gradient = ctx.createRadialGradient(
          proj.x,
          proj.y,
          0,
          proj.x,
          proj.y,
          currentRadius * (isSelected || isHovered ? 2.5 : 1.8)
        );
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, currentRadius * (isSelected || isHovered ? 2.5 : 1.8), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isSelected ? "#ffffff" : node.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = isSelected || isHovered ? "bold 12px Inter, sans-serif" : "11px Inter, sans-serif";
        ctx.fillStyle = isSelected || isHovered ? "#ffffff" : "rgba(226, 232, 240, 0.85)";
        ctx.textAlign = "center";
        ctx.fillText(node.signal.name, proj.x, proj.y - currentRadius - 8);

        if (isSelected || isHovered) {
          ctx.font = "10px JetBrains Mono, monospace";
          ctx.fillStyle = node.color;
          ctx.fillText(`⚡ ${node.signal.intensity}%`, proj.x, proj.y + currentRadius + 14);
        }
      });

      // 2. Axis Gizmo
      const gizmoCenterX = 50;
      const gizmoCenterY = height - 50;
      const gizmoLen = 25;

      const axes = [
        { dir: [1, 0, 0], color: "#ef4444", label: "X" },
        { dir: [0, 1, 0], color: "#22c55e", label: "Y" },
        { dir: [0, 0, 1], color: "#3b82f6", label: "Z" },
      ];

      axes.forEach(({ dir, color, label }) => {
        const dx = dir[0] * rx + dir[1] * ry + dir[2] * rz;
        const dy = dir[0] * ux + dir[1] * uy + dir[2] * uz;

        const gx = gizmoCenterX + dx * gizmoLen;
        const gy = gizmoCenterY - dy * gizmoLen;

        ctx.beginPath();
        ctx.moveTo(gizmoCenterX, gizmoCenterY);
        ctx.lineTo(gx, gy);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText(label, gx + (dx >= 0 ? 6 : -6), gy + (dy >= 0 ? -4 : 8));
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, autoRotate, showGrid, viewMode, selectedSignalId, hoveredSignal]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      cameraRef.current.yaw -= deltaX * 0.008;
      cameraRef.current.pitch = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(Math.PI / 2 - 0.1, cameraRef.current.pitch + deltaY * 0.008)
      );

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    } else {
      const { yaw, pitch, distance, target } = cameraRef.current;
      const camX = target[0] + distance * Math.cos(pitch) * Math.sin(yaw);
      const camY = target[1] + distance * Math.sin(pitch);
      const camZ = target[2] + distance * Math.cos(pitch) * Math.cos(yaw);

      let fx = target[0] - camX, fy = target[1] - camY, fz = target[2] - camZ;
      const fLen = Math.hypot(fx, fy, fz) || 1;
      fx /= fLen; fy /= fLen; fz /= fLen;

      let ux = 0, uy = 1, uz = 0;
      let rx = uy * fz - uz * fy, ry = uz * fx - ux * fz, rz = ux * fy - uy * fx;
      const rLen = Math.hypot(rx, ry, rz) || 1;
      rx /= rLen; ry /= rLen; rz /= rLen;
      ux = fy * rz - fz * ry; uy = fz * rx - fx * rz; uz = fx * ry - fy * rx;

      const cx = canvas.clientWidth / 2;
      const cy = canvas.clientHeight / 2;
      const fov = 400;

      let foundHover: Signal | null = null;

      for (const node of nodes) {
        const dx = node.x - camX, dy = node.y - camY, dz = node.z - camZ;
        const vx = dx * rx + dy * ry + dz * rz;
        const vy = dx * ux + dy * uy + dz * uz;
        const vz = dx * fx + dy * fy + dz * fz;

        if (vz > 5) {
          const scale = fov / vz;
          const screenX = cx + vx * scale;
          const screenY = cy - vy * scale;
          const distToMouse = Math.hypot(mouseX - screenX, mouseY - screenY);

          if (distToMouse < 20) {
            foundHover = node.signal;
            break;
          }
        }
      }

      setHoveredSignal(foundHover);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    cameraRef.current.distance = Math.max(100, Math.min(700, cameraRef.current.distance + e.deltaY * 0.4));
  };

  const handleClick = () => {
    if (onSelectSignal) {
      onSelectSignal(hoveredSignal);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`viewport3d-container ${isFullscreen ? "viewport3d-container--fullscreen" : ""} ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="viewport3d-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      <div className="viewport3d-hud-top">
        <div className="viewport3d-title-badge">
          <span className="viewport3d-pulse-dot" />
          <span className="viewport3d-title">3D SIGNAL SPATIAL VIEWPORT</span>
          <span className="viewport3d-node-count">{signals.length} Nodes</span>
        </div>

        <div className="viewport3d-mode-selector">
          {(["nodes", "pillars", "wireframe"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`viewport3d-btn ${viewMode === mode ? "viewport3d-btn--active" : ""}`}
              onClick={() => setViewMode(mode)}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="viewport3d-hud-actions">
        <button
          type="button"
          className={`viewport3d-btn ${autoRotate ? "viewport3d-btn--active" : ""}`}
          onClick={() => setAutoRotate((prev) => !prev)}
          title="Toggle Auto-Rotation"
        >
          {autoRotate ? "Pause Orbit" : "Auto Orbit"}
        </button>

        <button
          type="button"
          className={`viewport3d-btn ${showGrid ? "viewport3d-btn--active" : ""}`}
          onClick={() => setShowGrid((prev) => !prev)}
          title="Toggle Grid Plane"
        >
          Grid
        </button>

        <button
          type="button"
          className="viewport3d-btn"
          onClick={() => {
            cameraRef.current = {
              yaw: Math.PI / 4,
              pitch: Math.PI / 6,
              distance: 350,
              target: [0, 0, 0],
            };
          }}
          title="Reset Camera View"
        >
          Reset View
        </button>

        <button
          type="button"
          className="viewport3d-btn"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>

      {(hoveredSignal || selectedSignalId) && (
        <div className="viewport3d-telemetry-panel">
          {(() => {
            const active = hoveredSignal || signals.find((s) => s.id === selectedSignalId);
            if (!active) return null;
            return (
              <>
                <div className="viewport3d-telemetry-head">
                  <span className={`status-chip status-chip--${active.status}`}>
                    {active.status.toUpperCase()}
                  </span>
                  <span className="viewport3d-telemetry-name">{active.name}</span>
                </div>
                <div className="viewport3d-telemetry-body">
                  <div>
                    <span className="muted">Origin:</span> <code>{active.origin}</code>
                  </div>
                  <div>
                    <span className="muted">Intensity:</span> <strong>{active.intensity}%</strong>
                  </div>
                  <div>
                    <span className="muted">Recorded:</span>{" "}
                    {new Date(active.recorded_at).toLocaleTimeString()}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
});
