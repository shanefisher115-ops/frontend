import { useState, useEffect, useRef } from "react";
import type {
  CamDataset,
  PlaybackSpeed,
  VisualOptions,
} from "../../types/cam";
import { CAM_PRESETS } from "../../lib/camPresets";
import { calculatePointAtTime } from "../../lib/camEngine";
import { Cam3DViewer } from "./Cam3DViewer";
import { CamScrubBar } from "./CamScrubBar";
import { CamPlaybackControls } from "./CamPlaybackControls";
import { CamTelemetry } from "./CamTelemetry";
import { CamGCodeViewer } from "./CamGCodeViewer";
import { Box, SlidersHorizontal } from "lucide-react";

export function CamStudio() {
  // Active dataset state
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("adaptive-pocket");
  const [dataset, setDataset] = useState<CamDataset>(() => CAM_PRESETS["adaptive-pocket"]());

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  // Visual option toggles
  const [visualOptions, setVisualOptions] = useState<VisualOptions>({
    showRapidMoves: true,
    showCuttingMoves: true,
    showStock: true,
    showAxes: true,
    showToolMesh: true,
    showCutTrail: true,
    showGrid: true,
  });

  const lastAnimTimeRef = useRef<number | null>(null);
  const wasPlayingBeforeScrubRef = useRef<boolean>(false);

  // Change preset dataset
  const handlePresetChange = (presetKey: string) => {
    if (CAM_PRESETS[presetKey]) {
      setSelectedPresetKey(presetKey);
      const newDs = CAM_PRESETS[presetKey]();
      setDataset(newDs);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  // Toggle visual option key
  const handleToggleVisualOption = (key: keyof VisualOptions) => {
    setVisualOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Derived playback progress (0.0 to 1.0)
  const totalDuration = dataset.totalDuration || 1;
  const progress = Math.max(0, Math.min(1, currentTime / totalDuration));

  // Current cutter position & active segment calculation
  const { position: currentPosition, segmentIndex: activeSegmentIndex } =
    calculatePointAtTime(dataset.segments, currentTime);

  const activeSegment = dataset.segments[activeSegmentIndex] || null;

  const activeTool = activeSegment
    ? dataset.tools.find((t) => t.id === activeSegment.toolId) || null
    : null;

  const activeOperation = activeSegment
    ? dataset.operations.find((o) => o.id === activeSegment.operationId) || null
    : null;

  // Animation playback loop
  useEffect(() => {
    let animId: number;

    const animate = (time: number) => {
      if (lastAnimTimeRef.current !== null && isPlaying) {
        const deltaSec = Math.max(0, (time - lastAnimTimeRef.current) / 1000);
        const advancedTime = Math.max(0, Math.min(totalDuration, currentTime + deltaSec * speed));

        if (advancedTime >= totalDuration) {
          if (isLooping) {
            setCurrentTime(0);
          } else {
            setCurrentTime(totalDuration);
            setIsPlaying(false);
          }
        } else {
          setCurrentTime(advancedTime);
        }
      }
      lastAnimTimeRef.current = time;
      if (isPlaying) {
        animId = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      lastAnimTimeRef.current = null; // Let first frame initialize lastAnimTimeRef without delta
      animId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, currentTime, speed, totalDuration, isLooping]);

  // Spacebar hotkey to toggle Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Scrub bar event handlers
  const handleScrub = (newProgress: number) => {
    const newTime = Math.max(0, Math.min(totalDuration, newProgress * totalDuration));
    setCurrentTime(newTime);
  };

  const handleScrubStart = () => {
    wasPlayingBeforeScrubRef.current = isPlaying;
    setIsPlaying(false);
  };

  const handleScrubEnd = () => {
    if (wasPlayingBeforeScrubRef.current) {
      setIsPlaying(true);
    }
  };

  // Jump to specific G-code line / segment
  const handleSelectGCodeLine = (segmentIdx: number) => {
    const seg = dataset.segments[segmentIdx];
    if (seg) {
      setCurrentTime(seg.startTime);
    }
  };

  return (
    <div className="cam-studio">
      {/* Studio Header & Dataset Selector */}
      <header className="cam-studio__header">
        <div className="cam-studio__brand">
          <div className="cam-studio__logo">
            <Box size={22} className="cam-studio__logo-icon" />
          </div>
          <div>
            <h2 className="cam-studio__title">3D CAM Toolpath Studio</h2>
            <p className="cam-studio__subtitle">
              Real-Time Cutter Synchronization & G-Code Toolpath Scrub Bar
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="cam-studio__preset-selector">
          <label className="cam-studio__preset-label">
            <SlidersHorizontal size={14} /> CAM Preset File:
          </label>
          <select
            className="cam-studio__select"
            value={selectedPresetKey}
            onChange={(e) => handlePresetChange(e.target.value)}
          >
            <option value="adaptive-pocket">3D Adaptive Pocketing & Facing (Aluminum)</option>
            <option value="mold-relief">3D Mold Relief Surface Finishing (Brass)</option>
            <option value="aerospace-housing">Multi-Tool Aerospace Housing (Titanium)</option>
          </select>
        </div>
      </header>

      {/* Main Studio Viewport Grid */}
      <div className="cam-studio__main-grid">
        {/* Left Column: 3D Viewport + Scrub Bar + Playback Controls */}
        <div className="cam-studio__viewport-column">
          <div className="card cam-studio__card-viewer">
            <Cam3DViewer
              dataset={dataset}
              currentPosition={currentPosition}
              activeSegmentIndex={activeSegmentIndex}
              currentTool={activeTool}
              isPlaying={isPlaying}
              visualOptions={visualOptions}
              onToggleVisualOption={handleToggleVisualOption}
            />

            {/* Interactive Timeline Scrub Bar */}
            <CamScrubBar
              dataset={dataset}
              progress={progress}
              currentTime={currentTime}
              onScrub={handleScrub}
              onScrubStart={handleScrubStart}
              onScrubEnd={handleScrubEnd}
            />

            {/* Playback Transport Controls */}
            <CamPlaybackControls
              isPlaying={isPlaying}
              isLooping={isLooping}
              speed={speed}
              onPlayPauseToggle={() => setIsPlaying(!isPlaying)}
              onRewind={() => {
                setCurrentTime(0);
                setIsPlaying(false);
              }}
              onFastForward={() => {
                setCurrentTime(totalDuration);
                setIsPlaying(false);
              }}
              onStepBackward={() => {
                const prevIdx = Math.max(0, activeSegmentIndex - 1);
                setCurrentTime(dataset.segments[prevIdx].startTime);
              }}
              onStepForward={() => {
                const nextIdx = Math.min(dataset.segments.length - 1, activeSegmentIndex + 1);
                setCurrentTime(dataset.segments[nextIdx].startTime);
              }}
              onLoopToggle={() => setIsLooping(!isLooping)}
              onSpeedChange={(newSpeed) => setSpeed(newSpeed)}
            />
          </div>
        </div>

        {/* Right Column: DRO Telemetry & G-Code Code Stream */}
        <div className="cam-studio__telemetry-column">
          <CamTelemetry
            position={currentPosition}
            activeSegment={activeSegment}
            activeTool={activeTool}
            activeOperation={activeOperation}
            progress={progress}
            currentTime={currentTime}
            totalDuration={totalDuration}
            totalDistance={dataset.totalDistance}
          />

          <CamGCodeViewer
            dataset={dataset}
            activeSegmentIndex={activeSegmentIndex}
            onSelectLine={handleSelectGCodeLine}
          />
        </div>
      </div>
    </div>
  );
}
