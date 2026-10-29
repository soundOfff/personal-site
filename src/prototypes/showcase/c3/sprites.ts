/** Hand-drawn bitmaps for the c3 pixel world: three party members, the idea token and a 5x7 sign font. */

export type ActorId = 'tomas' | 'claude' | 'codex' | 'idea';

/** X = ink or body colour, o = a paper hole, L = light fill. */
export const SPRITES: Record<ActorId, { rows: string[]; color: string; fill?: string }> = {
  tomas: {
    color: '#182126',
    rows: [
      '...XXX...',
      '..XXXXX..',
      '..XXXXX..',
      '...XXX...',
      '.XXXXXXX.',
      'X.XXXXX.X',
      'X.XXXXX.X',
      '..XXXXX..',
      '..XX.XX..',
      '..XX.XX..',
    ],
  },
  // A terminal on legs: a prompt chevron on its screen.
  claude: {
    color: '#0024cc',
    rows: [
      '....X....',
      '.XXXXXXX.',
      '.XoooooX.',
      '.XoXoooX.',
      '.XooXooX.',
      '.XoXoXXX.',
      '.XXXXXXX.',
      '...XXX...',
      '..XXXXX..',
      '..X...X..',
    ],
  },
  // A round scout with one lens eye.
  codex: {
    color: '#182126',
    fill: '#8a9bff',
    rows: [
      '..XXXXX..',
      '.XLLLLLX.',
      'XLLXXXLLX',
      'XLLXoXLLX',
      'XLLXXXLLX',
      '.XLLLLLX.',
      '..XXXXX..',
      '.X.XXX.X.',
      '...X.X...',
      '..XX.XX..',
    ],
  },
  idea: {
    color: '#0024cc',
    rows: ['...X...', '.X.X.X.', '..XXX..', 'XXXXXXX', '..XXX..', '.X.X.X.', '...X...'],
  },
};

const FONT: Record<string, string[]> = {
  A: ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
  B: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X...X', 'X...X', 'XXXX.'],
  C: ['.XXX.', 'X...X', 'X....', 'X....', 'X....', 'X...X', '.XXX.'],
  D: ['XXXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'XXXX.'],
  E: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX'],
  F: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'X....'],
  G: ['.XXX.', 'X...X', 'X....', 'X.XXX', 'X...X', 'X...X', '.XXXX'],
  I: ['XXX', '.X.', '.X.', '.X.', '.X.', '.X.', 'XXX'],
  L: ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX'],
  M: ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'],
  N: ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X', 'X...X', 'X...X'],
  R: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'],
  S: ['.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.'],
  U: ['X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  V: ['X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.X.X.', '..X..'],
  W: ['X...X', 'X...X', 'X...X', 'X.X.X', 'X.X.X', 'X.X.X', '.X.X.'],
};

/** Cells of a word in the sign font, one gap column between letters. */
export function sign(text: string) {
  const cells: { x: number; y: number }[] = [];
  let x = 0;
  for (const ch of text.toUpperCase()) {
    const glyph = FONT[ch];
    if (!glyph) {
      x += 3;
      continue;
    }
    glyph.forEach((row, y) => [...row].forEach((bit, dx) => bit === 'X' && cells.push({ x: x + dx, y })));
    x += glyph[0].length + 1;
  }
  return { cells, width: Math.max(1, x - 1), height: 7 };
}

/** Sprite cells grouped by colour, for SVG rendering. */
export function spriteCells(id: ActorId) {
  const s = SPRITES[id];
  const out: { x: number; y: number; fill: string }[] = [];
  s.rows.forEach((row, y) =>
    [...row].forEach((bit, x) => {
      if (bit === 'X') out.push({ x, y, fill: s.color });
      else if (bit === 'L') out.push({ x, y, fill: s.fill! });
      else if (bit === 'o') out.push({ x, y, fill: '#f7f3e9' });
    }),
  );
  return { cells: out, width: s.rows[0].length, height: s.rows.length };
}
