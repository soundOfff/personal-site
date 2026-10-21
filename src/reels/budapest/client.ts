/**
 * Reel 04 · The Grand Budapest Hotel: the reel's behaviour (scroll scenes, motifs, sound).
 * Loaded on demand when the reel starts screening; everything registered
 * against ctx.signal is torn down when it stops. The sounds themselves are the
 * score (./score): a balalaika, cimbalom, zither, organ and timpani band in
 * E harmonic minor, after Desplat, plus the hotel's own noises.
 *
 *   - the key rack: a brass key tink per key, a key-ring jingle and a soft
 *     stereo whoosh accompanying native in-page navigation
 *   - other hovers: the cimbalom's cotton beater, wandering the scale
 *   - the cut into each era: an interlude crossing the middle of the screen
 *     closes the matte to the era's ratio (html[data-gb-ar]), with a projector
 *     clunk and the era's chord (i, iv, V) on a trembling balalaika over timpani
 *   - the hero diorama: windows that light on hover (CSS) and twinkle in view
 *   - telegrams stamp in as they scroll into view, with the date stamp's thump
 *   - the playground: a switchboard relay (html[data-gb-relay]) and the desk
 *     bell; a pastry box, tissue paper and a zither run when it composes, a
 *     balalaika accelerando to a dead stop when it is done, and the organ
 *     losing its wind on an error
 *   - the registration card's clock, and the service bell
 *
 * Everything audible goes through ctx.sound, so it is silent while muted.
 */
import { SECTION_IDS, type ReelContext, type ReelModule } from '../types';
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
    /** projector clunk and the era's chord; `i` is a section of the era cut to */
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

    on('click', (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('.railnav a[href^="#"], .startrow a[href^="#"]')
          : null;
      if (!link || !document.getElementById(link.hash.slice(1))) return;
      if (link.hash === '#playground') v.deskBell(0.07);
      else v.jingle();
      if (!ctx.reducedMotion) v.whoosh();
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

    /* ---------- the cut into each era: the matte, the clunk and the chord ---------- */
    // html[data-act] turns over when the next section's top passes 40% down
    // the screen, by which time the interlude has scrolled away. The frame
    // follows the interludes instead, so it changes while the year is in view.
    const interludes = [...document.querySelectorAll<HTMLElement>('.gb-interlude')];
    const firstSection = ctx.reel.acts.map((a) =>
      SECTION_IDS.findIndex((id) => a.sections.includes(id)),
    );
    let era = -1;
    let framing = false;
    const frame = () => {
      framing = false;
      if (signal.aborted) return;
      const mid = window.innerHeight / 2;
      const next = interludes.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height > 0 && r.top + r.height / 2 < mid;
      }).length;
      if (next === era) return;
      if (era >= 0) v.era(firstSection[next] ?? 0);
      era = next;
      root.dataset.gbAr = String(next);
    };
    const reframe = () => {
      if (framing) return;
      framing = true;
      requestAnimationFrame(frame);
    };
    window.addEventListener('scroll', reframe, { passive: true, signal });
    window.addEventListener('resize', reframe, { passive: true, signal });
    frame();

    /* ---------- the hero diorama: a window comes on, another goes off ---------- */
    const dio = document.querySelector<HTMLElement>('[data-gb-dio="1932"]');
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
      window.clearInterval(twinkle);
      window.clearInterval(clock);
      relay('');
      root.style.removeProperty('--gb-clock');
      delete root.dataset.gbAr;
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
