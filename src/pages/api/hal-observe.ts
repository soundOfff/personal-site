import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { checkDailyLimit, checkGlobalLimit, checkRateLimit } from '../../lib/ratelimit';
import { OBSERVATIONS, isObservationEvent } from '../../reels/odyssey/observations';

export const prerender = false;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (Number(request.headers.get('content-length')) > 128)
    return json({ error: 'bad-request' }, 413);
  const reader = request.body?.getReader();
  if (!reader) return json({ error: 'bad-request' }, 400);
  let raw = '';
  let size = 0;
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let input: unknown;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 128) {
        await reader.cancel();
        return json({ error: 'bad-request' }, 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    input = JSON.parse(raw + decoder.decode());
  } catch {
    return json({ error: 'bad-request' }, 400);
  } finally {
    reader.releaseLock();
  }
  if (
    typeof input !== 'object' ||
    input === null ||
    !('event' in input) ||
    !isObservationEvent(input.event) ||
    Object.keys(input).length !== 1
  )
    return json({ error: 'bad-request' }, 400);
  if (!env.OPENROUTER_API_KEY?.trim()) return json({ error: 'unavailable' }, 503);
  if (request.signal.aborted) return json({ error: 'cancelled' }, 499);
  const ip = request.headers.get('cf-connecting-ip') ?? clientAddress ?? 'unknown';
  const namespace = `hal-observe:${ip}`;
  const burst = await checkRateLimit(env.RL, namespace, 1, 20);
  if (!burst.ok) return json({ error: 'limited' }, 429);
  const daily = await checkDailyLimit(env.RL, namespace, 3);
  if (!daily.ok) return json({ error: 'limited' }, 429);
  const budget = await checkGlobalLimit(env.RL);
  if (!budget.ok) return json({ error: 'unavailable' }, 503);
  const controller = new AbortController();
  const cancel = () => controller.abort();
  request.signal.addEventListener('abort', cancel, { once: true });
  if (request.signal.aborted) cancel();
  const timeout = setTimeout(cancel, 5500);
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'content-type': 'application/json',
        'http-referer': new URL(request.url).origin,
        'x-title': 'Discovery HAL observations',
      },
      body: JSON.stringify({
        model: env.HAL_MODEL?.trim() || 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content:
              'You are a fictional HAL-inspired ship computer accompanying a portfolio visitor. Write one original English sentence, at most 130 characters, as a quiet thought about the page. Be calm, observant and dryly witty. Occasionally offer a gentle caution, but do not warn every time. Avoid generic warnings, introductions, the name Dave, and repeated phrasing. Use only the supplied page context. Never claim to see private information, know the visitor, control navigation or observe pointer coordinates. No quotations, markdown, links, biographical claims or follow-up question.',
          },
          {
            role: 'user',
            content: `The visitor has paused near ${OBSERVATIONS[input.event].section}. Page context: ${OBSERVATIONS[input.event].context} Offer a brief spontaneous comment about it.`,
          },
        ],
        max_tokens: 70,
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      await response.body?.cancel();
      return json({ error: 'unavailable' }, 502);
    }
    const result: unknown = await response.json();
    if (
      typeof result !== 'object' ||
      result === null ||
      !('choices' in result) ||
      !Array.isArray(result.choices)
    )
      return json({ error: 'unavailable' }, 502);
    const choice: unknown = result.choices[0];
    if (
      typeof choice !== 'object' ||
      choice === null ||
      !('message' in choice) ||
      typeof choice.message !== 'object' ||
      choice.message === null ||
      !('content' in choice.message) ||
      typeof choice.message.content !== 'string' ||
      !choice.message.content.trim()
    )
      return json({ error: 'unavailable' }, 502);
    return json({ text: choice.message.content.trim().slice(0, 180) });
  } catch {
    return json({ error: 'unavailable' }, 503);
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener('abort', cancel);
  }
};
export const ALL: APIRoute = () => new Response(null, { status: 405, headers: { allow: 'POST' } });
