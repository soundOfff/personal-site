// Real site content lifted from src/data/site.ts, src/data/repos.ts, src/content/*.
// Pasted into each artboard's logic class (renderVals) so every variant shows the
// same true facts. No invented stats.

const CONTENT = `
  content() {
    return {
      name: 'Tomas Brasca',
      monogram: 'TB',
      role: 'Fullstack · AI systems',
      location: 'Rosario, Argentina · UTC−3',
      ledeA: "Most LLM calls don't need the biggest model. They need a dispatcher that knows which one will ",
      ledeEm: 'clear the bar',
      ledeB: '.',
      sub: "I'm a backend engineer who builds the systems that make AI products work in production: routing, scale, evals, the unglamorous middle. Backend is the foundation, LLM infrastructure is the edge, and competitive-programming results are the proof.",
      agentLine: 'Below, an agent answers questions about all of it by generating the interface it answers in.',
      proofs: [
        { v: '2–3M', k: 'users at Mint', accent: true },
        { v: 'ICPC', k: 'SA finalist' },
        { v: '1st', k: 'GTS alg trading' },
        { v: 'SE II', k: 'engineer at Dex' },
        { v: '4+', k: 'yrs fullstack' },
      ],
      nav: [
        { id: 'readme', label: 'readme' },
        { id: 'playground', label: 'playground' },
        { id: 'work', label: 'work index' },
        { id: 'oss', label: 'open source' },
        { id: 'log', label: 'log' },
        { id: 'writing', label: 'writing' },
        { id: 'principles', label: 'principles' },
        { id: 'stack', label: 'stack' },
        { id: 'now', label: 'now' },
      ],
      work: [
        { n: '01', title: 'Dex: multi-LLM routing', desc: 'Classify-then-dispatch in front of OpenAI, Groq and OpenRouter, balancing latency, cost and quality.', stack: 'Routing · evals', year: '2025', code: false },
        { n: '02', title: 'Mint: 2–3M-user scale', desc: 'High-traffic e-commerce APIs serving 2–3M users: the backend that stayed correct and fast under real load.', stack: 'Microservices · WordPress · React · Postgres', year: '2023', code: false },
        { n: '03', title: 'Flagship: conversational portfolio', desc: 'The agent on this page: ask a question about the work, get back a generated interface. A2UI protocol, custom renderer, edge backend, with the source.', stack: 'A2UI · Astro · TS · serverless', year: '2026', code: true },
      ],
      repos: [
        { org: 'soundOfff/', name: 'editorial-ui', desc: 'The warm-paper, one-amber, hairline-over-shadows React design system this whole site is built on.', lang: 'TypeScript', color: '#3178C6' },
        { org: 'soundOfff/', name: 'personal-site', desc: 'This site. Astro, near-zero JS, with an A2UI conversational portfolio: an agent that answers by generating UI.', lang: 'Astro', color: '#FF5D01' },
      ],
      log: [
        { hash: 'focusq0', date: 'soon', tag: 'coming soon', msg: 'focus-quote, a Chrome extension for focus sessions: capture quotes from the web, set a goal, get AI insights on which tabs were on-goal vs. distractions.', upcoming: true },
        { hash: 'a2ui001', date: 'jul 2026', tag: 'site', msg: 'Replace the router demo with an A2UI conversational portfolio: ask a question, a Claude agent composes the answer as generated UI over a custom renderer.' },
        { hash: 'unglam1', date: 'jun 2026', tag: 'writing', msg: 'Publish “The unglamorous middle”: joining my first startup three and a half years in, and learning the real job is the part nobody demos.' },
        { hash: 'eui010', date: 'jun 2026', tag: 'oss', msg: 'Publish editorial-ui v0.1.0: the warm-paper, one-amber, hairline design system this site is built on.' },
        { hash: 'ship001', date: 'jun 2026', tag: 'site', msg: 'Ship the personal site: Astro shell, editorial-ui design system, router island, Cloudflare Worker deploy.' },
        { hash: 'dana100', date: 'may 2026', tag: 'launch', msg: 'Launch Dana: AI meeting prep that pulls context from calendar, email, and Slack so you walk in already briefed.', link: 'danahq.com' },
      ],
      posts: [
        { date: '2026-04-21', title: 'Evals are contracts', rt: '6 min', pillar: 'Backend & AI systems' },
        { date: '2026-06-12', title: 'Binary search on the answer', rt: '7 min', pillar: 'Algorithms & competitive programming' },
        { date: '2026-06-12', title: 'Data structures in TypeScript and Python: what you get, what you build', rt: '10 min', pillar: 'Algorithms & competitive programming' },
        { date: '2026-06-12', title: 'The unglamorous middle', rt: '5 min', pillar: 'Startup engineering & opinions' },
        { date: '2026-06-12', title: 'Routing beats scaling: a cost study', rt: '8 min', pillar: 'Backend & AI systems' },
        { date: '2026-06-12', title: 'Rate-limiting a public inference endpoint', rt: '6 min', pillar: 'Backend & AI systems' },
      ],
      tenets: [
        { n: '01', title: 'Smallest model that passes', body: 'Capability is a budget, not a flex. Start at the bottom of the ladder and only climb when an eval forces you to.' },
        { n: '02', title: 'Cache before you call', body: 'The cheapest token is the one you never send. Memoize aggressively; treat the model as the slow path.' },
        { n: '03', title: 'Cap the blast radius', body: 'Every public endpoint gets a rate limit and a kill switch before it gets a launch tweet.' },
        { n: '04', title: 'Evals are contracts', body: "If a behaviour isn't measured, it isn't shipped. Write the contract down, then make it runnable." },
      ],
      toolbox: [
        { h: 'Languages', items: ['TypeScript', 'Python', 'C++', 'Go', 'SQL'] },
        { h: 'Infra', items: ['Postgres', 'Redis', 'Docker', 'Cloudflare', 'Kafka'] },
        { h: 'LLM', items: ['OpenAI', 'Groq', 'OpenRouter', 'pgvector', 'evals'] },
      ],
      now: [
        { dt: 'Location', dd: 'Rosario, Argentina · remote-friendly (ART, UTC−3)' },
        { dt: 'Status', dd: 'Open to senior backend / AI-infra roles & select contract work' },
        { dt: 'Focus', dd: 'LLM routing, evals, cost control; high-traffic backends' },
        { dt: 'Reading', dd: 'AI Engineer' },
        { dt: 'Built with', dd: 'Astro · React island · A2UI · editorial-ui · Cloudflare' },
      ],
      contact: [
        { label: 'tomibrasca97@gmail.com', href: 'mailto:tomibrasca97@gmail.com' },
        { label: 'github.com/soundOfff', href: 'https://github.com/soundOfff' },
        { label: 'linkedin.com/in/tomasbrasca', href: 'https://www.linkedin.com/in/tomasbrasca' },
        { label: 'Resume (PDF)', href: '/cv.pdf' },
      ],
      prompts: ['What has he shipped?', 'How does the LLM routing work?', 'What is he writing about?', 'Compare Dex and Mint'],
    };
  }
`;
export default CONTENT;
