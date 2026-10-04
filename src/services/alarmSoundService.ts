import type { AlarmAudioState } from '../types';

type StateListener = (state: AlarmAudioState) => void;

class AlarmSoundService {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private isHighTone = false;

  private state: AlarmAudioState = {
    isRinging: false,
    isMuted: false,
    autoplayBlocked: false,
  };

  private listeners: Set<StateListener> = new Set();

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((l) => l(currentState));
  }

  public getState(): AlarmAudioState {
    return { ...this.state };
  }

  private initAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    return this.audioCtx;
  }

  /**
   * Attempts to play the emergency alarm tone.
   * If browser blocks autoplay, updates state.autoplayBlocked = true without throwing.
   */
  public async startAlarm(): Promise<boolean> {
    this.state.isRinging = true;
    this.state.isMuted = false;

    const ctx = this.initAudioContext();
    if (!ctx) {
      this.notify();
      return false;
    }

    try {
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      if (ctx.state === 'suspended') {
        this.state.autoplayBlocked = true;
        this.notify();
        return false;
      }

      this.state.autoplayBlocked = false;
      this.playSirenNodes(ctx);
      this.notify();
      return true;
    } catch {
      this.state.autoplayBlocked = true;
      this.notify();
      return false;
    }
  }

  /**
   * User interaction handler to unlock audio when browser blocked autoplay.
   */
  public async enableAudioFromUserGesture(): Promise<boolean> {
    const ctx = this.initAudioContext();
    if (!ctx) return false;

    try {
      await ctx.resume();
      this.state.autoplayBlocked = false;
      if (this.state.isRinging && !this.state.isMuted) {
        this.playSirenNodes(ctx);
      }
      this.notify();
      return true;
    } catch {
      return false;
    }
  }

  private playSirenNodes(ctx: AudioContext) {
    this.stopNodes();

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      this.oscillator = osc;
      this.gainNode = gain;

      // Pulsed dual-tone warble (800 Hz to 960 Hz)
      this.isHighTone = false;
      this.timer = setInterval(() => {
        if (!this.oscillator || !this.audioCtx) return;
        this.isHighTone = !this.isHighTone;
        const targetFreq = this.isHighTone ? 960 : 800;
        this.oscillator.frequency.setTargetAtTime(targetFreq, this.audioCtx.currentTime, 0.05);
      }, 350);
    } catch {
      // Audio node failure fallback
    }
  }

  private stopNodes() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch {
        // already stopped
      }
      this.oscillator = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {
        // already disconnected
      }
      this.gainNode = null;
    }
  }

  /**
   * Silence the active audible alarm while keeping emergency state intact.
   */
  public silenceAlarm() {
    this.state.isMuted = true;
    this.stopNodes();
    this.notify();
  }

  /**
   * Completely stop and reset the alarm sound.
   */
  public stopAlarm() {
    this.state.isRinging = false;
    this.state.isMuted = false;
    this.state.autoplayBlocked = false;
    this.stopNodes();
    this.notify();
  }
}

export const alarmSoundService = new AlarmSoundService();
export default alarmSoundService;
