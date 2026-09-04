import React, { useEffect, useRef, useState, useCallback } from "react";
import { PixelStreamingClient } from "../../lib/pixelstreaming/PixelStreamingClient";
import { normalizeCoordinates } from "../../lib/pixelstreaming/inputEncoder";
import { PixelStreamingControls } from "./PixelStreamingControls";
import { PixelStreamingStats } from "./PixelStreamingStats";
import type {
  ConnectionState,
  PixelStreamingStats as StatsType,
  PixelStreamingConfig,
} from "../../types/pixelstreaming";

export interface PixelStreamingPlayerProps extends Partial<PixelStreamingConfig> {
  className?: string;
  style?: React.CSSProperties;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onDataChannelMessage?: (data: string | ArrayBuffer) => void;
}

export const PixelStreamingPlayer: React.FC<PixelStreamingPlayerProps> = ({
  serverUrl = "ws://localhost:8888",
  autoConnect = true,
  enableInput = true,
  enableAudio = true,
  iceServers,
  offerOptions,
  className = "",
  style,
  onConnect,
  onDisconnect,
  onError,
  onDataChannelMessage,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<PixelStreamingClient | null>(null);

  const [activeServerUrl, setActiveServerUrl] = useState(serverUrl);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [stats, setStats] = useState<StatsType | null>(null);
  const [isMuted, setIsMuted] = useState(!enableAudio);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(enableInput);
  const [isHovered, setIsHovered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize and connect PixelStreamingClient
  useEffect(() => {
    setErrorMessage(null);
    const client = new PixelStreamingClient(
      {
        serverUrl: activeServerUrl,
        enableInput: inputEnabled,
        enableAudio: !isMuted,
        iceServers,
        offerOptions,
      },
      {
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          if (state === "connected") {
            setErrorMessage(null);
            onConnect?.();
          } else if (state === "disconnected") {
            onDisconnect?.();
          }
        },
        onStream: (stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current
              .play()
              .catch((err) => console.warn("Auto-play interrupted or muted required:", err));
          }
        },
        onStats: (newStats) => {
          setStats(newStats);
        },
        onDataChannelMessage: (data) => {
          onDataChannelMessage?.(data);
        },
        onError: (err) => {
          setErrorMessage(err.message);
          onError?.(err);
        },
      },
    );

    clientRef.current = client;

    if (autoConnect) {
      client.connect();
    }

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [activeServerUrl, autoConnect, iceServers, offerOptions]);

  // Sync mute state to video element and client config
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
    clientRef.current?.setConfig({ enableAudio: !isMuted });
  }, [isMuted]);

  // Sync input state to client config
  useEffect(() => {
    clientRef.current?.setConfig({ enableInput: inputEnabled });
  }, [inputEnabled]);

  // Connection controls
  const handleConnect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  const handleDisconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  const handleServerUrlChange = useCallback((newUrl: string) => {
    setActiveServerUrl(newUrl);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleToggleStats = useCallback(() => {
    setShowStats((prev) => !prev);
  }, []);

  const handleToggleInput = useCallback(() => {
    setInputEnabled((prev) => !prev);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error("Fullscreen request failed:", err));
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch((err) => console.error("Exit fullscreen failed:", err));
    }
  }, []);

  // Sync fullscreen change event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // --- Mouse & Keyboard Event Forwarding ---

  const getNormalizedCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return { x: 0, y: 0 };
    const rect = videoRef.current.getBoundingClientRect();
    const elementX = e.clientX - rect.left;
    const elementY = e.clientY - rect.top;
    return normalizeCoordinates(elementX, elementY, rect.width, rect.height);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!inputEnabled || connectionState !== "connected") return;
    const { x, y } = getNormalizedCoords(e);
    clientRef.current?.sendMouseMove(x, y, e.movementX, e.movementY);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!inputEnabled || connectionState !== "connected") return;
    containerRef.current?.focus();
    const { x, y } = getNormalizedCoords(e);
    clientRef.current?.sendMouseDown(e.button, x, y);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!inputEnabled || connectionState !== "connected") return;
    const { x, y } = getNormalizedCoords(e);
    clientRef.current?.sendMouseUp(e.button, x, y);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!inputEnabled || connectionState !== "connected") return;
    const { x, y } = getNormalizedCoords(e);
    clientRef.current?.sendMouseWheel(e.deltaY, x, y);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!inputEnabled || connectionState !== "connected") return;
    // Avoid handling repeated system hotkeys if container focused
    if (e.key === "Tab") return;
    clientRef.current?.sendKeyDown(e.keyCode || e.which, e.repeat);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!inputEnabled || connectionState !== "connected") return;
    if (e.key === "Tab") return;
    clientRef.current?.sendKeyUp(e.keyCode || e.which);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!inputEnabled || connectionState !== "connected") return;
    clientRef.current?.sendKeyPress(e.charCode);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    // Prevent default context menu so right clicks forward to Unreal Engine
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      className={`ps-player ${isFullscreen ? "ps-player--fullscreen" : ""} ${className}`}
      style={style}
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onKeyPress={handleKeyPress}
      onContextMenu={handleContextMenu}
      aria-label="Pixel Streaming Interactive Canvas"
    >
      <div className="ps-player__viewport">
        <video
          ref={videoRef}
          className="ps-player__video"
          autoPlay
          playsInline
          muted={isMuted}
        />

        {/* Status Badge Overlay */}
        <div className={`ps-player__status-badge ps-player__status-badge--${connectionState}`}>
          <span className="ps-player__status-dot" />
          <span className="ps-player__status-text">
            {connectionState === "connected"
              ? "Connected to Stream"
              : connectionState === "connecting"
              ? "Connecting to Signaling Server..."
              : connectionState === "reconnecting"
              ? "Reconnecting..."
              : connectionState === "failed"
              ? "Connection Failed"
              : "Disconnected"}
          </span>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="ps-player__error-overlay" role="alert">
            <p><strong>Pixel Streaming Error:</strong> {errorMessage}</p>
          </div>
        )}

        {/* Focus & Input Hover Overlay Indicator */}
        {inputEnabled && isHovered && connectionState === "connected" && (
          <div className="ps-player__input-indicator" title="Interactive input active">
            <span>⌨️ Mouse & Keyboard Active</span>
          </div>
        )}

        {/* Stream Statistics Overlay */}
        {showStats && (
          <div className="ps-player__stats-container">
            <PixelStreamingStats stats={stats} />
          </div>
        )}
      </div>

      {/* Control Bar */}
      <PixelStreamingControls
        connectionState={connectionState}
        serverUrl={activeServerUrl}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        showStats={showStats}
        inputEnabled={inputEnabled}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onServerUrlChange={handleServerUrlChange}
        onToggleMute={handleToggleMute}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleStats={handleToggleStats}
        onToggleInput={handleToggleInput}
      />
    </div>
  );
};
