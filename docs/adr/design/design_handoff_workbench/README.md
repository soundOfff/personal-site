# Handoff: Personal Site — "Workbench" (Variant B)

## Overview

A personal site for **Tomas Vance**, a backend / systems engineer specializing in applied LLM infrastructure (routing, caching, evals, cost control). The site's hook is a "show, don't tell" interactive **Playground**: a model-router demo that, given a prompt, picks the cheapest model that clears an eval bar and shows the model, provider, latency, cost, and reasoning.

This handoff covers **Variant B — "Workbench"**: a two-column layout with a sticky left meta-rail (identity, status, section nav, contact) and a long, hairline-divided content column rendered in an engineer's-notebook idiom (monospace section keys like `// readme`, a tabular work index, a terminal-style playground, an open-source list, a git-style changelog, principles, a toolbox, and a "now" spec sheet).

The site architecture it depicts (per the project's decision records):
- **Astro** for the content-first site, shipping near-zero JS.
- The **Playground is a React island** backed by a serverless function.
- Playground **defaults to a cached "demo mode"** (pre-recorded prompt/response/latency/cost, served from the edge, free and abuse-proof) with an opt-in **rate-limited "live mode"** that runs real inference behind the serverless function (provider keys held server-side, capped per-IP on cheap models only).

## About the Design Files

The files in this bundle are **design references created in HTML** — a prototype showing the intended look, layout, and interaction. **They are not production code to copy directly.** The task is to **recreate this design in the target codebase** using its established framework and patterns.

The decision records call for **Astro + a React island for the Playground**, so the natural implementation is:
- Astro pages/components for all static sections (everything except the Playground).
- A single **React island** (`client:visible` or `client:load`) for the Playground.
- A **serverless function** (e.g. Astro endpoint / edge function) for live-mode inference, with a shared rate-limit store (e.g. Cloudflare KV).

If you are implementing in a different stack, map the static sections to that framework's components and keep the Playground as the one stateful/interactive unit.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, borders, and interaction states are all specified here and embodied in the prototype. Recreate the UI faithfully. All visual values come from a small design-token system (`colors_and_type.css`) — wire those tokens into the target codebase first, then build components against them rather than hardcoding values.

---

## Layout

**Shell** — `max-width: 980px`, centered, with 1px left/right rules so it reads as a sheet on the page background.
- CSS grid, two columns: **`256px` rail + `1fr` content**.
- Background page color `--page`; the sheet itself is `--paper`.

**Left rail** (`<aside class="rail">`)
- `position: sticky; top: 0; height: 100vh`. Background `--paper-2`, 1px right rule, padding `26px 24px`, vertical flex with `gap: 26px`.
- Contents top→bottom: identity block (monogram tile + name + role) → status pill → section nav → contact group → footer row (© + theme toggle). The footer row is pushed to the bottom with `margin-top: auto`.

**Content column** (`<main class="content">`)
- Padding `30px 38px 90px`.
- Each section is a `.block` with `padding: 34px 0` and a 1px top rule (`--rule`); first block has no top rule.
- Every section opens with a monospace **key bar**: `// readme`, `// playground`, etc. — `--muted`, the keyword in `--amber-deep` bold.

**Responsive** (`max-width: 820px`): collapse to a single column; the rail becomes a static horizontal strip (nav + contact hidden, identity + status + theme toggle remain); `.specs`, `.tenets`, `.toolbox` collapse to fewer columns; content padding tightens to `24px 22px 90px`.

---

## Sections (in order)

Rail nav indices are shown as `00`–`08`.

### 00 · readme (hero)
- **Lede**: Newsreader 500, `27px`, line-height `1.28`, tracking `-0.015em`. Copy: *"Most LLM calls don't need the biggest model — they need a dispatcher that knows which one will **clear the bar**."* The phrase "clear the bar" is italic + `--amber-deep`.
- **Sub**: Geist `14px`, `--ink-2`, max-width `56ch`.
- **Start row**: amber primary button "Run the router" (links to `#playground`) + a ghost arrow-link "See the work index".
- **Metrics strip**: bordered, rounded (`--radius-card`), flex row of 5 cells separated by 1px rules. Each cell: a mono value (`21px`, `500`) over a mono uppercase key (`9px`, tracking `0.1em`, `--muted`). Values: **71%** cheaper inference (the "71%" in `--amber-deep`), **240ms** median latency, **3** providers routed, **40M** events/day, **99.95%** uptime. Unit suffixes (ms/M/%) are smaller and `--muted`.

### 01 · playground (the interactive island) — see "Playground behavior" below
A terminal-style console card. **This is the only interactive part of the page.**

### 02 · work · index
A borderless `<table class="idx">`. Each row: index number (mono, `--muted-2`, 30px col) · project (Newsreader 600 title `16px` + `12px` `--muted` description) · stack tags (mono uppercase, 150px col) · year (mono, right-aligned, 64px col). Rows show `cursor: pointer`; on hover the whole row gets a `--paper-2` background and the title turns `--amber-deep`. Four entries (router 2025, streaming ingest 2024, collab backend 2023, feature-flag evaluator 2022).

### 03 · open source
A `.repos` list of repo rows. Each row is a 2-column grid: left column stacks repo name (mono `13px` `600`, with a `--muted-2` `org/` prefix) over a `12.5px` `--muted` description; right column (spanning both rows, centered) shows a language chip (an 8px colored dot + language name) and a star count (`★` in `--amber-deep` + number). Hover turns the name `--amber-deep`. Language dot colors: Go `#00ADD8`, Python `#3776AB`, TypeScript `#3178C6`, CSS `#C77C1F`.

### 04 · log · recent activity
A git-style vertical timeline (`.log`). Each `.logitem` is a 2-column grid: a 14px gutter holding a node dot (9px, `--paper` fill, 2px `--amber-deep` border) connected by a 1px vertical line (`--rule-2`; hidden on the last item), and a body. Body top row: commit hash (mono `10.5px` `--amber-deep`) + relative date (mono `10px` `--muted-2`) + a tag pill (mono `8.5px` uppercase, 1px `--rule` border, `--radius` 4px). Below: the message in `13.5px` `--ink`. Four entries.

### 05 · writing
A `.wlist` of rows. Each `.wrow` is a 3-column grid (`96px` date / `1fr` title / `auto` read-time), baseline-aligned, 1px bottom rule between rows. Date and read-time are mono `--muted`/`--muted-2`; title is Newsreader 600 `16px` that turns `--amber-deep` on hover. Four posts (ISO dates 2026-05-12 → 2026-02-09).

### 06 · principles · how I build
A `.tenets` 2×2 grid (`gap: 22px 30px`). Each tenet: a mono number (`--amber-deep`), a Newsreader 600 `17px` heading, and a `12.5px` `--ink-2` body (max-width `42ch`). Four tenets: "Smallest model that passes", "Cache before you call", "Cap the blast radius", "Evals are contracts".

### 07 · stack · toolbox
A `.toolbox` 3-column grid. Each column has a mono uppercase header (`--muted-2`) and an unstyled `<ul>` where each `<li>` is mono `12.5px` prefixed with a `$` glyph in `--amber-deep`. Columns: **Languages** (Go, Rust, TypeScript, Python, SQL), **Infra** (Postgres, ClickHouse, Kafka, Cloudflare, Docker), **LLM** (OpenAI, Groq, OpenRouter, pgvector, evals).

### 08 · now
A `.specs` 2-column definition grid. Each `.spec` is a `92px` label / `1fr` value row with a 1px bottom rule. Labels are mono uppercase `--muted`; values are `13px` `--ink-2`. Six rows: Location, Status, Email, Focus, Reading, Built with.

---

## Playground behavior (the React island)

A console card (`[data-pg]`) with three parts: a title bar, a body of selectable prompts + a route action, and a results region.

**Title bar** (`.console-bar`): three "traffic light" dots (first in `--amber`) + a `router — demo` label, and a **mode segmented control** with `demo` / `live` buttons (mono, `demo` active by default).

**Prompt list** (`.cmds`): four selectable commands, each prefixed with a `❯` caret. The active one has an `--amber-soft` background, `#ECC78C` border, and an `--amber-deep` caret. Selecting a prompt makes it active (single-select).

**Run row**: a left caption `cached at edge · free` (mono uppercase `--muted`) and the amber **Route** button (label + a refresh icon).

**Live-mode note** (`.live-note`, hidden by default): shown only when `live` mode is selected. Copy: *"Live mode runs real inference behind a serverless function — keys stay server-side, capped at 5 routes/min per IP on cheap models only."* Blue-ink callout with an info icon. (In the prototype this is purely a caption; in production it documents the real live-mode contract.)

**Empty state** (`.console-empty`): "select a prompt and route it" — shown before the first route, hidden after.

**Result region** (`.console-out`, hidden until first route):
- **Status line** (mono): `● routed` (in `--sage-ink`) · **model** · **provider** · **latency** · cost **cost**, separated by `·`.
- **Why line**: a bulb icon (`--amber-deep`) + a one-sentence rationale, in Geist `12px`.
- **Reply** (`.reply`): a `<pre>` of monospace response text (`white-space: pre-wrap`), prefixed by a CSS `::before` of `router ❯ ` in `--amber-deep`.

**Routing interaction** (`playground.js`):
1. Each prompt maps to a fixture: `{ prompt, model, provider, tone, latency, cost, why, response }`.
2. Selecting a prompt updates the active state and (if present) any `[data-pg-field="prompt"]` text.
3. Clicking **Route** sets the button to a `is-routing` state (label → "Routing…", refresh icon spins via a `spin` keyframe), hides the empty state, waits ~**420ms**, then fills every `[data-pg-field="..."]` (`model`, `provider`, `latency`, `cost`, `why`, `response`), applies a tone class (`is-blue` / `is-sage` / `is-clay` / `is-amber`) to any `[data-pg-modelchip]`, reveals `.console-out`, and restores the button.
4. Switching mode toggles `[data-pg-mode]` active state and shows/hides `[data-pg-note]`.

**Fixtures used in the prototype** (refresh these from real recordings in production):
| key | prompt | model | provider | tone | latency | cost |
|---|---|---|---|---|---|---|
| summarize | Summarize this release note in three bullets. | llama-3.1-8b | Groq | sage | 240 ms | $0.00004 |
| extract | Pull the order id, total and currency as JSON. | gpt-4o-mini | OpenAI | blue | 410 ms | $0.00012 |
| debug | Explain this stack trace and propose a fix. | qwen-2.5-72b | OpenRouter | clay | 980 ms | $0.00071 |
| haiku | Write a haiku about hairlines. | llama-3.1-8b | Groq | sage | 180 ms | $0.00002 |

**Production note:** demo mode reads these fixtures statically (cached at the edge). Live mode should POST the selected prompt to the serverless function, which holds the provider keys, runs the classify-then-dispatch routing, enforces a per-IP rate limit (~5/min) on cheap models only, and returns the same shape. The React island must never see provider keys.

---

## Interactions & Behavior

- **Theme toggle** (`theme.js`): a button (`[data-theme-toggle]`) toggles `data-theme="dark"` on `<html>`, persisted to `localStorage["fq-site-theme"]`. The icon swaps between `#i-moon` and `#i-sun`. The full token set has a dark variant — the same system "by lamplight".
- **Section nav**: rail links are in-page anchors (`#readme` … `#now`). Smooth scroll is fine to add.
- **Hover states**: rail links → `--paper-3` bg; work rows → `--paper-2` bg + amber title; repo/writing/tenet titles → `--amber-deep`. Transitions ~`.12s`.
- **Status pill pulse**: the green dot in the status pill emits a `ping` ring animation (`2.4s` ease-out infinite). Respect `prefers-reduced-motion` (the route spinner and pulse should be disabled).
- **Buttons**: `.btn.btn-amber` is the single primary action color per surface (warm amber gradient). `.btn-ghost` for secondary. `.btn-lg` for hero CTAs. `.btn-icon.quiet` for the theme toggle. These come from `focusquote.css`.

---

## State Management (Playground island)

- `current` — selected prompt key (default first).
- `mode` — `"demo" | "live"` (default `"demo"`).
- `routing` — boolean, drives the button spinner / disabled state.
- `result` — the resolved fixture (or live response), null until first route.
- **Live mode data fetching**: POST `{ prompt }` to the serverless endpoint; render the returned `{ model, provider, latency, cost, why, response }`. Handle a rate-limit (429) state with a friendly message. Demo mode requires no fetch — fixtures are bundled/edge-cached.

---

## Design Tokens

Defined in `colors_and_type.css` (light + dark). Key values:

**Paper / ink**: `--paper #FBFAF6`, `--paper-2 #F4F2EC`, `--paper-3 #ECE9DF`, `--page #E9E7E1`; `--ink #1A1814`, `--ink-2 #3A362F`, `--muted #807A6F`, `--muted-2 #B5AEA0`.
**Hairlines**: `--rule #E5E0D5`, `--rule-2 #D9D3C5`.
**Amber (the one action color)**: `--amber #F2A03C`, `--amber-deep #C77A1F`, `--amber-soft #FBE6C8`.
**Status tints (callouts only, never primary actions)**: blue `#E0EBF1 / #2E5C73 / #BCD3DD`, sage `#E1EBDF / #4A6A47 / #C6D7C2`, clay `#F2DDD3 / #A04B26 / #E8C7B7`.
**Type**: serif `Newsreader` (display/titles), sans `Geist` (body/UI), mono `JetBrains Mono` (labels/codes/numerals).
**Radii**: popup `14px`, card `10px`, control `8px`, chip `7px`, pill `999px`.
**Shadows**: warm, never blue/grey — see `--shadow-popup` / `--shadow-toolbar`. The system prefers **hairlines over shadows**; shadows are reserved for floating chrome (the variant switcher, popovers).
**Focus ring**: always amber — `0 0 0 3px rgba(242,160,60,0.18)`.

The monogram **tile** ("TV") is a rounded `--radius` square with a warm amber gradient (`#F4AC4F → #EE9B30`), 1px `--amber-deep` border, inset highlight, dark-brown serif letters.

---

## Assets

- **`icons.svg`** — an inline SVG sprite (symbols referenced via `<use href="icons.svg#i-...">`). Icons used in Variant B: `i-play`, `i-arrow-r`, `i-refresh`, `i-info`, `i-bulb`, `i-send`, `i-ext`, `i-download`, `i-moon`, `i-sun`, `i-clock`, `i-bell`, `i-link`, `i-layers`, `i-target`. Replace with the target codebase's icon system if it has one; otherwise this sprite is drop-in.
- **Fonts** — Newsreader, Geist, JetBrains Mono via Google Fonts (`<link>` in the file head). Self-host in production for the near-zero-JS / high-Lighthouse goal.
- No raster images or photography are used.

---

## Files in this bundle

- **`variant-b.html`** — the Variant B prototype (this is the design to build).
- **`playground.js`** — the Playground routing logic + demo fixtures (the contract the React island should reproduce).
- **`theme.js`** — light/dark toggle + persistence.
- **`colors_and_type.css`** — the authoritative design tokens (light + dark). Wire these in first.
- **`focusquote.css`** — the component layer (buttons, chips, segmented controls, etc.) built on the tokens. Reference for component styling; reimplement against the codebase's component primitives.
- **`icons.svg`** — the icon sprite.
- `variant-a.html` / `variant-c.html` — the two alternate directions, included for context only (not part of this handoff's build target).

For reference, the design's interactive elements bind to `data-*` attributes (`data-pg`, `data-pg-prompt`, `data-pg-route`, `data-pg-mode`, `data-pg-note`, `data-pg-empty`, `data-pg-result`, `data-pg-field`, `data-pg-modelchip`, `data-theme-toggle`) — see `playground.js` / `theme.js` for the exact contract.
