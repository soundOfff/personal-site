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
    input:
      'v4.0.0 — Security & runtime updates. Authentication tokens are now rotated automatically every 24 hours; long-lived tokens issued before this release remain valid until their original expiry. Webhook delivery now retries failed requests up to 5 times with exponential backoff, after which the event is dead-lettered. Finally, we are dropping support for Node 16, which reached end of life; the minimum supported runtime is now Node 18.',
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
    input:
      'Order confirmation — Thanks for your purchase! Your order A-4471 has been received and is being prepared for dispatch. Items: 1× mechanical keyboard (€109.90), 1× keycap set (€18.50). Order total: €128.40 incl. VAT. You will receive tracking details within 2 business days.',
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
    input:
      "TypeError: Cannot read properties of null (reading 'user')\n    at SessionStore.get session [as session] (src/auth/session-store.ts:48:31)\n    at AuthProvider.componentDidMount (src/components/AuthProvider.tsx:23:40)\n\nNotes: SessionStore.init() fetches remote config and resolves asynchronously; the constructor kicks it off but nothing awaits it before `session` is first read.",
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
