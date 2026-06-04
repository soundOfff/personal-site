/**
 * The four Blog pillars + homepage ordering. Kept in a PURE module (no
 * astro:content / loader imports) so pages can import these constants without
 * pulling the content-loader machinery into their bundle. content.config.ts
 * imports PILLARS from here for the schema enum.
 */
export const PILLARS = [
  'Backend & AI systems',
  'Algorithms & competitive programming',
  'Build logs',
  'Startup engineering & opinions',
] as const;

export type Pillar = (typeof PILLARS)[number];

/** Homepage surfaces technical posts first — lower number = higher priority. */
export const PILLAR_PRIORITY: Record<Pillar, number> = {
  'Backend & AI systems': 0,
  'Algorithms & competitive programming': 1,
  'Build logs': 2,
  'Startup engineering & opinions': 3,
};
