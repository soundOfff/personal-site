import type { APIRoute } from 'astro';
// Astro v6 removed `Astro.locals.runtime.env`; bindings come from the module instead.
import { env as workerEnv } from 'cloudflare:workers';
import { AgentError, agentAvailable, generateSurface } from '../../lib/a2ui/agent';
import { A2uiValidationError } from '../../lib/a2ui/validate';
import { getSnapshot } from '../../lib/portfolio/snapshot';
import { selectContext } from '../../lib/portfolio/retrieve';
import {
  checkDailyLimit,
  checkGlobalLimit,
  checkRateLimit,
  type RateLimitResult,
} from '../../lib/ratelimit';
import type { A2uiError, A2uiRequest, A2uiResponse, HistoryTurn } from '../../lib/a2ui/types';

// The ONE on-demand route. Everything else on the site is static.
export const prerender = false;

/**
 * Caps on what a single request may carry. Unlike the old router endpoint,
 * which only ever ran a fixture chosen server-side by key, this one has to
 * accept free text — so the limits are the boundary. A question longer than
 * this is not a question, and history is trimmed rather than trusted: it is
 * client-supplied, so it is treated as more visitor input, never as instruction.
 */
const MAX_MESSAGE_CHARS = 400;
const MAX_HISTORY_TURNS = 6;
const MAX_HISTORY_CHARS = 400;

function json<T>(body: T, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

/**
 * Trim history to something the Messages API will accept: alternating roles,
 * starting with the visitor. Consecutive same-role turns are joined rather than
 * dropped, so a client that batches two questions still gets both into context.
 */
function sanitizeHistory(raw: unknown): HistoryTurn[] {
  if (!Array.isArray(raw)) return [];

  const turns: HistoryTurn[] = [];
  for (const entry of raw.slice(-MAX_HISTORY_TURNS)) {
    const role = (entry as HistoryTurn)?.role;
    const text = (entry as HistoryTurn)?.text;
    if ((role !== 'user' && role !== 'agent') || typeof text !== 'string') continue;

    const trimmed = text.trim().slice(0, MAX_HISTORY_CHARS);
    if (!trimmed) continue;

    const last = turns.at(-1);
    if (last?.role === role) last.text = `${last.text}\n${trimmed}`.slice(0, MAX_HISTORY_CHARS * 2);
    else turns.push({ role, text: trimmed });
  }

  // The API requires the first message to be from the user, and we append the
  // current question after this, so history must end on an agent turn.
  if (turns[0]?.role === 'agent') turns.shift();
  if (turns.at(-1)?.role === 'user') turns.pop();
  return turns;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const env = workerEnv as unknown as Env;

  // Live mode is off until the key is configured. The island maps this 503 to
  // its bundled demo transcripts, so the section still works on a fresh clone.
  if (!agentAvailable(env)) {
    return json<A2uiError>({ error: 'live-unconfigured' }, 503);
  }

  let body: A2uiRequest;
  try {
    body = (await request.json()) as A2uiRequest;
  } catch {
    return json<A2uiError>({ error: 'bad-request' }, 400);
  }

  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message) return json<A2uiError>({ error: 'empty-message' }, 400);
  if (message.length > MAX_MESSAGE_CHARS) {
    return json<A2uiError>({ error: 'message-too-long' }, 413);
  }

  // On Cloudflare, cf-connecting-ip is set by the edge and can't be spoofed;
  // the rest are dev/fallback only.
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    clientAddress ??
    'unknown';

  const rateLimited = (rl: RateLimitResult): Response =>
    json<A2uiError>({ error: 'rate-limited', retryAfter: rl.retryAfter }, 429, {
      'retry-after': String(rl.retryAfter),
    });

  // Per-IP gates first, cheapest-first, so a request blocked by the burst limit
  // never spends daily or global budget.
  const burst = await checkRateLimit(env.RL, ip);
  if (!burst.ok) return rateLimited(burst);

  const daily = await checkDailyLimit(env.RL, ip);
  if (!daily.ok) return rateLimited(daily);

  const budget = await checkGlobalLimit(env.RL);
  if (!budget.ok) {
    return json<A2uiError>(
      { error: 'daily-budget-exhausted', retryAfter: budget.retryAfter },
      503,
      {
        'retry-after': String(budget.retryAfter),
      },
    );
  }

  const history = sanitizeHistory(body?.history);

  try {
    const snapshot = await getSnapshot();
    // Rank against the whole thread, not just the last message: a follow-up
    // like "and the second one?" carries no terms of its own.
    const query = [...history.filter((t) => t.role === 'user').map((t) => t.text), message].join(
      ' ',
    );
    const context = selectContext(snapshot, query);

    const { messages, summary, meta } = await generateSurface({
      message,
      history,
      context,
      subjectName: snapshot.profile.name,
      env,
    });

    return json<A2uiResponse>({ messages, summary, mode: 'live', meta }, 200);
  } catch (err) {
    if (err instanceof A2uiValidationError) {
      return json<A2uiError>({ error: 'unrenderable-surface' }, 502);
    }
    if (err instanceof AgentError) {
      return json<A2uiError>({ error: err.code }, err.code === 'timeout' ? 504 : 502);
    }
    return json<A2uiError>({ error: 'upstream-failed' }, 502);
  }
};

// Non-POST methods get a clear 405 (POST is handled above).
export const ALL: APIRoute = () =>
  json<A2uiError>({ error: 'method-not-allowed' }, 405, { allow: 'POST' });
