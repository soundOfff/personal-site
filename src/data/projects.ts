export interface Project {
  id: string;
  name: string;
  category: 'Experience' | 'Product' | 'Open source' | 'Experiment';
  description: string;
  stack: string;
  website: string | null;
  source: string | null;
  caseStudy: string | null;
  image: string | null;
}

export const projects: Project[] = [
  {
    id: 'mint',
    name: 'Mint Mobile',
    category: 'Experience',
    description:
      'E-commerce APIs for a platform with 2–3 million subscribers at the time. Inventory, checkout and services around a WordPress order system.',
    stack: 'React · WordPress · Postgres · Microservices',
    website: 'https://www.mintmobile.com/',
    source: null,
    caseStudy: '/work/mint',
    image: null,
  },
  {
    id: 'dex',
    name: 'Dex',
    category: 'Experience',
    description:
      'CRM features across web and mobile, plus multi-model routing with task-specific evals across OpenAI, Groq and OpenRouter.',
    stack: 'Web · Mobile · Python · LLM routing',
    website: 'https://getdex.com/',
    source: null,
    caseStudy: '/work/dex',
    image: '/previews/dex.webp',
  },
  {
    id: 'sift',
    name: 'Sift',
    category: 'Product',
    description:
      'A study companion for YouTube. Capture concepts, timestamped frames and diagrams in a local notebook beside the video.',
    stack: 'TypeScript · Chrome extension · AI',
    website: null,
    source: null,
    caseStudy: null,
    image: '/previews/sift.png',
  },
  {
    id: 'second-brain',
    name: 'Second Brain',
    category: 'Open source',
    description:
      'An agent-maintained wiki and reading queue. Linked ideas, source citations and checks for conflicting claims.',
    stack: 'Python · TypeScript · Knowledge graphs',
    website: null,
    source: 'https://github.com/soundOfff/second-brain',
    caseStudy: null,
    image: null,
  },
  {
    id: 'catcher',
    name: 'Catcher',
    category: 'Product',
    description:
      'Capture UI components from a web page into a personal library, then adapt them for your own codebase.',
    stack: 'TypeScript · Chrome extension',
    website: null,
    source: null,
    caseStudy: null,
    image: '/previews/catcher.jpg',
  },
  {
    id: 'focus-quote',
    name: 'FocusQuote',
    category: 'Open source',
    description:
      'Save passages from the web, organise quotes in a tag graph and review goal-based focus sessions with optional AI reports.',
    stack: 'Preact · Effect · Hono · SQLite',
    website: null,
    source: 'https://github.com/soundOfff/focus-quote',
    caseStudy: null,
    image: '/previews/focus-quote.png',
  },
  {
    id: 'on-call',
    name: 'On-Call',
    category: 'Product',
    description:
      'Monitoring events become incidents with timelines, escalation policies and on-call rotations.',
    stack: 'React · Django · MongoDB',
    website: null,
    source: null,
    caseStudy: null,
    image: null,
  },
  {
    id: 'curation',
    name: 'Curation Archive',
    category: 'Product',
    description:
      'A visual archive ranked by a model trained on my own labels, with source tracking and duplicate detection.',
    stack: 'TypeScript · Python · CLIP',
    website: null,
    source: null,
    caseStudy: null,
    image: null,
  },
  {
    id: 'editorial',
    name: 'Editorial UI',
    category: 'Open source',
    description:
      'A published component library and token system for content-first interfaces. Used to build this site.',
    stack: 'TypeScript · React · CSS',
    website: 'https://www.npmjs.com/package/editorial-ui',
    source: 'https://github.com/soundOfff/editorial-ui',
    caseStudy: null,
    image: null,
  },
  {
    id: 'dana',
    name: 'Dana',
    category: 'Product',
    description:
      'AI meeting preparation that gathers context from calendars, email, Slack and the web into a brief.',
    stack: 'AI · Integrations · Web',
    website: 'https://danahq.com/',
    source: null,
    caseStudy: null,
    image: '/previews/dana.png',
  },
  {
    id: '60-seconds',
    name: '60 Seconds to Prompt',
    category: 'Experiment',
    description:
      'A prompt-to-UI practice game. Compose an interface from a brief and get feedback from a panel of model judges.',
    stack: 'Next.js · React · AI SDK · OpenRouter',
    website: null,
    source: null,
    caseStudy: null,
    image: null,
  },
  {
    id: 'letterboxd',
    name: 'Letterboxd Story',
    category: 'Experiment',
    description:
      'Turn a Letterboxd diary into an illustrated PDF story, with SVG scenes and a palette derived from viewing activity.',
    stack: 'TypeScript · SVG · PDF · LLMs',
    website: null,
    source: null,
    caseStudy: null,
    image: '/previews/letterboxd/scene-1.svg',
  },
  {
    id: 'a2ui',
    name: 'Conversational portfolio',
    category: 'Open source',
    description:
      'Ask about my work and an agent responds with cards, comparisons and diagrams using a validated A2UI component catalog.',
    stack: 'Astro · React · A2UI · Cloudflare',
    website: '#playground',
    source: 'https://github.com/soundOfff/personal-site',
    caseStudy: '/work/flagship',
    image: null,
  },
];
