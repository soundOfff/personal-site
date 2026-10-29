# Showcase prototypes. Common brief

## Who this is for and what it decides

Tomas Brasca is a full-stack engineer in Rosario who ships AI products end to end. His portfolio (tomasbrasca.xyz, Astro 6) uses the "Flood" design: a cobalt pixel cave built from 20 px cells that floods in on load, Newsreader italic display type, warm paper. The people who read it are engineering hiring managers, founders and CTOs deciding whether he can ship.

He wants three things changed, and he will choose between prototypes by using them:

1. **Projects with real demos.** His three featured products (Sift, Focus Quote, Catcher) currently show still screenshots. Each now has a recorded, silent, looping demo. Show them so a hiring manager understands what each product does within 5 seconds of the demo playing. The reference he shared is loadmo.re: plain screen recordings, a poster under a looping video, minimal captions, no device mockups.
2. **A "My AI workflow" section in pixel art,** second or third on the page. It shows how he actually works with AI agents. He called this an important section. It must be visual, minimal and pixel art, matching the cover.
3. **Section snapping.** Today the page scrolls freely. He wants scrolling to settle on sections.

He loves minimalism and pixel art, and wants something really visual with a lot of UX care. This is a throwaway prototype: code quality matters less than speed, but he judges by using it, so everything you show must actually work.

## Where your work goes

- The dev server is already running at `http://127.0.0.1:4400` (shared by several agents). Your page is `http://127.0.0.1:4400/prototype/showcase?variant=<your id>`. Never start, stop or restart a dev server, never run `npm install`, never run git.
- Write **only** inside `src/prototypes/showcase/<your id>/` in the worktree `/Users/User/Tomi/.worktrees/personal-site-proto`. Your entry point is `Variant.astro` there (replace the placeholder). Add any `.ts`, `.css` or other files you need beside it. Never edit any other file, including `registry.ts`, `Switcher.astro`, the route, `content/`, `flood.css` or other variants.
- The route `src/pages/prototype/showcase.astro` is a copy of the real landing page (`src/pages/index.astro`). It renders, in order: the cover, **your `Variant.astro`**, then the existing experience band, `#index` (all 13 projects), `#readme` (about), the writing section, `#playground`, and the footer `#contact`. The header and the floating dark switcher bar at the bottom are not yours.

## Hard contract

1. **Root.** Everything you render sits inside one element with `data-proto="<your id>"` (it may use `display: contents`).
2. **Sections.** Inside the root you render a projects section with `id="work"` (the header's "Work" link targets it) and a workflow section with `id="workflow"`. Their order inside your root decides whether the workflow is 2nd on the page (before `#work`) or 3rd (after it). Your direction brief says which.
3. **Scoping.** Several variants share one dev server, so nothing may leak. Astro's default scoped `<style>` is fine. Every selector in a `<style is:global>` block or a plain imported `.css` file must start with `html:has([data-proto="<your id>"])`. Every client `<script>` starts with `const root = document.querySelector('[data-proto="<your id>"]');` and does nothing when `root` is null. Styling the sections that are not yours (the cover, experience band, index, readme, writing, playground, footer) is allowed only through `html:has([data-proto="<your id>"]) ...` selectors, and only for snapping and spacing, not a redesign.
4. **Keys.** The switcher uses bare ← and → on `window`. If your variant handles arrow keys, handle them on a focused element and call `event.preventDefault()`, so the switcher leaves them alone.
5. **No shared browser.** Do not use the Playwright MCP tools or the Chrome extension tools: other agents share that browser. Use `shoot.py` (below) and, if you need more, your own headless Python or Node Playwright script.

## Data you must use

```astro
---
import { selected } from '../content/showcase';   // Sift, Focus Quote, Catcher in landing order
import { workflow } from '../content/workflow';   // the workflow, agents and tools
---
```

- `selected[i]` is `{ project, href, subtitle, story, flow, status, demo }`. `project` has `id, name, category, description, stack, website, source`. `href` is the detail page (`/work/<slug>`). `demo` is `{ mp4, webm, poster, duration, chapters: [{ t, label, still }], walkthrough }`. Read `src/prototypes/showcase/content/showcase.ts` and `demos.json`.
- The media is real and lives in `public/demos/<slug>/`: `loop.webm`, `loop.mp4`, `poster.webp`, `stills/*.webp`, `chapters.json`. Look at the posters and stills with the Read tool before designing, and watch a few frames of each loop (`ffmpeg -ss <t> -i public/demos/<slug>/loop.mp4 -frames:v 1 /tmp/...png`). Each loop is 1600x1000 (16:10), silent, 15 to 30 s, with 4 to 6 chapters. Sift has an optional narrated `walkthrough.mp4`.
- `workflow` keeps the 5 stages of `src/data/workflow.ts` (`frame`, `design`, `build`, `verify` labelled Review, `decide`), each with `label, hint, title, body, owner, input, action, output, humanDecision, condition`. It adds `workflow.agents` (Claude Code on Opus, Codex CLI on gpt-6-astra), `workflow.tools[stageId]` (skills from pstack, Matt Pocock and his own flow kit, plus Orca for orchestration and Playwright checks), `workflow.feedback` (failed checks return to Build, a wrong approach returns to Design) and `workflow.sources` (links). Read `src/prototypes/showcase/content/workflow.ts` and `src/data/workflow.ts`. Use this content; you may shorten copy, never invent tools or claims.

## The Flood design system (keep it)

- Tokens in `src/styles/flood.css:6-38`: `--paper #f7f3e9`, `--ink #182126`, `--blue #0024cc`, `--light #8a9bff`, `--amber #e0b81f` (amber is reserved for the shortest path or one single highlight, never decoration), `--line #c8c6b8`, `--ease cubic-bezier(0.22, 1, 0.36, 1)`, `--serif` (Newsreader italic for display), `--sans` (Geist for UI), `--mono` (JetBrains Mono 11 px for meta).
- Layout classes you can reuse: `.shell` (max 1360 px, 48 px gutters), `.section` (100 px vertical padding), `.section-heading` (an italic headline with one solid word and one `.ghost` word, plus a short line of copy), `.eyebrow` (mono label with a 7 px square bullet), `.button`.
- Pixel grid: 20 px cells, a 2 px checkerboard dither for the light tone, square corners or 2 px radii. `src/lib/flood/pixels.ts` exports `PALETTE`, `GLYPH` (the 7x7 ✳ wordmark), `grid()`, `bfs()`, `draw()`, `patterns()` (the dither), `size()` (DPR canvas sizing), `hash()` and `random()`. `src/components/PixelSigil.astro` draws the ✳ or a seeded 8x8 sigil as crisp SVG rects. Look at `src/lib/flood/cover.ts` and `src/components/WorkCard.astro` to see how the site animates.
- The existing selected-work cards are `src/components/WorkCard.astro` (`.bento`). That is what you are replacing in `#work`.
- Copy: short declarative sentences, sentence case, no em dashes, no exclamation marks, no "users"/"visitors" for the audience. Name the products, not Tomas's role over and over.

## Ethics

Do not copy andreas.vision (its palette of white and sky blues, its sky, cloud, horse, globe or stamp motifs, its typeface, copy or code). Do not draw Anthropic, OpenAI, Cursor or other company logos: represent Claude Code and Codex as original pixel sprites or marks, labeled by name. Every pixel drawing is made from scratch in code (canvas, SVG rects or CSS grids). No external images or CDNs except a pinned `cdn.jsdelivr.net` library that clearly earns its place.

## Demos: required behaviour

- Use `<video muted loop playsinline preload="metadata" poster=...>` with `<source src=webm type="video/webm">` first and `<source src=mp4 type="video/mp4">` second. Give each video an `aria-label` that says what the demo shows.
- Play when the video is at least half in view (IntersectionObserver), and also on hover and keyboard focus of its card. Pause when it leaves the view. Touch devices get in-view autoplay.
- Under `prefers-reduced-motion: reduce`, never autoplay: show the poster with a visible play control.
- Captions come from `demo.chapters` (the label of the current chapter, chapter ticks, or a list of beats). Do not burn text into the video.
- Every project still links to its detail page (`href`).

## Snapping: hard limits

The cover is a 200svh section with a sticky inner stage. Its scroll position scrubs the pixel cave into the ✳ glyph (`src/lib/flood/cover.ts:236`), and returning to the top replays a ripple. Both must keep working.

- Native CSS scroll snap. No wheel or touch hijacking, no `preventDefault` on scroll input, no JS that fights the user's momentum. No `scroll-snap-stop: always`.
- `html` already has `scroll-behavior: smooth` and `scroll-padding-top: 100px` (`flood.css:40-43`).
- The cover must stay freely scrubbable: no snap points inside it. A snap at its top (0) and at the start of the next section is fine.
- Sections taller than the viewport must stay freely scrollable inside (that is how `proximity` behaves; `mandatory` traps them and has open WebKit bugs 253195 and 253196). `mandatory` is allowed only inside a self-contained component whose children each fit the viewport.
- Space, Page Down and the header anchor links keep working.
- Turn snapping off under `prefers-reduced-motion: reduce` and on viewports shorter than 640 px.
- Put the snap rules on the whole page, including the sections that are not yours, through `html:has([data-proto="<your id>"])` selectors.

## Other must-haves

- Reduced motion shows the final state of every animation, not a cut-down version.
- Hover effects only under `(hover: hover) and (pointer: fine)`; touch gets an equivalent.
- Mobile at 390 px: no horizontal page scroll, readable demos, the workflow still legible (it may change layout).
- Keyboard: every control reachable with visible focus.
- Performance: size canvases with `devicePixelRatio`; stop animation loops when offscreen or when the tab is hidden; one scroll read per frame (`onScroll` from `src/lib/flood/scroll.ts` gives you that).
- Zero console errors.

## Prior art (optional pointers, not requirements)

- loadmo.re: a poster as background, a muted looping video on top, a tiny caption.
- rauno.me/craft: a blurred copy of the media as the placeholder while a video loads; title left, meta right.
- devouringdetails.com: `#t=0.001` on the src to show the first frame; `scale` to crop into the interesting part.
- cursor.com: demos shown on a textured backdrop instead of a device frame.
- Pixel Agents and pixtuoid.dev: coding agents drawn as pixel characters, one sprite state per activity (typing, reading, waiting).
- Anthropic's "Building effective agents": the evaluator-optimizer loop (generate, evaluate, feed back).
- daisyUI's RPG pixel-art notes: a central scene with status panels around it, bitmap type at whole-number scales.

## Verify before you report

Run from the worktree root:

```sh
python3 src/prototypes/showcase/shoot.py <your id> --quick   # fast loop while iterating
python3 src/prototypes/showcase/shoot.py <your id>           # the gate: desktop and mobile, with and without reduced motion
```

It loads your variant in headless Chrome at 1440x900 and 390x844, wheels through the page and records where each gesture settles, presses Page Down, screenshots every section, the workflow, each demo in view, and the return to the top, checks that demos play in view, pause offscreen and stay paused under reduced motion, checks horizontal overflow and console errors, and writes `src/prototypes/showcase/<your id>/shots/*.png` and `shots/report.json`. It exits non-zero on any failure.

Open the PNGs with the Read tool and judge them as a hiring manager would. A pass with an ugly or confusing page is not done. Iterate until the full run prints PASS and the page looks right.

Then write `src/prototypes/showcase/<your id>/NOTES.md` in 40 lines or fewer: the concept in two sentences, the alternatives you considered and rejected (and why), which prior art you used where, and known gaps.

## Final report

200 words or fewer: your files, the last line `shoot.py` printed for the full run, the concept, the alternatives you rejected, and the known gaps. Aim to finish within about an hour.
