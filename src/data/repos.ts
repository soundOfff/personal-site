/**
 * 03 · open source. The two real public repos behind this site. Add more as
 * they go public.
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
  },
  {
    org: 'soundOfff/',
    name: 'personal-site',
    href: 'https://github.com/soundOfff/personal-site',
    description:
      'This site. Astro, near-zero JS, with an A2UI conversational portfolio: an agent that answers by generating UI.',
    language: 'Astro',
    color: '#FF5D01',
  },
];
