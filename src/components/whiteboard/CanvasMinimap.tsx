import React, { useRef } from "react";
import type { CanvasWidget, CanvasTransform } from "../../types/whiteboard";

interface CanvasMinimapProps {
  widgets: CanvasWidget[];
  transform: CanvasTransform;
  containerSize: { width: number; height: number };
  onPanTo: (canvasX: number, canvasY: number) => void;
}

export function CanvasMinimap({
  widgets,
  transform,
  containerSize,
  onPanTo,
}: CanvasMinimapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  if (widgets.length === 0) return null;

  // Calculate bounding box of all widgets plus buffer
  let minX = -500;
  let minY = -500;
  let maxX = 2000;
  let maxY = 1500;

  widgets.forEach((w) => {
    minX = Math.min(minX, w.x - 200);
    minY = Math.min(minY, w.y - 200);
    maxX = Math.max(maxX, w.x + w.width + 200);
    maxY = Math.max(maxY, w.y + w.height + 200);
  });

  const mapWidth = 180;
  const mapHeight = 120;

  const worldWidth = maxX - minX;
  const worldHeight = maxY - minY;

  const scaleX = mapWidth / worldWidth;
  const scaleY = mapHeight / worldHeight;
  const scale = Math.min(scaleX, scaleY);

  // Viewport rect calculation
  const vpWidthCanvas = containerSize.width / transform.zoom;
  const vpHeightCanvas = containerSize.height / transform.zoom;
  const vpXCanvas = -transform.x / transform.zoom;
  const vpYCanvas = -transform.y / transform.zoom;

  const vpRect = {
    x: (vpXCanvas - minX) * scale,
    y: (vpYCanvas - minY) * scale,
    w: vpWidthCanvas * scale,
    h: vpHeightCanvas * scale,
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetCanvasX = minX + clickX / scale - vpWidthCanvas / 2;
    const targetCanvasY = minY + clickY / scale - vpHeightCanvas / 2;

    onPanTo(targetCanvasX, targetCanvasY);
  };

  return (
    <div className="wb-minimap" ref={mapRef} onClick={handleClick} title="Click to jump on canvas">
      <div className="wb-minimap__content">
        {widgets.map((w) => {
          const rx = (w.x - minX) * scale;
          const ry = (w.y - minY) * scale;
          const rw = Math.max(4, w.width * scale);
          const rh = Math.max(3, w.height * scale);

          return (
            <div
              key={w.id}
              className={`wb-minimap__node wb-minimap__node--${w.type} ${
                w.isPinned ? "wb-minimap__node--pinned" : ""
              }`}
              style={{
                left: `${rx}px`,
                top: `${ry}px`,
                width: `${rw}px`,
                height: `${rh}px`,
              }}
            />
          );
        })}

        {/* Viewport Box */}
        <div
          className="wb-minimap__viewport"
          style={{
            left: `${vpRect.x}px`,
            top: `${vpRect.y}px`,
            width: `${vpRect.w}px`,
            height: `${vpRect.h}px`,
          }}
        />
      </div>
      <div className="wb-minimap__badge">{widgets.length} items</div>
    </div>
  );
}
