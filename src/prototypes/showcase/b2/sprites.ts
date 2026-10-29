/**
 * Original pixel sprites for the assembly line. One char per art pixel:
 * '.' empty, b blue, l light, p paper, k ink, a amber.
 */
export type Bitmap = readonly string[];

export const COLORS: Record<string, string> = {
  b: '#0024cc',
  l: '#8a9bff',
  p: '#f7f3e9',
  k: '#182126',
  a: '#e0b81f',
};

/** Pads a bitmap by one cell and rings every filled cell in `ring`. */
function outline(bm: Bitmap, ring: string, skip = ''): string[] {
  const w = bm[0].length + 2;
  const rows = ['.'.repeat(w), ...bm.map((r) => `.${r}.`), '.'.repeat(w)].map((r) => [...r]);
  const out = rows.map((r) => [...r]);
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < w; x++) {
      if (rows[y][x] !== '.') continue;
      const near = [rows[y - 1]?.[x], rows[y + 1]?.[x], rows[y][x - 1], rows[y][x + 1]];
      if (near.some((c) => c && c !== '.' && !skip.includes(c))) out[y][x] = ring;
    }
  }
  return out.map((r) => r.join(''));
}

const claudeTop = [
  '...bbbbbb...',
  '..bbbbbbbb..',
  '.bbbbbbbbbb.',
  '.bbpbbbbbbb.',
  '.bbbpbbbbbb.',
  '.bbpbbppppb.',
  '.bbbbbbbbbb.',
  'bbbbbbbbbbbb',
  'b.bbbbbbbb.b',
  '..bbbbbbbb..',
];
const claudeLegs = [
  ['..bb....bb..', '..bb....bb..'],
  ['..bb....bb..', '.bb......bb.'],
  ['...bb..bb...', '...bb..bb...'],
];

const codexTop = [
  '.....bb.....',
  '......b.....',
  '...llllll...',
  '..llllllll..',
  '.llkkkkkkll.',
  '.llkpkkpkll.',
  '.llkkkkkkll.',
  '..llllllll..',
  '.l.llllll.l.',
  '...llllll...',
];
const codexLegs = [
  ['...ll..ll...', '...ll..ll...'],
  ['...ll..ll...', '..ll....ll..'],
  ['....ll.ll...', '....ll.ll...'],
];

/** Frames: 0 idle, 1 and 2 walking. Claude Code is a blue terminal box, Codex a visored bot. */
export const CLAUDE: Bitmap[] = claudeLegs.map((legs) => [...claudeTop, ...legs]);
export const CODEX: Bitmap[] = codexLegs.map((legs) => outline([...codexTop, ...legs], 'b', 'b'));

export const TICKET: Bitmap = outline(
  ['aaaaaaaaa', 'akkkkkkaa', 'aaaaaaaaa', 'akkkkaaaa', 'aaaaaaaaa', 'aaaaaaaaa', 'aaaaaaaaa'],
  'k',
);

export const FAIL: Bitmap = ['k...k', '.k.k.', '..k..', '.k.k.', 'k...k'];
export const PASS: Bitmap = ['.....b', '....b.', 'b..b..', '.bb...'];

/** SVG rects for a bitmap, for static legend marks. */
export function cells(bm: Bitmap) {
  const out: { x: number; y: number; fill: string }[] = [];
  bm.forEach((row, y) =>
    [...row].forEach((c, x) => c !== '.' && out.push({ x, y, fill: COLORS[c] })),
  );
  return { w: bm[0].length, h: bm.length, cells: out };
}
