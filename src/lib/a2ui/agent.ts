/**
 * The agent: one forced tool call to Claude, turned into A2UI messages.
 *
 * Written against the Messages API over `fetch` rather than the SDK, because
 * this runs in a Worker and the only thing needed is one request shape. It also
 * keeps the cost model visible: the numbers reported under each answer are
 * computed here from the usage the API returns, not estimated.
 *
 * Two decisions carry it:
 *
 *   • **Forced tool use.** `tool_choice` pins the model to `render_surface`, so
 *     "reply in prose instead" is not a failure mode that exists. What comes
 *     back is a JSON object or an error, never a paragraph to parse.
 *   • **Prompt caching.** Instructions, catalog and tool schema are identical on
 *     every request and sit behind a cache breakpoint; only the retrieved
 *     context and the conversation change. That is most of the input served at a
 *     tenth of the price, and it is what makes a public, unauthenticated demo
 *     affordable enough to leave switched on.
 *
 * The model is the smallest one that clears the bar — the same argument the rest
 * of this site makes about routing. Override with `A2UI_MODEL`.
 */

import { contextBlock, renderTool, systemInstructions } from './prompt';
import { RENDERABLE_TYPES, countComponents, toMessages, type RenderInput } from './validate';
import type { A2uiMessage, HistoryTurn, TurnMeta } from './types';
import type { AgentContext } from '../portfolio/retrieve';

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

/** Generous enough for a twelve-component surface, tight enough to bound cost. */
const MAX_TOKENS = 2048;

/** A Worker request has to finish; a hung upstream must not take it with us. */
const TIMEOUT_MS = 25_000;

export interface AgentEnv {
  ANTHROPIC_API_KEY?: string;
  /** Optional model override, e.g. "claude-sonnet-5". */
  A2UI_MODEL?: string;
}

export class AgentError extends Error {
  constructor(
    readonly code: 'upstream-failed' | 'no-surface' | 'timeout',
    message: string,
  ) {
    super(message);
  }
}

/** True when the agent is configured (live mode is usable). */
export function agentAvailable(env: AgentEnv): boolean {
  return typeof env.ANTHROPIC_API_KEY === 'string' && env.ANTHROPIC_API_KEY.length > 0;
}

/* -------------------------------------------------------------- accounting */

/** USD per million tokens, matched by model-id prefix. */
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5': { input: 1, output: 5 },
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-sonnet-4-5': { input: 3, output: 15 },
  'claude-opus-5': { input: 15, output: 75 },
};

const FALLBACK_PRICE = { input: 1, output: 5 };

interface Usage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

/**
 * Anthropic bills a cache write at 1.25× the input rate and a cache read at
 * 0.1×, and reports all three counts separately — so this is the real cost of
 * the turn, not an approximation of it.
 */
function priceOf(model: string, usage: Usage): number {
  const price =
    Object.entries(PRICING).find(([prefix]) => model.startsWith(prefix))?.[1] ?? FALLBACK_PRICE;

  const fresh = usage.input_tokens ?? 0;
  const written = usage.cache_creation_input_tokens ?? 0;
  const read = usage.cache_read_input_tokens ?? 0;
  const output = usage.output_tokens ?? 0;

  return (
    (fresh * price.input + written * price.input * 1.25 + read * price.input * 0.1) / 1_000_000 +
    (output * price.output) / 1_000_000
  );
}

function formatCost(usd: number): string {
  return '$' + (usd < 0.001 ? usd.toFixed(5) : usd.toFixed(4));
}

function formatLatency(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

/* ------------------------------------------------------------------ request */

interface AnthropicResponse {
  model?: string;
  stop_reason?: string;
  content?: { type: string; name?: string; input?: unknown }[];
  usage?: Usage;
}

/**
 * Replay the conversation. Agent turns are replayed as their `summary` line
 * rather than the surface they described: the model needs to know it already
 * showed the routing posts, not to re-read forty components to find that out.
 */
function toApiMessages(message: string, history: HistoryTurn[]) {
  return [
    ...history.map((turn) => ({
      role: turn.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: turn.text,
    })),
    { role: 'user' as const, content: message },
  ];
}

async function callAnthropic(body: unknown, apiKey: string): Promise<AnthropicResponse> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify(body),
      signal: abort.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new AgentError('upstream-failed', `anthropic ${res.status}: ${detail.slice(0, 300)}`);
    }

    return (await res.json()) as AnthropicResponse;
  } catch (err) {
    if (err instanceof AgentError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new AgentError('timeout', `no response in ${TIMEOUT_MS} ms`);
    }
    throw new AgentError('upstream-failed', err instanceof Error ? err.message : 'fetch failed');
  } finally {
    clearTimeout(timer);
  }
}

export interface GenerateArgs {
  message: string;
  history: HistoryTurn[];
  context: AgentContext;
  subjectName: string;
  env: AgentEnv;
}

export interface GeneratedSurface {
  messages: A2uiMessage[];
  summary: string;
  meta: TurnMeta;
}

/** Run one turn. Throws `AgentError`; the endpoint maps the code to a status. */
export async function generateSurface({
  message,
  history,
  context,
  subjectName,
  env,
}: GenerateArgs): Promise<GeneratedSurface> {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AgentError('upstream-failed', 'ANTHROPIC_API_KEY is not set');

  const model = env.A2UI_MODEL || DEFAULT_MODEL;
  const started = Date.now();

  const response = await callAnthropic(
    {
      model,
      max_tokens: MAX_TOKENS,
      // Deterministic enough that the same question gives the same shape of
      // answer, loose enough that the prose isn't identical every time.
      temperature: 0.3,
      system: [
        // Everything before the breakpoint is byte-identical across requests:
        // tool schema, instructions, catalog. This is the cached prefix.
        {
          type: 'text',
          text: systemInstructions(subjectName),
          cache_control: { type: 'ephemeral' },
        },
        { type: 'text', text: contextBlock(context) },
      ],
      messages: toApiMessages(message, history),
      tools: [renderTool(RENDERABLE_TYPES)],
      tool_choice: { type: 'tool', name: 'render_surface' },
    },
    apiKey,
  );

  const latency = Date.now() - started;

  const call = response.content?.find(
    (block) => block.type === 'tool_use' && block.name === 'render_surface',
  );
  if (!call?.input) {
    // Forced tool use makes this near-impossible; the one real path to it is
    // hitting max_tokens mid-object, so surface it as its own failure.
    throw new AgentError(
      'no-surface',
      `no render_surface call (stop_reason: ${response.stop_reason ?? 'unknown'})`,
    );
  }

  const input = call.input as RenderInput;
  const messages = toMessages(input);
  const usage = response.usage ?? {};

  return {
    messages,
    summary:
      typeof input.summary === 'string' ? input.summary.slice(0, 240) : 'Rendered a surface.',
    meta: {
      model: response.model ?? model,
      latency: formatLatency(latency),
      inputTokens: (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0),
      outputTokens: usage.output_tokens ?? 0,
      cachedTokens: usage.cache_read_input_tokens ?? 0,
      cost: formatCost(priceOf(response.model ?? model, usage)),
      components: countComponents(messages),
    },
  };
}
