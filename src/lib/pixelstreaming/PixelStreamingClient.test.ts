import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PixelStreamingClient } from "./PixelStreamingClient";

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onclose: (() => void) | null = null;
  sentMessages: string[] = [];

  constructor(public url: string) {
    setTimeout(() => this.onopen?.(), 10);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }
}

// Mock DataChannel
class MockRTCDataChannel {
  readyState = "open";
  binaryType = "arraybuffer";
  sentData: any[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: any }) => void) | null = null;
  onerror: ((err: any) => void) | null = null;

  send(data: any) {
    this.sentData.push(data);
  }

  close() {
    this.readyState = "closed";
  }
}

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  connectionState = "connected";
  dataChannel = new MockRTCDataChannel();
  ontrack: ((event: any) => void) | null = null;
  onicecandidate: ((event: any) => void) | null = null;
  ondatachannel: ((event: any) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;

  addTransceiver = vi.fn();
  createDataChannel() {
    return this.dataChannel;
  }
  setRemoteDescription = vi.fn().mockResolvedValue(undefined);
  setLocalDescription = vi.fn().mockResolvedValue(undefined);
  createAnswer = vi.fn().mockResolvedValue({ type: "answer", sdp: "dummy-answer-sdp" });
  addIceCandidate = vi.fn().mockResolvedValue(undefined);
  getStats = vi.fn().mockResolvedValue(
    new Map([
      [
        "report1",
        {
          type: "inbound-rtp",
          kind: "video",
          framesPerSecond: 60,
          bytesReceived: 1048576,
          packetsLost: 2,
          frameWidth: 1920,
          frameHeight: 1080,
        },
      ],
      [
        "report2",
        {
          type: "candidate-pair",
          state: "succeeded",
          currentRoundTripTime: 0.016, // 16ms RTT => 8ms latency
        },
      ],
    ]),
  );
  close() {
    this.connectionState = "closed";
  }
}

describe("PixelStreamingClient", () => {
  beforeEach(() => {
    vi.stubGlobal("WebSocket", MockWebSocket);
    vi.stubGlobal("RTCPeerConnection", MockRTCPeerConnection);
    vi.stubGlobal("RTCSessionDescription", class {
      constructor(public init: any) {}
    });
    vi.stubGlobal("RTCIceCandidate", class {
      constructor(public init: any) {}
    });
    vi.stubGlobal("MediaStream", class {
      tracks: any[] = [];
      addTrack(track: any) {
        this.tracks.push(track);
      }
      getTracks() {
        return this.tracks;
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("connects and handles connection state transitions", () => {
    const onStateChange = vi.fn();
    const client = new PixelStreamingClient(
      { serverUrl: "ws://localhost:8888" },
      { onConnectionStateChange: onStateChange },
    );

    expect(client.getConnectionState()).toBe("disconnected");

    client.connect();
    expect(client.getConnectionState()).toBe("connecting");
    expect(onStateChange).toHaveBeenCalledWith("connecting");

    client.disconnect();
    expect(client.getConnectionState()).toBe("disconnected");
  });

  it("sends binary input events over DataChannel when open", async () => {
    const client = new PixelStreamingClient({ serverUrl: "ws://localhost:8888" });
    client.connect();

    // Trigger config offer message via WebSocket
    const mockWs = (client as any).ws as MockWebSocket;
    mockWs.onmessage?.({
      data: JSON.stringify({
        type: "config",
        peerConnectionOptions: { iceServers: [] },
      }),
    });

    // Verify RTCPeerConnection created
    const mockPc = (client as any).pc as MockRTCPeerConnection;
    expect(mockPc).toBeDefined();

    // Send mouse move
    client.sendMouseMove(32768, 32768, 5, -2);
    expect(mockPc.dataChannel.sentData.length).toBe(1);

    // Send key down
    client.sendKeyDown(65, false);
    expect(mockPc.dataChannel.sentData.length).toBe(2);

    client.disconnect();
  });

  it("handles WebRTC offer from streamer and responds with answer", async () => {
    const client = new PixelStreamingClient({ serverUrl: "ws://localhost:8888" });
    client.connect();

    const mockWs = (client as any).ws as MockWebSocket;
    mockWs.onmessage?.({
      data: JSON.stringify({
        type: "offer",
        sdp: "v=0\r\no=- 12345 2 IN IP4 127.0.0.1...",
      }),
    });

    // Wait for async offer handling
    await new Promise((r) => setTimeout(r, 20));

    // Verify answer message sent back over signaling WebSocket
    const sentAnswer = mockWs.sentMessages.find((msg) => JSON.parse(msg).type === "answer");
    expect(sentAnswer).toBeDefined();
    expect(JSON.parse(sentAnswer!).sdp).toBe("dummy-answer-sdp");

    client.disconnect();
  });

  it("polls WebRTC stats and emits onStats callback when connected", async () => {
    const onStats = vi.fn();
    const client = new PixelStreamingClient(
      { serverUrl: "ws://localhost:8888" },
      { onStats },
    );
    client.connect();

    const mockWs = (client as any).ws as MockWebSocket;
    mockWs.onmessage?.({
      data: JSON.stringify({
        type: "config",
        peerConnectionOptions: { iceServers: [] },
      }),
    });

    const mockPc = (client as any).pc as MockRTCPeerConnection;
    mockPc.onconnectionstatechange?.();

    // Fast-forward stats polling
    (client as any).startStatsPolling();
    await new Promise((r) => setTimeout(r, 1100));

    expect(onStats).toHaveBeenCalled();
    const latestStats = onStats.mock.calls[0][0];
    expect(latestStats.fps).toBe(60);
    expect(latestStats.latencyMs).toBe(8);
    expect(latestStats.frameWidth).toBe(1920);

    client.disconnect();
  });
});
