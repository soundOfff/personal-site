/**
 * Directional section settle, used instead of CSS scroll snapping.
 *
 * With `scroll-snap-type: y proximity`, slow wheel notches are pulled back to the same snap
 * point wherever targets sit less than a viewport apart, and the 200svh cover's bottom edge
 * becomes a resting place on a blank screen. This never pulls against the reader. Once
 * scrolling stops, if a target lies a short way ahead in the direction they were moving, the
 * page glides there. Otherwise it stays where they put it.
 *
 * Targets are the `[data-settle]` elements. flood.css gives them `scroll-snap-align` under the
 * same media query, and each lands at its `scroll-margin-top` like an anchor jump.
 */

/** How far ahead a target may be, as a share of the viewport height. */
const REACH = 0.3;

function landing(target: HTMLElement): number {
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  return target.getBoundingClientRect().top + scrollY - padding - margin;
}

export function initSettle() {
  const enabled = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 640px)');
  const targets = [...document.querySelectorAll<HTMLElement>('[data-settle]')];
  // Where the last scroll came to rest. The next one moved in the direction of its net change.
  let rest = scrollY;
  let gliding = false;

  function settle() {
    const y = scrollY;
    const direction = Math.sign(y - rest);
    rest = y;
    // The scroll that ends here was our own glide.
    if (gliding) {
      gliding = false;
      return;
    }
    if (!enabled.matches || !direction) return;
    const reach = innerHeight * REACH;
    const ahead = targets
      .map(landing)
      .filter((p) => (direction > 0 ? p > y + 2 && p - y <= reach : p < y - 2 && y - p <= reach));
    if (!ahead.length) return;
    gliding = true;
    const top = direction > 0 ? Math.min(...ahead) : Math.max(...ahead);
    scrollTo({ top: Math.max(0, Math.round(top)), behavior: 'smooth' });
  }

  if ('onscrollend' in window) addEventListener('scrollend', settle);
  else {
    let timer = 0;
    const later = () => {
      clearTimeout(timer);
      timer = window.setTimeout(settle, 160);
    };
    addEventListener('scroll', later, { passive: true });
  }
  // A click during a glide is the reader taking over.
  addEventListener('pointerdown', () => (gliding = false), { passive: true });
}
