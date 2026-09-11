import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SoundDesignEngine,
  DEFAULT_3D_COORDINATES,
  type AudioCoordinate3D,
} from "./soundDesignEngine";

// Web Audio Mocks
class MockAudioParam {
  value = 0;
  setValueAtTime = vi.fn((val: number) => {
    this.value = val;
  });
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class MockAudioNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockPannerNode extends MockAudioNode {
  panningModel = "equalpower";
  distanceModel = "inverse";
  refDistance = 1;
  maxDistance = 10000;
  rolloffFactor = 1;
  coneInnerAngle = 360;
  positionX = new MockAudioParam();
  positionY = new MockAudioParam();
  positionZ = new MockAudioParam();
  setPosition = vi.fn((x: number, y: number, z: number) => {
    this.positionX.value = x;
    this.positionY.value = y;
    this.positionZ.value = z;
  });
}

class MockAudioListener {
  positionX = new MockAudioParam();
  positionY = new MockAudioParam();
  positionZ = new MockAudioParam();
  setPosition = vi.fn((x: number, y: number, z: number) => {
    this.positionX.value = x;
    this.positionY.value = y;
    this.positionZ.value = z;
  });
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}

class MockOscillatorNode extends MockAudioNode {
  type = "sine";
  frequency = new MockAudioParam();
  start = vi.fn();
  stop = vi.fn();
}

class MockBiquadFilterNode extends MockAudioNode {
  type = "lowpass";
  frequency = new MockAudioParam();
  Q = new MockAudioParam();
}

class MockBufferSourceNode extends MockAudioNode {
  buffer: unknown = null;
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioBuffer {
  length: number;
  sampleRate: number;
  numberOfChannels: number;
  private channelData: Float32Array;

  constructor(options: { numberOfChannels: number; length: number; sampleRate: number }) {
    this.numberOfChannels = options.numberOfChannels;
    this.length = options.length;
    this.sampleRate = options.sampleRate;
    this.channelData = new Float32Array(options.length);
  }

  getChannelData() {
    return this.channelData;
  }
}

class MockAudioContext {
  state = "running";
  currentTime = 0;
  sampleRate = 44100;
  destination = new MockAudioNode();
  listener = new MockAudioListener();

  resume = vi.fn().mockResolvedValue(undefined);
  createGain = vi.fn(() => new MockGainNode());
  createPanner = vi.fn(() => new MockPannerNode());
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createBiquadFilter = vi.fn(() => new MockBiquadFilterNode());
  createBufferSource = vi.fn(() => new MockBufferSourceNode());
  createBuffer = vi.fn(
    (channels: number, length: number, sampleRate: number) =>
      new MockAudioBuffer({ numberOfChannels: channels, length, sampleRate })
  );
}

beforeEach(() => {
  vi.stubGlobal("AudioContext", MockAudioContext);
  if (typeof window !== "undefined") {
    (window as unknown as { AudioContext: unknown }).AudioContext = MockAudioContext;
  } else {
    vi.stubGlobal("window", { AudioContext: MockAudioContext });
  }
});

describe("SoundDesignEngine", () => {
  it("should initialize with default listener and 3D coordinates", () => {
    const engine = new SoundDesignEngine();
    expect(engine.getListenerPosition()).toEqual({ x: 0, y: 0, z: 0 });
    expect(engine.getSourcePosition("cutting")).toEqual(DEFAULT_3D_COORDINATES.cutting);
    expect(engine.getSourcePosition("spindle")).toEqual(DEFAULT_3D_COORDINATES.spindle);
    expect(engine.getSourcePosition("assistant")).toEqual(DEFAULT_3D_COORDINATES.assistant);
  });

  it("should initialize AudioContext on demand and set up HRTF panner", () => {
    const engine = new SoundDesignEngine();
    const ctx = engine.init();
    expect(ctx).toBeDefined();

    const customPos: AudioCoordinate3D = { x: -2.0, y: 1.0, z: -3.0 };
    const panner = engine.createHRTFPanner(customPos);

    expect(panner.panningModel).toBe("HRTF");
    expect(panner.positionX.value).toBe(-2.0);
    expect(panner.positionY.value).toBe(1.0);
    expect(panner.positionZ.value).toBe(-3.0);
  });

  it("should update listener position in 3D space", () => {
    const engine = new SoundDesignEngine();
    engine.init();

    const newListenerPos: AudioCoordinate3D = { x: 0.5, y: 1.8, z: 0.2 };
    engine.updateListenerPosition(newListenerPos);

    expect(engine.getListenerPosition()).toEqual(newListenerPos);
  });

  it("should update source position dynamically for sound categories", () => {
    const engine = new SoundDesignEngine();
    const newCuttingPos: AudioCoordinate3D = { x: -3.0, y: 0.0, z: -2.0 };

    engine.updateSourcePosition("cutting", newCuttingPos);
    expect(engine.getSourcePosition("cutting")).toEqual(newCuttingPos);
  });

  it("should synthesize and play cutting sound at 3D coordinates", () => {
    const engine = new SoundDesignEngine();
    expect(() => engine.playCuttingSound({ duration: 0.5, intensity: 1.2 })).not.toThrow();
  });

  it("should play and stop spindle hum with fundamental motor frequencies", () => {
    const engine = new SoundDesignEngine();
    expect(() => engine.playSpindleHum({ rpm: 3000 })).not.toThrow();
    expect(() => engine.stopSpindleHum()).not.toThrow();
  });

  it("should play assistant voice notification with formant sequence", () => {
    const engine = new SoundDesignEngine();
    expect(() => engine.playAssistantVoice("ready", { pitch: 520 })).not.toThrow();
    expect(() => engine.playAssistantVoice("alert")).not.toThrow();
  });

  it("should update master volume safely", () => {
    const engine = new SoundDesignEngine();
    engine.init();
    expect(() => engine.setMasterVolume(0.5)).not.toThrow();
  });

  it("should handle stopAll cleanly", () => {
    const engine = new SoundDesignEngine();
    engine.playSpindleHum();
    expect(() => engine.stopAll()).not.toThrow();
  });
});
