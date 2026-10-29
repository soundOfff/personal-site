// Original pixel characters, drawn from scratch. k ink, b cobalt, l light, p paper, . empty.
export const COLORS: Record<string, string> = {
  k: '#182126',
  b: '#0024cc',
  l: '#8a9bff',
  p: '#f7f3e9',
};

export const SPRITES = {
  tomas: [
    '...kkkk...',
    '..kkkkkk..',
    '.kkkkkkkk.',
    '.kkppppkk.',
    '.kpkppkpk.',
    '.kppppppk.',
    '..kpkkpk..',
    '...kppk...',
    '..bbbbbb..',
    '.bbbbbbbb.',
    'b.bbbbbb.b',
    '..bb..bb..',
    '..kk..kk..',
  ],
  claude: [
    '....kk....',
    '....bb....',
    '.bbbbbbbb.',
    '.bppppppb.',
    '.bpkppkpb.',
    '.bppppppb.',
    '.bbbbbbbb.',
    '...bbbb...',
    '.bbbbbbbb.',
    'b.bbbbbb.b',
    '..bb..bb..',
    '..bb..bb..',
    '..kk..kk..',
  ],
  codex: [
    'kkkkkkkkkk',
    'kppppppppk',
    'kpbppppppk',
    'kppbpppppk',
    'kpbppbbbpk',
    'kppppppppk',
    'kkkkkkkkkk',
    '...kllk...',
    '.llllllll.',
    'l.llllll.l',
    '..ll..ll..',
    '..ll..ll..',
    '..kk..kk..',
  ],
} as const;

export type SpriteId = keyof typeof SPRITES;

export function rects(id: SpriteId) {
  const out: { x: number; y: number; fill: string }[] = [];
  SPRITES[id].forEach((row, y) =>
    [...row].forEach((c, x) => c !== '.' && out.push({ x, y, fill: COLORS[c] })),
  );
  return out;
}
