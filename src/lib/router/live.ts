import type { RouteResult, Tone } from './types';

/**
 * Live mode: classify-then-dispatch across OpenAI / Groq / OpenRouter.
 *
 * The contract this proves (the Dex thesis): most prompts don't need the
 * biggest model. We classify the prompt, then dispatch to the CHEAPEST model
 * that clears that class's bar, and only ever from a cheap-models catalog, so
 * a public endpoint can never run up a large bill.
 */

export type PromptClass = 'extractive' | 'creative' | 'structured' | 'reasoning';

/** A cheap model we're willing to dispatch to, and the classes it clears. */
interface CatalogEntry {
  provider: string;
  /** env var holding this provider's key. */
  keyName: 'OPENAI_API_KEY' | 'GROQ_API_KEY' | 'OPENROUTER_API_KEY';
  /** OpenAI-compatible chat-completions endpoint. */
  url: string;
  /** model id sent to the provider. */
  model: string;
  /** display name in the result line. */
  label: string;
  tone: Tone;
  /** USD per 1M tokens, used to compute real cost and to rank by price. */
  inPrice: number;
  outPrice: number;
  /** prompt classes this model is allowed to serve. */
  clears: PromptClass[];
}

/**
 * Ordered cheapest to dearest. `pickModel` walks this list and takes the first
 * entry that both clears the class and has its provider key configured.
 */
const CATALOG: CatalogEntry[] = [
  {
    provider: 'Groq',
    keyName: 'GROQ_API_KEY',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
    label: 'llama-3.1-8b',
    tone: 'sage',
    inPrice: 0.05,
    outPrice: 0.08,
    clears: ['extractive', 'creative'],
  },
  {
    provider: 'OpenAI',
    keyName: 'OPENAI_API_KEY',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    label: 'gpt-4o-mini',
    tone: 'blue',
    inPrice: 0.15,
    outPrice: 0.6,
    clears: ['extractive', 'creative', 'structured'],
  },
  {
    provider: 'OpenRouter',
    keyName: 'OPENROUTER_API_KEY',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'qwen/qwen-2.5-72b-instruct',
    label: 'qwen-2.5-72b',
    tone: 'clay',
    inPrice: 0.35,
    outPrice: 0.4,
    clears: ['extractive', 'creative', 'structured', 'reasoning'],
  },
];

/** Heuristic classifier: cheap and instant; swap for a model call if needed. */
export function classify(prompt: string): PromptClass {
  const p = prompt.toLowerCase();
  if (/\bjson\b|\bextract\b|\bparse\b|\bschema\b|as json|key[- ]?value|\bcsv\b|\btable\b/.test(p)) {
    return 'structured';
  }
  if (
    /stack trace|debug|root cause|\bfix\b|\bwhy\b|explain|reason|prove|step[- ]by[- ]step|complexity|algorithm/.test(
      p,
    )
  ) {
    return 'reasoning';
  }
  if (/haiku|poem|story|rhyme|write a|tagline|slogan|creative|lyric/.test(p)) {
    return 'creative';
  }
  return prompt.length > 280 ? 'reasoning' : 'extractive';
}

function pickModel(cls: PromptClass, env: Record<string, string | undefined>): CatalogEntry | null {
  for (const entry of CATALOG) {
    if (entry.clears.includes(cls) && env[entry.keyName]) return entry;
  }
  return null;
}

const WHY: Record<PromptClass, (label: string) => string> = {
  extractive: (m) => `Extractive and short; ${m}, the smallest model that clears the bar.`,
  creative: (m) => `A small creative task; ${m} handles it, no need to climb the ladder.`,
  structured: (m) => `Structured output; ${m} for dependable, well-formed results.`,
  reasoning: (m) => `Multi-step reasoning; only the larger ${m} passes the eval.`,
};

function formatCost(usd: number): string {
  return '$' + (usd < 0.001 ? usd.toFixed(5) : usd.toFixed(4));
}

interface ProviderReply {
  text: string;
  promptTokens: number;
  completionTokens: number;
}

/** Keeps replies console-shaped: no "Certainly!", no closing offers to help. */
const SYSTEM_PROMPT =
  'Reply with only the requested output: no preamble, no code fences unless asked, no follow-up questions. Be terse.';

async function callProvider(
  entry: CatalogEntry,
  prompt: string,
  apiKey: string,
  cls: PromptClass,
): Promise<ProviderReply> {
  const res = await fetch(entry.url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
      // OpenRouter attribution headers (ignored by others).
      'HTTP-Referer': 'https://tomasbrasca.dev',
      'X-Title': 'Tomas Brasca: router playground',
    },
    body: JSON.stringify({
      model: entry.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 512,
      temperature: cls === 'creative' ? 0.8 : 0.2,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${entry.provider} ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  return {
    text: data.choices?.[0]?.message?.content?.trim() ?? '(empty response)',
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  };
}

/** True when at least one provider key is configured (live mode is usable). */
export function liveAvailable(env: Record<string, string | undefined>): boolean {
  return CATALOG.some((e) => env[e.keyName]);
}

/**
 * Run the full route. Throws if no model can serve the class (no key for the
 * needed tier); the caller maps that to a 503.
 *
 * `input` is the source material the prompt operates on (the release note to
 * summarize, the stack trace to explain). The class is decided by the prompt
 * alone; the input is appended for the provider call.
 */
export async function route(
  prompt: string,
  env: Record<string, string | undefined>,
  input?: string,
): Promise<RouteResult> {
  const cls = classify(prompt);
  const entry = pickModel(cls, env);
  if (!entry) throw new Error('no-model-available');

  const apiKey = env[entry.keyName] as string;
  const t0 = Date.now();
  const fullPrompt = input ? `${prompt}\n\n${input}` : prompt;
  const reply = await callProvider(entry, fullPrompt, apiKey, cls);
  const ms = Date.now() - t0;

  const usd =
    (reply.promptTokens * entry.inPrice + reply.completionTokens * entry.outPrice) / 1_000_000;

  return {
    model: entry.label,
    provider: entry.provider,
    latency: `${ms} ms`,
    cost: formatCost(usd),
    why: WHY[cls](entry.label),
    response: reply.text,
    tone: entry.tone,
    mode: 'live',
  };
}
