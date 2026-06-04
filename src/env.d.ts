/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

// Bindings & secrets available on the Cloudflare runtime.
// Provider keys are optional: live mode degrades gracefully when a key is absent.
interface Env {
  /** KV namespace backing the per-IP live-mode rate limit. */
  RL: KVNamespace;
  OPENAI_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
}

declare namespace App {
  interface Locals {
    /** Cloudflare runtime, surfaced by @astrojs/cloudflare. */
    runtime: {
      env: Env;
    };
  }
}
