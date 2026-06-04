# Personal Site — Build Brief

Source-of-truth handoff for designing and building Tomas Brasca's portfolio. For canonical term definitions see [CONTEXT.md](./CONTEXT.md); for the two hard-to-reverse decisions and their reasoning see [docs/adr/](./docs/adr/).

## Thesis

> **Backend engineer who builds the systems that make AI products work in production.**

Backend is the foundation, AI/LLM systems are the edge, competitive-programming results are the proof. Every section serves this sentence or gets cut.

## Audience & goal

One buyer asking one question — _"Can this person own and ship backend systems that survive production?"_ — in two forms:

- **Hiring managers / recruiters** (full-time)
- **Founders / CTOs** (contract)

Goal: convert either into a conversation. The only thing the contract side adds is an easy "let's talk" path.

## Site shape

Single-scroll homepage with teasers; case studies and blog posts get their own pages.

**Homepage scroll order:**

1. **Nav** — name · work · playground · blog · _Get in touch_
2. **Hero** — thesis sentence + one-line sub + primary CTA (_try the playground →_)
3. **Credibility strip** — Dex (SE II) · ICPC South America finalist · won GTS algo-trading competition · 2–3M users at Mint. Compact; framed as proof of fundamentals, not the headline.
4. **Selected work** — 3 case-study teasers (hook + key metric + one diagram), each → its own full case-study page:
   - **Dex — multi-LLM routing** _(headline)_ — OpenAI/Groq/OpenRouter, balancing latency, cost, quality. Narrative only (employer work, no proprietary code).
   - **Mint — 2–3M-user scale** — high-traffic e-commerce APIs. Narrative only.
   - **Flagship** — the multi-LLM router playground, with real code + live demo.
5. **Playground** _(showpiece)_ — embedded live preview; full version at its own route.
6. **Writing** — latest 3 posts, homepage curates **technical-first**, → full blog.
7. **About** — short bio (backend, Rosario, 4+ yrs, what he cares about).
8. **Contact** — _"Open to senior backend roles & select contract work"_ + email + GitHub/LinkedIn/resume PDF.

## Flagship: the Playground

Prompt → fans out across OpenAI / Groq / OpenRouter → shows **latency, token cost, and output side by side** with a routing decision that picks a winner. Lets the Audience _experience_ the exact system the Dex case study describes.

- **Demo mode** (default): cached fixtures, fully interactive, free.
- **Live mode** (opt-in): real inference behind a serverless function, keys server-side, strict per-IP rate limiting, cheap models only.
- See [ADR 0001](./docs/adr/0001-playground-live-llm-architecture.md).

## Blog

Actively maintained (real cadence). Four **flat, equal, tag-organized** pillars:

- Backend & AI systems
- Algorithms & competitive programming
- Build logs / project writeups
- Startup engineering & opinions

Blog index is flat/tag-filtered; the **homepage surfaces technical posts first** so the Audience's first impression stays on-thesis. Authored as Markdown/MDX in Astro content collections (writable from Obsidian, then committed) to keep publishing friction near zero.

## Visual direction

**Technical editorial minimalism.** Crisp typography, generous whitespace, monospace accents, restrained palette. Diagrams and data (architecture, latency/cost numbers, the playground) are the visual payload — the content is what's beautiful. No generic gradient-SaaS template.

Open for the design phase: light vs dark base (lean: light, one restrained accent, monospace for all code/metrics), exact palette.

## Tech stack

- **Astro** — homepage, case-study pages, blog (content collections). Near-zero JS, fast, high Lighthouse. See [ADR 0002](./docs/adr/0002-astro-over-nextjs.md).
- **React island** — the Playground (the one stateful feature).
- **Serverless function** — Playground LLM calls; holds API keys, serves demo cache, enforces rate limits.
- **Hosting/adapter** — open; lean toward Cloudflare Pages + Workers + KV (cheap edge cache + rate-limit store) or Vercel for simplicity.

## Open implementation questions

- Hosting/adapter choice (drives the rate-limit/caching store).
- Final palette + light/dark.
- Domain name.
- Whether the Flagship is built fresh or evolved from an existing repo.
