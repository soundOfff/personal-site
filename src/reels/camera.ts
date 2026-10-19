import type { ReelContext } from './types';

type Shot = { ratio: number; endRatio: number; zoom: number; x: number; y: number };
const SHOTS: Record<string, Shot> = {
  parasite: { ratio: 2.39, endRatio: 1.85, zoom: 1.9, x: -9, y: -3 },
  mood: { ratio: 1.66, endRatio: 2.35, zoom: 1.7, x: -12, y: 2 },
  br2049: { ratio: 2.39, endRatio: 1.85, zoom: 1.8, x: -3, y: -5 },
  budapest: { ratio: 1.37, endRatio: 2.35, zoom: 2.8, x: 0, y: -14 },
  odyssey: { ratio: 2.2, endRatio: 1.66, zoom: 2.1, x: -14, y: -3 },
};
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const p = clamp(n);
  return p * p * (3 - 2 * p);
};

/** Event-driven camera. One visible shot, one frame per scroll event, no perpetual render loop. */
export function mountCamera(ctx: ReelContext): () => void {
  const shot = SHOTS[ctx.reel.id];
  const track = document.querySelector<HTMLElement>('[data-camera]');
  const pin = track?.querySelector<HTMLElement>('.camera-pin');
  if (!track || !pin || !shot) return () => {};
  const frame = pin.querySelector<HTMLElement>('.camera-frame')!;
  const ratioLabel = pin.querySelector<HTMLElement>(
    `[data-camera-ratio][data-camera-film='${ctx.reel.id}']`,
  );
  let top = 0,
    travel = 1,
    width = 1,
    height = 1,
    mobile = false;
  let queued = 0,
    dirty = true,
    visible = false,
    previousRatio = '';
  const on = { passive: true, signal: ctx.signal };

  const measure = () => {
    // All geometry reads precede writes and remain cached until the layout changes.
    const r = track.getBoundingClientRect();
    top = r.top + window.scrollY - (parseFloat(getComputedStyle(pin).top) || 0);
    height = pin.clientHeight;
    width = pin.clientWidth;
    travel = Math.max(1, track.offsetHeight - height);
    mobile = width < 700;
    const initialRatio = mobile ? 0.86 : shot.ratio;
    const copyInset = Math.max(0, (width - height * initialRatio) / 2) + width * 0.05;
    frame.style.setProperty('--camera-copy-inset', `${copyInset.toFixed(1)}px`);
    dirty = false;
  };
  const paint = () => {
    queued = 0;
    if (ctx.signal.aborted || document.hidden) return;
    if (dirty) measure();
    const p = ctx.reducedMotion ? 0 : clamp((window.scrollY - top) / travel);
    const dolly = smooth((p - 0.08) / 0.86);
    // Anderson's three eras: Academy → scope → 1.85. Other films breathe into a second framing.
    let ratio = shot.ratio + (shot.endRatio - shot.ratio) * smooth((p - 0.12) / 0.62);
    if (ctx.reel.id === 'budapest') ratio += (1.85 - shot.endRatio) * smooth((p - 0.72) / 0.28);
    // Portrait screens use a taller crop rather than shrinking the set into a tiny strip.
    if (mobile) ratio = 0.86 + (ratio / shot.ratio - 1) * 0.3;
    const frameWidth = Math.min(width, height * ratio);
    const frameHeight = Math.min(height, width / ratio);
    const barX = Math.max(0, (width - frameWidth) / 2);
    const barY = Math.max(0, (height - frameHeight) / 2);
    frame.style.setProperty('--camera-bar-x', `${barX.toFixed(1)}px`);
    frame.style.setProperty('--camera-bar-y', `${barY.toFixed(1)}px`);
    frame.style.setProperty(
      '--camera-zoom',
      (1 + (shot.zoom - 1) * dolly * (mobile ? 0.65 : 1)).toFixed(4),
    );
    frame.style.setProperty('--camera-x', `${(shot.x * dolly).toFixed(3)}%`);
    frame.style.setProperty('--camera-y', `${(shot.y * dolly).toFixed(3)}%`);
    frame.style.setProperty('--camera-type-y', `${(-70 * dolly).toFixed(2)}px`);
    frame.style.setProperty('--camera-type-opacity', (1 - smooth((p - 0.06) / 0.34)).toFixed(3));
    frame.style.setProperty('--camera-near', (1 + dolly * 3.5).toFixed(4));
    frame.style.setProperty('--camera-progress', p.toFixed(4));
    frame.style.setProperty(
      '--camera-closer',
      (smooth((p - 0.7) / 0.18) * (1 - smooth((p - 0.94) / 0.06))).toFixed(3),
    );
    const label = `${ratio.toFixed(2)}:1`;
    if (ratioLabel && label !== previousRatio) {
      ratioLabel.textContent = label;
      previousRatio = label;
    }
  };
  const schedule = () => {
    if (!queued && visible && !document.hidden) queued = requestAnimationFrame(paint);
  };
  const invalidate = () => {
    dirty = true;
    schedule();
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    frame.classList.toggle('is-camera-live', visible && !ctx.reducedMotion);
    if (visible) {
      dirty = true;
      schedule();
    }
  });
  io.observe(track);
  const ro = new ResizeObserver(invalidate);
  ro.observe(track);
  ro.observe(pin);
  window.addEventListener('scroll', schedule, on);
  window.addEventListener('resize', invalidate, on);
  window.addEventListener('pageshow', invalidate, on);
  document.addEventListener('visibilitychange', invalidate, { signal: ctx.signal });
  document.fonts.ready.then(() => {
    if (!ctx.signal.aborted) invalidate();
  });
  paint();
  return () => {
    cancelAnimationFrame(queued);
    io.disconnect();
    ro.disconnect();
    frame.removeAttribute('style');
    frame.classList.remove('is-camera-live');
    if (ratioLabel) ratioLabel.textContent = '';
  };
}
