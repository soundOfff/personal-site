/**
 * Per-IP fixed-window rate limit backed by Cloudflare KV.
 *
 * Live mode is capped at 5 routes/min/IP on cheap models only — the blast
 * radius cap from the ADR. KV has no atomic increment, but for a soft 5/min
 * limit the small race is acceptable. Fails OPEN if no KV binding is present
 * (e.g. local dev without platformProxy) so the endpoint stays usable.
 */
export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** seconds until the window resets (only when !ok). */
  retryAfter: number;
}

export async function checkRateLimit(
  kv: KVNamespace | undefined,
  ip: string,
  limit = 5,
  windowSec = 60,
): Promise<RateLimitResult> {
  if (!kv) return { ok: true, remaining: limit, retryAfter: 0 };

  const nowSec = Date.now() / 1000;
  const window = Math.floor(nowSec / windowSec);
  const key = `rl:${ip}:${window}`;

  const current = Number((await kv.get(key)) ?? '0');
  const retryAfter = Math.ceil(windowSec - (nowSec % windowSec));

  if (current >= limit) {
    return { ok: false, remaining: 0, retryAfter };
  }

  await kv.put(key, String(current + 1), { expirationTtl: windowSec + 5 });
  return { ok: true, remaining: limit - current - 1, retryAfter };
}
