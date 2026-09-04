import React, { useState } from "react";
import type { ConnectionState } from "../../types/pixelstreaming";

interface PixelStreamingControlsProps {
  connectionState: ConnectionState;
  serverUrl: string;
  isMuted: boolean;
  isFullscreen: boolean;
  showStats: boolean;
  inputEnabled: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onServerUrlChange: (url: string) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onToggleStats: () => void;
  onToggleInput: () => void;
}

export const PixelStreamingControls: React.FC<PixelStreamingControlsProps> = ({
  connectionState,
  serverUrl,
  isMuted,
  isFullscreen,
  showStats,
  inputEnabled,
  onConnect,
  onDisconnect,
  onServerUrlChange,
  onToggleMute,
  onToggleFullscreen,
  onToggleStats,
  onToggleInput,
}) => {
  const [urlInput, setUrlInput] = useState(serverUrl);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim() !== serverUrl) {
      onServerUrlChange(urlInput.trim());
    }
  };

  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting" || connectionState === "reconnecting";

  return (
    <div className="ps-controls" role="toolbar" aria-label="Pixel Streaming Controls">
      <form className="ps-controls__url-form" onSubmit={handleUrlSubmit}>
        <input
          type="text"
          className="ps-controls__input"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="ws://localhost:8888 or wss://..."
          aria-label="Pixel Streaming Signaling Server URL"
        />
        <button
          type="submit"
          className="ps-button ps-button--secondary"
          disabled={urlInput.trim() === serverUrl && isConnected}
        >
          Set URL
        </button>
      </form>

      <div className="ps-controls__actions">
        {isConnected || isConnecting ? (
          <button
            type="button"
            className="ps-button ps-button--danger"
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            className="ps-button ps-button--primary"
            onClick={onConnect}
          >
            Connect
          </button>
        )}

        <button
          type="button"
          className={`ps-button ${isMuted ? "ps-button--active" : ""}`}
          onClick={onToggleMute}
          title={isMuted ? "Unmute Audio" : "Mute Audio"}
          aria-label={isMuted ? "Unmute Audio" : "Mute Audio"}
        >
          {isMuted ? "🔇 Muted" : "🔊 Audio"}
        </button>

        <button
          type="button"
          className={`ps-button ${inputEnabled ? "ps-button--active" : ""}`}
          onClick={onToggleInput}
          title={inputEnabled ? "Disable Input Forwarding" : "Enable Input Forwarding"}
          aria-label={inputEnabled ? "Disable Input Forwarding" : "Enable Input Forwarding"}
        >
          {inputEnabled ? "⌨️ Input On" : "🚫 Input Off"}
        </button>

        <button
          type="button"
          className={`ps-button ${showStats ? "ps-button--active" : ""}`}
          onClick={onToggleStats}
          title="Toggle Stream Diagnostics & Stats"
          aria-label="Toggle Stats"
        >
          📊 Stats
        </button>

        <button
          type="button"
          className="ps-button"
          onClick={onToggleFullscreen}
          title="Toggle Fullscreen Mode"
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? "↙️ Exit Fullscreen" : "⛶ Fullscreen"}
        </button>
      </div>
    </div>
  );
};
