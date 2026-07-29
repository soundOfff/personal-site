import type { APIRoute } from 'astro';
import { buildSnapshot } from '../../lib/portfolio/snapshot';

/**
 * The [portfolio snapshot](../../lib/portfolio/snapshot.ts), emitted as a static
 * file at `/data/portfolio.json`.
 *
 * The agent doesn't read this — it imports the same builder directly, so it
 * never pays a network hop. This route exists so the build-time data pipeline is
 * inspectable from the outside: open the URL and you can see exactly what the
 * agent is given, which is a claim about the architecture that anyone can check.
 */
export const prerender = true;

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await buildSnapshot(), null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
