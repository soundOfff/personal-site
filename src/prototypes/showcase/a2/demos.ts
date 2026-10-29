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
    const segs = [...card.querySelectorAll<HTMLButtonElement>('.seg')];
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
    let current = -1;
    let previewing = false;

    const near = () => inView || hover || focus;
    const shouldPlay = () =>
      near() &&
      !document.hidden &&
      (intent === 'playing' || (intent === 'auto' && !reducedMotion.matches));

    const sync = () => {
      card.dataset.hold = String(
        intent === 'paused' || (intent === 'auto' && reducedMotion.matches),
      );
      if (shouldPlay()) {
        if (video.paused) video.play().catch(() => {});
      } else if (!video.paused) video.pause();
    };
    syncs.push(sync);

    const show = (j: number) => {
      if (previewing) return;
      num.textContent = `${String(j + 1).padStart(2, '0')}/${total}`;
      label.textContent = chapters[j].label;
    };

    const paint = () => {
      const time = video.currentTime;
      let j = 0;
      chapters.forEach((c, i) => time >= c.t - 0.05 && (j = i));
      if (j !== current) {
        current = j;
        show(j);
        segs.forEach((s, i) => s.toggleAttribute('aria-current', i === j));
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

    toggle.addEventListener('click', () => {
      if (video.paused) playNow();
      else {
        intent = 'paused';
        sync();
      }
    });
    big.addEventListener('click', playNow);

    segs.forEach((s, i) => {
      s.addEventListener('click', () => {
        video.currentTime = chapters[i].t + 0.01;
        paint();
        if (video.paused && intent !== 'paused' && !reducedMotion.matches) playNow();
      });
      s.addEventListener('pointerenter', () => {
        if (!hoverable.matches) return;
        previewing = false;
        num.textContent = `${String(i + 1).padStart(2, '0')}/${total}`;
        label.textContent = chapters[i].label;
        caption.dataset.preview = '';
        previewing = true;
      });
      s.addEventListener('pointerleave', () => {
        previewing = false;
        delete caption.dataset.preview;
        if (current >= 0) show(current);
      });
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

    sync();
  }

  document.addEventListener('visibilitychange', () => syncs.forEach((s) => s()));
  reducedMotion.addEventListener('change', () => syncs.forEach((s) => s()));
}
