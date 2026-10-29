import { reducedMotion } from '../../../lib/flood/scroll';

type Intent = 'auto' | 'playing' | 'paused';

const STEP = 10;

export function initDemos(root: HTMLElement) {
  const hoverable = matchMedia('(hover: hover) and (pointer: fine)');
  const cards = [...root.querySelectorAll<HTMLElement>('[data-demo]')];
  const syncs: (() => void)[] = [];

  for (const card of cards) {
    const video = card.querySelector('video')!;
    const toggle = card.querySelector<HTMLButtonElement>('[data-toggle]')!;
    const big = card.querySelector<HTMLButtonElement>('[data-bigplay]')!;
    const rail = card.querySelector<HTMLElement>('.rail')!;
    const segs = [...rail.querySelectorAll<HTMLButtonElement>('.seg')];
    const caption = card.querySelector<HTMLElement>('.caption')!;
    const num = card.querySelector<HTMLElement>('[data-cap-num]')!;
    const label = card.querySelector<HTMLElement>('[data-cap-label]')!;
    const name = card.querySelector('h3')!.textContent!.trim();
    const chapters = segs.map((s) => ({
      t: Number(s.dataset.t),
      end: Number(s.dataset.end),
      label: s.dataset.label!,
    }));
    const total = String(chapters.length).padStart(2, '0');

    let intent: Intent = 'auto';
    let inView = false;
    let hover = false;
    let focus = false;
    let current = 0;
    // The caption names the chapter under the pointer, else the focused one, else the playing one.
    let hovered: number | null = null;
    let focused: number | null = null;

    const near = () => inView || hover || focus;
    const held = () => intent === 'paused' || (intent === 'auto' && reducedMotion.matches);
    const shouldPlay = () =>
      near() &&
      !document.hidden &&
      (intent === 'playing' || (intent === 'auto' && !reducedMotion.matches));

    const sync = () => {
      card.dataset.hold = String(held());
      if (shouldPlay()) {
        if (video.paused) video.play().catch(() => {});
      } else if (!video.paused) video.pause();
    };
    syncs.push(sync);

    const showCaption = () => {
      const j = hovered ?? focused ?? current;
      num.textContent = `${String(j + 1).padStart(2, '0')}/${total}`;
      label.textContent = chapters[j].label;
      caption.toggleAttribute('data-preview', j !== current);
    };

    const mark = (j: number) =>
      segs.forEach((s, i) => (i === j ? s.setAttribute('aria-current', 'true') : s.removeAttribute('aria-current')));
    // One Tab stop per track. Outside the track it follows the playing chapter.
    const rove = (j: number) => segs.forEach((s, i) => (s.tabIndex = i === j ? 0 : -1));

    const paint = () => {
      const time = video.currentTime;
      let j = 0;
      chapters.forEach((c, i) => time >= c.t - 0.05 && (j = i));
      if (j !== current) {
        current = j;
        mark(j);
        if (!rail.contains(document.activeElement)) rove(j);
        showCaption();
      }
      segs.forEach((s, i) => {
        const c = chapters[i];
        const ratio = Math.min(1, Math.max(0, (time - c.t) / (c.end - c.t)));
        const width = s.clientWidth;
        const px = ratio >= 0.999 ? width : Math.floor((ratio * width) / STEP) * STEP;
        s.style.setProperty('--p', `${px}px`);
      });
    };

    const playNow = () => {
      intent = 'playing';
      sync();
    };

    video.addEventListener('timeupdate', paint);
    video.addEventListener('seeked', paint);
    video.addEventListener('loadedmetadata', paint);
    const state = () => {
      const playing = !video.paused;
      card.dataset.playing = String(playing);
      toggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} the ${name} demo`);
    };
    video.addEventListener('play', state);
    video.addEventListener('pause', state);
    state();

    // The two play controls swap places, so keyboard focus moves with them.
    toggle.addEventListener('click', () => {
      if (video.paused) return playNow();
      intent = 'paused';
      sync();
      if (document.activeElement === toggle) big.focus();
    });
    big.addEventListener('click', () => {
      const hadFocus = document.activeElement === big;
      playNow();
      if (hadFocus) toggle.focus();
    });

    segs.forEach((s, i) => {
      s.addEventListener('click', () => {
        rove(i);
        video.currentTime = chapters[i].t + 0.01;
        paint();
        showCaption();
        if (video.paused && intent !== 'paused' && !reducedMotion.matches) playNow();
      });
      s.addEventListener('pointerenter', () => {
        if (!hoverable.matches) return;
        hovered = i;
        showCaption();
      });
      s.addEventListener('pointerleave', () => {
        hovered = null;
        showCaption();
      });
      s.addEventListener('focus', () => {
        focused = i;
        showCaption();
      });
      s.addEventListener('blur', () => {
        focused = null;
        showCaption();
      });
    });

    rail.addEventListener('keydown', (event) => {
      const i = segs.indexOf(event.target as HTMLButtonElement);
      const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: segs.length - 1 }[event.key];
      if (i < 0 || to === undefined) return;
      event.preventDefault();
      const next = segs[(to + segs.length) % segs.length];
      next.focus();
      next.click();
    });

    card.addEventListener('pointerenter', () => {
      if (!hoverable.matches) return;
      hover = true;
      sync();
    });
    card.addEventListener('pointerleave', () => {
      hover = false;
      sync();
    });
    card.addEventListener('focusin', () => {
      focus = true;
      sync();
    });
    card.addEventListener('focusout', (event) => {
      if (card.contains(event.relatedTarget as Node)) return;
      focus = false;
      sync();
    });

    new IntersectionObserver(
      ([entry]) => {
        inView = entry.intersectionRatio >= 0.5;
        // Leaving the view ends a play the visitor asked for; a pause they asked for stays.
        if (!entry.isIntersecting && intent === 'playing') intent = 'auto';
        sync();
      },
      { threshold: [0, 0.5] },
    ).observe(video);

    mark(0);
    sync();
  }

  document.addEventListener('visibilitychange', () => syncs.forEach((s) => s()));
  reducedMotion.addEventListener('change', () => syncs.forEach((s) => s()));
}
