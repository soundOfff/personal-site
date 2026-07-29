/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

// Bindings & secrets available on the Cloudflare runtime.
// The API key is optional: live mode degrades to bundled demo transcripts when
// it's absent, so a fresh clone still has a working Playground.
interface Env {
  /** KV namespace backing the per-IP live-mode rate limit. */
  RL: KVNamespace;
  /** Anthropic key for the A2UI agent. Absent ⇒ /api/a2ui returns 503. */
  ANTHROPIC_API_KEY?: string;
  /** Optional model override, e.g. "claude-sonnet-5". Defaults to Haiku 4.5. */
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
