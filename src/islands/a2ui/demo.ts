/**
 * Demo mode: four pre-recorded A2UI transcripts, bundled into the island.
 *
 * The same argument as the router demo this replaced. The section has to be
 * fully interactive for someone who opens the page with no network round-trip,
 * no API key configured on a fresh clone, and no exposure to the daily budget —
 * so demo is the default, and live is the thing you opt into.
 *
 * These are the wire format, hand-written: surfaces, a data model, and bindings,
 * exactly as the agent would emit them. That is on purpose. Nothing here imports
 * the catalog or the validator, so the client bundle carries no server code, and
 * the protocol stays legible to anyone reading the repo — this file is the
 * clearest single answer to "what does an A2UI message actually look like?".
 */

import type { A2uiMessage } from '../../lib/a2ui/types';

interface Spec {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  /**
   * Props that belong in the data model rather than the surface. Lifted to
   * `/<id>/<prop>` and replaced with a binding — the same normalisation the
   * server applies to live turns, so both modes render through one path.
   */
  data?: Record<string, unknown>;
  children?: string[];
}

function surface(root: string, specs: Spec[]): A2uiMessage[] {
  const model: Record<string, Record<string, unknown>> = {};
  const components = specs.map((spec) => {
    const props: Record<string, unknown> = { ...spec.props };
    for (const [key, value] of Object.entries(spec.data ?? {})) {
      (model[spec.id] ??= {})[key] = value;
      props[key] = { path: `/${spec.id}/${key}` };
    }
    if (spec.children) props.children = spec.children;
    return { id: spec.id, componentProperties: { [spec.type]: props } };
  });

  const messages: A2uiMessage[] = [];
  if (Object.keys(model).length) messages.push({ dataModelUpdate: { path: '/', contents: model } });
  messages.push({ surfaceUpdate: { components } });
  messages.push({ beginRendering: { root } });
  return messages;
}

export interface DemoTurn {
  /** Words that route a question here. Matched as whole words, case-insensitive. */
  match: string[];
  summary: string;
  messages: A2uiMessage[];
}

/* ------------------------------------------------------------- transcripts */

const WORK: DemoTurn = {
  match: ['work', 'shipped', 'built', 'project', 'projects', 'experience', 'case', 'studies'],
  summary: 'Listed the three case studies: Dex, Mint and the Flagship.',
  messages: surface('root', [
    { id: 'root', type: 'Stack', children: ['intro', 'dex', 'mint', 'flag', 'next'] },
    {
      id: 'intro',
      type: 'Text',
      props: {
        text: 'Three case studies. **Dex** is the LLM routing work, **Mint** is the scale work, and the **Flagship** is this page — the only one that ships its own source.',
      },
    },
    {
      id: 'dex',
      type: 'ProjectCard',
      props: {
        title: 'Dex: multi-LLM routing',
        description:
          'Classify-then-dispatch in front of OpenAI, Groq and OpenRouter, balancing latency, cost and quality.',
        stack: 'Routing · evals',
        year: '2025',
        href: '/work/dex',
        badge: 'case study',
      },
    },
    {
      id: 'mint',
      type: 'ProjectCard',
      props: {
        title: 'Mint: 2–3M-user scale',
        description:
          'High-traffic e-commerce APIs serving 2–3M users: the backend that stayed correct and fast under real load.',
        stack: 'Microservices · Postgres',
        year: '2023',
        href: '/work/mint',
        badge: 'case study',
      },
    },
    {
      id: 'flag',
      type: 'ProjectCard',
      props: {
        title: 'Flagship: AI playground',
        description:
          'This conversational portfolio, built end to end: agent, protocol, renderer and the edge backend behind it.',
        stack: 'Astro · TS · serverless',
        year: '2026',
        href: '/work/flagship',
        badge: 'real code',
      },
    },
    {
      id: 'next',
      type: 'Actions',
      props: {
        prompts: [
          'How does the routing at Dex work?',
          'What did Mint have to survive?',
          'How is this page built?',
        ],
      },
    },
  ]),
};

const WRITING: DemoTurn = {
  match: ['writing', 'write', 'blog', 'post', 'posts', 'article', 'articles', 'reading'],
  summary: 'Showed the four most recent posts across the writing pillars.',
  messages: surface('root', [
    { id: 'root', type: 'Stack', children: ['intro', 'posts', 'next'] },
    {
      id: 'intro',
      type: 'Text',
      props: {
        text: 'Four pillars: backend and AI systems, algorithms, build logs, and startup engineering. The AI-systems posts are the ones closest to the work.',
      },
    },
    {
      id: 'posts',
      type: 'BlogList',
      data: {
        items: [
          {
            title: 'Routing beats scaling: a cost study',
            href: '/blog/routing-beats-scaling',
            date: '2026-05-12',
            readingTime: '7 min',
            pillar: 'Backend & AI systems',
          },
          {
            title: 'Evals are contracts',
            href: '/blog/evals-are-contracts',
            date: '2026-04-21',
            readingTime: '6 min',
            pillar: 'Backend & AI systems',
          },
          {
            title: 'Rate-limiting a public inference endpoint',
            href: '/blog/rate-limiting-inference',
            date: '2026-03-18',
            readingTime: '6 min',
            pillar: 'Backend & AI systems',
          },
          {
            title: 'What ICPC trains you to see',
            href: '/blog/what-icpc-trains-you-to-see',
            date: '2026-01-20',
            readingTime: '6 min',
            pillar: 'Algorithms & competitive programming',
          },
        ],
      },
    },
    {
      id: 'next',
      type: 'Actions',
      props: {
        prompts: ['What is an eval, in his words?', 'Show me the algorithms posts'],
      },
    },
  ]),
};

const ROUTING: DemoTurn = {
  match: ['routing', 'route', 'router', 'llm', 'model', 'models', 'classify', 'cost', 'cheapest'],
  summary: 'Explained classify-then-dispatch and showed the classifier with the model ladder.',
  messages: surface('root', [
    { id: 'root', type: 'Stack', children: ['intro', 'code', 'table', 'note', 'next'] },
    {
      id: 'intro',
      type: 'Text',
      props: {
        text: 'Classify the prompt, then dispatch to the cheapest model that clears that class. The classifier is a heuristic, not a model call — it has to be cheaper than what it is deciding about.',
      },
    },
    {
      id: 'code',
      type: 'CodeBlock',
      props: {
        language: 'ts',
        code: `export function classify(prompt: string): PromptClass {
  const p = prompt.toLowerCase();
  if (/\\bjson\\b|\\bextract\\b|\\bschema\\b/.test(p)) return 'structured';
  if (/stack trace|debug|root cause|\\bwhy\\b/.test(p)) return 'reasoning';
  if (/haiku|poem|story|write a/.test(p)) return 'creative';
  return prompt.length > 280 ? 'reasoning' : 'extractive';
}`,
        caption: 'The classifier from the Dex case study.',
      },
    },
    {
      id: 'table',
      type: 'Table',
      props: {
        columns: ['class', 'model', 'why'],
        caption: 'Cheapest first; climb only when forced.',
      },
      data: {
        rows: [
          ['extractive', 'llama-3.1-8b', 'short and mechanical — the floor clears it'],
          ['creative', 'llama-3.1-8b', 'small creative tasks do not need the ladder'],
          ['structured', 'gpt-4o-mini', 'well-formed output is worth one rung'],
          ['reasoning', 'qwen-2.5-72b', 'only the larger model passes the eval'],
        ],
      },
    },
    {
      id: 'note',
      type: 'Callout',
      props: {
        tone: 'info',
        text: 'The rung a class sits on is decided by an eval, not by taste — see **[Evals are contracts](/blog/evals-are-contracts)**.',
      },
    },
    {
      id: 'next',
      type: 'Actions',
      props: {
        prompts: ['What did that save in production?', 'How is the endpoint rate-limited?'],
      },
    },
  ]),
};

const BACKGROUND: DemoTurn = {
  match: [
    'who',
    'background',
    'about',
    'him',
    'he',
    'skills',
    'stack',
    'strong',
    'good',
    'icpc',
    'hire',
    'hiring',
    'proof',
    'competitive',
  ],
  summary: 'Showed the headline proof points and the recurring toolbox.',
  messages: surface('root', [
    { id: 'root', type: 'Stack', children: ['intro', 'metrics', 'chips', 'link', 'next'] },
    {
      id: 'intro',
      type: 'Text',
      props: {
        text: 'Full-stack engineer who ships AI products end to end. Four years across web, mobile and the backend that keeps them alive; the competitive-programming results are the part that is externally checkable.',
      },
    },
    {
      id: 'metrics',
      type: 'Metrics',
      data: {
        items: [
          { value: '2-3M', label: 'users at Mint', accent: true },
          { value: 'ICPC', label: 'SA finalist' },
          { value: '1st', label: 'GTS alg trading' },
          { value: '4+', label: 'yrs fullstack' },
        ],
      },
    },
    {
      id: 'chips',
      type: 'Chips',
      props: {
        items: ['TypeScript', 'Python', 'C++', 'Go', 'Postgres', 'Redis', 'Cloudflare', 'evals'],
      },
    },
    { id: 'link', type: 'Link', props: { label: 'Read the CV', href: '/cv.pdf' } },
    {
      id: 'next',
      type: 'Actions',
      props: { prompts: ['What has he shipped?', 'What is he working on now?'] },
    },
  ]),
};

/** Shown before the first question, and when nothing else matches. */
export const WELCOME: DemoTurn = {
  match: [],
  summary: 'Introduced the agent and offered three starting questions.',
  messages: surface('root', [
    { id: 'root', type: 'Stack', children: ['intro', 'note', 'next'] },
    {
      id: 'intro',
      type: 'Text',
      props: {
        text: 'Ask about the work, the writing, or the background. Every answer comes back as generated UI — cards, tables, timelines — not as a paragraph.',
      },
    },
    {
      id: 'note',
      type: 'Callout',
      props: {
        tone: 'info',
        text: 'This is **demo mode**: four recorded answers, no network call. Switch to **live** and a Claude agent composes the surface from scratch.',
      },
    },
    {
      id: 'next',
      type: 'Actions',
      props: {
        prompts: [
          'What has he shipped?',
          'How does the LLM routing work?',
          'What is he writing about?',
        ],
      },
    },
  ]),
};

const TRANSCRIPTS = [WORK, WRITING, ROUTING, BACKGROUND];

/** Starter chips under the empty composer. */
export const STARTERS = [
  'What has he shipped?',
  'How does the LLM routing work?',
  'What is he writing about?',
];

/**
 * Route a question to a transcript by counting matched keywords. Crude on
 * purpose: demo mode is a canned tour, and pretending otherwise by dressing up
 * the matcher would only make a miss more confusing. Anything unmatched falls
 * back to the welcome surface, which says plainly that live mode is the one that
 * actually answers.
 */
export function demoAnswer(question: string): DemoTurn {
  const asked = new Set(
    question
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );

  let best: DemoTurn = WELCOME;
  let bestScore = 0;

  for (const turn of TRANSCRIPTS) {
    const score = turn.match.reduce((total, word) => total + (asked.has(word) ? 1 : 0), 0);
    if (score > bestScore) {
      best = turn;
      bestScore = score;
    }
  }

  return best;
}
