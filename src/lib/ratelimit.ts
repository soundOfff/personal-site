/**
 * Per-IP and global rate limits: synchronous in-isolate counters backed by
 * Cloudflare KV.
 *
 * Live mode is gated on three fixed windows, checked in order so a single IP
 * can never consume more than its own share of the global budget:
 *   1. per-IP burst  — 5 routes / 60s   (snappy retries, blocks hammering)
 *   2. per-IP daily  — 20 routes / 24h  (the sustained abuse gate)
 *   3. global daily  — 500 routes / 24h (hard ceiling across ALL IPs; the only
 *      control IP rotation can't bypass — on hit, live falls back to demo)
 *
 * KV has no atomic increment, so its read-modify-write races under parallel
 * requests; the in-memory counter is incremented before any await (isolates are
 * single-threaded), which closes that race for bursts hitting the same isolate.
 * KV persists counts across isolates/colos. Fails OPEN if no KV binding is
 * present (e.g. local dev without platformProxy), where the in-memory counter
 * still enforces the limit within an isolate.
 */
export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** seconds until the window resets (only meaningful when !ok). */
  retryAfter: number;
}

const MINUTE = 60;
const DAY = 86_400;

const mem = new Map<string, { window: number; count: number }>();

/**
 * Consume one unit from a fixed window. `bucket` namespaces the counter
 * (`rl:1.2.3.4`, `rld:1.2.3.4`, `rlg`); the same string keys both the in-memory
 * map and the KV entry, so distinct buckets never collide.
 */
async function consume(
  kv: KVNamespace | undefined,
  bucket: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const nowSec = Date.now() / 1000;
  const window = Math.floor(nowSec / windowSec);
  const key = `${bucket}:${window}`;
  const retryAfter = Math.ceil(windowSec - (nowSec % windowSec));

  // In-isolate counter first, fully synchronous — parallel requests in the
  // same isolate serialize here instead of racing the KV read below.
  const entry = mem.get(bucket);
  const memCount = entry && entry.window === window ? entry.count : 0;
  if (memCount >= limit) return { ok: false, remaining: 0, retryAfter };
  mem.set(bucket, { window, count: memCount + 1 });
  // Bound memory across long-lived isolates; KV still backs the limit.
  if (mem.size > 10_000) mem.clear();

  if (!kv) return { ok: true, remaining: limit - memCount - 1, retryAfter };

  const kvCount = Number((await kv.get(key)) ?? '0');
  if (kvCount >= limit) return { ok: false, remaining: 0, retryAfter };

  const count = Math.max(kvCount, memCount) + 1;
  await kv.put(key, String(count), { expirationTtl: windowSec + 5 });
  return { ok: true, remaining: limit - count, retryAfter };
}

/** Per-IP burst limit: 5 routes / 60s. */
export function checkRateLimit(
  kv: KVNamespace | undefined,
  ip: string,
  limit = 5,
  windowSec = MINUTE,
): Promise<RateLimitResult> {
  return consume(kv, `rl:${ip}`, limit, windowSec);
}

/** Per-IP daily cap: 20 routes / 24h — the sustained abuse gate. */
export function checkDailyLimit(
  kv: KVNamespace | undefined,
  ip: string,
  limit = 20,
): Promise<RateLimitResult> {
  return consume(kv, `rld:${ip}`, limit, DAY);
}

/**
 * Global daily budget: 500 routes / 24h across ALL IPs — a hard ceiling IP
 * rotation can't bypass. Checked last so a single IP (already gated to 20/day)
 * can only ever consume its own share of this budget. Windows align to the unix
 * epoch, i.e. they reset at 00:00 UTC.
 */
export function checkGlobalLimit(
  kv: KVNamespace | undefined,
  limit = 500,
): Promise<RateLimitResult> {
  return consume(kv, 'rlg', limit, DAY);
}
