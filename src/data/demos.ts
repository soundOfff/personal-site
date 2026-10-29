import recorded from './demos.json';

/** A beat of a demo loop: where it starts and what it shows. */
export interface DemoChapter {
  /** Seconds into the loop. */
  t: number;
  label: string;
  /** A still of this beat. */
  still: string;
}

/** A silent recorded loop of a product, from public/demos/<project id>/. */
export interface Demo {
  mp4: string;
  webm: string;
  poster: string;
  duration: number;
  chapters: DemoChapter[];
  /** A longer narrated cut, when one exists. */
  walkthrough: string | null;
}

const demos: Record<string, Demo> = recorded;

/** The recorded demo of a project, by project id. Regenerate with `node scripts/sync-demos.ts`. */
export function demoFor(projectId: string): Demo | undefined {
  return demos[projectId];
}
