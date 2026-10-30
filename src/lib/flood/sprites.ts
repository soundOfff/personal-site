import type { WorkflowAgent } from '../../data/workflow';

/**
 * Original pixel characters for the people in the workflow, drawn from scratch rather than from
 * any company's mark. Rows use the Bitmap.astro keys: k ink, b blue, l light, p paper.
 */
export const SPRITES: Record<'me' | WorkflowAgent['id'], readonly string[]> = {
  me: [
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
};

export type SpriteId = keyof typeof SPRITES;
