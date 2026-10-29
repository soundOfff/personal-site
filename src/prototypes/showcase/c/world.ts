import { GLYPH, PALETTE, hash, patterns, random, size } from '../../../lib/flood/pixels';
import { reducedMotion } from '../../../lib/flood/scroll';

const CELL = 20;
const LINE = '#c8c6b8';
const still = () => reducedMotion.matches;
const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** Smooth value noise in 0..1, so the flood front moves in blobs instead of salt. */
function noise(cols: number, rows: number, seed: number, scale = 4) {
  const rand = random(seed);
  const nc = Math.ceil(cols / scale) + 2;
  const pts = Array.from({ length: nc * (Math.ceil(rows / scale) + 2) }, rand);
  const s = (t: number) => t * t * (3 - 2 * t);
  const out = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ix = Math.floor(x / scale);
      const iy = Math.floor(y / scale);
      const fx = s(x / scale - ix);
      const fy = s(y / scale - iy);
      const top = pts[iy * nc + ix] * (1 - fx) + pts[iy * nc + ix + 1] * fx;
      const bot = pts[(iy + 1) * nc + ix] * (1 - fx) + pts[(iy + 1) * nc + ix + 1] * fx;
      out[y * cols + x] = top * (1 - fy) + bot * fy;
    }
  }
  return out;
}

const jitter = (seed: number, x: number, y: number) => (hash(`${seed}:${x}:${y}`) % 1000) / 1000;

/**
 * One halo rule for the whole world. `e` is the distance in cells from the edge of a clearing to a
 * cell's centre, already stretched on the sides that must stay quiet. Solid at the wall, dithered
 * further out, and thinner with distance until the paper comes back. -1 means paper.
 */
function haloTone(e: number, j: number) {
  if (j > 1.15 - 0.3 * e) return -1;
  const t = Math.floor(e - 0.5 + j * 1.2);
  return t > 3 ? -1 : Math.max(0, t);
}

function tones(ctx: CanvasRenderingContext2D) {
  const [a, b] = patterns(ctx);
  return [PALETTE.blue, a, PALETTE.light, b] as (string | CanvasPattern)[];
}

/* ------------------------------------------------------------------ */
/* Workflow map: five clearings on one rail, two return lanes, an idea that walks it. */

interface Ring {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
}
type Leg = { cells: number[]; kind: 'main' | 'build' | 'design' };
interface Step {
  cell: number;
  kind: Leg['kind'];
  stop: number;
  end: number;
}
interface TourData {
  stages: { id: string; label: string; n: string; body: string }[];
  feedback: string;
}

function initMap(root: Element) {
  const map = root.querySelector<HTMLElement>('[data-map]');
  if (!map) return;
  const canvas = map.querySelector<HTMLCanvasElement>('.wf-canvas')!;
  const rooms = [...map.querySelectorAll<HTMLElement>('.wf-room')];
  const labels = {
    build: map.querySelector<HTMLElement>('[data-loop="build"]')!,
    design: map.querySelector<HTMLElement>('[data-loop="design"]')!,
  };
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const toggle = root.querySelector<HTMLButtonElement>('[data-toggle]')!;
  const data = JSON.parse(map.dataset.tour!) as TourData;
  const [toBuild, toDesign] = data.feedback.split(/(?<=\.)\s+/);
  const restText = status.textContent ?? '';
  const seed = hash('c-workflow');

  let ctx: CanvasRenderingContext2D;
  let palette: (string | CanvasPattern)[] = [];
  let cols = 0;
  let rows = 0;
  let tone = new Int8Array(0);
  let carved = new Uint8Array(0);
  let hidden = new Uint8Array(0);
  let reveal = new Float32Array(0);
  let mainCells: number[] = [];
  let loopCells: number[] = [];
  let steps: Step[] = [];
  let total = 0;
  let cycleStarts: number[] = [];

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
    ctx = size(canvas, box.width, box.height);
    palette = tones(ctx);
    cols = Math.ceil(box.width / CELL);
    rows = Math.ceil(box.height / CELL);
    const n = cols * rows;
    carved = new Uint8Array(n);
    hidden = new Uint8Array(n);

    const rect = (el: Element) => {
      const r = el.getBoundingClientRect();
      return {
        x0: Math.floor((r.left - box.left) / CELL) - 1,
        x1: Math.ceil((r.right - box.left) / CELL),
        y0: Math.floor((r.top - box.top) / CELL) - 1,
        y1: Math.ceil((r.bottom - box.top) / CELL),
      };
    };
    const boxes = rooms.map(rect);
    const vertical = boxes[1].y0 > boxes[0].y1;
    // u runs along the flow, v across it. Horizontal: u = x, v = y. Vertical: transposed.
    const at = (u: number, v: number) => {
      const x = vertical ? v : u;
      const y = vertical ? u : v;
      return x >= 0 && y >= 0 && x < cols && y < rows ? y * cols + x : -1;
    };
    const ring: Ring[] = boxes.map((b) =>
      vertical
        ? { u0: b.y0, u1: b.y1, v0: b.x0, v1: b.x1 }
        : { u0: b.x0, u1: b.x1, v0: b.y0, v1: b.y1 },
    );
    for (const b of boxes) {
      for (let y = b.y0; y <= b.y1; y++)
        for (let x = b.x0; x <= b.x1; x++) if (x >= 0 && y >= 0 && x < cols && y < rows) carved[y * cols + x] = 1;
    }

    const walk = (points: [number, number][]) => {
      const cells: number[] = [];
      for (let k = 0; k < points.length - 1; k++) {
        let [u, v] = points[k];
        const [tu, tv] = points[k + 1];
        while (u !== tu || v !== tv) {
          const i = at(u, v);
          if (i >= 0 && cells[cells.length - 1] !== i) cells.push(i);
          if (u !== tu) u += Math.sign(tu - u);
          else v += Math.sign(tv - v);
        }
      }
      const end = at(...points[points.length - 1]);
      if (end >= 0) cells.push(end);
      return cells;
    };

    const v0 = ring[0].v0;
    const V1 = Math.max(...ring.map((r) => r.v1));
    const mid = (r: Ring) => Math.round((r.u0 + r.u1) / 2);
    const [, design, build, review] = ring;
    const lane1 = V1 + 2;
    const lane2 = V1 + 4;
    const stops = ring.map((r) => [r.u0, v0] as [number, number]);
    const legs = ring.slice(1).map((_, i) => walk([stops[i], stops[i + 1]]));
    const back = (to: Ring, lane: number, exit: number): number[] =>
      walk([
        stops[3],
        [review.u0, review.v1],
        [exit, review.v1],
        [exit, lane],
        [mid(to), lane],
        [mid(to), to.v1],
        [to.u0, to.v1],
        [to.u0, v0],
      ]);
    const loopBuild = back(build, lane1, mid(review));
    const loopDesign = back(design, lane2, mid(review) + 2);

    mainCells = walk([stops[0], stops[4]]);
    loopCells = [...loopBuild, ...loopDesign];
    for (const i of [...mainCells, ...loopCells]) carved[i] = 1;

    // Lane labels sit on their lane (horizontal) or in the gap beside it (vertical).
    const place = (el: HTMLElement, lane: number, from: Ring, to: Ring, gapAfter: Ring) => {
      const w = Math.ceil(el.offsetWidth / CELL);
      let x: number;
      let y: number;
      if (!vertical) {
        x = Math.round((mid(from) + mid(to)) / 2 - w / 2);
        y = lane;
      } else {
        x = lane - w - 1;
        y = gapAfter.u1 + 2;
      }
      el.style.left = `${x * CELL}px`;
      el.style.top = `${y * CELL}px`;
      el.classList.add('placed');
      const x1 = vertical ? lane - 1 : x + w - 1;
      for (let cx = x; cx <= x1; cx++) {
        const i = y * cols + cx;
        if (cx < 0 || cx >= cols || y < 0 || y >= rows) continue;
        carved[i] = 1;
        if (cx < x + w) hidden[i] = 1;
      }
    };
    place(labels.build, lane1, review, build, build);
    place(labels.design, lane2, review, design, design);

    // Halo: broken walls between the rooms, thinning into paper. Quiet above (the heading),
    // quieter on the lane side and below (the status line), and gone at the page edges,
    // so the map never becomes a band.
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
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const j = ny * cols + nx;
          if (dist[j] >= 0) continue;
          dist[j] = dist[i] + 1;
          queue[tail++] = j;
        }
    }
    tone = new Int8Array(n).fill(-1);
    for (let i = 0; i < n; i++) {
      if (dist[i] <= 0) continue;
      const x = i % cols;
      const y = (i / cols) | 0;
      let e = dist[i] - 0.5;
      if ((vertical ? x : y) > V1) e *= 2.2;
      if (y < top) e *= 1.6;
      else if (y > bottom) e *= 2.2;
      const side = Math.min(x, cols - 1 - x);
      if (side < 2) e += (2 - side) * 2;
      tone[i] = haloTone(e, jitter(seed, x, y));
    }

    const field = noise(cols, rows, seed, 3);
    const [sx, sy] = vertical ? [stops[0][1], stops[0][0]] : stops[0];
    reveal = new Float32Array(n);
    let maxR = 1;
    for (let i = 0; i < n; i++) {
      reveal[i] = Math.abs((i % cols) - sx) + Math.abs(((i / cols) | 0) - sy) + field[i] * 6;
      maxR = Math.max(maxR, reveal[i]);
    }
    for (let i = 0; i < n; i++) reveal[i] /= maxR;

    // The tour: two cycles, one sent back by failed checks, one by a wrong approach.
    steps = [];
    cycleStarts = [];
    let t = 0;
    const HOP = 42;
    const push = (cells: number[], kind: Leg['kind'], hold: number, stop: number) => {
      cells.forEach((cell, k) => {
        const end = k === cells.length - 1;
        steps.push({ cell, kind, stop: end ? stop : -1, end: (t += end ? hold : HOP) });
      });
    };
    for (const loop of ['build', 'design'] as const) {
      cycleStarts.push(steps.length);
      push([at(...stops[0])], 'main', 1500, 0);
      push(legs[0].slice(1), 'main', 1300, 1);
      push(legs[1].slice(1), 'main', 1300, 2);
      push(legs[2].slice(1), 'main', 1300, 3);
      if (loop === 'build') {
        push(loopBuild.slice(1, -1), 'build', HOP, -1);
        push(legs[1].slice(legs[1].length - 1), 'main', 1100, 2);
      } else {
        push(loopDesign.slice(1, -1), 'design', HOP, -1);
        push(legs[0].slice(legs[0].length - 1), 'main', 1100, 1);
        push(legs[1].slice(1), 'main', 1100, 2);
      }
      push(legs[2].slice(1), 'main', 1100, 3);
      push(legs[3].slice(1), 'main', 2200, 4);
    }
    total = t;
    shown = -2;
    draw();
  }

  function index(t: number) {
    let lo = 0;
    let hi = steps.length - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (steps[m].end > t) hi = m;
      else lo = m + 1;
    }
    return lo;
  }

  function draw(now = performance.now()) {
    if (!ctx || !steps.length) return;
    const flood = still() ? 1 : revealAt < 0 ? 0 : clamp((now - revealAt) / 900);
    const k = still() ? -1 : index(clock % total);
    ctx.clearRect(0, 0, cols * CELL, rows * CELL);
    for (let i = 0; i < tone.length; i++) {
      if (tone[i] < 0 || reveal[i] > flood) continue;
      ctx.fillStyle = palette[tone[i]];
      ctx.fillRect((i % cols) * CELL, ((i / cols) | 0) * CELL, CELL, CELL);
    }
    if (flood < 1) return;

    // Lit cells in the current cycle; under reduced motion the whole route is lit.
    const lit = new Map<number, Leg['kind']>();
    if (k < 0) {
      mainCells.forEach((i) => lit.set(i, 'main'));
      loopCells.forEach((i) => lit.set(i, 'build'));
    } else {
      const start = [...cycleStarts].reverse().find((s) => s <= k) ?? 0;
      for (let s = start; s <= k; s++) if (!lit.has(steps[s].cell) || steps[s].kind === 'main') lit.set(steps[s].cell, steps[s].kind);
    }
    const dot = (i: number, inset: number, color: string) => {
      if (hidden[i]) return;
      ctx.fillStyle = color;
      ctx.fillRect((i % cols) * CELL + inset, ((i / cols) | 0) * CELL + inset, CELL - inset * 2, CELL - inset * 2);
    };
    for (const i of loopCells) if (!lit.has(i)) dot(i, 8, LINE);
    for (const i of mainCells) if (!lit.has(i)) dot(i, 8, LINE);
    lit.forEach((kind, i) => dot(i, 5, kind === 'main' ? PALETTE.amber : PALETTE.blue));

    // The idea: a small ✳ riding the head of the path.
    const cell = k < 0 ? mainCells[mainCells.length - 1] : steps[k].cell;
    if (!hidden[cell]) {
      const x = (cell % cols) * CELL;
      const y = ((cell / cols) | 0) * CELL;
      ctx.fillStyle = PALETTE.amber;
      ctx.fillRect(x, y, CELL, CELL);
      ctx.fillStyle = '#182126';
      GLYPH.forEach((row, gy) =>
        [...row].forEach((bit, gx) => bit === '1' && ctx.fillRect(x + 3 + gx * 2, y + 3 + gy * 2, 2, 2)),
      );
    }
  }

  function present(k: number) {
    if (k === shown) return;
    shown = k;
    const step = k < 0 ? null : steps[k];
    const here = step && step.stop >= 0 ? step.stop : -1;
    rooms.forEach((r, i) => r.classList.toggle('is-here', i === here));
    if (!step) {
      status.textContent = restText;
      return;
    }
    if (step.kind === 'build') status.textContent = `Review to Build. ${toBuild}`;
    else if (step.kind === 'design') status.textContent = `Review to Design. ${toDesign}`;
    else if (here >= 0) {
      const s = data.stages[here];
      status.textContent = `${s.n} ${s.label}. ${s.body}`;
    }
  }

  function tick(now: number) {
    frame = 0;
    if (!visible || document.hidden || still()) return;
    if (revealAt < 0) revealAt = now;
    const dt = Math.min(100, now - (last || now));
    last = now;
    const flooding = now - revealAt < 900;
    if (!flooding && !paused) clock += dt;
    const k = flooding ? -2 : index(clock % total);
    if (flooding || k !== shown) {
      draw(now);
      if (!flooding) present(k);
    }
    frame = requestAnimationFrame(tick);
  }

  function resume() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (still()) {
      draw();
      present(-1);
      return;
    }
    if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-pressed', String(paused));
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

/* ------------------------------------------------------------------ */
/* Product rooms: a halo around each demo's clearing; the flood drains to reveal it. */

const M = 4;

function initRoom(room: HTMLElement) {
  const video = room.querySelector('video')!;
  const stage = room.querySelector<HTMLElement>('.room-stage')!;
  const clearing = room.querySelector<HTMLElement>('.room-clear')!;
  const screen = room.querySelector<HTMLElement>('.room-screen')!;
  const halo = room.querySelector<HTMLCanvasElement>('.room-halo')!;
  const wipe = room.querySelector<HTMLCanvasElement>('.room-wipe')!;
  const heading = room.querySelector('h3')!;
  const capN = room.querySelector<HTMLElement>('.cap-n')!;
  const capL = room.querySelector<HTMLElement>('.cap-l')!;
  const beats = [...room.querySelectorAll<HTMLButtonElement>('[data-beat]')];
  const ticks = [...room.querySelectorAll<HTMLElement>('.room-track span')];
  const play = room.querySelector<HTMLButtonElement>('[data-play]')!;
  const big = room.querySelector<HTMLButtonElement>('[data-big]')!;
  const expand = room.querySelector<HTMLButtonElement>('[data-expand]')!;
  const name = heading.textContent!.trim();
  const seed = hash(name);
  const times = JSON.parse(room.dataset.chapters!) as number[];
  const duration = Number(room.dataset.duration);
  const labels = beats.map((b) => b.querySelector('.beat-l')!.textContent!);

  let ratio = 0;
  let hover = false;
  let focus = false;
  let userPaused = false;
  let userPlayed = false;
  let chapter = -1;
  let revealAt = -1;
  let frame = 0;

  function want() {
    if (ratio <= 0 || userPaused || document.hidden) return false;
    if (still()) return userPlayed;
    return ratio >= 0.5 || hover || focus || userPlayed;
  }
  function sync() {
    if (want()) {
      if (video.paused) video.play().catch(() => {});
    } else if (!video.paused) video.pause();
  }
  function start() {
    userPaused = false;
    userPlayed = true;
    sync();
  }

  function show(t: number) {
    let c = 0;
    times.forEach((s, i) => t + 0.05 >= s && (c = i));
    const k = Math.round((t / duration) * ticks.length);
    ticks.forEach((el, i) => el.classList.toggle('on', i <= k));
    if (c === chapter) return;
    chapter = c;
    capN.textContent = String(c + 1).padStart(2, '0');
    capL.textContent = labels[c];
    beats.forEach((b, i) => (i === c ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
  }

  // The clearing is the screen plus its control bar. The halo grid is snapped to its top-left corner.
  let hctx: CanvasRenderingContext2D;
  let wctx: CanvasRenderingContext2D;
  let hp: (string | CanvasPattern)[] = [];
  let wp: (string | CanvasPattern)[] = [];
  let shore: { x: number; y: number; tone: number; at: number }[] = [];
  let cover: { x: number; y: number; at: number }[] = [];

  function layout() {
    const W = clearing.offsetWidth;
    const H = clearing.offsetHeight;
    if (!W) return;
    const HW = W + 2 * M * CELL;
    const HH = H + 2 * M * CELL;
    Object.assign(halo.style, {
      left: `${clearing.offsetLeft - M * CELL}px`,
      top: `${clearing.offsetTop - M * CELL}px`,
      width: `${HW}px`,
      height: `${HH}px`,
    });
    hctx = size(halo, HW, HH);
    hp = tones(hctx);
    const s = screen.getBoundingClientRect();
    const h = heading.getBoundingClientRect();
    const copy = h.right <= s.left ? 'left' : h.left >= s.right ? 'right' : 'top';
    const cols = Math.ceil(HW / CELL);
    const rows = Math.ceil(HH / CELL);
    shore = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = (x - M + 0.5) * CELL;
        const cy = (y - M + 0.5) * CELL;
        let dx = Math.max(0, -cx, cx - W) / CELL;
        let dy = Math.max(0, -cy, cy - H) / CELL;
        if (!dx && !dy) continue;
        // Keep the side that faces the copy quiet, and the side under the bar quieter.
        if ((copy === 'left' && cx < 0) || (copy === 'right' && cx > W)) dx *= 1.9;
        if (copy === 'top' && cy < 0) dy *= 1.9;
        if (cy > H) dy *= 2.2;
        const e = Math.max(dx, dy);
        const j = jitter(seed, x, y);
        const tone = haloTone(e, j);
        if (tone >= 0) shore.push({ x: x * CELL, y: y * CELL, tone, at: e * 90 + j * 160 });
      }
    }

    const SW = screen.offsetWidth;
    const SH = screen.offsetHeight;
    wctx = size(wipe, SW, SH);
    wp = tones(wctx);
    cover = [];
    const wc = Math.ceil(SW / CELL);
    const wr = Math.ceil(SH / CELL);
    const wfield = noise(wc, wr, hash(name + 'wipe'), 3);
    const ox = wc * 0.42;
    const oy = wr * 0.55;
    const far = Math.hypot(wc, wr) / 2 + 3;
    for (let y = 0; y < wr; y++) {
      for (let x = 0; x < wc; x++) {
        const d = Math.abs(x - ox) + Math.abs(y - oy);
        cover.push({ x: x * CELL, y: y * CELL, at: 200 + (d / far) * 520 + wfield[y * wc + x] * 220 });
      }
    }
    paint(performance.now());
  }

  function paint(now: number) {
    if (!hctx) return;
    const t = still() ? Infinity : revealAt < 0 ? -1 : now - revealAt;
    hctx.clearRect(0, 0, halo.offsetWidth, halo.offsetHeight);
    for (const c of shore) {
      if (t < c.at) continue;
      // Each cell lands light and settles into its tone.
      const age = t - c.at;
      const tn = age < 120 ? Math.min(3, c.tone + 2) : age < 220 ? Math.min(3, c.tone + 1) : c.tone;
      hctx.fillStyle = hp[tn];
      hctx.fillRect(c.x, c.y, CELL, CELL);
    }
    wctx.clearRect(0, 0, wipe.width, wipe.height);
    if (t === Infinity) return;
    for (const c of cover) {
      const left = c.at - Math.max(0, t);
      if (left <= 0) continue;
      // Draining cells step blue, dither, light, dither, gone.
      const tn = left > 240 ? 0 : left > 160 ? 1 : left > 80 ? 2 : 3;
      wctx.fillStyle = wp[tn];
      wctx.fillRect(c.x, c.y, CELL, CELL);
    }
  }

  function animate(now: number) {
    frame = 0;
    paint(now);
    if (now - revealAt < 1100) frame = requestAnimationFrame(animate);
  }

  function setPlaying() {
    const on = !video.paused;
    room.classList.toggle('is-playing', on);
    play.setAttribute('aria-label', `${on ? 'Pause' : 'Play'} the ${name} demo`);
    big.hidden = on || userPlayed || !still();
  }

  video.addEventListener('timeupdate', () => show(video.currentTime));
  video.addEventListener('seeked', () => show(video.currentTime));
  video.addEventListener('play', setPlaying);
  video.addEventListener('pause', setPlaying);

  play.addEventListener('click', () => {
    if (video.paused) start();
    else {
      userPaused = true;
      userPlayed = false;
      sync();
    }
  });
  big.addEventListener('click', () => {
    start();
    play.focus();
  });
  expand.addEventListener('click', () => {
    const v = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
    else v.webkitEnterFullscreen?.();
    start();
  });
  document.addEventListener('fullscreenchange', () => {
    video.controls = document.fullscreenElement === video;
  });
  document.addEventListener('visibilitychange', sync);
  beats.forEach((b, i) =>
    b.addEventListener('click', () => {
      video.currentTime = times[i] + 0.05;
      show(times[i] + 0.05);
      start();
    }),
  );
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  room.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse' && fine.matches) (hover = true), sync();
  });
  room.addEventListener('pointerleave', () => ((hover = false), sync()));
  room.addEventListener('focusin', () => ((focus = true), sync()));
  room.addEventListener('focusout', (e) => {
    if (!room.contains(e.relatedTarget as Node)) (focus = false), sync();
  });

  new IntersectionObserver(
    ([entry]) => {
      ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
      if (ratio === 0) {
        userPlayed = false;
        hover = false;
      }
      sync();
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  ).observe(video);
  new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting || revealAt >= 0 || still()) return;
      revealAt = performance.now();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(animate);
    },
    { threshold: 0.3 },
  ).observe(stage);
  new ResizeObserver(layout).observe(stage);
  reducedMotion.addEventListener('change', () => {
    paint(performance.now());
    sync();
    setPlaying();
  });
  show(0);
  setPlaying();
}

export function initWorld(root: Element) {
  initMap(root);
  root.querySelectorAll<HTMLElement>('[data-room]').forEach(initRoom);
}
