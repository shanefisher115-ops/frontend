export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

export interface PixelStreamingStats {
  fps: number;
  latencyMs: number;
  bitrateKbps: number;
  bytesReceived: number;
  packetsLost: number;
  frameWidth: number;
  frameHeight: number;
  codecs: string;
}

export interface PixelStreamingConfig {
  serverUrl: string;
  autoConnect?: boolean;
  enableInput?: boolean;
  enableAudio?: boolean;
  iceServers?: RTCIceServer[];
  offerOptions?: RTCOfferOptions;
}

export interface SignalingMessage {
  type: string;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
  peerConnectionOptions?: {
    iceServers?: RTCIceServer[];
  };
  count?: number;
  [key: string]: unknown;
}

export enum InputMessageType {
  // Key events
  KeyDown = 1,
  KeyUp = 2,
  KeyPress = 3,

  // Mouse events
  MouseMove = 50,
  MouseDown = 51,
  MouseUp = 52,
  MouseWheel = 53,
}

export interface MouseEventData {
  x: number; // Normalized [0, 65535]
  y: number; // Normalized [0, 65535]
  deltaX?: number;
  deltaY?: number;
  button?: number; // 0: Left, 1: Middle, 2: Right
}

export interface KeyboardEventData {
  keyCode: number;
  repeat?: boolean;
  charCode?: number;
}

export interface UIInteractionDescriptor {
  type: "UIInteraction";
  descriptor: Record<string, unknown> | string;
}
