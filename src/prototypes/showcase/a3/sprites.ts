/** 8x8 pixel marks for the workflow cast. Original drawings, no company logos. */
export const SPRITES = {
  tomas: [
    '...XX...',
    '..XXXX..',
    '..XXXX..',
    '...XX...',
    '.XXXXXX.',
    'X.XXXX.X',
    '..XXXX..',
    '..X..X..',
  ],
  claude: [
    'XXXXXXXX',
    'X......X',
    'X.X....X',
    'X..X...X',
    'X.X.XX.X',
    'X......X',
    'XXXXXXXX',
    '........',
  ],
  codex: [
    'XXXXXXXX',
    'XXXXXXXX',
    'X......X',
    'X.XX.X.X',
    'X......X',
    'X.XXX..X',
    'XXXXXXXX',
    '........',
  ],
} as const;

export type SpriteId = keyof typeof SPRITES;

export function cells(id: SpriteId): [number, number][] {
  return SPRITES[id].flatMap((row, y) =>
    [...row].flatMap((c, x) => (c === 'X' ? [[x, y] as [number, number]] : [])),
  );
}
