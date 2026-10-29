/**
 * The home cover. A cave floods from a seed in BFS order, an amber shortest
 * path follows the pointer, and scrolling drains the cave into a ✳ that docks
 * in the header wordmark. Coming back to the top re-blooms it.
 *
 * Choreography is a pure function of time and `scrub` (0..1 of the first
 * viewport scrolled), so scrolling back reverses it exactly.
 */
import { GLYPH, PALETTE, bfs, draw, grid, hash, nearest, path, size, type Grid } from './pixels';
import { onScroll, reducedMotion } from './scroll';

const INTRO_MS = 1200;
const RIPPLE_MS = 600;
/** Idle cells flip tone on this beat; frames are only drawn when it ticks. */
const BEAT_MS = 680;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (t: number) => t * t * (3 - 2 * t);

export function initCover() {
  const cover = document.querySelector<HTMLElement>('.cover');
  if (!cover) return;
  const canvas = cover.querySelector<HTMLCanvasElement>('.cover-canvas')!;
  const stage = cover.querySelector<HTMLElement>('.cover-sticky')!;
  const words = [...cover.querySelectorAll<HTMLElement>('.hero-word')];
  const fading = [
    ...cover.querySelectorAll<HTMLElement>('.hero-kicker, .hero-bottom, .cover-index'),
  ];
  const bottom = cover.querySelector<HTMLElement>('.hero-bottom')!;
  const hint = cover.querySelector<HTMLElement>('.cover-hint')!;
  const glyph = document.querySelector<HTMLElement>('.dock-glyph')!;
  const brand = document.querySelector<HTMLElement>('.brand-star')!;
  const header = document.querySelector<HTMLElement>('#header')!;
  const slots = GLYPH.flatMap((row, y) =>
    [...row].flatMap((bit, x) => (bit === '1' ? [{ x, y }] : [])),
  );

  let ctx: CanvasRenderingContext2D;
  let g: Grid | undefined;
  let frameId = 0;
  let timer = 0;
  let visible = true;
  let start = performance.now();
  let rippleStart = -10000;
  let trace: number[] = [];
  let scrub = 0;
  let scrollY = window.scrollY;
  let leftTop = false;
  let lastBeat = -1;
  let dirty = true;
  let pointer: { clientX: number; clientY: number } | null = null;
  let pointerType = 'mouse';
  let lastTap: { time: number; x: number; y: number } | null = null;
  // The cells closest to the seed are the ones that become the ✳.
  let assembly: number[] = [];
  let assemblySet = new Set<number>();

  const still = () => reducedMotion.matches;

  function collect() {
    assembly = Array.from(g!.order)
      .filter((i) => !g!.mask[i])
      .slice(0, slots.length);
    assemblySet = new Set(assembly);
  }

  function setHint(type: string) {
    hint.textContent =
      type === 'touch'
        ? 'Tap to trace a path. Double-tap to restart.'
        : 'Move to explore. Click or press R to restart.';
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    ctx = size(canvas, rect.width, rect.height);
    // Text sits in paper clearings carved out of the cave.
    const clear = [
      ...cover!.querySelectorAll(
        '.hero-line, .hero-kicker, .hero-summary, .hero-controls, .cover-index',
      ),
    ].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - rect.left,
        right: r.right - rect.left,
        top: r.top - rect.top,
        bottom: r.bottom - rect.top,
      };
    });
    g = grid(rect.width, rect.height, hash('tomas-flood-fill-29'), 20, clear);
    trace = [];
    collect();
    applyScroll(scrollY);
    resume();
  }

  function render(now: number) {
    if (!g) return;
    const intro = still() ? 1 : clamp((now - start) / INTRO_MS);
    const drain = still() ? 1 : clamp(1 - scrub / 0.45);
    const ripple = (now - rippleStart) / RIPPLE_MS;
    const assembling = !still() && scrub >= 0.3 && scrub < 0.55;
    draw(ctx, g, {
      progress: intro * drain,
      time: still() ? 0 : now,
      path: trace,
      ripple: ripple >= 0 && ripple < 1 ? ripple : -1,
      excluded: assembling ? assemblySet : null,
    });
    if (assembling) {
      // The seed's nearest cells slide into the ✳ around the seed.
      const ease = smooth(clamp((scrub - 0.3) / 0.25));
      const cx = ((g.seed % g.cols) + 0.5) * g.cell;
      const cy = (Math.floor(g.seed / g.cols) + 0.5) * g.cell;
      ctx.fillStyle = PALETTE.blue;
      assembly.forEach((i, n) => {
        const slot = slots[n];
        const x = (i % g!.cols) * g!.cell;
        const y = Math.floor(i / g!.cols) * g!.cell;
        ctx.fillRect(
          x + (cx + (slot.x - 3.5) * g!.cell - x) * ease,
          y + (cy + (slot.y - 3.5) * g!.cell - y) * ease,
          g!.cell,
          g!.cell,
        );
      });
    }
    lastBeat = Math.floor(now / BEAT_MS);
    dirty = false;
  }

  function frame(now: number) {
    frameId = 0;
    if (!visible || document.hidden || !g) return;
    if (pointer) {
      const t = cellAt(pointer);
      trace = path(g, nearest(g, t.x, t.y));
      pointer = null;
      dirty = true;
    }
    const animating = !still() && (now - start < INTRO_MS || now - rippleStart < RIPPLE_MS);
    if (dirty || animating || (!still() && Math.floor(now / BEAT_MS) !== lastBeat)) render(now);
    if (animating) frameId = requestAnimationFrame(frame);
    else if (!still()) {
      timer = window.setTimeout(
        () => {
          timer = 0;
          resume();
        },
        BEAT_MS - (now % BEAT_MS) + 1,
      );
    }
  }

  function resume() {
    clearTimeout(timer);
    timer = 0;
    cancelAnimationFrame(frameId);
    frameId = 0;
    if (visible && !document.hidden) frameId = requestAnimationFrame(frame);
  }

  function reseed(index?: number) {
    if (!g) return;
    if (index !== undefined && g.open[index] && !g.mask[index]) bfs(g, index);
    collect();
    start = performance.now();
    rippleStart = -10000;
    trace = [];
    dirty = true;
    applyScroll(scrollY);
    resume();
  }

  function replay() {
    leftTop = false;
    reseed();
    cover!.classList.remove('playing');
    void cover!.offsetWidth;
    cover!.classList.add('playing');
  }

  function cellAt(event: { clientX: number; clientY: number }) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / g!.cell);
    const y = Math.floor((event.clientY - rect.top) / g!.cell);
    return { x, y, index: y * g!.cols + x };
  }

  function move(event: { clientX: number; clientY: number }) {
    if (still() || scrub > 0.3) return;
    pointer = { clientX: event.clientX, clientY: event.clientY };
    resume();
  }

  function click(event: MouseEvent) {
    if (!g) return;
    const t = cellAt(event);
    if (pointerType === 'touch') {
      const now = performance.now();
      const doubleTap =
        lastTap &&
        now - lastTap.time < 350 &&
        Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 30;
      if (doubleTap) {
        pointer = null;
        reseed(nearest(g, t.x, t.y));
        lastTap = null;
      } else {
        lastTap = { time: now, x: event.clientX, y: event.clientY };
        move(event);
      }
      return;
    }
    if (g.open[t.index] && !g.mask[t.index]) reseed(t.index);
    else move(event);
  }

  function key(event: KeyboardEvent) {
    if (!g || event.key.toLowerCase() !== 'r' || event.ctrlKey || event.metaKey || event.altKey)
      return;
    if (
      scrollY >= stage.clientHeight ||
      /INPUT|TEXTAREA|SELECT/.test((event.target as Element).tagName)
    )
      return;
    if ((event.target as HTMLElement).isContentEditable) return;
    const candidates = Array.from(g.order).filter((i) => !g!.mask[i]);
    reseed(candidates[Math.floor(Math.random() * candidates.length)]);
  }

  function applyScroll(y: number) {
    scrollY = y;
    if (!g) return;
    scrub = still() ? 0 : clamp(y / stage.clientHeight);
    if (scrub > 0.9) leftTop = true;
    if (scrub < 0.01 && leftTop) {
      leftTop = false;
      rippleStart = performance.now();
      resume();
    }

    words.forEach(
      (word, i) =>
        (word.style.opacity = still() ? '1' : String(clamp(1 - scrub * (2.2 + i * 0.5)))),
    );
    fading.forEach((el) => (el.style.opacity = String(clamp(1 - scrub * 3))));
    bottom.style.pointerEvents = scrub > 0.2 ? 'none' : '';

    // After assembling, the ✳ flies from the seed to the header and docks.
    const flight = clamp((scrub - 0.55) / 0.45);
    const flying = !still() && scrub >= 0.55 && scrub < 1;
    glyph.style.opacity = flying ? '1' : '0';
    brand.style.opacity = !still() && scrub >= 0.3 && scrub < 1 ? '0' : '1';
    if (flying) {
      const dock = brand.querySelector('svg')!.getBoundingClientRect();
      const rect = stage.getBoundingClientRect();
      const side = g.cell * 7 + (dock.width - g.cell * 7) * flight;
      const cx = rect.left + ((g.seed % g.cols) + 0.5) * g.cell;
      const cy = rect.top + (Math.floor(g.seed / g.cols) + 0.5) * g.cell;
      glyph.style.width = glyph.style.height = `${side}px`;
      glyph.style.left = `${cx * (1 - flight) + (dock.left + dock.width / 2) * flight - side / 2}px`;
      glyph.style.top = `${cy * (1 - flight) + (dock.top + dock.height / 2) * flight - side / 2}px`;
    }
    dirty = true;
    if (visible) render(performance.now());
  }

  setHint(matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse');
  canvas.addEventListener('pointerdown', (event) => {
    pointerType = event.pointerType;
    setHint(pointerType);
  });
  canvas.addEventListener('pointermove', (event) => event.pointerType !== 'touch' && move(event));
  canvas.addEventListener('click', click);
  canvas.addEventListener('pointerleave', () => {
    if (pointerType === 'touch') return;
    trace = [];
    pointer = null;
    dirty = true;
    resume();
  });
  addEventListener('keydown', key);
  document.addEventListener('visibilitychange', resume);
  // The header ✳ scrolls back to the top and replays the whole intro.
  brand.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'instant' });
    replay();
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    dirty = true;
    resume();
  }).observe(stage);
  new ResizeObserver(resize).observe(stage);
  onScroll(applyScroll);
  void document.fonts.ready.then(resize);

  if (!still()) {
    header.animate(
      [
        { opacity: 0, translate: '0 -15px' },
        { opacity: 1, translate: '0 0' },
      ],
      { duration: 500, delay: 900, fill: 'backwards', easing: 'cubic-bezier(.22,1,.36,1)' },
    );
  }
}
