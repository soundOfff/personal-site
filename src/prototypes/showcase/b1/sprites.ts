import { GLYPH, PALETTE } from '../../../lib/flood/pixels';

export const INK = '#182126';
export const LINE = '#c8c6b8';
export const GHOST = '#8d9592';

export const COLORS: Record<string, string> = {
  b: PALETTE.blue,
  l: PALETTE.light,
  p: PALETTE.paper,
  a: PALETTE.amber,
  i: INK,
};

/** Claude Code: a terminal-headed bot with a prompt on its screen. Original drawing. */
export const CLAUDE = [
  '..bbbbbbb..',
  '.bbbbbbbbb.',
  '.bpppppppb.',
  '.bpipppppb.',
  '.bppippppb.',
  '.bpipiiipb.',
  '.bpppppppb.',
  '.bbbbbbbbb.',
  '...bbbbb...',
  '...bbbbb...',
  '....b.b....',
];

/** Codex CLI: an antenna bot with a light face and two eyes. Original drawing. */
export const CODEX = [
  '..l.....l..',
  '...i...i...',
  '..iiiiiii..',
  '.iilllllii.',
  '.ilplllpli.',
  '.illllllli.',
  '.illiiilli.',
  '..iiiiiii..',
  '...iiiii...',
  '...iiiii...',
  '....i.i....',
];

/** The ✳ wordmark: my marker. */
export const STAR = GLYPH.map((row) => row.replaceAll('1', 'b').replaceAll('0', '.'));

export const TICKET = ['aaaaa.', 'aaaaaa', 'aaaaaa', 'aaaaaa', 'aaaaaa'];
export const CROSS = ['i...i', '.i.i.', '..i..', '.i.i.', 'i...i'];
export const CHECK = ['....b', '...bb', 'b.bb.', 'bbb..', '.b...'];

/** Crisp SVG rects for a bitmap, for static use in Astro markup. */
export function rects(bitmap: string[]) {
  const out: { x: number; y: number; fill: string }[] = [];
  bitmap.forEach((row, y) =>
    [...row].forEach((c, x) => c !== '.' && COLORS[c] && out.push({ x, y, fill: COLORS[c] })),
  );
  return { w: Math.max(...bitmap.map((r) => r.length)), h: bitmap.length, cells: out };
}
