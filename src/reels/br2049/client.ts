/**
 * Reel 03 · Blade Runner 2049: the reel's behaviour (scroll scenes, motifs, sound).
 * Loaded on demand when the reel starts screening; everything registered
 * against ctx.signal is torn down when it stops.
 *
 *   - the HUD: the scrubber's playhead follows the scroll, the readout names
 *     the section (code, altitude, distance) and runs a timecode,
 *   - particles for the act backdrops (dust in the haze, rain, snow) and the
 *     flight; snow melts under the pointer,
 *   - the agent's baseline readout follows the playground's cues,
 *   - sound: a synth-brass swell per act, rain while in Los Angeles, a
 *     hologram blip + brass stab per composed surface, HUD ticks and clicks,
 *     a sub-bass hit on the title card.
 */
import type { ReelContext, ReelModule } from '../types';
import type { SoundKit } from '../sound';
import { actOf } from '../registry';

const CODES = ['LV-00', 'WL-01', 'LV-02', 'LV-03', 'LV-04', 'LA-05', 'LA-06', 'LA-07', 'SN-08'];
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
const ALTS = ['1200', '0980', '0640', '0520', '0410', '0260', '0180', '0090', '0000'];
const DSTS = ['00.0', '02.4', '09.8', '11.2', '12.6', '20.1', '21.0', '22.3', '24.9'];

/** A small seeded generator, so the particles fall the same way every visit. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ------------------------------------------------------------------ */
/* sound: the film's own cues, built on the shared kit                 */
/* ------------------------------------------------------------------ */

interface BrassOpts {
  at?: number;
  dur?: number;
  att?: number;
  vol?: number;
  bright?: number;
}

function synth(kit: SoundKit) {
  /** analog-synth brass: three detuned saws through an opening lowpass, into a long room */
  const brass = (f: number, o: BrassOpts = {}) => {
    const ac = kit.ctx();
    if (!ac) return;
    const t = ac.currentTime + (o.at ?? 0);
    const dur = o.dur ?? 1.6;
    const att = o.att ?? 0.35;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 2.4;
    lp.frequency.setValueAtTime(260, t);
    lp.frequency.exponentialRampToValueAtTime(o.bright ?? 2200, t + att);
    lp.frequency.exponentialRampToValueAtTime(620, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol ?? 0.05, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const send = ac.createGain();
    send.gain.value = 0.55;
    lp.connect(g);
    g.connect(kit.out());
    g.connect(send);
    send.connect(kit.reverb(2.6));
    for (const cents of [-8, 0, 7]) {
      const osc = ac.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.detune.value = cents;
      osc.connect(lp);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
  };
  const chord = (root: number, o: BrassOpts = {}) =>
    [1, 1.5, 2].forEach((m, i) => brass(root * m, { ...o, vol: (o.vol ?? 0.05) * (i ? 0.62 : 1) }));

  /** the signature: a sub-bass hit you feel more than hear */
  const sub = () => {
    kit.tone({ f0: 58, f1: 36, dur: 1.8, vol: 0.32 });
    kit.burst({ dur: 0.9, kind: 'lowpass', f: 140, q: 0.7, vol: 0.22 });
  };

  /** a hologram blip: a high square, gated four times */
  const holo = () => {
    const ac = kit.ctx();
    if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(2200 + Math.random() * 1800, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    [0, 0.014, 0.028, 0.042].forEach((d, i) =>
      g.gain.setValueAtTime(i % 2 ? 0.0001 : 0.018, t + d),
    );
    g.gain.setValueAtTime(0.0001, t + 0.056);
    o.connect(g);
    g.connect(kit.out());
    o.start(t);
    o.stop(t + 0.07);
  };

  /** a scanner sweep: band-passed noise rising */
  const scan = () => {
    const ac = kit.ctx();
    if (!ac) return;
    const t = ac.currentTime;
    const n = kit.noise(0.22);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(2600, t);
    bp.frequency.exponentialRampToValueAtTime(8200, t + 0.2);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    n.connect(bp);
    bp.connect(g);
    g.connect(kit.out());
    n.start(t);
  };

  /** the spinner's pass: a long band-passed rush and a falling hull tone */
  const fly = () => {
    kit.click();
    const ac = kit.ctx();
    if (!ac) return;
    const t = ac.currentTime;
    const n = kit.noise(0.8);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + 0.35);
    bp.frequency.exponentialRampToValueAtTime(500, t + 0.8);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    n.connect(bp);
    bp.connect(g);
    g.connect(kit.out());
    n.start(t);
    kit.tone({ f0: 190, f1: 92, dur: 0.75, vol: 0.06 });
  };

  /** a HUD tick, drier and higher than the shared one */
  const tick = () => kit.tone({ f0: 2200, f1: 1500, dur: 0.008, vol: 0.05 });

  const drawer = () => {
    kit.burst({ dur: 0.11, kind: 'lowpass', f: 900, q: 0.8, vol: 0.2 });
    kit.burst({ dur: 0.008, kind: 'highpass', f: 2600, vol: 0.3, at: 0.1 });
  };
  const knock = () => {
    kit.tone({ type: 'triangle', f0: 340, f1: 210, dur: 0.07, vol: 0.12 });
    kit.burst({ dur: 0.02, f: 1200, q: 2, vol: 0.12 });
  };
  let lastMelt = 0;
  const melt = () => {
    const now = performance.now();
    if (now - lastMelt < 90) return;
    lastMelt = now;
    const f = 2600 + Math.random() * 1400;
    kit.tone({ f0: f, f1: f * 0.72, dur: 0.3, vol: 0.025 });
  };
  const padSnow = () => {
    const ac = kit.ctx();
    if (!ac) return;
    const t = ac.currentTime;
    [220, 261.63, 329.63, 493.88].forEach((f, i) => {
      const o = ac.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 4;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.03, t + 1.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.6);
      const send = ac.createGain();
      send.gain.value = 0.7;
      o.connect(g);
      g.connect(kit.out());
      g.connect(send);
      send.connect(kit.reverb(2.6));
      o.start(t + i * 0.12);
      o.stop(t + 4.8);
    });
  };

  /** one swell per act: Wallace low and warm, Vegas wide and bright, LA darker, snow a pad */
  const act = (i: number) => {
    if (i === 1) chord(82.41, { dur: 2.2, vol: 0.04, att: 0.5 });
    else if (i === 2) chord(73.42, { dur: 2.4, vol: 0.045, att: 0.55, bright: 2600 });
    else if (i === 3) chord(87.31, { dur: 2.2, vol: 0.04, att: 0.45, bright: 1700 });
    else if (i === 4) padSnow();
    else chord(55, { dur: 2, vol: 0.035, att: 0.5 });
  };

  /** a composed surface: blip, scan, and a short brass stab pitched by its size */
  const ROOTS = [55, 61.74, 65.41, 73.42, 82.41, 87.31, 98, 110, 123.47, 130.81];
  const surface = (count: number) => {
    scan();
    holo();
    brass(ROOTS[count % ROOTS.length] * 2, { dur: 0.9, vol: 0.035, att: 0.08, bright: 3200 });
  };
  const resolve = () => {
    chord(110, { dur: 2.2, vol: 0.04, att: 0.3, bright: 2800, at: 0.5 });
    kit.tone({ type: 'triangle', f0: 1318.5, dur: 1.2, vol: 0.02, at: 0.75 });
  };
  const error = () => {
    kit.tone({ type: 'square', f0: 140, f1: 110, dur: 0.18, vol: 0.06 });
    kit.tone({ type: 'square', f0: 148, f1: 104, dur: 0.18, vol: 0.05, at: 0.02 });
  };

  /** rain on the windscreen while Los Angeles is on screen */
  const rain = (signal: AbortSignal) =>
    kit.bed((ac, out) => {
      const src = kit.noise(2.5);
      src.loop = true;
      const hp = ac.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 600;
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 5600;
      const g = ac.createGain();
      const t = ac.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.045, t + 1);
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
          src.stop(now + fade + 0.05);
        },
      };
    }, signal);

  return {
    brass,
    chord,
    sub,
    holo,
    fly,
    tick,
    drawer,
    knock,
    melt,
    act,
    surface,
    resolve,
    error,
    rain,
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
    fill('data-br-snow', (el) => {
      const size = (3 + rnd() * 5).toFixed(1);
      el.style.cssText = `left:${pct(rnd())};width:${size}px;height:${size}px;animation-duration:${(9 + rnd() * 10).toFixed(1)}s;animation-delay:-${(rnd() * 19).toFixed(1)}s`;
    });
  }

  return () => made.forEach((el) => el.remove());
}

/* ------------------------------------------------------------------ */

const reel: ReelModule = {
  mount(ctx: ReelContext) {
    const { root, signal, sound: kit } = ctx;
    const sfx = synth(kit);
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

    /* ---------- particles ---------- */
    cleanups.push(sprinkle(document.body, !ctx.reducedMotion));

    /* ---------- the readout and the playhead ---------- */
    const ro = (key: string) => document.querySelector<HTMLElement>(`[data-br-ro='${key}']`);
    const roName = ro('name');
    const roAlt = ro('alt');
    const roDst = ro('dst');
    const roTc = ro('tc');
    const nav = document.querySelector<HTMLElement>('.railnav');
    // The engine's section watcher also counts <html data-sec>, so at the very bottom it
    // can report a tenth section for a frame: clamp to the nine that exist.
    const section = () => Math.min(Math.max(ctx.section(), 0), CODES.length - 1);
    // the readout names the tick under the pointer (or focus), else the section in view
    let hovered = -1;
    let focused = -1;
    const readout = () => {
      const i = hovered >= 0 ? hovered : focused >= 0 ? focused : section();
      if (roName) roName.textContent = `${CODES[i]} · ${NAMES[i]}`;
      if (roAlt) roAlt.textContent = ALTS[i];
      if (roDst) roDst.textContent = DSTS[i];
    };
    readout();

    const secs = [...document.querySelectorAll<HTMLElement>('main [data-sec]')];
    const setInd = (v: number) => nav?.style.setProperty('--br-ind', v.toFixed(4));
    const playhead = () => {
      if (!secs.length) return;
      const probe = window.innerHeight * 0.4;
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
      setInd((Math.min(pos, secs.length - 1) + 0.5) / secs.length);
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

    // the timecode: seconds since the reel started screening (frames run in CSS)
    const started = performance.now();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timer = window.setInterval(() => {
      if (!roTc) return;
      const s = Math.floor((performance.now() - started) / 1000);
      roTc.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
    }, 1000);
    cleanups.push(() => window.clearInterval(timer));

    /* ---------- sections and acts ---------- */
    let act = actOf(ctx.reel, section());
    let rainBed: ReturnType<typeof sfx.rain> = null;
    const syncRain = () => {
      if (act === 3 && !rainBed && !kit.muted) rainBed = sfx.rain(signal);
      if (act !== 3 && rainBed) {
        rainBed.stop(0.7);
        rainBed = null;
      }
    };
    // one swell per act you arrive in; flying past acts (a far tick on the dock)
    // only sounds the one you land in
    let swell = 0;
    cleanups.push(() => window.clearTimeout(swell));
    ctx.onSection(() => {
      const i = section();
      if (ctx.reducedMotion) setInd((i + 0.5) / 9);
      readout();
      const next = actOf(ctx.reel, i);
      if (next !== act) {
        act = next;
        window.clearTimeout(swell);
        swell = window.setTimeout(() => sfx.act(act), 280);
      }
      syncRain();
    });
    const offSound = kit.onChange((muted) => {
      if (muted) rainBed = null;
      else syncRain();
    });
    cleanups.push(offSound);
    // the first gesture unlocks audio: start the rain if we're already in LA
    window.addEventListener('pointerdown', syncRain, { once: true, passive: true, signal });
    syncRain();

    /* ---------- the scrubber dock ---------- */
    const ticks = [...$$('.railnav a')];
    ticks.forEach((a, i) => {
      on(a, 'pointerenter', () => {
        hovered = i;
        readout();
        sfx.tick();
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
      on(a, 'click', () => sfx.fly());
    });
    on($$('.rail .contact a, .rail .snd, .boxoffice-open'), 'pointerenter', () => sfx.tick());
    on($$('#readme .startrow a'), 'pointerenter', () => sfx.tick());
    on($$('#readme .startrow a'), 'click', () => sfx.fly());

    /* ---------- motifs with a voice ---------- */
    on($$('#readme .lede em'), 'pointerenter', () => sfx.holo());
    on($$('#work .idx tr'), 'pointerenter', () => sfx.holo());
    on($$('#oss .repo'), 'pointerenter', () => sfx.tick());
    on($$('#log .logitem'), 'pointerenter', () => sfx.knock());
    on($$('#writing .wrow, #principles .tenet'), 'pointerenter', () => sfx.holo());
    on($$('#stack .toolcol li'), 'pointerenter', () => sfx.drawer());

    // snow melts where the pointer passes (only while the snow is falling)
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
          sfx.melt();
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
        kit.click();
        sfx.holo();
        wave('think');
      } else if (cue.name === 'surface') {
        sfx.surface(cue.count ?? 1);
        sfx.resolve();
        wave('speak');
      } else if (cue.name === 'error') {
        sfx.error();
        wave('idle');
      } else if (cue.name === 'open') {
        sfx.fly();
        sfx.chord(82.41, { dur: 1.8, vol: 0.03, att: 0.4 });
      } else if (cue.name === 'close') {
        kit.drop();
      }
    });

    return () => cleanups.forEach((fn) => fn());
  },

  titleSound(ctx) {
    const sfx = synth(ctx.sound);
    sfx.sub();
    sfx.chord(55, { dur: 2.6, vol: 0.045, att: 0.6 });
  },
};

export default reel;
