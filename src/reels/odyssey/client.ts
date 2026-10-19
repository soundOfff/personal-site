/**
 * Reel 05 · 2001: A Space Odyssey: the reel's behaviour (scroll scenes, motifs, sound).
 * Loaded on demand when the reel starts screening; everything registered
 * against ctx.signal is torn down when it stops.
 *
 *   - the ship console: Rosario's time, and the page as the way from Earth to Jupiter
 *   - the red lens: tracks the cursor, and answers the playground's cues; its
 *     five lamps are the visitor's five questions a day
 *   - the hero: Sun, Earth and Moon parallax, a replay of the alignment
 *   - the match cut (bone → station) and the star gate, scrubbed by scroll
 *   - the logic memory hum, the monolith
 *   - sound (score.ts): the console's ticks, clunks and beeps as foley; harp
 *     under the transmission beeps and a waltz cadence when done; HAL winding
 *     down on a fault; the sunrise for the title, the replay and the credits;
 *     the station waltz at the match cut; the adagio in the centrifuge; the
 *     entr'acte's cluster at the intermission; a Ligeti choir at the monolith
 *     and in the room; the star gate's cluster
 */
import type { Bed } from '../sound';
import type { ReelContext, ReelModule } from '../types';
import {
  ACT_OF,
  actBeep,
  adagio,
  beep2,
  blip,
  breath,
  cadence,
  choir,
  clunk,
  dataTick,
  entracte,
  fault,
  gateBed,
  lensHum,
  logicHum,
  panelClunk,
  ring,
  sunrise,
  sweep,
  thunk,
  tick,
  transmission,
  waltz,
  whooshBack,
  type Hum,
} from './score';

type AgentState = 'idle' | 'listen' | 'think' | 'speak' | 'done' | 'error';
const AGENT_LABEL: Record<AgentState, string> = {
  idle: 'Standing by',
  listen: 'Go ahead',
  think: 'Computing',
  speak: 'Transmitting',
  done: 'Received',
  error: 'AE-35 unit fault',
};
/** the lamps beside the lens, one per question a visitor gets each day */
const LAMPS = 5;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/* ============================================================
   mount
   ============================================================ */
function mount(ctx: ReelContext): () => void {
  const { root, signal, reducedMotion } = ctx;
  const S = ctx.sound;
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

  /* ---------- the console clock: the time where Tomas is ---------- */
  const clockEl = $('[data-od-clock]');
  let rosario: Intl.DateTimeFormat | null = null;
  try {
    rosario = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Argentina/Cordoba',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    rosario = null;
  }
  const tickClock = () => {
    const now = rosario?.format(new Date());
    if (clockEl && now && clockEl.textContent !== now) clockEl.textContent = now;
  };
  tickClock();
  const clockId = window.setInterval(tickClock, 1000);

  /* ---------- the agent: lens state and the playground's cues ---------- */
  const stateEl = $('[data-od-state]');
  let panelOpen = false;
  let thinking: Hum | null = null;
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
    thinking?.stop(0.4);
    thinking = null;
  };
  setAgent('idle');
  /* The lamps follow the quota the playground prints once the server has
     counted ("4 of 5 left today"). Until then all five stay lit. */
  const readQuota = () => {
    const text = $('.a2-launch-count, .a2-quota')?.textContent ?? '';
    const m = /(\d+)\s*(?:of|\/)\s*(\d+)/.exec(text);
    if (m) root.dataset.odLeft = String(Math.min(LAMPS, Number(m[1])));
  };
  readQuota();
  ctx.onCue((cue) => {
    switch (cue.name) {
      case 'open':
        panelOpen = true;
        panelClunk(S);
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
        clunk(S);
        humOff();
        thinking = lensHum(S, signal);
        setAgent('think');
        break;
      case 'surface': {
        humOff();
        setAgent('speak');
        // transmission beeps over the harp, one per message, then the waltz cadence
        const n = Math.min(6, Math.max(1, cue.count ?? 1));
        transmission(S, n);
        cadence(S, n * 0.15 + 0.12);
        later(() => setAgent('done'), n * 150 + 500);
        settleLater(n * 150 + 3200);
        // the island renders the new count just after it cues
        later(readQuota, 60);
        break;
      }
      case 'error':
        humOff();
        fault(S);
        setAgent('error');
        settleLater(2600);
        later(readQuota, 60);
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
    if (a !== b) actBeep(S, i);
    else blip(S);
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
      sunrise(S, 1.3);
      return;
    }
    if (t?.closest?.('.railnav a, .startrow a, .contact a, .keybar a, .boxoffice-open, .idx a'))
      clunk(S);
  });

  /* ---------- hover: console ticks and the per-object voices ---------- */
  /** a metric's screen cuts out for a few frames and back, the way Discovery's displays change */
  const cutScreen = (m: Element) => {
    dataTick(S);
    if (reducedMotion || !(m instanceof HTMLElement) || 'odCut' in m.dataset) return;
    m.dataset.odCut = '';
    later(() => {
      delete m.dataset.odCut;
    }, 70);
  };
  /** the suit's breathing, at most once per breath */
  let lastBreath = 0;
  const breathe = () => {
    if (Date.now() - lastBreath < 2400 || !S.ctx()) return;
    lastBreath = Date.now();
    breath(S);
  };
  let monolith: Bed | null = null;
  const monolithOn = () => {
    if (!monolith) monolith = choir(S, signal);
  };
  const monolithOff = () => {
    monolith?.stop(1.4);
    monolith = null;
  };
  const indexIn = (el: Element) =>
    el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
  const HOVER: [string, (el: Element) => void][] = [
    ['.metrics .m', cutScreen],
    ['.lede em', () => sweep(S)],
    ['.idx tbody tr', (el) => beep2(S, indexIn(el))],
    ['.repo', breathe],
    ['.wrow, .tenet', () => pullModule()],
    [
      '.toolcol li',
      (el) => ring(S, el.closest('.toolcol') ? indexIn(el.closest('.toolcol')!) : 0, indexIn(el)),
    ],
    ['.od-monolith', monolithOn],
    [
      '.railnav a, .contact a, .boxoffice-open, .snd, .startrow a, .a2-action, .logitem, .a2-launch-row .btn, .od-replay, .keybar a, .foot a, .a2-lamp, .a2-send',
      () => tick(S),
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

  /* ---------- zones: the adagio, the logic memory hum, the gate, the intermission, the credits ---------- */
  const zones = new Set<string>();
  let redHum: Hum | null = null;
  let pulled = 0;
  let gate: ReturnType<typeof gateBed> = null;
  let gateP = 0;
  let entr: Bed | null = null;
  let jogged = false;
  let reprised = false;
  const pullModule = () => {
    thunk(S);
    pulled += 1;
    redHum?.detune(-Math.min(700, pulled * 60));
  };
  const syncBeds = () => {
    if (zones.has('red')) {
      if (!redHum) {
        redHum = logicHum(S, signal);
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
    if (zones.has('int')) entr ??= entracte(S, signal);
    else if (entr) {
      entr.stop(1.6);
      entr = null;
    }
  };
  const zoneOf = (el: Element): string | null => {
    const sec = el.getAttribute('data-sec');
    if (sec === '4') return 'centrifuge';
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
        // the adagio plays where the film plays it: Frank's run around the drum
        if (z === 'centrifuge' && e.isIntersecting && !jogged && S.ctx()) {
          jogged = true;
          adagio(S);
        }
        if (z === 'credits' && e.isIntersecting && !reprised) {
          reprised = true;
          sunrise(S, 1.3, 0.85);
        }
      }
      if (zones.has('red5') || zones.has('red6')) zones.add('red');
      else zones.delete('red');
      syncBeds();
    },
    { threshold: 0.2 },
  );
  document
    .querySelectorAll('[data-sec="4"], [data-sec="5"], [data-sec="6"], .od-sg, [data-od-zone]')
    .forEach((el) => zoneIO.observe(el));
  // muting stops every bed; unmuting brings back the ones still on screen
  const offSound = S.onChange((muted) => {
    if (muted) {
      redHum = null;
      gate = null;
      entr = null;
      monolith = null;
      thinking = null;
    } else syncBeds();
  });

  /* ---------- scroll: the way to Jupiter, the match cut, the star gate ---------- */
  const plot = $('.od-scr');
  const scenes = reducedMotion
    ? []
    : [...document.querySelectorAll<HTMLElement>('[data-od-scene]')];
  const live = new Set<HTMLElement>();
  let cut = false;
  let station: Bed | null = null;
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
      plot?.style.setProperty('--od-g', prog.toFixed(4));
    }
    for (const [el, r] of rects) {
      const p = clamp01(-r.top / Math.max(1, r.height - vh));
      el.style.setProperty('--p', p.toFixed(4));
      if (el.dataset.odScene === 'mc') {
        const now = p >= 0.5;
        if (now !== cut) {
          cut = now;
          el.classList.toggle('is-cut', now);
          station?.stop(0.3);
          station = null;
          if (now) {
            clunk(S);
            station = waltz(S, 0.12);
          } else whooshBack(S);
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
  const lenses = [...document.querySelectorAll<HTMLElement>('.od-lens')];
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
    [redHum, gate, entr, monolith, thinking, station].forEach((b) => b?.stop(0.3));
    delete root.dataset.odAgent;
    delete root.dataset.odLeft;
    document
      .querySelectorAll<HTMLElement>('[data-od-cut]')
      .forEach((el) => delete el.dataset.odCut);
    plot?.style.removeProperty('--od-g');
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
    sunrise(ctx.sound);
  },
};

export default reel;
