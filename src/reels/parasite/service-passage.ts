import type { ReelContext } from '../types';

export function mountServicePassage(ctx: ReelContext): () => void {
  const details = document.querySelector<HTMLDetailsElement>(
    '[data-opening="parasite"] details[data-opening-disclosure]',
  );
  const summary = details?.querySelector('summary');
  const passage = details?.querySelector<HTMLElement>('.ps-under');
  if (!details || !summary || !passage || ctx.signal.aborted) return () => {};

  const listeners = new AbortController();
  let destination: 'open' | 'closed' = 'closed';
  let animation: Animation | null = null;

  const settle = () => {
    animation?.cancel();
    animation = null;
    details.style.removeProperty('height');
    details.open = destination === 'open';
    passage.inert = destination === 'closed';
  };

  const move = (next: typeof destination) => {
    const from = details.getBoundingClientRect().height;
    animation?.cancel();
    animation = null;
    destination = next;
    details.dataset.passageState = next;
    passage.inert = next === 'closed';
    details.open = true;
    details.style.removeProperty('height');
    const to = next === 'open' ? details.offsetHeight : summary.offsetHeight;
    if (ctx.reducedMotion || Math.abs(to - from) < 1) {
      settle();
      return;
    }
    details.style.height = `${from}px`;
    const current = details.animate([{ height: `${from}px` }, { height: `${to}px` }], {
      duration: 520,
      easing: 'cubic-bezier(.22,.75,.18,1)',
      fill: 'both',
    });
    animation = current;
    current.onfinish = () => {
      if (animation === current) settle();
    };
  };

  details.open = false;
  passage.inert = true;
  details.dataset.passageState = 'closed';
  summary.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      move(destination === 'open' ? 'closed' : 'open');
    },
    { signal: listeners.signal },
  );
  details.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape' || destination === 'closed') return;
      event.preventDefault();
      event.stopPropagation();
      summary.focus({ preventScroll: true });
      move('closed');
    },
    { signal: listeners.signal },
  );
  window.addEventListener('resize', settle, { signal: listeners.signal });

  const cleanup = () => {
    listeners.abort();
    ctx.signal.removeEventListener('abort', cleanup);
    destination = 'closed';
    settle();
    passage.inert = false;
    delete details.dataset.passageState;
  };
  ctx.signal.addEventListener('abort', cleanup, { once: true });
  return cleanup;
}
