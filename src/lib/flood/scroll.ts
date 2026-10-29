/** One scroll read per frame, shared by every surface that reacts to scrolling. */

type Listener = (y: number) => void;

const listeners = new Set<Listener>();
let scheduled = false;

function tick() {
  scheduled = false;
  const y = window.scrollY;
  listeners.forEach((listener) => listener(y));
}

addEventListener(
  'scroll',
  () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(tick);
  },
  { passive: true },
);

export function onScroll(listener: Listener) {
  listeners.add(listener);
  listener(window.scrollY);
  return () => listeners.delete(listener);
}

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
