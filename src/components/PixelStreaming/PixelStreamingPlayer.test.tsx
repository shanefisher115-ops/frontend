// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PixelStreamingPlayer } from "./PixelStreamingPlayer";
import { PixelStreamingControls } from "./PixelStreamingControls";
import { PixelStreamingStats } from "./PixelStreamingStats";

// Mock WebSocket and WebRTC globals
class MockWebSocket {
  static OPEN = 1;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn();
}

class MockRTCPeerConnection {
  connectionState = "connected";
  addTransceiver = vi.fn();
  createDataChannel = vi.fn().mockReturnValue({
    readyState: "open",
    send: vi.fn(),
    close: vi.fn(),
  });
  close = vi.fn();
  getStats = vi.fn().mockResolvedValue(new Map());
}

describe("PixelStreaming UI Components", () => {
  beforeEach(() => {
    vi.stubGlobal("WebSocket", MockWebSocket);
    vi.stubGlobal("RTCPeerConnection", MockRTCPeerConnection);
    vi.stubGlobal("RTCSessionDescription", class { constructor(public init: any) {} });
    vi.stubGlobal("RTCIceCandidate", class { constructor(public init: any) {} });
    vi.stubGlobal("MediaStream", class {
      getTracks() { return []; }
    });

    // HTMLVideoElement play mock
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("PixelStreamingStats Component", () => {
    it("renders empty stats message when stats are null", () => {
      render(<PixelStreamingStats stats={null} />);
      expect(screen.getByText(/Gathering WebRTC statistics/i)).toBeInTheDocument();
    });

    it("renders metrics grid when stats are provided", () => {
      const mockStats = {
        fps: 60,
        latencyMs: 12,
        bitrateKbps: 4500,
        bytesReceived: 1048576,
        packetsLost: 0,
        frameWidth: 1920,
        frameHeight: 1080,
        codecs: "H264",
      };

      render(<PixelStreamingStats stats={mockStats} />);
      expect(screen.getByText("12 ms")).toBeInTheDocument();
      expect(screen.getByText("60")).toBeInTheDocument();
      expect(screen.getByText("1920x1080")).toBeInTheDocument();
      expect(screen.getByText("4.5 Mbps")).toBeInTheDocument();
      expect(screen.getByText("H264")).toBeInTheDocument();
    });
  });

  describe("PixelStreamingControls Component", () => {
    it("triggers callbacks when control buttons are clicked", () => {
      const onConnect = vi.fn();
      const onDisconnect = vi.fn();
      const onToggleMute = vi.fn();
      const onToggleStats = vi.fn();
      const onToggleInput = vi.fn();
      const onToggleFullscreen = vi.fn();
      const onServerUrlChange = vi.fn();

      render(
        <PixelStreamingControls
          connectionState="disconnected"
          serverUrl="ws://localhost:8888"
          isMuted={false}
          isFullscreen={false}
          showStats={false}
          inputEnabled={true}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          onServerUrlChange={onServerUrlChange}
          onToggleMute={onToggleMute}
          onToggleFullscreen={onToggleFullscreen}
          onToggleStats={onToggleStats}
          onToggleInput={onToggleInput}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Connect" }));
      expect(onConnect).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /Mute Audio/i }));
      expect(onToggleMute).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /Toggle Stats/i }));
      expect(onToggleStats).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /Disable Input Forwarding/i }));
      expect(onToggleInput).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /Toggle Fullscreen/i }));
      expect(onToggleFullscreen).toHaveBeenCalledTimes(1);
    });
  });

  describe("PixelStreamingPlayer Component", () => {
    it("renders player component with video viewport and controls", () => {
      render(<PixelStreamingPlayer autoConnect={false} serverUrl="ws://localhost:8888" />);

      expect(screen.getByLabelText("Pixel Streaming Interactive Canvas")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Connect" })).toBeInTheDocument();
    });

    it("allows toggling stats overlay", () => {
      render(<PixelStreamingPlayer autoConnect={false} />);

      const statsButton = screen.getByRole("button", { name: /Toggle Stats/i });
      fireEvent.click(statsButton);

      expect(screen.getByText(/Stream Diagnostics/i)).toBeInTheDocument();
    });
  });
});
