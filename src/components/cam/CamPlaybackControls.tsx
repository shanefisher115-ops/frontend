import type { PlaybackSpeed } from "../../types/cam";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  FastForward,
  Repeat,
} from "lucide-react";

interface CamPlaybackControlsProps {
  isPlaying: boolean;
  isLooping: boolean;
  speed: PlaybackSpeed;
  onPlayPauseToggle: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onLoopToggle: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.25, 0.5, 1, 2, 5, 10];

export function CamPlaybackControls({
  isPlaying,
  isLooping,
  speed,
  onPlayPauseToggle,
  onRewind,
  onFastForward,
  onStepBackward,
  onStepForward,
  onLoopToggle,
  onSpeedChange,
}: CamPlaybackControlsProps) {
  return (
    <div className="cam-controls">
      {/* Primary Transport Controls */}
      <div className="cam-controls__group">
        <button
          type="button"
          className="cam-controls__btn"
          title="Rewind to Start (0%)"
          onClick={onRewind}
        >
          <RotateCcw size={16} />
        </button>

        <button
          type="button"
          className="cam-controls__btn"
          title="Step Backward 1 Segment"
          onClick={onStepBackward}
        >
          <SkipBack size={16} />
        </button>

        <button
          type="button"
          className={`cam-controls__btn cam-controls__btn--play ${
            isPlaying ? "cam-controls__btn--playing" : ""
          }`}
          title={isPlaying ? "Pause Simulation (Space)" : "Play Simulation (Space)"}
          onClick={onPlayPauseToggle}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button
          type="button"
          className="cam-controls__btn"
          title="Step Forward 1 Segment"
          onClick={onStepForward}
        >
          <SkipForward size={16} />
        </button>

        <button
          type="button"
          className="cam-controls__btn"
          title="Jump to End (100%)"
          onClick={onFastForward}
        >
          <FastForward size={16} />
        </button>

        <button
          type="button"
          className={`cam-controls__btn ${
            isLooping ? "cam-controls__btn--active" : ""
          }`}
          title="Toggle Repeat Loop"
          onClick={onLoopToggle}
        >
          <Repeat size={16} />
        </button>
      </div>

      {/* Playback Speed Selector */}
      <div className="cam-controls__speed-group">
        <span className="cam-controls__speed-label">Speed</span>
        <div className="cam-controls__speed-pills">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`cam-controls__speed-pill ${
                speed === s ? "cam-controls__speed-pill--active" : ""
              }`}
              onClick={() => onSpeedChange(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
