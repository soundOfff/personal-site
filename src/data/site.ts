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
  role: 'Backend · AI systems',
  // sage status pill (short)
  status: 'Open to work · Rosario, AR',
  // hero lede — the phrase wrapped in <em></em> renders italic + amber
  lede: "Most LLM calls don't need the biggest model — they need a dispatcher that knows which one will <em>clear the bar</em>.",
  sub: "I'm a backend engineer who builds the systems that make AI products work in production — routing, scale, evals, the unglamorous middle. Backend is the foundation, LLM infrastructure is the edge, and competitive-programming results are the proof. Below is the router itself, running in demo mode.",
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
  { label: 'CV', href: '/cv.pdf', icon: 'i-download', download: 'Resume_Brasca_Tomas.pdf' },
] as const;

// In-page rail nav. Indices render as 00–08.
export const nav = [
  { id: 'readme', label: 'readme' },
  { id: 'playground', label: 'playground' },
  { id: 'work', label: 'work index' },
  { id: 'oss', label: 'open source' },
  { id: 'log', label: 'log' },
  { id: 'writing', label: 'writing' },
  { id: 'principles', label: 'principles' },
  { id: 'stack', label: 'stack' },
  { id: 'now', label: 'now' },
] as const;

/**
 * Hero metrics strip — REFRAMED as personal proof points (per the design grill).
 * `accent: true` renders the value in amber.
 */
export const proofs: { value: string; key: string; accent?: boolean }[] = [
  { value: '2-3M', accent: true, key: 'users at Mint' },
  { value: 'ICPC', key: 'SA finalist' },
  { value: '1st', key: 'GTS algorithmic trading' },
  { value: 'SE II', key: 'engineer · Dex' },
  { value: '4+', key: 'yrs in backend' },
];

// 06 · principles — kept from the design; they map exactly to the router work.
export const tenets = [
  {
    title: 'Smallest model that passes',
    body: 'Capability is a budget, not a flex. Start at the bottom of the ladder and only climb when an eval forces you to.',
  },
  {
    title: 'Cache before you call',
    body: 'The cheapest token is the one you never send. Memoize aggressively; treat the model as the slow path.',
  },
  {
    title: 'Cap the blast radius',
    body: 'Every public endpoint gets a rate limit and a kill switch before it gets a launch tweet.',
  },
  {
    title: 'Evals are contracts',
    body: "If a behaviour isn't measured, it isn't shipped. Write the contract down, then make it runnable.",
  },
] as const;

// 07 · stack · toolbox — the tools that actually recur across the work
// (ICPC ⇒ C++; editorial-ui ⇒ TypeScript; Dex/LLM work ⇒ Python).
export const toolbox = [
  { h: 'Languages', items: ['TypeScript', 'Python', 'C++', 'Go', 'SQL'] },
  { h: 'Infra', items: ['Postgres', 'Redis', 'Docker', 'Cloudflare', 'Kafka'] },
  { h: 'LLM', items: ['OpenAI', 'Groq', 'OpenRouter', 'pgvector', 'evals'] },
] as const;

/**
 * 04 · log · recent activity — git-style changelog, newest first. Short
 * mono hashes are illustrative; dates are real milestones.
 */
export const log = [
  {
    hash: 'ship001',
    date: 'jun 2026',
    tag: 'site',
    msg: 'Ship the personal site — Astro shell, editorial-ui design system, router island, Cloudflare Worker deploy.',
  },
  {
    hash: 'unglam1',
    date: 'jun 2026',
    tag: 'writing',
    msg: 'Publish “The unglamorous middle” — why the distance between an AI demo and an AI product is all backend.',
  },
  {
    hash: 'route66',
    date: 'may 2026',
    tag: 'writing',
    msg: 'Publish “Routing beats scaling” — the classify-then-dispatch cost study behind the playground.',
  },
  {
    hash: 'live5pm',
    date: 'apr 2026',
    tag: 'flagship',
    msg: 'Wire live mode for the router playground — Worker-held keys, KV per-IP cap, cheap models only.',
  },
  {
    hash: 'eui010',
    date: 'feb 2026',
    tag: 'oss',
    msg: 'Publish editorial-ui v0.1.0 — the warm-paper, one-amber, hairline design system this site is built on.',
  },
] as const;

// 08 · now — spec sheet.
export const now = [
  { dt: 'Location', dd: 'Rosario, Argentina · remote-friendly (ART, UTC−3)' },
  { dt: 'Status', dd: 'Open to senior backend / AI-infra roles & select contract work' },
  { dt: 'Email', dd: 'tomibrasca97@gmail.com' },
  { dt: 'Focus', dd: 'LLM routing, evals, cost control; high-traffic backends' },
  { dt: 'Reading', dd: 'Designing Data-Intensive Applications — the partitioning chapters, again' },
  { dt: 'Built with', dd: 'Astro · React island · editorial-ui · Cloudflare' },
] as const;

export const site = {
  copyright: '© 2026',
  themeKey: 'tb-theme',
} as const;
