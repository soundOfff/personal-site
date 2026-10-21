/**
 * Reel 02 · In the Mood for Love: the reel's behaviour. The sounds live in
 * ./score (a pizzicato waltz, a solo cello, a bolero on the radio); this
 * decides when they play:
 *
 *   - the waltz (an original Dm · Gm · C · A7 in 3/4): one beat per room as
 *     you arrive, never two inside a beat, a whole bar with the cello when the
 *     stairs come into view; when the agent's answer lands the cello sighs
 *     once per component and the A7 → D minor cadence resolves it;
 *   - the two doors creak ajar on hover and swing open on click;
 *   - the radio-dial switcher lands on a bolero while you rest on a station;
 *   - rain plays only while a lamp's cone of rain is on screen;
 *   - a room's lamp comes on, with its beat, when you reach it;
 *   - the stairs crossing is scroll-scrubbed (CSS scroll timelines, or a rAF
 *     fallback here), and she wears a different cheongsam each time;
 *   - the noodle stall's thermos steams while the agent thinks;
 *   - the wall at Angkor Wat takes a secret and stops it with mud on an
 *     unresolved bar. Nothing leaves the page.
 *
 * Loaded on demand while the reel screens; everything is torn down on abort.
 */
import { mountOpeningDisclosure } from '../openings/disclosure';
import type { ReelContext, ReelModule } from '../types';
import type { Bed } from '../sound';
import {
  beat,
  breath,
  cadence,
  chime,
  creak,
  halfCadence,
  harmonic,
  hover,
  key,
  latch,
  nib,
  paper,
  plaster,
  press,
  radio,
  rain,
  steam,
  sting,
  surface,
  surfaceSpan,
  tickTock,
  tile,
  waltz,
} from './score';

/** A beat of the waltz (ms): section changes closer than this wait their turn. */
const BEAT_MS = 460;

/** Her cheongsams, one per walk down the stairs. */
const DRESSES = 4;

/**
 * The crossing's pace: quick at either end, slow as they pass, the way the
 * film slows the walk to the noodle stall. reel.css draws the same curve with
 * linear() for the scroll timeline.
 */
const pace = (p: number) => p + (0.75 * Math.sin(2 * Math.PI * p)) / (2 * Math.PI);

/* --------------------------------------------------------------- helpers */

const MONTHS: Record<string, string> = {
  jan: '一月',
  feb: '二月',
  mar: '三月',
  apr: '四月',
  may: '五月',
  jun: '六月',
  jul: '七月',
  aug: '八月',
  sep: '九月',
  oct: '十月',
  nov: '十一月',
  dec: '十二月',
};

const supportsScrollTimeline = () =>
  typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');

/* ------------------------------------------------------------------ mount */

const reel: ReelModule = {
  titleSound(ctx) {
    sting(ctx.sound);
  },

  mount(ctx: ReelContext) {
    const { root, sound: s, signal } = ctx;
    const stopOpening = mountOpeningDisclosure(
      document.querySelector('[data-opening="mood"]'),
      signal,
    );
    const on = { signal } as const;
    const passive = { signal, passive: true } as const;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };
    const observers: IntersectionObserver[] = [];
    const io = (cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) => {
      const o = new IntersectionObserver(cb, opts);
      observers.push(o);
      return o;
    };

    root.dataset.mood = ctx.reducedMotion ? 'still' : 'on';

    /* ---- the waltz: one beat per room, never two inside a beat ---- */
    let room = ctx.section();
    let lastBeat = -Infinity;
    let held = false;
    // A fast scroll keeps only the room it lands in; a bar holds the beats until it has played.
    const strike = () => {
      const wait = lastBeat + BEAT_MS - performance.now();
      if (wait > 0) return later(strike, wait);
      held = false;
      lastBeat = performance.now();
      beat(s, room);
    };
    const nextBeat = (i: number) => {
      room = i;
      if (held) return;
      held = true;
      strike();
    };
    let bar = 0;
    const waltzBar = (n: number) => {
      lastBeat = performance.now() + 1100;
      waltz(s, n);
    };

    /* ---- a room's lamp comes on as you reach it, and stays on ---- */
    const sections = [...document.querySelectorAll<HTMLElement>('section[data-sec]')];
    // A jump from the nav passes the rooms before it: their lamps come on too.
    const light = (i: number) => {
      for (const sec of sections) if (Number(sec.dataset.sec) <= i) sec.dataset.moodLit = '';
    };

    const year = document.querySelector<HTMLElement>('[data-mood-year]');
    const setRoom = (n: number) => {
      const i = Math.min(8, Math.max(0, n));
      root.style.setProperty('--mood-room', String(i));
      if (year) year.textContent = String(1962 + Math.round(i / 2));
    };
    setRoom(ctx.section());
    light(ctx.section());
    ctx.onSection((i) => {
      setRoom(i);
      light(i);
      nextBeat(i);
    });

    /* ---- rain: animate and sound only while a cone is on screen ---- */
    const rains = [...document.querySelectorAll<HTMLElement>('[data-mood-rain]')];
    const raining = new Set<Element>();
    let bed: Bed | null = null;
    const syncRain = () => {
      if (raining.size && !s.muted) {
        if (!bed) bed = rain(s, signal);
      } else if (bed) {
        bed.stop(0.7);
        bed = null;
      }
    };
    const rainIo = io(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            raining.add(el);
            el.dataset.on = '';
          } else {
            raining.delete(el);
            delete el.dataset.on;
          }
        }
        syncRain();
      },
      { threshold: 0.1 },
    );
    rains.forEach((r) => rainIo.observe(r));
    const offSound = s.onChange((muted) => {
      if (muted) bed = null;
      syncRain();
    });
    // The context only exists after a gesture: try again on the first one.
    for (const ev of ['pointerdown', 'keydown'] as const) {
      window.addEventListener(ev, () => later(syncRain, 30), { ...on, once: true });
    }

    /* ---- past the hero, the walls close in and the clock shows ---- */
    const hero = document.getElementById('readme');
    if (hero) {
      io(
        (entries) => {
          for (const e of entries) {
            if (e.intersectionRatio < 0.3) root.dataset.moodInside = '';
            else delete root.dataset.moodInside;
          }
        },
        { threshold: [0, 0.15, 0.3, 0.6, 1] },
      ).observe(hero);
    }

    /* ---- the stairs: a bar of the waltz, a new dress each walk, and a scrub where CSS can't ---- */
    const stairs = document.querySelector<HTMLElement>('[data-mood-stairs]');
    if (stairs) {
      let inBar = false;
      let walks = 0;
      io(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && e.intersectionRatio > 0.35 && !inBar) {
              inBar = true;
              waltzBar(bar++ % 4);
            }
            // Out of sight, she changes: the next time you pass, it is another evening.
            // A frame resting exactly on the fold reports intersecting at ratio 0.
            if (!e.isIntersecting || e.intersectionRatio === 0) {
              if (inBar) stairs.dataset.dress = String(++walks % DRESSES);
              inBar = false;
            }
            // the clock belongs to the corridor, not the stairwell
            if (e.intersectionRatio > 0.2) root.dataset.moodStairs = '';
            else delete root.dataset.moodStairs;
          }
        },
        { threshold: [0, 0.2, 0.35] },
      ).observe(stairs);

      if (!ctx.reducedMotion && !supportsScrollTimeline()) {
        let ticking = false;
        const scrub = () => {
          ticking = false;
          const r = stairs.getBoundingClientRect();
          const span = r.height - window.innerHeight;
          const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
          stairs.style.setProperty('--mood-p', pace(p).toFixed(4));
        };
        const onScroll = () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(scrub);
          }
        };
        window.addEventListener('scroll', onScroll, passive);
        window.addEventListener('resize', onScroll, passive);
        scrub();
      }
    }

    /* ---- the doors ---- */
    const readme = document.getElementById('readme');
    const doors = readme
      ? ([
          ['l', readme.querySelector<HTMLAnchorElement>('[data-mood-door="l"]')],
          ['r', readme.querySelector<HTMLAnchorElement>('[data-mood-door="r"]')],
        ] as const)
      : [];
    for (const [side, link] of doors) {
      const way = readme?.querySelector<HTMLElement>(`[data-mood-door='${side}']`);
      if (!link || !way || !readme) continue;
      let hovering = 0;
      const enter = () => {
        if (hovering++ === 0 && readme.dataset.moodOpen !== side) {
          way.classList.add('is-ajar');
          creak(s, false);
        }
      };
      const leave = () => {
        hovering = Math.max(0, hovering - 1);
        if (hovering === 0) way.classList.remove('is-ajar');
      };
      for (const el of new Set([link, way])) {
        el.addEventListener('pointerenter', enter, on);
        el.addEventListener('pointerleave', leave, on);
      }
      link.addEventListener('focus', enter, on);
      link.addEventListener('blur', leave, on);
      link.addEventListener(
        'click',
        (event) => {
          if (side === 'l') {
            if (root.hasAttribute('data-playground-ready')) event.preventDefault();
            else root.setAttribute('data-playground-want', '');
            document.dispatchEvent(new Event('playground:open'));
          }
          readme.dataset.moodOpen = side;
          creak(s, true);
          later(() => {
            if (readme.dataset.moodOpen === side) delete readme.dataset.moodOpen;
          }, 1900);
        },
        on,
      );
    }

    /* ---- the calendar leaves: the month, in the film's hand ---- */
    const leaves = [...document.querySelectorAll<HTMLElement>('#log .logitem')];
    for (const leaf of leaves) {
      const date = leaf.querySelector('.date')?.textContent?.trim().toLowerCase() ?? '';
      const [m] = date.split(/\s+/);
      leaf.dataset.moodMonth = date === 'soon' ? '即將' : (MONTHS[m] ?? '月曆');
      leaf.dataset.moodMon = date === 'soon' ? 'soon' : m;
    }

    /* ---- the radio dial: rest on a station and it lands on a bolero ---- */
    let station: Bed | null = null;
    const offAir = (fade?: number) => {
      station?.stop(fade);
      station = null;
    };
    const tuneIn = (el: Element) => {
      offAir(0.06);
      const n = [...document.querySelectorAll('[data-reel-pick]')].indexOf(el);
      station = radio(s, Math.max(0, n));
    };

    /* ---- hover and press: the muted string, and its relatives ---- */
    let last: Element | null = null;
    const hoverSound = (el: Element) => {
      if (el.matches('[data-reel-pick]')) return tuneIn(el);
      if (el.matches('.railnav a')) return harmonic(s);
      if (el.matches('.toolcol li')) return tile(s);
      if (el.matches('.repo, .logitem')) return paper(s);
      // 2046: the serial is written by hand
      if (el.matches('.wrow')) return nib(s);
      if (el.matches('[data-mood-clock]')) return tickTock(s);
      hover(s);
    };
    const HOVER = [
      '[data-reel-pick]',
      '.railnav a',
      '.toolcol li',
      '.metrics .m',
      '.repo',
      '.logitem',
      '.wrow',
      '.idx tbody tr',
      '[data-mood-clock]',
      '.mood-brass',
      '.contact a',
      '.boxoffice-open',
      '[data-sound-toggle]',
      '.a2-action',
      '.foot a',
      '#playground .btn',
      '.a2-lamp',
    ].join(',');
    document.addEventListener(
      'pointerover',
      (e) => {
        if ((e as PointerEvent).pointerType === 'touch') return;
        const el = (e.target as Element | null)?.closest?.(HOVER) ?? null;
        // Off the dial, the set goes quiet.
        if (station && el !== last && !el?.matches('[data-reel-pick]')) offAir(0.35);
        if (el && el !== last) hoverSound(el);
        last = el;
      },
      passive,
    );

    document.addEventListener(
      'click',
      (e) => {
        const el = (e.target as Element | null)?.closest?.('a[href], button') ?? null;
        // A station picked: the projector takes over from the radio.
        if (el?.closest('[data-reel-pick]')) offAir(0.2);
        if (
          !el ||
          el.closest('#readme .startrow, [data-mood-door], [data-reel-pick], [data-sound-toggle]')
        ) {
          return;
        }
        if (el.matches('[data-mood-clock]')) return chime(s);
        if (el.closest('[data-mood-secret]')) return;
        press(s);
      },
      on,
    );

    /* ---- the noodle stall: steam while it cooks, a chop on every answer ---- */
    const agent = (state: 'think' | 'speak' | 'done' | '') => {
      if (state) root.dataset.moodAgent = state;
      else delete root.dataset.moodAgent;
    };
    ctx.onCue((cue) => {
      switch (cue.name) {
        case 'ask':
          agent('think');
          steam(s);
          press(s);
          break;
        case 'surface':
          agent('speak');
          surface(s, cue.count);
          cadence(s, surfaceSpan(cue.count));
          later(() => root.dataset.moodAgent === 'speak' && agent('done'), 1400);
          break;
        case 'error':
          agent('');
          halfCadence(s);
          break;
        case 'open':
          creak(s, false);
          break;
        case 'close':
          latch(s);
          break;
      }
    });

    /* ---- Angkor Wat: tell the wall a secret ---- */
    const form = document.querySelector<HTMLFormElement>('[data-mood-secret]');
    const hole = document.querySelector<HTMLElement>('[data-mood-hole]');
    const whisper = document.querySelector<HTMLElement>('[data-mood-whisper]');
    const sealed = document.querySelector<HTMLElement>('[data-mood-sealed]');
    const input = form?.querySelector<HTMLInputElement>('input');
    if (form && hole && whisper && sealed && input) {
      let typed = input.value.length;
      input.addEventListener(
        'input',
        () => {
          if (input.value.length > typed) key(s);
          typed = input.value.length;
        },
        on,
      );
      form.addEventListener(
        'submit',
        (e) => {
          e.preventDefault();
          const text = input.value.trim();
          if (!text) {
            halfCadence(s);
            input.focus();
            return;
          }
          // The secret only ever lives in this element, and only until the mud goes on.
          whisper.textContent = text;
          input.value = '';
          typed = 0;
          sealed.textContent = '';
          hole.classList.remove('is-sealed', 'is-whisper');
          void hole.offsetWidth;
          hole.classList.add('is-whisper');
          breath(s);
          const step = ctx.reducedMotion ? 0 : 1;
          later(() => {
            hole.classList.add('is-sealed');
            whisper.textContent = '';
            plaster(s);
          }, 780 * step);
          later(() => {
            sealed.textContent = 'Left in the wall. Nobody will read it, not even me.';
            // the A7 bar: left on the dominant, never resolved
            waltzBar(3);
          }, 1500 * step);
        },
        on,
      );
    }

    return () => {
      stopOpening();
      timers.forEach((id) => window.clearTimeout(id));
      observers.forEach((o) => o.disconnect());
      offSound();
      bed?.stop(0.4);
      offAir(0.1);
      delete root.dataset.mood;
      delete root.dataset.moodAgent;
      delete root.dataset.moodInside;
      delete root.dataset.moodStairs;
      root.style.removeProperty('--mood-room');
      if (!root.getAttribute('style')) root.removeAttribute('style');
      sections.forEach((sec) => delete sec.dataset.moodLit);
      leaves.forEach((leaf) => {
        delete leaf.dataset.moodMonth;
        delete leaf.dataset.moodMon;
      });
      document.querySelectorAll('[data-mood-door]').forEach((d) => d.classList.remove('is-ajar'));
      if (readme) delete readme.dataset.moodOpen;
      stairs?.style.removeProperty('--mood-p');
      if (stairs) delete stairs.dataset.dress;
      rains.forEach((r) => delete r.dataset.on);
      hole?.classList.remove('is-sealed', 'is-whisper');
      if (sealed) sealed.textContent = '';
    };
  },
};

export default reel;
