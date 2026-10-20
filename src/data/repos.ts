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
      "A Chrome extension I'm building for taking notes from YouTube videos. It saves concepts, timestamped frames and diagrams to a local notebook.",
    language: 'TypeScript',
    color: '#3178c6',
    private: true,
  },
  {
    org: 'soundOfff/',
    name: 'Second Brain',
    href: 'https://github.com/soundOfff/second-brain',
    description:
      'Agents organise a wiki of reading notes, with linked ideas, citations and checks for conflicting claims. A keyboard-driven web app handles the reading queue.',
    language: 'Python',
    color: '#658367',
  },
  {
    org: 'soundOfff/',
    name: 'On-Call',
    href: 'https://github.com/soundOfff/pagerduty-app',
    description:
      'An app for tracking monitoring events and incidents, with timelines, escalation policies and on-call rotations. Built with React, Django and MongoDB.',
    language: 'JavaScript · Python',
    color: '#b49845',
    private: true,
  },
  {
    org: 'soundOfff/',
    name: 'Curation Archive',
    href: 'https://github.com/soundOfff/not-archillect',
    description:
      'An image archive ranked by a model trained on my own labels. It tracks sources, removes duplicates and shows one image at a time on the homepage.',
    language: 'TypeScript · Python',
    color: '#927088',
    private: true,
  },
];
