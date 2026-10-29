// Original pixel sprites for the assembly line. One string per row, one char per pixel.
// b blue, l light, k ink, p paper, a amber, . transparent.
export const INK: Record<string, string> = {
  b: '#0024cc',
  l: '#8a9bff',
  k: '#182126',
  p: '#f7f3e9',
  a: '#e0b81f',
};

const claudeBody = [
  '..........',
  '..........',
  '..bbbbbb..',
  '.bbbbbbbb.',
  '.bbpbbpbb.',
  '.bbpbbpbb.',
  '.bbbbbbbb.',
  'bbbbbbbbbb',
  '.bbbbbbbb.',
  '.bbbbbbbb.',
];

/** Claude Code: a squat cobalt worker. Frames: idle, stride, arms up, blink. */
export const CLAUDE = [
  [...claudeBody, '..b....b..', '..b....b..'],
  [...claudeBody, '..b....b..', '.b......b.'],
  [
    ...claudeBody.slice(0, 6),
    'bbbbbbbbbb',
    '.bbbbbbbb.',
    '.bbbbbbbb.',
    '.bbbbbbbb.',
    '..b....b..',
    '..b....b..',
  ],
  [
    ...claudeBody.slice(0, 4),
    '.bbbbbbbb.',
    '.bbpbbpbb.',
    ...claudeBody.slice(6),
    '..b....b..',
    '..b....b..',
  ],
];

const codexHead = [
  '....kk....',
  '.kkkkkkkk.',
  '.kppppppk.',
  '.kpkppppk.',
  '.kppkpppk.',
  '.kpkpkkpk.',
  '.kkkkkkkk.',
  '...llll...',
];

/** Codex CLI: a tall terminal-headed worker. Frames: idle, stride, typing, cursor off. */
export const CODEX = [
  [...codexHead, '.llllllll.', '.llllllll.', '..l....l..', '..l....l..'],
  [...codexHead, '.llllllll.', '.llllllll.', '..l....l..', '.l......l.'],
  [...codexHead, 'llllllllll', '.llllllll.', '..l....l..', '..l....l..'],
  [
    ...codexHead.slice(0, 5),
    '.kpkppppk.',
    ...codexHead.slice(6),
    '.llllllll.',
    '.llllllll.',
    '..l....l..',
    '..l....l..',
  ],
];

/** The ticket, plain and stamped with a check once it ships. */
export const TICKET = [
  ['kkkkkkkkk', 'kaapppppk', 'kaapkkkpk', 'kaapppppk', 'kaapkkppk', 'kkkkkkkkk'],
  ['kkkkkkkkk', 'kaappppbk', 'kaapppbbk', 'kaabpbbpk', 'kaabbbppk', 'kkkkkkkkk'],
];

/** Station icons, 7×7. */
export const ICONS: Record<string, string[]> = {
  frame: ['...k...', '.k.k.k.', '..kkk..', 'kkkkkkk', '..kkk..', '.k.k.k.', '...k...'],
  design: ['kkkk...', 'k..k...', 'k..kkkk', 'kkkk..k', '...k..k', '...kkkk', '.......'],
  build: ['..kkk..', '..kkk..', '.......', 'kkk.kkk', 'kkk.kkk', '.......', 'kkkkkkk'],
  verify: ['.kkk...', 'k...k..', 'k...k..', 'k...k..', '.kkkk..', '....kk.', '.....kk'],
  decide: ['...k...', '.k.k.k.', '..kkk..', 'kkkkkkk', '..kkk..', '.k.k.k.', '...k...'],
};

export interface Run {
  x: number;
  y: number;
  w: number;
  c: string;
}

/** Horizontal runs of one color, so a sprite is a handful of <rect>s. */
export function runs(rows: string[], color?: string): Run[] {
  const out: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === '.') {
        x++;
        continue;
      }
      let w = 1;
      while (row[x + w] === c) w++;
      out.push({ x, y, w, c: color ?? INK[c] });
      x += w;
    }
  });
  return out;
}
