import { useEffect, useRef } from "react";
import type { CamDataset } from "../../types/cam";
import { Terminal } from "lucide-react";

interface CamGCodeViewerProps {
  dataset: CamDataset;
  activeSegmentIndex: number;
  onSelectLine: (segmentIndex: number) => void;
}

export function CamGCodeViewer({
  dataset,
  activeSegmentIndex,
  onSelectLine,
}: CamGCodeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active line into view
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeSegmentIndex]);

  const activeSegment = dataset.segments[activeSegmentIndex];
  const activeGCodeIndex = activeSegment?.gcodeLineIndex ?? 0;

  return (
    <div className="cam-gcode">
      <div className="cam-gcode__header">
        <span className="cam-gcode__title">
          <Terminal size={14} /> G-Code Block Stream
        </span>
        <span className="cam-gcode__count font-mono">
          {dataset.gcodeLines.length} Lines
        </span>
      </div>

      <div ref={containerRef} className="cam-gcode__stream">
        {dataset.gcodeLines.map((line, idx) => {
          const isActive = idx === activeGCodeIndex;
          const isMove = line.isMove;
          const segmentIdx = line.segmentIndex;

          return (
            <div
              key={line.lineNumber}
              ref={isActive ? activeLineRef : null}
              className={`cam-gcode__line ${
                isActive ? "cam-gcode__line--active" : ""
              } ${isMove ? "cam-gcode__line--move" : ""}`}
              onClick={() => {
                if (segmentIdx !== undefined) {
                  onSelectLine(segmentIdx);
                }
              }}
            >
              <span className="cam-gcode__line-num font-mono">
                N{String(line.lineNumber).padStart(3, "0")}
              </span>

              <span className="cam-gcode__code font-mono">{line.raw}</span>

              {line.comment && (
                <span className="cam-gcode__comment">({line.comment})</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
