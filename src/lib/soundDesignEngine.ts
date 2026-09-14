/**
 * Web Audio Sound Design Engine with 3D Binaural HRTF Spatialization
 *
 * Places cutting sounds, spindle hums, and assistant voices at specific 3D coordinates
 * relative to the listener using Web Audio HRTF PannerNodes.
 */

export interface AudioCoordinate3D {
  x: number;
  y: number;
  z: number;
}

export type SoundCategory = 'cutting' | 'spindle' | 'assistant';

export interface SoundEngineOptions {
  sampleRate?: number;
  listenerPosition?: AudioCoordinate3D;
}

/**
 * Default 3D Spatial Coordinates around the listener (0, 0, 0):
 * - Cutting: Front-Left (-1.5m, +0.5m, -1.0m) - CNC / tool tip operation
 * - Spindle: Front-Right (+1.5m, -0.2m, -1.5m) - Rotational motor hum
 * - Assistant: Front-Center elevated (0.0m, +1.2m, -0.8m) - Voice notifications
 */
export const DEFAULT_3D_COORDINATES: Record<SoundCategory, AudioCoordinate3D> = {
  cutting: { x: -1.5, y: 0.5, z: -1.0 },
  spindle: { x: 1.5, y: -0.2, z: -1.5 },
  assistant: { x: 0.0, y: 1.2, z: -0.8 },
};

export class SoundDesignEngine {
  private ctx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private listenerPosition: AudioCoordinate3D = { x: 0, y: 0, z: 0 };

  private categoryPositions: Record<SoundCategory, AudioCoordinate3D> = {
    cutting: { ...DEFAULT_3D_COORDINATES.cutting },
    spindle: { ...DEFAULT_3D_COORDINATES.spindle },
    assistant: { ...DEFAULT_3D_COORDINATES.assistant },
  };

  private categoryPanners: Partial<Record<SoundCategory, PannerNode>> = {};
  private activeSpindleNodes: {
    oscillators: OscillatorNode[];
    gain: GainNode;
    panner: PannerNode;
  } | null = null;

  constructor(options?: SoundEngineOptions) {
    if (options?.listenerPosition) {
      this.listenerPosition = { ...options.listenerPosition };
    }
  }

  /**
   * Initialize or retrieve the Web Audio Context
   */
  public init(): AudioContext {
    if (!this.ctx) {
      const g = typeof window !== 'undefined' ? window : (globalThis as unknown as Window & typeof globalThis);
      const AudioCtxClass =
        g.AudioContext ||
        (g as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext ||
        (globalThis as unknown as { AudioContext: typeof AudioContext }).AudioContext;

      if (!AudioCtxClass) {
        throw new Error('Web Audio API (AudioContext) is not supported in this environment.');
      }

      this.ctx = new AudioCtxClass();

      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGainNode.connect(this.ctx.destination);

      this.updateListenerPosition(this.listenerPosition);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // User interaction might be required
      });
    }

    return this.ctx;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  /**
   * Set Master Volume (0.0 to 1.0)
   */
  public setMasterVolume(volume: number): void {
    if (this.masterGainNode && this.ctx) {
      const clamped = Math.max(0, Math.min(1, volume));
      this.masterGainNode.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
  }

  /**
   * Updates the AudioListener position in 3D space
   */
  public updateListenerPosition(pos: AudioCoordinate3D): void {
    this.listenerPosition = { ...pos };
    if (!this.ctx) return;

    const listener = this.ctx.listener;
    const now = this.ctx.currentTime;

    if (listener.positionX) {
      listener.positionX.setValueAtTime(pos.x, now);
      listener.positionY.setValueAtTime(pos.y, now);
      listener.positionZ.setValueAtTime(pos.z, now);
    } else if (typeof listener.setPosition === 'function') {
      listener.setPosition(pos.x, pos.y, pos.z);
    }
  }

  public getListenerPosition(): AudioCoordinate3D {
    return { ...this.listenerPosition };
  }

  /**
   * Updates the 3D position coordinates for a specific sound category
   */
  public updateSourcePosition(category: SoundCategory, pos: AudioCoordinate3D): void {
    this.categoryPositions[category] = { ...pos };

    const panner = this.categoryPanners[category];
    if (panner && this.ctx) {
      this.applyPositionToPanner(panner, pos);
    }
  }

  public getSourcePosition(category: SoundCategory): AudioCoordinate3D {
    return { ...this.categoryPositions[category] };
  }

  /**
   * Creates a 3D Binaural HRTF PannerNode configured for spatial audio
   */
  public createHRTFPanner(position: AudioCoordinate3D): PannerNode {
    const ctx = this.init();
    const panner = ctx.createPanner();

    // HRTF spatialization settings for 3D binaural effect
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;

    this.applyPositionToPanner(panner, position);

    if (this.masterGainNode) {
      panner.connect(this.masterGainNode);
    }

    return panner;
  }

  private applyPositionToPanner(panner: PannerNode, pos: AudioCoordinate3D): void {
    const now = this.ctx ? this.ctx.currentTime : 0;
    if (panner.positionX) {
      panner.positionX.setValueAtTime(pos.x, now);
      panner.positionY.setValueAtTime(pos.y, now);
      panner.positionZ.setValueAtTime(pos.z, now);
    } else if (typeof panner.setPosition === 'function') {
      panner.setPosition(pos.x, pos.y, pos.z);
    }
  }

  /**
   * Synthesizes and plays a 3D Cutting sound (e.g. CNC, abrasive, high-speed tool operation)
   * at the specified or configured 3D coordinates.
   */
  public playCuttingSound(options?: {
    duration?: number;
    position?: AudioCoordinate3D;
    intensity?: number;
  }): void {
    const ctx = this.init();
    const pos = options?.position || this.categoryPositions.cutting;
    const duration = options?.duration || 0.8;
    const intensity = Math.max(0.1, Math.min(1.5, options?.intensity || 1.0));

    const panner = this.createHRTFPanner(pos);
    this.categoryPanners.cutting = panner;

    const now = ctx.currentTime;

    // Create noise buffer for high-speed cutting sound
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Pink/White noise blend with high amplitude variation
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Highpass + Bandpass filtering to simulate cutting material friction
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2500 * intensity, now);
    filter.Q.setValueAtTime(3.0, now);

    // Resonant metallic pitch oscillation overlay
    const resonantOsc = ctx.createOscillator();
    resonantOsc.type = 'sawtooth';
    resonantOsc.frequency.setValueAtTime(3200 * intensity, now);
    resonantOsc.frequency.exponentialRampToValueAtTime(1800 * intensity, now + duration);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.15 * intensity, now);

    const masterCutGain = ctx.createGain();
    masterCutGain.gain.setValueAtTime(0.01, now);
    masterCutGain.gain.linearRampToValueAtTime(0.6 * intensity, now + 0.05);
    masterCutGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(filter);
    filter.connect(masterCutGain);

    resonantOsc.connect(oscGain);
    oscGain.connect(masterCutGain);

    masterCutGain.connect(panner);

    noiseSource.start(now);
    resonantOsc.start(now);

    noiseSource.stop(now + duration);
    resonantOsc.stop(now + duration);
  }

  /**
   * Starts a continuous 3D Spindle Hum (motor hum with harmonic overtones and LFO modulation)
   * at the specified or configured 3D coordinates.
   */
  public playSpindleHum(options?: {
    rpm?: number;
    position?: AudioCoordinate3D;
  }): void {
    this.stopSpindleHum();

    const ctx = this.init();
    const pos = options?.position || this.categoryPositions.spindle;
    const rpm = options?.rpm || 3600;

    // Calculate fundamental frequency from RPM (e.g., 3600 RPM = 60 Hz)
    const fundamentalFreq = rpm / 60;

    const panner = this.createHRTFPanner(pos);
    this.categoryPanners.spindle = panner;

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.2); // Smooth fade-in

    // Fundamental and harmonic motor frequencies
    const harmonics = [1, 2, 3, 6];
    const oscList: OscillatorNode[] = [];

    harmonics.forEach((harmonic, index) => {
      const osc = ctx.createOscillator();
      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(fundamentalFreq * harmonic, now);

      const hGain = ctx.createGain();
      const hVol = 0.3 / (index + 1);
      hGain.gain.setValueAtTime(hVol, now);

      osc.connect(hGain);
      hGain.connect(gainNode);
      osc.start(now);
      oscList.push(osc);
    });

    // Lowpass filter for warm motor hum resonance
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    gainNode.connect(filter);
    filter.connect(panner);

    this.activeSpindleNodes = {
      oscillators: oscList,
      gain: gainNode,
      panner,
    };
  }

  /**
   * Stops the active Spindle Hum
   */
  public stopSpindleHum(): void {
    if (!this.activeSpindleNodes || !this.ctx) return;

    const { oscillators, gain } = this.activeSpindleNodes;
    const now = this.ctx.currentTime;

    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    setTimeout(() => {
      oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore if already stopped
        }
      });
    }, 350);

    this.activeSpindleNodes = null;
  }

  /**
   * Synthesizes and plays an Assistant Voice notification / formant chime sequence
   * at the specified or configured elevated 3D coordinates.
   */
  public playAssistantVoice(
    textOrTone = 'notification',
    options?: {
      pitch?: number;
      position?: AudioCoordinate3D;
    }
  ): void {
    const ctx = this.init();
    const pos = options?.position || this.categoryPositions.assistant;
    const basePitch = options?.pitch || 440; // A4 default

    const panner = this.createHRTFPanner(pos);
    this.categoryPanners.assistant = panner;

    const now = ctx.currentTime;

    // Voice / Formant sequence frequencies based on prompt string
    const notes =
      textOrTone === 'alert'
        ? [basePitch, basePitch * 1.25, basePitch * 1.5]
        : textOrTone === 'ready'
        ? [basePitch, basePitch * 1.33, basePitch * 1.6, basePitch * 2.0]
        : [basePitch * 1.2, basePitch * 1.5, basePitch * 1.8]; // Default notification sequence

    const noteDuration = 0.12;

    notes.forEach((freq, index) => {
      const startTime = now + index * noteDuration;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Formant filter simulating voice quality
      const formant = ctx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(1000, startTime);
      formant.Q.setValueAtTime(4.0, startTime);

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.001, startTime);
      noteGain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration - 0.01);

      osc.connect(formant);
      formant.connect(noteGain);
      noteGain.connect(panner);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  }

  /**
   * Stop all active sounds and cleanup resources
   */
  public stopAll(): void {
    this.stopSpindleHum();
  }
}

// Singleton instance export
export const soundDesignEngine = new SoundDesignEngine();
