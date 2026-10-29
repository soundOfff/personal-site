/**
 * The workflow as a pixel dungeon. Five paper rooms carved out of cobalt rock, the amber
 * shortest path between them, two dashed loops back from Review, and a party that walks it.
 * Every walk is a BFS over the rooms plus the one corridor the beat allows.
 */
import { PALETTE, hash, patterns, size } from '../../../lib/flood/pixels';
import { reducedMotion } from '../../../lib/flood/scroll';
import { SPRITES, type ActorId } from './sprites';

type StageId = 'frame' | 'design' | 'build' | 'verify' | 'decide';
type CorridorId =
  | 'in'
  | 'frame>design'
  | 'design>build'
  | 'build>verify'
  | 'verify>decide'
  | 'out'
  | 'loop>build'
  | 'loop>design';
type LabelId = 'loop>build' | 'loop>design' | 'out';
type Pt = [number, number];
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const STAGES: StageId[] = ['frame', 'design', 'build', 'verify', 'decide'];
const CORRIDORS: CorridorId[] = [
  'in',
  'frame>design',
  'design>build',
  'build>verify',
  'verify>decide',
  'out',
  'loop>build',
  'loop>design',
];
const MAIN = new Set<CorridorId>(CORRIDORS.slice(0, 6));
const TARGET: Record<CorridorId, StageId | null> = {
  in: 'frame',
  'frame>design': 'design',
  'design>build': 'build',
  'build>verify': 'verify',
  'verify>decide': 'decide',
  out: null,
  'loop>build': 'build',
  'loop>design': 'design',
};
const ACTORS: ActorId[] = ['tomas', 'claude', 'codex', 'idea'];
const CELL = 20;
const STEP_MS = 75;
const DWELL_MS = 2300;

interface Layout {
  cols: number;
  rows: number;
  ox: number;
  scale: number;
  rooms: Record<StageId, Box>;
  corridors: Record<CorridorId, Pt[]>;
  labels: Partial<Record<LabelId, Box>>;
}

function wide(cols: number): Layout {
  const ml = 2;
  const gx = 5;
  const w = Math.min(13, Math.floor((cols - ml - 4 - 2 * gx) / 3));
  const h = 6;
  const y0 = 1;
  const y1 = y0 + h + 5;
  const rows = y1 + h + 3;
  const at = (i: number, y: number): Box => ({ x: ml + i * (w + gx), y, w, h });
  const rooms = { frame: at(0, y0), design: at(1, y0), build: at(2, y0), verify: at(2, y1), decide: at(0, y1) };
  const { frame, design, build, verify, decide } = rooms;
  const cx = (b: Box) => b.x + Math.floor(b.w / 2);
  const r = y0 + 3;
  const c = build.x + w + 1;
  return {
    cols,
    rows,
    ox: 0,
    scale: 3,
    rooms,
    corridors: {
      in: [[0, r], [frame.x - 1, r]],
      'frame>design': [[frame.x + w, r], [design.x - 1, r]],
      'design>build': [[design.x + w, r], [build.x - 1, r]],
      'build>verify': [[build.x + 2, y0 + h], [build.x + 2, y1 - 1]],
      'verify>decide': [[verify.x - 1, y1 + 4], [decide.x + w, y1 + 4]],
      out: [[cx(decide), y1 + h], [cx(decide), rows - 1]],
      'loop>build': [[verify.x + w, y1 + 2], [c, y1 + 2], [c, y0 + 2], [build.x + w, y0 + 2]],
      'loop>design': [[verify.x - 1, y1 + 1], [cx(design), y1 + 1], [cx(design), y0 + h]],
    },
    labels: {
      'loop>build': { x: build.x + 4, y: y0 + h + 1, w: c - build.x - 4, h: 2 },
      'loop>design': { x: cx(design) + 1, y: y0 + h + 1, w: build.x - cx(design) - 2, h: 2 },
      out: { x: cx(decide) + 1, y: y1 + h + 1, w: Math.min(12, cols - cx(decide) - 2), h: 1 },
    },
  };
}

function narrow(cols: number): Layout {
  const x = 1;
  const w = Math.min(11, cols - 6);
  const h = 5;
  const gy = 3;
  const at = (i: number): Box => ({ x, y: 1 + i * (h + gy), w, h });
  const rooms = { frame: at(0), design: at(1), build: at(2), verify: at(3), decide: at(4) };
  const { frame, design, build, verify, decide } = rooms;
  const rows = decide.y + h + 3;
  const cx = x + Math.floor(w / 2);
  const e = x + w;
  return {
    cols,
    rows,
    ox: 0,
    scale: 2,
    rooms,
    corridors: {
      in: [[cx, 0], [cx, 0]],
      'frame>design': [[cx, frame.y + h], [cx, design.y - 1]],
      'design>build': [[cx, design.y + h], [cx, build.y - 1]],
      'build>verify': [[cx, build.y + h], [cx, verify.y - 1]],
      'verify>decide': [[cx, verify.y + h], [cx, decide.y - 1]],
      out: [[cx, decide.y + h], [cx, rows - 1]],
      'loop>build': [[e, verify.y + 1], [e + 1, verify.y + 1], [e + 1, build.y + 3], [e, build.y + 3]],
      'loop>design': [[e, verify.y + 3], [e + 3, verify.y + 3], [e + 3, design.y + 2], [e, design.y + 2]],
    },
    labels: { out: { x: cx + 1, y: decide.y + h + 1, w: Math.min(12, cols - cx - 2), h: 1 } },
  };
}

interface Beat {
  stage: StageId;
  moves: Partial<Record<ActorId, CorridorId>>;
  note?: 'loop>build' | 'loop>design' | 'ship';
}
const all = (c: CorridorId) => ({ idea: c, tomas: c, claude: c, codex: c });
const opening: Beat[] = [
  { stage: 'frame', moves: { idea: 'in' } },
  { stage: 'design', moves: { idea: 'frame>design', tomas: 'frame>design', claude: 'frame>design' } },
  { stage: 'build', moves: all('design>build') },
  { stage: 'verify', moves: all('build>verify') },
];
const closing: Beat[] = [
  { stage: 'decide', moves: { idea: 'verify>decide', tomas: 'verify>decide' } },
  { stage: 'decide', note: 'ship', moves: { idea: 'out' } },
];
/** Two laps: the first fails a check, the second rethinks the approach. */
const TOUR: Beat[] = [
  ...opening,
  {
    stage: 'build',
    note: 'loop>build',
    moves: { idea: 'loop>build', claude: 'loop>build', codex: 'loop>build' },
  },
  { stage: 'verify', moves: { idea: 'build>verify', claude: 'build>verify', codex: 'build>verify' } },
  ...closing,
  ...opening,
  { stage: 'design', note: 'loop>design', moves: all('loop>design') },
  { stage: 'build', moves: all('design>build') },
  { stage: 'verify', moves: all('build>verify') },
  ...closing,
];

export function initMap(root: HTMLElement) {
  const map = root.querySelector<HTMLElement>('[data-map]');
  if (!map) return;
  const canvas = map.querySelector<HTMLCanvasElement>('canvas')!;
  const rooms = [...map.querySelectorAll<HTMLButtonElement>('[data-room]')];
  const labels = [...map.querySelectorAll<HTMLElement>('[data-label]')];
  const cards = [...root.querySelectorAll<HTMLElement>('[data-card]')];
  const notes = [...root.querySelectorAll<HTMLElement>('[data-note]')];
  const toggle = root.querySelector<HTMLButtonElement>('[data-tour]')!;
  const panel = root.querySelector<HTMLElement>('#c3-panel')!;
  // Reading the panel holds the tour on its current room.
  let hold = false;

  let L: Layout;
  let ctx: CanvasRenderingContext2D;
  let tones: (string | CanvasPattern)[] = [];
  let roomOf = new Int8Array(0);
  let corrOf = new Int8Array(0);
  let tone = new Int8Array(0);
  let order = new Float32Array(0);
  const pos: Record<ActorId, number> = { tomas: 0, claude: 0, codex: 0, idea: 0 };
  const where: Record<ActorId, StageId | null> = { tomas: null, claude: null, codex: null, idea: null };
  const walk: Record<ActorId, number[]> = { tomas: [], claude: [], codex: [], idea: [] };
  const hidden = new Set<ActorId>();

  let beat = -1;
  let dwellUntil = 0;
  let playing = !reducedMotion.matches;
  let visible = false;
  let raf = 0;
  let lastStep = 0;
  let revealStart = -1;
  let note: Beat['note'] | undefined;
  let selected: StageId = 'frame';

  const idx = (x: number, y: number) => y * L.cols + x;

  function build() {
    const width = map!.clientWidth;
    const cols = Math.floor(width / CELL);
    L = cols >= 40 ? wide(cols) : narrow(cols);
    L.ox = Math.floor((width - cols * CELL) / 2);
    map!.style.height = `${L.rows * CELL}px`;
    ctx = size(canvas, width, L.rows * CELL);
    const p = patterns(ctx);
    tones = [PALETTE.blue, p[0], PALETTE.light, p[1]];

    const n = L.cols * L.rows;
    roomOf = new Int8Array(n).fill(-1);
    corrOf = new Int8Array(n).fill(-1);
    STAGES.forEach((s, k) => {
      const b = L.rooms[s];
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) roomOf[idx(x, y)] = k;
    });
    CORRIDORS.forEach((c, k) => {
      const pts = L.corridors[c];
      for (let s = 0; s < pts.length - 1; s++) {
        let [x, y] = pts[s];
        const [tx, ty] = pts[s + 1];
        corrOf[idx(x, y)] = k;
        while (x !== tx || y !== ty) {
          if (x !== tx) x += Math.sign(tx - x);
          else y += Math.sign(ty - y);
          corrOf[idx(x, y)] = k;
        }
      }
    });
    const clear = new Uint8Array(n);
    Object.values(L.labels).forEach((b) => {
      for (let y = b!.y; y < b!.y + b!.h; y++)
        for (let x = b!.x; x < b!.x + b!.w; x++) if (x < L.cols && y < L.rows) clear[idx(x, y)] = 1;
    });

    // Rock tone from Chebyshev distance to the nearest floor cell, roughened by a hash.
    const dist = new Int16Array(n).fill(-1);
    const queue = new Int32Array(n);
    let head = 0;
    let tail = 0;
    for (let i = 0; i < n; i++) if (roomOf[i] >= 0 || corrOf[i] >= 0) (dist[i] = 0), (queue[tail++] = i);
    while (head < tail) {
      const i = queue[head++];
      const x = i % L.cols;
      const y = (i / L.cols) | 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= L.cols || ny >= L.rows) continue;
          const j = idx(nx, ny);
          if (dist[j] >= 0) continue;
          dist[j] = dist[i] + 1;
          queue[tail++] = j;
        }
    }
    tone = new Int8Array(n).fill(-1);
    order = new Float32Array(n);
    const [ex, ey] = L.corridors.in[0];
    for (let i = 0; i < n; i++) {
      const x = i % L.cols;
      const y = (i / L.cols) | 0;
      order[i] = Math.abs(x - ex) + Math.abs(y - ey) + (hash(`o${i}`) % 5);
      if (dist[i] <= 0 || clear[i]) continue;
      const t = dist[i] + (dist[i] >= 2 ? ((hash(`r${i}`) % 7) / 7) * 1.3 : 0);
      tone[i] = t < 1.5 ? 0 : t < 2.5 ? 1 : t < 3.4 ? 3 : -1;
    }
    let maxOrder = 1;
    for (let i = 0; i < n; i++) maxOrder = Math.max(maxOrder, order[i]);
    for (let i = 0; i < n; i++) order[i] /= maxOrder;

    rooms.forEach((el) => place(el, L.rooms[el.dataset.room as StageId]));
    labels.forEach((el) => {
      const b = L.labels[el.dataset.label as LabelId];
      el.hidden = !b;
      if (b) place(el, b);
    });
    if (beat < 0) reset(!playing);
    else regroup(selected);
    paint(performance.now());
  }

  function place(el: HTMLElement, b: Box) {
    el.style.left = `${L.ox + b.x * CELL}px`;
    el.style.top = `${b.y * CELL}px`;
    el.style.width = `${b.w * CELL}px`;
    el.style.height = `${b.h * CELL}px`;
  }

  function slot(actor: ActorId, stage: StageId) {
    const b = L.rooms[stage];
    const k = ACTORS.indexOf(actor);
    const x = actor === 'idea' ? b.x + b.w - 2 : b.x + 1 + k * 2;
    return idx(Math.min(x, b.x + b.w - 1), b.y + b.h - 1);
  }

  /** Start state, or the resting final state when nothing animates. */
  function reset(final: boolean) {
    hidden.clear();
    ACTORS.forEach((a) => (walk[a] = []));
    if (final) {
      place4({ tomas: 'decide', claude: 'verify', codex: 'verify', idea: null });
      pos.idea = idx(...L.corridors.out[1]);
      return;
    }
    place4({ tomas: 'frame', claude: 'frame', codex: 'design', idea: null });
    const [x, y] = L.corridors.in[0];
    pos.idea = idx(x, y);
  }

  function place4(at: Record<ActorId, StageId | null>) {
    ACTORS.forEach((a) => {
      where[a] = at[a];
      if (at[a]) pos[a] = slot(a, at[a]!);
    });
  }

  function route(from: number, to: number, via: CorridorId) {
    const k = CORRIDORS.indexOf(via);
    const prev = new Int32Array(L.cols * L.rows).fill(-1);
    const queue = [from];
    prev[from] = from;
    for (let h = 0; h < queue.length; h++) {
      const i = queue[h];
      if (i === to) break;
      const x = i % L.cols;
      const y = (i / L.cols) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= L.cols || ny >= L.rows) continue;
        const j = idx(nx, ny);
        if (prev[j] >= 0 || (roomOf[j] < 0 && corrOf[j] !== k)) continue;
        prev[j] = i;
        queue.push(j);
      }
    }
    const path: number[] = [];
    if (prev[to] < 0) return [to];
    for (let i = to; i !== from; i = prev[i]) path.push(i);
    return path.reverse();
  }

  function start(n: number) {
    beat = n % TOUR.length;
    const b = TOUR[beat];
    if (b.moves.idea === 'in') reset(false);
    note = b.note;
    (Object.entries(b.moves) as [ActorId, CorridorId][]).forEach(([a, via]) => {
      const stage = TARGET[via];
      const end = stage ? slot(a, stage) : idx(...L.corridors.out[1]);
      hidden.delete(a);
      walk[a] = route(pos[a], end, via);
      where[a] = stage;
    });
    show(b.stage, b.note);
    dwellUntil = 0;
  }

  function show(stage: StageId, n?: Beat['note']) {
    selected = stage;
    rooms.forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.room === stage)));
    cards.forEach((el) => el.toggleAttribute('data-off', el.dataset.card !== stage));
    notes.forEach((el) => (el.hidden = el.dataset.note !== n));
  }

  function step(now: number) {
    let moving = false;
    ACTORS.forEach((a) => {
      if (!walk[a].length) return;
      pos[a] = walk[a].shift()!;
      moving = true;
      if (!walk[a].length && a === 'idea' && !where.idea) hidden.add('idea');
    });
    if (moving || beat < 0) return;
    if (!dwellUntil) dwellUntil = now + DWELL_MS + (note ? 600 : 0);
    else if (now >= dwellUntil && !hold) start(beat + 1);
  }

  function paint(now: number) {
    if (!L) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const reveal =
      revealStart < 0 ? (reducedMotion.matches ? 1 : 0) : Math.min(1, (now - revealStart) / 1100);
    const tick = Math.floor(now / 170);
    for (let i = 0; i < tone.length; i++) {
      let t = tone[i];
      if (t < 0 || order[i] > reveal) continue;
      if (playing && hash(String(i + Math.floor(tick / 4))) % 419 === 0) t = (t + 1) % 4;
      ctx.fillStyle = tones[t];
      ctx.fillRect(L.ox + (i % L.cols) * CELL, ((i / L.cols) | 0) * CELL, CELL, CELL);
    }
    for (let i = 0; i < corrOf.length; i++) {
      const k = corrOf[i];
      if (k < 0 || order[i] > reveal) continue;
      const c = CORRIDORS[k];
      const x = L.ox + (i % L.cols) * CELL;
      const y = ((i / L.cols) | 0) * CELL;
      if (MAIN.has(c)) {
        ctx.fillStyle = PALETTE.amber;
        ctx.fillRect(x + 5, y + 5, CELL - 10, CELL - 10);
      } else if (((i % L.cols) + ((i / L.cols) | 0)) % 2 === 0) {
        ctx.fillStyle = note === c ? PALETTE.blue : PALETTE.light;
        ctx.fillRect(x + 5, y + 5, CELL - 10, CELL - 10);
      }
    }
    if (reveal < 1) return;
    const bob = Math.floor(now / 420);
    ACTORS.forEach((a, k) => {
      if (hidden.has(a)) return;
      const s = SPRITES[a];
      const scale = a === 'idea' ? L.scale - (L.scale > 2 ? 1 : 0) : L.scale;
      const sw = s.rows[0].length * scale;
      const sh = s.rows.length * scale;
      const i = pos[a];
      const lift = playing && (bob + k) % 2 ? scale : 0;
      const float = a === 'idea' ? CELL * 0.6 : 0;
      const x0 = Math.round(L.ox + (i % L.cols) * CELL + CELL / 2 - sw / 2);
      const y0 = Math.round((((i / L.cols) | 0) + 1) * CELL - sh - 2 - lift - float);
      s.rows.forEach((row, y) =>
        [...row].forEach((bit, x) => {
          if (bit === '.') return;
          ctx.fillStyle = bit === 'X' ? s.color : bit === 'L' ? s.fill! : PALETTE.paper;
          ctx.fillRect(x0 + x * scale, y0 + y * scale, scale, scale);
        }),
      );
    });
  }

  function frame(now: number) {
    raf = 0;
    if (!visible || document.hidden) return;
    const revealing = revealStart >= 0 && now - revealStart < 1100;
    if (playing && !revealing) {
      if (now - lastStep >= STEP_MS) {
        lastStep = now;
        if (beat < 0) start(0);
        step(now);
        paint(now);
      }
    } else paint(now);
    if (playing || revealing) raf = requestAnimationFrame(frame);
  }

  function resume() {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }

  /** Puts the party where a finished beat for `stage` leaves it, so the tour continues from there. */
  function regroup(stage: StageId) {
    hidden.clear();
    ACTORS.forEach((a) => (walk[a] = []));
    const agents = stage === 'decide' ? 'verify' : stage;
    place4({ tomas: stage, claude: agents, codex: stage === 'frame' ? 'design' : agents, idea: stage });
    beat = TOUR.findIndex((b) => b.stage === stage && !b.note);
    note = undefined;
    dwellUntil = 0;
    show(stage);
  }

  function setPlaying(on: boolean) {
    playing = on;
    toggle.setAttribute('aria-pressed', String(on));
    toggle.querySelector('[data-tour-label]')!.textContent = on ? 'Pause the loop' : 'Play the loop';
    if (!L) return;
    if (on) {
      if (beat >= 0) regroup(selected);
      resume();
    } else paint(performance.now());
  }

  rooms.forEach((el, k) => {
    el.addEventListener('click', () => {
      if (playing) setPlaying(false);
      show(el.dataset.room as StageId);
      paint(performance.now());
    });
    el.addEventListener('keydown', (event) => {
      const next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!next) return;
      event.preventDefault();
      const target = rooms[(k + next + rooms.length) % rooms.length];
      target.focus();
      target.click();
    });
  });
  toggle.addEventListener('click', () => setPlaying(!playing));
  panel.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && (hold = true));
  panel.addEventListener('pointerleave', () => (hold = false));
  panel.addEventListener('focusin', () => (hold = true));
  panel.addEventListener('focusout', () => (hold = false));

  new ResizeObserver(() => build()).observe(map);
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
      if (visible && revealStart < 0 && !reducedMotion.matches) revealStart = performance.now();
      if (visible) resume();
    },
    { threshold: [0, 0.15] },
  ).observe(map);
  document.addEventListener('visibilitychange', resume);
  setPlaying(playing);
}
