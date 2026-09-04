import type {
  PixelStreamingConfig,
  PixelStreamingStats,
  ConnectionState,
  SignalingMessage,
} from "../../types/pixelstreaming";
import {
  encodeMouseMove,
  encodeMouseDown,
  encodeMouseUp,
  encodeMouseWheel,
  encodeKeyDown,
  encodeKeyUp,
  encodeKeyPress,
  encodeUIInteraction,
} from "./inputEncoder";

export interface PixelStreamingCallbacks {
  onConnectionStateChange?: (state: ConnectionState) => void;
  onStream?: (stream: MediaStream) => void;
  onStats?: (stats: PixelStreamingStats) => void;
  onDataChannelMessage?: (data: string | ArrayBuffer) => void;
  onError?: (error: Error) => void;
}

export class PixelStreamingClient {
  private config: PixelStreamingConfig;
  private callbacks: PixelStreamingCallbacks;

  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private mediaStream: MediaStream = new MediaStream();

  private connectionState: ConnectionState = "disconnected";
  private statsIntervalId: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastBytesReceived = 0;
  private lastStatsTimestamp = 0;
  private isIntentionallyClosed = false;

  constructor(config: PixelStreamingConfig, callbacks: PixelStreamingCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public getMediaStream(): MediaStream {
    return this.mediaStream;
  }

  public connect(): void {
    this.isIntentionallyClosed = false;
    this.updateState("connecting");
    this.connectWebSocket();
  }

  public disconnect(): void {
    this.isIntentionallyClosed = true;
    this.cleanup();
    this.updateState("disconnected");
  }

  public setConfig(config: Partial<PixelStreamingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // --- Input forwarders ---

  public sendMouseMove(x: number, y: number, deltaX = 0, deltaY = 0): void {
    if (!this.config.enableInput && this.config.enableInput !== undefined) return;
    const bytes = encodeMouseMove(x, y, deltaX, deltaY);
    this.sendData(bytes.buffer);
  }

  public sendMouseDown(button: number, x: number, y: number): void {
    if (!this.config.enableInput && this.config.enableInput !== undefined) return;
    const bytes = encodeMouseDown(button, x, y);
    this.sendData(bytes.buffer);
  }

  public sendMouseUp(button: number, x: number, y: number): void {
    if (!this.config.enableInput && this.config.enableInput !== undefined) return;
    const bytes = encodeMouseUp(button, x, y);
    this.sendData(bytes.buffer);
  }

  public sendMouseWheel(deltaY: number, x: number, y: number): void {
    if (!this.config.enableInput && this.config.enableInput !== undefined) return;
    const bytes = encodeMouseWheel(deltaY, x, y);
    this.sendData(bytes.buffer);
  }

  public sendKeyDown(keyCode: number, isRepeat = false): void {
    if (!this.config.enableInput && this.config.enableInput !== undefined) return;
    const bytes = encodeKeyDown(keyCode, isRepeat);
    this.sendData(bytes.buffer);
  }

  public sendKeyUp(keyCode: number): void {
    if (!this.config.enableInput && this.config.enableInput !== undefined) return;
    const bytes = encodeKeyUp(keyCode);
    this.sendData(bytes.buffer);
  }

  public sendKeyPress(charCode: number): void {
    if (!this.config.enableInput && this.config.enableInput !== undefined) return;
    const bytes = encodeKeyPress(charCode);
    this.sendData(bytes.buffer);
  }

  public sendUIInteraction(descriptor: Record<string, unknown> | string): void {
    if (!this.config.enableInput && this.config.enableInput !== undefined) return;
    const jsonStr = encodeUIInteraction(descriptor);
    this.sendData(jsonStr);
  }

  public sendData(data: ArrayBufferLike | string): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      try {
        this.dataChannel.send(data as any);
      } catch (err) {
        console.error("Error sending data over WebRTC DataChannel:", err);
      }
    }
  }

  // --- WebSocket Signaling ---

  private connectWebSocket(): void {
    try {
      this.ws = new WebSocket(this.config.serverUrl);
    } catch (err) {
      this.handleError(err as Error);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      // WebSocket open
    };

    this.ws.onmessage = async (event) => {
      try {
        const msg: SignalingMessage = JSON.parse(event.data);
        await this.handleSignalingMessage(msg);
      } catch (err) {
        console.error("Error parsing signaling message:", err);
      }
    };

    this.ws.onerror = () => {
      this.handleError(new Error(`WebSocket error on ${this.config.serverUrl}`));
    };

    this.ws.onclose = () => {
      if (!this.isIntentionallyClosed) {
        this.updateState("reconnecting");
        this.scheduleReconnect();
      }
    };
  }

  private async handleSignalingMessage(msg: SignalingMessage): Promise<void> {
    switch (msg.type) {
      case "config":
        await this.setupPeerConnection(msg.peerConnectionOptions?.iceServers);
        break;

      case "offer":
        if (msg.sdp) {
          if (!this.pc) {
            await this.setupPeerConnection();
          }
          await this.handleOffer(msg.sdp);
        }
        break;

      case "answer":
        if (msg.sdp && this.pc) {
          await this.pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: msg.sdp }));
        }
        break;

      case "iceCandidate":
        if (msg.candidate && this.pc) {
          try {
            await this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (err) {
            console.warn("Failed to add ICE candidate:", err);
          }
        }
        break;

      case "ping":
        this.sendSignalingMessage({ type: "pong" });
        break;

      default:
        break;
    }
  }

  private sendSignalingMessage(msg: SignalingMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  // --- PeerConnection Setup ---

  private async setupPeerConnection(serverIceServers?: RTCIceServer[]): Promise<void> {
    if (this.pc) return;

    const iceServers = serverIceServers || this.config.iceServers || [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];

    const configuration: RTCConfiguration = {
      iceServers,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    };

    this.pc = new RTCPeerConnection(configuration);

    // Audio / Video transceivers for low-latency receiving
    this.pc.addTransceiver("video", { direction: "recvonly" });
    if (this.config.enableAudio !== false) {
      this.pc.addTransceiver("audio", { direction: "recvonly" });
    }

    // Setup DataChannel
    this.dataChannel = this.pc.createDataChannel("datachannel", { ordered: true });
    this.setupDataChannel(this.dataChannel);

    this.pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };

    this.pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.mediaStream = event.streams[0];
      } else {
        this.mediaStream.addTrack(event.track);
      }
      if (this.callbacks.onStream) {
        this.callbacks.onStream(this.mediaStream);
      }
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: "iceCandidate",
          candidate: event.candidate,
        });
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (!this.pc) return;
      switch (this.pc.connectionState) {
        case "connected":
          this.updateState("connected");
          this.startStatsPolling();
          break;
        case "disconnected":
        case "failed":
          if (!this.isIntentionallyClosed) {
            this.updateState("failed");
            this.scheduleReconnect();
          }
          break;
        case "connecting":
          this.updateState("connecting");
          break;
      }
    };
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;
    this.dataChannel.binaryType = "arraybuffer";

    this.dataChannel.onopen = () => {
      // DataChannel opened
    };

    this.dataChannel.onmessage = (event) => {
      if (this.callbacks.onDataChannelMessage) {
        this.callbacks.onDataChannelMessage(event.data);
      }
    };

    this.dataChannel.onerror = (err) => {
      console.error("DataChannel error:", err);
    };
  }

  private async handleOffer(sdp: string): Promise<void> {
    if (!this.pc) return;

    await this.pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp }));
    const answer = await this.pc.createAnswer(this.config.offerOptions);
    await this.pc.setLocalDescription(answer);

    this.sendSignalingMessage({
      type: "answer",
      sdp: answer.sdp,
    });
  }

  // --- WebRTC Stats & Monitoring ---

  private startStatsPolling(): void {
    this.stopStatsPolling();
    this.lastBytesReceived = 0;
    this.lastStatsTimestamp = Date.now();

    this.statsIntervalId = setInterval(async () => {
      if (!this.pc || this.pc.connectionState !== "connected") return;

      try {
        const stats = await this.pc.getStats();
        let fps = 0;
        let latencyMs = 0;
        let bitrateKbps = 0;
        let bytesReceived = 0;
        let packetsLost = 0;
        let frameWidth = 0;
        let frameHeight = 0;
        let codecs = "";

        const now = Date.now();
        const timeDiffSec = (now - this.lastStatsTimestamp) / 1000;

        stats.forEach((report) => {
          if (report.type === "inbound-rtp" && report.kind === "video") {
            fps = report.framesPerSecond || fps;
            bytesReceived = report.bytesReceived || bytesReceived;
            packetsLost = report.packetsLost || packetsLost;
            frameWidth = report.frameWidth || frameWidth;
            frameHeight = report.frameHeight || frameHeight;

            if (timeDiffSec > 0 && this.lastBytesReceived > 0) {
              const bytesDiff = bytesReceived - this.lastBytesReceived;
              bitrateKbps = Math.round((bytesDiff * 8) / (timeDiffSec * 1000));
            }
          }

          if (report.type === "candidate-pair" && report.state === "succeeded") {
            if (typeof report.currentRoundTripTime === "number") {
              latencyMs = Math.round((report.currentRoundTripTime * 1000) / 2);
            }
          }

          if (report.type === "codec") {
            if (report.mimeType) {
              codecs = report.mimeType.replace("video/", "").replace("audio/", "");
            }
          }
        });

        this.lastBytesReceived = bytesReceived;
        this.lastStatsTimestamp = now;

        const metrics: PixelStreamingStats = {
          fps,
          latencyMs,
          bitrateKbps,
          bytesReceived,
          packetsLost,
          frameWidth,
          frameHeight,
          codecs,
        };

        if (this.callbacks.onStats) {
          this.callbacks.onStats(metrics);
        }
      } catch (err) {
        // Ignore errors during stats collection
      }
    }, 1000);
  }

  private stopStatsPolling(): void {
    if (this.statsIntervalId) {
      clearInterval(this.statsIntervalId);
      this.statsIntervalId = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed || this.reconnectTimeoutId) return;

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;
      if (!this.isIntentionallyClosed) {
        this.cleanup();
        this.connect();
      }
    }, 3000);
  }

  private updateState(newState: ConnectionState): void {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      if (this.callbacks.onConnectionStateChange) {
        this.callbacks.onConnectionStateChange(newState);
      }
    }
  }

  private handleError(error: Error): void {
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  private cleanup(): void {
    this.stopStatsPolling();

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.dataChannel) {
      try {
        this.dataChannel.close();
      } catch (e) {
        // ignore
      }
      this.dataChannel = null;
    }

    if (this.pc) {
      try {
        this.pc.close();
      } catch (e) {
        // ignore
      }
      this.pc = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = new MediaStream();
    }
  }
}
