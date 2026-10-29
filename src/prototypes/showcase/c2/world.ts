import { PALETTE, hash, patterns, size } from '../../../lib/flood/pixels';
import { reducedMotion } from '../../../lib/flood/scroll';
import { CLAUDE, CODEX, ICONS, type Bitmap } from './sprites';

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const INK = '#182126';
const LINE = '#c8c6b8';

/* ------------------------------------------------------------------ */
/* Workflow map: five rooms on a corridor, two return loops, a walk.   */
/* ------------------------------------------------------------------ */

const ROOM = 1;
const MAIN = 2;
const LOOP_BUILD = 3;
const LOOP_DESIGN = 4;
const EXIT = 5;

interface Step {
  x: number;
  y: number;
  /** Time the walker reaches this cell. */
  at: number;
  /** Stage the walker is working in, or -1 between rooms. */
  stage: number;
  loop: boolean;
}

interface Geometry {
  c: number;
  cols: number;
  rows: number;
  h: number;
  b0: number;
  centers: number[];
  kind: Map<number, number>;
  roomOf: Map<number, number>;
  dist: Map<number, number>;
  maxDist: number;
  steps: Step[];
  total: number;
}

function buildGeometry(width: number): Geometry {
  const c = width < 700 ? 10 : 20;
  const R = c === 20 ? 5 : 3;
  const h = (R - 1) / 2;
  const rows = R + 5;
  const cols = Math.floor(width / c);
  const b0 = 1 + h;
  const LB = R + 2;
  const LD = R + 4;
  const centers = [0, 1, 2, 3, 4].map((i) => Math.floor((i * cols) / 5) + h);
  const kind = new Map<number, number>();
  const roomOf = new Map<number, number>();
  const key = (x: number, y: number) => y * cols + x;
  const put = (x: number, y: number, k: number) => {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return;
    if (kind.get(key(x, y)) === ROOM) return;
    kind.set(key(x, y), k);
  };

  centers.forEach((a, i) => {
    for (let x = a - h; x <= a + h; x++)
      for (let y = 1; y <= R; y++) {
        kind.set(key(x, y), ROOM);
        roomOf.set(key(x, y), i);
      }
  });
  for (let i = 0; i < 4; i++)
    for (let x = centers[i] + h + 1; x < centers[i + 1] - h; x++) put(x, b0, MAIN);
  for (let x = centers[4] + h + 1; x < cols; x++) put(x, b0, EXIT);
  const [, design, build, review] = centers;
  for (let y = R + 1; y <= LB; y++) {
    put(review - 1, y, LOOP_BUILD);
    put(build + 1, y, LOOP_BUILD);
  }
  for (let x = build + 1; x <= review - 1; x++) put(x, LB, LOOP_BUILD);
  for (let y = R + 1; y <= LD; y++) {
    put(review + 1, y, LOOP_DESIGN);
    put(design, y, LOOP_DESIGN);
  }
  for (let x = design; x <= review + 1; x++) put(x, LD, LOOP_DESIGN);

  // The flood starts in Frame, like the cover's flood starts at its seed.
  const dist = new Map<number, number>();
  const start = key(centers[0], b0);
  const queue = [start];
  dist.set(start, 0);
  let maxDist = 0;
  while (queue.length) {
    const i = queue.shift()!;
    const x = i % cols;
    const y = Math.floor(i / cols);
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]) {
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      const j = key(nx, ny);
      if (!kind.has(j) || dist.has(j)) continue;
      dist.set(j, dist.get(i)! + 1);
      maxDist = Math.max(maxDist, dist.get(j)!);
      queue.push(j);
    }
  }

  // The walk: Frame, Design, Build, Review, back to Build once, Review again, Decide, out.
  // The agents wait at each room's door, so they stay in view while that stage is lit.
  const STEP = 120;
  const DWELL = 1500;
  type Point = [number, number, number?, boolean?];
  const route: Point[] = [
    [centers[1], b0, 1],
    [centers[2], b0, 2],
    [centers[3], b0, 3],
    [review - 1, b0],
    [review - 1, LB, undefined, true],
    [build + 1, LB, undefined, true],
    [build + 1, b0, undefined, true],
    [centers[2], b0, 2],
    [centers[3], b0, 3],
    [centers[4], b0, 4],
    [cols + 4, b0],
  ];
  const steps: Step[] = [{ x: centers[0] + h + 1, y: b0, at: 0, stage: 0, loop: false }];
  const doors = new Map<number, number>([[0, 0]]);
  let outside = 0;
  for (const [tx, ty, dwellStage, isLoop] of route) {
    let { x, y } = steps[steps.length - 1];
    while (x !== tx || y !== ty) {
      if (x !== tx) x += Math.sign(tx - x);
      else y += Math.sign(ty - y);
      const inRoom = roomOf.has(key(x, y));
      if (!inRoom) outside = steps.length;
      steps.push({ x, y, at: 0, stage: 0, loop: !!isLoop && !inRoom });
    }
    if (dwellStage !== undefined) doors.set(outside, dwellStage);
  }
  let at = 0;
  let stage = 0;
  steps.forEach((step, i) => {
    stage = doors.get(i) ?? stage;
    step.stage = stage;
    step.at = at;
    at += STEP + (doors.has(i) ? DWELL : 0);
  });
  return { c, cols, rows, h, b0, centers, kind, roomOf, dist, maxDist, steps, total: at + 900 };
}

function stepAt(g: Geometry, t: number): number {
  if (t < 0) return -1;
  let lo = 0;
  for (let i = 0; i < g.steps.length; i++) if (g.steps[i].at <= t) lo = i;
  return lo;
}

function drawBitmap(
  ctx: CanvasRenderingContext2D,
  bitmap: Bitmap,
  left: number,
  top: number,
  px: number,
  color: string,
) {
  ctx.fillStyle = color;
  bitmap.forEach((row, y) =>
    [...row].forEach((bit, x) => bit === '1' && ctx.fillRect(left + x * px, top + y * px, px, px)),
  );
}

function initMap(section: HTMLElement) {
  const wrap = section.querySelector<HTMLElement>('.wf-map')!;
  const canvas = wrap.querySelector<HTMLCanvasElement>('canvas')!;
  const stages = [...section.querySelectorAll<HTMLElement>('[data-stage]')];
  const grid = section.querySelector<HTMLElement>('.wf-stages')!;
  const loopBuild = section.querySelector<HTMLElement>('[data-label="build"]')!;
  const loopDesign = section.querySelector<HTMLElement>('[data-label="design"]')!;
  const ship = section.querySelector<HTMLElement>('[data-label="ship"]')!;
  const toggle = section.querySelector<HTMLButtonElement>('.wf-toggle')!;

  let g = buildGeometry(wrap.clientWidth);
  let ctx: CanvasRenderingContext2D;
  let pats: CanvasPattern[];
  let visible = false;
  let paused = false;
  let hidden = document.hidden;
  let floodStart = -1;
  let clock = 0;
  let last = 0;
  let frame = 0;
  let hover = -1;
  let drawnKey = '';

  const still = () => reducedMotion.matches;

  function layout() {
    g = buildGeometry(wrap.clientWidth);
    ctx = size(canvas, g.cols * g.c, g.rows * g.c);
    canvas.style.width = `${g.cols * g.c}px`;
    canvas.style.height = `${g.rows * g.c}px`;
    pats = patterns(ctx);
    const lefts = g.centers.map((a) => (a - g.h) * g.c);
    if (g.c === 20) {
      const widths = lefts.map((l, i) => (i < 4 ? lefts[i + 1] - l : wrap.clientWidth - l));
      grid.style.gridTemplateColumns = widths.map((w) => `${w}px`).join(' ');
      grid.style.marginLeft = `${lefts[0]}px`;
    } else {
      grid.style.gridTemplateColumns = '';
      grid.style.marginLeft = '';
    }
    const R = 2 * g.h + 1;
    const [, design, build, review] = g.centers;
    // Each label sits inside its own loop.
    Object.assign(loopBuild.style, {
      left: `${(build + 2) * g.c}px`,
      top: `${(R + 1) * g.c}px`,
      width: `${(review - build - 3) * g.c}px`,
    });
    Object.assign(loopDesign.style, {
      left: `${(design + 1) * g.c}px`,
      top: `${(R + 3) * g.c}px`,
      width: `${(build - design) * g.c}px`,
    });
    Object.assign(ship.style, { top: `${(g.b0 - 1) * g.c - 6}px` });
    drawnKey = '';
    render();
  }

  function render() {
    const t = still() ? Infinity : clock;
    const flood = still() ? 1 : floodStart < 0 ? 0 : clamp((performance.now() - floodStart) / 1100);
    const parked = (x: number) => g.steps.findLastIndex((s) => s.x === x);
    const k = still() ? parked(g.cols - 5) : stepAt(g, t % g.total);
    const lag = still() ? parked(g.cols - 8) : k - 3;
    const walking = !still() && t % g.total < g.steps[g.steps.length - 1].at;
    const current = k >= 0 ? g.steps[k] : null;
    const active = hover >= 0 ? hover : still() ? -1 : (current?.stage ?? -1);
    const frameKey = `${flood}|${k}|${lag}|${active}|${hover}`;
    if (frameKey === drawnKey) return;
    drawnKey = frameKey;

    const { c, cols } = g;
    ctx.clearRect(0, 0, cols * c, g.rows * c);
    const cut = flood * (g.maxDist + 1);
    // Lit ring around the active room.
    if (active >= 0 && flood >= 1) {
      const a = g.centers[active];
      ctx.fillStyle = pats[1];
      for (let x = a - g.h - 1; x <= a + g.h + 1; x++)
        for (let y = 0; y <= 2 * g.h + 2; y++) {
          if (!g.kind.has(y * cols + x)) ctx.fillRect(x * c, y * c, c, c);
        }
    }
    for (const [i, kind] of g.kind) {
      if ((g.dist.get(i) ?? Infinity) > cut) continue;
      const x = (i % cols) * c;
      const y = Math.floor(i / cols) * c;
      ctx.fillStyle =
        kind === ROOM ? PALETTE.blue : kind === MAIN ? pats[0] : kind === EXIT ? pats[1] : PALETTE.light;
      if (kind === LOOP_BUILD || kind === LOOP_DESIGN) {
        // Return corridors are dashed: every other cell is a dither, so they read as the way back.
        const cx = i % cols;
        const cy = Math.floor(i / cols);
        ctx.fillStyle = (cx + cy) % 2 ? PALETTE.light : pats[1];
      }
      ctx.fillRect(x, y, c, c);
    }
    if (flood >= 1) {
      const px = g.c === 20 ? 5 : 3;
      g.centers.forEach((a, s) => {
        const side = 7 * px;
        const left = (a + 0.5) * c - side / 2;
        const top = (g.b0 + 0.5) * c - side / 2;
        drawBitmap(ctx, ICONS[s], left, top, px, PALETTE.paper);
      });
      // Amber: the shortest path the walk has covered so far, from Frame towards shipping.
      ctx.fillStyle = PALETTE.amber;
      const seen = new Set<number>();
      const upTo = still() ? g.steps.length - 1 : k;
      for (let s = 0; s <= upTo; s++) {
        const step = g.steps[s];
        if (step.loop || step.x >= cols) continue;
        const idx = step.y * cols + step.x;
        const kind = g.kind.get(idx);
        if ((kind !== MAIN && kind !== EXIT) || seen.has(idx)) continue;
        seen.add(idx);
        ctx.fillRect(step.x * c + c / 4, step.y * c + c / 4, c / 2, c / 2);
      }
      const px2 = c === 20 ? 4 : 2;
      const walker = (idx: number, sprite: readonly [Bitmap, Bitmap], color: string) => {
        if (idx < 0 || (!walking && !still())) return;
        const step = g.steps[idx];
        if (g.roomOf.has(step.y * cols + step.x) || step.x >= cols) return;
        const bitmap = sprite[idx % 2];
        const side = 10 * px2;
        const left = (step.x + 0.5) * c - side / 2;
        const top = (step.y + 1) * c - side - (c === 20 ? 4 : 2);
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ])
          drawBitmap(ctx, bitmap, left + dx * px2, top + dy * px2, px2, PALETTE.paper);
        drawBitmap(ctx, bitmap, left, top, px2, color);
      };
      walker(lag, CODEX, INK);
      walker(k, CLAUDE, PALETTE.blue);
    }

    stages.forEach((el, i) => el.classList.toggle('is-active', i === active));
    const inLoop = !!current?.loop && walking;
    loopBuild.classList.toggle('is-active', inLoop);
  }

  function tick(now: number) {
    frame = 0;
    const dt = Math.min(64, now - last);
    last = now;
    if (!paused) clock += dt;
    render();
    schedule();
  }

  function schedule() {
    if (frame || still() || !visible || hidden) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible && floodStart < 0) floodStart = performance.now();
      if (visible) schedule();
      else stop();
    },
    { threshold: 0.25 },
  ).observe(wrap);
  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    if (hidden) stop();
    else schedule();
  });
  new ResizeObserver(layout).observe(wrap);
  reducedMotion.addEventListener('change', () => {
    drawnKey = '';
    render();
    schedule();
  });

  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.querySelector('span')!.textContent = paused ? 'Resume the walk' : 'Pause the walk';
  });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    stages.forEach((el, i) => {
      el.addEventListener('pointerenter', () => {
        hover = i;
        render();
      });
      el.addEventListener('pointerleave', () => {
        hover = -1;
        render();
      });
    });
  }
  layout();
}

/* ------------------------------------------------------------------ */
/* Rooms: each demo sits in a clearing, revealed by a draining flood.  */
/* ------------------------------------------------------------------ */

function initRoom(room: HTMLElement, index: number) {
  const video = room.querySelector<HTMLVideoElement>('video')!;
  const screen = room.querySelector<HTMLElement>('.screen')!;
  const halo = room.querySelector<HTMLCanvasElement>('.halo')!;
  const wipe = room.querySelector<HTMLCanvasElement>('.wipe')!;
  const track = room.querySelector<HTMLCanvasElement>('.track')!;
  const chapters = [...room.querySelectorAll<HTMLButtonElement>('[data-t]')];
  const times = chapters.map((b) => Number(b.dataset.t));
  const now = room.querySelector<HTMLElement>('.cap-now')!;
  const toggle = room.querySelector<HTMLButtonElement>('.cap-toggle')!;
  const big = room.querySelector<HTMLButtonElement>('.play-big')!;
  const duration = Number(room.dataset.duration);
  const side = room.dataset.side === 'right' ? 1 : -1;
  const seed = hash(room.id);
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  let ratio = 0;
  let hovered = false;
  let focused = false;
  let userPaused = false;
  let userPlayed = false;
  let revealed = -1;
  let wipeFrame = 0;
  let chapter = -1;

  const still = () => reducedMotion.matches;
  const cell = () => (screen.clientWidth < 600 ? 10 : 20);

  function want() {
    if (userPaused) return false;
    if (still()) return userPlayed && ratio > 0;
    return ratio >= 0.5 || ((hovered || focused) && ratio > 0);
  }

  function sync() {
    if (want()) {
      if (video.paused) void video.play().catch(() => {});
    } else if (!video.paused) video.pause();
  }

  function label() {
    const playing = !video.paused;
    toggle.querySelector('span')!.textContent = playing ? 'Pause' : 'Play';
    toggle.dataset.state = playing ? 'playing' : 'paused';
    big.hidden = !(still() && video.paused && !userPlayed);
  }

  // Halo: cells hugging the screen, cobalt at the edge, fading to paper with distance.
  function drawHalo(progress = 1) {
    const c = cell();
    const M = 4;
    const w = screen.clientWidth;
    const h = screen.clientHeight;
    const W = w + 2 * M * c;
    const H = h + 2 * M * c;
    halo.style.width = `${W}px`;
    halo.style.height = `${H}px`;
    halo.style.left = `${-M * c}px`;
    halo.style.top = `${-M * c}px`;
    const ctx = size(halo, W, H);
    const pats = patterns(ctx);
    const tones = [PALETTE.blue, pats[0], PALETTE.light, pats[1]];
    const cols = Math.ceil(W / c);
    const rows = Math.ceil(H / c);
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const cx = x * c + c / 2 - M * c;
        const cy = y * c + c / 2 - M * c;
        let dx = Math.max(0, -cx, cx - w) / c;
        let dy = Math.max(0, -cy, cy - h) / c;
        // The caption sits below the screen, so the halo stays short there.
        if (cy > h) dy *= 2.2;
        // Keep the side that faces the copy quiet.
        if ((side < 0 && cx < 0) || (side > 0 && cx > w)) dx *= 1.9;
        const d = Math.max(dx, dy);
        if (d === 0) continue;
        const j = (hash(`${seed}:${x}:${y}`) % 1000) / 1000;
        if (d > progress * (M + 1)) continue;
        // Thins out with distance, so the edge dissolves into paper.
        if (j > 1.15 - 0.3 * d) continue;
        const tone = Math.floor(d - 0.5 + j * 1.2);
        if (tone > 3) continue;
        ctx.fillStyle = tones[Math.max(0, tone)];
        ctx.fillRect(x * c, y * c, c, c);
      }
  }

  // Wipe: cobalt cells over the screen drain from a seed in BFS-like order.
  function drawWipe(progress: number) {
    const c = cell();
    const w = screen.clientWidth;
    const h = screen.clientHeight;
    const ctx = size(wipe, w, h);
    if (progress >= 1) return;
    const pats = patterns(ctx);
    const cols = Math.ceil(w / c);
    const rows = Math.ceil(h / c);
    const seeds = [
      [0, rows - 1],
      [Math.floor(cols / 2), Math.floor(rows / 2)],
      [cols - 1, 0],
    ];
    const [sx, sy] = seeds[index % seeds.length];
    let max = 0;
    const field: number[] = [];
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const d = Math.abs(x - sx) + Math.abs(y - sy) + ((hash(`${seed}w${x}:${y}`) % 1000) / 1000) * 4;
        field.push(d);
        max = Math.max(max, d);
      }
    const front = progress * (max + 8);
    const tones = [pats[1], PALETTE.light, pats[0], PALETTE.blue];
    field.forEach((d, i) => {
      const ahead = d - front;
      if (ahead < 0) return;
      ctx.fillStyle = tones[Math.min(3, Math.floor(ahead / 2))];
      ctx.fillRect((i % cols) * c, Math.floor(i / cols) * c, c, c);
    });
  }

  function reveal() {
    if (revealed >= 0) return;
    if (still()) {
      revealed = 1;
      drawWipe(1);
      drawHalo(1);
      return;
    }
    const start = performance.now();
    revealed = 0;
    const step = (t: number) => {
      const p = clamp((t - start) / 1100);
      drawWipe(p);
      drawHalo(clamp(p * 1.4));
      if (p < 1) wipeFrame = requestAnimationFrame(step);
      else revealed = 1;
    };
    wipeFrame = requestAnimationFrame(step);
  }

  function drawTrack() {
    const w = track.clientWidth;
    const H = 14;
    const ctx = size(track, w, H);
    const unit = 10;
    const n = Math.max(1, Math.floor((w + 2) / unit));
    const t = video.currentTime;
    const played = Math.floor((t / duration) * n);
    const startCell = (s: number) => Math.floor((s / duration) * n);
    const curStart = startCell(times[Math.max(0, chapter)] ?? 0);
    const curEnd = chapter + 1 < times.length ? startCell(times[chapter + 1]) : n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle =
        i < played ? PALETTE.blue : i >= curStart && i < curEnd ? PALETTE.light : LINE;
      ctx.fillRect(i * unit, 3, unit - 2, 8);
    }
    ctx.fillStyle = INK;
    times.forEach((s) => ctx.fillRect(startCell(s) * unit - 2, 0, 2, H));
  }

  function update() {
    const t = video.currentTime;
    let next = 0;
    times.forEach((s, i) => t + 0.05 >= s && (next = i));
    if (next !== chapter) {
      chapter = next;
      chapters.forEach((b, i) =>
        i === chapter ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current'),
      );
      now.textContent = `${String(chapter + 1).padStart(2, '0')} ${chapters[chapter].dataset.label}`;
    }
    drawTrack();
  }

  new IntersectionObserver(
    ([entry]) => {
      ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
      if (ratio >= 0.3) reveal();
      sync();
    },
    { threshold: [0, 0.1, 0.3, 0.5, 0.75, 1] },
  ).observe(video);

  room.addEventListener('pointerenter', () => {
    if (!finePointer.matches) return;
    hovered = true;
    sync();
  });
  room.addEventListener('pointerleave', () => {
    hovered = false;
    sync();
  });
  room.addEventListener('focusin', () => {
    focused = true;
    sync();
  });
  room.addEventListener('focusout', (event) => {
    if (room.contains(event.relatedTarget as Node)) return;
    focused = false;
    sync();
  });

  toggle.addEventListener('click', () => {
    if (video.paused) {
      userPaused = false;
      userPlayed = true;
    } else {
      userPaused = true;
      userPlayed = false;
    }
    sync();
  });
  big.addEventListener('click', () => {
    userPaused = false;
    userPlayed = true;
    sync();
    toggle.focus();
  });
  chapters.forEach((button, i) =>
    button.addEventListener('click', () => {
      video.currentTime = times[i] + 0.01;
      userPaused = false;
      userPlayed = true;
      sync();
      update();
    }),
  );
  track.addEventListener('click', (event) => {
    const r = track.getBoundingClientRect();
    video.currentTime = clamp((event.clientX - r.left) / r.width) * duration;
    update();
  });

  video.addEventListener('play', label);
  video.addEventListener('pause', label);
  video.addEventListener('timeupdate', update);
  video.addEventListener('seeked', update);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else sync();
  });
  reducedMotion.addEventListener('change', () => {
    label();
    sync();
  });

  new ResizeObserver(() => {
    if (revealed === 1) {
      drawHalo(1);
      drawWipe(1);
    } else if (revealed < 0 && !still()) drawWipe(0);
    else if (still()) reveal();
    drawTrack();
  }).observe(screen);

  if (still()) reveal();
  else drawWipe(0);
  label();
  update();
  void wipeFrame;
}

export function initWorld(root: HTMLElement) {
  const map = root.querySelector<HTMLElement>('#workflow');
  if (map) initMap(map);
  root.querySelectorAll<HTMLElement>('.room').forEach(initRoom);
}
