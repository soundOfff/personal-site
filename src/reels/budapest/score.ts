/**
 * Reel 04 · The Grand Budapest Hotel: the score, after Alexandre Desplat.
 *
 * An Alpine–Slavic band inside a cuckoo clock: balalaikas trembling on held
 * notes, a cimbalom, a zither, the hotel's organ, timpani and small bells, all
 * in E harmonic minor (the raised seventh, D♯, gives it the Mitteleuropa; the
 * oom-pah walks i–iv–V). Brisk, prim, fond of a sudden accelerando and a dead
 * stop. Original figures in that idiom: no melody of the film's.
 *
 * The strings are Karplus–Strong, rendered once per pitch into a buffer and
 * struck from it; a tremolo is the same buffer struck fourteen times a second.
 * The hotel's own noises (keys, bells, telegrams, pastry boxes) live here too,
 * tuned to sit in the key.
 */
import type { SoundKit } from '../sound';
import { SECTION_IDS, type ReelScore } from '../types';
import config from './config';

/* ---------- pitch ---------- */

const STEPS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 'E4', 'D#5' → Hz */
const hz = (note: string) => {
  const semi = (STEPS[note[0]] ?? 0) + (note[1] === '#' ? 1 : 0);
  return 440 * Math.pow(2, (semi + 12 * (Number(note.slice(-1)) + 1) - 69) / 12);
};

/** E harmonic minor across an octave: where the hover wanders */
const KEY = ['E5', 'F#5', 'G5', 'A5', 'B5', 'C6', 'D#6', 'E6'];

/** one chord per era, walking the oom-pah: i, iv, V (with the raised seventh) */
const ERAS = [
  { chord: ['E4', 'G4', 'B4'], drum: 'E2' },
  { chord: ['A4', 'C5', 'E5'], drum: 'A2' },
  { chord: ['F#4', 'B4', 'D#5'], drum: 'B2' },
];

/** the zither's run, up through the augmented second to the tonic */
const RUN = ['G4', 'A4', 'B4', 'C5', 'D#5', 'E5'];

/* ---------- strings: Karplus–Strong, rendered once per pitch ---------- */

interface Strings {
  id: string;
  /** seconds for the fundamental to fall 60 dB */
  t60: number;
  /** the loop's lowpass: 0.5 is dark, 0.1 glassy */
  damp: number;
  /** where the string is plucked or struck, as a fraction of its length */
  pos: number;
  /** a hammer's contact in ms; without one the string is picked (a burst of noise) */
  hammer?: number;
  /** a metallic chink over the hammer's attack */
  chink?: number;
  /** cents, one per string of the course (the first is the loudest) */
  course: number[];
  dur: number;
}

/** thin and bright, plucked near the bridge */
const BALALAIKA: Strings = { id: 'bal', t60: 0.9, damp: 0.4, pos: 0.12, course: [0], dur: 0.9 };
/** three strings a course, a few cents apart, struck with the cotton side of the beater */
const CIMBALOM: Strings = {
  id: 'cim',
  t60: 2.4,
  damp: 0.22,
  pos: 0.13,
  hammer: 0.7,
  chink: 0.25,
  course: [0, -3.5, 3.5],
  dur: 1.3,
};
/** steel under a thumb ring: long and glassy */
const ZITHER: Strings = { id: 'zit', t60: 3.4, damp: 0.12, pos: 0.2, course: [0], dur: 1.8 };

const rendered = new Map<string, AudioBuffer>();

/** what sets a string going: a pick's noise or a hammer's pulse, combed by where it lands */
function excite(sr: number, period: number, kind: Strings): Float32Array {
  const w = kind.hammer ? Math.max(2, Math.round((kind.hammer / 1000) * sr)) : Math.round(period);
  const m = Math.max(1, Math.round(kind.pos * period));
  const raw = new Float32Array(w);
  for (let i = 0; i < w; i++)
    raw[i] = kind.hammer
      ? 0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / w) + (Math.random() - 0.5) * 0.08
      : Math.random() * 2 - 1;
  const ex = new Float32Array(w + m);
  for (let i = 0; i < ex.length; i++) ex[i] = (raw[i] ?? 0) - (raw[i - m] ?? 0);
  return ex;
}

/** block DC (`passes` one-pole highpasses at `hp` Hz), normalise to a peak of 1, fade the last 30 ms */
function finish(d: Float32Array, sr: number, hp = 30, passes = 1): void {
  const r = 1 - (2 * Math.PI * hp) / sr;
  for (let p = 0; p < passes; p++) {
    let x1 = 0;
    let y1 = 0;
    for (let n = 0; n < d.length; n++) {
      const v = d[n] - x1 + r * y1;
      x1 = d[n];
      y1 = v;
      d[n] = v;
    }
  }
  let peak = 0;
  for (let n = 0; n < d.length; n++) peak = Math.max(peak, Math.abs(d[n]));
  const k = peak > 0 ? 1 / peak : 1;
  const fade = Math.floor(sr * 0.03);
  for (let n = 0; n < d.length; n++) d[n] *= k * Math.min(1, (d.length - n) / fade);
}

/** a string (or a course of them) at `note`, rendered once per sample rate */
function string(ac: BaseAudioContext, kind: Strings, note: string): AudioBuffer {
  const sr = ac.sampleRate;
  const key = `${sr}:${kind.id}:${note}`;
  const hit = rendered.get(key);
  if (hit) return hit;
  const f = hz(note);
  const len = Math.floor(sr * kind.dur);
  const buf = ac.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const y = new Float32Array(len);
  kind.course.forEach((cents, i) => {
    const fc = f * Math.pow(2, cents / 1200);
    const period = sr / fc;
    // the loop: an integer delay, the 2-tap lowpass (`damp` samples) and an allpass for the rest
    const n0 = Math.max(1, Math.floor(period - kind.damp - 0.1));
    const frac = period - kind.damp - n0;
    const c = (1 - frac) / (1 + frac);
    const rho = Math.pow(10, -3 / (fc * kind.t60));
    const ex = excite(sr, period, kind);
    const g = i === 0 ? 1 : 0.6;
    let x1 = 0;
    let a1 = 0;
    y.fill(0);
    for (let n = 0; n < len; n++) {
      const lp = n > n0 ? rho * ((1 - kind.damp) * y[n - n0] + kind.damp * y[n - n0 - 1]) : 0;
      const ap = c * lp + x1 - c * a1;
      x1 = lp;
      a1 = ap;
      y[n] = ap + (n < ex.length ? ex[n] : 0);
      out[n] += g * y[n];
    }
  });
  if (kind.chink) {
    let peak = 0;
    for (let n = 0; n < len; n++) peak = Math.max(peak, Math.abs(out[n]));
    const a = kind.chink * peak;
    const fall = Math.exp(-1 / (0.009 * sr));
    let env = 1;
    for (let n = 0; n < Math.min(len, 0.06 * sr); n++, env *= fall) {
      const w = (2 * Math.PI * f * n) / sr;
      out[n] += a * env * (Math.sin(w * 4.13) + 0.6 * Math.sin(w * 6.71));
    }
  }
  finish(out, sr);
  rendered.set(key, buf);
  return buf;
}

/**
 * A kettledrum at `note`, rendered once: the head's principal and its overtones
 * (≈1.5, 2, 2.4, 2.9×), a pitch that sinks as the head settles, the felt's thud.
 */
function kettle(ac: BaseAudioContext, note: string): AudioBuffer {
  const sr = ac.sampleRate;
  const key = `${sr}:timp:${note}`;
  const hit = rendered.get(key);
  if (hit) return hit;
  const f = hz(note);
  const len = Math.floor(sr * 1.6);
  const buf = ac.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const attack = 0.002 * sr;
  const settle = Math.exp(-1 / (0.06 * sr));
  const modes = [
    [1, 1, 1.5],
    [1.5, 0.45, 0.9],
    [1.98, 0.3, 0.6],
    [2.44, 0.14, 0.4],
    [2.9, 0.07, 0.28],
  ] as const;
  for (const [ratio, amp, t60] of modes) {
    const fall = Math.exp(-6.91 / (t60 * sr));
    let env = amp;
    let bend = 0.03;
    let ph = 0;
    for (let n = 0; n < len; n++, env *= fall, bend *= settle) {
      ph += (2 * Math.PI * f * ratio * (1 + bend)) / sr;
      d[n] += env * Math.sin(ph) * Math.min(1, n / attack);
    }
  }
  let lo = 0;
  let mid = 0;
  for (let n = 0; n < Math.min(len, 0.08 * sr); n++) {
    const w = Math.random() * 2 - 1;
    lo += 0.03 * (w - lo);
    mid += 0.15 * (w - mid);
    d[n] += 4 * lo * Math.exp(-n / (0.018 * sr)) + 0.4 * mid * Math.exp(-n / (0.004 * sr));
  }
  finish(d, sr, 55, 2);
  rendered.set(key, buf);
  return buf;
}

/* ---------- players ---------- */

interface Hit {
  /** choke from here */
  until?: number;
  /** how fast the choke falls */
  tau?: number;
  rate?: number;
  /** seconds between strings in a stroke */
  spread?: number;
}

/** straight to the limiter, with `wet` of it into a room of `sec` */
function bus(s: SoundKit, ac: BaseAudioContext, wet: number, sec = 1.4): GainNode {
  const g = ac.createGain();
  g.connect(s.out());
  if (wet > 0) {
    const w = ac.createGain();
    w.gain.value = wet;
    g.connect(w).connect(s.reverb(sec));
  }
  return g;
}

/** the balalaika's triangular box: thin below, ringing round 1.5 kHz */
function box(s: SoundKit, ac: BaseAudioContext, wet: number): AudioNode {
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 300;
  hp.Q.value = 0.6;
  const body = ac.createBiquadFilter();
  body.type = 'peaking';
  body.frequency.value = 1500;
  body.Q.value = 1.1;
  body.gain.value = 7;
  hp.connect(body).connect(bus(s, ac, wet));
  return hp;
}

/** the zither's flat box: open, with a little sparkle on top */
function board(s: SoundKit, ac: BaseAudioContext): AudioNode {
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 110;
  const top = ac.createBiquadFilter();
  top.type = 'peaking';
  top.frequency.value = 2600;
  top.Q.value = 0.9;
  top.gain.value = 3;
  hp.connect(top).connect(bus(s, ac, 0.24));
  return hp;
}

/** a rendered string or drum, struck at `t`: rings out, or is choked at `until` */
function strike(
  ac: BaseAudioContext,
  buf: AudioBuffer,
  dest: AudioNode,
  t: number,
  g: number,
  o: Hit = {},
): void {
  const rate = o.rate ?? 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(g, t);
  let end = t + buf.duration / rate;
  if (o.until !== undefined && o.until < end) {
    const tau = o.tau ?? 0.015;
    amp.gain.setTargetAtTime(0, o.until, tau);
    end = Math.min(end, o.until + tau * 7);
  }
  src.connect(amp).connect(dest);
  src.start(t);
  src.stop(end);
}

/** one stroke across the strings: down from the lowest, up from the highest, each a hair off pitch */
function stroke(
  ac: BaseAudioContext,
  bufs: AudioBuffer[],
  dest: AudioNode,
  t: number,
  g: number,
  down = true,
  o: Hit = {},
): void {
  const order = down ? bufs : [...bufs].reverse();
  order.forEach((b, i) =>
    strike(ac, b, dest, t + i * (o.spread ?? 0.005), g, {
      ...o,
      rate: Math.pow(2, (Math.random() - 0.5) / 300),
    }),
  );
}

interface Trem {
  rate?: number;
  /** the hairpin over the strokes: 0…1 → a gain multiplier */
  swell?: (x: number) => number;
  /** choke the last stroke here (otherwise it rings) */
  until?: number;
}

/** the balalaika's tremolo: the strings re-struck `rate` times a second, down and up, the hand a little uneven */
function tremolo(
  ac: BaseAudioContext,
  bufs: AudioBuffer[],
  dest: AudioNode,
  t: number,
  dur: number,
  g: number,
  o: Trem = {},
): void {
  const step = 1 / (o.rate ?? 14);
  const n = Math.max(1, Math.round(dur / step));
  const wob = Math.random() * 2 * Math.PI;
  for (let k = 0; k < n; k++) {
    const down = k % 2 === 0;
    const shape = o.swell?.(n > 1 ? k / (n - 1) : 1) ?? 1;
    const hand = (down ? 1 : 0.75) * (1 + 0.12 * Math.sin(wob + 2 * Math.PI * 4.5 * k * step));
    stroke(
      ac,
      bufs,
      dest,
      t + k * step + Math.random() * 0.004,
      g * shape * hand * (0.94 + Math.random() * 0.12),
      down,
      { until: k < n - 1 ? t + (k + 1) * step + 0.012 : o.until },
    );
  }
}

const pipes = new WeakMap<BaseAudioContext, PeriodicWave>();

/** the organ's principal chorus as one wave: 8′ 4′ 2⅔′ 2′ 1⅗′ 1⅓′ 1′ */
function pipe(ac: BaseAudioContext): PeriodicWave {
  let w = pipes.get(ac);
  if (!w) {
    const imag = new Float32Array([0, 1, 0.55, 0.24, 0.34, 0.05, 0.14, 0.02, 0.1]);
    w = ac.createPeriodicWave(new Float32Array(imag.length), imag);
    pipes.set(ac, w);
  }
  return w;
}

/** the hotel organ: a second rank a hair sharp, a chiff, a slow swell into the church */
function organ(
  s: SoundKit,
  ac: BaseAudioContext,
  notes: string[],
  t: number,
  dur: number,
  vol: number,
): void {
  const out = bus(s, ac, 0.35, 2.6);
  const swell = ac.createGain();
  swell.gain.setValueAtTime(0.0001, t);
  swell.gain.exponentialRampToValueAtTime(vol * 0.75, t + 0.14);
  swell.gain.linearRampToValueAtTime(vol, t + dur);
  swell.gain.setTargetAtTime(0, t + dur, 0.05);
  swell.connect(out);
  for (const note of notes) {
    for (const [m, g] of [
      [1, 0.67],
      [1.0012, 0.33],
    ] as const) {
      const o = ac.createOscillator();
      o.setPeriodicWave(pipe(ac));
      o.frequency.value = hz(note) * m;
      const og = ac.createGain();
      og.gain.value = g;
      o.connect(og).connect(swell);
      o.start(t);
      o.stop(t + dur + 0.4);
    }
  }
  s.burst({ dur: 0.07, f: 2600, q: 1.6, vol: vol * 1.2, at: t - ac.currentTime, dest: out });
}

/** a small handbell: hum, twelfth and the rest, each dying at its own rate */
function handbell(s: SoundKit, f: number, at: number, vol: number): void {
  (
    [
      [1, 1, 1.4],
      [2, 0.3, 0.9],
      [3.01, 0.32, 0.55],
      [5.24, 0.1, 0.3],
      [8.1, 0.04, 0.16],
    ] as const
  ).forEach(([m, g, d]) => s.tone({ f0: f * m, dur: d, vol: vol * g, at }));
}

/* ---------- the score ---------- */

let walk = 3;

/** hover: the cimbalom's cotton beater, wandering the scale a step or two at a time */
export function hover(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const leap = [-2, -1, 1, 2][Math.floor(Math.random() * 4)] ?? 1;
  walk = walk + leap < 0 || walk + leap >= KEY.length ? walk - leap : walk + leap;
  const buf = string(ac, CIMBALOM, KEY[walk] ?? 'E5');
  const t = ac.currentTime;
  strike(ac, buf, bus(s, ac, 0.12), t, 0.038 * (0.9 + Math.random() * 0.2), {
    until: t + 0.05,
    tau: 0.15,
  });
}

/** click: the concierge's desk bell, on the dominant (B) */
export function deskBell(s: SoundKit, vol = 0.1): void {
  const f = hz('B6');
  (
    [
      [f, 1, 1.9],
      [f * 2.76, 0.35, 1.0],
      [f * 5.4, 0.12, 0.45],
      [f / 2, 0.15, 0.8],
    ] as const
  ).forEach(([p, g, d]) => s.tone({ f0: p, dur: d, vol: vol * g }));
  s.burst({ dur: 0.008, kind: 'highpass', f: 4000, vol: 0.2 });
}

/** section: the projector's clunk, then the era's chord trembling on the balalaika over a timpani note */
export function section(s: SoundKit, n = 0): void {
  const ac = s.ctx();
  if (!ac) return;
  const at = config.acts.findIndex((a) => a.sections.includes(SECTION_IDS[n]));
  const { chord, drum } = ERAS[at] ?? ERAS[0];
  const strings = chord.map((note) => string(ac, BALALAIKA, note));
  const skin = kettle(ac, drum);
  const t = ac.currentTime;
  s.tone({ f0: 95, f1: 45, dur: 0.16, vol: 0.22 });
  s.burst({ dur: 0.012, kind: 'highpass', f: 2200, vol: 0.25 });
  strike(ac, skin, bus(s, ac, 0.18), t + 0.1, 0.09);
  tremolo(ac, strings, box(s, ac, 0.16), t + 0.1, 0.8, 0.042, {
    swell: (x) => 0.6 + 0.4 * Math.sin(Math.PI * x),
  });
}

/** surface: a zither run up to the tonic, one string per component, the bass string under the last */
export function run(s: SoundKit, n = 3): void {
  const ac = s.ctx();
  if (!ac) return;
  const count = Number.isFinite(n) ? Math.min(RUN.length, Math.max(1, Math.round(n))) : 3;
  const strings = RUN.slice(-count).map((note) => string(ac, ZITHER, note));
  const bass = string(ac, ZITHER, 'E3');
  const t = ac.currentTime;
  const dest = board(s, ac);
  strings.forEach((b, i) =>
    strike(ac, b, dest, t + i * 0.075, 0.045 + 0.02 * (count > 1 ? i / (count - 1) : 1)),
  );
  strike(ac, bass, dest, t + (count - 1) * 0.075, 0.05);
}

/** done: balalaika strokes gathering speed, i then V, a breath, and a dead stop on E major with a handbell */
export function flourish(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const chord = (notes: string[]) => notes.map((note) => string(ac, BALALAIKA, note));
  const tonic = chord(['E4', 'G4', 'B4']);
  const dominant = chord(['F#4', 'B4', 'D#5']);
  const home = chord(['E4', 'G#4', 'B4', 'E5']);
  const t = ac.currentTime;
  const neck = box(s, ac, 0.18);
  let at = 0;
  let step = 0.15;
  for (let k = 0; k < 11; k++) {
    stroke(ac, k < 7 ? tonic : dominant, neck, t + at, 0.028 + 0.024 * (k / 10), k % 2 === 0, {
      until: t + at + step + 0.012,
    });
    at += step;
    step = Math.max(0.048, step * 0.83);
  }
  at += 0.05;
  stroke(ac, home, neck, t + at, 0.055, true, { until: t + at + 0.2, tau: 0.03, spread: 0.003 });
  handbell(s, hz('E6'), at, 0.04);
}

/** error: the hotel organ's wind gives out under a sour cluster, pitch and colour sagging */
export function sag(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(4200, t);
  lp.frequency.setValueAtTime(4200, t + 0.28);
  lp.frequency.exponentialRampToValueAtTime(320, t + 1);
  lp.connect(bus(s, ac, 0.3, 2.6));
  for (const note of ['D#3', 'E3', 'F3', 'A#3']) {
    const f = hz(note);
    const o = ac.createOscillator();
    o.setPeriodicWave(pipe(ac));
    o.frequency.setValueAtTime(f, t);
    o.frequency.setValueAtTime(f, t + 0.28);
    o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 1);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.016, t + 0.06);
    g.gain.setValueAtTime(0.016, t + 0.28);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
    o.connect(g).connect(lp);
    o.start(t);
    o.stop(t + 1.05);
  }
  // the bellows, sighing out
  const air = s.noise(0.85);
  const af = ac.createBiquadFilter();
  af.type = 'lowpass';
  af.frequency.value = 900;
  const ag = ac.createGain();
  ag.gain.setValueAtTime(0.0001, t);
  ag.gain.exponentialRampToValueAtTime(0.02, t + 0.4);
  ag.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
  air.connect(af).connect(ag).connect(s.out());
  air.start(t + 0.2);
  air.stop(t + 1.05);
}

/** title: a timpani roll into the hotel organ, a balalaika trembling over it, and a dead stop */
export function title(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const skin = kettle(ac, 'E2');
  const phrase = [
    ['B4', 0.3],
    ['C5', 0.15],
    ['D#5', 0.15],
    ['E5', 0.62],
  ] as const;
  const strings = phrase.map(([note]) => string(ac, BALALAIKA, note));
  const t = ac.currentTime;
  const drums = bus(s, ac, 0.22);
  // the roll, gathering for half a second
  for (let k = 0; k < 8; k++)
    strike(ac, skin, drums, t + k / 15 + Math.random() * 0.006, 0.015 + 0.05 * (k / 7) ** 2, {
      until: t + (k + 1) / 15 + 0.04,
      tau: 0.12,
    });
  strike(ac, skin, drums, t + 0.53, 0.12);
  organ(s, ac, ['B2', 'E3', 'G3', 'B3', 'E4'], t + 0.53, 1.35, 0.02);
  const neck = box(s, ac, 0.2);
  let at = 0.62;
  strings.forEach((b, i) => {
    const dur = phrase[i]?.[1] ?? 0.15;
    const last = i === strings.length - 1;
    tremolo(ac, [b], neck, t + at, dur, 0.06, {
      rate: 15,
      swell: last ? (x) => 0.85 + 0.3 * x : undefined,
      until: last ? t + 1.88 : t + at + dur + 0.012,
    });
    at += dur;
  });
  // the dead stop: organ and strings off together, and the drum's last word
  strike(ac, skin, drums, t + 1.88, 0.1);
}

/* ---------- the hotel's own ---------- */

/** a brass key on the rack */
export function tink(s: SoundKit, at = 0): void {
  const f = 3600 + Math.random() * 1400;
  s.tone({ f0: f, dur: 0.08, vol: 0.035, at });
  s.tone({ f0: f * 1.48, dur: 0.05, vol: 0.02, at });
}

/** the key ring, lifted off its hook */
export function jingle(s: SoundKit): void {
  tink(s, 0);
  tink(s, 0.05);
  tink(s, 0.11);
}

/** a whip pan: band-passed air swept up and back, panned left to right */
export function whoosh(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const n = s.noise(0.42);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(500, t);
  bp.frequency.exponentialRampToValueAtTime(3200, t + 0.18);
  bp.frequency.exponentialRampToValueAtTime(700, t + 0.42);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  n.connect(bp);
  bp.connect(g);
  let tail: AudioNode = g;
  if (typeof ac.createStereoPanner === 'function') {
    const p = ac.createStereoPanner();
    p.pan.setValueAtTime(-0.9, t);
    p.pan.linearRampToValueAtTime(0.9, t + 0.4);
    g.connect(p);
    tail = p;
  }
  tail.connect(s.out());
  n.start(t);
  n.stop(t + 0.42);
}

/** the diorama's windows coming on, up the dominant into the tonic */
export function glow(s: SoundKit): void {
  ['B6', 'D#7', 'E7', 'G7', 'B7'].forEach((note, i) =>
    s.tone({ type: 'triangle', f0: hz(note), dur: 0.3, vol: 0.02, at: i * 0.07 }),
  );
}

/** a nib on the guest register */
export function pen(s: SoundKit): void {
  s.burst({ dur: 0.07, f: 5200, q: 2.2, vol: 0.04 });
}

/** a portrait swinging on its wire */
export function creak(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const n = s.noise(0.34);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 6;
  bp.frequency.setValueAtTime(380, t);
  bp.frequency.linearRampToValueAtTime(540, t + 0.3);
  const am = ac.createGain();
  am.gain.value = 0.5;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 34;
  const lg = ac.createGain();
  lg.gain.value = 0.5;
  lfo.connect(lg);
  lg.connect(am.gain);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
  n.connect(bp);
  bp.connect(am);
  am.connect(g);
  g.connect(s.out());
  n.start(t);
  n.stop(t + 0.34);
  lfo.start(t);
  lfo.stop(t + 0.36);
}

/** a telegraph key */
export function clack(s: SoundKit): void {
  s.burst({ dur: 0.014, f: 2400 + Math.random() * 1200, q: 1.3, vol: 0.12 });
  s.tone({ f0: hz('G3'), f1: hz('B2'), dur: 0.03, vol: 0.05 });
}

/** a tier of the pastry tower settling */
export function squish(s: SoundKit): void {
  s.tone({ f0: hz('B3'), f1: hz('B2'), dur: 0.18, vol: 0.11 });
  s.burst({ dur: 0.12, kind: 'lowpass', f: 900, vol: 0.07 });
}

/** the postmark coming down on a telegram */
export function stamp(s: SoundKit): void {
  s.tone({ f0: hz('E3'), f1: hz('B1'), dur: 0.09, vol: 0.2 });
  s.burst({ dur: 0.05, kind: 'lowpass', f: 700, vol: 0.24 });
  s.burst({ dur: 0.02, f: 2200, vol: 0.1, at: 0.01 });
}

/** a pastry box set down on the counter, dominant to tonic */
export function thud(s: SoundKit): void {
  s.tone({ f0: hz('B2'), f1: hz('E2'), dur: 0.09, vol: 0.15 });
}

/** tissue paper: a handful of bright noise grains */
export function paper(s: SoundKit, at = 0): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const n = s.noise(0.16);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 4200;
  bp.Q.value = 0.7;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  for (let k = 0; k < 6; k++)
    g.gain.setValueAtTime(0.02 + Math.random() * 0.05, t + 0.005 + k * 0.022);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  n.connect(bp);
  bp.connect(g);
  g.connect(s.out());
  n.start(t);
  n.stop(t + 0.16);
}

/** one blip down the switchboard's line, tonic to dominant */
export function blip(s: SoundKit, at = 0): void {
  s.tone({ f0: hz('E6'), dur: 0.035, vol: 0.028, at });
  s.tone({ f0: hz('B6'), dur: 0.03, vol: 0.018, at: at + 0.045 });
}

const score: ReelScore = {
  after: 'after Alexandre Desplat',
  idea: 'an Alpine–Slavic band in a cuckoo clock: balalaika tremolo, cimbalom, zither, the hotel organ and timpani, in E harmonic minor, brisk, with dead stops',
  cues: [
    { id: 'hover', label: 'cimbalom, cotton beater', play: hover },
    { id: 'click', label: 'the concierge’s desk bell', play: (s) => deskBell(s) },
    { id: 'section', label: 'clunk, balalaika tremolo, timpani', play: (s, n) => section(s, n) },
    { id: 'surface', label: 'zither run to the tonic', play: (s, n) => run(s, n) },
    { id: 'done', label: 'balalaika accelerando, dead stop', play: flourish },
    { id: 'error', label: 'the organ losing its wind', play: sag },
    { id: 'title', label: 'timpani roll, organ, balalaika', play: title },
    { id: 'key', label: 'brass key on the rack', play: (s) => tink(s) },
    { id: 'jingle', label: 'key ring', play: jingle },
    { id: 'whip', label: 'whip pan', play: whoosh },
    { id: 'glow', label: 'the windows coming on', play: glow },
    { id: 'pen', label: 'nib on the register', play: pen },
    { id: 'creak', label: 'portrait on its wire', play: creak },
    { id: 'clack', label: 'telegraph key', play: clack },
    { id: 'squish', label: 'pastry tier settling', play: squish },
    { id: 'stamp', label: 'postmark', play: stamp },
    { id: 'thud', label: 'pastry box set down', play: thud },
    { id: 'paper', label: 'tissue paper', play: (s) => paper(s) },
    {
      id: 'relay',
      label: 'switchboard relay',
      play: (s) => {
        for (let k = 0; k < 6; k++) blip(s, k * 0.17);
      },
    },
  ],
};

export default score;
