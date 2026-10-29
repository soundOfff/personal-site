/**
 * Route transitions as one wave of cobalt cells: it covers the page from the
 * click point, the browser navigates under the cover, and the next page
 * continues the same wave outward to uncover itself.
 *
 * The inline script in BaseLayout reads ARRIVAL_KEY before first paint and
 * sets `flood-covered` on <html>, so the new page never flashes uncovered.
 */
import { PALETTE, patterns } from './pixels';
import { reducedMotion } from './scroll';
import { ARRIVAL_KEY } from './transition-key';

const CELL = 24;
const PHASE_MS = 320;

interface Point {
  x: number;
  y: number;
}

const canvas = document.querySelector<HTMLCanvasElement>('#transition')!;

function wave(origin: Point, from: number, to: number): Promise<void> {
  const w = innerWidth;
  const h = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 3);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const dither = patterns(ctx)[0];
  const cols = Math.ceil(w / CELL);
  const rows = Math.ceil(h / CELL);
  const sx = Math.max(0, Math.min(cols - 1, Math.floor(origin.x / CELL)));
  const sy = Math.max(0, Math.min(rows - 1, Math.floor(origin.y / CELL)));
  // Manhattan distance to the farthest corner, so the wave always finishes.
  const max =
    Math.max(sx + sy, cols - 1 - sx + sy, sx + rows - 1 - sy, cols - 1 - sx + rows - 1 - sy) + 1;

  // t runs 0..1 while covering and 1..2 while uncovering.
  function paint(t: number) {
    ctx.clearRect(0, 0, w, h);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const d = (Math.abs(x - sx) + Math.abs(y - sy)) / max;
        const covered = t < 1 ? d <= t : d > t - 1;
        if (!covered) continue;
        const edge = (t < 1 ? t - d : d - (t - 1)) * max;
        ctx.fillStyle = edge < 1 ? PALETTE.light : edge < 2 ? dither : PALETTE.blue;
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }

  canvas.classList.add('running');
  paint(from);
  document.documentElement.classList.remove('flood-covered');
  return new Promise((done) => {
    let start: number | null = null;
    function frame(now: number) {
      start ??= now;
      const t = Math.min(to, from + (now - start) / PHASE_MS);
      paint(t);
      if (t < to && !document.hidden) requestAnimationFrame(frame);
      else {
        if (to >= 2) canvas.classList.remove('running');
        done();
      }
    }
    requestAnimationFrame(frame);
  });
}

function center(): Point {
  return { x: innerWidth / 2, y: innerHeight / 2 };
}

function arrival(): Point | null {
  let stored: (Point & { at: number }) | null = null;
  try {
    stored = JSON.parse(sessionStorage.getItem(ARRIVAL_KEY) ?? 'null');
    sessionStorage.removeItem(ARRIVAL_KEY);
  } catch {
    /* storage unavailable: arrive without a wave */
  }
  if (stored && Date.now() - stored.at < 3000) return stored;
  const entry = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  return entry?.type === 'back_forward' ? center() : null;
}

function transitions(link: HTMLAnchorElement, event: MouseEvent): URL | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  if (link.target && link.target !== '_self') return null;
  if (link.hasAttribute('download') || link.dataset.noTransition !== undefined) return null;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return null;
  // Files and machine-readable routes open as they are.
  if (/\.[a-z0-9]+$/i.test(url.pathname)) return null;
  // In-page anchors scroll; they are not route changes.
  if (url.pathname === location.pathname && url.search === location.search) return null;
  return url;
}

export function initTransitions() {
  if (reducedMotion.matches) {
    document.documentElement.classList.remove('flood-covered');
    sessionStorage.removeItem(ARRIVAL_KEY);
    return;
  }

  const point = arrival();
  if (point) void wave(point, 1, 2);
  else document.documentElement.classList.remove('flood-covered');

  let leaving = false;
  document.addEventListener('click', (event) => {
    const link = (event.target as Element).closest?.('a');
    if (!link || leaving || reducedMotion.matches) return;
    const url = transitions(link, event);
    if (!url) return;
    event.preventDefault();
    leaving = true;
    // Keyboard activation has no pointer position; start from the center.
    const origin = event.detail ? { x: event.clientX, y: event.clientY } : center();
    void wave(origin, 0, 1).then(() => {
      try {
        sessionStorage.setItem(ARRIVAL_KEY, JSON.stringify({ ...origin, at: Date.now() }));
      } catch {
        /* the next page simply arrives uncovered */
      }
      location.assign(url);
    });
  });

  // Restored from the back/forward cache while still covered: uncover from the center.
  addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    leaving = false;
    void wave(center(), 1, 2);
  });
}
