// Rebuilds demos.json from public/demos/<slug>/chapters.json. Run from the repo root:
//   node src/prototypes/showcase/content/sync-demos.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const out = {};
for (const slug of ['sift', 'focus-quote', 'catcher']) {
  const dir = `public/demos/${slug}`;
  const meta = JSON.parse(readFileSync(`${dir}/chapters.json`, 'utf8'));
  out[slug] = {
    mp4: `/demos/${slug}/loop.mp4`,
    webm: `/demos/${slug}/loop.webm`,
    poster: `/demos/${slug}/poster.webp`,
    duration: meta.duration,
    chapters: meta.chapters.map((c) => ({ t: c.t, label: c.label, still: `/demos/${slug}/${c.still}` })),
    walkthrough: existsSync(`${dir}/walkthrough.mp4`) ? `/demos/${slug}/walkthrough.mp4` : null,
  };
}
writeFileSync('src/prototypes/showcase/content/demos.json', JSON.stringify(out, null, 2) + '\n');
console.log(Object.entries(out).map(([k, v]) => `${k}: ${v.chapters.length} chapters, ${v.duration}s`).join('\n'));
