import { grid, patterns, size, PALETTE } from '../../../lib/flood/pixels';
import { onScroll, reducedMotion } from '../../../lib/flood/scroll';

const CELL = 20;
const COVER_MS = 380;
const REVEAL_MS = 520;
/** Width of the dithered edge on each side of the flood band, in 0..1 flood time. */
const EDGE = 0.05;

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Flood time per cell, 0..1: Dijkstra from `seed` over a cave from pixels.grid().
 * Open cells cost 1 and walls 3, so the flood runs through the cave first and the
 * walls fill in behind it, the same shape language as the cover.
 */
function floodTimes(cols: number, rows: number, open: Uint8Array, seed: number) {
  const n = cols * rows;
  const d = new Int32Array(n).fill(1 << 29);
  const buckets: number[][] = [[seed]];
  d[seed] = 0;
  let max = 0;
  for (let b = 0; b < buckets.length; b++) {
    const list = buckets[b];
    if (!list) continue;
    for (const i of list) {
      if (d[i] !== b) continue;
      max = b;
      const x = i % cols;
      const near = [x > 0 ? i - 1 : -1, x < cols - 1 ? i + 1 : -1, i - cols, i + cols];
      for (const j of near) {
        if (j < 0 || j >= n) continue;
        const nd = b + (open[j] ? 1 : 3);
        if (nd < d[j]) {
          d[j] = nd;
          (buckets[nd] ??= []).push(j);
        }
      }
    }
  }
  const t = new Float32Array(n);
  for (let i = 0; i < n; i++) t[i] = d[i] / Math.max(1, max);
  return t;
}

export function initStage(root: HTMLElement) {
  const work = root.querySelector<HTMLElement>('#work');
  if (!work) return;
  const stops = [...work.querySelectorAll<HTMLElement>('.b3-stop')];
  const names = [...work.querySelectorAll<HTMLButtonElement>('[data-go]')];
  const panels = [...work.querySelectorAll<HTMLElement>('[data-panel]')];
  const rails = [...work.querySelectorAll<HTMLElement>('[data-rail]')];
  const frame = work.querySelector<HTMLElement>('[data-frame]')!;
  const videos = [...frame.querySelectorAll<HTMLVideoElement>('video')];
  const canvas = frame.querySelector<HTMLCanvasElement>('.b3-wipe')!;
  const play = frame.querySelector<HTMLButtonElement>('[data-play]')!;
  const playLabel = play.querySelector<HTMLElement>('[data-play-label]')!;
  const count = work.querySelector<HTMLElement>('[data-count]')!;
  const now = work.querySelector<HTMLElement>('[data-now]')!;
  const nowN = work.querySelector<HTMLElement>('[data-now-n]')!;
  const next = work.querySelector<HTMLAnchorElement>('[data-next]')!;
  const productName = (k: number) => names[k].textContent!.replace(/^\s*\d+\s*/, '').trim();
  const chapters = videos.map((_, k) =>
    [...panels[k].querySelectorAll<HTMLElement>('.b3-beat')].map((b) => ({
      t: Number(b.dataset.seek),
      label: b.textContent!.replace(/^\s*\d+\s*/, '').trim(),
    })),
  );

  // Which product the scroll position asks for, which one is on screen, and the
  // flood band between them: 0..1 covers the old demo, the swap happens at 1,
  // 1..2 drains to reveal the new one.
  let wanted = 0;
  let shown = 0;
  let p = 0;
  let seedSide: 'top' | 'bottom' = 'bottom';
  let ratio = 0;
  let hover = false;
  const userPaused = new Set<number>();
  const userPlayed = new Set<number>();

  // Wipe canvas.
  let ctx: CanvasRenderingContext2D | null = null;
  let cols = 0;
  let rows = 0;
  let fields: Record<'top' | 'bottom', Float32Array> | null = null;
  let tones: (string | CanvasPattern)[] = [];
  function resize() {
    const r = frame.getBoundingClientRect();
    if (!r.width) return;
    ctx = size(canvas, r.width, r.height);
    const cave = grid(r.width, r.height, 7, CELL);
    cols = cave.cols;
    rows = cave.rows;
    const mid = Math.floor(cols / 2);
    fields = {
      bottom: floodTimes(cols, rows, cave.open, (rows - 1) * cols + mid),
      top: floodTimes(cols, rows, cave.open, mid),
    };
    const [deep, soft] = patterns(ctx);
    tones = [PALETTE.blue, deep, PALETTE.light, soft];
    paint();
  }

  function paint() {
    if (!ctx || !fields) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (p <= 0 || p >= 2) return;
    const t = fields[seedSide];
    for (let i = 0; i < t.length; i++) {
      const ti = t[i];
      if (ti > p || ti < p - 1) continue;
      const edge = Math.min(p - ti, ti - (p - 1));
      ctx.fillStyle = tones[edge < EDGE / 3 ? 3 : edge < (EDGE * 2) / 3 ? 2 : edge < EDGE ? 1 : 0];
      ctx.fillRect((i % cols) * CELL, Math.floor(i / cols) * CELL, CELL, CELL);
    }
  }

  function swap() {
    shown = wanted;
    videos.forEach((v, k) => v.toggleAttribute('data-active', k === shown));
    panels.forEach((el, k) => {
      el.inert = k !== shown;
      el.classList.toggle('is-on', k === shown);
    });
    rails.forEach((el, k) => (el.hidden = k !== shown));
    count.textContent = pad(shown + 1);
    next.firstChild!.textContent = shown < names.length - 1 ? `Next: ${productName(shown + 1)} ` : 'Next: my AI workflow ';
    sync();
    progress();
  }

  let frameId = 0;
  let last = 0;
  function step(time: number) {
    const dt = last ? Math.min(64, time - last) : 16;
    last = time;
    if (shown !== wanted) {
      p = p <= 1 ? Math.min(1, p + dt / COVER_MS) : Math.max(1, p - dt / COVER_MS);
      if (p === 1) swap();
    } else if (p > 0 && p < 1) p = Math.max(0, p - dt / COVER_MS);
    else if (p >= 1 && p < 2) p = Math.min(2, p + dt / REVEAL_MS);
    if (p >= 2) p = 0;
    paint();
    if (p > 0 || shown !== wanted) frameId = requestAnimationFrame(step);
    else frameId = last = 0;
  }

  function want(k: number) {
    if (k === wanted) return;
    if (p === 0) seedSide = k > shown ? 'bottom' : 'top';
    wanted = k;
    names.forEach((b, i) =>
      i === k ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current'),
    );
    if (reducedMotion.matches || !ctx) {
      p = 0;
      swap();
      paint();
      return;
    }
    if (!frameId) frameId = requestAnimationFrame(step);
  }

  // Scroll position picks the product: one stop per product, switch at the midpoint.
  function stopTop(k: number) {
    return stops[k].getBoundingClientRect().top + window.scrollY;
  }
  onScroll((y) => {
    if (stops.length < 2) return;
    const first = stopTop(0);
    const step = stopTop(1) - first;
    want(clamp(Math.round((y - first) / step), 0, stops.length - 1));
  });

  function go(k: number) {
    window.scrollTo({ top: stopTop(k) });
  }
  next.addEventListener('click', (event) => {
    if (shown >= names.length - 1) return;
    event.preventDefault();
    go(shown + 1);
  });
  names.forEach((b, k) => {
    b.addEventListener('click', () => go(k));
    b.addEventListener('keydown', (event) => {
      const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
      if (!delta) return;
      event.preventDefault();
      const next = clamp(k + delta, 0, names.length - 1);
      names[next].focus();
      go(next);
    });
  });

  // Playback: in view (half or more), or hovered or focused, and never on its own under reduced motion.
  function sync() {
    videos.forEach((v, k) => {
      const active = k === shown;
      const visible = ratio >= 0.5 || (ratio > 0 && hover);
      const auto = !reducedMotion.matches && visible && !userPaused.has(k);
      const run = active && !document.hidden && ratio > 0 && (userPlayed.has(k) || auto);
      if (run && v.paused) v.play().catch(() => {});
      if (!run && !v.paused) v.pause();
    });
    paintPlay();
  }
  function paintPlay() {
    const v = videos[shown];
    const playing = !v.paused;
    frame.dataset.state = playing ? 'playing' : 'paused';
    playLabel.textContent = playing ? 'Pause' : 'Play';
    play.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} the ${productName(shown)} demo`);
  }
  play.addEventListener('click', () => {
    const v = videos[shown];
    if (v.paused) {
      userPaused.delete(shown);
      userPlayed.add(shown);
      v.play().catch(() => {});
    } else {
      userPlayed.delete(shown);
      userPaused.add(shown);
      v.pause();
    }
  });
  videos.forEach((v) => {
    v.addEventListener('play', () => {
      paintPlay();
      tick();
    });
    v.addEventListener('pause', paintPlay);
    v.addEventListener('seeked', progress);
    v.addEventListener('loadedmetadata', progress);
  });

  new IntersectionObserver(
    ([entry]) => {
      ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
      sync();
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  ).observe(frame);
  const stage = work.querySelector<HTMLElement>('.b3-stage')!;
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    frame.addEventListener('pointerenter', () => ((hover = true), sync()));
    frame.addEventListener('pointerleave', () => ((hover = false), sync()));
  }
  stage.addEventListener('focusin', () => ((hover = true), sync()));
  stage.addEventListener('focusout', () => ((hover = false), sync()));
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);

  // Chapters: the beat list and the rail follow the video, and both seek it.
  function progress() {
    const v = videos[shown];
    const list = chapters[shown];
    const duration = v.duration || Number(list.at(-1)!.t) + 4;
    const t = v.currentTime;
    let current = 0;
    list.forEach((c, j) => t >= c.t && (current = j));
    const segs = rails[shown].querySelectorAll<HTMLElement>('.b3-seg');
    segs.forEach((seg, j) => {
      const start = list[j].t;
      const end = list[j + 1]?.t ?? duration;
      const steps = Math.max(1, Math.round(seg.clientWidth / 4));
      const f = clamp((t - start) / (end - start));
      seg.style.setProperty('--f', String(Math.floor(f * steps) / steps));
      seg.toggleAttribute('data-current', j === current);
    });
    panels[shown].querySelectorAll<HTMLElement>('.b3-beat').forEach((b, j) => {
      b.toggleAttribute('data-current', j === current);
      b.toggleAttribute('data-done', j < current);
    });
    if (now.textContent !== list[current].label) {
      now.textContent = list[current].label;
      nowN.textContent = pad(current + 1);
    }
  }
  let ticking = 0;
  function tick() {
    if (ticking) return;
    const loop = () => {
      progress();
      ticking = videos[shown].paused ? 0 : requestAnimationFrame(loop);
    };
    ticking = requestAnimationFrame(loop);
  }
  work.querySelectorAll<HTMLElement>('[data-seek]').forEach((b) =>
    b.addEventListener('click', () => {
      const v = videos[shown];
      v.currentTime = Number(b.dataset.seek) + 0.05;
      progress();
    }),
  );

  // The beat list is the keyboard path on wide screens; on narrow ones it is hidden and the rail takes over.
  const narrow = matchMedia('(max-width: 900px)');
  const railFocus = () =>
    work.querySelectorAll('.b3-seg').forEach((s) => s.setAttribute('tabindex', narrow.matches ? '0' : '-1'));
  narrow.addEventListener('change', railFocus);
  railFocus();

  new ResizeObserver(resize).observe(frame);
  progress();
}
