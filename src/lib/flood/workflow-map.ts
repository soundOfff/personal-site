/**
 * The workflow map. The rooms sit on one rail inside a dithered halo, return lanes run from
 * Review back to earlier rooms, and a ✳ walks the route with an amber trail behind it.
 *
 * `plan()` turns the rendered room boxes into cells once per layout and touches no DOM. The walk
 * is a function of one clock over the plan's steps, so pausing only stops the clock.
 */
import { GLYPH, PALETTE, haloTone, hash, jitter, noise, size, tones, type Tone } from './pixels';
import { reducedMotion } from './scroll';

const CELL = 20;
/** Time to walk one cell, in ms. */
const HOP = 42;
const FLOOD_MS = 900;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** A box in px, relative to the map. */
interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Layout {
  width: number;
  height: number;
  rooms: Box[];
  /** The room every lane leaves from. */
  from: number;
  /** Each lane's target room and the width of its label in px. */
  lanes: { to: number; label: number }[];
}

interface Step {
  cell: number;
  /** The lane this cell is on, or -1 on the rail. */
  lane: number;
  /** The room the walk stops at on this cell, or -1. */
  stop: number;
  /** When the walk leaves this cell, in ms from the start of the tour. */
  end: number;
}

interface Plan {
  cols: number;
  rows: number;
  /** Halo tone per cell, -1 for paper. */
  tone: Int8Array;
  /** 0..1, when the opening flood reaches each cell. */
  reveal: Float32Array;
  /** Cells under a lane label, never drawn. */
  hidden: Uint8Array;
  rail: number[];
  lanes: number[][];
  /** Where each lane label goes, in px. */
  labels: { left: number; top: number }[];
  /** One cycle per lane: along the rail to the lane, back through it, then on to the last room. */
  steps: Step[];
  cycles: number[];
  total: number;
}

function plan(layout: Layout, seed: number): Plan {
  const cols = Math.ceil(layout.width / CELL);
  const rows = Math.ceil(layout.height / CELL);
  const n = cols * rows;
  const carved = new Uint8Array(n);
  const hidden = new Uint8Array(n);
  const carve = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < cols && y < rows) carved[y * cols + x] = 1;
  };

  const boxes = layout.rooms.map((r) => ({
    x0: Math.floor(r.left / CELL) - 1,
    x1: Math.ceil(r.right / CELL),
    y0: Math.floor(r.top / CELL) - 1,
    y1: Math.ceil(r.bottom / CELL),
  }));
  for (const b of boxes) {
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) carve(x, y);
  }

  // u runs along the rail and v across it: x and y when the rooms sit in a row, swapped when they stack.
  const vertical = boxes[1].y0 > boxes[0].y1;
  const at = (u: number, v: number) => {
    const [x, y] = vertical ? [v, u] : [u, v];
    return x >= 0 && y >= 0 && x < cols && y < rows ? y * cols + x : -1;
  };
  const rings = boxes.map((b) =>
    vertical
      ? { u0: b.y0, u1: b.y1, v0: b.x0, v1: b.x1 }
      : { u0: b.x0, u1: b.x1, v0: b.y0, v1: b.y1 },
  );
  type Ring = (typeof rings)[number];
  const mid = (r: Ring) => Math.round((r.u0 + r.u1) / 2);

  /** Cells along straight runs between points, u first. */
  const walk = (points: [number, number][]) => {
    const cells: number[] = [];
    const push = (i: number) => i >= 0 && cells[cells.length - 1] !== i && cells.push(i);
    let [u, v] = points[0];
    for (const [tu, tv] of points.slice(1)) {
      while (u !== tu || v !== tv) {
        push(at(u, v));
        if (u !== tu) u += Math.sign(tu - u);
        else v += Math.sign(tv - v);
      }
    }
    push(at(u, v));
    return cells;
  };

  const railV = rings[0].v0;
  const outer = Math.max(...rings.map((r) => r.v1));
  const laneV = (k: number) => outer + 2 + 2 * k;
  const stops = rings.map((r) => [r.u0, railV] as [number, number]);
  const legs = stops.slice(1).map((stop, i) => walk([stops[i], stop]));
  const from = rings[layout.from];
  const rail = walk([stops[0], stops[stops.length - 1]]);
  const lanes = layout.lanes.map(({ to }, k) => {
    const target = rings[to];
    const exit = mid(from) + 2 * k;
    return walk([
      stops[layout.from],
      [from.u0, from.v1],
      [exit, from.v1],
      [exit, laneV(k)],
      [mid(target), laneV(k)],
      [mid(target), target.v1],
      [target.u0, target.v1],
      [target.u0, railV],
    ]);
  });
  for (const i of [rail, ...lanes].flat()) carved[i] = 1;

  // In a row a label sits on its lane between the two rooms. Stacked, it sits in the gap under
  // the target room, left of its lane.
  const labels = layout.lanes.map(({ to, label }, k) => {
    const target = rings[to];
    const w = Math.ceil(label / CELL);
    const x = vertical ? laneV(k) - w - 1 : Math.round((mid(from) + mid(target)) / 2 - w / 2);
    const y = vertical ? target.u1 + 2 : laneV(k);
    for (let cx = x; cx <= (vertical ? laneV(k) - 1 : x + w - 1); cx++) {
      carve(cx, y);
      if (cx >= 0 && cx < x + w && y >= 0 && y < rows) hidden[y * cols + cx] = 1;
    }
    return { left: x * CELL, top: y * CELL };
  });

  // Chebyshev distance from the paper the walk uses.
  const dist = new Int32Array(n).fill(-1);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  let top = rows;
  let bottom = 0;
  for (let i = 0; i < n; i++) {
    if (!carved[i]) continue;
    dist[i] = 0;
    queue[tail++] = i;
    top = Math.min(top, (i / cols) | 0);
    bottom = Math.max(bottom, (i / cols) | 0);
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % cols;
    const y = (i / cols) | 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || dist[ny * cols + nx] >= 0) continue;
        dist[ny * cols + nx] = dist[i] + 1;
        queue[tail++] = ny * cols + nx;
      }
    }
  }

  // The halo stays thin above the rooms (the heading), beyond the lanes and below (the status
  // line), and fades out at the page edges, so the map never becomes a band.
  const tone = new Int8Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    if (dist[i] <= 0) continue;
    const x = i % cols;
    const y = (i / cols) | 0;
    let e = dist[i] - 0.5;
    if ((vertical ? x : y) > outer) e *= 2.2;
    if (y < top) e *= 1.6;
    else if (y > bottom) e *= 2.2;
    const side = Math.min(x, cols - 1 - x);
    if (side < 2) e += (2 - side) * 2;
    tone[i] = haloTone(e, jitter(seed, x, y));
  }

  // The flood opens from the first room in blobs.
  const field = noise(cols, rows, seed, 3);
  const [sx, sy] = vertical ? [stops[0][1], stops[0][0]] : stops[0];
  const reveal = new Float32Array(n);
  let far = 1;
  for (let i = 0; i < n; i++) {
    reveal[i] = Math.abs((i % cols) - sx) + Math.abs(((i / cols) | 0) - sy) + field[i] * 6;
    far = Math.max(far, reveal[i]);
  }
  for (let i = 0; i < n; i++) reveal[i] /= far;

  const steps: Step[] = [];
  const cycles: number[] = [];
  let t = 0;
  const go = (cells: number[], lane: number, stop: number, hold: number) =>
    cells.forEach((cell, k) => {
      const arrives = k === cells.length - 1;
      t += arrives ? hold : HOP;
      steps.push({ cell, lane, stop: arrives ? stop : -1, end: t });
    });
  const last = stops.length - 1;
  layout.lanes.forEach(({ to }, k) => {
    cycles.push(steps.length);
    go([at(...stops[0])], -1, 0, 1500);
    for (let i = 1; i <= layout.from; i++) go(legs[i - 1].slice(1), -1, i, 1300);
    go(lanes[k].slice(1, -1), k, -1, HOP);
    go(legs[to - 1].slice(-1), -1, to, 1100);
    for (let i = to + 1; i <= last; i++) go(legs[i - 1].slice(1), -1, i, i === last ? 2200 : 1100);
  });

  return { cols, rows, tone, reveal, hidden, rail, lanes, labels, steps, cycles, total: t };
}

/** The step the walk is on at time `t` of the tour. */
function stepAt(p: Plan, t: number) {
  let lo = 0;
  let hi = p.steps.length - 1;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (p.steps[m].end > t) hi = m;
    else lo = m + 1;
  }
  return lo;
}

/** `k` is the current step, or -1 to show the whole route at rest. */
function paint(ctx: CanvasRenderingContext2D, fills: Tone[], p: Plan, flood: number, k: number) {
  ctx.clearRect(0, 0, p.cols * CELL, p.rows * CELL);
  for (let i = 0; i < p.tone.length; i++) {
    if (p.tone[i] < 0 || p.reveal[i] > flood) continue;
    ctx.fillStyle = fills[p.tone[i]];
    ctx.fillRect((i % p.cols) * CELL, ((i / p.cols) | 0) * CELL, CELL, CELL);
  }
  if (flood < 1) return;

  // The walked cells of the current cycle, each with its lane. The rail wins where they meet.
  const lit = new Map<number, number>();
  if (k < 0) {
    p.lanes.forEach((cells, lane) => cells.forEach((i) => lit.set(i, lane)));
    p.rail.forEach((i) => lit.set(i, -1));
  } else {
    const start = p.cycles.findLast((s) => s <= k) ?? 0;
    for (let s = start; s <= k; s++) {
      const { cell, lane } = p.steps[s];
      if (!lit.has(cell) || lane < 0) lit.set(cell, lane);
    }
  }
  const dot = (i: number, inset: number, color: string) => {
    if (p.hidden[i]) return;
    ctx.fillStyle = color;
    const x = (i % p.cols) * CELL + inset;
    const y = ((i / p.cols) | 0) * CELL + inset;
    ctx.fillRect(x, y, CELL - inset * 2, CELL - inset * 2);
  };
  for (const i of [...p.lanes.flat(), ...p.rail]) if (!lit.has(i)) dot(i, 8, PALETTE.line);
  lit.forEach((lane, i) => dot(i, 5, lane < 0 ? PALETTE.amber : PALETTE.blue));

  const head = k < 0 ? p.rail[p.rail.length - 1] : p.steps[k].cell;
  if (p.hidden[head]) return;
  const x = (head % p.cols) * CELL;
  const y = ((head / p.cols) | 0) * CELL;
  ctx.fillStyle = PALETTE.amber;
  ctx.fillRect(x, y, CELL, CELL);
  ctx.fillStyle = PALETTE.ink;
  GLYPH.forEach((row, gy) =>
    [...row].forEach(
      (bit, gx) => bit === '1' && ctx.fillRect(x + 3 + gx * 2, y + 3 + gy * 2, 2, 2),
    ),
  );
}

export function initWorkflowMap() {
  const map = document.querySelector<HTMLElement>('[data-map]');
  if (!map) return;
  const section = map.closest('section')!;
  const canvas = map.querySelector('canvas')!;
  const rooms = [...map.querySelectorAll<HTMLElement>('[data-stage]')];
  const lanes = map.querySelector<HTMLElement>('[data-from]')!;
  const labels = [...lanes.querySelectorAll<HTMLElement>('[data-to]')];
  const status = section.querySelector<HTMLElement>('[data-status]')!;
  const toggle = section.querySelector<HTMLButtonElement>('[data-toggle]')!;
  const rest = status.textContent ?? '';
  const room = (stage: string | undefined) => rooms.findIndex((r) => r.dataset.stage === stage);
  const seed = hash('workflow');
  const still = () => reducedMotion.matches;

  let world: Plan | undefined;
  let ctx: CanvasRenderingContext2D;
  let fills: Tone[] = [];
  let visible = false;
  let paused = false;
  let revealAt = -1;
  let clock = 0;
  let last = 0;
  let frame = 0;
  let shown = -2;

  function layout() {
    const box = map!.getBoundingClientRect();
    if (!box.width) return;
    const relative = (el: Element): Box => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - box.left,
        right: r.right - box.left,
        top: r.top - box.top,
        bottom: r.bottom - box.top,
      };
    };
    world = plan(
      {
        width: box.width,
        height: box.height,
        rooms: rooms.map(relative),
        from: room(lanes.dataset.from),
        lanes: labels.map((label) => ({ to: room(label.dataset.to), label: label.offsetWidth })),
      },
      seed,
    );
    world.labels.forEach(({ left, top }, k) =>
      Object.assign(labels[k].style, { left: `${left}px`, top: `${top}px`, visibility: 'visible' }),
    );
    ctx = size(canvas, box.width, box.height);
    fills = tones(ctx);
    shown = -2;
    draw();
  }

  function draw(now = performance.now()) {
    if (!world) return;
    const flood = still() ? 1 : revealAt < 0 ? 0 : clamp((now - revealAt) / FLOOD_MS);
    paint(ctx, fills, world, flood, still() ? -1 : stepAt(world, clock % world.total));
  }

  function present(k: number) {
    if (k === shown || !world) return;
    shown = k;
    const step = k < 0 ? null : world.steps[k];
    const here = step ? step.stop : -1;
    rooms.forEach((r, i) => r.classList.toggle('is-here', i === here));
    if (!step) status.textContent = rest;
    else if (step.lane >= 0) status.textContent = labels[step.lane].dataset.line!;
    else if (here >= 0) status.textContent = rooms[here].dataset.line!;
  }

  function tick(now: number) {
    frame = 0;
    if (!world || !visible || document.hidden || still()) return;
    if (revealAt < 0) revealAt = now;
    const flooding = now - revealAt < FLOOD_MS;
    if (!flooding && !paused) clock += Math.min(100, now - (last || now));
    last = now;
    const k = flooding ? -2 : stepAt(world, clock % world.total);
    if (flooding || k !== shown) {
      draw(now);
      if (!flooding) present(k);
    }
    if (flooding || !paused) frame = requestAnimationFrame(tick);
  }

  function resume() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    map!.classList.toggle('is-walking', visible && !document.hidden && !still() && !paused);
    if (still()) {
      draw();
      present(-1);
    } else if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.textContent = paused ? 'Play' : 'Pause';
    resume();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    resume();
  }).observe(map);
  document.addEventListener('visibilitychange', resume);
  reducedMotion.addEventListener('change', () => {
    shown = -2;
    resume();
  });
  new ResizeObserver(() => {
    layout();
    resume();
  }).observe(map);
  void document.fonts.ready.then(() => {
    layout();
    resume();
  });
}
