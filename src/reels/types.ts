/**
 * The reel contract. A reel is a film the visitor can screen the homepage
 * through: the nine sections and their content never change, everything else
 * (palette per act, type, layout, scroll scenes, motifs, sound) is the reel's.
 *
 * A film is a config. The engine reads only the data in `ReelConfig`; the
 * film-specific code lives in the reel's own folder:
 *
 *   src/reels/<id>/config.ts   this data
 *   src/reels/<id>/reel.css    every selector scoped under :root[data-reel='<id>']
 *   src/reels/<id>/Stage.astro reel-only markup, rendered at the `stages` points
 *   src/reels/<id>/client.ts   default-exports a ReelModule, loaded on demand
 */

/** The homepage sections, in page order. The index is the section's `data-sec`. */
export const SECTION_IDS = [
  'readme',
  'playground',
  'work',
  'oss',
  'log',
  'writing',
  'principles',
  'stack',
  'now',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/**
 * One act's palette, written straight onto the editorial-ui tokens the whole
 * site already reads, so a reel restyles every component without touching it.
 */
export interface ActTokens {
  /** behind the sheet → --page */
  page: string;
  /** the section ground → --paper */
  paper: string;
  /** rail, insets, wells → --paper-2 */
  paper2: string;
  /** hover / active fills, raised cards → --paper-3 */
  paper3: string;
  /** → --ink */
  ink: string;
  /** → --ink-2 */
  ink2: string;
  /** → --muted (must hold 4.5:1 on `paper`) */
  muted: string;
  /** → --muted-2 (decorative only) */
  muted2: string;
  /** hairlines → --rule */
  rule: string;
  /** stronger hairlines → --rule-2 */
  rule2: string;
  /** the act's one accent fill → --amber */
  accent: string;
  /** accent as text / strokes (4.5:1 on `paper`) → --amber-deep */
  accentInk: string;
  /** accent wash → --amber-soft */
  accentSoft: string;
  /** text on an `accent` fill → --on-accent */
  onAccent: string;
  /** reel-specific extras, written as `--<key>` (e.g. { peach: '#E9A283' } → --peach) */
  vars?: Record<string, string>;
}

export interface Act {
  /** short mark shown in nav/HUD (e.g. 'B1', '2046', 'III') */
  code: string;
  name: string;
  /** the name in the film's own language, when there is one */
  native?: string;
  /** a screenplay-style slug for the act */
  slug?: string;
  /** which sections play in this act; every section belongs to exactly one act */
  sections: SectionId[];
  tokens: ActTokens;
}

export interface ReelType {
  /** CSS font-family stacks. `display` also drives --font-serif (the site's headline face). */
  display: string;
  body: string;
  mono: string;
  /** the title-card face */
  title?: string;
}

/**
 * Where a reel's Stage.astro can render:
 *   backdrop      first thing in <body>: fixed layers (grain, haze, rain, HUD frames)
 *   rail          inside the rail, after the switcher
 *   in:<section>  first child of that <section> (it is position: relative): scenery, props
 *   after:<sec>   between that section and the next: interludes, pinned scroll scenes
 *   credits       end of the content column, before the footer
 *   title         this reel's own title card inside the projector
 */
export type StagePoint =
  | 'backdrop'
  | 'rail'
  | 'title'
  | 'credits'
  | `after:${SectionId}`
  | `in:${SectionId}`;

export interface ReelConfig {
  /** stable id: the `data-reel` value, the folder name, the storage value */
  id: string;
  /** '00'…'05' on the switcher */
  n: string;
  title: string;
  native?: string;
  year?: number;
  director?: string;
  ratio?: string;
  /** one line under the title on the switcher (e.g. '2019 · Bong Joon-ho · 2.39:1') */
  meta: string;
  /** colour bands for the switcher's film-strip swatch: [colour, weight] */
  bands: [string, number][];
  /** empty for House lights, which keeps the editorial-ui theme (and its dark mode) */
  acts: Act[];
  type?: ReelType;
  /** reel-only text per section, rendered into that section's keybar */
  sections?: Partial<Record<SectionId, { slug?: string }>>;
  /** the Stage.astro points this reel renders; the engine wraps and shows/hides them */
  stages: StagePoint[];
  /** descriptive, for the registry/builder; the real behaviour lives in client.ts */
  layout?: { nav: string; hero: string; flow: string; grid: string };
  scroll?: string[];
  motifs?: string[];
  sound?: Record<string, string>;
  credits?: string;
  /** aria-live text announced after switching to this reel */
  announce: string;
}

/** Events the rest of the page (the playground island) emits for reels to score. */
export type CueName = 'ask' | 'surface' | 'error' | 'open' | 'close';
export interface Cue {
  name: CueName;
  /** for 'surface': how many components the agent composed */
  count?: number;
}

export interface ReelContext {
  reel: ReelConfig;
  /** document.documentElement */
  root: HTMLElement;
  /** the shared synthesized kit; every call is a no-op while muted or before a gesture */
  sound: import('./sound').SoundKit;
  /** true when the visitor asked for reduced motion: no scroll scenes, no loops */
  reducedMotion: boolean;
  /** aborted when the reel unmounts; pass it to addEventListener / observers */
  signal: AbortSignal;
  /** the active section index (0–8) right now */
  section(): number;
  /** fires when the active section changes; returns an unsubscribe */
  onSection(cb: (index: number, prev: number) => void): () => void;
  /** fires on playground cues; returns an unsubscribe */
  onCue(cb: (cue: Cue) => void): () => void;
}

export interface ReelModule {
  /** Called once the reel is on screen. Return a cleanup (also run on abort). */
  mount(ctx: ReelContext): void | (() => void);
  /** The film's own sting for its title card. */
  titleSound?(ctx: ReelContext): void;
}

/**
 * A reel's score: every sound it makes, voiced after the film's soundtrack
 * (its instruments, harmony and gestures, never its melodies). It lives in
 * src/reels/<id>/score.ts; client.ts fires the cues, and an audition sheet
 * can play each one on its own.
 */
export interface ScoreCue {
  /** stable id: hover, click, section, surface, done, error, title, then the reel's own */
  id: string;
  /** what it is, in a few words (e.g. 'harpsichord quill') */
  label: string;
  /**
   * Play it on the shared kit. `n` is the section index for 'section' and the
   * component count for 'surface'. A bed returns its handle so it can be stopped.
   */
  play(s: import('./sound').SoundKit, n?: number): import('./sound').Bed | null | void;
}

export interface ReelScore {
  /** whose music the voices are after, e.g. 'after Jung Jae-il' */
  after: string;
  /** one line: what the sounds borrow from the soundtrack */
  idea: string;
  cues: ScoreCue[];
}
