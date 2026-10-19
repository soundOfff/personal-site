/**
 * Reel 01 · Parasite: the reel's behaviour (scroll scenes, motifs, sound).
 * Loaded on demand when the reel starts screening; everything registered
 * against ctx.signal is torn down when it stops.
 *
 * The page is a house and scrolling goes down it. What this module adds on
 * top of reel.css:
 *   - the walker: a square on the rail's staircase that follows the section in
 *     view one step at a time, a footstep per step, echo deepening per floor,
 *   - lamps that click on as you first arrive in each room below ground,
 *   - the censor bar on the headline, timed to clear after the title card,
 *   - rain you hear only while the interlude is on screen,
 *   - the playground scored: signal bars, a slate and a pluck per surface, a
 *     cadence when it's done,
 *   - the bunker's Morse key: tap for a dot, hold for a dash, decoded live.
 */
import type { Cue, ReelContext, ReelModule } from '../types';
import { SECTION_IDS } from '../types';
import type { Bed, SoundKit } from '../sound';

/** Reverb per floor: [seconds, send]. The deeper the floor, the longer the echo. */
const VERB: readonly (readonly [number, number])[] = [
  [0.9, 0.05],
  [1.4, 0.18],
  [2.0, 0.34],
  [2.8, 0.55],
];
const STEP_MS = 115;
/** The surfaces' pitches: D minor, rising. */
const D_MINOR = [293.66, 349.23, 392, 440, 523.25, 587.33];
const MORSE: Record<string, string> = {
  '.-': 'A',
  '-...': 'B',
  '-.-.': 'C',
  '-..': 'D',
  '.': 'E',
  '..-.': 'F',
  '--.': 'G',
  '....': 'H',
  '..': 'I',
  '.---': 'J',
  '-.-': 'K',
  '.-..': 'L',
  '--': 'M',
  '-.': 'N',
  '---': 'O',
  '.--.': 'P',
  '--.-': 'Q',
  '.-.': 'R',
  '...': 'S',
  '-': 'T',
  '..-': 'U',
  '...-': 'V',
  '.--': 'W',
  '-..-': 'X',
  '-.--': 'Y',
  '--..': 'Z',
};

/* ---------- the reel's own sounds, built on the shared kit ---------- */

/** One step on a floor: a dull thud through that floor's room. */
function footstep(s: SoundKit, floor: number, up: boolean, vol = 1): void {
  const ac = s.ctx();
  if (!ac) return;
  const [seconds, wet] = VERB[floor] ?? VERB[0];
  const dry = ac.createGain();
  dry.gain.value = vol;
  dry.connect(s.out());
  const send = ac.createGain();
  send.gain.value = wet;
  dry.connect(send);
  send.connect(s.reverb(seconds));
  s.burst({ dur: 0.07, kind: 'lowpass', f: 560 - floor * 70, q: 0.8, vol: 0.5, dest: dry });
  s.tone({ f0: (up ? 140 : 120) - floor * 14, f1: 55, dur: 0.08, vol: 0.22, dest: dry });
  window.setTimeout(() => dry.disconnect(), 400);
}

function relay(s: SoundKit, at = 0): void {
  s.burst({ dur: 0.006, kind: 'highpass', f: 2500, vol: 0.4, at });
}

/** The fluorescent tube's mains hum. */
function hum(s: SoundKit, at: number, dur: number): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const o = ac.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = 100;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  const g = ac.createGain();
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

/** A lamp clicking on: stair relays, a tube that tinks and hums, a bulb's ping. */
function lampOn(s: SoundKit, floor: number): void {
  relay(s);
  if (floor === 1) {
    relay(s, 0.035);
    s.tone({ f0: 2200, dur: 0.05, vol: 0.02, at: 0.04 });
  } else if (floor === 2) {
    s.tone({ f0: 3400, dur: 0.02, vol: 0.05, at: 0.07 });
    s.tone({ f0: 3100, dur: 0.02, vol: 0.05, at: 0.19 });
    hum(s, 0.22, 0.7);
  } else {
    s.tone({ type: 'triangle', f0: 2400, f1: 2300, dur: 0.2, vol: 0.04, at: 0.02 });
  }
}

/** Light sliding across the living-room glass. */
function glassy(s: SoundKit): void {
  s.tone({ type: 'triangle', f0: 2637, dur: 0.5, vol: 0.025 });
  s.tone({ type: 'triangle', f0: 3520, dur: 0.6, vol: 0.018, at: 0.06 });
}

/** The clapper: a surface landed. */
function slate(s: SoundKit, at = 0): void {
  s.burst({ dur: 0.03, f: 1800, q: 0.7, vol: 0.3, at });
  s.tone({ f0: 220, f1: 120, dur: 0.04, vol: 0.12, at });
}

/** The plucked cadence: the agent is done, and the film's sting. */
function cadence(s: SoundKit, at = 0): void {
  (
    [
      [293.66, 0],
      [349.23, 0.07],
      [440, 0.14],
      [587.33, 0.21],
      [523.25, 0.38],
      [587.33, 0.52],
    ] as const
  ).forEach(([f, t]) => s.pluck(f, at + t, 0.06));
}

/** A held 620 Hz key tone (the bunker's telegraph). */
function keyTone(s: SoundKit): (() => void) | null {
  const ac = s.ctx();
  if (!ac) return null;
  const o = ac.createOscillator();
  o.frequency.value = 620;
  const g = ac.createGain();
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

function beep(s: SoundKit, dur: number): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator();
  o.frequency.value = 620;
  const g = ac.createGain();
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
function rainBed(s: SoundKit, signal: AbortSignal): Bed | null {
  return s.bed((ac, out) => {
    const src = s.noise(2.5);
    src.loop = true;
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 500;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5200;
    const g = ac.createGain();
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

/* ---------- the reel ---------- */

/**
 * The section index, kept on the staircase: at the very bottom the engine
 * can report one past the last section (it also counts <html data-sec>).
 */
const LAST = SECTION_IDS.length - 1;
const clampSec = (i: number) => Math.max(0, Math.min(LAST, i));

function floorOf(ctx: ReelContext, sec: number): number {
  const id = SECTION_IDS[sec];
  const i = ctx.reel.acts.findIndex((a) => a.sections.includes(id));
  return i < 0 ? 0 : i;
}

const reel: ReelModule = {
  mount(ctx) {
    const { root, signal } = ctx;
    const s = ctx.sound;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number): number => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };
    const cancel = (id: number) => {
      window.clearTimeout(id);
      timers.delete(id);
    };
    const on = <K extends keyof DocumentEventMap>(
      target: EventTarget,
      type: K,
      fn: (e: DocumentEventMap[K]) => void,
    ) => target.addEventListener(type, fn as EventListener, { signal, passive: true });

    /* ---- the censor bar on “clear the bar” ---- */
    const lede = document.querySelector<HTMLElement>('[data-sec="0"] .lede em');
    root.dataset.pxBar = 'held';
    const clearBar = (withSound: boolean) => {
      root.dataset.pxBar = 'clear';
      const r = lede?.getBoundingClientRect();
      if (withSound && r && r.bottom > 0 && r.top < innerHeight) s.swipe();
    };
    const projector = document.querySelector<HTMLElement>('[data-projector]');
    if (ctx.reducedMotion) {
      clearBar(false);
    } else if (projector?.dataset.state) {
      // Mounted under the title card: clear once the projector has opened.
      const mo = new MutationObserver(() => {
        if (projector.dataset.state) return;
        mo.disconnect();
        later(() => clearBar(true), 650);
      });
      mo.observe(projector, { attributes: true, attributeFilter: ['data-state'] });
      signal.addEventListener('abort', () => mo.disconnect(), { once: true });
    } else {
      later(() => clearBar(true), 1200);
    }

    /* ---- the walker on the rail's staircase ---- */
    let mark = clampSec(ctx.section());
    let target = mark;
    let walking = 0;
    // On the nav, not <html>: Chrome restarts the rail's token cross-fade on
    // every style change of an ancestor, and the walker changes this 9 times.
    const nav = document.querySelector<HTMLElement>('.railnav');
    const place = (i: number) => nav?.style.setProperty('--px-mark', String(i));
    place(mark);
    const step = () => {
      walking = 0;
      if (mark === target) return;
      const up = target < mark;
      mark += up ? -1 : 1;
      place(mark);
      footstep(s, floorOf(ctx, mark), up);
      if (mark !== target) walking = later(step, STEP_MS);
    };

    /* ---- lamps: every room you've been down to stays lit ---- */
    const lamps = [...document.querySelectorAll<HTMLElement>('[data-px-lamp]')];
    let deepest = -1;
    const light = (sec: number, withSound: boolean) => {
      if (sec <= deepest) return;
      deepest = sec;
      lamps.forEach((el) => {
        if (Number(el.dataset.pxLamp) <= deepest) el.classList.add('is-on');
      });
      const floor = floorOf(ctx, sec);
      if (withSound && floor >= 1) lampOn(s, floor);
    };
    light(mark, false);

    ctx.onSection((index) => {
      const i = clampSec(index);
      target = i;
      if (ctx.reducedMotion) {
        if (i !== mark) footstep(s, floorOf(ctx, i), i < mark);
        mark = i;
        place(mark);
      } else if (!walking) {
        step();
      }
      light(i, true);
    });

    /* ---- rain, only while the interlude is on screen ---- */
    const rainEl = document.querySelector<HTMLElement>('[data-px-rain]');
    let rainVisible = false;
    let rain: Bed | null = null;
    const rainOn = () => {
      if (!rain && rainVisible) rain = rainBed(s, signal);
    };
    const rainOff = () => {
      rain?.stop(0.6);
      rain = null;
    };
    if (rainEl) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            rainVisible = e.isIntersecting;
            rainEl.classList.toggle('is-raining', rainVisible);
            if (rainVisible) rainOn();
            else rainOff();
          }
        },
        { threshold: 0.15 },
      );
      io.observe(rainEl);
      signal.addEventListener('abort', () => io.disconnect(), { once: true });
    }
    // The kit stops every bed on mute; pick the rain back up on unmute, and on
    // the first gesture (audio can't start before one).
    const offSound = s.onChange((muted) => {
      if (muted) rain = null;
      else later(rainOn, 80);
    });
    on(window, 'pointerdown', rainOn);
    on(window, 'keydown', rainOn);

    /* ---- tick on hover, click on press; the glass rings, the log's steps thud ---- */
    const interactive = 'a[href], button, summary, .idx tr[data-href]';
    const own = '[data-reel-pick], [data-sound-toggle], [data-boxoffice-open], [data-px-key]';
    let hovered: Element | null = null;
    let inGlass = false;
    let onBar = false;
    let onStep: Element | null = null;
    on(document, 'pointerover', (e) => {
      if (e.pointerType !== 'mouse' || !(e.target instanceof Element)) return;
      const t = e.target;
      const glass = !!t.closest('.px-window, [data-sec="0"] > .lede');
      if (glass && !inGlass) glassy(s);
      inGlass = glass;
      const bar = !!t.closest('[data-sec="0"] > .lede em');
      if (bar && !onBar && root.dataset.pxBar === 'clear') s.swipe();
      onBar = bar;
      const stair = t.closest('.logitem');
      if (stair && stair !== onStep) footstep(s, 1, false, 0.5);
      onStep = stair;
      const hit = t.closest(interactive);
      if (hit === hovered) return;
      hovered = hit;
      if (hit && !stair && !hit.closest(own)) s.tick();
    });
    on(document, 'pointerdown', (e) => {
      if (e.button !== 0 || !(e.target instanceof Element)) return;
      const hit = e.target.closest(interactive);
      if (hit && !hit.closest(own)) s.click();
    });

    /* ---- the playground: a phone hunting for wifi, a slate per surface ---- */
    const signalBars = (v?: 'search' | 'full' | 'done' | 'lost') => {
      if (v) root.dataset.pxSignal = v;
      else delete root.dataset.pxSignal;
    };
    let settle = 0;
    ctx.onCue((cue: Cue) => {
      cancel(settle);
      if (cue.name === 'ask') {
        signalBars('search');
      } else if (cue.name === 'surface') {
        signalBars('full');
        const n = Math.max(1, Math.min(cue.count ?? 1, D_MINOR.length));
        slate(s);
        for (let k = 0; k < n; k++) s.pluck(D_MINOR[k], 0.08 + k * 0.11, 0.06);
        const end = 0.08 + n * 0.11 + 0.22;
        cadence(s, end);
        settle = later(() => signalBars('done'), (end + 0.7) * 1000);
      } else if (cue.name === 'error') {
        signalBars('lost');
        s.pluck(293.66, 0, 0.05);
        s.pluck(220, 0.16, 0.05);
      } else if (cue.name === 'open') {
        s.whoosh();
      } else if (cue.name === 'close') {
        s.swipe();
      }
    });

    /* ---- the bunker: the light switch keys Morse ---- */
    const stopMorse = morse(ctx, later, cancel);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      stopMorse();
      rainOff();
      offSound();
      rainEl?.classList.remove('is-raining');
      lamps.forEach((el) => el.classList.remove('is-on'));
      nav?.style.removeProperty('--px-mark');
      delete root.dataset.pxBar;
      delete root.dataset.pxSignal;
      delete root.dataset.pxKey;
    };
  },

  titleSound(ctx) {
    // a low pedal under the plucked cadence
    ctx.sound.tone({ f0: 73.42, dur: 1.6, vol: 0.09 });
    cadence(ctx.sound, 0.05);
  },
};

/**
 * The Morse key: tap (< 200 ms) for a dot, hold for a dash. A letter commits
 * after a short gap; a longer gap ends the message and nudges toward email.
 * The bulb and the rail's staircase light while the key is down.
 */
function morse(
  ctx: ReelContext,
  later: (fn: () => void, ms: number) => number,
  cancel: (id: number) => void,
): () => void {
  const panel = document.querySelector<HTMLElement>('[data-px-morse]');
  const key = panel?.querySelector<HTMLButtonElement>('[data-px-key]');
  const symEl = panel?.querySelector<HTMLElement>('[data-px-msym]');
  const txtEl = panel?.querySelector<HTMLElement>('[data-px-mtxt]');
  const doneEl = panel?.querySelector<HTMLElement>('[data-px-mdone]');
  const hiBtn = panel?.querySelector<HTMLButtonElement>('[data-px-hi]');
  if (!panel || !key || !symEl || !txtEl || !doneEl || !hiBtn) return () => {};

  const { root, signal } = ctx;
  const s = ctx.sound;
  const opts = { signal };
  let cur = '';
  let codes: string[] = [];
  let txt = '';
  let downAt = 0;
  let release: (() => void) | null = null;
  let letterT = 0;
  let wordT = 0;
  let seq: number[] = [];

  const render = () => {
    const sym = [...codes, cur].filter(Boolean).join(' ').replace(/\./g, '·').replace(/-/g, '—');
    symEl.textContent = sym || '· · · ·';
    txtEl.textContent = txt || '—';
  };
  const lit = (onOff: boolean) => {
    key.classList.toggle('is-down', onOff);
    if (onOff) root.dataset.pxKey = 'down';
    else delete root.dataset.pxKey;
  };
  const reset = () => {
    seq.forEach(cancel);
    seq = [];
    cancel(letterT);
    cancel(wordT);
    cur = '';
    codes = [];
    txt = '';
    doneEl.hidden = true;
    render();
  };
  const commit = () => {
    if (!cur) return;
    txt = (txt + (MORSE[cur] ?? '?')).slice(-12);
    codes = [...codes, cur].slice(-8);
    cur = '';
    render();
    wordT = later(() => {
      if (txt) doneEl.hidden = false;
    }, 1300);
  };
  const down = () => {
    if (downAt) return;
    seq.forEach(cancel);
    seq = [];
    cancel(letterT);
    cancel(wordT);
    if (!doneEl.hidden) reset();
    downAt = performance.now();
    release = keyTone(s);
    lit(true);
  };
  const up = () => {
    if (!downAt) return;
    const held = performance.now() - downAt;
    downAt = 0;
    release?.();
    release = null;
    lit(false);
    cur = (cur + (held < 200 ? '.' : '-')).slice(0, 6);
    render();
    letterT = later(commit, 480);
  };

  key.addEventListener(
    'pointerdown',
    (e) => {
      if (e.button !== 0) return;
      key.setPointerCapture?.(e.pointerId);
      down();
    },
    opts,
  );
  key.addEventListener('pointerup', up, opts);
  key.addEventListener('pointercancel', up, opts);
  key.addEventListener('lostpointercapture', up, opts);
  key.addEventListener('blur', up, opts);
  key.addEventListener('contextmenu', (e) => e.preventDefault(), opts);
  key.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (!e.repeat) down();
    },
    opts,
  );
  key.addEventListener(
    'keyup',
    (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      up();
    },
    opts,
  );

  // “play HI”: the key sends it by itself, at 95 ms a unit.
  hiBtn.addEventListener(
    'click',
    () => {
      reset();
      const u = 95;
      let t = 150;
      for (const [ch, code] of [
        ['H', '....'],
        ['I', '..'],
      ] as const) {
        for (const sym of code) {
          const dur = sym === '.' ? u : u * 3;
          seq.push(
            later(() => {
              beep(s, dur / 1000);
              lit(true);
            }, t),
            later(() => {
              lit(false);
              cur += sym;
              render();
            }, t + dur),
          );
          t += dur + u;
        }
        seq.push(
          later(() => {
            codes = [...codes, code];
            txt += ch;
            cur = '';
            render();
          }, t + u),
        );
        t += u * 3;
      }
      seq.push(later(() => (doneEl.hidden = false), t + 500));
    },
    opts,
  );

  return () => {
    downAt = 0;
    release?.();
    release = null;
    lit(false);
    reset();
  };
}

export default reel;
