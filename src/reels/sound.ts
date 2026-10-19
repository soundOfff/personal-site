/**
 * The shared synthesized sound kit. No audio files: every cue is built with
 * the Web Audio API, through one limiter so overlapping cues never clip.
 *
 * - The AudioContext starts lazily, and only after the visitor has interacted
 *   with the page (browsers refuse audio before a gesture anyway).
 * - Muting is one switch, persisted, and every primitive is a no-op while muted.
 * - Beds (rain, drones, hums) are registered so mute and reel changes can stop them.
 *
 * Vocabulary shared by every reel (keep the names stable):
 *   tick 9ms hover · click 35ms press · pop on · drop off · type one key ·
 *   chime done · whoosh panel · swipe reveal · wood(i) pitched step ·
 *   cueTicks the two cue marks · projector(dur) the reel change whirr.
 */

import { SOUND_KEY } from './registry';

export interface ToneOpts {
  f0: number;
  f1?: number;
  dur?: number;
  vol?: number;
  at?: number;
  type?: OscillatorType;
  dest?: AudioNode;
}

export interface BurstOpts {
  dur: number;
  f?: number;
  q?: number;
  vol?: number;
  at?: number;
  kind?: BiquadFilterType;
  dest?: AudioNode;
}

export interface Bed {
  stop(fade?: number): void;
}

type Listener = (muted: boolean) => void;

export class SoundKit {
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private verbs = new Map<number, ConvolverNode>();
  private beds = new Set<Bed>();
  private listeners = new Set<Listener>();
  private _muted = false;
  private gestured = false;

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      this._muted = localStorage.getItem(SOUND_KEY) === 'off';
    } catch {
      /* storage blocked: default on */
    }
    const unlock = () => {
      this.gestured = true;
      if (this.ac?.state === 'suspended') void this.ac.resume();
    };
    for (const ev of ['pointerdown', 'keydown', 'touchstart'] as const) {
      window.addEventListener(ev, unlock, { capture: true, passive: true });
    }
  }

  get muted(): boolean {
    return this._muted;
  }

  setMuted(muted: boolean): void {
    if (muted === this._muted) return;
    if (muted) this.drop();
    this._muted = muted;
    try {
      localStorage.setItem(SOUND_KEY, muted ? 'off' : 'on');
    } catch {
      /* ignore */
    }
    if (muted) this.stopBeds();
    if (this.master && this.ac) {
      const t = this.ac.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(muted ? 0 : 0.7, t, 0.05);
    }
    this.listeners.forEach((l) => l(muted));
    if (!muted) this.pop();
  }

  onChange(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** The live context, or null while muted / before the first gesture. */
  ctx(): AudioContext | null {
    if (this._muted || typeof window === 'undefined') return null;
    const activated =
      this.gestured ||
      (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
        ?.hasBeenActive;
    if (!this.ac && !activated) return null;
    try {
      if (!this.ac) {
        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ac = new Ctor();
      }
      if (this.ac.state === 'suspended') void this.ac.resume();
      return this.ac;
    } catch {
      return null;
    }
  }

  /** The master input (a gentle limiter). Only call after ctx() returned a context. */
  out(): AudioNode {
    const ac = this.ac!;
    if (!this.limiter) {
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 20;
      comp.ratio.value = 6;
      comp.attack.value = 0.002;
      comp.release.value = 0.08;
      const g = ac.createGain();
      g.gain.value = 0.7;
      comp.connect(g);
      g.connect(ac.destination);
      this.limiter = comp;
      this.master = g;
    }
    return this.limiter;
  }

  /** A shared reverb send of `seconds` length (cached per length). */
  reverb(seconds = 1.4): AudioNode {
    const ac = this.ac!;
    let cv = this.verbs.get(seconds);
    if (!cv) {
      const len = Math.floor(ac.sampleRate * seconds);
      const ir = ac.createBuffer(2, len, ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      }
      cv = ac.createConvolver();
      cv.buffer = ir;
      cv.connect(this.out());
      this.verbs.set(seconds, cv);
    }
    return cv;
  }

  noise(dur: number): AudioBufferSourceNode {
    const ac = this.ac!;
    const n = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, n, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    return src;
  }

  tone(o: ToneOpts): void {
    const ac = this.ctx();
    if (!ac) return;
    const t = ac.currentTime + (o.at ?? 0);
    const dur = o.dur ?? 0.05;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1 && o.f1 !== o.f0)
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol ?? 0.2, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(o.dest ?? this.out());
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  burst(o: BurstOpts): void {
    const ac = this.ctx();
    if (!ac) return;
    const t = ac.currentTime + (o.at ?? 0);
    const n = this.noise(o.dur);
    const f = ac.createBiquadFilter();
    f.type = o.kind ?? 'bandpass';
    f.frequency.value = o.f ?? 2000;
    f.Q.value = o.q ?? 0.9;
    const g = ac.createGain();
    g.gain.setValueAtTime(o.vol ?? 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    n.connect(f);
    f.connect(g);
    g.connect(o.dest ?? this.out());
    n.start(t);
  }

  /** A plucked string (saw + square through a closing lowpass). */
  pluck(freq: number, at = 0, vol = 0.07, dest?: AudioNode): void {
    const ac = this.ctx();
    if (!ac) return;
    const t = ac.currentTime + at;
    const o1 = ac.createOscillator();
    o1.type = 'sawtooth';
    o1.frequency.value = freq;
    const o2 = ac.createOscillator();
    o2.type = 'square';
    o2.frequency.value = freq * 2.003;
    const g2 = ac.createGain();
    g2.gain.value = 0.25;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 2;
    lp.frequency.setValueAtTime(7000, t);
    lp.frequency.exponentialRampToValueAtTime(900, t + 0.25);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o1.connect(lp);
    o2.connect(g2);
    g2.connect(lp);
    lp.connect(g);
    g.connect(dest ?? this.out());
    o1.start(t);
    o2.start(t);
    o1.stop(t + 1);
    o2.stop(t + 1);
  }

  /**
   * Start a looping bed. `start` builds the graph on the live context and
   * returns how to stop it. The bed stops on mute, on `signal` abort, or via
   * the returned handle. Returns null when sound is off.
   */
  bed(start: (ac: AudioContext, out: AudioNode) => Bed, signal?: AbortSignal): Bed | null {
    const ac = this.ctx();
    if (!ac || signal?.aborted) return null;
    const inner = start(ac, this.out());
    const handle: Bed = {
      stop: (fade) => {
        if (!this.beds.delete(handle)) return;
        try {
          inner.stop(fade);
        } catch {
          /* already stopped */
        }
      },
    };
    this.beds.add(handle);
    signal?.addEventListener('abort', () => handle.stop(0.4), { once: true });
    return handle;
  }

  stopBeds(fade = 0.3): void {
    [...this.beds].forEach((b) => b.stop(fade));
  }

  /* ---------- the shared vocabulary ---------- */

  tick(): void {
    this.tone({ f0: 1800, f1: 1200, dur: 0.009, vol: 0.05 });
  }
  click(): void {
    this.burst({ dur: 0.03, f: 2600, vol: 0.25 });
    this.tone({ f0: 180, f1: 90, dur: 0.045, vol: 0.18 });
  }
  pop(): void {
    this.tone({ f0: 320, f1: 880, dur: 0.07, vol: 0.14 });
  }
  drop(): void {
    this.tone({ f0: 620, f1: 160, dur: 0.09, vol: 0.12 });
  }
  type(): void {
    this.burst({ dur: 0.012, f: 3200 + Math.random() * 1400, q: 1.4, vol: 0.1 });
  }
  chime(): void {
    (
      [
        [523.25, 0],
        [659.25, 0.07],
        [987.77, 0.14],
      ] as const
    ).forEach(([f, at]) => this.tone({ type: 'triangle', f0: f, dur: 0.38, vol: 0.09, at }));
  }
  wood(i = 0): void {
    const f = 440 * Math.pow(2, (i % 10) / 12);
    this.tone({ f0: f * 2, f1: f, dur: 0.06, vol: 0.14 });
    this.tone({ type: 'triangle', f0: f * 4, f1: f * 2.5, dur: 0.03, vol: 0.04 });
  }
  cueTicks(): void {
    this.tone({ f0: 1500, f1: 1100, dur: 0.012, vol: 0.08 });
    this.tone({ f0: 1500, f1: 1100, dur: 0.012, vol: 0.08, at: 0.13 });
  }
  whoosh(): void {
    this.sweep(0.22, 'lowpass', [300, 5000, 400], 0.14);
  }
  swipe(): void {
    this.sweep(0.16, 'bandpass', [900, 3800], 0.12);
  }
  /** The reel-change whirr: 24 fps shutter flutter over band-passed noise, plus a thump. */
  projector(dur = 1.9): void {
    const ac = this.ctx();
    if (!ac) return;
    const t = ac.currentTime;
    const n = this.noise(dur);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1300;
    bp.Q.value = 0.9;
    const amp = ac.createGain();
    amp.gain.value = 0.5;
    const lfo = ac.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 24;
    const lg = ac.createGain();
    lg.gain.value = 0.45;
    lfo.connect(lg);
    lg.connect(amp.gain);
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.09, t + 0.15);
    env.gain.setValueAtTime(0.09, t + dur - 0.35);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp);
    bp.connect(amp);
    amp.connect(env);
    env.connect(this.out());
    n.start(t);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
    this.tone({ f0: 80, f1: 42, dur: 0.14, vol: 0.25 });
  }

  private sweep(dur: number, kind: BiquadFilterType, freqs: number[], vol: number): void {
    const ac = this.ctx();
    if (!ac) return;
    const t = ac.currentTime;
    const n = this.noise(dur);
    const f = ac.createBiquadFilter();
    f.type = kind;
    f.Q.value = kind === 'bandpass' ? 1.1 : 0.7;
    f.frequency.setValueAtTime(freqs[0], t);
    freqs.slice(1).forEach((hz, i) => {
      f.frequency.exponentialRampToValueAtTime(hz, t + (dur * (i + 1)) / freqs.length);
    });
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f);
    f.connect(g);
    g.connect(this.out());
    n.start(t);
  }
}

/** The one kit for the page. */
export const sound = new SoundKit();
