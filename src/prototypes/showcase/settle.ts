// Directional section settle, used instead of CSS scroll snapping.
//
// Measured on this page in Chrome: with `scroll-snap-type: y proximity`, slow mouse-wheel notches
// (100 px, 150 ms apart) are pulled back to the same snap point every time wherever snap points sit
// less than a viewport apart (product rows, stage steps, rooms), and the 200svh cover's bottom edge
// becomes a snap position that rests on a blank screen. This helper never pulls against the
// visitor's direction: once scrolling stops, if a snap target lies a short way ahead in the
// direction they were moving, it glides there. Otherwise it leaves the page where they put it.
//
// Targets are the elements a variant already marks with `scroll-snap-align` (start or center),
// so each variant keeps its snap points in CSS and only the mechanism changes.

const REACH = 0.3; // of the viewport height

function targetsOf(root: HTMLElement): HTMLElement[] {
  const main = root.closest('main') ?? document.body;
  return [...main.querySelectorAll<HTMLElement>('*')].filter((el) => {
    if (el.closest('.cover')) return false;
    const align = getComputedStyle(el).scrollSnapAlign;
    return !!align && !align.startsWith('none');
  });
}

function positionOf(el: HTMLElement): number {
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const top = rect.top + scrollY;
  if (style.scrollSnapAlign.startsWith('center')) return top + rect.height / 2 - innerHeight / 2;
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const margin = parseFloat(style.scrollMarginTop) || 0;
  return top - padding - margin;
}

export function initSettle(root: HTMLElement) {
  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const enabled = () => !reduced.matches && innerHeight >= 640;
  const sync = () => (html.dataset.settle = enabled() ? 'on' : 'off');
  sync();
  reduced.addEventListener('change', sync);
  addEventListener('resize', sync, { passive: true });

  let last = scrollY;
  let direction = 0;
  let gliding = false;
  let timer = 0;

  const settle = () => {
    if (gliding) {
      gliding = false;
      return;
    }
    if (!enabled() || !direction) return;
    const y = scrollY;
    const reach = innerHeight * REACH;
    const ahead = targetsOf(root)
      .map(positionOf)
      .filter((p) => (direction > 0 ? p > y + 2 && p - y <= reach : p < y - 2 && y - p <= reach));
    if (!ahead.length) return;
    const top = direction > 0 ? Math.min(...ahead) : Math.max(...ahead);
    gliding = true;
    scrollTo({ top: Math.max(0, Math.round(top)), behavior: 'smooth' });
  };

  addEventListener(
    'scroll',
    () => {
      const y = scrollY;
      if (y !== last) direction = Math.sign(y - last);
      last = y;
      if (!('onscrollend' in window)) {
        clearTimeout(timer);
        timer = window.setTimeout(settle, 160);
      }
    },
    { passive: true },
  );
  if ('onscrollend' in window) addEventListener('scrollend', settle);
  // A click during a glide is the visitor taking over.
  addEventListener('pointerdown', () => (gliding = false), { passive: true });
}
