import { GLYPH, PALETTE, size } from '../../../lib/flood/pixels';
import { reducedMotion } from '../../../lib/flood/scroll';
import { CLAUDE, CODEX, COLORS, FAIL, PASS, TICKET, type Bitmap } from './sprites';

type Pt = [number, number];
type Mode = 'idle' | 'walk' | 'work';

interface Beat {
  d: number;
  caption: string;
  station: number;
  ticket: Pt[];
  agents: [number, number];
  mode: Mode;
  press: number;
  mark: 'fail' | 'pass' | null;
  stamps: number;
}

const INK = '#182126';
const LINE = '#c8c6b8';
const MUTED = '#566064';
const BELT = 30;
type Loops = { build: number; design: number };
const STAR: Bitmap = GLYPH.map((r) => r.replaceAll('0', '.').replaceAll('1', 'b'));
const ROLLER = '#a3a38f';

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function along(path: Pt[], p: number): Pt {
  if (path.length === 1) return path[0];
  const lens = path.slice(1).map((pt, i) => Math.hypot(pt[0] - path[i][0], pt[1] - path[i][1]));
  let left = lens.reduce((a, b) => a + b, 0) * p;
  for (let i = 0; i < lens.length; i++) {
    if (left <= lens[i] || i === lens.length - 1) {
      const k = lens[i] ? Math.min(1, left / lens[i]) : 1;
      return [
        path[i][0] + (path[i + 1][0] - path[i][0]) * k,
        path[i][1] + (path[i + 1][1] - path[i][1]) * k,
      ];
    }
    left -= lens[i];
  }
  return path[path.length - 1];
}

/** Two tickets per cycle: the first fails its checks, the second takes the wrong approach. */
function script(X: number[], W: number, LOOPS: Loops): Beat[] {
  const beats: Beat[] = [];
  const y = BELT - 4;
  let tx = -8;
  let ax = X[1];
  let stamps = 0;
  const add = (b: Partial<Beat> & Pick<Beat, 'd' | 'caption' | 'station'>) =>
    beats.push({ ticket: [[tx, y]], agents: [ax, ax], mode: 'idle', press: -1, mark: null, stamps, ...b });
  const move = (to: number, d: number, caption: string, station: number, crew = true) => {
    add({ d, caption, station, ticket: [[tx, y], [to, y]], agents: crew ? [ax, to] : [ax, ax], mode: crew ? 'walk' : 'idle' });
    tx = to;
    if (crew) ax = to;
  };
  const work = (d: number, caption: string, station: number) => add({ d, caption, station, mode: 'work' });
  const stamp = (i: number, d: number, caption: string) => {
    add({ d, caption, station: i, press: i });
    stamps++;
  };

  for (const kind of ['build', 'design'] as const) {
    tx = -8;
    stamps = 0;
    move(X[0], 1100, 'Frame. I turn the idea into a brief.', 0, false);
    stamp(0, 1000, 'Frame. I sign off on the scope.');
    move(X[1], 1100, 'Design. The agents read the code first.', 1, false);
    work(1900, 'Design. Claude Code and Codex compare approaches.', 1);
    move(X[2], 1100, 'Build. One slice, in its own worktree.', 2);
    work(2100, 'Build. Both agents split the slice.', 2);
    move(X[3], 1100, 'Review. Checks run on the real page.', 3);
    work(1600, 'Review. Checks run on the real page.', 3);
    const back = kind === 'build' ? X[2] : X[1];
    const caption = kind === 'build' ? 'Checks failed. Back to Build.' : 'Wrong approach. Back to Design.';
    add({ d: 1100, caption, station: 3, mark: 'fail' });
    add({
      d: 2000,
      caption,
      station: kind === 'build' ? 2 : 1,
      ticket: [[tx, y], [tx, BELT + LOOPS[kind]], [back, BELT + LOOPS[kind]], [back, y]],
      agents: [ax, back],
      mode: 'walk',
    });
    tx = ax = back;
    if (kind === 'design') {
      work(1400, 'Design. A different approach.', 1);
      move(X[2], 1000, 'Build. Rebuilt on the new approach.', 2);
    }
    work(1400, 'Build. The fix goes in.', 2);
    move(X[3], 1000, 'Review. Checks run again.', 3);
    work(1100, 'Review. Checks run again.', 3);
    add({ d: 1000, caption: 'Checks pass.', station: 3, mark: 'pass' });
    add({ d: 1300, caption: 'Decide. My final call.', station: 4, ticket: [[tx, y], [X[4], y]], agents: [ax, X[1]], mode: 'walk' });
    tx = X[4];
    ax = X[1];
    stamp(4, 1100, 'Decide. I sign off, or send it back.');
    move(W + 10, 1100, 'Shipped. Next ticket.', 4, false);
  }
  return beats;
}

export function initLine(root: HTMLElement) {
  const section = root.querySelector<HTMLElement>('#workflow');
  if (!section) return;
  const scene = section.querySelector<HTMLElement>('.b2-scene')!;
  const canvas = section.querySelector<HTMLCanvasElement>('.b2-line')!;
  const stations = [...section.querySelectorAll<HTMLButtonElement>('[data-station]')];
  const panels = [...section.querySelectorAll<HTMLElement>('[data-panel]')];
  const caption = section.querySelector<HTMLElement>('[data-caption]')!;
  const loopLabels = { build: scene.dataset.build!, design: scene.dataset.design! };

  let u = 6;
  let W = 0;
  let H = 48;
  let LOOPS: Loops = { build: 6, design: 11 };
  let X: number[] = [];
  let beats: Beat[] = [];
  let total = 0;
  let ctx: CanvasRenderingContext2D;
  let clock = 0;
  let last = 0;
  let raf = 0;
  let visible = false;
  let selected = 0;
  let shownBeat: Beat | null = null;

  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x) * u, Math.round(y) * u, w * u, h * u);
  };
  const sprite = (bm: Bitmap, x: number, y: number, tint?: string) => {
    bm.forEach((row, j) =>
      [...row].forEach((c, i) => c !== '.' && px(x + i, y + j, 1, 1, tint ?? COLORS[c])),
    );
  };

  function layout() {
    const w = scene.clientWidth;
    u = w >= 1000 ? 6 : w >= 640 ? 4 : 3;
    W = Math.floor(w / u);
    LOOPS = { build: 6, design: u >= 4 ? 11 : 14 };
    H = BELT + LOOPS.design + 7;
    X = [0, 1, 2, 3, 4].map((i) => Math.round((W * (i + 0.5)) / 5));
    ctx = size(canvas, W * u, H * u);
    canvas.style.width = `${W * u}px`;
    canvas.style.height = `${H * u}px`;
    beats = script(X, W, LOOPS);
    total = beats.reduce((s, b) => s + b.d, 0);
    render();
  }

  function pose(time: number) {
    let t = time % total;
    for (const beat of beats) {
      if (t < beat.d) return { beat, p: t / beat.d };
      t -= beat.d;
    }
    return { beat: beats[0], p: 0 };
  }

  function frozen(): { beat: Beat; p: number } {
    return {
      beat: {
        d: 1,
        caption: 'Failed checks return to Build. A wrong approach returns to Design.',
        station: 4,
        ticket: [[X[4], BELT - 4]],
        agents: [X[2], X[2]],
        mode: 'idle',
        press: -1,
        mark: null,
        stamps: 2,
      },
      p: 0,
    };
  }

  function drawLoop(kind: 'build' | 'design', to: number, color: string) {
    const depth = BELT + LOOPS[kind];
    for (let y = BELT + 3; y <= depth; y++) if (y % 2 === 0) px(X[3], y, 1, 1, color);
    for (let x = to; x <= X[3]; x++) if (x % 2 === 0) px(x, depth, 1, 1, color);
    for (let y = BELT + 5; y <= depth; y++) if (y % 2 === 0) px(to, y, 1, 1, color);
    px(to, BELT + 3, 1, 1, color);
    px(to - 1, BELT + 4, 1, 1, color);
    px(to + 1, BELT + 4, 1, 1, color);
    const fs = u >= 4 ? 11 : 10;
    ctx.font = `${fs}px "JetBrains Mono Variable", ui-monospace, monospace`;
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(loopLabels[kind], ((to + X[3]) / 2) * u, (depth + 1.6) * u);
  }

  function render(time = clock) {
    if (!ctx || !beats.length) return;
    const still = reducedMotion.matches;
    const { beat, p } = still ? frozen() : pose(time);
    ctx.clearRect(0, 0, W * u, H * u);

    const [tx, ty] = along(beat.ticket, beat.ticket.length > 1 ? ease(p) : 0);
    const onBelt = Math.abs(ty - (BELT - 4)) < 0.5;
    const ax = beat.agents[0] + (beat.agents[1] - beat.agents[0]) * ease(p);
    const walking = beat.mode === 'walk' && beat.agents[0] !== beat.agents[1];

    const b0 = Math.max(0, X[0] - 16);
    const b1 = Math.min(W - 1, X[4] + 16);
    const shift = onBelt && beat.ticket.length > 1 ? Math.floor(tx) : 0;
    px(b0, BELT, b1 - b0 + 1, 1, INK);
    for (let x = b0; x <= b1; x++) if ((((x - shift) % 4) + 4) % 4 < 2) px(x, BELT + 1, 1, 1, ROLLER);
    X.forEach((x, i) => px(x - 2, BELT + 3, 5, 1, i === selected ? PALETTE.blue : LINE));

    drawLoop('design', X[1], PALETTE.light);
    drawLoop('build', X[2], PALETTE.blue);

    [0, 4].forEach((i) => {
      const down = beat.press === i ? Math.sin(Math.PI * Math.min(1, p * 1.15)) : 0;
      const top = 3 + down * (BELT - 4 - 4 - 7 - 3);
      px(X[i], 0, 1, Math.round(top), INK);
      sprite(STAR, X[i] - 3, top);
    });

    const frame = walking ? 1 + (Math.floor(time / 150) % 2) : 0;
    const bob = beat.mode === 'work' && Math.floor(time / 180) % 2 ? -1 : 0;
    sprite(CLAUDE[frame], ax - 19, BELT - 12 + bob);
    sprite(CODEX[frame], ax + 6, BELT - 15 - (beat.mode === 'work' && Math.floor(time / 180 + 1) % 2 ? 1 : 0));
    if (beat.mode === 'work') {
      for (let k = 0; k < 3; k++) {
        const phase = (time / 600 + k / 3) % 1;
        px(tx - 3 + k * 3, BELT - 10 - phase * 8, 1, 1, phase < 0.5 ? PALETTE.blue : PALETTE.light);
      }
    }

    const stamps = beat.stamps + (beat.press >= 0 && p > 0.5 ? 1 : 0);
    sprite(TICKET, tx - 5, ty - 4);
    for (let s = 0; s < stamps; s++) px(tx - 4 + s * 3, ty + 2, 2, 1, PALETTE.blue);

    if (beat.mark) sprite(beat.mark === 'fail' ? FAIL : PASS, X[3] - 2, 6);

    if (beat !== shownBeat) {
      shownBeat = beat;
      caption.textContent = beat.caption;
      stations.forEach((s, i) => s.classList.toggle('is-here', i === beat.station));
    }
  }

  function tick(now: number) {
    clock += Math.min(64, now - last);
    last = now;
    render();
    raf = requestAnimationFrame(tick);
  }

  function run() {
    const go = visible && !document.hidden && !reducedMotion.matches;
    cancelAnimationFrame(raf);
    if (go) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    } else render();
  }

  function select(i: number) {
    selected = i;
    stations.forEach((s, j) => {
      s.setAttribute('aria-selected', String(j === i));
      s.tabIndex = j === i ? 0 : -1;
    });
    panels.forEach((p, j) => (p.hidden = j !== i));
    render();
  }

  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  stations.forEach((s, i) => {
    s.addEventListener('pointerenter', () => finePointer.matches && select(i));
    s.addEventListener('focus', () => select(i));
    s.addEventListener('click', () => select(i));
    s.addEventListener('keydown', (event) => {
      const delta = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!delta) return;
      event.preventDefault();
      stations[(i + delta + stations.length) % stations.length].focus();
    });
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    run();
  }).observe(scene);
  new ResizeObserver(layout).observe(scene);
  document.addEventListener('visibilitychange', run);
  reducedMotion.addEventListener('change', run);
  void document.fonts.ready.then(() => render());
}
