import type { APIRoute } from 'astro';
// Astro v6 removed `Astro.locals.runtime.env`; bindings come from the module instead.
import { env as workerEnv } from 'cloudflare:workers';
import { route, liveAvailable } from '../../lib/router/live';
import { FIXTURES } from '../../lib/router/fixtures';
import {
  checkRateLimit,
  checkDailyLimit,
  checkGlobalLimit,
  type RateLimitResult,
} from '../../lib/ratelimit';
import type { RouteError, RouteRequest } from '../../lib/router/types';

// The ONE on-demand route. Everything else on the site is static.
export const prerender = false;

function json<T>(body: T, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const env = workerEnv as unknown as Env;

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

  // Live mode only ever runs a curated fixture, resolved server-side by key.
  // Arbitrary prompts are rejected here, so a replayed request can't turn the
  // endpoint into a free, attacker-steered proxy to the provider keys.
  const fixture = FIXTURES.find((f) => f.key === body?.key);
  if (!fixture) return json<RouteError>({ error: 'unknown-prompt' }, 400);

  // On Cloudflare, cf-connecting-ip is set by the edge and can't be spoofed;
  // the rest are dev/fallback only.
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    clientAddress ??
    'unknown';

  const rateLimited = (rl: RateLimitResult): Response =>
    json<RouteError>({ error: 'rate-limited', retryAfter: rl.retryAfter }, 429, {
      'retry-after': String(rl.retryAfter),
    });

  // Per-IP gates: 5/min burst, then 20/day. Checked cheapest-first so a request
  // blocked by the burst limit never spends daily or global budget.
  const burst = await checkRateLimit(env.RL, ip);
  if (!burst.ok) return rateLimited(burst);

  const daily = await checkDailyLimit(env.RL, ip);
  if (!daily.ok) return rateLimited(daily);

  // Global budget: 500/day across all IPs. When spent, everyone falls back to
  // the cached demo route (the island maps this 503 to a demo render).
  const budget = await checkGlobalLimit(env.RL);
  if (!budget.ok) {
    return json<RouteError>(
      { error: 'daily-budget-exhausted', retryAfter: budget.retryAfter },
      503,
      { 'retry-after': String(budget.retryAfter) },
    );
  }

  try {
    const result = await route(
      fixture.prompt,
      env as unknown as Record<string, string | undefined>,
      fixture.input,
    );
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
