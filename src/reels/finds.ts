import type { ReelContext } from './types';

/** One visible film prop, one event-driven frame. No idle JavaScript animation loop. */
export function mountFilmFind(ctx: ReelContext): () => void {
  const prop = document.querySelector<HTMLElement>(`[data-film-find='${ctx.reel.id}']`);
  const hero = document.getElementById('readme');
  if (!prop || !hero) return () => {};
  const zone = document.querySelector<HTMLElement>(prop.dataset.findZone ?? '#readme') ?? hero;
  const projector = document.querySelector<HTMLElement>('[data-projector]');
  const { signal } = ctx;
  const options = { signal, passive: true };
  let visible = false;
  let bounds: DOMRect | null = null;
  let frame = 0;
  let scanTimer = 0;
  let beamAnimation: Animation | undefined;
  let px = 0;
  let py = 0;
  let active = false;

  const rest = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    prop.classList.remove('is-pointing');
    prop.style.removeProperty('--find-x');
    prop.style.removeProperty('--find-y');
  };
  const sync = () => {
    active =
      visible &&
      !document.hidden &&
      !projector?.dataset.state &&
      !ctx.root.hasAttribute('data-boxoffice');
    prop.classList.toggle('is-live', active);
    if (!active) rest();
  };
  const resize = new ResizeObserver(() => {
    bounds = null;
  });
  resize.observe(zone);
  const viewport = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? false;
      bounds = null;
      sync();
    },
    { threshold: 0.05 },
  );
  viewport.observe(zone);
  const cover = new MutationObserver(sync);
  if (projector) cover.observe(projector, { attributes: true, attributeFilter: ['data-state'] });
  cover.observe(ctx.root, { attributes: true, attributeFilter: ['data-boxoffice'] });
  document.addEventListener('visibilitychange', sync, { signal });
  window.addEventListener(
    'scroll',
    () => {
      bounds = null;
      rest();
    },
    options,
  );

  if (!ctx.reducedMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const paint = () => {
      frame = 0;
      if (!active) return;
      bounds ??= zone.getBoundingClientRect();
      if (px < bounds.left || px > bounds.right || py < bounds.top || py > bounds.bottom) {
        rest();
        return;
      }
      const x = Math.max(-1, Math.min(1, ((px - bounds.left) / bounds.width) * 2 - 1));
      const y = Math.max(-1, Math.min(1, ((py - bounds.top) / bounds.height) * 2 - 1));
      prop.style.setProperty('--find-x', x.toFixed(3));
      prop.style.setProperty('--find-y', y.toFixed(3));
      prop.classList.add('is-pointing');
    };
    hero.addEventListener(
      'pointermove',
      (event) => {
        if (!active || event.pointerType !== 'mouse') return;
        px = event.clientX;
        py = event.clientY;
        if (!frame) frame = requestAnimationFrame(paint);
      },
      options,
    );
    hero.addEventListener('pointerleave', rest, options);
  }

  const action =
    prop instanceof HTMLButtonElement ? prop : prop.querySelector<HTMLButtonElement>('button');
  if (action) {
    action.addEventListener(
      'click',
      () => {
        if (prop.dataset.findAction === 'flip') {
          const flipped = prop.classList.toggle('is-flipped');
          action.setAttribute('aria-pressed', String(flipped));
          return;
        }
        prop.classList.remove('is-scanning');
        if (ctx.reducedMotion) return;
        // Native animation restarts without a synchronous layout read.
        const beam = prop.querySelector<HTMLElement>('.br-retina-beam');
        beamAnimation?.cancel();
        beamAnimation = beam?.animate(
          [
            { transform: 'translateY(-90px)', opacity: 0 },
            { opacity: 1, offset: 0.2 },
            { opacity: 1, offset: 0.8 },
            { transform: 'translateY(90px)', opacity: 0 },
          ],
          { duration: 1400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        );
        prop.classList.add('is-scanning');
        window.clearTimeout(scanTimer);
        scanTimer = window.setTimeout(() => prop.classList.remove('is-scanning'), 1400);
      },
      { signal },
    );
  }

  return () => {
    rest();
    window.clearTimeout(scanTimer);
    viewport.disconnect();
    resize.disconnect();
    cover.disconnect();
    beamAnimation?.cancel();
    prop.classList.remove('is-live', 'is-flipped', 'is-scanning');
    action?.setAttribute('aria-pressed', 'false');
  };
}
