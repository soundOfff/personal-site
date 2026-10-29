/**
 * The flood-fill cell system behind every pixel surface on the site: the home
 * cover, project covers, post sigils, route transitions and the footer.
 *
 * A grid is a cave of open cells. Everything that moves (the intro flood, the
 * drain, ripples and the amber path) derives from BFS distance over it.
 */

export const PALETTE = { blue: '#0024cc', light: '#8a9bff', paper: '#f7f3e9', amber: '#e0b81f' };

/** The ✳ wordmark glyph, 7×7. */
export const GLYPH = ['0001000', '0101010', '0011100', '1111111', '0011100', '0101010', '0001000'];

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Grid {
  cols: number;
  rows: number;
  cell: number;
  width: number;
  height: number;
  /** 1 = floor, 0 = wall. */
  open: Uint8Array;
  /** Cells kept clear for text; never drawn. */
  mask: Uint8Array;
  /** BFS distance from `seed` over open cells, -1 when unreached. */
  dist: Int32Array;
  parent: Int32Array;
  /** Tone 0..3 from distance bands: blue, blue/light dither, light, light/paper dither. */
  tone: Uint8Array;
  order: Int32Array;
  seed: number;
  maxDist: number;
  patterns?: CanvasPattern[];
}

export function hash(text: string): number {
  let n = 2166136261;
  for (const c of text) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}

/** Deterministic PRNG (mulberry32), so a slug always yields the same cave. */
export function random(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function neighbors(g: Grid, i: number, visit: (j: number) => void) {
  const x = i % g.cols;
  const y = Math.floor(i / g.cols);
  if (x) visit(i - 1);
  if (x < g.cols - 1) visit(i + 1);
  if (y) visit(i - g.cols);
  if (y < g.rows - 1) visit(i + g.cols);
}

export function bfs(g: Grid, seed: number) {
  const n = g.open.length;
  g.seed = seed;
  g.dist.fill(-1);
  g.parent = new Int32Array(n).fill(-1);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 1;
  queue[0] = seed;
  g.dist[seed] = 0;
  g.maxDist = 0;
  while (head < tail) {
    const i = queue[head++];
    neighbors(g, i, (j) => {
      if (!g.open[j] || g.dist[j] >= 0) return;
      g.dist[j] = g.dist[i] + 1;
      g.parent[j] = i;
      g.maxDist = Math.max(g.maxDist, g.dist[j]);
      queue[tail++] = j;
    });
  }
  g.order = queue.slice(0, tail);
  for (let i = 0; i < n; i++) {
    g.tone[i] = Math.min(3, Math.floor((g.dist[i] / Math.max(1, g.maxDist)) * 4));
  }
}

/** The open, unmasked cell closest to grid coordinates (x, y). */
export function nearest(g: Grid, x: number, y: number): number {
  let best = 0;
  let score = Infinity;
  for (let i = 0; i < g.open.length; i++) {
    if (!g.open[i] || g.mask[i]) continue;
    const d = ((i % g.cols) - x) ** 2 + (Math.floor(i / g.cols) - y) ** 2;
    if (d < score) {
      score = d;
      best = i;
    }
  }
  return best;
}

/**
 * Value noise plus two cellular-automaton smoothing passes reads as a cave,
 * not static. About a third of the cells end up as walls. Isolated rooms are
 * joined by narrow corridors so every floor cell floods.
 */
export function grid(width: number, height: number, seed = 1, cell = 20, clear: Rect[] = []): Grid {
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const n = cols * rows;
  const g: Grid = {
    cols,
    rows,
    cell,
    width,
    height,
    open: new Uint8Array(n),
    mask: new Uint8Array(n),
    dist: new Int32Array(n),
    parent: new Int32Array(n),
    tone: new Uint8Array(n),
    order: new Int32Array(0),
    seed: 0,
    maxDist: 0,
  };

  const rand = random(seed);
  const scale = 4;
  const nc = Math.ceil(cols / scale) + 2;
  const nr = Math.ceil(rows / scale) + 2;
  const noise = Array.from({ length: nc * nr }, rand);
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const values: number[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ix = Math.floor(x / scale);
      const iy = Math.floor(y / scale);
      const fx = smooth(x / scale - ix);
      const fy = smooth(y / scale - iy);
      const top = noise[iy * nc + ix] * (1 - fx) + noise[iy * nc + ix + 1] * fx;
      const bottom = noise[(iy + 1) * nc + ix] * (1 - fx) + noise[(iy + 1) * nc + ix + 1] * fx;
      values.push(top * (1 - fy) + bottom * fy);
    }
  }
  const threshold = [...values].sort((a, b) => a - b)[Math.floor(n * 0.36)];
  values.forEach((v, i) => (g.open[i] = v > threshold ? 1 : 0));

  for (let pass = 0; pass < 2; pass++) {
    const next = g.open.slice();
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) count += g.open[(y + dy) * cols + x + dx];
        }
        next[y * cols + x] = count >= 5 ? 1 : 0;
      }
    }
    g.open = next;
  }

  for (const r of clear) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const inside =
          (x + 1) * cell > r.left - cell &&
          x * cell < r.right + cell &&
          (y + 1) * cell > r.top - cell &&
          y * cell < r.bottom + cell;
        if (inside) g.mask[y * cols + x] = 1;
      }
    }
  }

  const center = nearest(g, cols * 0.52, rows * 0.53);
  bfs(g, center);
  let room: number;
  while ((room = g.open.findIndex((v, i) => v === 1 && g.dist[i] < 0)) >= 0) {
    let closest = center;
    let best = Infinity;
    for (const i of g.order) {
      const d =
        Math.abs((i % cols) - (room % cols)) +
        Math.abs(Math.floor(i / cols) - Math.floor(room / cols));
      if (d < best) {
        best = d;
        closest = i;
      }
    }
    let x = room % cols;
    let y = Math.floor(room / cols);
    const tx = closest % cols;
    const ty = Math.floor(closest / cols);
    while (x !== tx) {
      g.open[y * cols + x] = 1;
      x += Math.sign(tx - x);
    }
    while (y !== ty) {
      g.open[y * cols + x] = 1;
      y += Math.sign(ty - y);
    }
    g.open[y * cols + x] = 1;
    bfs(g, center);
  }
  return g;
}

/** Sizes a canvas for devicePixelRatio and returns a context in CSS pixels. */
export function size(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

/** 2px checkerboards between neighbor tones, so three colors read as five. */
export function patterns(ctx: CanvasRenderingContext2D): CanvasPattern[] {
  return [
    [PALETTE.blue, PALETTE.light],
    [PALETTE.light, PALETTE.paper],
  ].map(([a, b]) => {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 4;
    const p = tile.getContext('2d')!;
    p.fillStyle = a;
    p.fillRect(0, 0, 4, 4);
    p.fillStyle = b;
    p.fillRect(0, 0, 2, 2);
    p.fillRect(2, 2, 2, 2);
    return ctx.createPattern(tile, 'repeat')!;
  });
}

export interface DrawOptions {
  /** 0..1 share of the BFS wavefront that is filled. */
  progress?: number;
  /** Animation clock; nonzero lets single cells flip tone at rest. */
  time?: number;
  path?: number[];
  /** 0..1 position of a re-bloom ring, or -1. */
  ripple?: number;
  background?: boolean;
  excluded?: Set<number> | null;
}

export function draw(ctx: CanvasRenderingContext2D, g: Grid, options: DrawOptions = {}) {
  const {
    progress = 1,
    time = 0,
    path = [],
    ripple = -1,
    background = true,
    excluded = null,
  } = options;
  if (background) {
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, g.width, g.height);
  } else ctx.clearRect(0, 0, g.width, g.height);
  g.patterns ??= patterns(ctx);
  const tones = [PALETTE.blue, g.patterns[0], PALETTE.light, g.patterns[1]];
  const cut = progress * (g.maxDist + 1);
  const tick = Math.floor(time / 170);
  const visible = (i: number) =>
    progress > 0 && g.dist[i] <= cut && !g.mask[i] && !excluded?.has(i);

  for (const i of g.order) {
    if (!visible(i)) continue;
    let tone = g.tone[i];
    if (time && hash(String(i + Math.floor(tick / 4))) % 419 === 0) tone = (tone + 1) % 4;
    if (ripple >= 0 && Math.abs(g.dist[i] - ripple * g.maxDist) < 3) tone = (tone + 1) % 4;
    ctx.fillStyle = tones[tone];
    ctx.fillRect((i % g.cols) * g.cell, Math.floor(i / g.cols) * g.cell, g.cell, g.cell);
  }
  if (path.length) {
    ctx.fillStyle = PALETTE.amber;
    for (const i of path) {
      if (!visible(i)) continue;
      ctx.fillRect(
        (i % g.cols) * g.cell + 5,
        Math.floor(i / g.cols) * g.cell + 5,
        g.cell - 10,
        g.cell - 10,
      );
    }
  }
}

/** Shortest path from the seed to `target`, following BFS parents. */
export function path(g: Grid, target: number): number[] {
  const cells: number[] = [];
  for (let i = target; i >= 0; i = g.parent[i]) cells.push(i);
  return cells;
}
