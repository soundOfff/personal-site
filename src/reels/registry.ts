import type { ReelConfig, SectionId } from './types';
import { SECTION_IDS } from './types';
import house from './house/config';
import parasite from './parasite/config';
import mood from './mood/config';
import br2049 from './br2049/config';
import budapest from './budapest/config';
import odyssey from './odyssey/config';

/** Switcher order. House lights is first and is the default. */
export const REELS: readonly ReelConfig[] = [house, parasite, mood, br2049, budapest, odyssey];

export const DEFAULT_REEL = 'house';

/** localStorage keys. Read by the inline bootstrap in BaseLayout too. */
export const REEL_KEY = 'tb-reel';
export const SOUND_KEY = 'tb-sound';

export function reelById(id: string | undefined | null): ReelConfig | undefined {
  return REELS.find((r) => r.id === id);
}

/** Which act a section plays in for a reel; 0 when the reel has no acts. */
export function actOf(reel: ReelConfig, section: SectionId | number): number {
  const id = typeof section === 'number' ? SECTION_IDS[section] : section;
  const i = reel.acts.findIndex((a) => a.sections.includes(id));
  return i < 0 ? 0 : i;
}
