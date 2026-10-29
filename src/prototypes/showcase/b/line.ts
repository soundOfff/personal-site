import { reducedMotion } from '../../../lib/flood/scroll';

/** Station indices along the line. */
const FRAME = 0;
const DESIGN = 1;
const BUILD = 2;
const REVIEW = 3;
const DECIDE = 4;

type Flag = 'checks' | 'approach' | 'pass';
type Beat =
  | { kind: 'at'; s: number; dur: number; act: 'work' | 'idle' | 'return'; flag?: Flag }
  | { kind: 'belt'; from: number; to: number; dur: number }
  | { kind: 'loop'; to: typeof BUILD | typeof DESIGN; dur: number }
  | { kind: 'exit'; dur: number };

/** One ticket from brief to shipped. Review fails once, then the ticket loops back. */
function cycle(fail: 'checks' | 'approach'): Beat[] {
  const back = fail === 'checks' ? BUILD : DESIGN;
  return [
    { kind: 'at', s: FRAME, dur: 2.8, act: 'return' },
    { kind: 'belt', from: FRAME, to: DESIGN, dur: 1.1 },
    { kind: 'at', s: DESIGN, dur: 2.6, act: 'work' },
    { kind: 'belt', from: DESIGN, to: BUILD, dur: 1 },
    { kind: 'at', s: BUILD, dur: 2.6, act: 'work' },
    { kind: 'belt', from: BUILD, to: REVIEW, dur: 1 },
    { kind: 'at', s: REVIEW, dur: 2.6, act: 'work', flag: fail },
    { kind: 'loop', to: back, dur: 2.2 },
    ...(back === DESIGN
      ? ([
          { kind: 'at', s: DESIGN, dur: 1.8, act: 'work' },
          { kind: 'belt', from: DESIGN, to: BUILD, dur: 1 },
        ] as Beat[])
      : []),
    { kind: 'at', s: BUILD, dur: 1.8, act: 'work' },
    { kind: 'belt', from: BUILD, to: REVIEW, dur: 1 },
    { kind: 'at', s: REVIEW, dur: 2.4, act: 'work', flag: 'pass' },
    { kind: 'belt', from: REVIEW, to: DECIDE, dur: 1.1 },
    { kind: 'at', s: DECIDE, dur: 2.8, act: 'idle' },
    { kind: 'exit', dur: 0.9 },
  ];
}
const SCRIPT: Beat[] = [...cycle('checks'), ...cycle('approach')];
const starts = SCRIPT.reduce<number[]>((acc, b, i) => [...acc, i ? acc[i - 1] + SCRIPT[i - 1].dur : 0], []);
const TOTAL = starts.at(-1)! + SCRIPT.at(-1)!.dur;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

type Point = [number, number];
function along(points: Point[], u: number): Point {
  const lens = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let d = u * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const t = lens[i] ? clamp(d / lens[i], 0, 1) : 1;
      return [lerp(points[i][0], points[i + 1][0], t), lerp(points[i][1], points[i + 1][1], t)];
    }
    d -= lens[i];
  }
  return points.at(-1)!;
}

const X_ICON = '<svg viewBox="0 0 5 5" shape-rendering="crispEdges"><path d="M0 0h1v1H0zM4 0h1v1H4zM1 1h1v1H1zM3 1h1v1H3zM2 2h1v1H2zM1 3h1v1H1zM3 3h1v1H3zM0 4h1v1H0zM4 4h1v1H4z"/></svg>';
const CHECK_ICON = '<svg viewBox="0 0 5 5" shape-rendering="crispEdges"><path d="M4 0h1v1H4zM3 1h1v1H3zM2 2h1v1H2zM0 2h1v1H0zM1 3h1v1H1z"/></svg>';
const BUBBLE_ICON: Record<Flag, string> = { checks: X_ICON, approach: X_ICON, pass: CHECK_ICON };

interface Copy {
  say: string[];
  fail: Record<'checks' | 'approach', string>;
  loop: Record<'build' | 'design', string>;
  bubble: Record<Flag, string>;
}

export function initLine(root: HTMLElement) {
  const scene = root.querySelector<HTMLElement>('[data-scene]');
  if (!scene) return;
  const copy = JSON.parse(root.querySelector<HTMLElement>('#workflow')!.dataset.copy!) as Copy;
  const say = copy.say;
  const sayLoop = { [BUILD]: copy.loop.build, [DESIGN]: copy.loop.design };
  const run = scene.querySelector<HTMLElement>('[data-run]')!;
  const belt = run.querySelector<HTMLElement>('[data-belt]')!;
  const loops = {
    [BUILD]: run.querySelector<HTMLElement>('[data-loop="build"]')!,
    [DESIGN]: run.querySelector<HTMLElement>('[data-loop="design"]')!,
  };
  const stations = [...scene.querySelectorAll<HTMLButtonElement>('[data-station]')];
  const tiles = stations.map((s) => s.querySelector<HTMLElement>('.b-tile')!);
  const ticket = run.querySelector<HTMLElement>('[data-ticket]')!;
  const bubble = run.querySelector<HTMLElement>('[data-bubble]')!;
  const actors = [...run.querySelectorAll<HTMLElement>('[data-actor]')];
  const narration = scene.querySelector<HTMLElement>('[data-narration]')!;
  const pause = scene.querySelector<HTMLButtonElement>('[data-line-pause]')!;
  const details = [...root.querySelectorAll<HTMLElement>('[data-detail]')];

  // Geometry, measured from the laid-out stations so desktop and mobile share one script.
  let px = 4;
  let xs: number[] = [];
  let beltY = 0;
  let loopY: Record<number, number> = {};
  let loopX: Record<number, number> = {};
  function layout() {
    px = parseFloat(getComputedStyle(run).getPropertyValue('--px')) || 4;
    const box = run.getBoundingClientRect();
    xs = tiles.map((t) => {
      const r = t.getBoundingClientRect();
      return r.left + r.width / 2 - box.left;
    });
    beltY = belt.offsetTop;
    const below = belt.offsetTop + belt.offsetHeight;
    const off = 2 * px;
    loopY = { [BUILD]: below + 6 * px, [DESIGN]: below + 12 * px };
    loopX = { [BUILD]: xs[REVIEW] - off, [DESIGN]: xs[REVIEW] + off };
    for (const to of [BUILD, DESIGN] as const) {
      const el = loops[to];
      el.style.left = `${xs[to] - 1}px`;
      el.style.width = `${loopX[to] - xs[to] + 2}px`;
      el.style.top = `${below}px`;
      el.style.height = `${loopY[to] - below + 1}px`;
    }
    draw(frozen ? frozenAt : clock);
  }

  function beatAt(time: number) {
    const t = ((time % TOTAL) + TOTAL) % TOTAL;
    let i = starts.findIndex((s, k) => t >= s && t < s + SCRIPT[k].dur);
    if (i < 0) i = SCRIPT.length - 1;
    return { beat: SCRIPT[i], u: clamp((t - starts[i]) / SCRIPT[i].dur, 0, 1), local: t - starts[i] };
  }

  const shownFrame = new Map<Element, number>();
  function setFrame(el: Element, f: number) {
    if (shownFrame.get(el) === f) return;
    shownFrame.set(el, f);
    el.querySelectorAll<SVGGElement>('g[data-f]').forEach((g) => (g.style.display = Number(g.dataset.f) === f ? '' : 'none'));
  }
  const snap = (v: number) => Math.round(v / px) * px;
  function place(el: HTMLElement, x: number, bottom: number) {
    el.style.transform = `translate(${snap(x - el.offsetWidth / 2)}px, ${snap(bottom - el.offsetHeight)}px)`;
  }

  let liveStation = -1;
  let shownDetail = 0;
  let hovered: number | null = null;
  let pinned: number | null = null;
  function showDetail(k: number) {
    if (k === shownDetail) return;
    shownDetail = k;
    details.forEach((d, i) => {
      d.classList.toggle('is-on', i === k);
      d.inert = i !== k;
    });
  }
  function syncDetail() {
    showDetail(hovered ?? pinned ?? (frozen ? 0 : Math.max(0, liveStation)));
    stations.forEach((s, i) => s.classList.toggle('is-shown', i === shownDetail));
  }

  function draw(time: number) {
    if (!xs.length) return;
    const { beat, u, local } = beatAt(time);
    const ty = beltY - 3 * px;
    let tx = xs[FRAME];
    let tyy = ty;
    let ax = xs[DESIGN];
    let mode: 'idle' | 'walk' | 'work' = 'idle';
    let station = FRAME;
    let flag: Flag | null = null;
    let stamped = false;
    let scale = 1;
    let fade = 1;
    let text: string;

    if (beat.kind === 'at') {
      tx = xs[beat.s];
      station = beat.s;
      ax = clamp(tx, xs[DESIGN], xs[REVIEW]);
      mode = beat.act === 'work' ? 'work' : 'idle';
      if (beat.act === 'return') {
        const w = clamp(local / 1.8, 0, 1);
        ax = lerp(xs[REVIEW], xs[DESIGN], ease(w));
        mode = w < 1 ? 'walk' : 'idle';
        scale = clamp(Math.ceil((local / 0.5) * 4) / 4, 0.25, 1);
      }
      if (beat.flag && u > 0.45) flag = beat.flag;
      if (beat.s === DECIDE) stamped = u > 0.4;
      text = beat.flag && beat.flag !== 'pass' ? copy.fail[beat.flag] : say[beat.s];
    } else if (beat.kind === 'belt') {
      tx = lerp(xs[beat.from], xs[beat.to], ease(u));
      ax = clamp(tx, xs[DESIGN], xs[REVIEW]);
      mode = ax !== xs[DESIGN] && ax !== xs[REVIEW] ? 'walk' : 'idle';
      station = u < 0.5 ? beat.from : beat.to;
      text = say[station];
    } else if (beat.kind === 'loop') {
      const path: Point[] = [
        [xs[REVIEW], ty],
        [loopX[beat.to], ty],
        [loopX[beat.to], loopY[beat.to]],
        [xs[beat.to], loopY[beat.to]],
        [xs[beat.to], ty],
      ];
      [tx, tyy] = along(path, ease(u));
      ax = lerp(xs[REVIEW], xs[beat.to], ease(clamp(u * 1.15, 0, 1)));
      mode = ax !== xs[beat.to] ? 'walk' : 'idle';
      station = u < 0.8 ? REVIEW : beat.to;
      text = sayLoop[beat.to];
    } else {
      tx = xs[DECIDE] + u * 6 * px;
      ax = xs[REVIEW];
      stamped = true;
      fade = 1 - Math.ceil(u * 4) / 4;
      station = DECIDE;
      text = say[DECIDE];
    }

    const sec = time;
    const gap = 11 * px;
    actors.forEach((a, i) => {
      const f =
        mode === 'walk'
          ? Math.floor(sec * 7 + i) % 2
          : mode === 'work'
            ? Math.floor(sec * 9 + i * 0.5) % 2 ? 2 : 0
            : (sec + i * 1.3) % 3.4 < 0.16
              ? 3
              : 0;
      setFrame(a.querySelector('svg')!, f);
      place(a, ax + (i ? gap : -gap), beltY);
    });
    setFrame(ticket.querySelector('svg')!, stamped ? 1 : 0);
    ticket.style.opacity = String(fade);
    place(ticket, tx, tyy + (6 * px) / 2);
    ticket.style.scale = String(scale);

    bubble.hidden = !flag;
    if (flag) {
      if (bubble.dataset.flag !== flag) {
        bubble.innerHTML = BUBBLE_ICON[flag];
        bubble.append(copy.bubble[flag]);
        bubble.dataset.flag = flag;
      }
      place(bubble, ax, beltY - actors[0].offsetHeight - 10);
    }
    tiles[DECIDE].classList.toggle('is-stamping', beat.kind === 'at' && beat.s === DECIDE && u > 0.25 && u < 0.45);

    if (!frozen && narration.textContent !== text) narration.textContent = text;
    if (station !== liveStation) {
      liveStation = station;
      stations.forEach((s, i) => s.classList.toggle('is-live', !frozen && i === station));
      syncDetail();
    }
  }

  // The clock only runs while the line is on screen, the tab is visible and nobody paused it.
  let frozen = reducedMotion.matches;
  const frozenAt = starts[SCRIPT.length - 2] + SCRIPT[SCRIPT.length - 2].dur * 0.9;
  let clock = 0;
  let onScreen = false;
  let paused = false;
  let frameId = 0;
  let last = 0;
  function loop(now: number) {
    clock += last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    draw(clock);
    frameId = requestAnimationFrame(loop);
  }
  const resume = () => {
    frozen = reducedMotion.matches;
    scene.classList.toggle('is-frozen', frozen);
    const go = !frozen && onScreen && !paused && !document.hidden;
    if (go && !frameId) frameId = requestAnimationFrame(loop);
    if (!go && frameId) {
      cancelAnimationFrame(frameId);
      frameId = last = 0;
    }
    if (frozen) draw(frozenAt);
    syncDetail();
  };
  pause.addEventListener('click', () => {
    paused = !paused;
    pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? 'Play the line' : 'Pause the line';
    resume();
  });
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    resume();
  }).observe(scene);
  document.addEventListener('visibilitychange', resume);
  reducedMotion.addEventListener('change', resume);

  stations.forEach((s, k) => {
    s.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && ((hovered = k), syncDetail()));
    s.addEventListener('pointerleave', () => ((hovered = null), syncDetail()));
    s.addEventListener('focus', () => ((hovered = k), syncDetail()));
    s.addEventListener('blur', () => ((hovered = null), syncDetail()));
    s.addEventListener('click', () => {
      pinned = pinned === k ? null : k;
      stations.forEach((o, i) => o.setAttribute('aria-pressed', String(i === pinned)));
      syncDetail();
    });
    s.addEventListener('keydown', (event) => {
      const delta = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!delta) return;
      event.preventDefault();
      stations[clamp(k + delta, 0, stations.length - 1)].focus();
    });
  });

  new ResizeObserver(layout).observe(run);
  resume();
}
