import { projects, workSlug, type Project } from '../../../data/projects';
import stories from '../../../data/project-stories.json';
import demos from './demos.json';

export interface Chapter {
  /** Seconds into loop.mp4. */
  t: number;
  label: string;
  /** Absolute URL of the still for this beat. */
  still: string;
}

export interface Demo {
  mp4: string;
  webm: string;
  poster: string;
  duration: number;
  chapters: Chapter[];
  /** Narrated full-length cut, only when one exists. */
  walkthrough: string | null;
}

export interface Featured {
  project: Project;
  href: string;
  subtitle: string;
  story: string;
  flow: string[];
  status: string;
  demo: Demo;
}

type Story = (typeof stories)[keyof typeof stories];

/** Featured products, in landing order, each with its recorded demo (public/demos/<slug>/). */
export const selected: Featured[] = (['sift', 'focus-quote', 'catcher'] as const).map((id) => {
  const project = projects.find((p) => p.id === id)!;
  const story = stories[id] as Story;
  return {
    project,
    href: `/work/${workSlug(project)}`,
    subtitle: story.subtitle,
    story: story.story,
    flow: story.flow,
    status: story.status,
    demo: (demos as Record<string, Demo>)[id],
  };
});
