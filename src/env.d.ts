/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

// Bindings & secrets available on the Cloudflare runtime.
// The API key is typed optional because the runtime may not have it, but the
// Playground has no offline path: without it, /api/a2ui 503s and the section
// reports that it isn't configured.
interface Env {
  /** KV namespace backing the per-IP rate limit on the agent endpoint. */
  RL: KVNamespace;
  /** OpenRouter key for the A2UI agent. Absent ⇒ /api/a2ui returns 503. */
  OPENROUTER_API_KEY?: string;
  /**
   * Optional model override, e.g. "anthropic/claude-sonnet-5". Defaults to
   * anthropic/claude-haiku-4.5. OpenRouter slugs, not first-party model ids.
   */
  A2UI_MODEL?: string;
}

declare namespace App {
  interface Locals {
    /** Cloudflare runtime, surfaced by @astrojs/cloudflare. */
    runtime: {
      env: Env;
    };
  }
}
