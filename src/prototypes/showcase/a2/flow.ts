import { reducedMotion } from '../../../lib/flood/scroll';

type Cell = [number, number];

const WALK = 95;
const DWELL = 900;
const REST = 2200;

/** One amber cell walks the loop, cell by cell, like the cover's shortest path. */
export function initFlow(root: HTMLElement) {
  const section = root.querySelector<HTMLElement>('#workflow');
  const boards = [...root.querySelectorAll<HTMLElement>('[data-board]')];
  if (!section || !boards.length) return;

  let board = boards[0];
  let frames: { cell: Cell; room: string | null; wait: number }[] = [];
  let index = 0;
  let timer = 0;
  let visible = false;

  const build = () => {
    board = boards.find((b) => b.offsetParent !== null) ?? boards[0];
    const edges: Record<string, Cell[]> = JSON.parse(board.dataset.edges!);
    const route: string[] = JSON.parse(board.dataset.route!);
    frames = [];
    let last: Cell | null = null;
    route.forEach((step, i) => {
      const cells = edges[step];
      if (cells) {
        cells.forEach((cell) => frames.push({ cell, room: null, wait: WALK }));
        last = cells[cells.length - 1];
        return;
      }
      const next = edges[route[i + 1]];
      const cell: Cell = last ?? next[0];
      frames.push({ cell, room: step, wait: step === 'decide' ? REST : DWELL });
    });
  };

  const draw = (i: number) => {
    const { cell, room } = frames[i];
    const walker = board.querySelector<SVGRectElement>('.walker')!;
    walker.setAttribute('x', String(cell[0] + 0.25));
    walker.setAttribute('y', String(cell[1] + 0.25));
    board
      .querySelectorAll('[data-room]')
      .forEach((g) => g.classList.toggle('lit', (g as SVGGElement).dataset.room === room));
  };

  const tick = () => {
    draw(index);
    const wait = frames[index].wait;
    index = (index + 1) % frames.length;
    timer = window.setTimeout(tick, wait);
  };

  const stop = () => {
    clearTimeout(timer);
    timer = 0;
  };

  const run = () => {
    stop();
    if (reducedMotion.matches) {
      // The final state: the loop has closed and the work rests with the final call.
      const end = frames.findLastIndex((f) => f.room === 'decide');
      draw(end);
      return;
    }
    if (visible && !document.hidden) tick();
  };

  build();
  draw(0);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    run();
  }).observe(section);
  document.addEventListener('visibilitychange', run);
  reducedMotion.addEventListener('change', run);
  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const before = board;
      build();
      if (board !== before) {
        index = 0;
        run();
      }
    }, 150);
  });
}
