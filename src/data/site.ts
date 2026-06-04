/**
 * Homepage + site content. Real Tomas Brasca, derived from BRIEF.md / CONTEXT.md.
 *
 * Search this file for `TODO` to find facts only you can confirm (exact metric
 * phrasings, social handles, reading list, stack specifics).
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
  // TODO: confirm LinkedIn URL.
  {
    label: 'linkedin.com/in/tomasbrasca',
    href: 'https://www.linkedin.com/in/tomasbrasca',
    icon: 'i-ext',
  },
  // TODO: add the real CV file at public/cv.pdf (currently a placeholder link).
  { label: 'cv.pdf', href: '/cv.pdf', icon: 'i-download' },
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
 * `accent: true` renders the value in amber. TODO: confirm exact phrasings.
 */
export const proofs: { value: string; key: string; accent?: boolean }[] = [
  { value: '2–3M', accent: true, key: 'users at Mint' },
  { value: 'ICPC', key: 'SA finalist' },
  { value: '1st', key: 'GTS algo-trading' },
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

// 07 · stack · toolbox. TODO: confirm the real toolchain — these are informed
// guesses (ICPC ⇒ C++; editorial-ui ⇒ TypeScript; Dex/LLM work ⇒ Python).
export const toolbox = [
  { h: 'Languages', items: ['TypeScript', 'Python', 'C++', 'Go', 'SQL'] },
  { h: 'Infra', items: ['Postgres', 'Redis', 'Docker', 'Cloudflare', 'Kafka'] },
  { h: 'LLM', items: ['OpenAI', 'Groq', 'OpenRouter', 'pgvector', 'evals'] },
] as const;

/**
 * 04 · log · recent activity — git-style changelog. A couple are real
 * (editorial-ui 0.1.0 publish, this site's scaffold); the rest are TODO.
 * Hashes are illustrative — TODO: wire to real commits.
 */
export const log = [
  {
    hash: 'scaffld',
    date: 'today',
    tag: 'site',
    msg: 'Scaffold the personal site — Astro shell, editorial-ui design system, demo-mode router island.',
  },
  {
    hash: 'eui010',
    date: 'this week',
    tag: 'oss',
    msg: 'Publish editorial-ui v0.1.0 — the warm-paper, one-amber, hairline design system this site is built on.',
  },
  // TODO: replace with real recent activity.
  {
    hash: 'router1',
    date: 'TODO',
    tag: 'dex',
    msg: 'TODO: a real Dex / router milestone (e.g. fallback routing when the eval gate fails).',
  },
  {
    hash: 'writing',
    date: 'TODO',
    tag: 'writing',
    msg: 'TODO: a real writing milestone (e.g. published the first build log).',
  },
] as const;

// 08 · now — spec sheet. TODO: confirm reading + any details.
export const now = [
  { dt: 'Location', dd: 'Rosario, Argentina · remote-friendly (ART, UTC−3)' },
  { dt: 'Status', dd: 'Open to senior backend / AI-infra roles & select contract work' },
  { dt: 'Email', dd: 'tomibrasca97@gmail.com' },
  { dt: 'Focus', dd: 'LLM routing, evals, cost control; high-traffic backends' },
  { dt: 'Reading', dd: 'Designing Data-Intensive Applications — TODO: confirm current read' },
  { dt: 'Built with', dd: 'Astro · React island · editorial-ui · Cloudflare' },
] as const;

export const site = {
  copyright: '© 2026',
  themeKey: 'tb-theme',
} as const;
