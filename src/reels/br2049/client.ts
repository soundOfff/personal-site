/**
 * Reel 03 · Blade Runner 2049: the reel's behaviour (scroll scenes, motifs, sound).
 * Loaded on demand when the reel starts screening; everything registered
 * against ctx.signal is torn down when it stops.
 *
 *   - the scrubber: the playhead follows the scroll, and the readout names the
 *     section and the timecode under the playhead, counted against the
 *     film's running time (the tick under the pointer, when there is one),
 *   - particles for the act backdrops (dust in the haze, rain, snow) and the
 *     flight; snow melts under the pointer,
 *   - the agent's baseline readout follows the playground's cues,
 *   - sound, voiced in score.ts after Zimmer and Wallfisch by way of
 *     Vangelis: a CS-80 brass swell per act, rain while in Los Angeles and a
 *     broken jukebox while in Las Vegas, a ring-mod hologram bell + brass stab
 *     per composed surface and a minor-to-major chord as it settles, HUD
 *     ticks and clicks, the braam and sub hit on the title card.
 */
import { SECTION_IDS, type ReelContext, type ReelModule } from '../types';
import type { Bed } from '../sound';
import { actOf } from '../registry';
import { RUNTIME } from './config';
import * as sfx from './score';

const NAMES = [
  'readme',
  'playground',
  'work index',
  'open source',
  'log',
  'writing',
  'principles',
  'stack',
  'now',
];
const LAST = NAMES.length - 1;

const pad = (n: number) => String(n).padStart(2, '0');
const clock = (s: number) =>
  `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;

/** A small seeded generator, so the particles fall the same way every visit. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ------------------------------------------------------------------ */
/* particles: purely decorative, built only while this reel screens    */
/* ------------------------------------------------------------------ */

function sprinkle(root: HTMLElement, motion: boolean): () => void {
  const made: HTMLElement[] = [];
  const rnd = seeded(2049);
  const fill = (attr: string, make: (el: HTMLElement) => void) =>
    root.querySelectorAll<HTMLElement>(`[${attr}]`).forEach((box) => {
      const n = Number(box.getAttribute(attr) || 0);
      const frag = document.createDocumentFragment();
      for (let i = 0; i < n; i++) {
        const el = document.createElement('i');
        make(el);
        frag.appendChild(el);
        made.push(el);
      }
      box.appendChild(frag);
    });
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

  // the city from the air: static, so it stays even with reduced motion
  const lights = ['#F2A25E', '#F2A25E', '#E9D8B8', '#4FC3D9', '#E44D9B', '#F2A25E'];
  fill('data-br-city', (el) => {
    el.style.cssText = `left:${pct(rnd())};bottom:${pct(rnd() ** 1.7 * 0.7)};background:${lights[Math.floor(rnd() * lights.length)]};animation-delay:-${(rnd() * 3.4).toFixed(2)}s`;
  });
  if (motion) {
    fill('data-br-rain', (el) => {
      el.className = 'br-drop';
      el.style.cssText = `left:${pct(rnd())};height:${Math.round(18 + rnd() * 40)}px;opacity:${(0.2 + rnd() * 0.55).toFixed(2)};animation-duration:${(0.45 + rnd() * 0.4).toFixed(2)}s;animation-delay:-${(rnd() * 1.4).toFixed(2)}s`;
    });
    fill('data-br-dust', (el) => {
      el.style.cssText = `left:${pct(rnd())};top:${pct(0.1 + rnd() * 0.85)};animation-duration:${(10 + rnd() * 12).toFixed(1)}s;animation-delay:-${(rnd() * 20).toFixed(1)}s;--o:${(0.3 + rnd() * 0.6).toFixed(2)}`;
    });
    // depth of field: the big flakes are near the lens, soft and quicker across the
    // frame; the small ones are far back, a little soft and slow
    fill('data-br-snow', (el) => {
      const size = 3 + rnd() * 5;
      const blur = size > 6.4 ? 1.6 : size < 3.8 ? 0.4 : 0;
      const dur = 23 - size * 1.7 + rnd() * 4;
      el.style.cssText = `left:${pct(rnd())};width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;filter:blur(${blur}px);animation-duration:${dur.toFixed(1)}s;animation-delay:-${(rnd() * 19).toFixed(1)}s`;
    });
  }

  return () => made.forEach((el) => el.remove());
}

/* ------------------------------------------------------------------ */

function memoryLab(ctx: ReelContext): () => void {
  const template = document.querySelector<HTMLTemplateElement>('[data-br-memory-template]');
  const heading = document.querySelector<HTMLElement>('#stack > .keybar');
  if (!template || !heading) return () => {};
  const fragment = template.content.cloneNode(true);
  if (!(fragment instanceof DocumentFragment)) return () => {};
  const lab = fragment.querySelector<HTMLElement>('.br-memory');
  if (!lab) return () => {};
  heading.insertAdjacentElement('afterend', lab);

  const slices = [...lab.querySelectorAll<SVGGElement>('[data-br-memory-slice]')];
  const links = [...lab.querySelectorAll<HTMLAnchorElement>('[data-br-memory-link]')];
  const count = lab.querySelector<HTMLElement>('[data-br-memory-count]');
  const visited = new Set<number>();
  const marks = SECTION_IDS.map((id, index) => {
    const keybar = document.querySelector<HTMLElement>(`#${id} > .keybar`);
    const mark = document.createElement('span');
    mark.className = 'br-memory-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = `M.${pad(index + 1)}`;
    keybar?.appendChild(mark);
    return mark;
  });
  const remember = (index: number) => {
    if (ctx.signal.aborted || index < 0 || index >= SECTION_IDS.length) return;
    visited.add(index);
    slices[index]?.classList.add('is-recorded');
    links[index]?.classList.add('is-recorded');
    links[index]?.setAttribute('aria-label', `${NAMES[index]}, recorded`);
    marks[index]?.classList.add('is-recorded');
    if (count) count.textContent = pad(visited.size);
  };
  const offSection = ctx.onSection(remember);
  remember(ctx.section());
  const select = (index: number | null) => {
    slices.forEach((slice, i) => slice.classList.toggle('is-selected', i === index));
  };
  links.forEach((link, index) => {
    link.addEventListener(
      'pointerenter',
      (event) => {
        if (event.pointerType === 'mouse') select(index);
      },
      { signal: ctx.signal },
    );
    link.addEventListener(
      'pointerleave',
      () => {
        const focused = links.findIndex((item) => item === document.activeElement);
        select(focused < 0 ? null : focused);
      },
      { signal: ctx.signal },
    );
    link.addEventListener('focus', () => select(index), { signal: ctx.signal });
    link.addEventListener('blur', () => select(null), { signal: ctx.signal });
  });
  const stop = () => {
    offSection();
    marks.forEach((mark) => mark.remove());
    lab.remove();
  };
  ctx.signal.addEventListener('abort', stop, { once: true });
  return stop;
}

const reel: ReelModule = {
  mount(ctx: ReelContext) {
    const { root, signal, sound: kit } = ctx;
    const on = <K extends keyof HTMLElementEventMap>(
      els: Iterable<Element> | Element | null,
      type: K,
      fn: (e: HTMLElementEventMap[K]) => void,
      passive = true,
    ) => {
      if (!els) return;
      const list = els instanceof Element ? [els] : els;
      for (const el of list) el.addEventListener(type, fn as EventListener, { signal, passive });
    };
    const $$ = (sel: string) => document.querySelectorAll(sel);
    const cleanups: (() => void)[] = [];
    cleanups.push(memoryLab(ctx));

    /* ---------- particles ---------- */
    cleanups.push(sprinkle(document.body, !ctx.reducedMotion));

    /* ---------- the readout and the playhead ---------- */
    const ro = (key: string) => document.querySelector<HTMLElement>(`[data-br-ro='${key}']`);
    const roName = ro('name');
    const roTc = ro('tc');
    const nav = document.querySelector<HTMLElement>('.railnav');
    // The engine's section watcher also counts <html data-sec>, so at the very bottom it
    // can report a tenth section for a frame: clamp to the nine that exist.
    const section = () => Math.min(Math.max(ctx.section(), 0), LAST);
    // where the playhead stands, in sections: 0 is the first tick, LAST the last
    let at = section();
    const timecode = (p: number) => {
      if (roTc) roTc.textContent = clock(Math.round((p / LAST) * RUNTIME));
    };
    // the readout names the tick under the pointer (or focus), else the section in view
    let hovered = -1;
    let focused = -1;
    const readout = () => {
      const i = hovered >= 0 ? hovered : focused;
      if (roName) roName.textContent = NAMES[i >= 0 ? i : section()];
      timecode(i >= 0 ? i : at);
    };
    readout();

    const secs = [...document.querySelectorAll<HTMLElement>('main [data-sec]')];
    const setInd = (v: number) => nav?.style.setProperty('--br-ind', v.toFixed(4));
    const playhead = () => {
      if (!secs.length) return;
      // the probe line rides down from the top edge over the first scroll, so the
      // top of the page reads 0:00:00 instead of starting part-way into the readme
      const probe = Math.min(window.scrollY, window.innerHeight * 0.4);
      const atEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let pos = secs.length - 1;
      if (!atEnd) {
        const tops = secs.map((s) => s.getBoundingClientRect().top);
        let i = 0;
        while (i < tops.length - 1 && tops[i + 1] <= probe) i++;
        const span = i < tops.length - 1 ? tops[i + 1] - tops[i] : 1;
        pos = i + (i < tops.length - 1 ? Math.min(1, Math.max(0, (probe - tops[i]) / span)) : 0);
      }
      at = Math.min(pos, secs.length - 1);
      setInd((at + 0.5) / secs.length);
      if (hovered < 0 && focused < 0) timecode(at);
    };
    if (ctx.reducedMotion) {
      setInd((section() + 0.5) / 9);
    } else {
      let queued = false;
      const onScroll = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          playhead();
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true, signal });
      window.addEventListener('resize', onScroll, { passive: true, signal });
      playhead();
    }
    cleanups.push(() => nav?.style.removeProperty('--br-ind'));

    /* ---------- sections and acts ---------- */
    let act = actOf(ctx.reel, section());
    // rain while Los Angeles is on screen, the jukebox while Las Vegas is
    let rainBed: Bed | null = null;
    let loungeBed: Bed | null = null;
    const syncBeds = () => {
      if (act === 3 && !rainBed && !kit.muted) rainBed = sfx.rain(kit, signal);
      if (act !== 3 && rainBed) {
        rainBed.stop(0.7);
        rainBed = null;
      }
      if (act === 2 && !loungeBed && !kit.muted) loungeBed = sfx.lounge(kit, signal);
      if (act !== 2 && loungeBed) {
        loungeBed.stop(0.6);
        loungeBed = null;
      }
    };
    // one swell per act you arrive in; flying past acts (a far tick on the dock)
    // only sounds the one you land in, and swells keep a breath apart so a fast
    // scroll back and forth doesn't smear them
    let swell = 0;
    let swelled = -Infinity;
    cleanups.push(() => window.clearTimeout(swell));
    ctx.onSection(() => {
      const i = section();
      if (ctx.reducedMotion) {
        at = i;
        setInd((i + 0.5) / 9);
      }
      readout();
      const next = actOf(ctx.reel, i);
      if (next !== act) {
        act = next;
        window.clearTimeout(swell);
        swell = window.setTimeout(
          () => {
            swelled = performance.now();
            sfx.section(kit, section());
          },
          Math.max(280, swelled + 1200 - performance.now()),
        );
      }
      syncBeds();
    });
    const offSound = kit.onChange((muted) => {
      if (muted) {
        rainBed = null;
        loungeBed = null;
      } else syncBeds();
    });
    cleanups.push(offSound);
    // the first gesture unlocks audio: start the bed if we're already in LA or Las Vegas
    window.addEventListener('pointerdown', syncBeds, { once: true, passive: true, signal });
    syncBeds();

    /* ---------- the scrubber dock ---------- */
    const ticks = [...$$('.railnav a')];
    ticks.forEach((a, i) => {
      on(a, 'pointerenter', () => {
        hovered = i;
        readout();
        sfx.tick(kit);
      });
      on(a, 'pointerleave', () => {
        hovered = -1;
        readout();
      });
      on(a, 'focus', () => {
        focused = a.matches(':focus-visible') ? i : -1;
        readout();
      });
      on(a, 'blur', () => {
        focused = -1;
        readout();
      });
      on(a, 'click', () => sfx.fly(kit));
    });
    on($$('.rail .contact a, .rail .snd, .boxoffice-open'), 'pointerenter', () => sfx.tick(kit));
    on($$('#readme .startrow a'), 'pointerenter', () => sfx.tick(kit));
    on($$('#readme .startrow a'), 'click', () => sfx.fly(kit));

    /* ---------- motifs with a voice ---------- */
    on($$('#readme .lede em'), 'pointerenter', () => sfx.holo(kit));
    on($$('#work .idx tr'), 'pointerenter', () => sfx.holo(kit));
    on($$('#oss .repo'), 'pointerenter', () => sfx.tick(kit));
    on($$('#log .logitem'), 'pointerenter', () => sfx.knock(kit));
    on($$('#writing .wrow, #principles .tenet'), 'pointerenter', () => sfx.holo(kit));
    on($$('#stack .toolcol li'), 'pointerenter', () => sfx.drawer(kit));

    // snow melts where the pointer passes (only while the snow is falling)
    let lastMelt = 0;
    const melt = () => {
      const now = performance.now();
      if (now - lastMelt < 90) return;
      lastMelt = now;
      sfx.melt(kit);
    };
    const flakes = () => [...document.querySelectorAll<HTMLElement>('.br-snow i:not(.is-melt)')];
    let px = 0;
    let py = 0;
    let melting = false;
    const meltNear = () => {
      melting = false;
      if (act !== 4) return;
      for (const f of flakes()) {
        const r = f.getBoundingClientRect();
        if (Math.abs(r.left + 3 - px) < 26 && Math.abs(r.top + 3 - py) < 26) {
          f.classList.add('is-melt');
          melt();
          window.setTimeout(() => f.classList.remove('is-melt'), 2400);
        }
      }
    };
    if (!ctx.reducedMotion) {
      on(document.documentElement, 'pointermove', (e) => {
        if (act !== 4 || e.pointerType !== 'mouse') return;
        px = e.clientX;
        py = e.clientY;
        if (!melting) {
          melting = true;
          requestAnimationFrame(meltNear);
        }
      });
    }

    /* ---------- the agent: baseline readout + projection sounds ---------- */
    let waveTimer = 0;
    const wave = (state: 'idle' | 'think' | 'speak' | 'done') => {
      window.clearTimeout(waveTimer);
      if (state === 'idle') delete root.dataset.brWave;
      else root.dataset.brWave = state;
      // composing settles to "within baseline", then back to the idle trace
      if (state === 'speak') waveTimer = window.setTimeout(() => wave('done'), 1400);
      else if (state === 'done') waveTimer = window.setTimeout(() => wave('idle'), 5000);
    };
    cleanups.push(() => {
      window.clearTimeout(waveTimer);
      delete root.dataset.brWave;
    });
    ctx.onCue((cue) => {
      if (cue.name === 'ask') {
        sfx.click(kit);
        sfx.holo(kit);
        wave('think');
      } else if (cue.name === 'surface') {
        sfx.surface(kit, cue.count ?? 1);
        sfx.resolve(kit, 0.6);
        wave('speak');
      } else if (cue.name === 'error') {
        sfx.growl(kit);
        wave('idle');
      } else if (cue.name === 'open') {
        sfx.open(kit);
      } else if (cue.name === 'close') {
        sfx.close(kit);
      }
    });

    return () => cleanups.forEach((fn) => fn());
  },

  titleSound(ctx) {
    sfx.title(ctx.sound);
  },
};

export default reel;
