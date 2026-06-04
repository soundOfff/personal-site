import type { PromptFixture } from './types';

/**
 * Demo-mode fixtures — pre-recorded routes served with zero network, free and
 * abuse-proof. These are the four selectable prompts in the console.
 *
 * Production note: refresh these from real `live`-mode recordings whenever the
 * providers or routing logic change materially, or the showcase goes stale.
 */
export const FIXTURES: PromptFixture[] = [
  {
    key: 'summarize',
    prompt: 'Summarize this release note in three bullets.',
    model: 'llama-3.1-8b',
    provider: 'Groq',
    tone: 'sage',
    latency: '240 ms',
    cost: '$0.00004',
    why: 'Extractive and short — the smallest model clears the bar.',
    response:
      '•  Auth tokens now rotate every 24 hours.\n•  Webhook retries are capped at 5 with backoff.\n•  Node 16 is dropped; minimum runtime is Node 18.',
  },
  {
    key: 'extract',
    prompt: 'Pull the order id, total and currency as JSON.',
    model: 'gpt-4o-mini',
    provider: 'OpenAI',
    tone: 'blue',
    latency: '410 ms',
    cost: '$0.00012',
    why: 'Structured output — a mid-tier model with dependable JSON.',
    response: '{\n  "order_id": "A-4471",\n  "total": 128.40,\n  "currency": "EUR"\n}',
  },
  {
    key: 'debug',
    prompt: 'Explain this stack trace and propose a fix.',
    model: 'qwen-2.5-72b',
    provider: 'OpenRouter',
    tone: 'clay',
    latency: '980 ms',
    cost: '$0.00071',
    why: 'Multi-step reasoning — only the large model passes eval.',
    response:
      'The null pointer is thrown because `session` is read before `init()` resolves. Await the init promise in the constructor, or guard the getter with `if (!ready) return null`. Root cause: a race between mount and the async config fetch.',
  },
  {
    key: 'haiku',
    prompt: 'Write a haiku about hairlines.',
    model: 'llama-3.1-8b',
    provider: 'Groq',
    tone: 'sage',
    latency: '180 ms',
    cost: '$0.00002',
    why: 'A tiny creative task — the smallest model, no contest.',
    response: 'One pixel, holding —\na page divided by light,\nno shadow needed.',
  },
];
