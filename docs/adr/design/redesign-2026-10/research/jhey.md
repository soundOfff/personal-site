# jhey.dev — inspiration report (slug: jhey)

## 1. Identity
Jhey Tompkins ("jh3y"): design engineer, ex-Chrome CSS/UI DevRel at Google, ex-Vercel, now Brand Design Studio @ Shopify. A single-screen, 600px-wide bio card: serif headline, five paragraphs with red inline links, a signature that writes itself, and a live status ticker (location, weather + time, latest CodePen, Steam, Spotify). Concept: a business card that boots up for ~2.5s, then idles.

## 2. Layout & structure
- One route, one screen: `scrollHeight` = 900 at 1440x900. Every subpage probe (/ama, /uses, /blog, /work, /talks...) 404s.
- Astro 5 + Tailwind v4. The status block is an Astro server island (`/_server-islands/Status`, prefetched via `<link rel=preload as=fetch>`): static shell, live data streamed in.
- Single centered column (`--spacing-content: 600px`), vertically centered, fixed 40x40 logo top-left. No footer or nav list.
- Rhythm: headline (58px) -> Doto kicker (14px) -> five short paragraphs -> signature (w-32, rotated 12deg) -> five status rows. Mobile is the same stack.
- Content is revealed by a timed choreography, not scroll: column blurs in at 0.5s, signature draws from 0.75s, status decodes from ~1s with 125ms stagger.

## 3. Typography
- Headline: DM Serif Text (400 only, `font-[600]` so bold is synthesized; guess: deliberate), `leading-none`, `text-wrap: balance`. Size from a Utopia-style formula with CSS `pow()`: `--font-level: 3.8`, min 14px*1.2^level, max 20px*1.33^level over 375-1500px `vi` = 58.09px at 1440 (~28px at 375).
- Body: Inter 300, 16/24, #666 (`color-mix(in hsl, canvasText, canvas 40%)`); last paragraph italic.
- Kicker + status: Doto (Google's dot-matrix font), 14px/600/uppercase, exposed as `--font-mono`. This makes live data read like an LED departure board.
- Self-hosted, with `size-adjust`/`ascent-override` Arial fallbacks.

## 4. Color & surface
- Canvas + one red. `--color-bg: light-dark(#fff, #000)`; text #666 light / #f6f6f6 dark. Accent Tailwind red-400 `oklch(70.4% .191 22.216)` (~#ff6b6b) for links, `::selection`, focus ring and `scrollbar-color`; logo mouth `#FF1E1E`.
- Dark mode is automatic (`color-scheme: light dark` + `light-dark()`), no toggle. Dark render: pure black, white text, same red.
- Only texture: fixed `body::before` 40px grid from two 1px `linear-gradient`s (`color-mix(canvasText, transparent 90%)`, 80% in dark), offset 0.36/0.32 of a cell, masked with `linear-gradient(125deg, transparent 60%, #fff)` so ruling appears only in the bottom-right corner. No shadows, borders or grain.

## 5. Motion inventory (timings from `states/t-*.png` and the CSS)
1. Page reveal: `@keyframes reveal` (blur 4px->0, opacity 0->1, translateY 1rem->0), 0.35s ease-out, 0.5s delay, `both`, motion-safe only; parameterised by vars (`--blur-from`, `--translate-from-y`, `--scale-from`). Frames at 150/450ms are blank.
2. Signature draw: six SVG paths with `pathLength="1"`, `stroke-dasharray/dashoffset: 1.025`, `@keyframes draw{to{stroke-dashoffset:0}}`, ease-in. Each path carries inline `--path-speed` = its share of total length (0.83, 0.03, 0.036, 0.0175, 0.016, 0.04) and cumulative `--path-delay`; `--base-delay: .75s`. Constant pen speed writes "Jhey", then ears, eyes, nose in stroke order (1100-1800ms). Eyes/nose then `fill` to currentColor over 0.5s at `--natty-delay: .973s`.
3. Idle blink: `.sig .eye{animation: blink 6s infinite}`, `transform-box: fill-box`, scaleY(.1) at 47% and 49% = a double blink every 6s. Zero JS.
4. Status decode: the server renders each value as thirty `X`s with the real text in `data-status` and `data-chars="X"`. The 81KB script is GSAP 3.13 + ScrambleTextPlugin only: `gsap.to('[data-status]', {scrambleText:{text: dataset.status, chars:'X'}, delay: 1 + i*0.125, duration: 1, ease:'power2.out'})`. A one-letter alphabet makes it read as a redaction bar un-redacting left to right, not a hacker scramble. `onComplete` sets `data-unscrambled=true`.
5. Marquee: values over `w-[30ch]` get `data-marquee=true`; text is duplicated with a bullet and `@keyframes marquee{to{translate:-50%}}` 8s linear infinite, gated on `[data-marquee=true][data-unscrambled=true]` so it never runs on the X-bars.
6. Link hover/focus: instant (0s) solid fill `:is(:hover,:focus-visible){background: red-400; color:#fff}`, square corners, `box-decoration-break: slice`; focus-visible adds a 2px red outline, 2px offset. Status links fill only the inner span.
7. Logo hover: #666 -> `canvasText`. Weather PNG forced `grayscale` to match the mono icon row.
8. Reduced motion: reveal, draw, blink and marquee compute to `animation: none` (verified); the GSAP decode still runs (no `matchMedia`), which is required because the server ships X's.
Not present: scroll-driven animation, View Transitions (Astro defaults unused), cursor effects, loaders, 3D, springs.

## 6. Sound
None found. 0 `<audio>`, 0 AudioContext/Howler/Tone references, no mp3/wav/ogg requests in HTML, CSS or the single JS bundle.

## 7. Navigation & wayfinding
Essentially none: a logo link to `/`, eleven external links, no index, palette, shortcuts or progress. Wayfinding is typographic: serif = who, Doto = live, red = clickable. The status list is an "about me right now" panel.

## 8. Signature moments
1. The signature writing itself in stroke order, then the bear blinking every six seconds.
2. Status lines arriving as dot-matrix `XXXXXXXX` bars and decoding into live data one after another.
3. Paper that is ruled only in one corner (masked grid).

## 9. STEAL LIST
1. Boot sequence for the A2UI playground: while an answer streams, render each pending surface title/row as JetBrains Mono (or Doto) `XXXX` bars and decode with a single-char scramble (chars "X", 1s, power2.out, 125ms stagger) as tokens land; ~40 lines of rAF, no GSAP. Pair each decoded row with a short click.
2. Length-proportional path drawing for Flow/timeline components and any signature or skyline mark: `pathLength="1"`, per-path `--path-speed` = length/total, cumulative `--path-delay`, then a `fill` tween; stroke order becomes narrative order.
3. Idle life via long-period keyframes: a 6s loop with a 2-4% active window (caret blink, LED flicker on the "now" dot, a tick on the active rail number) keeps the page alive at zero CPU.
4. "Now" panel as a server island: static shell, prefetched `/_server-islands/Now` with latest GitHub commit, Spotify, Rosario weather + local time; long values get `data-marquee` and the 8s `translate(-50%)` starts only after decode.
5. One var-driven `reveal` keyframe (blur/translate/scale vars, motion-safe, arbitrary delays) to stagger generated A2UI cards; blur 4px -> 0 reads as "coming into focus", apt for generated UI.
6. Hard-fill links: amber background + paper-colored text on `:is(:hover,:focus-visible)` plus matching `::selection` and `scrollbar-color`, so the single accent is systemic; give it 60-80ms and a tick rather than 0ms.
7. Corner-masked texture: a faint ruled grid on `body::before` with a 125deg mask, clean under text and ruled only in the empty quadrant; `light-dark()` for alpha.
8. A third typeface reserved for machine-sourced values only (now playing, Dex routing latency, A2UI quota counter) so "live" has a voice distinct from Newsreader/Geist.

## 10. Anti-patterns
- 81KB of GSAP for one scramble on five strings.
- 0ms hover fills; harsh on a reading column, jarring on dense A2UI lists.
- One-screen IA with no work, writing or case studies; keep the 00-08 rail.
- Synthesized bold on a single-weight serif.
- Marquee hides the start of the title for most of each 8s cycle; prefer hover-to-scroll.
- No reduced-motion handling in the JS decode; gate Tomas's version.

## 11. Verdict
jhey.dev points to a "machine that boots" direction: a quiet typographic page whose only motion is a startup choreography (reveal -> draw -> decode -> idle blink) followed by live telemetry in a dot-matrix voice. That frames an agent that generates UI perfectly, and every beat is a natural sound cue Jhey leaves silent. Borrow the choreography and live-status typography, not the one-screen scope or the GSAP dependency. Score: 6/10 of this DNA in one variant.

Screenshots and sources: `/private/tmp/claude-501/-Users-User-Tomi-personal-site/4eaded3e-1177-425c-a93e-76495f249faf/scratchpad/research/jhey/` (viewport.png, mobile.png, full.png, analysis.json, page.html, bundles/) and `.../jhey/states/` (t-0150..t-3200ms.png intro frames, hover-link.png, focus-link.png, hover-status.png, dark-viewport.png, marquee-a/b.png, reduced-*.png, computed.json, hover.json, dark.json).
