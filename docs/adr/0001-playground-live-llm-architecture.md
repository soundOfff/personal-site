---
status: accepted
---

# Playground defaults to a cached demo mode, with a rate-limited live mode

The Flagship's [[Playground]] makes real LLM calls (OpenAI / Groq / OpenRouter) from a public page with no auth, which exposes us to runaway cost and abuse if anyone could trigger unlimited live inference. We decided the Playground **defaults to a cached "demo mode"** — pre-recorded prompt/response/latency/cost data served from the edge, so the page is fully interactive and free by default — and offers an opt-in **"live mode"** that runs real inference behind a serverless function (keys held server-side) gated by strict per-IP rate limiting on cheap models only.

## Considered options

- **Live calls always** — most "real", but uncapped spend and a trivial abuse vector on a public page. Rejected.
- **Demo mode only (never live)** — zero risk, but loses the "try a real one" wow that makes the Playground prove the [[Thesis]]. Rejected as the sole option.
- **Auth-gate the live calls** — kills the frictionless try-it moment for the [[Audience]]; a recruiter won't sign up. Rejected.

## Consequences

- The serverless function is the only place provider API keys live; the React island never sees them.
- Demo-mode fixtures must be refreshed if the providers or routing logic change materially, or the showcase goes stale.
- Live mode needs a shared rate-limit store (e.g. Cloudflare KV / Workers) — this nudges the hosting/adapter choice toward an edge platform with cheap KV.
