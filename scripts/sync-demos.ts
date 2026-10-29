// Rebuilds src/data/demos.json from the recorders' output in public/demos/<slug>/.
// Run after re-recording a demo: node scripts/sync-demos.ts
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

interface Recorded {
  duration: number;
  chapters: { t: number; label: string; still: string }[];
}

const root = 'public/demos';
const demos = Object.fromEntries(
  readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(`${root}/${entry.name}/chapters.json`))
    .map(({ name }) => {
      const recorded: Recorded = JSON.parse(readFileSync(`${root}/${name}/chapters.json`, 'utf8'));
      const url = (file: string) => `/demos/${name}/${file}`;
      return [
        name,
        {
          mp4: url('loop.mp4'),
          webm: url('loop.webm'),
          poster: url('poster.webp'),
          duration: recorded.duration,
          chapters: recorded.chapters.map((c) => ({ ...c, still: url(c.still) })),
          walkthrough: existsSync(`${root}/${name}/walkthrough.mp4`)
            ? url('walkthrough.mp4')
            : null,
        },
      ];
    }),
);

writeFileSync('src/data/demos.json', `${JSON.stringify(demos, null, 2)}\n`);
console.log(Object.keys(demos).join(', '));
