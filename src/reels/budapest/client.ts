/**
 * Reel 04 · The Grand Budapest Hotel: the reel's behaviour (scroll scenes, motifs, sound).
 * Loaded on demand when the reel starts screening; everything registered
 * against ctx.signal is torn down when it stops. The sounds themselves are the
 * score (./score): a balalaika, cimbalom, zither, organ and timpani band in
 * E harmonic minor, after Desplat, plus the hotel's own noises.
 *
 *   - the key rack: a brass key tink per key, a key-ring jingle and a whip pan
 *     (pastel smear, stereo whoosh) on every in-page jump
 *   - other hovers: the cimbalom's cotton beater, wandering the scale
 *   - each era change: a projector clunk, then the era's chord (i, iv, V) on
 *     a trembling balalaika over a timpani note
 *   - the diorama: windows that light on hover (CSS) and twinkle while in view
 *   - telegrams stamp in as they scroll into view, with a postmark thump
 *   - the playground: a switchboard relay (html[data-gb-relay]) and the desk
 *     bell; a pastry box, tissue paper and a zither run when it composes, a
 *     balalaika accelerando to a dead stop when it is done, and the organ
 *     losing its wind on an error
 *   - the registration card's clock, and the service bell
 *
 * Everything audible goes through ctx.sound, so it is silent while muted.
 */
import type { ReelContext, ReelModule } from '../types';
import {
  blip,
  clack,
  creak,
  deskBell,
  flourish,
  glow,
  hover,
  jingle,
  paper,
  pen,
  run,
  sag,
  section,
  squish,
  stamp,
  thud,
  tink,
  title,
  whoosh,
} from './score';

function voice(ctx: ReelContext) {
  const s = ctx.sound;
  const last = new Map<string, number>();
  /** at most one `key` cue every `gap` ms: hovering fast across a row stays musical */
  const gate = (key: string, gap: number) => {
    const now = performance.now();
    if (now - (last.get(key) ?? -1e9) < gap) return false;
    last.set(key, now);
    return true;
  };

  return {
    hover: () => gate('tick', 40) && hover(s),
    tink: () => gate('tink', 45) && tink(s),
    jingle: () => jingle(s),
    deskBell: (vol: number) => gate('bell', 220) && deskBell(s, vol),
    whoosh: () => whoosh(s),
    paper: (at = 0) => paper(s, at),
    creak: () => gate('creak', 260) && creak(s),
    pen: () => gate('pen', 60) && pen(s),
    clack: () => gate('clack', 50) && clack(s),
    squish: () => gate('squish', 160) && squish(s),
    stamp: () => gate('stamp', 90) && stamp(s),
    /** projector clunk and the era's chord; `i` is the section that moved it */
    era: (i: number) => gate('era', 500) && section(s, i),
    glow: () => gate('glow', 900) && glow(s),
    thud: () => thud(s),
    relayBlip: () => blip(s),
    run: (n?: number) => run(s, n),
    done: () => flourish(s),
    error: () => sag(s),
  };
}

const reel: ReelModule = {
  mount(ctx) {
    const { root, signal } = ctx;
    const v = voice(ctx);
    const timers = new Set<number>();
    const cueTimers = new Set<number>();
    const later = (fn: () => void, ms: number, set = timers) => {
      const id = window.setTimeout(() => {
        set.delete(id);
        fn();
      }, ms);
      set.add(id);
      return id;
    };
    const cueLater = (fn: () => void, ms: number) => later(fn, ms, cueTimers);
    const on = <K extends keyof DocumentEventMap>(
      type: K,
      fn: (e: DocumentEventMap[K]) => void,
      opts: AddEventListenerOptions = {},
    ) => document.addEventListener(type, fn, { ...opts, signal });

    /* ---------- the whip pan: every in-page jump from the rack or the hero ---------- */
    const whip = document.querySelector<HTMLElement>('[data-gb-whip]');
    let whipping = false;
    const land = (id: string) => {
      const prior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      if (location.hash === `#${id}`) document.getElementById(id)?.scrollIntoView();
      else location.hash = id;
      later(() => (root.style.scrollBehavior = prior), 60);
    };
    on('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>(
        '.railnav a[href^="#"], .startrow a[href^="#"]',
      );
      if (!a) return;
      const id = a.hash.slice(1);
      if (!id || !document.getElementById(id)) return;
      if (id === 'playground') v.deskBell(0.07);
      else v.jingle();
      // Reduced motion: the sound, then the browser's own (instant) jump.
      if (ctx.reducedMotion || !whip) return;
      e.preventDefault();
      if (whipping) return;
      whipping = true;
      v.whoosh();
      whip.classList.remove('is-on');
      void whip.offsetWidth;
      whip.classList.add('is-on');
      later(() => land(id), 200);
      later(() => {
        whip.classList.remove('is-on');
        whipping = false;
      }, 480);
    });

    /* ---------- hover voices: one per prop, fired once per element entered ---------- */
    const hovers: [string, () => void][] = [
      ['.railnav a', v.tink],
      ['.gb-dio', v.glow],
      ['.metrics .m', v.hover],
      ['.startrow a, .a2-launch .btn, .a2-action', v.hover],
      ['.idx tbody tr', v.pen],
      ['.repo', v.creak],
      ['.logitem', v.clack],
      ['.wrow', v.hover],
      ['.tenet', v.hover],
      ['.toolcol', v.squish],
      ['.gb-bell, .contact a, .foot-links a', v.hover],
    ];
    let hovered: Element | null = null;
    on(
      'pointerover',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        const t = e.target as Element | null;
        if (!t?.closest) return;
        for (const [sel, play] of hovers) {
          const el = t.closest(sel);
          if (!el) continue;
          if (el !== hovered) {
            hovered = el;
            play();
          }
          return;
        }
        hovered = null;
      },
      { passive: true },
    );

    /* ---------- each era change: clunk + the era's chord ---------- */
    let era = Number(root.dataset.act ?? 0);
    ctx.onSection((i) => {
      // only the nine real sections move the era (see the engine note in the report)
      if (i < 0 || i >= ctx.reel.acts.flatMap((a) => a.sections).length) return;
      const next = Number(root.dataset.act ?? 0);
      if (next !== era) v.era(i);
      era = next;
    });

    /* ---------- the diorama: a window comes on, another goes off ---------- */
    const dio = document.querySelector<HTMLElement>('[data-gb-dio]');
    const wins = dio ? [...dio.querySelectorAll<HTMLElement>('.w')] : [];
    const lit = new Set(wins.filter((w) => w.classList.contains('on')));
    let twinkle = 0;
    if (dio && wins.length && !ctx.reducedMotion) {
      const io = new IntersectionObserver(([entry]) => {
        window.clearInterval(twinkle);
        if (!entry?.isIntersecting) return;
        // keep roughly a quarter of the hotel awake
        twinkle = window.setInterval(() => {
          const awake = wins.filter((w) => w.classList.contains('on'));
          const pool =
            awake.length > wins.length * 0.3 ? awake : wins.filter((w) => !awake.includes(w));
          pool[Math.floor(Math.random() * pool.length)]?.classList.toggle('on');
        }, 1300);
      });
      io.observe(dio);
      signal.addEventListener('abort', () => io.disconnect(), { once: true });
    }

    /* ---------- telegrams: stamped in as they arrive ---------- */
    const log = document.querySelector<HTMLElement>('#log .log');
    const items = log ? [...log.querySelectorAll<HTMLElement>('.logitem')] : [];
    if (log && items.length && !ctx.reducedMotion && 'IntersectionObserver' in window) {
      log.classList.add('gb-armed');
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const el = e.target as HTMLElement;
            io.unobserve(el);
            el.classList.add('gb-in');
            later(v.stamp, 360);
          }
        },
        { threshold: 0.35 },
      );
      items.forEach((el) => io.observe(el));
      signal.addEventListener('abort', () => io.disconnect(), { once: true });
    }

    /* ---------- the switchboard: the agent's state, scored ---------- */
    let blips = 0;
    const relay = (state: string) => {
      if (state) root.dataset.gbRelay = state;
      else delete root.dataset.gbRelay;
    };
    const quiet = () => {
      window.clearInterval(blips);
      cueTimers.forEach((id) => window.clearTimeout(id));
      cueTimers.clear();
    };
    ctx.onCue((cue) => {
      switch (cue.name) {
        case 'open':
          v.deskBell(0.06);
          v.paper(0.05);
          break;
        case 'close':
          v.thud();
          break;
        case 'ask': {
          quiet();
          relay('ask');
          v.deskBell(0.08);
          // a few blips down the line, then the lamps chase on in silence
          let n = 0;
          blips = window.setInterval(() => {
            v.relayBlip();
            if (++n >= 6) window.clearInterval(blips);
          }, 170);
          break;
        }
        case 'surface': {
          quiet();
          relay('boxing');
          v.thud();
          cueLater(() => v.paper(), 300);
          cueLater(() => v.run(cue.count), 720);
          cueLater(() => {
            relay('done');
            v.done();
          }, 1250);
          cueLater(() => relay(''), 4200);
          break;
        }
        case 'error':
          quiet();
          relay('error');
          v.error();
          cueLater(() => relay(''), 3200);
          break;
      }
    });

    /* ---------- the registration card's clock (Rosario) ---------- */
    let clock = 0;
    try {
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Argentina/Cordoba',
        hour: '2-digit',
        minute: '2-digit',
      });
      const tickClock = () =>
        root.style.setProperty('--gb-clock', `"${fmt.format(new Date())} ART"`);
      tickClock();
      clock = window.setInterval(tickClock, 20000);
    } catch {
      /* no time zone data: the card simply has no clock */
    }

    /* ---------- the service bell ---------- */
    on('click', (e) => {
      const bell = (e.target as Element | null)?.closest<HTMLElement>('[data-gb-bell]');
      if (!bell) return;
      v.deskBell(0.12);
      bell.classList.remove('is-hit');
      void bell.offsetWidth;
      bell.classList.add('is-hit');
      later(() => bell.classList.remove('is-hit'), 720);
    });

    return () => {
      quiet();
      timers.forEach((id) => window.clearTimeout(id));
      root.style.scrollBehavior = '';
      window.clearInterval(twinkle);
      window.clearInterval(clock);
      relay('');
      root.style.removeProperty('--gb-clock');
      whip?.classList.remove('is-on');
      log?.classList.remove('gb-armed');
      items.forEach((el) => el.classList.remove('gb-in'));
      wins.forEach((w) => w.classList.toggle('on', lit.has(w)));
      document.querySelector('[data-gb-bell]')?.classList.remove('is-hit');
    };
  },

  titleSound(ctx) {
    title(ctx.sound);
  },
};

export default reel;
