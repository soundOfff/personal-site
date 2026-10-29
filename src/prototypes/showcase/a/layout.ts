// The workflow drawn on the 20 px grid. Units are cells; the SVG viewBox and the HTML
// overlay both read these numbers, so text and pixels stay aligned at any width.
import type { WorkflowStageId } from '../../../data/workflow';

export type Cell = [number, number];
export type EdgeId = 'frame-design' | 'design-build' | 'build-verify' | 'verify-decide' | 'fix' | 'rethink';

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Block {
  x: number;
  y: number;
  w: number;
}

export interface Arrow {
  at: Cell;
  dir: 'down' | 'left';
}

export interface Layout {
  name: 'wide' | 'tall';
  cols: number;
  rows: number;
  rooms: Record<WorkflowStageId, Room>;
  /** Where each stage's hint and tools sit. */
  notes: Record<WorkflowStageId, Block>;
  edges: Record<EdgeId, Cell[]>;
  arrows: Arrow[];
  /** Feedback edge labels. */
  labels: Partial<Record<'fix' | 'rethink', Block>>;
  lanes?: { me: Block; agents: Block };
}

/** Cells along an orthogonal polyline, endpoints included, no duplicates. */
function path(...points: Cell[]): Cell[] {
  const cells: Cell[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    let [x, y] = points[i - 1];
    const [tx, ty] = points[i];
    while (x !== tx || y !== ty) {
      x += Math.sign(tx - x);
      if (x === tx) y += Math.sign(ty - y);
      cells.push([x, y]);
    }
  }
  return cells;
}

// Desktop: two lanes. Tomas frames and decides up top; the agents design, build and review
// below, and the two feedback loops arc back over their lane.
const W = 9;
const H = 3;
const wideDrawn: Layout = {
  name: 'wide',
  cols: 64,
  rows: 30,
  rooms: {
    frame: { x: 11, y: 6, w: W, h: H },
    design: { x: 22, y: 14, w: W, h: H },
    build: { x: 33, y: 14, w: W, h: H },
    verify: { x: 44, y: 14, w: W, h: H },
    decide: { x: 55, y: 6, w: W, h: H },
  },
  notes: {
    frame: { x: 11, y: 9.5, w: W - 0.5 },
    design: { x: 22, y: 17.5, w: W },
    build: { x: 33, y: 17.5, w: W },
    verify: { x: 44, y: 17.5, w: W + 1 },
    decide: { x: 55, y: 9.5, w: W },
  },
  edges: {
    'frame-design': path([20, 7], [20, 15], [21, 15]),
    'design-build': path([31, 15], [32, 15]),
    'build-verify': path([42, 15], [43, 15]),
    'verify-decide': path([53, 15], [53, 7], [54, 7]),
    fix: path([46, 13], [46, 10], [37, 10], [37, 13]),
    rethink: path([50, 13], [50, 4], [26, 4], [26, 13]),
  },
  arrows: [
    { at: [37, 13], dir: 'down' },
    { at: [26, 13], dir: 'down' },
  ],
  labels: {
    fix: { x: 38, y: 8.6, w: 11.5 },
    rethink: { x: 27, y: 2.6, w: 23 },
  },
  lanes: {
    me: { x: 0, y: 6, w: 10 },
    agents: { x: 0, y: 14, w: 10 },
  },
};

/** Moves a layout up by `dy` rows, so the drawing can be sketched with headroom and then trimmed. */
function lift(l: Layout, dy: number): Layout {
  const up = <T extends { y: number }>(b: T): T => ({ ...b, y: b.y - dy });
  const map = <K extends string, V>(r: Record<K, V>, f: (v: V) => V) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, f(v as V)])) as Record<K, V>;
  return {
    ...l,
    rows: l.rows - dy,
    rooms: map(l.rooms, up),
    notes: map(l.notes, up),
    edges: map(l.edges, (cells) => cells.map(([x, y]) => [x, y - dy] as Cell)),
    arrows: l.arrows.map((a) => ({ ...a, at: [a.at[0], a.at[1] - dy] as Cell })),
    labels: map(l.labels as Record<string, Block>, up),
    lanes: l.lanes && { me: up(l.lanes.me), agents: up(l.lanes.agents) },
  };
}
export const wide = lift(wideDrawn, 2);

// Mobile: one column. A spine runs down the left; Tomas's rooms sit on it, the agents'
// rooms are indented, and the loops climb the right edge. Each room's top row sets the rest.
const TW = 11;
function column(top: Record<WorkflowStageId, number>, rows: number): Layout {
  const { design: d, build: b, verify: v, decide: z } = top;
  return {
    name: 'tall',
    cols: 17,
    rows,
    rooms: {
      frame: { x: 0, y: top.frame, w: TW + 2, h: H },
      design: { x: 2, y: d, w: TW, h: H },
      build: { x: 2, y: b, w: TW, h: H },
      verify: { x: 2, y: v, w: TW, h: H },
      decide: { x: 0, y: z, w: TW + 2, h: H },
    },
    notes: {
      frame: { x: 2, y: top.frame + 3.5, w: TW },
      design: { x: 2, y: d + 3.5, w: TW },
      build: { x: 2, y: b + 3.5, w: TW },
      verify: { x: 2, y: v + 3.5, w: TW },
      decide: { x: 2, y: z + 3.5, w: 15 },
    },
    edges: {
      'frame-design': path([0, top.frame + 3], [0, d + 1], [1, d + 1]),
      'design-build': path([1, d + 2], [0, d + 2], [0, b + 1], [1, b + 1]),
      'build-verify': path([1, b + 2], [0, b + 2], [0, v + 1], [1, v + 1]),
      'verify-decide': path([1, v + 2], [0, v + 2], [0, z - 1]),
      fix: path([13, v], [14, v], [14, b + 1], [13, b + 1]),
      rethink: path([13, v + 2], [16, v + 2], [16, d + 1], [13, d + 1]),
    },
    arrows: [
      { at: [13, b + 1], dir: 'left' },
      { at: [13, d + 1], dir: 'left' },
    ],
    labels: {},
  };
}
export const tall = column({ frame: 0, design: 12, build: 25, verify: 39, decide: 53 }, 59);

/** The loop the travelling cell walks: one fix round, then on the next pass a rethink. */
export const route: (EdgeId | WorkflowStageId)[] = [
  'frame', 'frame-design', 'design', 'design-build', 'build', 'build-verify', 'verify',
  'fix', 'build', 'build-verify', 'verify', 'verify-decide', 'decide',
  'frame', 'frame-design', 'design', 'design-build', 'build', 'build-verify', 'verify',
  'rethink', 'design', 'design-build', 'build', 'build-verify', 'verify', 'verify-decide', 'decide',
];
