import type { ReelContext } from './types';

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const p = clamp(n);
  return p * p * (3 - 2 * p);
};

/** A small scroll clock. Each film interprets the phases with its own composition. */
export function mountCamera(ctx: ReelContext): () => void {
  const track = document.querySelector<HTMLElement>('[data-camera]');
  const pin = track?.querySelector<HTMLElement>('.camera-pin');
  const scene = track?.querySelector<HTMLElement>(`[data-opening='${ctx.reel.id}']`);
  if (!track || !pin || !scene || scene.dataset.openingMode === 'flow') return () => {};
  const frame = pin.querySelector<HTMLElement>('.camera-frame')!;
  const progress = pin.querySelector<HTMLElement>('.camera-progress > span');
  const on = { passive: true, signal: ctx.signal };
  let top = 0,
    travel = 1,
    queued = 0,
    dirty = true,
    visible = false;
  const paint = () => {
    queued = 0;
    if (ctx.signal.aborted || document.hidden) return;
    if (dirty) {
      const rect = track.getBoundingClientRect();
      top = rect.top + window.scrollY - (parseFloat(getComputedStyle(pin).top) || 0);
      travel = Math.max(1, track.offsetHeight - pin.clientHeight);
      dirty = false;
    }
    const p = ctx.reducedMotion ? 0 : clamp((window.scrollY - top) / travel);
    const cut =
      ctx.reel.id === 'br2049'
        ? smooth((p - 0.42) / 0.22)
        : ctx.reel.id === 'odyssey'
          ? smooth((p - 0.38) / 0.3)
          : 0;
    scene.style.setProperty('--shot-p', p.toFixed(4));
    scene.style.setProperty('--shot-a', smooth((p - 0.05) / 0.62).toFixed(4));
    scene.style.setProperty('--shot-b', smooth((p - 0.38) / 0.62).toFixed(4));
    scene.style.setProperty('--shot-cut', cut.toFixed(4));
    frame.style.setProperty('--scroll-hint', (1 - smooth(p / 0.25)).toFixed(4));
    if (progress) progress.style.transform = `scaleX(${p.toFixed(4)})`;
  };
  const schedule = () => {
    if (!queued && visible && !document.hidden && !ctx.signal.aborted)
      queued = requestAnimationFrame(paint);
  };
  const invalidate = () => {
    dirty = true;
    schedule();
  };
  const io = new IntersectionObserver(([entry]) => {
    if (ctx.signal.aborted) return;
    visible = entry.isIntersecting;
    scene.classList.toggle('is-camera-live', visible && !ctx.reducedMotion && !document.hidden);
    if (visible) invalidate();
  });
  const ro = new ResizeObserver(invalidate);
  io.observe(track);
  ro.observe(track);
  ro.observe(pin);
  window.addEventListener('scroll', schedule, on);
  window.addEventListener('resize', invalidate, on);
  window.addEventListener('pageshow', invalidate, on);
  document.addEventListener(
    'visibilitychange',
    () => {
      scene.classList.toggle('is-camera-live', visible && !ctx.reducedMotion && !document.hidden);
      invalidate();
    },
    { signal: ctx.signal },
  );
  document.fonts.ready.then(() => {
    if (!ctx.signal.aborted) invalidate();
  });
  paint();
  return () => {
    cancelAnimationFrame(queued);
    io.disconnect();
    ro.disconnect();
    scene.removeAttribute('style');
    scene.classList.remove('is-camera-live');
    frame.style.removeProperty('--scroll-hint');
    progress?.removeAttribute('style');
  };
}
