/** Recent projects, checked against their GitHub READMEs in October 2026. */
export interface Repo {
  org: string;
  name: string;
  href: string;
  description: string;
  language: string;
  color: string;
  private?: boolean;
}

export const repos: Repo[] = [
  {
    org: 'soundOfff/',
    name: 'Sift',
    href: 'https://github.com/soundOfff/sift',
    description:
      'A Chrome companion that turns the YouTube video you watch into a local notebook, with concept notes, timestamped frames and diagrams.',
    language: 'TypeScript',
    color: '#3178c6',
    private: true,
  },
  {
    org: 'soundOfff/',
    name: 'Second Brain',
    href: 'https://github.com/soundOfff/second-brain',
    description:
      'An agent-maintained wiki with linked concepts, source citations and contradiction checks. A keyboard-driven web app handles reading and triage.',
    language: 'Python',
    color: '#658367',
  },
  {
    org: 'soundOfff/',
    name: 'On-Call',
    href: 'https://github.com/soundOfff/pagerduty-app',
    description:
      'An incident response workspace: monitoring events, incident timelines, escalation policies and on-call rotations. React, Django and MongoDB.',
    language: 'JavaScript · Python',
    color: '#b49845',
    private: true,
  },
  {
    org: 'soundOfff/',
    name: 'Curation Archive',
    href: 'https://github.com/soundOfff/not-archillect',
    description:
      'A visual archive curated by a taste model trained on my own labels, with source adapters, image deduplication and a rotating single-image homepage.',
    language: 'TypeScript · Python',
    color: '#927088',
    private: true,
  },
];
