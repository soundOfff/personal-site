/**
 * The agent: one forced tool call, turned into A2UI messages.
 *
 * Written against OpenRouter's OpenAI-compatible `/chat/completions` over `fetch`
 * rather than an SDK, because this runs in a Worker and the only thing needed is
 * one request shape. OpenRouter is the transport, not the model: it routes to
 * Claude (`anthropic/claude-haiku-4.5` by default), so what answers a visitor is
 * still Claude — the gateway just holds the billing relationship.
 *
 * Two decisions carry it:
 *
 *   • **Forced tool use.** `tool_choice` pins the model to `render_surface`, so
 *     "reply in prose instead" is not a failure mode that exists. What comes
 *     back is a JSON object or an error, never a paragraph to parse.
 *   • **Reported cost, not estimated cost.** `usage: { include: true }` asks the
 *     gateway what the turn actually cost and the console prints that number.
 *     The price table below is only the fallback for when it's absent.
 *
 * The model is the smallest one that clears the bar — the same argument the rest
 * of this site makes about routing. Override with `A2UI_MODEL`.
 */

import { contextBlock, renderTool, systemInstructions } from './prompt';
import { RENDERABLE_TYPES, countComponents, toMessages, type RenderInput } from './validate';
import type { A2uiMessage, HistoryTurn, TurnMeta } from './types';
import type { AgentContext } from '../portfolio/retrieve';

const DEFAULT_MODEL = 'anthropic/claude-haiku-4.5';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Sent for OpenRouter's attribution listings; harmless if the site moves. */
const APP_URL = 'https://tomasbrasca.dev';
const APP_TITLE = 'tomasbrasca.dev · a2ui portfolio agent';

/** Generous enough for a twelve-component surface, tight enough to bound cost. */
const MAX_TOKENS = 2048;

/** A Worker request has to finish; a hung upstream must not take it with us. */
const TIMEOUT_MS = 25_000;

export interface AgentEnv {
  OPENROUTER_API_KEY?: string;
  /** Optional model override, e.g. "anthropic/claude-sonnet-5". */
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

/** True when the agent is configured. */
export function agentAvailable(env: AgentEnv): boolean {
  return typeof env.OPENROUTER_API_KEY === 'string' && env.OPENROUTER_API_KEY.length > 0;
}

/* -------------------------------------------------------------- accounting */

/**
 * USD per million tokens, matched by model-id prefix. Only a fallback: the
 * gateway reports the real spend per turn, and that is what gets displayed when
 * it arrives. Keep these in sync with openrouter.ai/models if you edit them.
 */
const PRICING: Record<string, { input: number; output: number }> = {
  'anthropic/claude-haiku-4.5': { input: 1, output: 5 },
  'anthropic/claude-sonnet-5': { input: 2, output: 10 },
  'anthropic/claude-sonnet-4.5': { input: 3, output: 15 },
  'anthropic/claude-opus-5': { input: 5, output: 25 },
};

const FALLBACK_PRICE = { input: 1, output: 5 };

interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
  /** OpenRouter's own accounting, in USD. Present because we ask for it. */
  cost?: number;
}

function cachedFrom(usage: Usage): number {
  return usage.prompt_tokens_details?.cached_tokens ?? 0;
}

/**
 * Fallback pricing. `prompt_tokens` is the whole prompt including anything the
 * upstream served from cache, so cached tokens are billed at a tenth and
 * subtracted out rather than counted twice.
 */
function priceOf(model: string, usage: Usage): number {
  const price =
    Object.entries(PRICING).find(([prefix]) => model.startsWith(prefix))?.[1] ?? FALLBACK_PRICE;

  const cached = cachedFrom(usage);
  const fresh = Math.max(0, (usage.prompt_tokens ?? 0) - cached);
  const output = usage.completion_tokens ?? 0;

  return (
    (fresh * price.input + cached * price.input * 0.1) / 1_000_000 +
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

interface ToolCall {
  function?: { name?: string; arguments?: string };
}

interface ChatResponse {
  model?: string;
  choices?: {
    finish_reason?: string;
    message?: { content?: string | null; tool_calls?: ToolCall[] };
  }[];
  usage?: Usage;
  error?: { message?: string };
}

/**
 * Replay the conversation. Agent turns are replayed as their `summary` line
 * rather than the surface they described: the model needs to know it already
 * showed the routing posts, not to re-read forty components to find that out.
 *
 * The system prompt is split in two messages the same way it was split for the
 * Messages API — instructions first, retrieved context second — because that is
 * the boundary a cache would want even where this transport doesn't expose one.
 */
function toApiMessages(
  message: string,
  history: HistoryTurn[],
  instructions: string,
  context: string,
) {
  return [
    { role: 'system' as const, content: instructions },
    { role: 'system' as const, content: context },
    ...history.map((turn) => ({
      role: turn.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: turn.text,
    })),
    { role: 'user' as const, content: message },
  ];
}

async function callGateway(body: unknown, apiKey: string): Promise<ChatResponse> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': APP_URL,
        'X-Title': APP_TITLE,
      },
      body: JSON.stringify(body),
      signal: abort.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new AgentError('upstream-failed', `openrouter ${res.status}: ${detail.slice(0, 300)}`);
    }

    const parsed = (await res.json()) as ChatResponse;

    // The gateway can answer 200 with an error body when a provider rejects the
    // request downstream, so a status check alone isn't enough.
    if (parsed.error) {
      throw new AgentError('upstream-failed', `openrouter: ${parsed.error.message ?? 'unknown'}`);
    }

    return parsed;
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
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AgentError('upstream-failed', 'OPENROUTER_API_KEY is not set');

  const model = env.A2UI_MODEL || DEFAULT_MODEL;
  const started = Date.now();

  const response = await callGateway(
    {
      model,
      max_tokens: MAX_TOKENS,
      // Deterministic enough that the same question gives the same shape of
      // answer, loose enough that the prose isn't identical every time.
      temperature: 0.3,
      messages: toApiMessages(
        message,
        history,
        systemInstructions(subjectName),
        contextBlock(context),
      ),
      tools: [{ type: 'function', function: renderTool(RENDERABLE_TYPES) }],
      tool_choice: { type: 'function', function: { name: 'render_surface' } },
      // Ask for the real spend so the console reports it instead of a guess.
      usage: { include: true },
    },
    apiKey,
  );

  const latency = Date.now() - started;

  const choice = response.choices?.[0];
  const call = choice?.message?.tool_calls?.find((c) => c.function?.name === 'render_surface');

  if (!call?.function?.arguments) {
    // Forced tool use makes this near-impossible; the one real path to it is
    // hitting max_tokens mid-object, so surface it as its own failure.
    throw new AgentError(
      'no-surface',
      `no render_surface call (finish_reason: ${choice?.finish_reason ?? 'unknown'})`,
    );
  }

  // Unlike the Messages API, arguments arrive as a JSON string — a truncated
  // object fails here rather than at validation, and means the same thing.
  let input: RenderInput;
  try {
    input = JSON.parse(call.function.arguments) as RenderInput;
  } catch {
    throw new AgentError(
      'no-surface',
      `render_surface arguments were not valid JSON (finish_reason: ${choice?.finish_reason ?? 'unknown'})`,
    );
  }

  const messages = toMessages(input);
  const usage = response.usage ?? {};
  const reported = typeof usage.cost === 'number' ? usage.cost : null;

  return {
    messages,
    summary:
      typeof input.summary === 'string' ? input.summary.slice(0, 240) : 'Rendered a surface.',
    meta: {
      model: response.model ?? model,
      latency: formatLatency(latency),
      inputTokens: usage.prompt_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? 0,
      cachedTokens: cachedFrom(usage),
      cost: formatCost(reported ?? priceOf(response.model ?? model, usage)),
      components: countComponents(messages),
    },
  };
}
