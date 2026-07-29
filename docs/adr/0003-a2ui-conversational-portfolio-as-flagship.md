---
status: accepted
---

# A2UI conversational portfolio replaces multi-LLM router as Flagship

The original [[Flagship]] was a live multi-LLM router [[Playground]] that demonstrated the system described in the Dex case study — visitors submit a prompt, it fans out across providers (OpenAI/Groq/OpenRouter), and routing decisions are shown with latency/cost/output side-by-side. We've decided to replace it with an **A2UI conversational portfolio** where visitors ask natural-language questions about the site owner's work ("Show me your React projects", "What are you writing about?") and an AI agent (Claude) generates appropriate UI components (project cards, blog lists, comparison tables, timelines) using Google's A2UI protocol.

## Why

**What we gain:**

- **More cutting-edge tech showcase** — A2UI (agent-to-UI) is newer and less common than LLM routing, demonstrating early-adopter capability
- **More interactive/engaging** — multi-turn conversation vs single-shot demo; visitors can explore the portfolio conversationally
- **Broader skill demonstration** — shows agent design, protocol implementation, UI generation, full-stack integration (Cloudflare Worker backend, custom client-side renderer, build-time data pipeline)
- **Still serves the [[Thesis]]** — "ships AI products end-to-end" is demonstrated by agent + UI generation + production architecture

**What we lose:**

- **Direct connection to Dex case study** — the Dex narrative was about multi-LLM routing; the live demo no longer anchors that story
- **The LLM router demo itself** — no longer showcasing multi-provider fan-out, cost comparison, latency measurement

The trade-off: we sacrifice case-study cohesion for a more impressive, broader technical demonstration. The A2UI showcase is more differentiated (fewer engineers have built this) and more conversational (higher engagement), while still proving the core [[Thesis]] about shipping AI products end-to-end.

## Considered options

- **Keep LLM router as Flagship** — maintains Dex case study connection, but less impressive/differentiated than A2UI
- **Add A2UI as separate section** — could have both, but splits interactive focus and dilutes the "hero demo" positioning
- **Make A2UI the Flagship** — **(chosen)** — more cutting-edge, more engaging, still on-thesis

## Consequences

- The Dex case study loses its live anchor demo — it becomes narrative-only like Mint (still credible, just not experienceable)
- `CONTEXT.md` definitions of [[Flagship]] and [[Playground]] need updating to reflect A2UI conversational portfolio
- Significant custom implementation work: A2UI renderer (no official library exists), Cloudflare Worker agent backend, component library, build-time data snapshot
- The [[Audience]] (hiring managers/recruiters) will experience AI capabilities through conversation rather than parameter comparison
