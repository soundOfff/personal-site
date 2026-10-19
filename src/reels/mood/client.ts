/**
 * Reel 02 · In the Mood for Love: the reel's behaviour.
 *
 *   - a 3/4 waltz (an original Dm · Gm · C · A7 progression, pizzicato): one
 *     beat per room as you arrive, a whole bar when the stairs come into view,
 *     an A7 → D minor cadence when the agent's answer lands;
 *   - the two doors creak ajar on hover and swing open on click;
 *   - rain plays only while a lamp's cone of rain is on screen;
 *   - rooms step-print in as they are reached; the stairs crossing is
 *     scroll-scrubbed (CSS scroll timelines, or a rAF fallback here);
 *   - the noodle stall's thermos steams while the agent thinks;
 *   - room 2046's wall takes a secret and seals it. Nothing leaves the page.
 *
 * Loaded on demand while the reel screens; everything is torn down on abort.
 */
import type { ReelContext, ReelModule } from '../types';
import type { SoundKit } from '../sound';

/* ------------------------------------------------------------------ sound */

/** A plucked string, pizzicato: triangle + octave sine through a closing lowpass. */
function pizz(s: SoundKit, f: number, at = 0, vol = 0.1): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + at;
  const o = ac.createOscillator();
  o.type = 'triangle';
  o.frequency.value = f;
  const o2 = ac.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = f * 2;
  const g2 = ac.createGain();
  g2.gain.value = 0.3;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 1.5;
  lp.frequency.setValueAtTime(Math.min(8000, f * 8), t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(220, f * 1.5), t + 0.3);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  o.connect(lp);
  o2.connect(g2);
  g2.connect(lp);
  lp.connect(g);
  g.connect(s.out());
  const send = ac.createGain();
  send.gain.value = 0.28;
  g.connect(send);
  send.connect(s.reverb(1.6));
  o.start(t);
  o2.start(t);
  o.stop(t + 0.6);
  o2.stop(t + 0.6);
  s.burst({ dur: 0.008, f: 3200, q: 0.8, vol: vol * 0.5, at });
}

/** The waltz: [bass, chord, chord] per bar. Dm, Gm, C, A7. */
const BARS = [
  [73.42, 349.23, 440],
  [98, 392, 466.16],
  [65.41, 392, 523.25],
  [55, 329.63, 392],
] as const;

function waltzAt(s: SoundKit, n: number, at = 0): void {
  const bar = BARS[Math.floor(n / 3) % 4];
  if (n % 3 === 0) {
    pizz(s, bar[0] * 2, at, 0.12);
    pizz(s, bar[0], at + 0.01, 0.06);
  } else {
    pizz(s, bar[1], at, 0.055);
    pizz(s, bar[2], at + 0.014, 0.045);
  }
}

/** A7 → D minor, plucked. */
function cadence(s: SoundKit, at = 0): void {
  (
    [
      [110, 0, 0.11],
      [329.63, 0.42, 0.06],
      [392, 0.42, 0.05],
      [554.37, 0.43, 0.04],
      [146.83, 0.84, 0.11],
      [293.66, 1.26, 0.06],
      [349.23, 1.27, 0.06],
      [587.33, 1.3, 0.06],
    ] as const
  ).forEach(([f, t, v]) => pizz(s, f, at + t, v));
}

/** Hover: a woodblock tock. */
function tock(s: SoundKit, hi = false): void {
  s.burst({ dur: 0.014, f: hi ? 2400 : 1700, q: 6, vol: 0.16 });
  s.tone({ f0: hi ? 1180 : 860, dur: 0.03, vol: 0.025 });
}

/** An enamel sign, tapped. */
function tink(s: SoundKit): void {
  s.tone({ type: 'triangle', f0: 3150, dur: 0.12, vol: 0.02 });
  s.tone({ f0: 4720, dur: 0.08, vol: 0.01, at: 0.01 });
}

function paper(s: SoundKit): void {
  s.burst({ dur: 0.05, kind: 'highpass', f: 2600, vol: 0.09 });
  s.burst({ dur: 0.03, kind: 'highpass', f: 3600, vol: 0.06, at: 0.05 });
}

/** One typewriter key. */
function key(s: SoundKit, at = 0): void {
  s.burst({ dur: 0.02, f: 2800 + Math.random() * 1400, q: 1.3, vol: 0.15, at });
  s.tone({ f0: 170, f1: 90, dur: 0.035, vol: 0.06, at });
}

function tickTock(s: SoundKit): void {
  s.burst({ dur: 0.012, f: 2600, q: 7, vol: 0.12 });
  s.burst({ dur: 0.012, f: 1900, q: 7, vol: 0.1, at: 0.32 });
}

/** A struck bell: fundamental plus two inharmonic partials. */
function bell(s: SoundKit, f: number, at = 0, vol = 0.06): void {
  (
    [
      [1, 1],
      [2.76, 0.4],
      [5.4, 0.15],
    ] as const
  ).forEach(([m, v]) => s.tone({ f0: f * m, dur: 1.8, vol: vol * v, at }));
}

/** The door: band-passed noise wandering like a dry hinge, over a low groan. */
function creak(s: SoundKit, long = false): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const dur = long ? 0.9 : 0.5;
  const n = s.noise(dur);
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
  n.start(t);
  const o = ac.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(70, t);
  o.frequency.linearRampToValueAtTime(56, t + dur);
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

/** The radio dial: a band-pass sweep through static, and a whistle. */
function tune(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const n = s.noise(0.28);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 3;
  bp.frequency.setValueAtTime(700, t);
  bp.frequency.exponentialRampToValueAtTime(2600, t + 0.26);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  n.connect(bp);
  bp.connect(g);
  g.connect(s.out());
  n.start(t);
  s.tone({ f0: 1400, f1: 1900, dur: 0.22, vol: 0.014 });
}

/** Noise through a filter with a swell; the building block for steam, breath, plaster. */
function hiss(
  s: SoundKit,
  kind: BiquadFilterType,
  f: number,
  q: number,
  peak: number,
  dur: number,
) {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime;
  const n = s.noise(dur);
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
  n.start(t);
}

const steam = (s: SoundKit) => hiss(s, 'highpass', 3200, 0.7, 0.03, 0.9);
const breath = (s: SoundKit) => hiss(s, 'bandpass', 1100, 0.6, 0.05, 0.7);
function plaster(s: SoundKit): void {
  s.burst({ dur: 0.14, kind: 'lowpass', f: 300, q: 0.7, vol: 0.45 });
  hiss(s, 'bandpass', 480, 1.2, 0.06, 0.45);
}

/** Rain in the lamp: looped, filtered noise, faded in. */
function rainBed(s: SoundKit, signal: AbortSignal) {
  return s.bed((ac, out) => {
    const src = s.noise(2.5);
    src.loop = true;
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
    src.start(t);
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

/**
 * The title sting: one pizzicato bar of the waltz in D minor while a bowed
 * string draws a breath on A and leans up to D, with a little vibrato.
 */
function sting(s: SoundKit): void {
  const ac = s.ctx();
  if (!ac) return;
  const t = ac.currentTime + 0.05;
  pizz(s, 146.83, 0.05, 0.12);
  pizz(s, 73.42, 0.06, 0.06);
  pizz(s, 349.23, 0.47, 0.05);
  pizz(s, 440, 0.48, 0.045);
  pizz(s, 349.23, 0.89, 0.05);
  pizz(s, 440, 0.9, 0.045);

  const bow = ac.createOscillator();
  bow.type = 'sawtooth';
  bow.frequency.setValueAtTime(220, t);
  bow.frequency.setValueAtTime(220, t + 0.62);
  bow.frequency.exponentialRampToValueAtTime(293.66, t + 0.78);
  const vib = ac.createOscillator();
  vib.frequency.value = 5.4;
  const vibDepth = ac.createGain();
  vibDepth.gain.setValueAtTime(0, t);
  vibDepth.gain.linearRampToValueAtTime(2.6, t + 0.9);
  vib.connect(vibDepth);
  vibDepth.connect(bow.frequency);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(700, t);
  lp.frequency.linearRampToValueAtTime(1500, t + 0.8);
  lp.Q.value = 0.8;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.45);
  g.gain.setValueAtTime(0.05, t + 1.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.75);
  bow.connect(lp);
  lp.connect(g);
  g.connect(s.out());
  const send = ac.createGain();
  send.gain.value = 0.4;
  g.connect(send);
  send.connect(s.reverb(1.6));
  bow.start(t);
  vib.start(t);
  bow.stop(t + 1.8);
  vib.stop(t + 1.8);
}

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

    /* ---- the waltz: one beat per room ---- */
    let beat = 0;
    const nextBeat = () => waltzAt(s, beat++);
    const waltzBar = () => {
      const n0 = beat - (beat % 3);
      for (let k = 0; k < 3; k++) waltzAt(s, n0 + k, k * 0.42);
      beat = n0 + 3;
    };

    const year = document.querySelector<HTMLElement>('[data-mood-year]');
    const setRoom = (n: number) => {
      const i = Math.min(8, Math.max(0, n));
      root.style.setProperty('--mood-room', String(i));
      if (year) year.textContent = String(1962 + Math.round(i / 2));
    };
    setRoom(ctx.section());
    ctx.onSection((i) => {
      setRoom(i);
      nextBeat();
    });

    /* ---- rooms step-print in as they are reached ---- */
    const sections = [...document.querySelectorAll<HTMLElement>('section[data-sec]')];
    if (!ctx.reducedMotion) {
      const vh = window.innerHeight;
      sections.forEach((sec) => {
        if (sec.getBoundingClientRect().top > vh * 0.92) sec.dataset.moodWait = '';
      });
      const reveal = io(
        (entries) => {
          for (const e of entries) {
            const el = e.target as HTMLElement;
            if (!e.isIntersecting || !('moodWait' in el.dataset)) continue;
            delete el.dataset.moodWait;
            el.dataset.moodIn = '';
            reveal.unobserve(el);
          }
        },
        { threshold: 0.08 },
      );
      sections.forEach((sec) => reveal.observe(sec));
    }

    /* ---- rain: animate and sound only while a cone is on screen ---- */
    const rains = [...document.querySelectorAll<HTMLElement>('[data-mood-rain]')];
    const raining = new Set<Element>();
    let bed: ReturnType<typeof rainBed> = null;
    const syncRain = () => {
      if (raining.size && !s.muted) {
        if (!bed) bed = rainBed(s, signal);
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

    /* ---- the stairs: a bar of the waltz, and a scrub where CSS can't ---- */
    const stairs = document.querySelector<HTMLElement>('[data-mood-stairs]');
    if (stairs) {
      let inBar = false;
      io(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && e.intersectionRatio > 0.35 && !inBar) {
              inBar = true;
              waltzBar();
            }
            if (!e.isIntersecting) inBar = false;
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
          stairs.style.setProperty('--mood-p', String(Math.floor(p * 26) / 26));
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
          ['l', readme.querySelector<HTMLAnchorElement>('.startrow > a:first-child')],
          ['r', readme.querySelector<HTMLAnchorElement>('.startrow > a:last-child')],
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
      for (const el of [link, way]) {
        el.addEventListener('pointerenter', enter, on);
        el.addEventListener('pointerleave', leave, on);
      }
      link.addEventListener('focus', enter, on);
      link.addEventListener('blur', leave, on);
      link.addEventListener(
        'click',
        () => {
          readme.dataset.moodOpen = side;
          creak(s, true);
          later(() => {
            if (readme.dataset.moodOpen === side) delete readme.dataset.moodOpen;
          }, 1900);
        },
        on,
      );
      // The light behind a door that has swung ajar is still the door.
      way.addEventListener('click', () => link.click(), on);
    }

    /* ---- the calendar leaves: the month, in the film's hand ---- */
    const leaves = [...document.querySelectorAll<HTMLElement>('#log .logitem')];
    for (const leaf of leaves) {
      const date = leaf.querySelector('.date')?.textContent?.trim().toLowerCase() ?? '';
      const [m] = date.split(/\s+/);
      leaf.dataset.moodMonth = date === 'soon' ? '即將' : (MONTHS[m] ?? '月曆');
      leaf.dataset.moodMon = date === 'soon' ? 'soon' : m;
    }

    /* ---- hover and press: the woodblock, and its relatives ---- */
    let last: Element | null = null;
    let typing = 0;
    const hoverSound = (el: Element) => {
      if (el.matches('[data-reel-pick]')) return tune(s);
      if (el.matches('.railnav a, .toolcol li')) return tock(s, true);
      if (el.matches('.metrics .m')) return tink(s);
      if (el.matches('.repo, .logitem')) return paper(s);
      if (el.matches('.tenet')) {
        return pizz(s, [293.66, 349.23, 440, 587.33][Math.floor(Math.random() * 4)], 0, 0.045);
      }
      if (el.matches('.wrow')) {
        const run = ++typing;
        for (let k = 0; k < 4; k++) {
          later(() => run === typing && key(s), k * 85 + Math.random() * 30);
        }
        return;
      }
      if (el.matches('[data-mood-clock]')) return tickTock(s);
      tock(s, false);
    };
    const HOVER = [
      '[data-reel-pick]',
      '.railnav a',
      '.toolcol li',
      '.metrics .m',
      '.repo',
      '.logitem',
      '.tenet',
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
        if (el && el !== last) hoverSound(el);
        last = el;
      },
      passive,
    );

    document.addEventListener(
      'click',
      (e) => {
        const el = (e.target as Element | null)?.closest?.('a[href], button') ?? null;
        if (
          !el ||
          el.closest('#readme .startrow, [data-mood-door], [data-reel-pick], [data-sound-toggle]')
        ) {
          return;
        }
        if (el.matches('[data-mood-clock]')) {
          bell(s, 523.25, 0, 0.06);
          bell(s, 392, 0.75, 0.06);
          return;
        }
        if (el.closest('[data-mood-secret]')) return;
        pizz(s, 587.33, 0, 0.08);
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
          pizz(s, 587.33, 0, 0.08);
          break;
        case 'surface':
          agent('speak');
          paper(s);
          s.tone({ f0: 140, f1: 70, dur: 0.08, vol: 0.18, at: 0.12 });
          cadence(s, 0.3);
          later(() => root.dataset.moodAgent === 'speak' && agent('done'), 1400);
          break;
        case 'error':
          agent('');
          pizz(s, 220, 0, 0.08);
          pizz(s, 164.81, 0.18, 0.08);
          break;
        case 'open':
          creak(s, false);
          break;
        case 'close':
          tock(s, false);
          break;
      }
    });

    /* ---- room 2046: tell the wall a secret ---- */
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
            pizz(s, 220, 0, 0.06);
            input.focus();
            return;
          }
          // The secret only ever lives in this element, and only until it is sealed.
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
            sealed.textContent = 'Sealed in room 2046. Nobody will read it, not even me.';
            waltzBar();
          }, 1500 * step);
        },
        on,
      );
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      observers.forEach((o) => o.disconnect());
      offSound();
      bed?.stop(0.4);
      delete root.dataset.mood;
      delete root.dataset.moodAgent;
      delete root.dataset.moodInside;
      delete root.dataset.moodStairs;
      root.style.removeProperty('--mood-room');
      if (!root.getAttribute('style')) root.removeAttribute('style');
      sections.forEach((sec) => {
        delete sec.dataset.moodWait;
        delete sec.dataset.moodIn;
      });
      leaves.forEach((leaf) => {
        delete leaf.dataset.moodMonth;
        delete leaf.dataset.moodMon;
      });
      document.querySelectorAll('[data-mood-door]').forEach((d) => d.classList.remove('is-ajar'));
      if (readme) delete readme.dataset.moodOpen;
      stairs?.style.removeProperty('--mood-p');
      rains.forEach((r) => delete r.dataset.on);
      hole?.classList.remove('is-sealed', 'is-whisper');
      if (sealed) sealed.textContent = '';
    };
  },
};

export default reel;
