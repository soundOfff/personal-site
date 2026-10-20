/**
 * Reel 03 · Blade Runner 2049: the score. Every sound the reel makes, after
 * Hans Zimmer and Benjamin Wallfisch by way of Vangelis. Pressure and weather:
 * braams of low saw brass driven through a tanh and bent, a sub you feel in
 * the chest, a dirty siren riser, scraped metal, long concrete rooms. Through
 * it, the CS-80's warmth: detuned brass with slow attacks, portamento in from
 * below and late vibrato, and ring-modulated bells for the holograms.
 *
 * Home is D, minor and suspended, low and slow. Down the page the acts walk
 * D sus2 → B♭ → C → D minor → a glassy D minor add 9, and "done" is the one
 * warm lift, D minor to D major. Gestures in the score's idiom, never its tunes.
 */
import type { Bed, BurstOpts, SoundKit } from '../sound';
import type { ReelScore } from '../types';
import { actOf } from '../registry';
import br2049 from './config';

/** the small room (stabs, foley) and the concrete hall (swells, the title) */
const ROOM = 2.6;
const HALL = 5;

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/* ---------- shared parts, cached ---------- */

const curves = new Map<number, Float32Array<ArrayBuffer>>();
/** a tanh transfer curve, normalised so full scale stays full scale */
function tanh(drive: number): Float32Array<ArrayBuffer> {
  let c = curves.get(drive);
  if (!c) {
    c = new Float32Array(1024);
    for (let i = 0; i < c.length; i++) {
      c[i] = Math.tanh(drive * ((i / (c.length - 1)) * 2 - 1)) / Math.tanh(drive);
    }
    curves.set(drive, c);
  }
  return c;
}

const noises = new WeakMap<BaseAudioContext, AudioBuffer>();
/** cached white noise (3 s per context) started at `t`: for `dur`, or looping from `offset` */
function hiss(ac: BaseAudioContext, t: number, dur?: number, offset = 0): AudioBufferSourceNode {
  let buf = noises.get(ac);
  if (!buf) {
    const n = Math.floor(ac.sampleRate * 3);
    buf = ac.createBuffer(1, n, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    noises.set(ac, buf);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  if (dur === undefined) {
    src.loop = true;
    src.start(t, offset % 3);
  } else {
    src.start(t, Math.random() * Math.max(0, 3 - dur));
    src.stop(t + dur);
  }
  return src;
}

const crackles = new WeakMap<BaseAudioContext, AudioBuffer>();
/** four seconds of record crackle: sparse, short clicks (cached per context) */
function crackle(ac: BaseAudioContext): AudioBuffer {
  let buf = crackles.get(ac);
  if (!buf) {
    const n = Math.floor(ac.sampleRate * 4);
    buf = ac.createBuffer(1, n, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n - 12; i++) {
      if (Math.random() > 0.00022) continue;
      const amp = 0.3 + Math.random() * 0.7;
      const len = 4 + Math.floor(Math.random() * 8);
      for (let j = 0; j < len; j++) d[i + j] = (Math.random() * 2 - 1) * amp * (1 - j / len);
    }
    crackles.set(ac, buf);
  }
  return buf;
}

/** a send into one of the kit's rooms, high-passed so the low end stays dry */
function send(
  s: SoundKit,
  ac: BaseAudioContext,
  from: AudioNode,
  amount: number,
  room = ROOM,
  hp = 180,
): void {
  const g = ac.createGain();
  g.gain.value = amount;
  const f = ac.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  from.connect(g);
  g.connect(f);
  f.connect(s.reverb(room));
}

/** attack to `hi`, a slow fall to `sus` of it, then release to `lo` by `end`; never to 0 */
function env(
  p: AudioParam,
  t: number,
  end: number,
  lo: number,
  hi: number,
  att: number,
  sus: number,
  rel: number,
  linear = false,
): void {
  const top = t + att;
  const hold = Math.min(end - 0.01, Math.max(top + 0.01, end - rel));
  p.setValueAtTime(lo, t);
  if (linear) p.linearRampToValueAtTime(hi, top);
  else p.exponentialRampToValueAtTime(hi, top);
  p.exponentialRampToValueAtTime(Math.max(lo, hi * sus), hold);
  p.exponentialRampToValueAtTime(lo, end);
}

/** a filtered noise hit, like the kit's burst but from the cached noise */
function hit(s: SoundKit, o: BurstOpts): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + (o.at ?? 0);
  const n = hiss(ac, t, o.dur);
  const f = ac.createBiquadFilter();
  f.type = o.kind ?? 'bandpass';
  f.frequency.value = o.f ?? 2000;
  f.Q.value = o.q ?? 0.9;
  const g = ac.createGain();
  g.gain.setValueAtTime(o.vol ?? 0.3, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  n.connect(f);
  f.connect(g);
  g.connect(o.dest ?? s.out());
}

/* ---------- voices ---------- */

interface BrassOpts {
  at?: number;
  dur?: number;
  /** the amp's attack; the filter opens a little slower */
  att?: number;
  vol?: number;
  /** where the filter peaks */
  bright?: number;
  /** semitones of portamento in from below */
  glide?: number;
  /** vibrato depth in cents, fading in `vibAt` s after the onset */
  vib?: number;
  vibAt?: number;
  /** a slide by this many semitones, `liftAt` s after the onset */
  lift?: number;
  liftAt?: number;
  pan?: number;
  verb?: number;
  room?: number;
}

/** CS-80 brass: detuned saws, a soft tanh, a slow filter attack, portamento, late vibrato */
function cs80(s: SoundKit, f: number, o: BrassOpts = {}): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + (o.at ?? 0);
  const dur = o.dur ?? 1.8;
  const att = o.att ?? 0.4;
  const end = t + dur;
  const pre = ac.createGain();
  pre.gain.value = 0.38;
  const warm = ac.createWaveShaper();
  warm.curve = tanh(1.5);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 2.2;
  env(lp.frequency, t, end, Math.max(160, f * 1.4), o.bright ?? 2200, att * 1.2, 0.45, dur * 0.4);
  const amp = ac.createGain();
  env(amp.gain, t, end, 0.0001, o.vol ?? 0.04, att, 0.72, Math.min(0.9, dur * 0.42), true);
  const pan = ac.createStereoPanner();
  pan.pan.value = o.pan ?? 0;
  pre.connect(warm);
  warm.connect(lp);
  lp.connect(amp);
  amp.connect(pan);
  pan.connect(s.out());
  send(s, ac, pan, o.verb ?? 0.45, o.room ?? HALL, 160);

  // the aftertouch vibrato: nothing at the onset, swelling in late
  const depth = o.vib ?? 9;
  const vibAt = t + (o.vibAt ?? 0.5);
  let vib: GainNode | null = null;
  if (depth > 0 && vibAt < end - 0.2) {
    const lfo = ac.createOscillator();
    lfo.frequency.value = 5.2 + Math.random() * 0.6;
    vib = ac.createGain();
    vib.gain.setValueAtTime(0, t);
    vib.gain.setValueAtTime(0, vibAt);
    vib.gain.linearRampToValueAtTime(depth, Math.min(end, vibAt + 0.6));
    lfo.connect(vib);
    lfo.start(t);
    lfo.stop(end + 0.05);
  }

  const glide = o.glide ?? 0;
  for (const cents of [-7, 0, 6]) {
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.detune.value = cents + (Math.random() - 0.5) * 3;
    osc.frequency.setValueAtTime(f * Math.pow(2, -glide / 12), t);
    if (glide) osc.frequency.setTargetAtTime(f, t, 0.05 + glide * 0.02);
    if (o.lift) {
      const lt = t + (o.liftAt ?? dur * 0.4);
      osc.frequency.setValueAtTime(f, lt);
      osc.frequency.exponentialRampToValueAtTime(f * Math.pow(2, o.lift / 12), lt + 0.32);
    }
    vib?.connect(osc.detune);
    osc.connect(pre);
    osc.start(t);
    osc.stop(end + 0.05);
  }
}

/** the braam: low saws driven hard, a lowpass tearing open, a dip at the onset, a droop out */
function braam(s: SoundKit, f: number, at = 0, dur = 2.8, vol = 0.09): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const end = t + dur;
  const pre = ac.createGain();
  pre.gain.value = 0.3;
  const grit = ac.createWaveShaper();
  grit.curve = tanh(3.2);
  grit.oversample = '2x';
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 1.4;
  lp.frequency.setValueAtTime(90, t);
  lp.frequency.exponentialRampToValueAtTime(1500, t + 0.38);
  lp.frequency.exponentialRampToValueAtTime(520, end - 0.9);
  lp.frequency.exponentialRampToValueAtTime(110, end);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.linearRampToValueAtTime(vol, t + 0.14);
  amp.gain.exponentialRampToValueAtTime(vol * 0.7, end - 0.9);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);
  pre.connect(grit);
  grit.connect(lp);
  lp.connect(amp);
  amp.connect(s.out());
  send(s, ac, amp, 0.4, HALL, 220);

  // one bend for every saw: a sag at the onset, a long droop on the way out
  const bend = ac.createConstantSource();
  bend.offset.setValueAtTime(0, t);
  bend.offset.linearRampToValueAtTime(-40, t + 0.09);
  bend.offset.linearRampToValueAtTime(0, t + 0.55);
  bend.offset.setValueAtTime(0, end - 0.9);
  bend.offset.linearRampToValueAtTime(-220, end);
  bend.start(t);
  bend.stop(end + 0.05);
  for (const m of [1, 1.5, 2]) {
    for (const cents of [-11, 10]) {
      const osc = ac.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f * m;
      osc.detune.value = cents;
      bend.connect(osc.detune);
      osc.connect(pre);
      osc.start(t);
      osc.stop(end + 0.05);
    }
  }
}

/** the sub hit: a clean sine dropping an octave into the floor, and a push of air */
function sub(s: SoundKit, f: number, at = 0, dur = 2.4, vol = 0.17): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const end = t + dur;
  const osc = ac.createOscillator();
  osc.frequency.setValueAtTime(f * 2, t);
  osc.frequency.exponentialRampToValueAtTime(f, t + 0.28);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(vol * 0.55, t + 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(g);
  g.connect(s.out());
  osc.start(t);
  osc.stop(end + 0.05);
  hit(s, { dur: 0.9, kind: 'lowpass', f: 140, q: 0.7, vol: 0.2, at });
}

/** the riser: a dirty saw cluster sirening up a fifth, noise climbing beside it, cut at the top */
function riser(s: SoundKit, at = 0, dur = 1.1, vol = 0.05, f = hz(50)): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const end = t + dur;
  const pre = ac.createGain();
  pre.gain.value = 0.35;
  const dirt = ac.createWaveShaper();
  dirt.curve = tanh(2.6);
  dirt.oversample = '2x';
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 3;
  lp.frequency.setValueAtTime(280, t);
  lp.frequency.exponentialRampToValueAtTime(4200, end);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(vol, end - 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, end + 0.07);
  pre.connect(dirt);
  dirt.connect(lp);
  lp.connect(amp);
  amp.connect(s.out());
  send(s, ac, amp, 0.5, ROOM, 300);

  const lfo = ac.createOscillator();
  lfo.frequency.value = 3.4;
  const wobble = ac.createGain();
  wobble.gain.setValueAtTime(0, t);
  wobble.gain.linearRampToValueAtTime(22, end);
  lfo.connect(wobble);
  lfo.start(t);
  lfo.stop(end + 0.1);
  for (const m of [1, 1.0595, 1.4983]) {
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f * m, t);
    osc.frequency.exponentialRampToValueAtTime(f * m * 1.4983, end);
    wobble.connect(osc.detune);
    osc.connect(pre);
    osc.start(t);
    osc.stop(end + 0.1);
  }
  const n = hiss(ac, t, dur + 0.1);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.6;
  bp.frequency.setValueAtTime(500, t);
  bp.frequency.exponentialRampToValueAtTime(6000, end);
  const ng = ac.createGain();
  ng.gain.value = 0.8;
  n.connect(bp);
  bp.connect(ng);
  ng.connect(amp);
}

/** metal dragged through a concrete room: noise in two narrow, inharmonic bands, sliding down */
function scrape(s: SoundKit, at = 0, dur = 1.6, vol = 0.3, f = 2300): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const end = t + dur;
  const n = hiss(ac, t, dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  for (const m of [1, 1.53]) {
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 16;
    bp.frequency.setValueAtTime(f * m, t);
    bp.frequency.exponentialRampToValueAtTime(f * m * 0.82, end);
    n.connect(bp);
    bp.connect(g);
  }
  g.connect(s.out());
  send(s, ac, g, 0.55, HALL, 400);
}

/** a hologram bell: a sine ring-modulated by an inharmonic sine, a little dry, flickering on */
function bell(s: SoundKit, f: number, at = 0, vol = 0.05, dur = 1.5): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const end = t + dur;
  const car = ac.createOscillator();
  car.frequency.value = f;
  const mod = ac.createOscillator();
  mod.frequency.value = f * 2.41;
  const ring = ac.createGain();
  ring.gain.value = 0;
  mod.connect(ring.gain);
  car.connect(ring);
  // the metal fades first, the tone under it rings on
  const shimmer = ac.createGain();
  shimmer.gain.setValueAtTime(1, t);
  shimmer.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.5);
  const dry = ac.createGain();
  dry.gain.value = 0.45;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  for (const [d, v] of [
    [0.004, 1],
    [0.014, 1],
    [0.018, 0.2],
    [0.03, 0.2],
    [0.034, 1],
    [0.046, 1],
    [0.05, 0.35],
    [0.058, 0.35],
    [0.062, 1],
  ]) {
    g.gain.linearRampToValueAtTime(v * vol, t + d);
  }
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  ring.connect(shimmer);
  shimmer.connect(g);
  car.connect(dry);
  dry.connect(g);
  g.connect(s.out());
  send(s, ac, g, 0.55, ROOM, 300);
  car.start(t);
  mod.start(t);
  car.stop(end + 0.05);
  mod.stop(end + 0.05);
}

/** a dry HUD tick, higher than the shared one */
function tick(s: SoundKit): void {
  s.tone({ f0: 2200, f1: 1500, dur: 0.008, vol: 0.05 });
}

/** the HUD click: a dry tick on a tiny low thump */
function click(s: SoundKit): void {
  hit(s, { dur: 0.012, kind: 'highpass', f: 3600, vol: 0.16 });
  s.tone({ f0: 2600, f1: 1800, dur: 0.012, vol: 0.05 });
  s.tone({ f0: 120, f1: 48, dur: 0.09, vol: 0.2 });
}

/** a hologram flicker for hovers: a high ring-mod chirp, gated three times in 50 ms */
function holo(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const f = 2000 + Math.random() * 900;
  const car = ac.createOscillator();
  car.frequency.value = f;
  const mod = ac.createOscillator();
  mod.frequency.value = f * 0.31;
  const ring = ac.createGain();
  ring.gain.value = 0;
  mod.connect(ring.gain);
  car.connect(ring);
  const g = ac.createGain();
  const vol = 0.03;
  g.gain.setValueAtTime(0.0001, t);
  for (const [d, v] of [
    [0.003, 1],
    [0.012, 1],
    [0.015, 0.0001],
    [0.022, 0.0001],
    [0.025, 0.8],
    [0.033, 0.8],
    [0.036, 0.0001],
    [0.041, 0.0001],
    [0.044, 0.6],
  ]) {
    g.gain.linearRampToValueAtTime(v * vol, t + d);
  }
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.056);
  ring.connect(g);
  g.connect(s.out());
  car.start(t);
  mod.start(t);
  car.stop(t + 0.06);
  mod.stop(t + 0.06);
}

/** the scanner: noise in a narrow band sweeping up */
function scan(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const n = hiss(ac, t, 0.22);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 3;
  bp.frequency.setValueAtTime(2600, t);
  bp.frequency.exponentialRampToValueAtTime(8200, t + 0.2);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  n.connect(bp);
  bp.connect(g);
  g.connect(s.out());
}

/** a distorted low growl: a semitone cluster and its tritone through a hard tanh, sagging */
function growl(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const end = t + 0.48;
  const pre = ac.createGain();
  pre.gain.value = 0.4;
  const grit = ac.createWaveShaper();
  grit.curve = tanh(7);
  grit.oversample = '2x';
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 4;
  lp.frequency.setValueAtTime(1100, t);
  lp.frequency.exponentialRampToValueAtTime(260, end);
  // the growl: the amplitude shaking at 24 Hz
  const trem = ac.createGain();
  trem.gain.value = 0.55;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 24;
  const shake = ac.createGain();
  shake.gain.value = 0.45;
  lfo.connect(shake);
  shake.connect(trem.gain);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.linearRampToValueAtTime(0.055, t + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.04, t + 0.3);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);
  pre.connect(grit);
  grit.connect(lp);
  lp.connect(trem);
  trem.connect(amp);
  amp.connect(s.out());
  send(s, ac, amp, 0.2, ROOM, 200);
  const bend = ac.createConstantSource();
  bend.offset.setValueAtTime(0, t);
  bend.offset.linearRampToValueAtTime(-130, end);
  for (const m of [33, 34, 39]) {
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = hz(m);
    bend.connect(osc.detune);
    osc.connect(pre);
    osc.start(t);
    osc.stop(end + 0.05);
  }
  for (const n of [bend, lfo]) {
    n.start(t);
    n.stop(end + 0.05);
  }
}

/** the spinner's pass: a HUD click, a rush crossing left to right, a turbine falling as it goes */
function fly(s: SoundKit): void {
  click(s);
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const end = t + 0.85;
  const pan = ac.createStereoPanner();
  pan.pan.setValueAtTime(-0.7, t);
  pan.pan.linearRampToValueAtTime(0.7, end);
  pan.connect(s.out());
  send(s, ac, pan, 0.3, ROOM, 300);
  const n = hiss(ac, t, 0.85);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.exponentialRampToValueAtTime(2600, t + 0.35);
  bp.frequency.exponentialRampToValueAtTime(500, end);
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.12, t + 0.3);
  ng.gain.exponentialRampToValueAtTime(0.0001, end);
  n.connect(bp);
  bp.connect(ng);
  ng.connect(pan);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 700;
  const tg = ac.createGain();
  tg.gain.setValueAtTime(0.0001, t);
  tg.gain.exponentialRampToValueAtTime(0.05, t + 0.3);
  tg.gain.exponentialRampToValueAtTime(0.0001, end);
  lp.connect(tg);
  tg.connect(pan);
  for (const cents of [-9, 9]) {
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.detune.value = cents;
    osc.frequency.setValueAtTime(172, t);
    osc.frequency.setValueAtTime(172, t + 0.28);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.62);
    osc.connect(lp);
    osc.start(t);
    osc.stop(end + 0.05);
  }
}

/** an archive drawer: a rolling slide, the latch, the ring of the steel */
function drawer(s: SoundKit): void {
  hit(s, { dur: 0.11, kind: 'lowpass', f: 900, q: 0.8, vol: 0.2 });
  hit(s, { dur: 0.008, kind: 'highpass', f: 2600, vol: 0.3, at: 0.1 });
  s.tone({ f0: 1870, f1: 1840, dur: 0.12, vol: 0.012, at: 0.1 });
  s.tone({ f0: 3010, f1: 2980, dur: 0.08, vol: 0.007, at: 0.1 });
}

/** a knock on carved wood, pitched from the key */
function knock(s: SoundKit): void {
  const f = hz([62, 64, 65][Math.floor(Math.random() * 3)]);
  s.tone({ type: 'triangle', f0: f, f1: f * 0.62, dur: 0.07, vol: 0.12 });
  hit(s, { dur: 0.02, f: 1200, q: 2, vol: 0.12 });
}

/** snow melting under the pointer: a glassy glint from the snow pad's chord, sinking a little */
function melt(s: SoundKit): void {
  const f = hz([98, 100, 101, 105][Math.floor(Math.random() * 4)]);
  s.tone({ f0: f, f1: f * 0.9, dur: 0.3, vol: 0.022 });
  s.tone({ f0: f * 2.01, f1: f * 1.8, dur: 0.12, vol: 0.006 });
}

/** snow on the steps: a glassy pad, D minor add 9 in triangles and sines, the filter drifting */
function snow(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  lp.Q.value = 0.9;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 0.21;
  const drift = ac.createGain();
  drift.gain.value = 700;
  lfo.connect(drift);
  drift.connect(lp.frequency);
  lp.connect(s.out());
  send(s, ac, lp, 0.55, HALL, 300);
  lfo.start(t);
  lfo.stop(t + 4.1);
  [62, 65, 69, 76].forEach((m, i) => {
    const at = t + i * 0.12;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(0.02, at + 1);
    g.gain.exponentialRampToValueAtTime(0.012, at + 2.2);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 3.6);
    g.connect(lp);
    for (const [type, mul, level, cents] of [
      ['triangle', 1, 1, (i - 1.5) * 4],
      ['sine', 2, 0.3, 3 - i * 2],
    ] as const) {
      const osc = ac.createOscillator();
      osc.type = type;
      osc.frequency.value = hz(m) * mul;
      osc.detune.value = cents;
      const og = ac.createGain();
      og.gain.value = level;
      osc.connect(og);
      og.connect(g);
      osc.start(at);
      osc.stop(at + 3.65);
    }
  });
}

/* ---------- motifs ---------- */

/** the act swells, the chord rolled up from the bass (midi notes, then each voice's pan) */
const ACTS: { notes: number[]; pans: number[]; o: BrassOpts }[] = [
  // the cold open: D sus2, low in the haze
  {
    notes: [38, 45, 52],
    pans: [0, -0.3, 0.3],
    o: { att: 0.6, dur: 2.4, bright: 1700, glide: 2, vol: 0.038 },
  },
  // Wallace: B♭, low and warm
  {
    notes: [34, 41, 50],
    pans: [0, -0.2, 0.25],
    o: { att: 0.7, dur: 2.5, bright: 1300, glide: 1, vol: 0.042 },
  },
  // Las Vegas: fifths stacked on C, wide and bright
  {
    notes: [36, 43, 50, 57],
    pans: [0, -0.7, 0.7, -0.25],
    o: { att: 0.5, dur: 2.4, bright: 2900, glide: 2, vol: 0.034 },
  },
  // Los Angeles: D minor, the filter barely open
  {
    notes: [38, 45, 53],
    pans: [0, -0.25, 0.2],
    o: { att: 0.55, dur: 2.4, bright: 1050, glide: 1, vol: 0.04 },
  },
];

/** one swell per act: the haze, Wallace, Las Vegas, Los Angeles; the snow is a pad */
function section(s: SoundKit, n = 0): void {
  const a = ACTS[actOf(br2049, Math.min(8, Math.max(0, Math.round(n) || 0)))];
  if (!a) {
    snow(s);
    return;
  }
  a.notes.forEach((m, k) =>
    cs80(s, hz(m), {
      ...a.o,
      at: k * 0.09,
      vol: (a.o.vol ?? 0.04) * (k ? 0.68 : 1),
      vib: k ? 9 : 0,
      vibAt: 0.75,
      pan: a.pans[k],
    }),
  );
}

/** a composed surface: scanner, hologram bell, brass stab, up D minor pentatonic with the count */
const RUNGS = [74, 77, 79, 81, 84, 86];
function surface(s: SoundKit, n = 1): void {
  const m = RUNGS[Math.min(RUNGS.length, Math.max(1, Math.round(n) || 1)) - 1];
  scan(s);
  bell(s, hz(m), 0.02);
  const o: BrassOpts = {
    at: 0.04,
    dur: 0.75,
    att: 0.05,
    bright: 3200,
    glide: 1,
    vib: 0,
    verb: 0.35,
    room: ROOM,
  };
  cs80(s, hz(m - 24), { ...o, vol: 0.04 });
  cs80(s, hz(m - 17), { ...o, vol: 0.024 });
}

/** done: a slow CS-80 chord in D minor whose third slides up to F♯, and a glint of light above */
function resolve(s: SoundKit, at = 0): void {
  const o: BrassOpts = { dur: 2.6, att: 0.5, bright: 2400, glide: 1, vibAt: 1.2, vib: 8 };
  cs80(s, hz(38), { ...o, at, vol: 0.028, vib: 0 });
  cs80(s, hz(45), { ...o, at: at + 0.07, vol: 0.03, pan: 0.2 });
  cs80(s, hz(53), { ...o, at: at + 0.14, vol: 0.038, pan: -0.2, lift: 1, liftAt: 0.85 });
  cs80(s, hz(57), { ...o, at: at + 0.2, vol: 0.026, pan: 0.3 });
  s.tone({ f0: hz(90), dur: 1.7, vol: 0.012, at: at + 1.2 });
}

/** the title card: braam and sub land together, metal scrapes behind, a CS-80 voice rises */
function title(s: SoundKit): void {
  braam(s, hz(38), 0.05);
  sub(s, hz(26), 0.05);
  scrape(s, 0.25, 1.8);
  cs80(s, hz(65), {
    at: 0.8,
    dur: 2.2,
    att: 0.7,
    vol: 0.022,
    bright: 2000,
    glide: 2,
    vibAt: 0.9,
    vib: 12,
    verb: 0.6,
  });
}

/** the agent's console opens: a short riser blooming into Wallace's low brass */
function open(s: SoundKit): void {
  riser(s, 0, 0.5, 0.032);
  const o: BrassOpts = { dur: 1.8, att: 0.35, bright: 1400, glide: 1, vibAt: 0.8 };
  cs80(s, hz(34), { ...o, at: 0.45, vol: 0.03, vib: 0 });
  cs80(s, hz(41), { ...o, at: 0.52, vol: 0.02, pan: -0.25 });
  cs80(s, hz(50), { ...o, at: 0.59, vol: 0.02, pan: 0.25 });
}

/** the console closes: a HUD tick and one brass note sighing down a fourth */
function close(s: SoundKit): void {
  s.tone({ f0: 1500, f1: 1100, dur: 0.012, vol: 0.05 });
  cs80(s, hz(50), {
    dur: 0.6,
    att: 0.04,
    vol: 0.04,
    bright: 1600,
    vib: 0,
    lift: -5,
    liftAt: 0.08,
    verb: 0.3,
    room: ROOM,
  });
}

/* ---------- beds ---------- */

/** rain on the windscreen: two noise loops a stereo width apart, gusting, over a far city rumble */
function rain(s: SoundKit, signal?: AbortSignal): Bed | null {
  return s.bed((ac, out) => {
    const t = ac.currentTime;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 1);
    g.connect(out);
    const gust = ac.createGain();
    gust.gain.value = 0.72;
    gust.connect(g);
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.09;
    const depth = ac.createGain();
    depth.gain.value = 0.15;
    lfo.connect(depth);
    depth.connect(gust.gain);
    const at = Math.random() * 1.5;
    const srcs = [-0.55, 0.55].map((p, i) => {
      const src = hiss(ac, t, undefined, at + i * 1.5);
      const hp = ac.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 600;
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 5600;
      const pan = ac.createStereoPanner();
      pan.pan.value = p;
      src.connect(hp);
      hp.connect(lp);
      lp.connect(pan);
      pan.connect(gust);
      return src;
    });
    const rumble = hiss(ac, t, undefined, at + 0.75);
    const low = ac.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 150;
    low.Q.value = 0.5;
    const rg = ac.createGain();
    rg.gain.value = 3;
    rumble.connect(low);
    low.connect(rg);
    rg.connect(g);
    lfo.start(t);
    return {
      stop(fade = 0.7) {
        const now = ac.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + fade);
        for (const n of [...srcs, rumble, lfo]) n.stop(now + fade + 0.05);
      },
    };
  }, signal);
}

/**
 * Las Vegas: a lounge piano on a broken jukebox, I–vi–ii–V in F, on warped tape through a
 * small speaker, dropping out like a failing hologram.
 */
const LOUNGE = [
  [41, 57, 60, 64, 69],
  [38, 57, 60, 65, 69],
  [43, 58, 62, 65, 69],
  [36, 58, 62, 64, 69],
];
const BAR = 2.8;
function lounge(s: SoundKit, signal?: AbortSignal): Bed | null {
  return s.bed((ac, out) => {
    const t0 = ac.currentTime + 0.4;
    // the old speaker: no lows, a nasal middle, no highs
    const bus = ac.createGain();
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 380;
    const mid = ac.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1500;
    mid.Q.value = 0.9;
    mid.gain.value = 7;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3000;
    lp.Q.value = 0.8;
    const glitch = ac.createGain();
    const level = ac.createGain();
    level.gain.setValueAtTime(0.0001, ac.currentTime);
    level.gain.exponentialRampToValueAtTime(1, t0 + 1.5);
    const dry = ac.createGain();
    dry.gain.value = 0.5;
    bus.connect(hp);
    hp.connect(mid);
    mid.connect(lp);
    lp.connect(glitch);
    glitch.connect(level);
    level.connect(dry);
    dry.connect(out);
    send(s, ac, level, 0.9, HALL, 300);

    // wow and flutter, shared by every note
    const warp = ac.createGain();
    const lfos = (
      [
        [0.5, 16],
        [6.8, 4],
      ] as const
    ).map(([rate, cents]) => {
      const lfo = ac.createOscillator();
      lfo.frequency.value = rate;
      const g = ac.createGain();
      g.gain.value = cents;
      lfo.connect(g);
      g.connect(warp);
      lfo.start(t0);
      return lfo;
    });
    const dust = ac.createBufferSource();
    dust.buffer = crackle(ac);
    dust.loop = true;
    const dg = ac.createGain();
    dg.gain.value = 0.12;
    dust.connect(dg);
    dg.connect(bus);
    dust.start(t0);

    const live = new Set<OscillatorNode>();
    const note = (type: OscillatorType, f: number, t: number, v: number, len: number) => {
      const osc = ac.createOscillator();
      osc.type = type;
      osc.frequency.value = f;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      warp.connect(osc.detune);
      osc.connect(g);
      g.connect(bus);
      osc.start(t);
      osc.stop(t + len + 0.02);
      live.add(osc);
      osc.onended = () => {
        live.delete(osc);
        warp.disconnect(osc.detune);
        g.disconnect();
      };
    };
    const chord = (notes: number[], t: number) => {
      notes.forEach((m, i) => {
        const at = t + (i ? 0.05 + i * 0.022 : 0) + Math.random() * 0.01;
        const v = (i ? 0.016 : 0.02) * (0.85 + Math.random() * 0.3);
        note('triangle', hz(m), at, v, i ? 2.4 : 2);
        note('sine', hz(m) * 2, at, v * 0.45, 0.7);
      });
      if (Math.random() < 0.35) {
        const d = t + 0.6 + Math.random() * 1.6;
        const len = 0.05 + Math.random() * 0.12;
        glitch.gain.setValueAtTime(1, d);
        glitch.gain.linearRampToValueAtTime(0.04, d + 0.008);
        glitch.gain.setValueAtTime(0.04, d + len);
        glitch.gain.linearRampToValueAtTime(1, d + len + 0.012);
      }
    };
    let next = t0;
    let k = 0;
    const queue = (until: number) => {
      for (; next < until; next += BAR) chord(LOUNGE[k++ % LOUNGE.length], next);
    };
    // one turn of the loop up front, then keep a few seconds ahead
    queue(t0 + BAR * LOUNGE.length);
    const timer = window.setInterval(() => queue(ac.currentTime + 4), 1000);
    return {
      stop(fade = 0.6) {
        window.clearInterval(timer);
        const now = ac.currentTime;
        level.gain.cancelScheduledValues(now);
        level.gain.setValueAtTime(Math.max(0.0001, level.gain.value), now);
        level.gain.exponentialRampToValueAtTime(0.0001, now + fade);
        const end = now + fade + 0.05;
        for (const n of [...live, ...lfos, dust]) {
          try {
            n.stop(end);
          } catch {
            /* already over */
          }
        }
      },
    };
  }, signal);
}

/* ---------- the score ---------- */

export {
  click,
  close,
  drawer,
  fly,
  growl,
  holo,
  knock,
  lounge,
  melt,
  open,
  rain,
  resolve,
  section,
  surface,
  tick,
  title,
};

const score: ReelScore = {
  after: 'after Hans Zimmer & Benjamin Wallfisch, by way of Vangelis',
  idea:
    'braams, sub and a dirty riser in long concrete rooms; through them the CS-80, detuned ' +
    'brass with portamento and late vibrato, and ring-mod bells for the holograms',
  cues: [
    { id: 'hover', label: 'dry HUD tick', play: tick },
    { id: 'click', label: 'HUD click on a low thump', play: click },
    { id: 'section', label: 'CS-80 brass swell per act', play: (s, n) => section(s, n) },
    {
      id: 'surface',
      label: 'ring-mod hologram bell + brass stab',
      play: (s, n) => surface(s, n),
    },
    { id: 'done', label: 'CS-80 chord, minor lifting to major', play: (s) => resolve(s) },
    { id: 'error', label: 'distorted low growl', play: growl },
    { id: 'title', label: 'braam + sub hit', play: title },
    { id: 'rain', label: 'rain on the windscreen (Los Angeles)', play: (s) => rain(s) },
    { id: 'lounge', label: 'broken-jukebox lounge piano (Las Vegas)', play: (s) => lounge(s) },
    { id: 'holo', label: 'hologram flicker', play: holo },
    { id: 'knock', label: 'knock on carved wood', play: knock },
    { id: 'drawer', label: 'archive drawer', play: drawer },
    { id: 'melt', label: 'snow melting, a glassy glint', play: melt },
    { id: 'scan', label: 'scanner sweep', play: scan },
    { id: 'fly', label: 'spinner fly-by', play: fly },
    { id: 'riser', label: 'dirty siren riser', play: (s) => riser(s) },
    { id: 'open', label: 'riser into Wallace brass', play: open },
    { id: 'close', label: 'brass sighing down a fourth', play: close },
  ],
};

export default score;
