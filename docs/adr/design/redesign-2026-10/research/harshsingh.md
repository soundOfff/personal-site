# harshsingh.me — research report

## 1. Identity
Harsh Singh, design-engineer in Austin TX, leads engineering at MainBranch (AI agents for the public sector). The site is a single page: a 4-line bio, then a wall of 35 silent looping WebM clips of UI micro-interactions he built, with ~10 of them linked to real projects. Concept: "my tiny speck on the internet" — the portfolio *is* a showreel of craft, no sections, no nav, no words beyond the bio. Astro v5, Tailwind v4, ~9 KB of vanilla JS, open source (github.com/haaarshsingh/www).

## 2. Layout & structure
- Centered 500px text column (90vw on mobile) for header; then a `min(1024px, 95vw)` two-column bento (`grid sm:grid-cols-2`, each column a `@container` flex-col). Tiles are `aspect-square` or exactly half-height `h-[calc((100cqw-0.75rem)/2)]`, 12px gap, 16px radius, 1px `neutral-200` border. Page is 6,792px tall; mobile collapses to one column and reorders project tiles first (`data-mobile="project"`).
- No nav, no headings in `<main>`, no footer links beyond "Made with Astro / Last visit from {city}" and a theme toggle.
- Reveal: `@keyframes intro` (opacity 0→1, translateY 10px→0, 0.3s ease-in-out forwards) staggered by inline `[animation-delay:0.25s/.3s/.35s/.4s/.6s]`. `html.skip-intro` kills it when you arrive via back/forward or a same-origin referrer. Videos play/pause via IntersectionObserver (rootMargin 200px), pause on `visibilitychange`, and drop `autoplay` under `prefers-reduced-motion`.
- Project tiles get a name + ↗ + year caption over an 8-stop black gradient scrim (`.fade-to-bottom`: 0 → 8% → 23% → … → 85% alpha), not a 2-stop one.

## 3. Typography
- `system-ui, -apple-system, Inter, sans-serif`. One body size (16px, weight 300, line-height 1.375), captions at 14px. No display scale at all.
- The only "type" with voice is the h1: a hand-lettered SVG script wordmark in a blue gradient (#0C55A3 → #0F8DD3 → #0FBDD0 → #05B4E6).
- Inline brand icons before proper nouns ("Texas" flag, "craft" sparkle, MainBranch logo) inserted via a `[word-spacing:17px]` spacer hack. Interactive words carry a wavy underline (`decoration-wavy decoration-neutral-300`).

## 4. Color & surface
- Tailwind v4 oklch neutrals. Light: body `oklch(0.97 0 0)`, text `oklch(0.205 0 0)`, borders `oklch(92.2% 0 0)`. Dark (`.dark` class, localStorage + `prefers-color-scheme`, set in an inline head script): body `oklch(0.205 0 0)`, borders `oklch(37.1% 0 0)`, tiles `#161616`–`#191919`; the map tile swaps to a `map-dark.webp`.
- Accent only inside content: blue-500 map marker, `#62dbbe` "last played", one yellow-600 border on a stamps tile. Chips are neutral-200 pills, hover `oklch(0.9 0 0)`, active neutral-300.
- No grain, no gradients on surfaces; shadows only on floating things (popover `0 16px 40px rgba(0,0,0,.14)`, photo cards a 3-layer `0 0 0 1px / 0 2px 4px / 0 14px 28px -8px`).

## 5. Motion inventory (all vanilla CSS transitions + custom props; no GSAP/Framer/Lenis, no scroll-driven CSS, no View Transitions)
1. **Intro stagger** — see §2.
2. **Map tile idle loop** — `cloud` 120s linear (blurred cloud PNG tours four corners via top/left), `plane` + `plane-shadow` 30s linear with 5s delay (plane at 30° flies up-right in the first 40% then parks offscreen), `marker` 4s ease-out (blue dot scales 1→6 and fades by 35%: sonar ping), `marker-ring` 4s (white ring breathes 1.1→1→1.1 with per-keyframe timing functions).
3. **Music tile** — last.fm "last played" via `/api/lastfm` with pulse skeleton; album art blurred as background (`-inset-8 blur-md`) under two tint layers; a `disc.webp` vinyl `animate-spin [animation-duration:4s]` peeks out behind the cover and slides 4px further out on hover (`group-hover:-left-7`, `transition-[left] 200ms ease-out`); three `.eq-bar`s run `playing` (height 3→12→3px) at 0.85s / 1.26s / 0.62s so they never sync.
4. **Chips** — the pill is a `before:` pseudo so only it animates: `transition-[background-color,scale] 150ms ease-out`, hover bg `oklch(0.9 0 0)`, `active:scale-[0.98]`.
5. **Shared morphing popover** on X / GitHub / LinkedIn chips — one `[data-popover]` box transitions `opacity, transform, filter, left, width, height` 200ms `cubic-bezier(.23,1,.32,1)` from `blur(6px) translateY(10px) scale(.96)` to rest; panels crossfade (opacity + blur). JS snaps size with `transition:none` on a cold open and morphs only when switching between chips; 75ms close delay, opens on `focus` too. Panels: X follower card, GitHub 12×5 contribution grid ("1,017 contributions in 2025"), LinkedIn = a meme GIF.
6. **Copy-email glyph morph** — SVG of two rects (back sheet masked by the front sheet to make the notch) + a tick with `pathLength=1`. On `[data-copied]`: front sheet grows 13px/rx3.75 → 16px/rx8 (becomes a circle), back sheet fades 80ms, tick draws `stroke-dashoffset 1→0` over 220ms `cubic-bezier(.22,1,.36,1)` after 130ms. Morph easing `--copy-spring` is a 41-point `linear(0, .0251, .0859 … 1)` curve (fallback `cubic-bezier(.32,.72,0,1)`), duration `--copy-morph: .34s`, 70ms delay on return. Hover nudges the back sheet `translate: 2px 0`. Resets after 1500ms, announces via `aria-live`, falls back to `mailto:`.
7. **"Texas" → photo stack → gallery → photo** (austin.astro, a 4-state machine `hidden/stack/gallery/photo` on a fixed layer):
   - Hover (mouse only): 5 white-bordered 2:3 cards fan out above the word (`{x:0,r:-1.5}`, `{x:-32,r:-9}`, `{x:32,r:8}`, two hidden), 350ms move / 200ms fade, delays 0/45/90ms. Hovering the fan spreads it (`x×1.4, r×1.3, lift −3`); pressing scales the group .97. Leave → 120ms grace, 150ms exit. Scroll closes it.
   - Click: backdrop `#fafafa` @ 98% fades 350ms, cards fly to a 3+2 grid (2+2+1 mobile) with `--ease-drawer: cubic-bezier(.32,.72,0,1)` 550ms, delay `order × 35ms`, each landing with its own tiny jitter (±4% offset, −4…3.5°).
   - Click a card: it springs to center and scales to fit using a **runtime spring→`linear()` generator** (`response .34, bounce .15, 500ms`; 48 samples of a damped oscillator; bounce is reduced for short travel so near cards don't overshoot). Rotation un-tilts on a separate 400ms spring. The `<img>` is counter-scaled so the 4px white frame stays ~3px and the radius stays `22px − pad` at any zoom. Other cards blur 6px / opacity .3 with a **distance ripple**: delay = `hypot(dx,dy) × 0.07ms` capped 90ms; on the way back `× 0.04` capped 40ms. Caption slides up 450ms after 160ms. Esc (two levels), focus trap, `role=dialog`, `aria-expanded`, `will-change` only while open, `requestIdleCallback` image preload, every transition zeroed under reduced motion.
8. **Theme toggle** — one SVG: a circle (`r`) with 8 ray lines; moon is the same circle masked by a `mask-circle` whose `cx/cy` slide; `.dark` rotates the svg 40°→90°. All on `.75s cubic-bezier(.2,1.3,.4,1)` (deliberate overshoot), rays fade .5s; `data-ready` is set after two rAFs so the first paint doesn't animate.
9. **Bento tiles: no hover state at all** (verified before/after screenshots identical). They are muted `<video loop>` only.
10. Focus rings everywhere (2px, offset 2–3px; sky `#38bdf8` inside the gallery); the Texas trigger enlarges its hit area with `after:-inset-y-2`.
11. **Last-visitor** — `/api/locate` pings your city at idle so the *next* visitor's footer reads "Last visit from Rosario, AR".

## 6. Sound
**None found.** 0 `<audio>` tags, no `AudioContext`/Howler, no mp3/wav/ogg requests; all 35 videos are `muted`. The music tile is a last.fm readout, not playback.

## 7. Navigation & wayfinding
None. No nav, sections, index, command palette, progress or shortcuts. Only Esc/Tab inside the photo dialog. Wayfinding is "scroll the wall"; most tiles have no label, so you cannot tell a shipped product from a sketch. Console prints ASCII art + "open source at …".

## 8. Signature moments
1. Hovering the word "Texas" fans out polaroids; clicking explodes them into a spring-animated gallery with distance-based ripple blur.
2. The copy-email glyph morphing into a drawn check on a hand-sampled `linear()` spring.
3. A completely silent wall of 35 looping craft clips: the micro-interactions *are* the content.

## 9. Steal list (for Tomas)
1. **Nouns as physical objects.** "Rosario" in the readme → hover fans 3–5 photo cards above the word (fixed layer, `translate/rotate` per card, 350ms, 45ms stagger); click → fullscreen gallery dialog. Same machine for "Dex": hover fans the routing diagram, click opens the case study artifact.
2. **Runtime spring → `linear()` generator** (~20 lines: sample a damped oscillator 48×, `CSS.supports('transition-timing-function','linear(0,1)')` fallback). Use it for A2UI surfaces composing in and the slideover console; scale bounce by travel distance like `Bt()` does so short moves don't wobble.
3. **Distance-ripple stagger with sound.** When one A2UI card expands, every other card gets `delay = hypot(dx,dy)×0.07ms` (cap 90ms), blur 6px, opacity .3. Fire one short tick per card at its delay with pitch rising by distance: the visual wave becomes an audible arpeggio. This is the single best place to put the sound he wants.
4. **One shared morphing popover** for inline links: a single box transitions `left/width/height` between panels (200ms `cubic-bezier(.23,1,.32,1)`, blur 6→0, y 10→0, scale .96→1; snap on cold open). Readme mentions of Dex / Mint / Flagship show a mini stat card; "open source" shows a contribution grid.
5. **Icon-state morph for every copy/confirm action** — copy glyph → circle → tick via `stroke-dashoffset` with `pathLength=1`, exact timings .34s / 70ms / 220ms+130ms. Pair with a two-note click (low on morph, high on tick completion).
6. **Idle "alive" tiles in pure CSS** for the `now` section: Rosario map with 4s sonar marker, 30s plane with offset shadow, 120s cloud drift; or a Dex tile where a request packet travels the routing graph every 30s. Zero JS, `motion-reduce:animate-none`.
7. **Intro stagger with memory** — 0.3s fade-up, 50ms steps, `html.skip-intro` on back/forward or same-origin referrer so Astro page hops don't replay the entrance.
8. **Live micro-data in the chrome**: "Last A2UI question asked from {city}" (locate on idle, show previous visitor) and quota-remaining, with out-of-phase eq bars (0.85/1.26/0.62s) as the "agent alive" indicator.

## 10. Anti-patterns
- 35 autoplaying videos as the whole portfolio: heavy, mobile-hostile, and *recordings* of interactions rather than interactions. Tomas's centerpiece is live generated UI; recordings would be a step backwards.
- No navigation, no labels, no hierarchy: unusable with 9 sections of content.
- Zero hover feedback on tiles and system-ui type: the surface has no voice; all personality is pushed into three Easter eggs.
- Light/dark via duplicated assets (map, videos) doubles production work.
- Meme GIF popover is charming for him, off-brand for a "Fullstack · AI systems" pitch.

## 11. Verdict
Direction: **"annotated readme with physical artifacts."** Keep Tomas's warm paper, hairlines and numbered rail, but make the nouns in his readme behave like Harsh's "Texas": things you hover to fan out and click to spring open, every state change on a computed spring and, unlike here, every spring paired with a sound. Take the interaction engineering (spring `linear()`, ripple stagger, morphing popover, icon morph, state-machine layer with real a11y), leave the layout (video wall, no nav, system font).

**DNA score: 6/10** — high for mechanics, low for structure.

Screenshots: `/private/tmp/claude-501/-Users-User-Tomi-personal-site/4eaded3e-1177-425c-a93e-76495f249faf/scratchpad/research/harshsingh/` (viewport.png, seg-00…07.png, full.png, mobile.png) and interaction states in `…/harshsingh/states/` (01-texas-hover, 02-texas-gallery, 03-texas-photo, 04-popover-x/github/linkedin, 05/06-copy, 07/08-card hover, 09–11 theme toggle, 12-dark-top, 13-map-card). Source extracts: `inline.css`, `inline.js`, `austin.js`, `body-stripped.html`.
