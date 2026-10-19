# Handoff · personal-site portfolio redesign (2026-10-08)

> **Outcome (2026-10-19):** none of the five directions below was picked. Tomas chose the later
> film-palette concept (a visitor picks a film and the homepage is screened through it), designed on
> its own canvas (https://claude.ai/artifact/Hb6C6TC3C3Y3SLfRiDV4vC) and implemented in `src/reels/`.
> This folder is kept as the research and the record of the directions considered.

Next session focus: Tomas reviews the five redesign variants, picks a direction (or a mix), and implementation starts in the Astro site.

## Where things stand

- **Deliverable:** five playable homepage variants on a Design canvas, pinned in the sidebar: https://claude.ai/artifact/5CjSjSKGnc1at8ZWSQivF1 (private, owner only). Names are stable, never renumber: 01 Living Paper, 02 Instrument Panel, 03 Drafting Sheet, 04 Boot Sequence, 05 Desk. Each is a `.dc.html` artboard with `expand: fill` and `is_interactive: true`; Play opens it full-window with sound.
- **Repo copy (uncommitted, on `main`):** `docs/adr/design/redesign-2026-10/`
  - `canvas/` the five artboards + `canvas.json` exactly as published
  - `research/` nine reports: one per inspiration site (nerdy, jhey, siddz, harshsingh, lelezhang, shwn, imdaryl) plus `designeer.md` (component/resource shortlist) and `tools-eval.md` (Painting Loaders + Nexvyn UI)
  - `assets/` two watercolor washes used as hero textures (uploaded to the canvas as `/_blob/e14030ce…` amber and `/_blob/879f7f05…` dark ember)
  - `shared/` `soundkit.js` and `content.js` (reference snippets), `shot.mjs` (headless Chrome screenshot + analysis harness, needs `playwright-core`), `checkdc.mjs` (syntax + smoke check for a `.dc.html` logic class)
- **Memory:** `user-design-taste` and `portfolio-redesign-2026` under the project memory dir summarise taste and state.
- **Nothing has been chosen yet.** No site code was modified. Git tree is clean apart from the new docs folder.

## The user's brief, in one line

Experimental, not a landing page; loves micro-animations, especially with sound; wants to review before implementing; works as an orchestrator who delegates research to parallel agents.

## Open questions asked, awaiting answers

1. Which direction, or which combination (mixing is cheap: e.g. 01 skeleton + 05 cards, or 04's compose log inside the playground)?
2. Is amber sacred, or are 04's teal-on-bone and 05's vermilion-on-cream fair game?
3. Sound default on with a visible mute, or off until opted in?
4. Commit the research folder? (It is copied but not committed.)

## Variant cheat sheet (details and provenance in the canvas stickies and `research/*.md`)

| # | Name | Core idea | Signature sound |
|---|------|-----------|-----------------|
| 01 | Living Paper | today's Workbench with living details: wash, self-drawing monogram, blur-cycling role, scroll-drawn rules, spring rail pill | whisper ticks, soft chime |
| 02 | Instrument Panel | dark; goo rail marker, odometer digits, live telemetry, gliding row highlight, five-bar agent state | pitched wood per rail step, arrival chord |
| 03 | Drafting Sheet | page plots its own wireframe then inks in; rulers, sheets 00–08, title block = changelog; surfaces draft before filling | pencil ticks, plotter whoosh, click palette |
| 04 | Boot Sequence | agent composes the page: compose log, slot reveals, lede un-redacts, pipeline spine; teal/bone, Instrument Serif | streaming drone, commit clicks, chime |
| 05 | Desk | tactile index cards sent into the playground slot, keycap send, noun popovers, physical day/night switch; vermilion/cream | keycaps, wood per card, whoosh, chime |

Only shwn.design, imdaryl.com and lelezhang.design ship sound; all three synthesize it with Web Audio. Resource picks for implementation: cuelume (cues), slot-text / NumberFlow (rolling text and numbers), interior.dev task-steps + streaming-text, Fluid Functionalism `useFluidHover`, Nexvyn `bars-theme` and its `lib/sound.ts`, Paper Shaders (grain). Avoid list is in `research/designeer.md`.

## When a direction is picked: implementation map

- Shell and layout: `src/layouts/BaseLayout.astro`, `src/components/Rail.astro`, `src/styles/global.css` (the "Workbench" layer on top of `editorial-ui` tokens; fonts via `@fontsource-variable`).
- Content stays in `src/data/site.ts`, `src/data/repos.ts`, `src/content/{work,blog}`; do not invent facts.
- Playground island: `src/islands/A2UIPlayground.tsx` + `src/islands/a2ui/*` (renderer, components, demo transcripts). The "surface composed" sound hooks belong where surfaces mount in the renderer.
- Sound: ship a tiny `sound.ts` (synthesized, no files, lazy AudioContext on first gesture, visible mute persisted in localStorage, `prefers-reduced-motion` gate). The prototype kit is `shared/soundkit.js`.
- Quality gates: `npm run format:check && npm run lint && npm run check && npm run build`. Deploy is Cloudflare Workers via `.github/workflows/deploy.yml`.

## Gotchas learned this session

- Canvas format rules live in the artifact type's `artifact-type/reference/format.md` (read via the Artifact tool). Key ones: all UI as `<x-dc>` markup, `{{ holes }}` are dotted lookups only, events are camelCase whole-value attrs bound to functions from `renderVals()`, no `<iframe>`, no global keydown handlers, CSS in `<helmet><style>`, Google Fonts only via a `css2` link.
- To change a variant: edit the file under `docs/adr/design/redesign-2026-10/canvas/` (or the scratchpad copy), run `node shared/checkdc.mjs <file>`, then publish with `root` = the folder containing `project/`, `file_path` = one changed file, `files` = the others. Send `canvas.json` only when layout, notes or titles change. If the publish says someone saved meanwhile, re-read that file first.
- SVG filter primitives with camelCase attrs (`stdDeviation`, `baseFrequency`) may be lowercased by the template parser; grain and graphite effects then fall back to flat. Benign, but check in Play before relying on them.
- First-load sequences (03 plotter, 04 boot) are silent until the viewer clicks; both have replay buttons.
- The live domain `tomasbrasca.dev` did not resolve (DNS NXDOMAIN) on 2026-10-08; the baseline screenshot was taken from the local `dist/client` build served on port 4799.
- Subagents could not use the Write tool for report files; the orchestrator saved those reports itself.

## Suggested skills

- `frontend-design` and `make-interfaces-feel-better`: for the implementation pass (distinctive type/palette, interruptible transitions, concentric radii, tabular nums, press scale 0.96).
- `apple-design`: spring physics, gesture-driven cards (05) and interruptible transitions.
- `redesign-existing-projects` or `impeccable`: audit-first when porting a direction onto the existing Astro + editorial-ui code without breaking the island.
- `design-review`: critique the chosen variant in Play view before coding.
- `run`: to launch `npm run dev` and screenshot the real site while porting.
- `create-pr`: when the first implementation slice is ready.
- `design` (the Design canvas skill): to revise or add artboards on the same canvas URL; never create a second canvas.
