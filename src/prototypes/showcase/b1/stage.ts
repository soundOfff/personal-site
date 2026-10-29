/**
 * The pinned demo stage. Scroll position picks the product (one snap step each);
 * a change floods the frame with the cave on the 20 px grid, swaps the demo under
 * full cover, then drains from the same seed to reveal the next one.
 */
import { grid, patterns, PALETTE, size } from '../../../lib/flood/pixels';
import { onScroll, reducedMotion } from '../../../lib/flood/scroll';

const CELL = 20;
const HALF_MS = 360;
const BAND = 0.18;

const smooth = (t: number) => t * t * (3 - 2 * t);

export function initStage(root: HTMLElement) {
  const work = root.querySelector<HTMLElement>('#work');
  if (!work) return;
  const steps = [...work.querySelectorAll<HTMLElement>('.step')];
  const videos = [...work.querySelectorAll<HTMLVideoElement>('video[data-video]')];
  const names = [...work.querySelectorAll<HTMLAnchorElement>('[data-index]')];
  const details = [...work.querySelectorAll<HTMLElement>('[data-detail]')];
  const nexts = [...work.querySelectorAll<HTMLElement>('[data-next]')];
  const rails = [...work.querySelectorAll<HTMLElement>('[data-rail]')];
  const count = work.querySelector<HTMLElement>('[data-count]')!;
  const now = work.querySelector<HTMLElement>('[data-now]')!;
  const frame = work.querySelector<HTMLElement>('[data-frame]')!;
  const canvas = frame.querySelector<HTMLCanvasElement>('canvas')!;
  const toggle = frame.querySelector<HTMLButtonElement>('[data-toggle]')!;
  const playBig = frame.querySelector<HTMLButtonElement>('[data-play]')!;
  const n = videos.length;

  let shown = 0;
  let target = 0;
  let half = false;
  let any = false;
  let hovering = false;
  let focused = false;
  let userPaused = false;
  let userStarted = false;
  let railFrame = 0;
  let ctx: CanvasRenderingContext2D;
  let tones: (string | CanvasPattern)[] = [];
  let cols = 0;
  let rows = 0;
  let top = 0;
  let stepH = 1;
  const fields = new Map<string, Float32Array>();
  let anim: { start: number; field: Float32Array; swapped: boolean } | null = null;

  const still = () => reducedMotion.matches;

  function measure() {
    const r = frame.getBoundingClientRect();
    ctx = size(canvas, r.width, r.height);
    const p = patterns(ctx);
    tones = [PALETTE.blue, p[0], PALETTE.light, p[1]];
    cols = Math.ceil(r.width / CELL);
    rows = Math.ceil(r.height / CELL);
    fields.clear();
    top = work!.getBoundingClientRect().top + scrollY;
    stepH = steps.length > 1 ? steps[1].offsetTop - steps[0].offsetTop : innerHeight;
    paintRail();
  }

  /** Cave distance from a seed on the edge the next product comes from. Walls flood last. */
  function field(dir: number, to: number) {
    const key = `${dir}:${to}`;
    const cached = fields.get(key);
    if (cached) return cached;
    const g = grid(cols * CELL, rows * CELL, 11 + to * 7 + (dir > 0 ? 0 : 3), CELL);
    const total = cols * rows;
    const seedCol = Math.floor(cols * (0.25 + 0.5 * ((to * 0.37 + (dir > 0 ? 0.2 : 0.7)) % 1)));
    const seed = (dir > 0 ? rows - 1 : 0) * cols + seedCol;
    const dist = new Int32Array(total).fill(1e9);
    const buckets: number[][] = [[seed]];
    dist[seed] = 0;
    for (let b = 0; b < buckets.length; b++) {
      for (const i of buckets[b] ?? []) {
        if (dist[i] !== b) continue;
        const x = i % cols;
        const y = (i / cols) | 0;
        const visit = (j: number) => {
          const d = b + (g.open[j] ? 1 : 3);
          if (d < dist[j]) {
            dist[j] = d;
            (buckets[d] ??= []).push(j);
          }
        };
        if (x) visit(i - 1);
        if (x < cols - 1) visit(i + 1);
        if (y) visit(i - cols);
        if (y < rows - 1) visit(i + cols);
      }
    }
    let max = 1;
    for (let i = 0; i < total; i++) max = Math.max(max, dist[i]);
    const out = new Float32Array(total);
    for (let i = 0; i < total; i++) out[i] = dist[i] / max;
    fields.set(key, out);
    return out;
  }

  function paint(phase: 'in' | 'out', t: number, f: Float32Array) {
    const r = frame.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    const front = phase === 'in' ? t * (1 + BAND) : t * (1 + BAND + 0.01) - BAND;
    for (let i = 0; i < f.length; i++) {
      const d = f[i];
      let e: number;
      if (phase === 'in') {
        if (d > front) continue;
        e = front - d;
      } else {
        if (d < front) continue;
        e = d - front;
      }
      const tone = e < BAND * 0.34 ? 3 : e < BAND * 0.67 ? 2 : e < BAND ? 1 : 0;
      ctx.fillStyle = tones[tone];
      ctx.fillRect((i % cols) * CELL, ((i / cols) | 0) * CELL, CELL, CELL);
    }
  }

  function tick(time: number) {
    if (!anim) return;
    const t = (time - anim.start) / HALF_MS;
    if (t < 1) {
      paint('in', smooth(t), anim.field);
    } else {
      if (!anim.swapped) {
        anim.swapped = true;
        swap(target);
      }
      if (t < 2) paint('out', smooth(t - 1), anim.field);
      else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        anim = null;
        if (target !== shown) go(target);
        return;
      }
    }
    requestAnimationFrame(tick);
  }

  function go(next: number) {
    target = next;
    if (anim) return;
    if (target === shown) return;
    if (still() || !any) {
      swap(target);
      return;
    }
    anim = {
      start: performance.now(),
      field: field(target > shown ? 1 : -1, target),
      swapped: false,
    };
    requestAnimationFrame(tick);
  }

  function swap(i: number) {
    if (i === shown) return;
    const old = videos[shown];
    old.pause();
    old.classList.remove('on');
    shown = i;
    const v = videos[i];
    v.classList.add('on');
    if (v.readyState > 0) v.currentTime = 0;
    names.forEach((a, k) =>
      k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'),
    );
    details.forEach((d, k) => (d.hidden = k !== i));
    nexts.forEach((d, k) => (d.hidden = k !== i));
    rails.forEach((r, k) => (r.hidden = k !== i));
    count.textContent = String(i + 1).padStart(2, '0');
    userPaused = false;
    userStarted = false;
    paintRail();
    sync();
  }

  function wants() {
    if (document.hidden || !any) return false;
    if (still()) return userStarted;
    return !userPaused && (half || hovering || focused);
  }

  function sync() {
    videos.forEach((v, k) => k !== shown && !v.paused && v.pause());
    const v = videos[shown];
    if (wants()) {
      if (v.paused) v.play().catch(() => {});
    } else if (!v.paused) v.pause();
    controls();
  }

  function controls() {
    const v = videos[shown];
    const playing = !v.paused;
    const name = names[shown].textContent?.trim();
    toggle.dataset.state = playing ? 'playing' : 'paused';
    toggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} the ${name} demo`);
    playBig.hidden = !(still() && !userStarted);
    playBig.querySelector('span')!.textContent = `Play the ${name} demo`;
  }

  /** Chapter bars fill in whole 8 px cells, like the grid. */
  function paintRail() {
    const v = videos[shown];
    const rail = rails[shown];
    const buttons = [...rail.querySelectorAll<HTMLButtonElement>('button')];
    const marks = buttons.map((b) => Number(b.dataset.t));
    const dur = v.duration || Number(rail.dataset.duration);
    const t = v.currentTime;
    let current = 0;
    marks.forEach((m, k) => t >= m && (current = k));
    buttons.forEach((b, k) => {
      const end = marks[k + 1] ?? dur;
      const p = k < current ? 1 : k > current ? 0 : Math.min(1, (t - marks[k]) / (end - marks[k]));
      const fill = b.querySelector<HTMLElement>('.fill')!;
      const w = fill.parentElement!.clientWidth;
      fill.style.width = `${p >= 1 ? w : Math.floor((p * w) / 8) * 8}px`;
      if (k === current) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    now.textContent = buttons[current]?.dataset.label ?? '';
  }

  function railLoop() {
    paintRail();
    railFrame = videos[shown].paused ? 0 : requestAnimationFrame(railLoop);
  }

  videos.forEach((v) => {
    v.addEventListener('play', () => {
      controls();
      if (!railFrame) railFrame = requestAnimationFrame(railLoop);
    });
    v.addEventListener('pause', controls);
    v.addEventListener('seeked', paintRail);
    v.addEventListener('loadedmetadata', paintRail);
  });

  rails.forEach((rail) =>
    rail.addEventListener('click', (event) => {
      const b = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-t]');
      if (!b) return;
      const v = videos[shown];
      v.currentTime = Number(b.dataset.t) + 0.05;
      if (still()) userStarted = true;
      userPaused = false;
      sync();
      paintRail();
    }),
  );

  toggle.addEventListener('click', () => {
    const v = videos[shown];
    if (v.paused) {
      userPaused = false;
      userStarted = true;
    } else {
      userPaused = true;
      userStarted = false;
    }
    sync();
  });
  playBig.addEventListener('click', () => {
    userStarted = true;
    userPaused = false;
    sync();
    toggle.focus();
  });

  const card = work.querySelector<HTMLElement>('.stage')!;
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    frame.addEventListener('pointerenter', () => {
      hovering = true;
      sync();
    });
    frame.addEventListener('pointerleave', () => {
      hovering = false;
      sync();
    });
  }
  card.addEventListener('focusin', () => {
    focused = true;
    sync();
  });
  card.addEventListener('focusout', (event) => {
    if (card.contains(event.relatedTarget as Node)) return;
    focused = false;
    sync();
  });

  new IntersectionObserver(
    ([entry]) => {
      any = entry.isIntersecting;
      half = entry.intersectionRatio >= 0.5;
      sync();
    },
    { threshold: [0, 0.5, 1] },
  ).observe(frame);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  measure();
  new ResizeObserver(measure).observe(frame);
  addEventListener('resize', measure);
  void document.fonts.ready.then(measure);

  onScroll((y) => {
    const p = (y - top) / stepH;
    go(Math.max(0, Math.min(n - 1, Math.round(p))));
  });
  controls();
}
