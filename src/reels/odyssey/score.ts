/**
 * Reel 05 · 2001: A Space Odyssey: the score. Every sound the reel makes,
 * after the concert music Kubrick laid on the film: Richard Strauss's sunrise
 * (an organ pedal, trumpets climbing in open fifths, timpani) for the title,
 * a Viennese waltz on harp and strings for the station, Khachaturian's lonely
 * adagio for the centrifuge, Ligeti's drifting choir for the monolith, his
 * string clusters for the entr'acte and the star gate, and HAL's last song
 * for a fault. The console (ticks, clunks, beeps) is the ship's foley;
 * it stays electronic, tuned to C so it sits inside every key the music uses
 * (C, its relative A minor, the waltz's G).
 */
import type { Bed, SoundKit } from '../sound';
import type { ReelScore } from '../types';

/** Section index → act index (I, II, II, III, III, III·M, III·M, IV, IV). */
export const ACT_OF = [0, 1, 1, 2, 2, 3, 3, 4, 4];

/** MIDI note → Hz */
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const whole = (n: number | undefined, lo: number, hi: number, fallback: number) =>
  n === undefined || !Number.isFinite(n) ? fallback : Math.min(hi, Math.max(lo, Math.round(n)));

/* ============================================================
   shared plumbing
   ============================================================ */

/** a cue's bus: straight into the limiter, with a reverb send */
function bus(S: SoundKit, ac: AudioContext, wet: number, sec = 2.2, vol = 1): GainNode {
  const g = ac.createGain();
  g.gain.value = vol;
  g.connect(S.out());
  const w = ac.createGain();
  w.gain.value = wet;
  g.connect(w);
  w.connect(S.reverb(sec));
  return g;
}

/** fade a bus out from now */
function fadeOut(ac: AudioContext, g: GainNode, fade: number): void {
  const t = ac.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + fade);
}

const NOISE_S = 3;
const noiseBufs = new Map<number, AudioBuffer>();
/** three seconds of white noise, rendered once per sample rate */
function noiseBuf(ac: BaseAudioContext): AudioBuffer {
  let b = noiseBufs.get(ac.sampleRate);
  if (!b) {
    const n = Math.floor(ac.sampleRate * NOISE_S);
    b = ac.createBuffer(1, n, ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    noiseBufs.set(ac.sampleRate, b);
  }
  return b;
}
/** a slice of the cached noise, from `t` for `dur` seconds (≤ 3) */
function hiss(ac: AudioContext, t: number, dur: number): AudioBufferSourceNode {
  const src = ac.createBufferSource();
  src.buffer = noiseBuf(ac);
  src.start(t, Math.random() * Math.max(0, NOISE_S - dur));
  src.stop(t + dur);
  return src;
}

/* ============================================================
   the console: the ship's foley, tuned to C
   ============================================================ */

/** C6 D6 E6 G6 A6: a pentatonic on C, inside the sunrise's C and the waltz's G alike */
const CONSOLE = [84, 86, 88, 91, 93].map(hz);

/** the console tick: G down to C */
export const tick = (S: SoundKit) => S.tone({ f0: 1568, f1: 1046.5, dur: 0.009, vol: 0.05 });
/** the console clunk: a relay closing */
export const clunk = (S: SoundKit) => {
  S.burst({ dur: 0.03, kind: 'lowpass', f: 900, vol: 0.3 });
  S.tone({ f0: 160, f1: 90, dur: 0.06, vol: 0.18 });
};
/** the two-tone console beep: a step of the console scale, then its fifth */
export const beep2 = (S: SoundKit, i: number, at = 0) => {
  const f = CONSOLE[Math.abs(Math.round(i)) % CONSOLE.length];
  S.tone({ type: 'square', f0: f, dur: 0.05, vol: 0.03, at });
  S.tone({ type: 'square', f0: f * 1.5, dur: 0.05, vol: 0.025, at: at + 0.07 });
};
/** the act beep: each act a step up the console, the dawn on C */
export const actBeep = (S: SoundKit, section?: number) => beep2(S, ACT_OF[whole(section, 0, 8, 0)]);
/** a blip between two sections of one act */
export const blip = (S: SoundKit) => S.tone({ f0: 1568, f1: 1760, dur: 0.04, vol: 0.025 });
/** the panel opening: a clunk and a beep */
export const panelClunk = (S: SoundKit) => {
  clunk(S);
  beep2(S, 1, 0.06);
};
/** one digit of a metric scrambling */
export const dataTick = (S: SoundKit) =>
  S.tone({ type: 'square', f0: 3000 + Math.random() * 2400, dur: 0.006, vol: 0.018 });
/** the lede's sweep, C up to G */
export const sweep = (S: SoundKit) => S.tone({ f0: 2093, f1: 3136, dur: 0.12, vol: 0.03 });
/** a memory module pulled from HAL */
export const thunk = (S: SoundKit) => {
  S.burst({ dur: 0.05, kind: 'lowpass', f: 380, vol: 0.32 });
  S.tone({ f0: 190, f1: 120, dur: 0.09, vol: 0.14 });
  S.tone({ type: 'triangle', f0: 1480, dur: 0.12, vol: 0.02, at: 0.01 });
};
/** back across the match cut: noise falling through a band-pass */
export const whooshBack = (S: SoundKit) => {
  const ac = S.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const n = hiss(ac, t, 0.3);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1;
  bp.frequency.setValueAtTime(3200, t);
  bp.frequency.exponentialRampToValueAtTime(300, t + 0.28);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.1, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  n.connect(bp);
  bp.connect(g);
  g.connect(S.out());
};
/** the suit's breathing in the pod bay: in, a catch, out */
export const breath = (S: SoundKit) => {
  const ac = S.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const n = hiss(ac, t, 2.4);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(700, t);
  bp.frequency.linearRampToValueAtTime(1100, t + 0.8);
  bp.frequency.linearRampToValueAtTime(500, t + 2.2);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.7);
  g.gain.exponentialRampToValueAtTime(0.004, t + 1.05);
  g.gain.exponentialRampToValueAtTime(0.045, t + 1.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.3);
  n.connect(bp);
  bp.connect(g);
  g.connect(S.out());
};

/* ============================================================
   the orchestra
   ============================================================ */

/** a trumpet: detuned saws, a lip blat in the lowpass, a quarter-tone scoop, late vibrato */
function trumpet(
  ac: AudioContext,
  dest: AudioNode,
  f: number,
  t: number,
  dur: number,
  vol: number,
  release = 0.45,
): void {
  const end = t + Math.max(dur, 0.25);
  const off = end + release + 0.05;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol * 0.8, t + 0.045);
  g.gain.linearRampToValueAtTime(vol, end);
  g.gain.exponentialRampToValueAtTime(0.0001, end + release);
  const top = Math.min(6000, f * 12);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 1.4;
  lp.frequency.setValueAtTime(f * 1.5, t);
  lp.frequency.exponentialRampToValueAtTime(top, t + 0.05);
  lp.frequency.exponentialRampToValueAtTime(top * 0.55, t + 0.24);
  lp.frequency.linearRampToValueAtTime(top * 0.75, end);
  lp.frequency.exponentialRampToValueAtTime(f * 2, end + release);
  const bell = ac.createBiquadFilter();
  bell.type = 'peaking';
  bell.frequency.value = 1400;
  bell.Q.value = 1;
  bell.gain.value = 4;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 110;
  const mix = ac.createGain();
  mix.gain.value = 0.36;
  mix.connect(lp);
  lp.connect(bell);
  bell.connect(hp);
  hp.connect(g);
  g.connect(dest);
  const vib = ac.createOscillator();
  vib.frequency.value = 5.2 + Math.random() * 0.5;
  const vd = ac.createGain();
  vd.gain.setValueAtTime(0, t);
  vd.gain.setValueAtTime(0, t + 0.25);
  vd.gain.linearRampToValueAtTime(7, t + 0.6);
  vib.connect(vd);
  vib.start(t);
  vib.stop(off);
  [0.9966, 1, 1.0032].forEach((m) => {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f * m;
    o.detune.setValueAtTime(-50, t);
    o.detune.setTargetAtTime(0, t, 0.022);
    vd.connect(o.detune);
    o.connect(mix);
    o.start(t);
    o.stop(off);
  });
  // the lip: a breath of noise as the note speaks
  const n = hiss(ac, t, 0.06);
  const nb = ac.createBiquadFilter();
  nb.type = 'bandpass';
  nb.frequency.value = Math.min(4000, f * 3);
  nb.Q.value = 1.2;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(vol * 0.5, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  n.connect(nb);
  nb.connect(ng);
  ng.connect(dest);
}

const organWaves = new WeakMap<BaseAudioContext, PeriodicWave>();
/** the pedal's drawbars: 16′, 8′, 5⅓′, 4′, a little 2⅔′ and 2′ */
function organWave(ac: AudioContext): PeriodicWave {
  let w = organWaves.get(ac);
  if (!w) {
    const imag = new Float32Array([0, 1, 0.62, 0.38, 0.3, 0, 0.14, 0, 0.1]);
    w = ac.createPeriodicWave(new Float32Array(imag.length), imag);
    organWaves.set(ac, w);
  }
  return w;
}
/** an organ pedal: additive pipes on the drawbar ratios, two ranks a hair apart, swelling in */
function organ(
  ac: AudioContext,
  dest: AudioNode,
  f: number,
  t: number,
  dur: number,
  vol: number,
  swell: number,
): void {
  const end = t + dur;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + swell);
  g.gain.setValueAtTime(vol, end);
  g.gain.exponentialRampToValueAtTime(0.0001, end + 0.8);
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 40;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  hp.connect(lp);
  lp.connect(g);
  g.connect(dest);
  [
    [1, 0.6],
    [1.0011, 0.4],
  ].forEach(([m, lvl]) => {
    const o = ac.createOscillator();
    o.setPeriodicWave(organWave(ac));
    o.frequency.value = f * m;
    const og = ac.createGain();
    og.gain.value = lvl;
    o.connect(og);
    og.connect(hp);
    o.start(t);
    o.stop(end + 0.85);
  });
}

/** a timpano: a tuned sine sagging as the head settles, inharmonic modes, a felt thud */
function timp(ac: AudioContext, dest: AudioNode, f: number, t: number, vol: number): void {
  const g = ac.createGain();
  g.gain.value = vol;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 40;
  g.connect(hp);
  hp.connect(dest);
  (
    [
      [1, 1, 1.3],
      [1.5, 0.45, 0.75],
      [1.98, 0.28, 0.5],
      [2.44, 0.12, 0.32],
    ] as const
  ).forEach(([r, a, d]) => {
    const o = ac.createOscillator();
    o.frequency.setValueAtTime(f * r * 1.035, t);
    o.frequency.exponentialRampToValueAtTime(f * r, t + 0.12);
    const m = ac.createGain();
    m.gain.setValueAtTime(0.0001, t);
    m.gain.exponentialRampToValueAtTime(a, t + 0.005);
    m.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(m);
    m.connect(g);
    o.start(t);
    o.stop(t + d + 0.05);
  });
  (
    [
      ['lowpass', 300, 0.8, 0.1],
      ['bandpass', 1200, 0.12, 0.025],
    ] as const
  ).forEach(([kind, fq, a, d]) => {
    const n = hiss(ac, t, d + 0.01);
    const bf = ac.createBiquadFilter();
    bf.type = kind;
    bf.frequency.value = fq;
    const m = ac.createGain();
    m.gain.setValueAtTime(a, t);
    m.gain.exponentialRampToValueAtTime(0.0001, t + d);
    n.connect(bf);
    bf.connect(m);
    m.connect(g);
  });
}

interface Bow {
  /** seconds to bow in */
  attack?: number;
  release?: number;
  /** vibrato depth in cents once the bow settles (0 for none) */
  vib?: number;
  /** scales the lowpass */
  bright?: number;
}
/** soft strings: detuned saws, a lowpass that opens with the bow, vibrato once it settles */
function strings(
  ac: AudioContext,
  dest: AudioNode,
  fs: number[],
  t: number,
  dur: number,
  vol: number,
  bow: Bow = {},
): void {
  const a = bow.attack ?? 0.12;
  const r = bow.release ?? 0.35;
  const end = t + Math.max(dur, a);
  const off = end + r + 0.05;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, end);
  g.gain.exponentialRampToValueAtTime(0.0001, end + r);
  const cut = Math.min(5200, (900 + Math.max(...fs) * 2.4) * (bow.bright ?? 1));
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.6;
  lp.frequency.setValueAtTime(cut * 0.5, t);
  lp.frequency.linearRampToValueAtTime(cut, t + a + 0.06);
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 70;
  const spread = fs.length > 1 ? [0.9953, 1.0047] : [0.9944, 1, 1.0057];
  const mix = ac.createGain();
  mix.gain.value = 0.62 / Math.sqrt(fs.length * spread.length);
  mix.connect(hp);
  hp.connect(lp);
  lp.connect(g);
  g.connect(dest);
  const depth = bow.vib ?? 9;
  let vd: GainNode | null = null;
  if (depth > 0 && dur > 0.3) {
    const vib = ac.createOscillator();
    vib.frequency.value = 5.3 + Math.random() * 0.5;
    vd = ac.createGain();
    vd.gain.setValueAtTime(0, t);
    vd.gain.setValueAtTime(0, t + a * 0.6 + 0.12);
    vd.gain.linearRampToValueAtTime(depth, t + a + 0.45);
    vib.connect(vd);
    vib.start(t);
    vib.stop(off);
  }
  for (const f of fs) {
    for (const m of spread) {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f * m;
      if (vd) vd.connect(o.detune);
      o.connect(mix);
      o.start(t);
      o.stop(off);
    }
  }
}

const harpBufs = new Map<string, AudioBuffer>();
/** a harp string: Karplus–Strong, rendered offline once per pitch and sample rate */
function harpBuf(ac: BaseAudioContext, f: number): AudioBuffer {
  const sr = ac.sampleRate;
  const key = `${sr}:${f.toFixed(2)}`;
  const hit = harpBufs.get(key);
  if (hit) return hit;
  const t60 = Math.min(2.8, Math.max(0.9, 3.2 - f / 500));
  const n = Math.floor(sr * (t60 * 0.65 + 0.1));
  const y = new Float32Array(n);
  // the two-point average adds half a sample to the loop
  const d = sr / f - 0.5;
  const rho = Math.pow(0.001, 1 / (t60 * f));
  const p = Math.ceil(d) + 1;
  // a finger's pluck: one period of softened noise, its DC removed (softer down low)
  const soft = Math.min(0.7, 0.25 + f / 2000);
  let lp = 0;
  let mean = 0;
  for (let i = 0; i < p; i++) {
    lp += soft * (Math.random() * 2 - 1 - lp);
    y[i] = lp;
    mean += lp;
  }
  mean /= p;
  for (let i = 0; i < p; i++) y[i] -= mean;
  for (let i = p; i < n; i++) {
    const a = i - d;
    const k = Math.floor(a);
    const fr = a - k;
    const s0 = y[k] + (y[k + 1] - y[k]) * fr;
    const s1 = y[k - 1] + (y[k] - y[k - 1]) * fr;
    y[i] = rho * 0.5 * (s0 + s1);
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(y[i]));
  const fade = Math.floor(sr * 0.06);
  const s = 0.9 / (peak || 1);
  for (let i = 0; i < n; i++) y[i] *= s * (i > n - fade ? (n - i) / fade : 1);
  const buf = ac.createBuffer(1, n, sr);
  buf.getChannelData(0).set(y);
  harpBufs.set(key, buf);
  return buf;
}
/** a harp note */
function harp(ac: AudioContext, dest: AudioNode, f: number, t: number, vol: number): void {
  const src = ac.createBufferSource();
  src.buffer = harpBuf(ac, f);
  const g = ac.createGain();
  g.gain.value = vol;
  src.connect(g);
  g.connect(dest);
  src.start(t);
  src.stop(t + src.buffer.duration);
}

type Vowel = readonly (readonly [hz: number, q: number, gain: number])[];
const AH: Vowel = [
  [700, 7, 1],
  [1220, 9, 0.5],
  [2600, 13, 0.25],
];
const OO: Vowel = [
  [300, 5, 1],
  [870, 8, 0.35],
  [2240, 12, 0.12],
];
/** "ah" and "oo" for a lone voice: wider formants, so every note of its range finds them */
const WIDE_AH: Vowel = [
  [820, 3, 1],
  [1180, 5, 0.5],
  [2900, 8, 0.22],
];
const WIDE_OO: Vowel = [
  [320, 2.5, 1],
  [870, 4, 0.35],
  [2240, 7, 0.12],
];
/** HAL's "ah": a man's, lower and darker */
const HAL_AH: Vowel = [
  [650, 6, 1],
  [1080, 8, 0.45],
  [2450, 12, 0.18],
];
/** a vowel: parallel band-passes, with a little of the chest under them, into `dest` */
function throat(
  ac: AudioContext,
  vowel: Vowel,
  dest: AudioNode,
  chest = 0.2,
): { input: AudioNode; filters: BiquadFilterNode[] } {
  const input = ac.createGain();
  const filters = vowel.map(([f, q, lvl]) => {
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f;
    bp.Q.value = q;
    const a = ac.createGain();
    a.gain.value = lvl * 2.5;
    input.connect(bp);
    bp.connect(a);
    a.connect(dest);
    return bp;
  });
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 450;
  const c = ac.createGain();
  c.gain.value = chest;
  input.connect(lp);
  lp.connect(c);
  c.connect(dest);
  return { input, filters: [...filters, lp] };
}
/** one sung note: a saw through a vowel, a slow bloom, a little vibrato */
function sing(
  ac: AudioContext,
  dest: AudioNode,
  f: number,
  t: number,
  hold: number,
  vol: number,
  vowel: Vowel,
): void {
  const end = t + 0.12 + hold;
  const off = end + 0.65;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.12);
  g.gain.setValueAtTime(vol, end);
  g.gain.exponentialRampToValueAtTime(0.0001, end + 0.6);
  g.connect(dest);
  const th = throat(ac, vowel, g);
  const o = ac.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = f;
  o.detune.value = (Math.random() - 0.5) * 12;
  const vib = ac.createOscillator();
  vib.frequency.value = 4.8 + Math.random() * 0.8;
  const vd = ac.createGain();
  vd.gain.value = 6;
  vib.connect(vd);
  vd.connect(o.detune);
  o.connect(th.input);
  o.start(t);
  vib.start(t);
  o.stop(off);
  vib.stop(off);
}

/* ============================================================
   the cues
   ============================================================ */

/** the waltz's bar: beat two comes early, beat three sits back */
const BAR = 0.96;
const LILT = [0, 0.27, 0.65];

/** surface: one console beep per component, each over a harp note climbing the waltz's G */
export function transmission(S: SoundKit, count?: number): void {
  const ac = S.ctx();
  if (!ac) return;
  const k = whole(count, 1, 6, 3);
  const t = ac.currentTime;
  const out = bus(S, ac, 0.3);
  [67, 71, 74, 79, 83, 86].slice(0, k).forEach((m, i) => {
    beep2(S, i * 2 + 2, i * 0.15);
    harp(ac, out, hz(m), t + i * 0.15, 0.05);
  });
}

/** done: a Viennese cadence, oom–pah–pah on D7, then harp and strings landing on G */
export function cadence(S: SoundKit, at = 0): void {
  const ac = S.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const out = bus(S, ac, 0.32, 2.2, 0.85);
  out.gain.setValueAtTime(0.85, t + 1.95);
  out.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
  harp(ac, out, hz(50), t, 0.07);
  strings(ac, out, [hz(50)], t, BAR * 0.8, 0.02, { attack: 0.04, vib: 0 });
  [1, 2].forEach((b) => {
    const tb = t + LILT[b];
    [57, 60, 66].forEach((m, j) => harp(ac, out, hz(m), tb + j * 0.008, 0.026));
    strings(ac, out, [57, 60, 66].map(hz), tb, 0.1, 0.016, { attack: 0.015, release: 0.12 });
  });
  strings(ac, out, [hz(69)], t, LILT[2] + 0.03, 0.04, { attack: 0.06, release: 0.12 });
  strings(ac, out, [hz(66)], t + LILT[2], BAR - LILT[2] + 0.03, 0.04, {
    attack: 0.03,
    release: 0.12,
  });
  const tg = t + BAR;
  harp(ac, out, hz(43), tg, 0.07);
  [55, 59, 62, 67, 71, 74, 79].forEach((m, i) => harp(ac, out, hz(m), tg + i * 0.04, 0.034));
  strings(ac, out, [55, 62, 71].map(hz), tg, 0.9, 0.028, { attack: 0.08, release: 0.5 });
  strings(ac, out, [hz(67)], tg, 0.9, 0.04, { attack: 0.05, release: 0.5 });
}

/** HAL winding down: a sung "ah" sagging in pitch and vowel like a slowing tape */
export function hal(S: SoundKit, at = 0): void {
  const ac = S.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const T = 2.4;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.14);
  g.gain.setValueAtTime(0.06, t + 1.3);
  g.gain.linearRampToValueAtTime(0, t + T);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(3600, t);
  lp.frequency.exponentialRampToValueAtTime(1300, t + T);
  lp.connect(g);
  const out = bus(S, ac, 0.3);
  g.connect(out);
  const th = throat(ac, HAL_AH, lp, 0.25);
  // pitch and formants fall together, slowly, then faster: almost five semitones
  const sag = new Float32Array(48).map((_, i) => -480 * Math.pow(i / 47, 1.5));
  const o = ac.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = hz(57);
  o.detune.setValueCurveAtTime(sag, t + 0.3, T - 0.3);
  th.filters.forEach((f) => f.detune.setValueCurveAtTime(sag, t + 0.3, T - 0.3));
  const vib = ac.createOscillator();
  vib.frequency.setValueAtTime(5.4, t);
  vib.frequency.setValueAtTime(5.4, t + 0.3);
  vib.frequency.linearRampToValueAtTime(1.4, t + T);
  const vd = ac.createGain();
  vd.gain.setValueAtTime(0, t);
  vd.gain.linearRampToValueAtTime(10, t + 0.3);
  vd.gain.linearRampToValueAtTime(38, t + T);
  vib.connect(vd);
  vd.connect(o.detune);
  o.connect(th.input);
  o.start(t);
  vib.start(t);
  o.stop(t + T + 0.05);
  vib.stop(t + T + 0.05);
}

/** the AE-35 fault: one low console alarm, then HAL's voice running down from the same A */
export function fault(S: SoundKit): void {
  S.tone({ type: 'square', f0: 220, f1: 196, dur: 0.12, vol: 0.03 });
  hal(S, 0.1);
}

/**
 * The sunrise: an organ pedal on C swelling under trumpets that climb C, G,
 * C′ and hold in open fifths, the third arriving minor and flipping major,
 * the timpani pounding C and G. `k` stretches it, `vol` scales it.
 */
export function sunrise(S: SoundKit, k = 1, vol = 1): void {
  const ac = S.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const out = bus(S, ac, 0.3, 3.2, vol);
  const end = t + 2.5 * k;
  organ(ac, out, hz(36), t, 2.6 * k, 0.06, 0.5 * k);
  (
    [
      [60, 0.1, 0.03],
      [67, 0.45, 0.03],
      [72, 0.8, 0.036],
    ] as const
  ).forEach(([m, at, v]) => trumpet(ac, out, hz(m), t + at * k, end - t - at * k, v));
  trumpet(ac, out, hz(75), t + 1.2 * k, 0.3 * k, 0.034, 0.06);
  trumpet(ac, out, hz(76), t + 1.5 * k, 1.0 * k, 0.038);
  timp(ac, out, hz(48), t + 1.2 * k, 0.11);
  [48, 43, 48, 43, 48].forEach((m, i) =>
    timp(ac, out, hz(m), t + (1.78 + i * 0.19) * k, 0.085 + i * 0.01),
  );
}

/** the station's own tune in the Danube's lilt: [MIDI note, beat, beats], I–V7–V7–I in G */
const STATION: { bass: number; chord: number[]; tune: [number, number, number][] }[] = [
  {
    bass: 43,
    chord: [59, 62, 67],
    tune: [
      [69, 0, 1],
      [67, 1, 1],
      [71, 2, 1],
    ],
  },
  {
    bass: 50,
    chord: [57, 60, 66],
    tune: [
      [69, 0, 2],
      [66, 2, 1],
    ],
  },
  {
    bass: 45,
    chord: [57, 60, 66],
    tune: [
      [72, 0, 1],
      [71, 1, 1],
      [69, 2, 1],
    ],
  },
  { bass: 43, chord: [55, 62, 71], tune: [[67, 0, 3]] },
];
/**
 * The station waltz: Viennese oom–pah–pah (beat two early) on harp and
 * strings, the line on violins with the harp an octave above. Returns a
 * handle so a scroll back across the cut can fade it.
 */
export function waltz(S: SoundKit, at = 0): Bed | null {
  const ac = S.ctx();
  if (!ac) return null;
  const t0 = ac.currentTime + at;
  const out = bus(S, ac, 0.32);
  STATION.forEach((bar, b) => {
    const t = t0 + b * BAR;
    const last = b === STATION.length - 1;
    const hold = last ? 1.3 : BAR;
    harp(ac, out, hz(bar.bass), t, 0.075);
    strings(ac, out, [hz(bar.bass)], t, hold * 0.8, 0.02, { attack: 0.05, release: 0.3, vib: 0 });
    if (last) {
      [55, 59, 62, 67, 71, 74, 79].forEach((m, i) =>
        harp(ac, out, hz(m), t + 0.02 + i * 0.045, 0.03),
      );
      strings(ac, out, bar.chord.map(hz), t, hold, 0.024, { attack: 0.1, release: 0.6 });
    } else {
      [1, 2].forEach((beat) => {
        const tb = t + LILT[beat];
        bar.chord.forEach((m, j) => harp(ac, out, hz(m), tb + j * 0.008, 0.026));
        strings(ac, out, bar.chord.map(hz), tb, 0.1, 0.016, { attack: 0.015, release: 0.12 });
      });
    }
    bar.tune.forEach(([m, beat, beats]) => {
      const ts = t + LILT[beat];
      const te = beat + beats >= 3 ? t + hold : t + LILT[beat + beats];
      strings(ac, out, [hz(m)], ts, te - ts + 0.03, 0.042, {
        attack: 0.05,
        release: last ? 0.6 : 0.12,
      });
      harp(ac, out, hz(m + 12), ts, 0.022);
    });
  });
  return { stop: (fade = 0.3) => fadeOut(ac, out, fade) };
}

/** the centrifuge: a lonely adagio, low strings on A–E, the minor third, a violin far above */
export function adagio(S: SoundKit): void {
  const ac = S.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const out = bus(S, ac, 0.45, 3.2);
  strings(ac, out, [45, 52].map(hz), t, 2.6, 0.048, { attack: 0.9, release: 0.9, bright: 0.8 });
  strings(ac, out, [hz(60)], t + 0.5, 2.1, 0.03, { attack: 0.9, release: 0.9, bright: 0.8 });
  strings(ac, out, [hz(76)], t + 1, 1.6, 0.028, { attack: 0.8, release: 1, vib: 6 });
}

/** a tool in the room: one choir voice per item, a semitone apart, so a column sings a cluster */
export function ring(S: SoundKit, row: number, i: number): void {
  const ac = S.ctx();
  if (!ac) return;
  const r = Math.abs(row) % 3;
  const out = bus(S, ac, 0.55, 3.2);
  const m = [57, 62, 67][r] + (Math.abs(i) % 6);
  sing(ac, out, hz(m), ac.currentTime, 0.35, 0.04, r ? WIDE_AH : WIDE_OO);
}

/* ---------- beds: hums, the choir, the gate ---------- */

export interface Hum extends Bed {
  detune(cents: number): void;
}

/** a low electrical hum (saw + octave sine through a lowpass), the ship's own */
export function hum(S: SoundKit, f: number, vol: number, signal?: AbortSignal): Hum | null {
  let oscs: OscillatorNode[] = [];
  let ac: AudioContext | null = null;
  const bed = S.bed((ctx, out) => {
    ac = ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    const o2 = ctx.createOscillator();
    o2.frequency.value = f * 2.01;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 40;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.8);
    o.connect(hp);
    o2.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(out);
    o.start(t);
    o2.start(t);
    oscs = [o, o2];
    return {
      stop(fade = 0.6) {
        fadeOut(ctx, g, fade);
        oscs.forEach((x) => x.stop(ctx.currentTime + fade + 0.05));
      },
    };
  }, signal);
  if (!bed) return null;
  return {
    stop: (fade) => bed.stop(fade),
    detune(cents) {
      if (!ac) return;
      const t = ac.currentTime;
      oscs.forEach((x) => x.detune.setTargetAtTime(cents, t, 0.25));
    },
  };
}
/** the lens thinking */
export const lensHum = (S: SoundKit, signal?: AbortSignal) => hum(S, 110, 0.02, signal);
/** the logic memory centre; it sags as modules are pulled */
export const logicHum = (S: SoundKit, signal?: AbortSignal) => hum(S, 55, 0.035, signal);

/** the monolith's choir: [MIDI note, vowel], growing outward from D4 */
const CHOIR: [number, Vowel][] = [
  [62, AH],
  [63, AH],
  [61, AH],
  [55, OO],
  [64, AH],
  [56, OO],
  [54, OO],
  [60, AH],
  [57, OO],
  [65, AH],
];
/**
 * The monolith: Ligeti's choir. Voices on neighbouring semitones enter one by
 * one, each sliding a semitone now and then (never far from home), swelling
 * and receding on its own slow breath; the vowels lean between "ah" and "oo".
 * No pulse anywhere.
 */
export function choir(S: SoundKit, signal?: AbortSignal): Bed | null {
  return S.bed((ac, out) => {
    const t = ac.currentTime;
    const g = ac.createGain();
    g.gain.value = 0.013;
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 110;
    g.connect(hp);
    hp.connect(out);
    const w = ac.createGain();
    w.gain.value = 0.6;
    hp.connect(w);
    w.connect(S.reverb(3.2));
    const ah = throat(ac, AH, g);
    const oo = throat(ac, OO, g);
    const lean = ac.createOscillator();
    lean.frequency.value = 0.045;
    const lg = ac.createGain();
    lg.gain.value = 70;
    lean.connect(lg);
    [...ah.filters, ...oo.filters].forEach((f) => lg.connect(f.detune));
    // breath through the vowels
    const air = ac.createBufferSource();
    air.buffer = noiseBuf(ac);
    air.loop = true;
    const ab = ac.createBiquadFilter();
    ab.type = 'highpass';
    ab.frequency.value = 900;
    const ag = ac.createGain();
    ag.gain.value = 0.04;
    air.connect(ab);
    ab.connect(ag);
    ag.connect(ah.input);
    ag.connect(oo.input);
    const nodes: AudioScheduledSourceNode[] = [lean, air];
    CHOIR.forEach(([m, vowel], i) => {
      const at = t + i * 0.45;
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(m);
      let c = (Math.random() - 0.5) * 16;
      o.detune.value = c;
      let when = at + 2 + Math.random() * 3;
      for (let s = 0; s < 14; s++) {
        const step = (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.3 ? 50 : 100);
        c = Math.max(-200, Math.min(200, c + step));
        o.detune.setTargetAtTime(c, when, 0.9);
        when += 3 + Math.random() * 4;
      }
      const drift = ac.createOscillator();
      drift.frequency.value = 0.05 + Math.random() * 0.08;
      const dg = ac.createGain();
      dg.gain.value = 7;
      drift.connect(dg);
      dg.connect(o.detune);
      const env = ac.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(1, at + 1.6);
      const sway = ac.createGain();
      const swayLfo = ac.createOscillator();
      swayLfo.frequency.value = 0.03 + Math.random() * 0.07;
      const sg = ac.createGain();
      sg.gain.value = 0.45;
      swayLfo.connect(sg);
      sg.connect(sway.gain);
      o.connect(env);
      env.connect(sway);
      sway.connect((vowel === OO ? oo : ah).input);
      nodes.push(o, drift, swayLfo);
    });
    nodes.forEach((n) => n.start(t));
    return {
      stop(fade = 1.4) {
        fadeOut(ac, g, fade);
        nodes.forEach((n) => n.stop(ac.currentTime + fade + 0.1));
      },
    };
  }, signal);
}

/**
 * Ligeti's clusters: a low string cluster and a thin high one that the scroll
 * opens. With `rush` it is the star gate, rushing noise over them; without,
 * it is the entr'acte, since the film plays Atmosphères after its
 * intermission and again through the star gate. `swell` is the fade in.
 */
function clusters(
  S: SoundKit,
  rush: boolean,
  swell: number,
  signal?: AbortSignal,
): (Bed & { p(v: number): void }) | null {
  let tune: ((v: number) => void) | null = null;
  const bed = S.bed((ac, out) => {
    const t = ac.currentTime;
    const gains: GainNode[] = [];
    const nodes: AudioScheduledSourceNode[] = [];
    let bp: BiquadFilterNode | null = null;
    if (rush) {
      const src = ac.createBufferSource();
      src.buffer = noiseBuf(ac);
      src.loop = true;
      bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 2.4;
      bp.frequency.value = 400;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.045, t + 1);
      src.connect(bp);
      bp.connect(g);
      g.connect(out);
      gains.push(g);
      nodes.push(src);
    }
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 450;
    lp.Q.value = 0.7;
    const mix = ac.createGain();
    mix.gain.value = 0.7;
    const og = ac.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.03, t + swell);
    mix.connect(lp);
    lp.connect(og);
    og.connect(out);
    const hiMix = ac.createGain();
    hiMix.gain.value = 0.25;
    const hiLvl = ac.createGain();
    hiLvl.gain.value = 0.15;
    const hg = ac.createGain();
    hg.gain.setValueAtTime(0.0001, t);
    hg.gain.exponentialRampToValueAtTime(0.012, t + swell * 1.6);
    hiMix.connect(hiLvl);
    hiLvl.connect(hg);
    hg.connect(out);
    gains.push(og, hg);
    const w = ac.createGain();
    w.gain.value = 0.5;
    og.connect(w);
    hg.connect(w);
    w.connect(S.reverb(3.2));
    [45, 46, 47, 48, 49, 50].forEach((m, i) => {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(m) * (i % 2 ? 1.0025 : 0.998);
      o.connect(mix);
      nodes.push(o);
    });
    [88, 89, 90, 91].forEach((m, i) => {
      const o = ac.createOscillator();
      o.type = 'triangle';
      o.frequency.value = hz(m) * (1 + i * 0.0013);
      o.connect(hiMix);
      nodes.push(o);
    });
    nodes.forEach((n) => n.start(t));
    tune = (v) => {
      const now = ac.currentTime;
      bp?.frequency.setTargetAtTime(300 + v * 3200, now, 0.1);
      lp.frequency.setTargetAtTime(450 + v * 2000, now, 0.2);
      hiLvl.gain.setTargetAtTime(0.15 + v * 0.85, now, 0.2);
    };
    return {
      stop(fade = 0.8) {
        gains.forEach((x) => fadeOut(ac, x, fade));
        const end = ac.currentTime + fade + 0.1;
        nodes.forEach((n) => n.stop(end));
      },
    };
  }, signal);
  if (!bed) return null;
  return {
    stop: (fade) => bed.stop(fade),
    p(v) {
      tune?.(v);
    },
  };
}

/** the star gate: rushing noise the scroll tunes, over the clusters */
export const gateBed = (S: SoundKit, signal?: AbortSignal) => clusters(S, true, 1.2, signal);

/** the entr'acte: the clusters alone, swelling in slowly and held dark */
export function entracte(S: SoundKit, signal?: AbortSignal): Bed | null {
  const bed = clusters(S, false, 3, signal);
  bed?.p(0.12);
  return bed;
}

/* ============================================================
   the score
   ============================================================ */

const score: ReelScore = {
  after: 'after Richard Strauss, György Ligeti, Johann Strauss II and Aram Khachaturian',
  idea: 'the sunrise on organ, trumpets and timpani; a drifting choir; a harp-and-strings waltz; HAL running down',
  cues: [
    { id: 'hover', label: 'console tick', play: tick },
    { id: 'click', label: 'console clunk', play: clunk },
    { id: 'section', label: 'act beep, a step up the console per act', play: actBeep },
    { id: 'surface', label: 'transmission beeps over a climbing harp', play: transmission },
    { id: 'done', label: 'waltz cadence on harp and strings', play: (s) => cadence(s) },
    { id: 'error', label: 'AE-35 alarm, HAL winding down', play: fault },
    { id: 'title', label: 'the sunrise: organ, trumpets, timpani', play: (s) => sunrise(s) },
    { id: 'replay', label: 'the sunrise, broader (replay, credits)', play: (s) => sunrise(s, 1.3) },
    {
      id: 'waltz',
      label: 'the station waltz',
      play: (s) => {
        waltz(s);
      },
    },
    { id: 'centrifuge', label: 'lonely string adagio', play: adagio },
    {
      id: 'intermission',
      label: "the entr'acte: Ligeti's string clusters, no rush (bed)",
      play: (s) => entracte(s),
    },
    {
      id: 'ring',
      label: 'one choir voice per tool',
      play: (s, n = 0) => ring(s, Math.floor(n / 5), n % 5),
    },
    { id: 'monolith', label: 'Ligeti choir (bed)', play: (s) => choir(s) },
    {
      id: 'gate',
      label: "star gate rush over the entr'acte's clusters (bed)",
      play: (s) => {
        const g = gateBed(s);
        g?.p(0.4);
        return g;
      },
    },
    { id: 'think', label: 'lens hum (bed)', play: (s) => lensHum(s) },
    { id: 'logic', label: 'logic memory hum (bed)', play: (s) => logicHum(s) },
    { id: 'open', label: 'panel open: clunk and beep', play: panelClunk },
    { id: 'close', label: 'panel close: drop', play: (s) => s.drop() },
    { id: 'blip', label: 'blip between sections', play: blip },
    { id: 'row', label: 'index row beep', play: (s, n = 0) => beep2(s, n) },
    { id: 'data', label: 'data tick', play: dataTick },
    { id: 'sweep', label: 'data sweep', play: sweep },
    { id: 'breath', label: 'suit breathing', play: breath },
    { id: 'thunk', label: 'memory module pulled', play: thunk },
    { id: 'whoosh', label: 'back across the match cut', play: whooshBack },
  ],
};

export default score;
