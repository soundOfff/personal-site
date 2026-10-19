/**
 * Reel 04 · The Grand Budapest Hotel: the reel's behaviour (scroll scenes, motifs, sound).
 * Loaded on demand when the reel starts screening; everything registered
 * against ctx.signal is torn down when it stops.
 *
 *   - the key rack: a brass tink per key, a key-ring jingle and a whip pan
 *     (pastel smear, stereo whoosh) on every in-page jump
 *   - each era change: a projector clunk and a cimbalom triad
 *   - the diorama: windows that light on hover (CSS) and twinkle while in view
 *   - telegrams stamp in as they scroll into view, with a postmark thump
 *   - the playground: a switchboard relay (html[data-gb-relay]) and the
 *     desk bell, box thud, paper rustle, cimbalom pluck and music box
 *   - the registration card's clock, and the service bell
 *
 * Everything audible goes through ctx.sound, so it is silent while muted.
 */
import type { ReelContext, ReelModule } from '../types';

/** D major, for the cimbalom. */
const DMAJ = [293.66, 329.63, 369.99, 392, 440, 493.88, 554.37, 587.33, 659.25, 739.99];

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

  /** a hammered string: four inharmonic partials and the felt's click */
  const ham = (f: number, at = 0, vol = 0.07) => {
    (
      [
        [1, 1, 1.5],
        [2.01, 0.5, 0.9],
        [3.02, 0.28, 0.55],
        [4.13, 0.14, 0.3],
      ] as const
    ).forEach(([m, g, d]) => s.tone({ f0: f * m, dur: d, vol: vol * g, at }));
    s.burst({ dur: 0.006, f: 3200, q: 1.2, vol: vol * 1.4, at });
  };

  const tink = (at = 0) => {
    const f = 3600 + Math.random() * 1400;
    s.tone({ f0: f, dur: 0.08, vol: 0.035, at });
    s.tone({ f0: f * 1.48, dur: 0.05, vol: 0.02, at });
  };

  const deskBell = (vol = 0.1) => {
    if (!gate('bell', 220)) return;
    (
      [
        [2093, 1, 1.9],
        [2093 * 2.76, 0.35, 1.0],
        [2093 * 5.4, 0.12, 0.45],
        [1046.5, 0.15, 0.8],
      ] as const
    ).forEach(([f, g, d]) => s.tone({ f0: f, dur: d, vol: vol * g }));
    s.burst({ dur: 0.008, kind: 'highpass', f: 4000, vol: 0.2 });
  };

  /** a whip pan: band-passed air swept up and back, panned left to right */
  const whoosh = () => {
    const ac = s.ctx();
    if (!ac) return;
    const t = ac.currentTime;
    const n = s.noise(0.42);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.exponentialRampToValueAtTime(3200, t + 0.18);
    bp.frequency.exponentialRampToValueAtTime(700, t + 0.42);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    n.connect(bp);
    bp.connect(g);
    let tail: AudioNode = g;
    if (typeof ac.createStereoPanner === 'function') {
      const p = ac.createStereoPanner();
      p.pan.setValueAtTime(-0.9, t);
      p.pan.linearRampToValueAtTime(0.9, t + 0.4);
      g.connect(p);
      tail = p;
    }
    tail.connect(s.out());
    n.start(t);
  };

  /** paper: a handful of bright noise grains */
  const paper = (at = 0) => {
    const ac = s.ctx();
    if (!ac) return;
    const t = ac.currentTime + at;
    const n = s.noise(0.16);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 4200;
    bp.Q.value = 0.7;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    for (let k = 0; k < 6; k++)
      g.gain.setValueAtTime(0.02 + Math.random() * 0.05, t + 0.005 + k * 0.022);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    n.connect(bp);
    bp.connect(g);
    g.connect(s.out());
    n.start(t);
  };

  /** a picture frame swinging on its wire */
  const creak = () => {
    const ac = s.ctx();
    if (!ac) return;
    const t = ac.currentTime;
    const n = s.noise(0.34);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 6;
    bp.frequency.setValueAtTime(380, t);
    bp.frequency.linearRampToValueAtTime(540, t + 0.3);
    const am = ac.createGain();
    am.gain.value = 0.5;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 34;
    const lg = ac.createGain();
    lg.gain.value = 0.5;
    lfo.connect(lg);
    lg.connect(am.gain);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    n.connect(bp);
    bp.connect(am);
    am.connect(g);
    g.connect(s.out());
    n.start(t);
    lfo.start(t);
    lfo.stop(t + 0.36);
  };

  return {
    gate,
    ham,
    tink: () => gate('tink', 45) && tink(),
    jingle: () => {
      tink(0);
      tink(0.05);
      tink(0.11);
    },
    deskBell,
    whoosh,
    paper,
    creak: () => gate('creak', 260) && creak(),
    tick: () => gate('tick', 40) && s.tick(),
    pen: () => gate('pen', 60) && s.burst({ dur: 0.07, f: 5200, q: 2.2, vol: 0.04 }),
    clack: () => {
      if (!gate('clack', 50)) return;
      s.burst({ dur: 0.014, f: 2400 + Math.random() * 1200, q: 1.3, vol: 0.12 });
      s.tone({ f0: 210, f1: 120, dur: 0.03, vol: 0.05 });
    },
    squish: () => {
      if (!gate('squish', 160)) return;
      s.tone({ f0: 260, f1: 120, dur: 0.18, vol: 0.11 });
      s.burst({ dur: 0.12, kind: 'lowpass', f: 900, vol: 0.07 });
    },
    /** the postmark coming down on a telegram */
    stamp: () => {
      if (!gate('stamp', 90)) return;
      s.tone({ f0: 150, f1: 60, dur: 0.09, vol: 0.2 });
      s.burst({ dur: 0.05, kind: 'lowpass', f: 700, vol: 0.24 });
      s.burst({ dur: 0.02, f: 2200, vol: 0.1, at: 0.01 });
    },
    /** projector clunk and a cimbalom triad, rooted per era */
    era: (e: number) => {
      if (!gate('era', 500)) return;
      s.tone({ f0: 95, f1: 45, dur: 0.16, vol: 0.22 });
      s.burst({ dur: 0.012, kind: 'highpass', f: 2200, vol: 0.25 });
      const r = [587.33, 523.25, 659.25][e] ?? 587.33;
      ham(r, 0.1, 0.05);
      ham(r * 1.26, 0.18, 0.045);
      ham(r * 1.5, 0.26, 0.04);
    },
    /** the windows coming on, one after another */
    glow: () => {
      if (!gate('glow', 900)) return;
      [2093, 2349.32, 2637.02, 3135.96, 3520].forEach((f, i) =>
        s.tone({ type: 'triangle', f0: f, dur: 0.3, vol: 0.02, at: i * 0.07 }),
      );
    },
    thud: () => s.tone({ f0: 120, f1: 70, dur: 0.09, vol: 0.15 }),
    relayBlip: () => {
      s.tone({ f0: 1320, dur: 0.035, vol: 0.028 });
      s.tone({ f0: 1760, dur: 0.03, vol: 0.018, at: 0.045 });
    },
    musicBox: () =>
      (
        [
          [1567.98, 0],
          [2093, 0.11],
          [2637.02, 0.22],
          [3135.96, 0.33],
          [2637.02, 0.5],
          [3135.96, 0.62],
        ] as const
      ).forEach(([f, at]) => {
        s.tone({ f0: f, dur: 0.9, vol: 0.05, at });
        s.tone({ type: 'triangle', f0: f * 2, dur: 0.22, vol: 0.012, at });
      }),
    /** a wrong number: two dull buzzes */
    engaged: () => {
      s.tone({ type: 'square', f0: 220, dur: 0.16, vol: 0.035 });
      s.tone({ type: 'square', f0: 220, dur: 0.16, vol: 0.035, at: 0.26 });
    },
    /** the title sting: a cimbalom run up D major, then the open fifth */
    flourish: () => {
      (
        [
          [587.33, 0],
          [739.99, 0.06],
          [880, 0.12],
          [1174.66, 0.18],
          [1479.98, 0.26],
        ] as const
      ).forEach(([f, at]) => ham(f, at, 0.055));
      ham(587.33, 0.44, 0.05);
      ham(880, 0.44, 0.04);
    },
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
      ['.metrics .m', v.tick],
      ['.startrow a, .a2-launch .btn, .a2-action', v.tick],
      ['.idx tbody tr', v.pen],
      ['.repo', v.creak],
      ['.logitem', v.clack],
      ['.wrow', v.tink],
      ['.tenet', v.tick],
      ['.toolcol', v.squish],
      ['.gb-bell, .contact a, .foot-links a', v.tick],
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

    /* ---------- each era change: clunk + triad ---------- */
    let era = Number(root.dataset.act ?? 0);
    ctx.onSection((i) => {
      // only the nine real sections move the era (see the engine note in the report)
      if (i < 0 || i >= ctx.reel.acts.flatMap((a) => a.sections).length) return;
      const next = Number(root.dataset.act ?? 0);
      if (next !== era) v.era(next);
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
          cueLater(() => v.ham(DMAJ[(cue.count ?? 0) % DMAJ.length], 0, 0.06), 720);
          cueLater(() => {
            relay('done');
            v.musicBox();
          }, 1250);
          cueLater(() => relay(''), 4200);
          break;
        }
        case 'error':
          quiet();
          relay('error');
          v.engaged();
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
    voice(ctx).flourish();
  },
};

export default reel;
