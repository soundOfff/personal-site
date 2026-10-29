import { projects } from './projects';

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

export const repos: Repo[] = projects
  .filter((project) => project.category !== 'Experience')
  .map((project) => ({
    org: 'soundOfff/',
    name: project.name,
    href: project.source ?? project.website ?? project.caseStudy ?? '#oss',
    description: project.description,
    language: project.stack,
    color: '#3178c6',
    private: project.source === null,
  }));
