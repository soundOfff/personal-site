/**
 * The workflow board. HTML lays out the five stages; this draws the pixel layer
 * between them: cobalt stage blocks with their cast, a dotted path, the two
 * feedback loops and one amber cell walking the loop.
 */
import { PALETTE, size } from '../../../lib/flood/pixels';
import { SPRITES, type SpriteId } from './sprites';

type Pt = [number, number];
type Box = { x: number; y: number; w: number; h: number };
type Step = { p: Pt; node?: number };

const CELL = 20;
const DOT = 6;
const STEP_MS = 85;
const NODE_MS = 650;

/** Dots every ~20 px along a Manhattan polyline, ends excluded. */
function dots(points: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let s = 0; s < points.length - 1; s++) {
    const [ax, ay] = points[s];
    const [bx, by] = points[s + 1];
    const len = Math.abs(bx - ax) + Math.abs(by - ay);
    const n = Math.max(1, Math.round(len / CELL));
    for (let k = s === 0 ? 1 : 0; k < n; k++) {
      out.push([Math.round(ax + ((bx - ax) * k) / n), Math.round(ay + ((by - ay) * k) / n)]);
    }
  }
  return out;
}

export function initWorkflow(root: HTMLElement) {
  const board = root.querySelector<HTMLElement>('.a3-board');
  if (!board) return;
  const canvas = board.querySelector('canvas')!;
  const nodeEls = [...board.querySelectorAll<HTMLElement>('[data-node]')];
  const stageEls = [...board.querySelectorAll<HTMLElement>('[data-stage]')];
  const labels = [...board.querySelectorAll<HTMLElement>('[data-loop]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const cast = nodeEls.map((n) => (n.dataset.cast ?? '').split(',') as SpriteId[]);

  let ctx: CanvasRenderingContext2D;
  let boxes: Box[] = [];
  let main: Pt[][] = [];
  let loops: { path: Pt[]; to: number; arrow: 'down' | 'right' }[] = [];
  let route: Step[] = [];
  let visible = false;
  let raf = 0;
  let t0 = performance.now();
  let lastIndex = -1;

  function layout() {
    const b = board!.getBoundingClientRect();
    ctx = size(canvas, b.width, b.height);
    boxes = nodeEls.map((n) => {
      const r = n.getBoundingClientRect();
      return { x: Math.round(r.left - b.left), y: Math.round(r.top - b.top), w: r.width, h: r.height };
    });
    const vertical = boxes[1].y > boxes[0].y + 10;
    const [, design, build, review] = boxes;

    main = boxes.slice(0, -1).map((a, i) => {
      const z = boxes[i + 1];
      return vertical
        ? dots([[a.x + a.w / 2, a.y + a.h], [z.x + z.w / 2, z.y]])
        : dots([[a.x + a.w, a.y + a.h / 2], [z.x, z.y + z.h / 2]]);
    });

    if (vertical) {
      const inner = review.x - CELL;
      const outer = review.x - CELL * 2;
      loops = [
        {
          path: dots([[review.x, review.y + review.h * 0.3], [inner, review.y + review.h * 0.3], [inner, build.y + build.h * 0.6], [build.x, build.y + build.h * 0.6]]),
          to: 2,
          arrow: 'right',
        },
        {
          path: dots([[review.x, review.y + review.h * 0.75], [outer, review.y + review.h * 0.75], [outer, design.y + design.h * 0.5], [design.x, design.y + design.h * 0.5]]),
          to: 1,
          arrow: 'right',
        },
      ];
    } else {
      const top = review.y;
      const ix = review.x + CELL * 2;
      const ox = review.x + review.w - CELL * 2;
      const bx = build.x + build.w - CELL * 2;
      const dx = design.x + design.w / 2;
      loops = [
        { path: dots([[ix, top], [ix, top - CELL * 2], [bx, top - CELL * 2], [bx, build.y]]), to: 2, arrow: 'down' },
        { path: dots([[ox, top], [ox, top - CELL * 4], [dx, top - CELL * 4], [dx, design.y]]), to: 1, arrow: 'down' },
      ];
      const place = (el: HTMLElement | undefined, x1: number, x2: number, y: number) => {
        if (!el) return;
        el.style.left = `${Math.round((x1 + x2) / 2)}px`;
        el.style.top = `${Math.round(y)}px`;
      };
      place(labels[0], bx, ix, top - CELL * 3);
      place(labels[1], dx, ox, top - CELL * 5);
    }

    // One amber cell walks the loop. Every other lap it takes a feedback loop back.
    const center = (i: number): Pt => [boxes[i].x + boxes[i].w / 2, boxes[i].y + boxes[i].h / 2];
    const walk = (from: number, to: number) => {
      const steps: Step[] = [];
      for (let i = from; i < to; i++) {
        steps.push({ p: center(i), node: i }, ...main[i].map((p) => ({ p })));
      }
      steps.push({ p: center(to), node: to });
      return steps;
    };
    const back = (i: number) => loops[i].path.map((p) => ({ p }));
    route = [
      ...walk(0, 4),
      ...walk(0, 3),
      ...back(0),
      ...walk(2, 4),
      ...walk(0, 4),
      ...walk(0, 3),
      ...back(1),
      ...walk(1, 4),
    ];
    draw(reduce.matches ? route.length - 1 : currentIndex(performance.now()));
  }

  const duration = (s: Step) => (s.node === undefined ? STEP_MS : s.node === 4 ? NODE_MS * 2.5 : NODE_MS);
  function currentIndex(now: number) {
    const lap = route.reduce((sum, s) => sum + duration(s), 0);
    let t = (now - t0) % lap;
    for (let i = 0; i < route.length; i++) {
      t -= duration(route[i]);
      if (t < 0) return i;
    }
    return route.length - 1;
  }

  function block(b: Box, ids: SpriteId[]) {
    ctx.fillStyle = PALETTE.blue;
    const c = CELL;
    ctx.fillRect(b.x + c, b.y, b.w - 2 * c, b.h);
    ctx.fillRect(b.x, b.y + c, b.w, b.h - 2 * c);
    const px = b.w >= 140 ? 5 : b.w >= 120 ? 4 : 3;
    const gap = px * 3;
    const spriteW = 8 * px;
    const totalW = ids.length * spriteW + (ids.length - 1) * gap;
    let x0 = Math.round(b.x + (b.w - totalW) / 2);
    const y0 = Math.round(b.y + (b.h - 8 * px) / 2 + px / 2);
    ctx.fillStyle = PALETTE.paper;
    for (const id of ids) {
      SPRITES[id].forEach((row, y) =>
        [...row].forEach((ch, x) => ch === 'X' && ctx.fillRect(x0 + x * px, y0 + y * px, px, px)),
      );
      x0 += spriteW + gap;
    }
  }

  function arrow([x, y]: Pt, dir: 'down' | 'right', color: string) {
    ctx.fillStyle = color;
    const p = 3;
    for (let k = 0; k < 3; k++) {
      const half = (2 - k) * p;
      if (dir === 'down') ctx.fillRect(x - half - p / 2, y - 12 + k * p, half * 2 + p, p);
      else ctx.fillRect(x - 12 + k * p, y - half - p / 2, p, half * 2 + p);
    }
  }

  function draw(index: number) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dot = ([x, y]: Pt) => ctx.fillRect(x - DOT / 2, y - DOT / 2, DOT, DOT);
    ctx.fillStyle = PALETTE.light;
    loops.forEach((l) => l.path.forEach(dot));
    loops.forEach((l) => {
      const end = l.path[l.path.length - 1];
      const target = boxes[l.to];
      const tip: Pt = l.arrow === 'down' ? [end[0], target.y] : [target.x, end[1]];
      arrow(tip, l.arrow, PALETTE.light);
    });
    ctx.fillStyle = PALETTE.blue;
    main.forEach((m) => m.forEach(dot));
    boxes.forEach((b, i) => block(b, cast[i]));

    const step = route[index];
    if (!step) return;
    const active = step.node ?? -1;
    if (index !== lastIndex) {
      stageEls.forEach((el, i) => el.toggleAttribute('data-active', i === active));
      lastIndex = index;
    }
    const [x, y] = step.p;
    ctx.fillStyle = PALETTE.amber;
    if (step.node !== undefined) {
      const b = boxes[step.node];
      ctx.fillRect(b.x + b.w - CELL, b.y + b.h - CELL, CELL, CELL);
    } else ctx.fillRect(x - 5, y - 5, 10, 10);
  }

  function tick(now: number) {
    raf = 0;
    if (!visible || document.hidden || reduce.matches) return;
    const i = currentIndex(now);
    if (i !== lastIndex) draw(i);
    raf = requestAnimationFrame(tick);
  }
  const run = () => {
    if (!raf && visible && !document.hidden && !reduce.matches) raf = requestAnimationFrame(tick);
  };

  new ResizeObserver(() => layout()).observe(board);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) run();
  }).observe(board);
  document.addEventListener('visibilitychange', run);
  reduce.addEventListener('change', () => (reduce.matches ? draw(route.length - 1) : (t0 = performance.now(), run())));
  layout();
}
