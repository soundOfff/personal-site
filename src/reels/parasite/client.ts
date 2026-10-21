/**
 * Reel 01 · Parasite: the reel's behaviour (scroll scenes, motifs, sound).
 * Loaded on demand when the reel starts screening; everything registered
 * against ctx.signal is torn down when it stops.
 *
 * The page is a house and scrolling goes down it. What this module adds on
 * top of reel.css (every sound is in score.ts: harpsichord and string trio in
 * C minor, after Jung Jae-il):
 *   - the walker: a square on the rail's staircase that follows the section in
 *     view one step at a time, a footstep per step, echo deepening per floor,
 *     and a step of the lament bass (C · B♭ · A♭ · G) once it reaches a new floor,
 *   - the lights below ground, on the first time the walker gets down to them:
 *     the rail's stair treads, the semi-basement's tube, the bunker's bulb,
 *   - the censor bar on the headline, timed to clear after the title card,
 *   - rain you hear only while the interlude is on screen,
 *   - the fumigation smoke through the semi-basement window, once,
 *   - a harpsichord quill on hover and a key on click,
 *   - the playground scored: signal bars, a tirata as it opens and closes, a
 *     climbing figure per surface (a note per component), a trilled cadence when
 *     it's done, a deceptive cadence on error,
 *   - the bunker's Morse key: tap for a dot, hold for a dash, decoded live.
 */
import { mountServicePassage } from './service-passage';
import type { Cue, ReelContext, ReelModule } from '../types';
import { SECTION_IDS } from '../types';
import type { Bed } from '../sound';
import {
  bar,
  beep,
  cadence,
  cadenceAfter,
  CADENCE_LANDS,
  deceptive,
  figure,
  floorOf,
  footstep,
  glass as glassy,
  keyTone,
  lament,
  lamp,
  note,
  overture,
  quill,
  rain as rainBed,
  tirataDown,
  tirataUp,
} from './score';

const STEP_MS = 115;
/** Let the walker settle before the lament takes its step, so a fast scroll is one phrase. */
const ACT_MS = 160;
/** The section each light below ground hangs in, as reel.css names it in html[data-px-lit]. */
const LIGHTS: [sec: number, name: string][] = [
  [3, 'stairs'],
  [6, 'tube'],
  [8, 'bulb'],
];
/** Geun-sae's word, for the key to send by itself. */
const RESPECT: [string, string][] = [
  ['R', '.-.'],
  ['E', '.'],
  ['S', '...'],
  ['P', '.--.'],
  ['E', '.'],
  ['C', '-.-.'],
  ['T', '-'],
];
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

/* ---------- the reel ---------- */

/**
 * The section index, kept on the staircase: at the very bottom the engine
 * can report one past the last section (it also counts <html data-sec>).
 */
const LAST = SECTION_IDS.length - 1;
const clampSec = (i: number) => Math.max(0, Math.min(LAST, i));

const reel: ReelModule = {
  mount(ctx) {
    const { root, signal } = ctx;
    const stopOpening = mountServicePassage(ctx);
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
      if (withSound && r && r.bottom > 0 && r.top < innerHeight) bar(s);
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

    // reel.css paints the rail's numbers from 1 like the S# slugs; give the
    // markup's 00-08 the same numbers so screen readers hear what is shown.
    const numbers = [...(nav?.querySelectorAll<HTMLElement>('.nx') ?? [])];
    const houseNumbers = numbers.map((el) => el.textContent);
    numbers.forEach((el, i) => (el.textContent = String(i + 1)));

    /* ---- the lights: each comes on as the walker first gets down to it, and stays on ---- */
    let deep = -1;
    const reach = (i: number, withSound: boolean) => {
      if (i <= deep) return;
      const fresh = LIGHTS.filter(([sec]) => sec > deep && sec <= i);
      deep = i;
      nav?.style.setProperty('--px-deep', String(deep));
      root.dataset.pxLit = LIGHTS.filter(([sec]) => sec <= deep)
        .map(([, name]) => name)
        .join(' ');
      // A jump past several lights plays only the deepest one.
      const last = fresh.at(-1);
      if (withSound && last) lamp(s, floorOf(last[0]));
    };
    reach(mark, false);

    // The lament moves once the walker stops on a new floor: one note per arrival.
    let heard = floorOf(mark);
    let arriving = 0;
    const arrive = () => {
      cancel(arriving);
      arriving = later(() => {
        const floor = floorOf(mark);
        if (floor === heard) return;
        heard = floor;
        lament(s, floor);
      }, ACT_MS);
    };
    const step = () => {
      walking = 0;
      if (mark === target) return;
      const up = target < mark;
      mark += up ? -1 : 1;
      place(mark);
      footstep(s, floorOf(mark), up);
      reach(mark, true);
      arrive();
      if (mark !== target) walking = later(step, STEP_MS);
    };

    ctx.onSection((index) => {
      const i = clampSec(index);
      target = i;
      if (ctx.reducedMotion) {
        if (i !== mark) footstep(s, floorOf(i), i < mark);
        mark = i;
        place(mark);
        reach(mark, true);
        arrive();
      } else if (!walking) {
        step();
      }
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

    /* ---- the fumigation truck goes by the semi-basement window, the first time you see it ---- */
    const strip = document.querySelector<HTMLElement>('[data-px-strip]');
    if (strip && !ctx.reducedMotion) {
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io.disconnect();
          strip.classList.add('is-fumigated');
        },
        { threshold: 1 },
      );
      io.observe(strip);
      signal.addEventListener('abort', () => io.disconnect(), { once: true });
    }

    /* ---- a quill on hover, a key on press; the glass rings, the log's steps thud ---- */
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
      const overBar = !!t.closest('[data-sec="0"] > .lede em');
      if (overBar && !onBar && root.dataset.pxBar === 'clear') bar(s);
      onBar = overBar;
      const stair = t.closest('.logitem');
      if (stair && stair !== onStep) footstep(s, 1, false, 0.5);
      onStep = stair;
      const hit = t.closest(interactive);
      if (hit === hovered) return;
      hovered = hit;
      if (hit && !stair && !hit.closest(own)) quill(s);
    });
    on(document, 'pointerdown', (e) => {
      if (e.button !== 0 || !(e.target instanceof Element)) return;
      const hit = e.target.closest(interactive);
      if (hit && !hit.closest(own)) note(s);
    });

    /* ---- the playground: a phone hunting for wifi, the harpsichord climbing per surface ---- */
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
        const n = cue.count ?? 1;
        figure(s, n);
        const end = cadenceAfter(n);
        cadence(s, end);
        settle = later(() => signalBars('done'), (end + CADENCE_LANDS + 0.15) * 1000);
      } else if (cue.name === 'error') {
        signalBars('lost');
        deceptive(s);
      } else if (cue.name === 'open') {
        tirataUp(s);
      } else if (cue.name === 'close') {
        tirataDown(s);
      }
    });

    /* ---- the bunker: a hanging bulb responds to a nearby pointer ---- */
    const stopLamp = swayLamp(ctx);

    /* ---- the bunker: the light switch keys Morse ---- */
    const stopMorse = morse(ctx, later, cancel);

    return () => {
      stopOpening();
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      stopMorse();
      stopLamp();
      rainOff();
      offSound();
      rainEl?.classList.remove('is-raining');
      strip?.classList.remove('is-fumigated');
      numbers.forEach((el, i) => (el.textContent = houseNumbers[i]));
      nav?.style.removeProperty('--px-mark');
      nav?.style.removeProperty('--px-deep');
      delete root.dataset.pxLit;
      delete root.dataset.pxBar;
      delete root.dataset.pxSignal;
      delete root.dataset.pxKey;
    };
  },

  titleSound(ctx) {
    overture(ctx.sound);
  },
};

/** A gently damped pendulum; it rests when the pointer and the page leave. */
function swayLamp(ctx: ReelContext): () => void {
  const bulb = document.querySelector<HTMLElement>('.px-bulb');
  const room = document.getElementById('now');
  if (!bulb || !room || ctx.reducedMotion) return () => {};

  let angle = 0;
  let velocity = 0;
  let target = 0;
  let frame = 0;
  let previous = 0;
  const animate = (time: number) => {
    const dt = previous ? Math.min((time - previous) / 16.67, 2) : 1;
    previous = time;
    velocity += ((target - angle) * 0.012 - velocity * 0.24) * dt;
    angle += velocity * dt;
    bulb.style.setProperty('--px-sway', `${angle.toFixed(3)}deg`);
    if (Math.abs(target - angle) > 0.003 || Math.abs(velocity) > 0.003) {
      frame = requestAnimationFrame(animate);
    } else {
      frame = 0;
      previous = 0;
      if (!target) bulb.style.removeProperty('--px-sway');
    }
  };
  const aim = (value: number) => {
    target = value;
    if (!frame) frame = requestAnimationFrame(animate);
  };
  const rest = () => aim(0);
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      const bounds = room.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > innerHeight) return;
      const dx = bounds.left + bulb.offsetLeft + bulb.offsetWidth / 2 - e.clientX;
      const dy = bounds.top + bulb.offsetTop + 120 - e.clientY;
      const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / 260);
      aim(Math.max(-1, Math.min(1, dx / 95)) * proximity * -14);
    },
    { passive: true, signal: ctx.signal },
  );
  document.addEventListener('pointerleave', rest, { signal: ctx.signal });
  window.addEventListener('blur', rest, { signal: ctx.signal });
  window.addEventListener('scroll', rest, { passive: true, signal: ctx.signal });

  return () => {
    cancelAnimationFrame(frame);
    bulb.style.removeProperty('--px-sway');
  };
}

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
  const sendBtn = panel?.querySelector<HTMLButtonElement>('[data-px-send]');
  if (!panel || !key || !symEl || !txtEl || !doneEl || !sendBtn) return () => {};

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
    symEl.textContent = sym;
    txtEl.textContent = txt;
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

  // "send RESPECT": the key sends it by itself, at 95 ms a unit.
  sendBtn.addEventListener(
    'click',
    () => {
      reset();
      const u = 95;
      let t = 150;
      for (const [ch, code] of RESPECT) {
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
