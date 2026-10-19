/**
 * Reel 02 · In the Mood for Love: the score. Every sound the reel makes,
 * voiced after Shigeru Umebayashi's waltz and the boleros on the radio:
 *
 *   - pizzicato strings (Karplus–Strong, rendered once per pitch) for a slow
 *     3/4 waltz in D minor, Dm · Gm · C · A7, with two and three coming late;
 *   - a solo cello for the ache: a slow bow, vibrato that arrives late, and a
 *     slide into every note;
 *   - a bolero bar on the landlady's radio: nylon guitar, maracas, bongó and
 *     far-off strings through a small speaker, with wow and static;
 *   - the rooms themselves: doors, rain in the lamp, the clock, the
 *     typewriter, the thermos, the wall in 2046.
 *
 * Nothing is quoted. Every cue schedules on the audio clock and plays alone.
 */
import type { Bed, SoundKit } from '../sound';
import type { ReelScore } from '../types';

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** Equal-tempered pitches (Hz): s for sharp, b for flat. */
const N = {
  A1: 55,
  C2: 65.41,
  D2: 73.42,
  G2: 98,
  A2: 110,
  Bb2: 116.54,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196,
  Ab3: 207.65,
  A3: 220,
  Bb3: 233.08,
  B3: 246.94,
  Cs4: 277.18,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  Bb4: 466.16,
  C5: 523.25,
  Cs5: 554.37,
  D5: 587.33,
  F5: 698.46,
  A5: 880,
} as const;

/* -------------------------------------------------------------- the room */

type Band = readonly [BiquadFilterType, number, number, number];

/** Wire a run of biquads [type, Hz, Q, dB] after `from`; returns the last. */
function eq(ac: BaseAudioContext, from: AudioNode, bands: readonly Band[]): AudioNode {
  return bands.reduce<AudioNode>((tail, [type, f, q, gain]) => {
    const b = ac.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    b.Q.value = q;
    b.gain.value = gain;
    tail.connect(b);
    return b;
  }, from);
}

const NOISE = new Map<number, AudioBuffer>();

/** White noise, three seconds per sample rate, looped: start it anywhere in the loop. */
function noise(ac: BaseAudioContext): AudioBufferSourceNode {
  let buf = NOISE.get(ac.sampleRate);
  if (!buf) {
    buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 3), ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    NOISE.set(ac.sampleRate, buf);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

/** The wooden bodies and the room around them; voices plug in. */
const BODIES = {
  pizz: {
    bands: [
      ['highpass', 65, 0.7, 0],
      ['peaking', 240, 1.1, 3],
      ['peaking', 2900, 0.8, -4],
    ],
    send: 0.26,
  },
  bow: {
    bands: [
      ['highpass', 70, 0.7, 0],
      ['peaking', 230, 1.6, 5],
      ['peaking', 480, 1.4, -3],
      ['peaking', 1700, 1.3, 3],
      ['peaking', 3300, 2, 2],
      ['lowpass', 6500, 0.7, 0],
    ],
    send: 0.38,
  },
} satisfies Record<string, { bands: Band[]; send: number }>;

const rooms = new WeakMap<AudioNode, Map<string, AudioNode>>();

/** A body's input, built once per kit: resonances, then the dry room and a reverb send. */
function body(s: SoundKit, ac: AudioContext, kind: keyof typeof BODIES): AudioNode {
  const out = s.out();
  const built = rooms.get(out) ?? new Map<string, AudioNode>();
  rooms.set(out, built);
  let input = built.get(kind);
  if (!input) {
    input = ac.createGain();
    const tail = eq(ac, input, BODIES[kind].bands);
    tail.connect(out);
    const send = ac.createGain();
    send.gain.value = BODIES[kind].send;
    tail.connect(send);
    send.connect(s.reverb(1.6));
    built.set(kind, input);
  }
  return input;
}

/* ----------------------------------------------------------- the strings */

/** How a string is plucked and how long it rings. */
interface Str {
  id: string;
  /** seconds to −60 dB at A3; lower strings ring longer */
  t60: number;
  /** how much of the noise's brightness the finger keeps, 0–1 */
  tone: number;
  /** the pluck point, as a fraction of the string from the bridge */
  pos: number;
  /** longest it is kept (s) */
  len: number;
  /** seconds the brightness takes to die away */
  shut: number;
}

const PIZZ: Str = { id: 'pizz', t60: 0.7, tone: 0.3, pos: 0.27, len: 0.9, shut: 0.25 };
const MUTED: Str = { id: 'muted', t60: 0.1, tone: 0.18, pos: 0.3, len: 0.12, shut: 0.05 };
const NYLON: Str = { id: 'nylon', t60: 1.5, tone: 0.5, pos: 0.16, len: 1.3, shut: 1.2 };

const STRINGS = new Map<string, AudioBuffer>();

/**
 * Karplus–Strong, rendered once per pitch (a DelayNode loop can't go under
 * 128 frames, so the upper strings can't run live): a period of softened,
 * combed noise recirculating through a three-tap lowpass. Returns the buffer
 * and the playback rate that puts it exactly in tune.
 */
function ks(ac: BaseAudioContext, f: number, str: Str, take = 0): [AudioBuffer, number] {
  const sr = ac.sampleRate;
  const L = Math.max(8, Math.round(sr / f) - 1);
  const fr = sr / (L + 1);
  const key = `${str.id}:${sr}:${L}:${take}`;
  let buf = STRINGS.get(key);
  if (!buf) {
    const t60 = Math.min(str.len, str.t60 * Math.sqrt(220 / fr));
    const rho = Math.pow(0.001, 1 / (t60 * fr));
    const n = Math.ceil(sr * Math.min(str.len, t60 * 1.1));
    buf = ac.createBuffer(1, n, sr);
    const y = buf.getChannelData(0);
    const w = new Float32Array(L);
    let lp = 0;
    for (let i = 0; i < L; i++) {
      lp += str.tone * (Math.random() * 2 - 1 - lp);
      w[i] = lp;
    }
    const P = Math.max(1, Math.round(str.pos * L));
    const e = new Float32Array(L);
    let mean = 0;
    for (let i = 0; i < L; i++) {
      e[i] = w[i] - (i >= P ? w[i - P] : 0);
      mean += e[i] / L;
    }
    let peak = 1e-9;
    for (let i = 0; i < n; i++) {
      const a = i - L;
      const fb =
        a < 0 ? 0 : 0.25 * y[a] + 0.5 * (a > 0 ? y[a - 1] : 0) + 0.25 * (a > 1 ? y[a - 2] : 0);
      y[i] = (i < L ? e[i] - mean : 0) + rho * fb;
      peak = Math.max(peak, Math.abs(y[i]));
    }
    const rise = Math.ceil(sr * 0.0015);
    const fall = Math.ceil(sr * 0.01);
    for (let i = 0; i < n; i++) y[i] *= Math.min(1, i / rise, (n - 1 - i) / fall) / peak;
    STRINGS.set(key, buf);
  }
  return [buf, f / fr];
}

interface Pluck {
  str?: Str;
  /** damp the string by hand after this long (s) */
  gate?: number;
  take?: number;
  dest?: AudioNode;
}

/** A plucked string, pizzicato unless told otherwise: bright for an instant, then wood. */
function pluck(s: SoundKit, f: number, at = 0, vol = 0.08, o: Pluck = {}): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const str = o.str ?? PIZZ;
  const [buf, rate] = ks(ac, f, str, o.take);
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate * Math.pow(2, rand(-3, 3) / 1200);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.8;
  lp.frequency.setValueAtTime(Math.min(9000, f * 10), t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(320, f * 2.4), t + str.shut);
  // the closing lowpass and the body take ~4 dB off the rendered string: give it back
  const peak = vol * 1.6;
  const g = ac.createGain();
  g.gain.setValueAtTime(peak, t);
  let end = t + buf.duration / rate;
  if (o.gate) {
    g.gain.setValueAtTime(peak, t + o.gate * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.gate);
    end = Math.min(end, t + o.gate);
  }
  src.connect(lp);
  lp.connect(g);
  g.connect(o.dest ?? body(s, ac, 'pizz'));
  src.start(t);
  src.stop(end + 0.02);
}

/** The bass on one: the low string and its octave, together. */
function bass(s: SoundKit, f: number, at = 0, vol = 0.11): void {
  pluck(s, f * 2, at, vol);
  pluck(s, f, at + 0.012, vol / 2);
}

/** A double-stop (or chord) rolled under the finger, the top note leaning in. */
function roll(s: SoundKit, fs: readonly number[], at: number, vol: number, spread = 0.02): void {
  fs.forEach((f, i) => pluck(s, f, at + i * spread * rand(0.8, 1.2), vol * (0.9 + 0.12 * i)));
}

interface Bow {
  /** [seconds in, Hz]: the bow lands on the first and slides to arrive on each next */
  path: (readonly [number, number])[];
  /** seconds the bow stays on the string */
  dur: number;
  vol: number;
  at?: number;
  /** seconds each slide takes */
  glide?: number;
  /** dynamics, [seconds in, 0–1], ramped between; the brightness follows */
  swell?: (readonly [number, number])[];
  /** lift the bow off short instead of letting the string ring */
  cut?: boolean;
}

/** Portamento: ease from one pitch to the next, slow to leave and slow to arrive. */
function slide(p: AudioParam, from: number, to: number, t: number, dur: number): void {
  p.setValueAtTime(from, t);
  for (let k = 1; k <= 6; k++) {
    const u = k / 6;
    p.exponentialRampToValueAtTime(from * Math.pow(to / from, u * u * (3 - 2 * u)), t + dur * u);
  }
}

/**
 * The solo cello: two saws and a triangle on one pitch line through a wooden
 * body; a slow bow that brightens as it digs in, a scoop onto the first note,
 * vibrato arriving late and easing off through each slide, rasp on the onset.
 */
function cello(s: SoundKit, o: Bow): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + (o.at ?? 0);
  const end = t + o.dur;
  const rel = o.cut ? 0.05 : 0.45;
  const stop = end + rel + 0.05;
  const glide = o.glide ?? 0.22;
  const dest = body(s, ac, 'bow');

  const pitch = ac.createConstantSource();
  const vib = ac.createOscillator();
  vib.frequency.value = rand(5, 5.6);
  const depth = ac.createGain();
  vib.connect(depth);
  depth.gain.setValueAtTime(0, t);
  depth.gain.setValueAtTime(0, t + 0.2);
  depth.gain.linearRampToValueAtTime(12, t + 0.65);
  let still = t + 0.65;

  let [, prev] = o.path[0];
  slide(pitch.offset, prev * 0.955, prev, t, 0.12);
  let free = t + 0.12;
  for (const [when, f] of o.path.slice(1)) {
    const arrive = Math.max(free + 0.02, t + when);
    const from = Math.max(free, arrive - glide);
    slide(pitch.offset, prev, f, from, arrive - from);
    if (from - 0.1 > still) {
      depth.gain.setValueAtTime(12, from - 0.1);
      depth.gain.linearRampToValueAtTime(5, from);
      depth.gain.linearRampToValueAtTime(12, arrive + 0.3);
      still = arrive + 0.3;
    }
    prev = f;
    free = arrive;
  }

  const mix = ac.createGain();
  mix.gain.value = 0.75;
  const oscs = (
    [
      ['sawtooth', 0, 0.5],
      ['sawtooth', 7, 0.32],
      ['triangle', -3, 0.45],
    ] as const
  ).map(([type, cents, lv]) => {
    const osc = ac.createOscillator();
    osc.type = type;
    osc.frequency.value = 0;
    osc.detune.value = cents;
    pitch.connect(osc.frequency);
    depth.connect(osc.detune);
    const g = ac.createGain();
    g.gain.value = lv;
    osc.connect(g);
    g.connect(mix);
    return osc;
  });

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.6;
  lp.frequency.setValueAtTime(600, t);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  const shape: (readonly [number, number])[] = o.swell ?? [
    [0.15, 0.5],
    [0.45, 0.85],
    [o.dur * 0.6, 1],
    [o.dur, 0.75],
  ];
  const swell = shape.filter(([when]) => when > 0 && when <= o.dur).sort((a, b) => a[0] - b[0]);
  let level = 0.0001;
  for (const [when, lv] of swell) {
    level = Math.max(0.0001, lv);
    amp.gain.linearRampToValueAtTime(level * o.vol, t + when);
    lp.frequency.exponentialRampToValueAtTime(600 + level * 2800, t + when);
  }
  amp.gain.linearRampToValueAtTime(level * o.vol, end);
  amp.gain.exponentialRampToValueAtTime(0.0001, end + rel);

  const hair = noise(ac);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2900;
  bp.Q.value = 0.8;
  const rasp = ac.createGain();
  rasp.gain.setValueAtTime(0.0001, t);
  rasp.gain.exponentialRampToValueAtTime(o.vol * 0.5, t + 0.015);
  rasp.gain.exponentialRampToValueAtTime(o.vol * 0.06, t + 0.2);
  rasp.gain.setValueAtTime(o.vol * 0.06, end);
  rasp.gain.exponentialRampToValueAtTime(0.0001, end + rel);

  mix.connect(lp);
  lp.connect(amp);
  amp.connect(dest);
  hair.connect(bp);
  bp.connect(rasp);
  rasp.connect(dest);
  pitch.start(t);
  vib.start(t);
  oscs.forEach((osc) => osc.start(t));
  hair.start(t, rand(0, 3));
  [pitch, vib, hair, ...oscs].forEach((node) => node.stop(stop));
}

/** The section behind, far off: two detuned saws a note, a slow bow, a shimmer of vibrato. */
function tutti(
  s: SoundKit,
  fs: readonly number[],
  at: number,
  dur: number,
  vol: number,
  dest?: AudioNode,
): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const vib = ac.createOscillator();
  vib.frequency.value = 5.8;
  const depth = ac.createGain();
  depth.gain.value = 8;
  vib.connect(depth);
  const mix = ac.createGain();
  mix.gain.value = 1 / Math.sqrt(fs.length * 2);
  const oscs = fs.flatMap((f) =>
    [-9, 8].map((cents) => {
      const osc = ac.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.detune.value = cents;
      depth.connect(osc.detune);
      osc.connect(mix);
      return osc;
    }),
  );
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1800;
  lp.Q.value = 0.5;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.linearRampToValueAtTime(vol, t + 0.4);
  amp.gain.setValueAtTime(vol, t + dur);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6);
  mix.connect(lp);
  lp.connect(amp);
  amp.connect(dest ?? body(s, ac, 'bow'));
  [vib, ...oscs].forEach((osc) => {
    osc.start(t);
    osc.stop(t + dur + 0.7);
  });
}

/* ------------------------------------------------------------- the waltz */

/** The waltz bar by bar: bass on one, the double-stop on two and three, the cello's line. */
const BARS = [
  { bass: N.D2, pair: [N.F4, N.A4], line: [N.A3, N.D4] },
  { bass: N.G2, pair: [N.G4, N.Bb4], line: [N.D4, N.G4] },
  { bass: N.C2, pair: [N.G4, N.C5], line: [N.G4, N.E4] },
  { bass: N.A1, pair: [N.Cs4, N.G4], line: [N.E4, N.Cs4] },
] as const;

/** Where one, two and three fall (s): two a little late, three later, never the same twice. */
function lilt(): [number, number, number] {
  const two = 0.48 + rand(0.02, 0.06);
  return [0, two, two + 0.48 + rand(0.04, 0.09)];
}

const MUTES = [N.D3, N.F3, N.A3, N.D4];
let lastMute = -1;
let take = 0;

/** Hover: a muted pizzicato, a stopped string on a D minor chord tone, never twice running. */
export function hover(s: SoundKit): void {
  let i = Math.floor(Math.random() * (MUTES.length - 1));
  if (lastMute >= 0 && i >= lastMute) i++;
  lastMute = i;
  take = 1 - take;
  pluck(s, MUTES[i], 0, rand(0.027, 0.033), { str: MUTED, gate: 0.065, take });
}

/** Click: a pizzicato D, firm, damped by the hand. */
export function press(s: SoundKit): void {
  pluck(s, N.D4, 0, 0.1, { gate: 0.14 });
}

/** Section: each room's own beat (Dm, Gm, C across nine rooms); two and three late, the cello on three. */
export function beat(s: SoundKit, room = 0): void {
  const r = ((Math.round(room) % 9) + 9) % 9;
  const bar = BARS[Math.floor(r / 3)];
  const k = r % 3;
  if (k === 0) return bass(s, bar.bass);
  const late = k === 1 ? rand(0.03, 0.06) : rand(0.06, 0.1);
  roll(s, bar.pair, late, k === 1 ? 0.05 : 0.046, k === 1 ? 0.018 : 0.026);
  if (k === 2) {
    cello(s, {
      at: late,
      path: [[0, bar.line[1]]],
      dur: 0.5,
      vol: 0.03,
      swell: [
        [0.35, 1],
        [0.5, 0.7],
      ],
    });
  }
}

/** A bar of the waltz: the bass, two and three late, the cello holding then sliding on three. */
export function waltz(s: SoundKit, n = 0, at = 0): void {
  if (!s.ctx()) return;
  const bar = BARS[((Math.round(n) % 4) + 4) % 4];
  const [, two, three] = lilt();
  bass(s, bar.bass, at);
  roll(s, bar.pair, at + two, 0.046, 0.018);
  roll(s, bar.pair, at + three, 0.042, 0.026);
  cello(s, {
    at,
    path: [
      [0, bar.line[0]],
      [three + 0.3, bar.line[1]],
    ],
    glide: 0.26,
    dur: three + 0.75,
    vol: 0.045,
    swell: [
      [0.25, 0.45],
      [two, 0.75],
      [three, 1],
      [three + 0.4, 0.85],
      [three + 0.75, 0.6],
    ],
  });
}

/** The descending sighs, D down to E: the surface walks the last n of them. */
const SIGHS = [N.D5, N.C5, N.Bb4, N.A4, N.G4, N.F4, N.E4];
const STEP = 0.2;
const count = (n?: number) => Math.min(6, Math.max(1, Math.round(n ?? 3)));

/** Seconds from the surface cue to where the cadence should take over. */
export const surfaceSpan = (n?: number) => 0.18 + count(n) * STEP + 0.25;

/** Surface: paper, the chop, then the cello sighing down a step per component, onto E. */
export function surface(s: SoundKit, n?: number): void {
  if (!s.ctx()) return;
  const k = count(n);
  paper(s);
  chop(s, 0.12);
  const path = SIGHS.slice(SIGHS.length - 1 - k).map(
    (f, i) => [i * STEP + (i ? rand(0, 0.03) : 0), f] as const,
  );
  const dur = k * STEP + 0.25;
  const swell: [number, number][] = [[0.08, 0.8]];
  for (let i = 1; i <= k; i++) swell.push([i * STEP - 0.1, 0.62], [i * STEP + 0.04, 0.95]);
  swell.push([dur, 0.6]);
  cello(s, { at: 0.18, path, glide: 0.09, dur, vol: 0.05, swell });
}

/** Done: A7 → D minor, plucked; the cello holds E over the D chord, then slides down into it. */
export function cadence(s: SoundKit, at = 0): void {
  if (!s.ctx()) return;
  pluck(s, N.A2, at, 0.12);
  roll(s, [N.E4, N.G4, N.Cs5], at + 0.44, 0.048, 0.016);
  bass(s, N.D2, at + 0.92, 0.12);
  roll(s, [N.F4, N.A4, N.D5], at + 1.36, 0.05, 0.02);
  cello(s, {
    at,
    path: [
      [0, N.E4],
      [1.24, N.D4],
    ],
    glide: 0.26,
    dur: 1.85,
    vol: 0.05,
    swell: [
      [0.3, 0.55],
      [0.92, 0.9],
      [1.05, 1],
      [1.5, 0.8],
      [1.85, 0.55],
    ],
  });
}

/** Error: a Phrygian half-cadence, B♭ sinking to A, and the cello lifting its bow mid-slide. */
export function halfCadence(s: SoundKit, at = 0): void {
  if (!s.ctx()) return;
  pluck(s, N.Bb2, at, 0.075);
  roll(s, [N.G3, N.D4], at + 0.02, 0.034);
  pluck(s, N.A2, at + 0.4, 0.075);
  roll(s, [N.E3, N.Cs4], at + 0.42, 0.034);
  cello(s, {
    at,
    path: [
      [0, N.D4],
      [0.7, N.Cs4],
    ],
    glide: 0.32,
    dur: 0.52,
    vol: 0.05,
    cut: true,
    swell: [
      [0.2, 0.8],
      [0.45, 1],
    ],
  });
}

/**
 * Title: one bar of the waltz, late on two and later on three, under a cello
 * that draws a breath on A and leans up to D as the bar turns over; the
 * strings come in behind it.
 */
export function sting(s: SoundKit): void {
  if (!s.ctx()) return;
  const t0 = 0.05;
  const [, two, three] = lilt();
  const land = three + 0.5;
  bass(s, N.D2, t0, 0.12);
  roll(s, [N.F4, N.A4], t0 + two, 0.046, 0.02);
  roll(s, [N.F4, N.A4], t0 + three, 0.042, 0.028);
  cello(s, {
    at: t0,
    path: [
      [0, N.A3],
      [land - 0.02, N.D4],
    ],
    glide: 0.3,
    dur: land + 0.8,
    vol: 0.058,
    swell: [
      [0.3, 0.45],
      [two, 0.7],
      [three, 0.85],
      [land, 1],
      [land + 0.45, 0.85],
      [land + 0.8, 0.6],
    ],
  });
  bass(s, N.D2, t0 + land, 0.1);
  roll(s, [N.A3, N.F4, N.D5], t0 + land + 0.03, 0.04, 0.03);
  tutti(s, [N.F4, N.A4, N.D5], t0 + land - 0.1, 0.85, 0.026);
}

/** Doorplates and the cupboard: a string harmonic, touched and damped, glassy and brief. */
export function harmonic(s: SoundKit): void {
  if (!s.ctx()) return;
  const f = pick([N.D5, N.F5, N.A5]);
  s.tone({ f0: f, dur: 0.07, vol: 0.026 });
  s.tone({ f0: f * 2, dur: 0.035, vol: 0.005 });
  s.tone({ f0: f, dur: 0.07, vol: 0.012, dest: s.reverb(1.6) });
}

/** The rules: an open pizzicato on a D minor chord tone, left to ring. */
export function tenet(s: SoundKit): void {
  pluck(s, pick([N.D4, N.F4, N.A4, N.D5]), 0, 0.042);
}

/* ------------------------------------------------------------- the radio */

/** The small set's valve: a soft tanh knee. */
const VALVE = Float32Array.from({ length: 1024 }, (_, i) => Math.tanh((i / 511.5 - 1) * 1.5));

/** A small speaker: no lows, no highs, a honk where paper cones honk. */
const SPEAKER: Band[] = [
  ['highpass', 380, 0.7, 0],
  ['peaking', 1500, 0.9, 5],
  ['lowpass', 4000, 0.9, 0],
];

/** The stations on the dial: [bass, strum] for each half of the bar. */
const STATIONS: (readonly [number, readonly number[]])[][] = [
  [
    [N.D3, [N.D3, N.A3, N.B3, N.F4]],
    [N.A2, [N.E3, N.Bb3, N.Cs4, N.G4]],
  ],
  [
    [N.G2, [N.E3, N.Bb3, N.D4, N.G4]],
    [N.A2, [N.D3, N.A3, N.D4, N.F4]],
  ],
  [
    [N.Bb2, [N.F3, N.Ab3, N.D4, N.F4]],
    [N.A2, [N.E3, N.Bb3, N.Cs4, N.G4]],
  ],
];

/** A guitar stroke: the strings in turn, a hair apart, the nail brushing across. */
function strum(
  s: SoundKit,
  fs: readonly number[],
  at: number,
  vol: number,
  up: boolean,
  dest: AudioNode,
): void {
  (up ? [...fs].reverse() : fs).forEach((f, i) =>
    pluck(s, f, at + i * (up ? 0.01 : 0.015), vol * (1 - i * 0.06), { str: NYLON, dest }),
  );
  s.burst({ dur: 0.025, f: 2600, q: 0.6, vol: vol * 0.4, at, dest });
}

/** One maraca shake: seeds thrown against the gourd, a soft front and a quick fall. */
function maraca(s: SoundKit, at: number, vol: number, dest: AudioNode): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const src = noise(ac);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = rand(3800, 4600);
  bp.Q.value = 1;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  src.connect(bp);
  bp.connect(g);
  g.connect(dest);
  src.start(t, rand(0, 3));
  src.stop(t + 0.08);
}

/** A bongó: the skin struck, the pitch settling; an open tone rings, a tap doesn't. */
function bongo(
  s: SoundKit,
  f: number,
  at: number,
  vol: number,
  open: boolean,
  dest: AudioNode,
): void {
  s.tone({ f0: f * 1.25, f1: f, dur: open ? 0.13 : 0.045, vol, at, dest });
  s.burst({ dur: 0.006, f: 2000, q: 0.8, vol: vol * 0.7, at, dest });
}

/**
 * The landlady's radio, dialled: static and a heterodyne whistle, then for a
 * moment a bolero bar in D minor (thumbed bass, strums pushing on two-and,
 * maracas, a bongó martillo, strings far off) from a small speaker with wow,
 * until the signal drifts. `n` picks the station. The handle is the dial:
 * stop it and the set goes quiet.
 */
export function radio(s: SoundKit, n = 0): Bed | null {
  const ac = s.ctx();
  if (!ac) return null;
  const t = ac.currentTime;
  const q = 0.46;
  const on = 0.32;
  const off = on + 4 * q;
  const end = off + 0.55;

  const out = ac.createGain();
  out.connect(s.out());
  const room = ac.createGain();
  room.gain.value = 0.15;
  out.connect(room);
  room.connect(s.reverb(1.6));
  const drive = ac.createGain();
  drive.gain.value = 2;
  const valve = ac.createWaveShaper();
  valve.curve = VALVE;
  drive.connect(valve);
  const level = ac.createGain();
  level.gain.value = 0.1;
  eq(ac, valve, SPEAKER).connect(level);
  level.connect(out);

  const input = ac.createGain();
  const wow = ac.createDelay(0.05);
  wow.delayTime.value = 0.01;
  const station = ac.createGain();
  station.gain.setValueAtTime(0.0001, t);
  station.gain.setValueAtTime(0.0001, t + on - 0.08);
  station.gain.exponentialRampToValueAtTime(1, t + on + 0.06);
  station.gain.setValueAtTime(1, t + off);
  station.gain.exponentialRampToValueAtTime(0.0001, t + end);
  const fader = ac.createGain();
  fader.gain.value = 0.85;
  input.connect(wow);
  wow.connect(station);
  station.connect(fader);
  fader.connect(drive);
  const lfos = (
    [
      [0.55, 0.0008, wow.delayTime],
      [6.5, 0.00005, wow.delayTime],
      [0.4, 0.15, fader.gain],
    ] as const
  ).map(([hz, amount, param]) => {
    const lfo = ac.createOscillator();
    lfo.frequency.value = hz * rand(0.85, 1.15);
    const g = ac.createGain();
    g.gain.value = amount;
    lfo.connect(g);
    g.connect(param);
    lfo.start(t);
    lfo.stop(t + end + 0.05);
    return lfo;
  });

  const air = noise(ac);
  const dial = ac.createBiquadFilter();
  dial.type = 'bandpass';
  dial.Q.value = 2.5;
  const [lo, hi] = n % 2 ? [2600, 800] : [700, 2400];
  dial.frequency.setValueAtTime(lo, t);
  dial.frequency.exponentialRampToValueAtTime(hi, t + on - 0.04);
  const sg = ac.createGain();
  sg.gain.setValueAtTime(0.0001, t);
  sg.gain.exponentialRampToValueAtTime(0.07, t + 0.04);
  sg.gain.exponentialRampToValueAtTime(0.056, t + on - 0.1);
  sg.gain.exponentialRampToValueAtTime(0.01, t + on + 0.08);
  sg.gain.setValueAtTime(0.01, t + off);
  sg.gain.exponentialRampToValueAtTime(0.03, t + off + 0.25);
  sg.gain.exponentialRampToValueAtTime(0.0001, t + end);
  air.connect(dial);
  dial.connect(sg);
  sg.connect(drive);
  air.start(t, rand(0, 3));
  air.stop(t + end + 0.05);

  const whistle = ac.createOscillator();
  whistle.frequency.setValueAtTime(2400, t);
  whistle.frequency.exponentialRampToValueAtTime(300, t + on);
  const wg = ac.createGain();
  wg.gain.setValueAtTime(0.0001, t);
  wg.gain.exponentialRampToValueAtTime(0.025, t + 0.07);
  wg.gain.exponentialRampToValueAtTime(0.0001, t + on + 0.02);
  whistle.connect(wg);
  wg.connect(drive);
  whistle.start(t);
  whistle.stop(t + on + 0.05);
  for (let i = 0; i < 4; i++) {
    s.burst({ dur: 0.004, f: 2400, q: 0.6, vol: 0.08, at: rand(on, off), dest: drive });
  }

  STATIONS[((Math.round(n) % 3) + 3) % 3].forEach(([low, chord], h) => {
    const b = on + h * 2 * q;
    pluck(s, low, b, 0.08, { str: NYLON, dest: input });
    strum(s, chord, b + q, 0.04, false, input);
    strum(s, chord.slice(-3), b + 1.5 * q + 0.012, 0.03, true, input);
    tutti(
      s,
      chord.slice(-3).map((f) => f * 2),
      b,
      2 * q - 0.05,
      0.016,
      input,
    );
  });
  for (let x = 0; x < 8; x++) {
    const at = on + (x * q) / 2 + (x % 2 ? 0.014 : 0);
    maraca(s, at, x % 2 ? 0.02 : 0.032, input);
    bongo(s, x === 7 ? 290 : 410, at, x > 5 ? 0.032 : x % 2 ? 0.011 : 0.016, x > 5, input);
  }

  const long = [air, ...lfos];
  return {
    stop(fade = 0.08) {
      const now = ac.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), now);
      out.gain.exponentialRampToValueAtTime(0.0001, now + fade);
      for (const node of long) {
        try {
          node.stop(now + fade + 0.02);
        } catch {
          /* already stopped */
        }
      }
    },
  };
}

/* -------------------------------------------------------------- the rooms */

/** Rain in the lamp: looped, filtered noise, faded in. */
export function rain(s: SoundKit, signal?: AbortSignal): Bed | null {
  return s.bed((ac, out) => {
    const src = noise(ac);
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 600;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5000;
    const g = ac.createGain();
    const t = ac.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.035, t + 1);
    src.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(out);
    src.start(t, rand(0, 3));
    return {
      stop(fade = 0.7) {
        const now = ac.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + fade);
        src.stop(now + fade + 0.1);
      },
    };
  }, signal);
}

/** The door: band-passed noise wandering like a dry hinge, over a groan sagging from D. */
export function creak(s: SoundKit, long = false): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const dur = long ? 0.9 : 0.5;
  const n = noise(ac);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 9;
  const curve = new Float32Array(16);
  for (let i = 0; i < 16; i++) curve[i] = 520 + Math.sin(i * 1.7) * 160 + Math.random() * 220;
  bp.frequency.setValueCurveAtTime(curve, t, dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.14, t + 0.08);
  g.gain.setValueAtTime(0.14, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(bp);
  bp.connect(g);
  g.connect(s.out());
  n.start(t, rand(0, 3));
  n.stop(t + dur + 0.02);
  const o = ac.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(N.D2, t);
  o.frequency.linearRampToValueAtTime(61.74, t + dur);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 260;
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.exponentialRampToValueAtTime(0.05, t + 0.1);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp);
  lp.connect(g2);
  g2.connect(s.out());
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** A door pulled to: wood meeting the frame, then the latch. */
export function latch(s: SoundKit): void {
  s.burst({ dur: 0.05, kind: 'lowpass', f: 380, q: 0.8, vol: 0.15 });
  s.tone({ f0: 110, f1: 70, dur: 0.06, vol: 0.06 });
  s.burst({ dur: 0.012, f: 2600, q: 5, vol: 0.07, at: 0.035 });
}

/** The wall clock, close to: tick, then tock. */
export function tickTock(s: SoundKit): void {
  s.burst({ dur: 0.012, f: 2600, q: 7, vol: 0.12 });
  s.burst({ dur: 0.012, f: 1900, q: 7, vol: 0.1, at: 0.32 });
}

/** A struck rod: fundamental plus the inharmonic partials of a bar, the high ones dying first. */
function bell(s: SoundKit, f: number, at = 0, vol = 0.06): void {
  if (!s.ctx()) return;
  const verb = s.reverb(1.6);
  (
    [
      [1, 1, 1.8],
      [2.76, 0.4, 0.9],
      [5.4, 0.15, 0.45],
      [8.93, 0.05, 0.2],
    ] as const
  ).forEach(([m, v, dur]) => {
    s.tone({ f0: f * m, dur, vol: vol * v, at });
    s.tone({ f0: f * m, dur, vol: vol * v * 0.3, at, dest: verb });
  });
}

/** The clock strikes: D, then down to A. */
export function chime(s: SoundKit): void {
  bell(s, N.D5, 0, 0.055);
  bell(s, N.A4, 0.75, 0.055);
}

/** An enamel sign, tapped. */
export function tink(s: SoundKit): void {
  s.tone({ type: 'triangle', f0: 3150, dur: 0.12, vol: 0.02 });
  s.tone({ f0: 4720, dur: 0.08, vol: 0.01, at: 0.01 });
}

/** A page turned. */
export function paper(s: SoundKit): void {
  s.burst({ dur: 0.05, kind: 'highpass', f: 2600, vol: 0.09 });
  s.burst({ dur: 0.03, kind: 'highpass', f: 3600, vol: 0.06, at: 0.05 });
}

/** The red chop pressed onto the answer. */
function chop(s: SoundKit, at = 0): void {
  s.tone({ f0: 140, f1: 70, dur: 0.08, vol: 0.18, at });
}

/** One typewriter key. */
export function key(s: SoundKit, at = 0): void {
  s.burst({ dur: 0.02, f: 2800 + Math.random() * 1400, q: 1.3, vol: 0.15, at });
  s.tone({ f0: 170, f1: 90, dur: 0.035, vol: 0.06, at });
}

/** Noise through a filter with a swell: steam, breath, plaster. */
function hiss(
  s: SoundKit,
  kind: BiquadFilterType,
  f: number,
  q: number,
  peak: number,
  dur: number,
): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const n = noise(ac);
  const fl = ac.createBiquadFilter();
  fl.type = kind;
  fl.frequency.value = f;
  fl.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(fl);
  fl.connect(g);
  g.connect(s.out());
  n.start(t, rand(0, 3));
  n.stop(t + dur + 0.02);
}

/** The thermos at the noodle stall, steaming. */
export const steam = (s: SoundKit) => hiss(s, 'highpass', 3200, 0.7, 0.03, 0.9);

/** A secret whispered into the wall. */
export const breath = (s: SoundKit) => hiss(s, 'bandpass', 1100, 0.6, 0.05, 0.7);

/** The wall sealed over it. */
export function plaster(s: SoundKit): void {
  s.burst({ dur: 0.14, kind: 'lowpass', f: 300, q: 0.7, vol: 0.45 });
  hiss(s, 'bandpass', 480, 1.2, 0.06, 0.45);
}

/* -------------------------------------------------------------- the score */

const score: ReelScore = {
  after: "after Shigeru Umebayashi's waltz and the boleros on the radio",
  idea: 'a lilting pizzicato waltz in D minor under a solo cello that slides into every note; a bolero on a small radio',
  cues: [
    { id: 'hover', label: 'muted pizzicato', play: (s) => hover(s) },
    { id: 'click', label: 'pizzicato D', play: (s) => press(s) },
    { id: 'section', label: 'a waltz beat per room', play: (s, n) => beat(s, n) },
    { id: 'surface', label: 'paper, the chop, cello sighs', play: (s, n) => surface(s, n) },
    { id: 'done', label: 'A7 → Dm, cello E into D', play: (s) => cadence(s) },
    { id: 'error', label: 'half-cadence, bow lifted', play: (s) => halfCadence(s) },
    { id: 'title', label: 'waltz bar, cello A → D', play: (s) => sting(s) },
    { id: 'rain', label: 'rain in the lamp', play: (s) => rain(s) },
    { id: 'doorplate', label: 'string harmonic', play: (s) => harmonic(s) },
    { id: 'tenet', label: 'open pizzicato', play: (s) => tenet(s) },
    { id: 'waltz', label: 'a bar of the waltz', play: (s, n) => waltz(s, n) },
    { id: 'radio', label: 'static, then a bolero', play: (s, n) => void radio(s, n) },
    { id: 'creak', label: 'door ajar', play: (s) => creak(s) },
    { id: 'swing', label: 'door swung open', play: (s) => creak(s, true) },
    { id: 'latch', label: 'door pulled to', play: (s) => latch(s) },
    { id: 'clock', label: 'tick, tock', play: (s) => tickTock(s) },
    { id: 'chime', label: 'the clock strikes', play: (s) => chime(s) },
    { id: 'sign', label: 'enamel sign', play: (s) => tink(s) },
    { id: 'paper', label: 'a page turned', play: (s) => paper(s) },
    { id: 'key', label: 'typewriter key', play: (s) => key(s) },
    { id: 'steam', label: 'thermos steam', play: (s) => steam(s) },
    { id: 'whisper', label: 'a secret into the wall', play: (s) => breath(s) },
    { id: 'plaster', label: 'the wall sealed', play: (s) => plaster(s) },
  ],
};

export default score;
