/**
 * 03 · open source. The two real public repos behind this site. Add more as
 * they go public; set `stars` to a number once known — until then it renders
 * as "—" rather than a fake count.
 *
 * Language dot colors follow the design's palette; Astro uses its brand orange.
 */
export interface Repo {
  org: string;
  name: string;
  href: string;
  description: string;
  language: string;
  /** hex for the 8px language swatch. */
  color: string;
  /** star count, or null while unknown. */
  stars: number | null;
}

export const repos: Repo[] = [
  {
    org: 'soundOfff/',
    name: 'editorial-ui',
    href: 'https://github.com/soundOfff/editorial-ui',
    description:
      'The warm-paper, one-amber, hairline-over-shadows React design system this whole site is built on.',
    language: 'TypeScript',
    color: '#3178C6',
    stars: null,
  },
  {
    org: 'soundOfff/',
    name: 'personal-site',
    href: 'https://github.com/soundOfff/personal-site',
    description: 'This site. Astro, near-zero JS, with a live multi-LLM router island on the edge.',
    language: 'Astro',
    color: '#FF5D01',
    stars: null,
  },
];
