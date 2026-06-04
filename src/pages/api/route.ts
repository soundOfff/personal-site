import type { APIRoute } from 'astro';
import { route, liveAvailable } from '../../lib/router/live';
import { checkRateLimit } from '../../lib/ratelimit';
import type { RouteError, RouteRequest } from '../../lib/router/types';

// The ONE on-demand route. Everything else on the site is static.
export const prerender = false;

function json<T>(body: T, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const env = locals.runtime?.env ?? ({} as Env);

  // Live mode is off until at least one provider key is configured.
  if (!liveAvailable(env as unknown as Record<string, string | undefined>)) {
    return json<RouteError>({ error: 'live-unconfigured' }, 503);
  }

  let body: RouteRequest;
  try {
    body = (await request.json()) as RouteRequest;
  } catch {
    return json<RouteError>({ error: 'bad-request' }, 400);
  }

  const prompt = (body?.prompt ?? '').trim();
  if (!prompt) return json<RouteError>({ error: 'empty-prompt' }, 400);
  if (prompt.length > 2000) return json<RouteError>({ error: 'prompt-too-long' }, 413);

  // Per-IP rate limit: 5/min, cheap models only.
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    clientAddress ??
    'unknown';

  const rl = await checkRateLimit(env.RL, ip);
  if (!rl.ok) {
    return json<RouteError>({ error: 'rate-limited', retryAfter: rl.retryAfter }, 429, {
      'retry-after': String(rl.retryAfter),
    });
  }

  try {
    const result = await route(prompt, env as unknown as Record<string, string | undefined>);
    return json(result, 200);
  } catch (err) {
    if (err instanceof Error && err.message === 'no-model-available') {
      return json<RouteError>({ error: 'live-unconfigured' }, 503);
    }
    return json<RouteError>({ error: 'upstream-failed' }, 502);
  }
};

// Non-POST methods get a clear 405 (POST is handled above).
export const ALL: APIRoute = () =>
  json<RouteError>({ error: 'method-not-allowed' }, 405, { allow: 'POST' });
