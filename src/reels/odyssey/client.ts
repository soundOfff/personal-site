/**
 * Reel 05 · 2001: A Space Odyssey: the reel's behaviour (scroll scenes, motifs, sound).
 * Loaded on demand when the reel starts screening; everything registered
 * against ctx.signal is torn down when it stops.
 *
 *   - the ship console: mission clock, Rosario time, distance to Jupiter
 *   - the red lens: tracks the cursor, and answers the playground's cues
 *   - the hero: Sun, Earth and Moon parallax, a replay of the alignment
 *   - the match cut (bone → station) and the star gate, scrubbed by scroll
 *   - the intermission countdown, the logic memory hum, the monolith
 *   - sound: console tick and clunk, two-tone section beeps, transmission
 *     beeps per surface, chirps when done, a C–G–C synth-brass fanfare
 */
import type { Bed, SoundKit } from '../sound';
import type { ReelContext, ReelModule } from '../types';

/** Section index → act index (I, II, II, III, III, III·M, III·M, IV, IV). */
const ACT_OF = [0, 1, 1, 2, 2, 3, 3, 4, 4];
const JUPITER_KM = 628_000_000;
const INTERMISSION_S = 15 * 60;

type AgentState = 'idle' | 'listen' | 'think' | 'speak' | 'done' | 'error';
const AGENT_LABEL: Record<AgentState, string> = {
  idle: 'Standing by',
  listen: 'Listening',
  think: 'Thinking',
  speak: 'Transmitting',
  done: 'Complete',
  error: 'AE-35 fault',
};

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const pad = (n: number) => String(n).padStart(2, '0');
const hms = (s: number) =>
  `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;

/* ============================================================
   the voice of the ship: every cue synthesized on the shared kit
   ============================================================ */
function voices(S: SoundKit) {
  const tick = () => S.tone({ f0: 1800, f1: 1200, dur: 0.009, vol: 0.05 });
  const clunk = () => {
    S.burst({ dur: 0.03, kind: 'lowpass', f: 900, vol: 0.3 });
    S.tone({ f0: 160, f1: 90, dur: 0.06, vol: 0.18 });
  };
  /** the two-tone console beep, pitched per act / per surface */
  const beep2 = (i: number, at = 0) => {
    const f = [880, 988, 1175, 1319, 1568][Math.abs(i) % 5];
    S.tone({ type: 'square', f0: f, dur: 0.05, vol: 0.03, at });
    S.tone({ type: 'square', f0: f * 1.5, dur: 0.05, vol: 0.025, at: at + 0.07 });
  };
  const blip = () => S.tone({ f0: 1400, f1: 1600, dur: 0.04, vol: 0.025 });
  const chirps = (at = 0) =>
    (
      [
        [1320, 0],
        [1760, 0.08],
        [2640, 0.16],
      ] as const
    ).forEach(([f, a]) => S.tone({ f0: f, dur: 0.09, vol: 0.06, at: at + a }));
  const dataTick = () =>
    S.tone({ type: 'square', f0: 3000 + Math.random() * 2400, dur: 0.006, vol: 0.018 });
  const fault = () => {
    S.tone({ type: 'square', f0: 220, f1: 180, dur: 0.18, vol: 0.04 });
    S.tone({ type: 'square', f0: 165, f1: 120, dur: 0.24, vol: 0.04, at: 0.2 });
  };

  /** a synth-brass voice: detuned saws and a sub square through an opening lowpass */
  const brass = (f: number, at: number, dur: number, vol: number) => {
    const ac = S.ctx();
    if (!ac) return;
    const t = ac.currentTime + at;
    const out = ac.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(vol, t + 0.22);
    out.gain.setValueAtTime(vol, t + dur * 0.75);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 1.2;
    lp.frequency.setValueAtTime(380, t);
    lp.frequency.exponentialRampToValueAtTime(2600, t + 0.28);
    lp.frequency.exponentialRampToValueAtTime(1300, t + dur);
    [0.996, 1.004, 0.5].forEach((m, i) => {
      const o = ac.createOscillator();
      o.type = i === 2 ? 'square' : 'sawtooth';
      o.frequency.value = f * m;
      const g = ac.createGain();
      g.gain.value = i === 2 ? 0.25 : 0.5;
      o.connect(g);
      g.connect(lp);
      o.start(t);
      o.stop(t + dur + 0.6);
    });
    lp.connect(out);
    out.connect(S.out());
    const send = ac.createGain();
    send.gain.value = 0.35;
    out.connect(send);
    send.connect(S.reverb(2.2));
  };
  const timp = (at: number) => {
    S.tone({ f0: 98, f1: 58, dur: 0.6, vol: 0.2, at });
    S.burst({ dur: 0.08, kind: 'lowpass', f: 300, vol: 0.22, at });
  };
  /** C – G – C (with the E above): the sunrise, in three chords and two drums */
  const fanfare = (k = 1) => {
    brass(130.81, 0, 1.0 * k, 0.07);
    brass(196.0, 1.05 * k, 1.0 * k, 0.07);
    brass(261.63, 2.1 * k, 1.7 * k, 0.085);
    brass(329.63, 2.1 * k, 1.7 * k, 0.035);
    timp(3.0 * k);
    timp(3.25 * k);
  };
  /** the waltz the station turns to: D, D, F#, A … A */
  const waltz = () =>
    (
      [
        [293.66, 0],
        [293.66, 0.32],
        [369.99, 0.64],
        [440, 0.96],
        [440, 1.6],
      ] as const
    ).forEach(([f, at]) => {
      S.tone({ type: 'triangle', f0: f * 2, dur: 0.7, vol: 0.055, at });
      S.tone({ f0: f * 4, dur: 0.25, vol: 0.014, at });
    });
  const whooshBack = () => {
    const ac = S.ctx();
    if (!ac) return;
    const t = ac.currentTime;
    const n = S.noise(0.3);
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
    n.start(t);
  };
  /** the suit's breathing in the pod bay */
  let lastBreath = 0;
  const breath = () => {
    if (Date.now() - lastBreath < 2400) return;
    const ac = S.ctx();
    if (!ac) return;
    lastBreath = Date.now();
    const t = ac.currentTime;
    const n = S.noise(2.4);
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
    n.start(t);
  };
  const thunk = () => {
    S.burst({ dur: 0.05, kind: 'lowpass', f: 380, vol: 0.32 });
    S.tone({ f0: 190, f1: 120, dur: 0.09, vol: 0.14 });
    S.tone({ type: 'triangle', f0: 1480, dur: 0.12, vol: 0.02, at: 0.01 });
  };
  const pad3 = () => {
    const ac = S.ctx();
    if (!ac) return;
    const t = ac.currentTime;
    [261.63, 329.63, 392, 523.25].forEach((f, i) => {
      const o = ac.createOscillator();
      o.frequency.value = f;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.03, t + 0.6 + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      o.connect(g);
      g.connect(S.out());
      o.start(t);
      o.stop(t + 2.7);
    });
  };
  const ring = (row: number, i: number) => {
    const f = [523.25, 587.33, 659.25, 783.99, 880][i % 5] * [0.75, 1, 1.335][row % 3];
    S.tone({ type: 'triangle', f0: f, dur: 0.8, vol: 0.05 });
    S.tone({ f0: f * 2, dur: 0.35, vol: 0.014 });
  };
  const sweep = () => S.tone({ f0: 2200, f1: 3300, dur: 0.12, vol: 0.03 });

  return {
    tick,
    clunk,
    beep2,
    blip,
    chirps,
    dataTick,
    fault,
    fanfare,
    waltz,
    whooshBack,
    breath,
    thunk,
    pad3,
    ring,
    sweep,
  };
}

/* ---------- beds: hums and drones that last while something is on screen ---------- */

interface Hum extends Bed {
  detune(cents: number): void;
}

/** a low electrical hum (saw + octave sine through a lowpass) */
function hum(S: SoundKit, f: number, vol: number, signal: AbortSignal): Hum | null {
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
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.8);
    o.connect(lp);
    o2.connect(lp);
    lp.connect(g);
    g.connect(out);
    o.start(t);
    o2.start(t);
    oscs = [o, o2];
    return {
      stop(fade = 0.6) {
        const t2 = ctx.currentTime;
        g.gain.cancelScheduledValues(t2);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t2);
        g.gain.exponentialRampToValueAtTime(0.0001, t2 + fade);
        oscs.forEach((x) => x.stop(t2 + fade + 0.05));
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

/** the star gate: rushing band-passed noise over a low saw chord */
function gateBed(S: SoundKit, signal: AbortSignal): (Bed & { p(v: number): void }) | null {
  let bp: BiquadFilterNode | null = null;
  let ac: AudioContext | null = null;
  const bed = S.bed((ctx, out) => {
    ac = ctx;
    const t = ctx.currentTime;
    const src = S.noise(3);
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 2.4;
    f.frequency.value = 400;
    bp = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 1);
    src.connect(f);
    f.connect(g);
    g.connect(out);
    src.start(t);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.03, t + 1.2);
    lp.connect(og);
    og.connect(out);
    const os = [110, 164.81 * 1.004, 220 * 0.997].map((hz) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz;
      o.connect(lp);
      o.start(t);
      return o;
    });
    return {
      stop(fade = 0.8) {
        const t2 = ctx.currentTime;
        [g, og].forEach((x) => {
          x.gain.cancelScheduledValues(t2);
          x.gain.setValueAtTime(Math.max(0.0001, x.gain.value), t2);
          x.gain.exponentialRampToValueAtTime(0.0001, t2 + fade);
        });
        src.stop(t2 + fade + 0.1);
        os.forEach((o) => o.stop(t2 + fade + 0.1));
      },
    };
  }, signal);
  if (!bed) return null;
  return {
    stop: (fade) => bed.stop(fade),
    p(v) {
      if (bp && ac) bp.frequency.setTargetAtTime(300 + v * 3200, ac.currentTime, 0.1);
    },
  };
}

/** the monolith: a slow cluster of near-unison voices, in the manner of the Requiem */
function clusterBed(S: SoundKit, signal: AbortSignal): Bed | null {
  return S.bed((ac, out) => {
    const t = ac.currentTime;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 1.2);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1800;
    lp.connect(g);
    g.connect(out);
    const send = ac.createGain();
    send.gain.value = 0.5;
    g.connect(send);
    send.connect(S.reverb(2.2));
    const nodes = [0, 1, 3, 5, 6, 8, 11, 13].flatMap((k, i) => {
      const o = ac.createOscillator();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = 196 * Math.pow(2, k / 24);
      const lfo = ac.createOscillator();
      lfo.frequency.value = 0.15 + i * 0.07;
      const lg = ac.createGain();
      lg.gain.value = 3;
      lfo.connect(lg);
      lg.connect(o.detune);
      const og = ac.createGain();
      og.gain.value = 0.12;
      o.connect(og);
      og.connect(lp);
      o.start(t);
      lfo.start(t);
      return [o, lfo];
    });
    return {
      stop(fade = 1.4) {
        const t2 = ac.currentTime;
        g.gain.cancelScheduledValues(t2);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t2);
        g.gain.exponentialRampToValueAtTime(0.0001, t2 + fade);
        nodes.forEach((n) => n.stop(t2 + fade + 0.1));
      },
    };
  }, signal);
}

/* ============================================================
   mount
   ============================================================ */
function mount(ctx: ReelContext): () => void {
  const { root, signal, reducedMotion } = ctx;
  const S = ctx.sound;
  const v = voices(S);
  const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);
  const listen = (
    target: EventTarget,
    type: string,
    fn: (e: Event) => void,
    opts: AddEventListenerOptions = {},
  ) => target.addEventListener(type, fn, { ...opts, signal });
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  /* ---------- the mission clock ---------- */
  const metEl = $('[data-od-met]');
  const clockEl = $('[data-od-clock]');
  const intEl = $('[data-od-int]');
  const t0 = Date.now();
  let rosario: Intl.DateTimeFormat | null = null;
  try {
    rosario = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Argentina/Cordoba',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    rosario = null;
  }
  let intOn = false;
  let intLeft = INTERMISSION_S;
  const second = () => {
    if (metEl) metEl.textContent = hms(Math.floor((Date.now() - t0) / 1000));
    if (clockEl && rosario) clockEl.textContent = rosario.format(new Date());
    if (intOn && intLeft > 0 && intEl) {
      intLeft -= 1;
      intEl.textContent = hms(intLeft);
    }
  };
  second();
  const clockId = window.setInterval(second, 1000);

  /* ---------- the agent: lens state and the playground's cues ---------- */
  const stateEl = $('[data-od-state]');
  let panelOpen = false;
  let lensHum: Hum | null = null;
  let settle = 0;
  const setAgent = (s: AgentState) => {
    root.dataset.odAgent = s;
    if (stateEl) stateEl.textContent = AGENT_LABEL[s];
  };
  const resting = (): AgentState => (panelOpen ? 'listen' : 'idle');
  const settleLater = (ms: number) => {
    window.clearTimeout(settle);
    settle = window.setTimeout(() => setAgent(resting()), ms);
  };
  const humOff = () => {
    lensHum?.stop(0.4);
    lensHum = null;
  };
  setAgent('idle');
  ctx.onCue((cue) => {
    switch (cue.name) {
      case 'open':
        panelOpen = true;
        v.clunk();
        v.beep2(1, 0.06);
        if (root.dataset.odAgent === 'idle') setAgent('listen');
        break;
      case 'close':
        if (!panelOpen) break;
        panelOpen = false;
        S.drop();
        humOff();
        if (root.dataset.odAgent !== 'think') setAgent('idle');
        break;
      case 'ask':
        window.clearTimeout(settle);
        v.clunk();
        humOff();
        lensHum = hum(S, 110, 0.02, signal);
        setAgent('think');
        break;
      case 'surface': {
        humOff();
        setAgent('speak');
        // transmission beeps, one per message, then the chirps
        const n = Math.min(6, Math.max(1, cue.count ?? 1));
        for (let i = 0; i < n; i++) v.beep2(i * 2 + 2, i * 0.15);
        v.chirps(n * 0.15 + 0.12);
        later(() => setAgent('done'), n * 150 + 500);
        settleLater(n * 150 + 3200);
        break;
      }
      case 'error':
        humOff();
        v.fault();
        setAgent('error');
        settleLater(2600);
        break;
    }
  });

  // Esc closes the native dialog before React's effect runs, so no 'close' cue
  // arrives then: listen for the dialog's own close event as well.
  listen(
    document,
    'close',
    (e) => {
      if (!(e.target as Element | null)?.matches?.('.a2-drawer') || !panelOpen) return;
      panelOpen = false;
      S.drop();
      humOff();
      if (root.dataset.odAgent !== 'think') setAgent('idle');
    },
    { capture: true },
  );

  /* ---------- sections: a two-tone beep at each act, a blip between sections ---------- */
  ctx.onSection((i, prev) => {
    const a = ACT_OF[Math.min(8, i)];
    const b = ACT_OF[Math.min(8, prev)];
    if (Math.min(8, i) === Math.min(8, prev)) return;
    if (a !== b) v.beep2(a + 1);
    else v.blip();
  });

  /* ---------- the hero: replay the alignment ---------- */
  const align = $('.od-align');
  listen(document, 'click', (e) => {
    const t = e.target as Element | null;
    if (t?.closest?.('[data-od-replay]')) {
      if (align) {
        align.classList.toggle('ra');
        align.classList.toggle('rb');
      }
      v.fanfare(1);
      return;
    }
    if (t?.closest?.('.railnav a, .startrow a, .contact a, .keybar a, .boxoffice-open, .idx a'))
      v.clunk();
  });

  /* ---------- hover: console ticks and the per-object voices ---------- */
  const metricsScrambling = new WeakSet<Element>();
  const scramble = (m: Element) => {
    const val = m.querySelector<HTMLElement>('.v');
    if (!val || metricsScrambling.has(val)) return;
    if (reducedMotion) {
      v.dataTick();
      return;
    }
    metricsScrambling.add(val);
    const real = val.textContent ?? '';
    const chars = '0123456789ABCDEF·';
    let n = 0;
    const step = () => {
      n += 1;
      if (n > 8 || signal.aborted) {
        delete val.dataset.odScr;
        metricsScrambling.delete(val);
        return;
      }
      val.dataset.odScr = [...real]
        .map((c) => (c === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)]))
        .join('');
      v.dataTick();
      later(step, 45);
    };
    step();
  };
  let monolith: Bed | null = null;
  const monolithOn = () => {
    if (!monolith) monolith = clusterBed(S, signal);
  };
  const monolithOff = () => {
    monolith?.stop(1.4);
    monolith = null;
  };
  const indexIn = (el: Element) =>
    el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
  const HOVER: [string, (el: Element) => void][] = [
    ['.metrics .m', scramble],
    ['.lede em', v.sweep],
    ['.idx tbody tr', (el) => v.beep2(indexIn(el))],
    ['.repo', v.breath],
    ['.wrow, .tenet', () => pullModule()],
    [
      '.toolcol li',
      (el) => v.ring(el.closest('.toolcol') ? indexIn(el.closest('.toolcol')!) : 0, indexIn(el)),
    ],
    ['.od-monolith', monolithOn],
    [
      '.railnav a, .contact a, .boxoffice-open, .snd, .startrow a, .a2-action, .logitem, .a2-launch-row .btn, .od-replay, .keybar a, .foot a, .a2-lamp, .a2-send',
      v.tick,
    ],
  ];
  let hovered: Element | null = null;
  listen(
    document,
    'pointerover',
    (e) => {
      const t = e.target as Element | null;
      let hit: Element | null = null;
      let act: ((el: Element) => void) | null = null;
      for (const [sel, fn] of HOVER) {
        const el = t?.closest?.(sel) ?? null;
        if (el) {
          hit = el;
          act = fn;
          break;
        }
      }
      if (hit === hovered) return;
      if (hovered?.matches('.od-monolith')) monolithOff();
      hovered = hit;
      if (hit && act) act(hit);
    },
    { passive: true },
  );
  listen(document, 'focusin', (e) => {
    if ((e.target as Element | null)?.matches?.('.od-monolith')) monolithOn();
  });
  listen(document, 'focusout', (e) => {
    if ((e.target as Element | null)?.matches?.('.od-monolith')) monolithOff();
  });
  listen(document.documentElement, 'pointerleave', () => {
    if (hovered?.matches('.od-monolith')) monolithOff();
    hovered = null;
  });

  /* ---------- zones: the logic memory hum, the gate, the intermission, the credits ---------- */
  const zones = new Set<string>();
  let redHum: Hum | null = null;
  let pulled = 0;
  let gate: ReturnType<typeof gateBed> = null;
  let gateP = 0;
  let intPlayed = false;
  let reprised = false;
  const pullModule = () => {
    v.thunk();
    pulled += 1;
    redHum?.detune(-Math.min(700, pulled * 60));
  };
  const syncBeds = () => {
    if (zones.has('red')) {
      if (!redHum) {
        redHum = hum(S, 55, 0.035, signal);
        redHum?.detune(-Math.min(700, pulled * 60));
      }
    } else if (redHum) {
      redHum.stop(0.6);
      redHum = null;
      pulled = 0;
    }
    if (zones.has('gate')) {
      if (!gate) {
        gate = gateBed(S, signal);
        gate?.p(gateP);
      }
    } else if (gate) {
      gate.stop(0.8);
      gate = null;
    }
  };
  const zoneOf = (el: Element): string | null => {
    const sec = el.getAttribute('data-sec');
    if (sec === '5' || sec === '6') return `red${sec}`;
    if (el.matches('.od-sg')) return 'gate';
    return el.getAttribute('data-od-zone');
  };
  const zoneIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const z = zoneOf(e.target);
        if (!z) continue;
        if (e.isIntersecting) zones.add(z);
        else zones.delete(z);
        if (z === 'int') {
          intOn = e.isIntersecting;
          if (intOn && !intPlayed) {
            intPlayed = true;
            v.pad3();
          }
        }
        if (z === 'credits' && e.isIntersecting && !reprised) {
          reprised = true;
          v.fanfare(0.8);
        }
      }
      if (zones.has('red5') || zones.has('red6')) zones.add('red');
      else zones.delete('red');
      syncBeds();
    },
    { threshold: 0.2 },
  );
  document
    .querySelectorAll('[data-sec="5"], [data-sec="6"], .od-sg, [data-od-zone]')
    .forEach((el) => zoneIO.observe(el));
  // muting stops every bed; unmuting brings back the ones still on screen
  const offSound = S.onChange((muted) => {
    if (muted) {
      redHum = null;
      gate = null;
      monolith = null;
      lensHum = null;
    } else syncBeds();
  });

  /* ---------- scroll: distance to Jupiter, the match cut, the star gate ---------- */
  const distEl = $('[data-od-dist]');
  const distBox = $('.od-dist');
  const scenes = reducedMotion
    ? []
    : [...document.querySelectorAll<HTMLElement>('[data-od-scene]')];
  const live = new Set<HTMLElement>();
  let cut = false;
  let lastProg = -1;
  let raf = 0;
  const frame = () => {
    raf = 0;
    // reads first …
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    const rects = [...live].map((el) => [el, el.getBoundingClientRect()] as const);
    // … then writes
    const prog = clamp01(y / max);
    if (Math.abs(prog - lastProg) > 0.0004) {
      lastProg = prog;
      if (distEl)
        distEl.textContent = (Math.round(((1 - prog) * JUPITER_KM) / 1000) * 1000).toLocaleString(
          'en-US',
        );
      distBox?.style.setProperty('--od-g', prog.toFixed(4));
    }
    for (const [el, r] of rects) {
      const p = clamp01(-r.top / Math.max(1, r.height - vh));
      el.style.setProperty('--p', p.toFixed(4));
      if (el.dataset.odScene === 'mc') {
        const now = p >= 0.5;
        if (now !== cut) {
          cut = now;
          el.classList.toggle('is-cut', now);
          if (now) {
            v.clunk();
            v.waltz();
          } else v.whooshBack();
        }
      } else {
        gateP = p;
        gate?.p(p);
      }
    }
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const sceneIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const el = e.target as HTMLElement;
      if (e.isIntersecting) live.add(el);
      else live.delete(el);
      el.classList.toggle('is-on', e.isIntersecting);
    }
    schedule();
  });
  scenes.forEach((el) => sceneIO.observe(el));
  listen(window, 'scroll', schedule, { passive: true });
  listen(window, 'resize', schedule, { passive: true });
  schedule();

  /* ---------- the pointer: the lens follows it, the sky leans with it ---------- */
  let praf = 0;
  let mx = 0;
  let my = 0;
  const sky = $('.od-sky');
  const hero = $('[data-sec="0"]');
  let heroOn = true;
  const lenses = [...document.querySelectorAll<HTMLElement>('.rail .tile, .od-lens')];
  const moved = () => {
    praf = 0;
    const composer = $('.a2-drawer[open] .a2-composer');
    const targets = composer ? [...lenses, composer] : lenses;
    // reads
    const rects = targets.map((el) => el.getBoundingClientRect());
    const w = window.innerWidth;
    const h = window.innerHeight;
    // writes
    if (heroOn && sky) {
      sky.style.setProperty('--mx', ((mx / w - 0.5) * 2).toFixed(3));
      sky.style.setProperty('--my', ((my / h - 0.5) * 2).toFixed(3));
    }
    targets.forEach((el, i) => {
      const r = rects[i];
      if (!r.width) return;
      const cx = el === composer ? r.left + 20 : r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = mx - cx;
      const dy = my - cy;
      const d = Math.max(1, Math.hypot(dx, dy));
      const k = Math.min(1, d / 420);
      el.style.setProperty('--lx', ((dx / d) * k).toFixed(3));
      el.style.setProperty('--ly', ((dy / d) * k).toFixed(3));
    });
  };
  let heroIO: IntersectionObserver | null = null;
  if (!reducedMotion) {
    listen(
      window,
      'pointermove',
      (e) => {
        const p = e as PointerEvent;
        mx = p.clientX;
        my = p.clientY;
        if (!praf) praf = requestAnimationFrame(moved);
      },
      { passive: true },
    );
    if (hero) {
      heroIO = new IntersectionObserver((es) => (heroOn = es.some((e) => e.isIntersecting)));
      heroIO.observe(hero);
    }
  }

  return () => {
    window.clearInterval(clockId);
    window.clearTimeout(settle);
    timers.forEach((id) => window.clearTimeout(id));
    if (raf) cancelAnimationFrame(raf);
    if (praf) cancelAnimationFrame(praf);
    zoneIO.disconnect();
    sceneIO.disconnect();
    heroIO?.disconnect();
    offSound();
    [redHum, gate, monolith, lensHum].forEach((b) => b?.stop(0.3));
    delete root.dataset.odAgent;
    scenes.forEach((el) => {
      el.classList.remove('is-on', 'is-cut');
      el.style.removeProperty('--p');
    });
    lenses.forEach((el) => {
      el.style.removeProperty('--lx');
      el.style.removeProperty('--ly');
    });
    sky?.style.removeProperty('--mx');
    sky?.style.removeProperty('--my');
  };
}

const reel: ReelModule = {
  mount,
  titleSound(ctx) {
    voices(ctx.sound).fanfare(0.7);
  },
};

export default reel;
