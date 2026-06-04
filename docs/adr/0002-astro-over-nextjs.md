---
status: accepted
---

# Astro (not Next.js) for the site, with a React island for the Playground

The obvious default would be Next.js — it's what Tomas already knows deeply and it would handle both the content site and the [[Playground]]'s server-side calls in one framework. We chose **Astro** instead because the site is content-first (single-scroll homepage, case-study pages, an actively-maintained [[Blog]]) and Astro ships near-zero JavaScript by default, giving the fast, high-Lighthouse result a technical [[Audience]] will notice and respect. The interactive [[Playground]] is the one stateful part, so it lives as a **React island** backed by a serverless function — keeping interactivity exactly where it's needed without paying its cost on every page.

## Considered options

- **Next.js (App Router)** — one familiar framework does everything, but every content page carries a React/SSR runtime the content doesn't need. Rejected for a content-dominant site.
- **Astro everywhere + island for the Playground** — chosen. Content stays static and fast; interactivity is opt-in per island.

## Consequences

- The [[Blog]] uses Astro content collections — Markdown/MDX in-repo (authorable from Obsidian, then committed), which keeps publishing friction low enough to sustain an active cadence.
- One genuinely interactive feature now means two mental models (Astro + a React island). Acceptable, since it's isolated to the Playground.
- A "show, don't tell" standalone backend service (Go/FastAPI) was considered for the Playground and deferred — the serverless function is simpler to operate and enough to prove the point for now.
