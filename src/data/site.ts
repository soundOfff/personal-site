/**
 * Homepage + site content. Real Tomas Brasca, derived from BRIEF.md / CONTEXT.md.
 *
 * Personal facts worth a once-over before launch: the LinkedIn handle, the
 * toolbox lists, the current read in `now`, and the log milestones.
 */

export const profile = {
  name: 'Tomas Brasca',
  monogram: 'TB',
  // mono uppercase role under the name in the rail
  role: 'Full-stack engineer',
  // hero lede: the phrase wrapped in <em></em> renders italic + amber
  lede: 'I build web and mobile apps, <em>and their APIs.</em>',
  sub: "I'm Tomas, a software engineer based in Rosario, Argentina. I've worked on CRM features and LLM routing at Dex, and e-commerce APIs for Mint Mobile.",
} as const;

export const contact = [
  { label: 'tomibrasca97@gmail.com', href: 'mailto:tomibrasca97@gmail.com', icon: 'i-send' },
  { label: 'github.com/soundOfff', href: 'https://github.com/soundOfff', icon: 'i-ext' },
  {
    label: 'linkedin.com/in/tomasbrasca',
    href: 'https://www.linkedin.com/in/tomasbrasca',
    icon: 'i-ext',
  },
  // Direct PDF download (public/cv.pdf); `download` sets the saved filename.
  // The print-ready /cv page still exists for an always-current version.
  { label: 'Resume', href: '/cv.pdf', icon: 'i-download', download: 'Resume_Brasca_Tomas.pdf' },
] as const;

// In-page rail nav. Indices render as 00–08.
export const nav = [
  { id: 'readme', label: 'about' },
  { id: 'playground', label: 'playground' },
  { id: 'work', label: 'work' },
  { id: 'oss', label: 'projects' },
  { id: 'log', label: 'log' },
  { id: 'writing', label: 'blog' },
  { id: 'principles', label: 'how I work' },
  { id: 'stack', label: 'tools' },
  { id: 'now', label: 'now' },
] as const;

/**
 * Hero metrics strip: REFRAMED as personal proof points (per the design grill).
 * `accent: true` renders the value in amber.
 */
export const proofs: { value: string; key: string; accent?: boolean }[] = [
  { value: '2–3M', accent: true, key: 'subscribers at Mint Mobile' },
  { value: 'ICPC', key: 'South America finalist' },
  { value: '1st', key: 'GTS algorithmic trading' },
  { value: 'SE II', key: 'at Dex' },
  { value: '5+', key: 'years full-stack' },
];

// 07 · stack · toolbox: the tools that actually recur across the work
// (ICPC ⇒ C++; editorial-ui ⇒ TypeScript; Dex/LLM work ⇒ Python).
export const toolbox = [
  { h: 'Languages', items: ['TypeScript', 'Python', 'C++', 'Go', 'SQL'] },
  { h: 'Infra', items: ['Postgres', 'Redis', 'Docker', 'Cloudflare', 'Kafka'] },
  { h: 'LLM', items: ['OpenAI', 'Groq', 'OpenRouter', 'pgvector', 'evals'] },
] as const;

/**
 * 04 · log · recent activity: git-style changelog, newest first. Messages
 * read as commit subjects, so no trailing full stop. `hash` is a real commit
 * in this repo or absent: a made-up one would pass for evidence it isn't.
 */
export const log: {
  hash?: string;
  date: string;
  tag: string;
  msg: string;
  /** Optional link rendered after the message (a new tab when external). */
  link?: { label: string; href: string };
  /** Renders as a "coming soon" node: dashed dot, muted text. */
  upcoming?: boolean;
}[] = [
  {
    date: '15 oct 2026',
    tag: 'build',
    msg: 'Built the first version of Sift, a Chrome extension for saving notes, frames and diagrams from YouTube videos to a local notebook',
  },
  {
    date: '11 oct 2026',
    tag: 'build',
    msg: 'Working on Second Brain, a wiki and reading queue with agent-assisted notes, feed triage and source citations',
    link: { label: 'source', href: 'https://github.com/soundOfff/second-brain' },
  },
  {
    date: '21 sep 2026',
    tag: 'build',
    msg: 'Built On-Call to group monitoring events into incidents, with timelines, escalation policies and on-call rotations',
  },
  {
    date: '01 sep 2026',
    tag: 'build',
    msg: 'Working on Curation Archive, an image collection ranked by a model trained on my own labels, with duplicate detection and source tracking',
  },
  {
    hash: '0ade814',
    date: 'jul 2026',
    tag: 'site',
    msg: "Replaced this site's router demo with an agent that answers questions about my work using cards, tables and diagrams",
  },
  {
    date: 'jun 2026',
    tag: 'blog',
    msg: 'Wrote "The unglamorous middle" about joining my first startup three and a half years into my career',
    link: { label: 'read it', href: '/blog/the-unglamorous-middle' },
  },
  {
    date: 'jun 2026',
    tag: 'oss',
    msg: 'Published editorial-ui v0.1.0, the component library used on this site',
  },
  {
    hash: 'ead2d68',
    date: 'jun 2026',
    tag: 'site',
    msg: 'Built this site with Astro and editorial-ui, added a router demo, and deployed it on Cloudflare Workers',
  },
  {
    date: 'may 2026',
    tag: 'launch',
    msg: 'Launched Dana, a meeting-prep tool that gathers context from calendar events, email and Slack',
    link: { label: 'danahq.com', href: 'https://danahq.com/' },
  },
];

// 08 · now: spec sheet.
export const now = [
  { dt: 'Location', dd: 'Rosario, Argentina. Remote, UTC−3' },
  { dt: 'Status', dd: 'Open to senior full-stack and AI roles, plus contract work' },
  { dt: 'Email', dd: 'tomibrasca97@gmail.com' },
  {
    dt: 'Focus',
    dd: 'Web and mobile apps, LLM routing, evals and backend APIs',
  },
  { dt: 'Reading', dd: 'AI Engineer' },
  { dt: 'Built with', dd: 'Astro · React island · A2UI · editorial-ui · Cloudflare' },
] as const;

export const site = {
  copyright: '© 2026',
  themeKey: 'tb-theme',
} as const;
