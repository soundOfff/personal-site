/**
 * Demo cards: play at half in view, on hover and on focus; pause offscreen.
 * The bottom edge of each pixel frame is the timeline, one segment per chapter,
 * filling a whole cell at a time.
 */
const CELL = 20;

export function initDemos(root: HTMLElement) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const cards = [...root.querySelectorAll<HTMLElement>('[data-demo]')];

  const controllers = cards.map((card) => {
    const video = card.querySelector('video')!;
    const chapters = JSON.parse(card.dataset.chapters!) as { t: number; end: number; label: string }[];
    const label = card.querySelector<HTMLElement>('[data-chapter-label]')!;
    const count = card.querySelector<HTMLElement>('[data-chapter-count]')!;
    const segments = [...card.querySelectorAll<HTMLButtonElement>('[data-seek]')];
    const fills = segments.map((s) => s.querySelector<HTMLElement>('i')!);
    const toggle = card.querySelector<HTMLButtonElement>('[data-toggle]')!;
    const overlay = card.querySelector<HTMLButtonElement>('[data-play]')!;
    const total = String(chapters.length).padStart(2, '0');

    let inView = false;
    let hover = false;
    let focus = false;
    let userPaused = false;
    let userPlayed = false;
    let current = -1;
    let frame = 0;
    video.muted = true;

    const wanted = () =>
      !document.hidden &&
      !userPaused &&
      (inView || hover || focus) &&
      (!reduce.matches || userPlayed);

    function render() {
      const t = video.currentTime;
      const index = Math.max(0, chapters.findLastIndex((c) => t >= c.t - 0.05));
      if (index !== current) {
        current = index;
        label.textContent = chapters[index].label;
        count.textContent = `${String(index + 1).padStart(2, '0')}/${total}`;
        segments.forEach((s, i) => s.toggleAttribute('data-current', i === index));
      }
      chapters.forEach((c, i) => {
        const width = segments[i].clientWidth;
        const share = Math.min(1, Math.max(0, (t - c.t) / (c.end - c.t)));
        const cellsWide = Math.max(1, Math.round(width / CELL));
        const filled = i < index ? cellsWide : i > index ? 0 : Math.floor(share * cellsWide + 0.0001);
        fills[i].style.width = `${(filled / cellsWide) * 100}%`;
      });
    }

    function loop() {
      render();
      frame = video.paused ? 0 : requestAnimationFrame(loop);
    }

    function sync() {
      const playing = !video.paused;
      if (wanted() && !playing) {
        video.play().catch(() => {});
      } else if (!wanted() && playing) {
        video.pause();
      }
    }

    function paint() {
      const playing = !video.paused;
      card.dataset.state = playing ? 'playing' : userPaused || reduce.matches ? 'stopped' : 'idle';
      toggle.textContent = playing ? 'Pause' : 'Play';
      if (playing && !frame) frame = requestAnimationFrame(loop);
    }

    video.addEventListener('play', paint);
    video.addEventListener('playing', paint);
    video.addEventListener('pause', () => {
      cancelAnimationFrame(frame);
      frame = 0;
      render();
      paint();
    });
    video.addEventListener('seeked', render);
    video.addEventListener('loadedmetadata', render);

    card.addEventListener('pointerenter', () => ((hover = true), sync()));
    card.addEventListener('pointerleave', () => ((hover = false), sync()));
    card.addEventListener('focusin', () => ((focus = true), sync()));
    card.addEventListener('focusout', (e) => {
      if (card.contains(e.relatedTarget as Node)) return;
      focus = false;
      sync();
    });

    function start() {
      userPaused = false;
      userPlayed = true;
      video.play().catch(() => {});
    }
    const flip = () => {
      if (video.paused) start();
      else {
        userPaused = true;
        video.pause();
      }
    };
    toggle.addEventListener('click', flip);
    video.addEventListener('click', flip);
    overlay.addEventListener('click', start);
    const preview = (i: number | null) => {
      label.textContent = chapters[i ?? Math.max(0, current)].label;
      label.toggleAttribute('data-preview', i !== null && i !== current);
    };
    segments.forEach((s, i) => {
      s.addEventListener('pointerenter', () => preview(i));
      s.addEventListener('pointerleave', () => preview(null));
      s.addEventListener('focus', () => preview(i));
      s.addEventListener('blur', () => preview(null));
    });
    segments.forEach((s, i) =>
      s.addEventListener('click', () => {
        video.currentTime = chapters[i].t + 0.01;
        render();
        preview(null);
        if (video.paused && !userPaused && (!reduce.matches || userPlayed)) start();
      }),
    );

    render();
    paint();
    return {
      card,
      setInView(value: boolean) {
        inView = value;
        sync();
      },
      sync,
      paint,
    };
  });

  const byCard = new Map(controllers.map((c) => [c.card.querySelector('.a3-screen')!, c]));
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => byCard.get(e.target)?.setInView(e.intersectionRatio >= 0.5)),
    { threshold: [0, 0.5, 1] },
  );
  byCard.forEach((_, el) => io.observe(el));
  document.addEventListener('visibilitychange', () => controllers.forEach((c) => c.sync()));
  reduce.addEventListener('change', () => controllers.forEach((c) => (c.sync(), c.paint())));
}
