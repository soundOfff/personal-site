# siddz.com — inspiration study

## 1. Identity
Siddharth Meena, full-stack dev in Jaipur, India, founder of make.design. A one-column "developer résumé as a living dashboard": static profile + live data (GitHub contributions, Spotify last-played, visitor counter) with small, careful hover details. Next.js 15 + Tailwind 4 + framer-motion + sonner.

## 2. Layout & structure
- Single centered column, `max-w-3xl` (768px), 24px side padding, ~330px of white space either side at 1440. No sidebar, no rail.
- Fixed top nav (`fixed top-0`, 3 text links + theme toggle) with an 80px white strip under it that uses `mask-image: linear-gradient(to bottom, black 82%, transparent)` so content fades out under the nav instead of a hard line/blur.
- Section rhythm: identity block → key/value meta (LOCATION / EMAIL / PRONOUNS) → bio → Spotify line → social icons → contribution heatmap → tech-stack logos → Featured Projects (2-up cards) → Experience (vertical timeline, hairline + dot) → Contact (2-up card: link rows + form) → quote + visitor count card → footer.
- Section labels are tiny uppercase mono (`text-xs uppercase tracking-widest`, `tracking-[0.14em]` variants).
- Content is NOT scroll-revealed: `scrollDrivenRules: 0`, no IntersectionObserver reveal; everything renders immediately. Only loading skeletons (`animate-pulse`) for the live rows until the API responds.
- Three pages: Home, About (long-form essay with two-tone H1), Components (10-item grid of his `siddz-ui` shadcn registry, each with Preview/Code tabs, npm/pnpm/yarn/bun install tabs, props table).

## 3. Typography
- Body is **JetBrains Mono** (body font-family literally), headings/UI **Geist Sans** (`font-geist-sans`), Inter on the Components H1. Also loads all 5 **Geist Pixel** variants (Square/Grid/Circle/Triangle/Line) though I didn't spot them rendered (guess: services page or decorative).
- Scale is small and flat: H1 32px/600, body 15px, meta 10–11px uppercase mono with 0.14em tracking, section labels 12px. No display type anywhere.
- Treatments: About H1 two-tone ("From a curious kid to" #111 / "building for the web." gray). Inline `<strong>` as the only emphasis in prose. Ordinal superscript on the visitor count ("37,004<sup>th</sup>").

## 4. Color & surface
- Light: `--color-background:#fff; --color-foreground:#111; --color-muted:#555; --color-border:#e2e2e2; --color-accent:#f2f2f2`; a 10-step `--color-ds-gray-100..1000` ramp (#ebebeb … #111), Vercel-DS style. Dark: `#070709` bg, `#fafafa` fg, borders `rgba(255,255,255,0.06)`.
- Only chroma: Spotify green dot, emerald "current role" dot (`bg-emerald-400 ring-4 ring-emerald-400/15`), tech logos, colored pill tags on About (teal/blue/purple/green tints).
- Cards: `bg-[rgba(0,0,0,0.005)] border-[rgba(0,0,0,0.05)] rounded-xl`, zero shadows anywhere. Inputs `border-black/[0.1]` → hover `.16` → focus `.22`.
- **Texture:** full-viewport `fixed inset-0 -z-10` SVG with `<pattern id="grid-pattern" width=70 height=70>` drawing 1px `rgba(0,0,0,0.04)` lines at `opacity-80`: a faint 70px graph-paper grid behind everything (a `dot-grid` pattern is defined but unused). Theme toggled via `html.dark` class (next-themes, guess) with `color-scheme` set.

## 5. Motion inventory
Everything is short (100–250ms) and CSS-transition based; framer-motion is used in exactly one place on the home page.
1. **Cycling subtitle** (signature): 5 roles (`Software Tinkerer / Full-Stack Developer / Curious Builder / Detail Oriented / Product Engineer`) rotate every 3000ms. framer-motion `AnimatePresence mode="sync"`; each character is its own `motion.span` with variants `filter: blur(6px)→blur(0)`, `opacity 0→1`, `duration 0.5`, `delay = i * 0.5 / text.length` (a left-to-right de-blur wipe; captured mid-flight in `hover/stagger-0.png`). Width never jumps because all 5 strings are stacked invisibly in the same `inline-grid` cell (`col-start-1 row-start-1 invisible`).
2. **Tech-stack logos**: `hover:scale-110 transition-transform duration-150/200 ease-out` + per-icon tooltip (`absolute bottom-full`, `opacity-0 translate-y-1 → opacity-100 translate-y-0`, `duration-100 ease-out`, dark pill).
3. **Contribution heatmap**: 369 SVG `<rect>`s with `data-count/data-date/data-level`, 5 opacity levels per theme, `hover:opacity-80`; tooltip is ONE `position:fixed` div that follows the cursor with `transition-all ease-out duration-100` ("No contributions on Aug 1, 2026", small caret). Hidden on mobile (`md:block hidden`).
4. **Nav links**: underline grows from left via `after:w-0 → md:hover:after:w-full`, 1px `after:h-px bg-current`, plus color #555→#111.
5. **Theme toggle**: icon `group-hover:-rotate-12` (moon) / `rotate-12` (sun), `duration-250 ease-in-out`; the swap itself is an instant class flip (no View Transition; the `startViewTransition` hit is Next's router internals).
6. **Contact link rows**: `hover:bg-black/[0.02]` + arrow icon `group-hover:translate-x-0.5 -translate-y-0.5` (nudges NE).
7. **Project cards**: title `group-hover:underline`, globe icon `group-hover:translate-x-0.5`; no lift, no image zoom (verified computed styles on hover).
8. **Submit button / inputs**: border-alpha steps on hover/focus only, no ring, no press transform.
9. **Skeleton state**: `animate-pulse` (`pulse 2s cubic-bezier(.4,0,.6,1) infinite`) for the Spotify row until fetch resolves.
10. **Live timezone clock** component: local time + `// 3h ahead` diff vs IST (`330 - (-getTimezoneOffset())`), ticking every 1s (module shipped; guess: rendered on /services or footer, not seen on the three pages I shot).
11. **Toasts**: sonner (`sonner-fade-in/out`, `swipe-out-*` keyframes); nothing fired on an empty submit in my test.
12. Defined-but-unused: `@keyframes float` (translate(30px,-50px) at 33%).
13. **Components-page demos** (his library, not the portfolio): Confetti Button = `canvas-confetti` on a `position:fixed; z-index:100` canvas, honors `prefers-reduced-motion`; Floating Tabs = spring-physics sliding background indicator; Scramble Text = hacker-style per-char decode on hover; Animated Text Slider = vertical role carousel; Shiny Text = moving highlight; Command Palette = AnimatePresence scale/opacity + backdrop. Easings on the site are only Tailwind's four `cubic-bezier`s; springs exist only inside the framer bundle and Floating Tabs.

## 6. Sound
**None found.** No `<audio>`, no `AudioContext`/`Howl`/`new Audio`, no mp3/wav/ogg requests, no `navigator.vibrate`, verified by grepping all 24 JS chunks and by monkey-patching `AudioContext`, `Audio`, `HTMLMediaElement.play` and `vibrate` before load on both the home and confetti pages (zero events after hovers, clicks, a confetti burst and the theme toggle). The only "audio" is the Spotify "Last played / Now Playing — track · artist" text line polled from `api.siddz.com/portfolio/api/spotify` every 30s (that single endpoint also returns visitorCount and GitHub contributions).

## 7. Navigation & wayfinding
Three top links with the growing-underline active state; "← Back to Components" mono breadcrumb on detail pages; no command palette on the portfolio itself (Cmd+K opens nothing, though he ships one in his library), no keyboard shortcuts, no progress bar, no section index, no anchors. Footer repeats links + socials.

## 8. Signature moments
1. The blur-stagger role title: the one piece of motion, done well, with the zero-layout-shift trick.
2. Live-data résumé: real GitHub heatmap with cursor-following tooltip, Spotify last-played, "You are the 37,004th visitor" (localStorage `visitorId` + `X-Last-Visit` headers).
3. The 70px graph-paper SVG grid behind a shadowless, hairline, Vercel-gray page.

## 9. STEAL LIST (for tomasbrasca.dev)
1. **Blur-stagger title for the rail/hero**: "Fullstack · AI systems" rotates through what the agent can do ("routes LLMs", "scales checkout", "draws its own UI"); per-character `filter: blur(6px)→0` with `delay = i*dur/len`, stacked invisible copies in one `inline-grid` cell so the warm-paper layout never shifts. Doable with the Web Animations API, no framer.
2. **Live-data strip under the readme**: a one-line "activity ticker" like his Spotify row: last A2UI question asked, last commit, Rosario local time with `// 4h behind you` (port his clock, offset −180 for ART). Skeleton `pulse` until it resolves.
3. **Cursor-following `position:fixed` tooltip (100ms ease-out)** on dense data: reuse on the A2UI playground's generated tables/timelines and on a "log" heatmap of agent sessions; his `data-count`/`data-date` attributes + one fixed div is cheaper than per-cell tooltips.
4. **Mask-fade under the sticky element**: `mask-image: linear-gradient(to bottom, black 82%, transparent)` on an 80px backdrop so scrolling content dissolves under the rail/top bar instead of a hairline; fits the no-shadow rule.
5. **Paper texture as an SVG `<pattern>`**: a fixed `-z-10` SVG with a 70px 1px-line grid at 4% alpha (or the dot grid) gives the warm paper a drafting-sheet feel; cheap, themeable via `currentColor`, and A2UI surfaces can visibly "snap" to it.
6. **Arrow nudge on hover**: outbound links' arrow `translate(0.5px,-0.5px)` NE on `group-hover`; tiny, consistent, apply to every external link in work index / open source.
7. **Width-stable ordinals**: "37,004<sup>th</sup> visitor" → "you asked the 1,208<sup>th</sup> question" under the playground, from the same endpoint that returns the daily quota.
8. **Confetti as a reward, gated by reduced-motion**: fire `canvas-confetti` (fixed canvas, z 100, `disableForReducedMotion`) when the agent finishes composing a surface, and this is exactly where Tomas should add the sound siddz lacks (a short WebAudio "pop" synced to the burst).

## 10. Anti-patterns (don't copy)
- Zero scroll-driven or entrance motion: the page is static on load; for a client who loves micro-animations that reads as inert.
- Tech-logo wall (23 colored SVGs) is the loudest thing on the page and says nothing.
- Hover-only tooltips with `md:block hidden`: unreachable on touch/keyboard.
- Body set in JetBrains Mono at 15px for long prose (About page) hurts reading; keep mono for meta only.
- Visitor counter is mildly gimmicky; only steal it if the number is meaningful (A2UI questions).
- Live data via 30s polling with a silent `catch{}` and no error state.

## 11. Verdict
siddz is a restraint benchmark, not an experimental one: it shows how far hairlines + a gray ramp + one well-built text animation can go, and it proves "live data in a résumé" works. For Tomas it suggests the **"instrument panel" direction**: the rail/readme as a live dashboard (ticker, clock, heatmap of agent sessions, blur-staggered role title) sitting on drafting-grid paper, but the motion and sound must come from Tomas's side; there is nothing audible to borrow. **DNA score: 4/10**: steal the live-data idioms, the mask-fade and the blur-stagger title; leave the layout and the silence.

Screenshots: `/private/tmp/claude-501/-Users-User-Tomi-personal-site/4eaded3e-1177-425c-a93e-76495f249faf/scratchpad/research/siddz/` (home: viewport/seg-00..03/full/mobile; `hover/`: stack-hover, contrib2-hover, dark-viewport, dark-mid, nav-hover, confetti-1, stagger-0/1; subpages in `components/`, `about/`, `confetti/`; bundles in `bundles/`).
