/**
 * The workflow as a pixel assembly line. One amber ticket rides a belt through
 * five stations. My ✳ stamps it at Frame and Decide; Claude Code and Codex carry
 * it through Design, Build and Review. Review sends it back over a return track:
 * failed checks to Build on one lap, a wrong approach to Design on the next.
 * The scene is a pure function of time, so reduced motion draws one frozen frame.
 */
import { PALETTE, hash, patterns, size } from '../../../lib/flood/pixels';
import { reducedMotion } from '../../../lib/flood/scroll';
import { CHECK, CLAUDE, CODEX, COLORS, CROSS, GHOST, INK, LINE, STAR } from './sprites';

type Fail = 'build' | 'design';
type Seg =
  | { kind: 'dwell'; s: number; ms: number; result?: Fail | 'pass' }
  | { kind: 'move'; from: number; to: number; ms: number }
  | { kind: 'loop'; to: number; ms: number; fail: Fail }
  | { kind: 'exit'; ms: number };

interface Text {
  stages: { label: string; title: string }[];
  fail: Record<Fail, string>;
  arcs: Record<Fail, string>;
}

function lap(fail: Fail): Seg[] {
  const segs: Seg[] = [
    { kind: 'dwell', s: 0, ms: 1800 },
    { kind: 'move', from: 0, to: 1, ms: 900 },
    { kind: 'dwell', s: 1, ms: 1900 },
    { kind: 'move', from: 1, to: 2, ms: 900 },
    { kind: 'dwell', s: 2, ms: 2000 },
    { kind: 'move', from: 2, to: 3, ms: 900 },
    { kind: 'dwell', s: 3, ms: 2000, result: fail },
    { kind: 'loop', to: fail === 'build' ? 2 : 1, ms: 1700, fail },
  ];
  if (fail === 'design')
    segs.push({ kind: 'dwell', s: 1, ms: 1200 }, { kind: 'move', from: 1, to: 2, ms: 900 });
  segs.push(
    { kind: 'dwell', s: 2, ms: 1300 },
    { kind: 'move', from: 2, to: 3, ms: 900 },
    { kind: 'dwell', s: 3, ms: 1700, result: 'pass' },
    { kind: 'move', from: 3, to: 4, ms: 1100 },
    { kind: 'dwell', s: 4, ms: 2000 },
    { kind: 'exit', ms: 1200 },
  );
  return segs;
}

const TIMELINE = [...lap('build'), ...lap('design')];
const TOTAL = TIMELINE.reduce((sum, seg) => sum + seg.ms, 0);
/** The frozen frame: the first ticket stamped at Decide. */
const FROZEN = (() => {
  let t = 0;
  for (const seg of TIMELINE) {
    if (seg.kind === 'dwell' && seg.s === 4) return t + seg.ms * 0.85;
    t += seg.ms;
  }
  return 0;
})();

const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface Layout {
  W: number;
  H: number;
  u: number;
  g: number;
  cell: number;
  X: number[];
  arcY: Record<Fail, number>;
  belt: number;
  off: number;
  big: boolean;
}

function layout(W: number): Layout {
  const big = W >= 720;
  const cell = big ? 20 : 12;
  const belt = big ? 176 : 104;
  return {
    W,
    H: belt + cell,
    u: big ? 5 : 3,
    g: big ? 6 : 4,
    cell,
    X: [0, 1, 2, 3, 4].map((i) => Math.round(((i + 0.5) * W) / 5)),
    arcY: { design: big ? 30 : 16, build: big ? 72 : 40 },
    belt,
    off: big ? 58 : 26,
    big,
  };
}

interface Scene {
  tx: number;
  ty: number;
  alpha: number;
  level: number;
  mark: '' | 'fail' | 'pass';
  ax: number;
  mode: 'idle' | 'walk' | 'work';
  stamp: [number, number];
  live: number;
  caption: string;
  arc: Fail | '';
}

function arcPoint(L: Layout, to: number, fail: Fail, k: number, rest: number) {
  const pts = [
    [L.X[3], rest],
    [L.X[3], L.arcY[fail]],
    [L.X[to], L.arcY[fail]],
    [L.X[to], rest],
  ];
  const lens = pts.slice(1).map((p, i) => Math.abs(p[0] - pts[i][0]) + Math.abs(p[1] - pts[i][1]));
  let d = k * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const f = lens[i] ? Math.min(1, d / lens[i]) : 1;
      return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)];
    }
    d -= lens[i];
  }
  return pts[3];
}

function scene(time: number, L: Layout, text: Text): Scene {
  let t = time % TOTAL;
  const rest = L.belt;
  const title = (s: number) => `0${s + 1} · ${text.stages[s].title}`;
  let level = 0;
  let ax = L.X[1];
  let caption = title(0);
  let mark: Scene['mark'] = '';
  for (const seg of TIMELINE) {
    if (t >= seg.ms) {
      t -= seg.ms;
      if (seg.kind === 'dwell') {
        if (seg.s === 0) level = 1;
        if (seg.s === 2) level = Math.max(level, 2);
        if (seg.s === 4) level = 3;
        caption = seg.result ? (seg.result === 'pass' ? title(3) : text.fail[seg.result]) : title(seg.s);
        mark = seg.result ? (seg.result === 'pass' ? 'pass' : 'fail') : mark;
      }
      if (seg.kind === 'move' && seg.from >= 1 && seg.to <= 3) ax = L.X[seg.to];
      if (seg.kind === 'loop') {
        ax = L.X[seg.to];
        mark = '';
      }
      if (seg.kind === 'exit') {
        level = 0;
        ax = L.X[1];
        mark = '';
      }
      continue;
    }
    const k = t / seg.ms;
    const base: Scene = {
      tx: L.X[0],
      ty: rest,
      alpha: 1,
      level,
      mark,
      ax,
      mode: 'idle',
      stamp: [0, 0],
      live: 0,
      caption,
      arc: '',
    };
    if (seg.kind === 'dwell') {
      base.tx = L.X[seg.s];
      base.live = seg.s;
      base.caption = title(seg.s);
      if (seg.s === 0) {
        const drop = Math.min(1, k / 0.18);
        base.ty = rest - (1 - ease(drop)) * L.cell * 3;
        base.alpha = drop;
        base.stamp[0] = k > 0.38 && k < 0.66 ? Math.sin((Math.PI * (k - 0.38)) / 0.28) : 0;
        base.level = k > 0.52 ? 1 : 0;
      } else if (seg.s === 4) {
        base.stamp[1] = k > 0.3 && k < 0.58 ? Math.sin((Math.PI * (k - 0.3)) / 0.28) : 0;
        base.level = k > 0.44 ? 3 : level;
        base.mark = k > 0.44 ? '' : mark;
      } else if (seg.s === 3 && seg.result) {
        base.mode = k < 0.55 ? 'work' : 'idle';
        if (k >= 0.55) {
          base.mark = seg.result === 'pass' ? 'pass' : 'fail';
          base.caption = seg.result === 'pass' ? title(3) : text.fail[seg.result];
          if (seg.result !== 'pass') base.arc = seg.result;
        } else base.mark = '';
      } else {
        base.mode = 'work';
        if (seg.s === 2 && k > 0.75) base.level = Math.max(level, 2);
      }
    } else if (seg.kind === 'move') {
      const e = ease(k);
      base.tx = lerp(L.X[seg.from], L.X[seg.to], e);
      base.live = k < 0.5 ? seg.from : seg.to;
      if (k >= 0.5) base.caption = title(seg.to);
      if (seg.from >= 1 && seg.to <= 3) {
        base.ax = base.tx;
        base.mode = 'walk';
      }
    } else if (seg.kind === 'loop') {
      const [x, y] = arcPoint(L, seg.to, seg.fail, ease(k), rest);
      base.tx = x;
      base.ty = y;
      base.ax = lerp(L.X[3], L.X[seg.to], ease(Math.min(1, k * 1.15)));
      base.mode = k < 0.87 ? 'walk' : 'idle';
      base.live = k < 0.5 ? 3 : seg.to;
      base.arc = seg.fail;
      base.mark = 'fail';
      base.caption = text.fail[seg.fail];
    } else {
      base.tx = lerp(L.X[4], L.W + L.cell * 3, k * k);
      base.alpha = 1 - k;
      base.level = 3;
      base.live = 4;
      base.ax = lerp(L.X[3], L.X[1], ease(k));
      base.mode = 'walk';
      base.caption = title(4);
    }
    return base;
  }
  throw new Error('timeline overrun');
}

export function initLine(root: HTMLElement) {
  const wf = root.querySelector<HTMLElement>('#workflow');
  if (!wf) return;
  const canvas = wf.querySelector<HTMLCanvasElement>('canvas.line')!;
  const status = wf.querySelector<HTMLElement>('[data-status]')!;
  const stations = [...wf.querySelectorAll<HTMLButtonElement>('[data-station]')];
  const panels = [...wf.querySelectorAll<HTMLElement>('[data-panel]')];
  const text = JSON.parse(wf.dataset.text!) as Text;

  let ctx: CanvasRenderingContext2D;
  let dither: CanvasPattern[] = [];
  let L = layout(1);
  let visible = false;
  let frame = 0;
  let start = 0;
  let live = -1;
  let preview = -1;
  let pinned = -1;
  let lastCaption = '';
  const still = () => reducedMotion.matches;

  function resize() {
    const w = canvas.clientWidth;
    L = layout(w);
    canvas.style.height = `${L.H}px`;
    ctx = size(canvas, w, L.H);
    dither = patterns(ctx);
    ctx.textBaseline = 'alphabetic';
    draw(still() ? FROZEN : performance.now() - start);
  }

  function sprite(bitmap: string[], x: number, y: number, u: number, swap?: (r: number, c: number) => string | null) {
    bitmap.forEach((row, r) =>
      [...row].forEach((ch, c) => {
        const k = swap?.(r, c) ?? ch;
        if (k === '.' || !COLORS[k]) return;
        ctx.fillStyle = COLORS[k];
        ctx.fillRect(Math.round(x + c * u), Math.round(y + r * u), u, u);
      }),
    );
  }

  function agent(bitmap: string[], cx: number, mode: Scene['mode'], time: number, which: number) {
    const { u, belt } = L;
    const step = Math.floor(time / 150 + which) % 2;
    const bob = mode === 'walk' ? step : mode === 'idle' ? Math.floor(time / 700 + which) % 2 : 0;
    const x = cx - (11 * u) / 2;
    const y = belt - 11 * u - bob * u;
    const body = bitmap === CLAUDE ? 'b' : 'i';
    sprite(bitmap, x, y, u, (r, c) => {
      if (r === 10) {
        if (mode !== 'walk') return null;
        const legs = step ? [3, 7] : [4, 6];
        return legs.includes(c) ? body : '.';
      }
      if (bitmap === CLAUDE && r === 5 && c >= 5 && c <= 7 && mode === 'work')
        return Math.floor(time / 260) % 2 ? 'p' : null;
      return null;
    });
    // Arms: down at rest, typing in turns at work.
    ctx.fillStyle = PALETTE.light;
    const typing = mode === 'work' ? Math.floor(time / 130 + which) % 2 : -1;
    const arm = (side: number, out: boolean) => {
      const col = side < 0 ? 2 : 8;
      if (out) ctx.fillRect(x + (col + side) * u, y + 8 * u, u * 2, u);
      else ctx.fillRect(x + col * u, y + 8 * u, u, u * 2);
    };
    arm(-1, typing === 0);
    arm(1, typing === 1);
  }

  function draw(time: number) {
    if (!ctx) return;
    const s = scene(time, L, text);
    const { u, g, cell, X, belt, W, H } = L;
    ctx.clearRect(0, 0, W, H);

    // Return tracks, always drawn so the frozen line still reads as a loop.
    ctx.font = `${L.big ? 11 : 9}px "JetBrains Mono Variable", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    (['design', 'build'] as Fail[]).forEach((fail) => {
      const to = fail === 'build' ? 2 : 1;
      const y = L.arcY[fail];
      const on = s.arc === fail;
      ctx.fillStyle = on ? PALETTE.blue : LINE;
      const dot = (px: number, py: number) => ctx.fillRect(Math.round(px - u / 2), Math.round(py - u / 2), u, u);
      const gap = u * 2;
      for (let py = belt - 11 * u - u * 3; py >= y; py -= gap) dot(X[3], py);
      for (let px = X[3]; px >= X[to]; px -= gap) dot(px, y);
      for (let py = y; py <= belt - 11 * u - u * 3; py += gap) dot(X[to], py);
      // Arrowhead into the station it returns to.
      const tip = belt - 11 * u - u * 2;
      for (let r = 0; r < 3; r++) ctx.fillRect(X[to] - (2 - r) * u - u / 2, tip - (3 - r) * u, (2 * (2 - r) + 1) * u, u);
      ctx.fillStyle = on ? PALETTE.blue : GHOST;
      if (L.big) ctx.fillText(text.arcs[fail], (X[3] + X[to]) / 2, y - u * 1.6);
      else {
        ctx.textAlign = 'left';
        ctx.fillText(text.arcs[fail], X[3] + u * 2.5, y + u);
        ctx.textAlign = 'center';
      }
    });

    // The belt: a pale dithered strip whose tread marks move with the ticket.
    ctx.fillStyle = dither[1];
    ctx.fillRect(0, belt, W, cell);
    ctx.fillStyle = PALETTE.light;
    const shift = Math.round((s.tx / u) % (cell / u)) * u;
    for (let x = -cell + shift; x < W; x += cell) ctx.fillRect(x, belt, u, cell);
    // Station pads: three solid cells, the live one in ink.
    X.forEach((x, i) => {
      ctx.fillStyle = i === s.live ? INK : PALETTE.blue;
      const left = Math.round(x / cell - 1.5) * cell;
      ctx.fillRect(left, belt, cell * 3, cell);
    });

    // My ✳ hovers over Frame and Decide and stamps the ticket.
    const tw = 8 * u;
    const th = 6 * u;
    const lift = L.big ? cell * 1.5 : cell;
    [0, 4].forEach((station, i) => {
      const restTop = belt - th - 7 * g - lift;
      const top = restTop + s.stamp[i] * (lift - u);
      sprite(STAR, X[station] - (7 * g) / 2, top, g);
    });

    agent(CLAUDE, s.ax - L.off, s.mode, time, 0);
    agent(CODEX, s.ax + L.off, s.mode, time, 1);

    // The ticket.
    if (s.alpha > 0) {
      ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));
      const x = Math.round(s.tx - tw / 2);
      const y = Math.round(s.ty - th);
      ctx.fillStyle = PALETTE.amber;
      ctx.fillRect(x, y, tw, th);
      ctx.fillStyle = PALETTE.paper;
      ctx.fillRect(x + tw - u, y, u, u);
      if (s.level >= 1) {
        ctx.fillStyle = INK;
        ctx.fillRect(x + u, y + u, u * 5, u);
        ctx.fillRect(x + u, y + u * 3, u * 3, u);
      }
      if (s.level >= 2) {
        ctx.fillStyle = PALETTE.blue;
        ctx.fillRect(x + u * 5, y + u * 3, u * 2, u * 2);
      }
      if (s.level >= 3) {
        ctx.strokeStyle = PALETTE.blue;
        ctx.lineWidth = u;
        ctx.strokeRect(x - u / 2, y - u / 2, tw + u, th + u);
      }
      if (s.mark) {
        const glyph = s.mark === 'pass' ? CHECK : CROSS;
        sprite(glyph, s.tx - (5 * u) / 2, y - u * 7, u);
      }
      ctx.globalAlpha = 1;
    }

    // Work sparks over the ticket.
    if (s.mode === 'work') {
      const beat = Math.floor(time / 120);
      for (let i = 0; i < 3; i++) {
        const h = hash(`${beat}:${i}`);
        ctx.fillStyle = i % 2 ? PALETTE.light : PALETTE.blue;
        ctx.fillRect(
          Math.round(s.tx + ((h % 9) - 4) * u * 1.2),
          Math.round(s.ty - th - u * 2 - ((h >> 4) % 5) * u),
          u,
          u,
        );
      }
    }

    if (s.caption !== lastCaption) {
      lastCaption = s.caption;
      status.textContent = s.caption;
    }
    if (s.live !== live) {
      live = s.live;
      stations.forEach((b, k) => b.classList.toggle('live', k === live));
      showPanel();
    }
  }

  function showPanel() {
    const i = preview >= 0 ? preview : pinned >= 0 ? pinned : Math.max(0, live);
    panels.forEach((p, k) => p.classList.toggle('on', k === i));
    stations.forEach((b, k) => b.classList.toggle('shown', k === i));
  }

  function loop() {
    frame = 0;
    if (!visible || document.hidden || still()) return;
    draw(performance.now() - start);
    frame = requestAnimationFrame(loop);
  }

  function resume() {
    if (still()) {
      draw(FROZEN);
      return;
    }
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(loop);
  }

  stations.forEach((b, i) => {
    b.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      preview = i;
      showPanel();
    });
    b.addEventListener('pointerleave', () => {
      preview = -1;
      showPanel();
    });
    b.addEventListener('focus', () => {
      preview = i;
      showPanel();
    });
    b.addEventListener('blur', () => {
      preview = -1;
      showPanel();
    });
    b.addEventListener('click', () => {
      pinned = pinned === i ? -1 : i;
      stations.forEach((o, k) => o.setAttribute('aria-pressed', String(k === pinned)));
      showPanel();
    });
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !start) start = performance.now();
    resume();
  }).observe(canvas);
  document.addEventListener('visibilitychange', resume);
  reducedMotion.addEventListener('change', resume);
  new ResizeObserver(resize).observe(canvas);
  void document.fonts.ready.then(resize);
  showPanel();
}
