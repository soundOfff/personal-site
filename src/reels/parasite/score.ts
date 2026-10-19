/**
 * Reel 01 · Parasite: the score, after Jung Jae-il. Every sound the reel makes
 * lives here; client.ts only decides when.
 *
 * The film plays its class farce against deadpan baroque: harpsichord, chamber
 * strings, motoric running figures in a minor key. So the house gets a
 * harpsichord (8' with the 4' coupled) and a string trio, in C minor:
 *   - hover is a jack's quill, click a single harpsichord note,
 *   - each floor down is a step of the lament bass, C · B♭ · A♭ · G, with a
 *     continuo chord rolled above; the bunker stops on the dominant, unresolved,
 *   - the playground climbs a sequence, then cadences (trill, Picardy third) or
 *     falls into a deceptive cadence,
 *   - the title card gets a moto perpetuo: running semiquavers over strings.
 * The diegetic sounds (footsteps, lamps, rain, glass, the Morse key) are tuned
 * to the same key. No melodies are quoted; everything is synthesized.
 */
import type { Bed, SoundKit } from '../sound';
import type { ReelScore } from '../types';
import { SECTION_IDS } from '../types';
import { actOf } from '../registry';
import parasite from './config';

/* ---------- pitch ---------- */

const STEPS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 'Eb5' → 75: note names to MIDI, so the motifs read as music. */
function midi(name: string): number {
  const m = /^([A-G])(b|#)?(\d)$/.exec(name);
  if (!m) throw new Error(`score: bad note ${name}`);
  return 12 * (Number(m[3]) + 1) + STEPS[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0);
}
const notes = (line: string): number[] => line.trim().split(/\s+/).map(midi);
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const LAST = SECTION_IDS.length - 1;

/** The floor (act) a section is on: 0 living room · 1 stairs · 2 semi-basement · 3 bunker. */
export const floorOf = (sec: number): number => actOf(parasite, clamp(Math.round(sec), 0, LAST));

/* ---------- the instruments ---------- */

const filter = (ac: BaseAudioContext, type: BiquadFilterType, f: number, q = 0.7) => {
  const b = ac.createBiquadFilter();
  b.type = type;
  b.frequency.value = f;
  b.Q.value = q;
  return b;
};

/**
 * An envelope's gain, silent until its first event: a source started between
 * frames can sound one frame early, and a default gain of 1 makes that a click.
 */
function envelope(ac: BaseAudioContext): GainNode {
  const g = ac.createGain();
  g.gain.value = 0;
  return g;
}

const GRAINS = new Map<number, AudioBuffer>();

/** Half a second of white noise per sample rate, sliced for every click and scrape. */
function grain(ac: BaseAudioContext): AudioBuffer {
  let buf = GRAINS.get(ac.sampleRate);
  if (!buf) {
    buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.5), ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    GRAINS.set(ac.sampleRate, buf);
  }
  return buf;
}

/** A grain of noise at `t`, decaying over `dur`: jacks, quills, rosin. */
function tap(ac: BaseAudioContext, t: number, vol: number, dest: AudioNode, dur: number): void {
  const buf = grain(ac);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = envelope(ac);
  g.gain.setValueAtTime(Math.max(0.0001, vol), t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(g);
  g.connect(dest);
  src.start(t, Math.random() * (buf.duration - dur - 0.01));
  src.stop(t + dur + 0.005);
}

const STRINGS = new Map<string, AudioBuffer>();

/**
 * A harpsichord string, plucked once offline (Karplus–Strong) and cached per
 * sample rate and pitch: noise combed at the quill's pluck point near the nut,
 * round a delay line with a two-tap lowpass and an allpass for the fraction.
 */
function string(ac: BaseAudioContext, m: number): AudioBuffer {
  const sr = ac.sampleRate;
  const key = `${sr}:${m}`;
  const hit = STRINGS.get(key);
  if (hit) return hit;
  const f = hz(m);
  const len = Math.floor(sr * clamp(1.5 - (m - 36) * 0.02, 0.6, 1.5));
  const t60 = clamp(4 - (m - 36) * 0.06, 1, 4);
  // the treble loses less per pass, so it stays bright as it decays
  const S = clamp(0.5 - (m - 48) * 0.008, 0.25, 0.5);
  const D = sr / f;
  const L = Math.max(2, Math.floor(D - S - 0.1));
  const frac = D - S - L;
  const a = (1 - frac) / (1 + frac);
  const rho = Math.pow(0.001, 1 / (f * t60));
  const raw = new Float32Array(L);
  for (let i = 0; i < L; i++) raw[i] = Math.random() * 2 - 1;
  const line = new Float32Array(L);
  const pick = Math.max(1, Math.round(L * 0.12));
  const soft = clamp(0.6 - (m - 36) * 0.01, 0.15, 0.6);
  let prev = 0;
  for (let i = 0; i < L; i++) {
    prev += (1 - soft) * (raw[i] - raw[(i - pick + L) % L] - prev);
    line[i] = prev;
  }
  const buf = ac.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  let i = 0;
  let x1 = 0;
  let a1 = 0;
  let y1 = 0;
  for (let n = 0; n < len; n++) {
    const x = line[i];
    out[n] = x;
    const lp = (1 - S) * x + S * x1;
    x1 = x;
    const y = a * lp + a1 - a * y1;
    a1 = lp;
    y1 = y;
    line[i] = y * rho;
    if (++i === L) i = 0;
  }
  let peak = 0;
  for (let n = 0; n < Math.min(len, L * 2); n++) peak = Math.max(peak, Math.abs(out[n]));
  const g = 1 / (peak || 1);
  const fade = Math.floor(sr * 0.03);
  for (let n = 0; n < len; n++) out[n] *= n > len - fade ? (g * (len - n)) / fade : g;
  STRINGS.set(key, buf);
  return buf;
}

/** Sound a cached string at `t`; the damper falls after `hold`. */
function ring(
  ac: BaseAudioContext,
  buf: AudioBuffer,
  t: number,
  vol: number,
  hold: number,
  dest: AudioNode,
  damp = 0.014,
  rate = 1,
): void {
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  const g = envelope(ac);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.0015);
  g.gain.setTargetAtTime(0, t + hold, damp);
  src.connect(g);
  g.connect(dest);
  src.start(t);
  src.stop(Math.min(t + buf.duration / rate, t + hold + damp * 7));
}

/** Play one key: MIDI note, absolute time, level, how long it's held, and whether the 4' sounds. */
type Pluck = (m: number, t: number, vol: number, hold?: number, four?: boolean) => void;

/**
 * The harpsichord: the 8' choir with the 4' coupled an octave up, quieter and
 * a hair sharp, each key with its jack's thock, through a bright, nasal body.
 */
function harpsichord(
  s: SoundKit,
  ac: BaseAudioContext,
  o: { wet?: number; verb?: number; low?: number; damp?: number } = {},
): Pluck {
  const hp = filter(ac, 'highpass', o.low ?? 70);
  const nasal = filter(ac, 'peaking', 2600, 0.9);
  nasal.gain.value = 3;
  const top = filter(ac, 'lowpass', 9500);
  hp.connect(nasal);
  nasal.connect(top);
  top.connect(s.out());
  const send = ac.createGain();
  send.gain.value = o.wet ?? 0.12;
  top.connect(send);
  send.connect(s.reverb(o.verb ?? 1.4));
  const jack = filter(ac, 'bandpass', 1500, 1.4);
  jack.connect(hp);
  return (m, t, vol, hold = 0.3, four = true) => {
    ring(ac, string(ac, m), t, vol, hold, hp, o.damp);
    if (four) ring(ac, string(ac, m + 12), t + 0.002, vol * 0.35, hold, hp, o.damp, 1.0012);
    tap(ac, t, vol * 0.3, jack, 0.012);
  };
}

/** The trio's bodies: lowpass at rest and on the bite, body resonances, detune spread, seat. */
const PARTS = {
  cello: { rest: 750, bite: 2200, peaks: [220, 3, 1300, 2], spread: 7, hp: 55, pan: 0.15 },
  viola: { rest: 1200, bite: 3000, peaks: [380, 2, 2000, 3], spread: 6, hp: 110, pan: 0.05 },
  violin: { rest: 1900, bite: 4600, peaks: [480, 2, 2800, 4], spread: 5, hp: 190, pan: -0.2 },
} as const;
type Part = keyof typeof PARTS;

/** One bow stroke: MIDI note, start (s, from the line's t0), length (s), weight. */
type Stroke = [m: number, at: number, len: number, w?: number];

/**
 * A string player: détaché strokes on three detuned saws, the lowpass opening
 * on each bite with a rosin scrape, a scoop up into the first note, vibrato
 * that blooms only on long notes. `sag` (cents) lets the last note droop.
 * Returns a release, so a new note can take over the line.
 */
function bow(
  s: SoundKit,
  ac: BaseAudioContext,
  part: Part,
  t0: number,
  strokes: Stroke[],
  vol: number,
  o: { wet?: number; verb?: number; sag?: number } = {},
): (t: number) => void {
  const p = PARTS[part];
  const start = t0 + strokes[0][1];
  const [, lastAt, lastLen] = strokes[strokes.length - 1];
  const end = t0 + lastAt + lastLen + 0.7;

  const mix = ac.createGain();
  mix.gain.value = 1 / 3;
  const lp = filter(ac, 'lowpass', p.rest, 0.8);
  const body1 = filter(ac, 'peaking', p.peaks[0], 1.2);
  body1.gain.value = p.peaks[1];
  const body2 = filter(ac, 'peaking', p.peaks[2], 1.2);
  body2.gain.value = p.peaks[3];
  const hp = filter(ac, 'highpass', p.hp);
  const amp = envelope(ac);
  amp.gain.setValueAtTime(0, start);
  const pan = ac.createStereoPanner();
  pan.pan.value = p.pan;
  mix.connect(lp);
  lp.connect(body1);
  body1.connect(body2);
  body2.connect(hp);
  hp.connect(amp);
  amp.connect(pan);
  pan.connect(s.out());
  const send = ac.createGain();
  send.gain.value = o.wet ?? 0.14;
  pan.connect(send);
  send.connect(s.reverb(o.verb ?? 1.4));
  const rosin = filter(ac, 'bandpass', p.bite, 0.8);
  rosin.connect(pan);

  const vib = ac.createOscillator();
  vib.frequency.value = 5.2 + Math.random() * 0.6;
  const depth = envelope(ac);
  depth.gain.setValueAtTime(0, start);
  vib.connect(depth);
  const oscs = [-p.spread, 0, p.spread].map((cents) => {
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.detune.value = cents;
    depth.connect(osc.detune);
    osc.connect(mix);
    return osc;
  });

  strokes.forEach(([m, at, len, w = 1], k) => {
    const t = t0 + at;
    const f = hz(m);
    const pk = vol * w;
    const long = len > 0.3;
    const moved = k > 0 && m !== strokes[k - 1][0];
    for (const osc of oscs) {
      if (k === 0) {
        osc.frequency.setValueAtTime(f * 0.986, t);
        osc.frequency.setTargetAtTime(f, t, 0.03);
      } else if (moved) {
        osc.frequency.setTargetAtTime(f, t - 0.004, 0.006);
      }
      if (o.sag && k === strokes.length - 1) {
        osc.frequency.setTargetAtTime(f * 2 ** (o.sag / 1200), t + len * 0.45, len * 0.3);
      }
    }
    amp.gain.setTargetAtTime(pk, t, long ? 0.03 : 0.008);
    amp.gain.setTargetAtTime(
      pk * (long ? 0.62 : 0.72),
      t + (long ? Math.min(0.3, len * 0.4) : Math.min(0.035, len * 0.3)),
      long ? 0.35 : 0.05,
    );
    amp.gain.setTargetAtTime(0, t + len * (long ? 0.94 : 0.8), long ? 0.1 : 0.016);
    lp.frequency.setTargetAtTime(p.bite, t, 0.006);
    lp.frequency.setTargetAtTime(p.rest, t + 0.03, long ? 0.12 : 0.05);
    tap(ac, t, pk * 0.5, rosin, 0.05);
    if (moved) depth.gain.setTargetAtTime(0, t, 0.03);
    if (len >= 0.6) {
      depth.gain.setValueAtTime(0, t + 0.18);
      depth.gain.linearRampToValueAtTime(9, t + 0.55);
    }
  });

  oscs.forEach((osc) => osc.start(start));
  vib.start(start);
  oscs.forEach((osc) => osc.stop(end));
  vib.stop(end);

  return (t) => {
    if (t >= end - 0.6) return;
    amp.gain.cancelScheduledValues(t);
    amp.gain.setTargetAtTime(0, t, 0.05);
    try {
      oscs.forEach((osc) => osc.stop(t + 0.4));
      vib.stop(t + 0.4);
    } catch {
      /* a browser that only takes one stop: let it ring out silent */
    }
  };
}

/* ---------- the house: diegetic sounds, tuned to the key ---------- */

/** Reverb per floor: [seconds, send]. The deeper the floor, the longer the echo. */
const VERB: readonly (readonly [number, number])[] = [
  [0.9, 0.05],
  [1.4, 0.18],
  [2.0, 0.34],
  [2.8, 0.55],
];

/** The lament bass, a step per floor: C · B♭ · A♭ · G. The bunker stays on the dominant. */
const LAMENT = notes('C3 Bb2 Ab2 G2');

/** One step on a floor: a dull thud, pitched round that floor's bass note, through its room. */
export function footstep(s: SoundKit, floor: number, up: boolean, vol = 1, at = 0): void {
  const ac = s.ctx();
  if (!ac) return;
  const f = clamp(floor, 0, 3);
  const [seconds, wet] = VERB[f];
  const dry = ac.createGain();
  dry.gain.value = vol;
  dry.connect(s.out());
  const send = ac.createGain();
  send.gain.value = wet;
  dry.connect(send);
  send.connect(s.reverb(seconds));
  s.burst({ dur: 0.07, kind: 'lowpass', f: 560 - f * 70, q: 0.8, vol: 0.5, dest: dry, at });
  s.tone({ f0: hz(LAMENT[f]) * (up ? 1.06 : 0.92), f1: 55, dur: 0.08, vol: 0.22, dest: dry, at });
}

function relay(s: SoundKit, at = 0): void {
  s.burst({ dur: 0.006, kind: 'highpass', f: 2500, vol: 0.4, at });
}

/** The fluorescent tube's hum, on the semi-basement's A♭. */
function hum(s: SoundKit, at: number, dur: number): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const o = ac.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = hz(midi('Ab2'));
  const lp = filter(ac, 'lowpass', 420);
  const g = envelope(ac);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.03, t + 0.05);
  g.gain.setValueAtTime(0.03, t + dur - 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp);
  lp.connect(g);
  g.connect(s.out());
  o.start(t);
  o.stop(t + dur + 0.05);
}

/**
 * A lamp clicking on, in the notes of that floor's chord: the stairs' relays
 * and a B♭ tick, the tube's A♭–F tinks and hum, the bunker bulb's D ping.
 */
export function lamp(s: SoundKit, floor: number): void {
  relay(s);
  if (floor === 1) {
    relay(s, 0.035);
    s.tone({ f0: hz(midi('Bb6')), dur: 0.05, vol: 0.02, at: 0.04 });
  } else if (floor === 2) {
    s.tone({ f0: hz(midi('Ab7')), dur: 0.02, vol: 0.05, at: 0.07 });
    s.tone({ f0: hz(midi('F7')), dur: 0.02, vol: 0.05, at: 0.19 });
    hum(s, 0.22, 0.7);
  } else {
    const d = hz(midi('D7'));
    s.tone({ type: 'triangle', f0: d, f1: d * 0.97, dur: 0.2, vol: 0.04, at: 0.02 });
  }
}

/** Light sliding across the living-room glass: E♭ and G, high. */
export function glass(s: SoundKit): void {
  s.tone({ type: 'triangle', f0: hz(midi('Eb7')), dur: 0.5, vol: 0.025 });
  s.tone({ type: 'triangle', f0: hz(midi('G7')), dur: 0.6, vol: 0.018, at: 0.06 });
}

/** The censor bar wiping off the headline. */
export function bar(s: SoundKit): void {
  s.swipe();
}

/** The bunker's telegraph, on E♭. */
const KEY_HZ = hz(midi('Eb5'));

/** The Morse key held down; returns its release. */
export function keyTone(s: SoundKit): (() => void) | null {
  const ac = s.ctx();
  if (!ac) return null;
  const o = ac.createOscillator();
  o.frequency.value = KEY_HZ;
  const g = envelope(ac);
  const t = ac.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.006);
  o.connect(g);
  g.connect(s.out());
  o.start(t);
  return () => {
    const now = ac.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
    o.stop(now + 0.03);
  };
}

/** One keyed symbol of `dur` seconds. */
export function beep(s: SoundKit, dur: number, at = 0): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const o = ac.createOscillator();
  o.frequency.value = KEY_HZ;
  const g = envelope(ac);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.006);
  g.gain.setValueAtTime(0.12, t + Math.max(0.01, dur - 0.012));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(s.out());
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** Rain on the stairs: band-limited noise, faded in, looped. */
export function rain(s: SoundKit, signal?: AbortSignal): Bed | null {
  return s.bed((ac, out) => {
    const src = s.noise(2.5);
    src.loop = true;
    const hp = filter(ac, 'highpass', 500);
    const lp = filter(ac, 'lowpass', 5200);
    const g = envelope(ac);
    const t = ac.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.9);
    src.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(out);
    src.start(t);
    return {
      stop(fade = 0.6) {
        const now = ac.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + fade);
        src.stop(now + fade + 0.05);
      },
    };
  }, signal);
}

/* ---------- the score ---------- */

/** The quill's strings: high C minor, walked a step at a time. */
const QUILL = notes('C6 Eb6 F6 G6 Bb6');
let quillAt = 2;

/** Hover: a jack clicking in its rail, the quill barely catching a string. */
export function quill(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  quillAt = clamp(quillAt + (Math.random() < 0.5 ? -1 : 1), 0, QUILL.length - 1);
  const click = filter(ac, 'bandpass', 3000 + Math.random() * 800, 1.2);
  click.connect(s.out());
  tap(ac, t, 0.12, click, 0.006);
  const felt = filter(ac, 'bandpass', 950, 2.5);
  felt.connect(s.out());
  tap(ac, t + 0.004, 0.06, felt, 0.014);
  ring(ac, string(ac, QUILL[quillAt]), t + 0.003, 0.012, 0.012, s.out());
}

/** The click's walk: a little C-minor phrase, a note per press. */
const WALK = notes('C5 Eb5 G5 F5 Eb5 D5 B4 C5');
let walkAt = 0;

/** Click: one harpsichord key, 8' and 4', damped short. */
export function note(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const m = WALK[walkAt];
  walkAt = (walkAt + 1) % WALK.length;
  harpsichord(s, ac, { wet: 0, damp: 0.01 })(m, ac.currentTime, 0.17, 0.07);
}

/** The continuo's chord above each lament step: i · v6 · iv6 · V, the top falling in tenths. */
const CONTINUO = [notes('G4 C5 Eb5'), notes('G4 Bb4 D5'), notes('F4 Ab4 C5'), notes('D4 G4 B4')];
let cello: { ac: BaseAudioContext; release: (t: number) => void } | null = null;

/**
 * A step of the lament bass as the floor changes: cello on the bass note, the
 * harpsichord an octave below it, a chord rolled above, all in that floor's
 * room. Deeper is lower, longer and wetter; the bunker ends on G, unresolved.
 */
export function lament(s: SoundKit, floor: number, at = 0): void {
  const ac = s.ctx();
  if (!ac) return;
  const f = clamp(floor, 0, 3);
  const t = ac.currentTime + at;
  const [verb, room] = VERB[f];
  const wet = 0.08 + room * 0.6;
  const len = 0.7 + f * 0.22;
  const bass = LAMENT[f];
  const harp = harpsichord(s, ac, { wet, verb, low: 40 });
  harp(bass - 12, t, 0.06, len * 0.7);
  CONTINUO[f].forEach((m, k) => harp(m, t + 0.07 + k * 0.045, 0.032, len * 0.8, false));
  if (cello?.ac === ac) cello.release(t);
  cello = { ac, release: bow(s, ac, 'cello', t, [[bass, 0, len]], 0.065, { wet, verb }) };
}

/** Arriving in section `n`: a footstep on its floor, and the lament's step when it opens a floor. */
export function section(s: SoundKit, n = 0): void {
  const i = clamp(Math.round(n), 0, LAST);
  const floor = floorOf(i);
  footstep(s, floor, false);
  if (i === 0 || floorOf(i - 1) !== floor) lament(s, floor, 0.16);
}

/** The playground's pulse: a semiquaver. */
const SEMI = 0.11;
/** Broken thirds climbing a sequence, a note per composed component, over the lament's first steps. */
const FIGURE = notes('C5 Eb5 D5 F5 Eb5 G5');
const FIGURE_BASS = notes('C3 Bb2 Ab2');
const count = (n?: number) => clamp(Math.round(n ?? 3), 1, FIGURE.length);

/** When the done cadence falls after a figure of `n` notes: a semiquaver's rest, in time. */
export const cadenceAfter = (n?: number): number => (count(n) + 1) * SEMI;
/** When the done cadence lands on its last chord, from its start. */
export const CADENCE_LANDS = 6 * SEMI;

/** Surface: the harpsichord climbs, one note per component (1–6). */
export function figure(s: SoundKit, n?: number, at = 0): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const harp = harpsichord(s, ac, { wet: 0.1 });
  FIGURE.slice(0, count(n)).forEach((m, k) => {
    harp(m, t + k * SEMI, 0.065, 0.2);
    if (k % 2 === 0) harp(FIGURE_BASS[k / 2], t + k * SEMI, 0.05, 0.4, false);
  });
}

/**
 * Done: iv, then V with the suspended C trilled down to B♮ and turned through
 * A♮, then I with a Picardy third, the violin on the E♮.
 */
export function cadence(s: SoundKit, at = 0): void {
  const ac = s.ctx();
  if (!ac) return;
  const u = SEMI;
  const t = ac.currentTime + at;
  const land = t + 6 * u;
  const harp = harpsichord(s, ac, { wet: 0.12 });
  harp(midi('F2'), t, 0.055, 2 * u);
  notes('Ab4 C5').forEach((m, k) => harp(m, t + 0.02 + k * 0.025, 0.045, 2 * u - 0.07));
  harp(midi('G2'), t + 2 * u, 0.055, 4 * u);
  harp(midi('D4'), t + 2 * u + 0.02, 0.035, 4 * u, false);
  notes('C5 B4 C5 B4 C5 B4 A4 B4').forEach((m, k) =>
    harp(m, t + 2 * u + (k * u) / 2, k ? 0.042 : 0.05, u / 2 + 0.02),
  );
  harp(midi('C2'), land, 0.05, 0.9, false);
  harp(midi('C3'), land, 0.045, 0.9);
  notes('E4 G4 C5').forEach((m, k) => harp(m, land + 0.025 + k * 0.03, 0.04, 0.8));
  const [F2, G2, C3] = notes('F2 G2 C3');
  bow(
    s,
    ac,
    'cello',
    t,
    [
      [F2, 0, 2 * u - 0.02],
      [G2, 2 * u, 4 * u - 0.02],
      [C3, 6 * u, 0.85],
    ],
    0.05,
  );
  bow(s, ac, 'violin', land, [[midi('E5'), 0, 0.8]], 0.035);
}

/** Error: V7 to VI, a deceptive cadence; the cello's A♭ sags as the plan falls apart. */
export function deceptive(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const u = 0.12;
  const t = ac.currentTime;
  const vi = t + 3 * u;
  const [G2, Ab2] = notes('G2 Ab2');
  const harp = harpsichord(s, ac, { wet: 0.12 });
  harp(G2, t, 0.045, 3 * u);
  notes('F4 B4 D5').forEach((m, k) => harp(m, t + 0.02 + k * 0.03, 0.032, 3 * u - 0.03));
  harp(Ab2, vi, 0.045, 0.5);
  notes('Eb4 C5 Eb5').forEach((m, k) => harp(m, vi + 0.02 + k * 0.03, 0.032, 0.45));
  bow(
    s,
    ac,
    'cello',
    t,
    [
      [G2, 0, 3 * u - 0.02],
      [Ab2, 3 * u, 0.7],
    ],
    0.042,
    { sag: -70 },
  );
}

const RUN_UP = notes('C5 D5 Eb5 F5 G5 Ab5 B5 C6');
const RUN_DOWN = notes('C6 Bb5 Ab5 G5 F5 Eb5 D5 C5');

/** A tirata: the harpsichord's quick run, landing with the 4'. */
function tirata(s: SoundKit, line: number[]): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const harp = harpsichord(s, ac, { wet: 0.1 });
  line.forEach((m, k) => {
    const last = k === line.length - 1;
    harp(m, t + k * 0.026, last ? 0.05 : 0.026 + k * 0.003, last ? 0.3 : 0.05, last);
  });
}

/** The playground opening: a run up to the octave. */
export const tirataUp = (s: SoundKit): void => tirata(s, RUN_UP);
/** The playground closing: a run back down. */
export const tirataDown = (s: SoundKit): void => tirata(s, RUN_DOWN);

/** The title's semiquaver. */
const U = 0.095;
const PICKUP = notes('G4 A4 B4');
/** i · v6 · VI · V7 over the lament bass, a broken figure per beat. */
const RUN = notes('C5 G4 Eb5 G4  D5 G4 Bb4 G4  Eb5 Ab4 C5 Ab4  F5 B4 D5 B4');
const LEFT = notes('C3 Bb2 Ab2 G2');
/** The trio's drum bass, a note per beat then the arrival: violin rises as the bass falls. */
const TRIO: [Part, number[], number][] = [
  ['cello', notes('C3 Bb2 Ab2 G2 C3'), 0.06],
  ['viola', notes('Eb4 D4 C4 B3 C4'), 0.037],
  ['violin', notes('C5 D5 Eb5 F5 Eb5'), 0.048],
];

/**
 * The title card: a moto perpetuo. A three-note pickup, then a bar of running
 * semiquavers on the harpsichord over the trio's repeated détaché quavers,
 * down the lament bass to V7, landing on i at 1.8 s with vibrato in the tail.
 */
export function overture(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  const one = 3 * U;
  const land = one + 16 * U;
  const harp = harpsichord(s, ac, { wet: 0.13 });
  PICKUP.forEach((m, k) => harp(m, t + k * U, 0.065 + k * 0.006, 0.13));
  RUN.forEach((m, k) => harp(m, t + one + k * U, k % 4 ? 0.072 : 0.09, 0.13));
  LEFT.forEach((m, k) => harp(m, t + one + k * 4 * U, 0.065, 0.3, false));
  harp(midi('C2'), t + land, 0.07, 1, false);
  harp(midi('C3'), t + land, 0.06, 1, false);
  notes('G4 C5 Eb5').forEach((m, k) => harp(m, t + land + 0.03 + k * 0.03, 0.06, 0.95));
  for (const [part, line, vol] of TRIO) {
    const strokes: Stroke[] = line.flatMap((m, beat): Stroke[] =>
      beat < 4
        ? [
            [m, one + beat * 4 * U, 0.17, 1],
            [m, one + (beat * 4 + 2) * U, 0.17, 0.8],
          ]
        : [[m, land, 0.95, 1.25]],
    );
    bow(s, ac, part, t, strokes, vol);
  }
}

const score: ReelScore = {
  after: 'after Jung Jae-il',
  idea: "Deadpan baroque in C minor: a harpsichord (8' and 4') and a string trio play the house straight, a lament bass for the descent.",
  cues: [
    { id: 'hover', label: 'harpsichord quill', play: (s) => quill(s) },
    { id: 'click', label: 'a harpsichord key', play: (s) => note(s) },
    { id: 'section', label: 'footstep · lament bass', play: (s, n) => section(s, n) },
    { id: 'surface', label: 'climbing broken thirds', play: (s, n) => figure(s, n) },
    { id: 'done', label: 'trilled cadence, Picardy third', play: (s) => cadence(s) },
    { id: 'error', label: 'deceptive cadence', play: (s) => deceptive(s) },
    { id: 'title', label: 'moto perpetuo', play: (s) => overture(s) },
    { id: 'open', label: 'tirata up', play: (s) => tirataUp(s) },
    { id: 'close', label: 'tirata down', play: (s) => tirataDown(s) },
    { id: 'rain', label: 'rain on the stairs', play: (s) => rain(s) },
    { id: 'step', label: 'a step on the stairs', play: (s) => footstep(s, 1, false, 0.5) },
    { id: 'stairs', label: 'stair lights: relays', play: (s) => lamp(s, 1) },
    { id: 'tube', label: 'fluorescent tube', play: (s) => lamp(s, 2) },
    { id: 'bulb', label: 'bunker bulb', play: (s) => lamp(s, 3) },
    { id: 'glass', label: 'light on the glass', play: (s) => glass(s) },
    { id: 'bar', label: 'censor bar', play: (s) => bar(s) },
    {
      id: 'key',
      label: 'Morse key',
      play: (s) => {
        beep(s, 0.095);
        beep(s, 0.285, 0.19);
      },
    },
  ],
};

export default score;
