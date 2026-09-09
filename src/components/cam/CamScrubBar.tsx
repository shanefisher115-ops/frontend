import { useRef, useState } from "react";
import type { CamDataset } from "../../types/cam";
import { formatTime } from "../../lib/camEngine";

interface CamScrubBarProps {
  dataset: CamDataset;
  progress: number; // 0 to 1
  currentTime: number; // seconds
  onScrub: (progress: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
}

export function CamScrubBar({
  dataset,
  progress,
  currentTime,
  onScrub,
  onScrubStart,
  onScrubEnd,
}: CamScrubBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    time: number;
    opName: string;
    opColor: string;
  } | null>(null);

  const totalDuration = dataset.totalDuration || 1;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    onScrubStart?.();
    e.currentTarget.setPointerCapture(e.pointerId);
    updateScrub(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const hoverProgress = relX / rect.width;
    const hoverTime = hoverProgress * totalDuration;

    // Find operation at hover time
    const hoverSegIdx = dataset.segments.findIndex(
      (s) => hoverTime >= s.startTime && hoverTime <= s.endTime
    );

    let opName = "Movement Pass";
    let opColor = "#38bdf8";

    if (hoverSegIdx !== -1) {
      const seg = dataset.segments[hoverSegIdx];
      const op = dataset.operations.find((o) => o.id === seg.operationId);
      if (op) {
        opName = op.name;
        opColor = op.color;
      }
    }

    setHoverInfo({ x: relX, time: hoverTime, opName, opColor });

    if (e.buttons === 1) {
      updateScrub(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onScrubEnd?.();
  };

  const updateScrub = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, relX / rect.width));
    onScrub(newProgress);
  };

  return (
    <div className="cam-scrub">
      {/* Scrub Bar Timeline Container */}
      <div
        ref={trackRef}
        className="cam-scrub__track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setHoverInfo(null)}
      >
        {/* Operation Color Segments Background Track */}
        <div className="cam-scrub__op-track">
          {dataset.operations.map((op) => {
            const startSeg = dataset.segments[op.startSegmentIndex];
            const endSeg = dataset.segments[op.endSegmentIndex];
            if (!startSeg || !endSeg) return null;

            const startPct = (startSeg.startTime / totalDuration) * 100;
            const endPct = (endSeg.endTime / totalDuration) * 100;
            const widthPct = Math.max(0.5, endPct - startPct);

            return (
              <div
                key={op.id}
                className="cam-scrub__op-segment"
                style={{
                  left: `${startPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: op.color,
                }}
                title={op.name}
              />
            );
          })}
        </div>

        {/* Elapsed Progress Fill Bar */}
        <div
          className="cam-scrub__fill"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />

        {/* Scrub Handle / Needle */}
        <div
          className="cam-scrub__handle"
          style={{ left: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        >
          <div className="cam-scrub__handle-head" />
        </div>

        {/* Hover Tooltip */}
        {hoverInfo && (
          <div
            className="cam-scrub__tooltip"
            style={{ left: `${hoverInfo.x}px` }}
          >
            <span
              className="cam-scrub__tooltip-op"
              style={{ color: hoverInfo.opColor }}
            >
              {hoverInfo.opName}
            </span>
            <span className="cam-scrub__tooltip-time">
              {formatTime(hoverInfo.time)}
            </span>
          </div>
        )}
      </div>

      {/* Scrub Time Indicators */}
      <div className="cam-scrub__labels">
        <span className="cam-scrub__time-current">
          {formatTime(currentTime)}
        </span>
        <span className="cam-scrub__pct font-mono">
          {(progress * 100).toFixed(1)}%
        </span>
        <span className="cam-scrub__time-total">
          {formatTime(totalDuration)}
        </span>
      </div>
    </div>
  );
}
