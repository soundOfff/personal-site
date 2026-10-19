# nerdy.dev (Adam Argyle) — inspiration report

## 1. Identity
Adam Argyle: CSSWG alum, ex-Google Chrome DevRel, now Shopify; creator of Open Props and VisBug. A personal feed of 480 posts built on Deno Fresh + Open Props with zero animation libraries. Concept: one endless timeline faceted by three sticky rails (who / when / what), where every state change is animated with bleeding-edge native CSS.

## 2. Layout & structure
- 1440px: three sticky left rails (author avatars x≈237, Week/Month/years x≈310, topic pill list x≈410–600) and one 540px feed column of white cards (radius 1rem, `corner-shape: squircle`). Dividers "3 posts | past week" at 2.5rem, weight 900 vs 100.
- Entire archive is SSR'd: home page is 367,000px tall; filtering is client-side `display:none`.
- Sticky top nav (skull logo; theme / RSS / webring icon buttons). On scroll-down the icons blur away (`blur(5px); translate: 0 -200%`, staggered 50/100/150ms) via a `scroll-direction` attribute from a passive scroll listener.
- Footer: 100svh grid with vertical "ARGYLEINK © 2026" (`writing-mode: vertical-rl; text-orientation: upright`), socials column, Work/Tools/Slashers cards, "CSS Webring" circle with a dashed `linear-gradient(to top in oklch, indigo, orange) border-box` ring.
- Detail pages: 45rem column, fixed radial-gradient tint (blue/magenta/green at 15%), TOC rail right at ≥1280px, comments as chat bubbles. Mobile: topics become a `<select>` with `field-sizing: content`; timeline becomes a horizontal scroll-snap strip of 3rem weight-100 numerals.

## 3. Typography
No webfont: `--font-sans: system-ui`; mono stack Dank Mono / Operator Mono / … Body 1.25rem, weight 300 light / 200 dark, letter-spacing .05em; `tabular-nums` on counts; `text-wrap: balance/pretty`. Article h1 is weight 900 with `mask: url(/grunge.webp)` (distressed ink). Big drop-cap bar on article intros.

## 4. Color & surface
Open Props grays. Light: document `#e9ecef`, cards `#fff`, text `#030507`, muted `#495057`, link `#4263eb`. Dark: document `#030507` (P3 `color(display-p3 .001 .015 .03)` on HDR), cards `#16191d`, link `#91a7ff`. Multi-neon accents: `--neon-pink #ff1493`, cyan, `--neon-yellow #ffe066`, `--neon-purple-on-dark #9461fd`, green (P3 overrides); each topic icon lights in its own neon. 7-layer Open Props shadows on cards; `oklch(from …)`, `light-dark()`, `color-mix()` everywhere. No grain beyond the h1 mask.

## 5. Motion inventory (how it is built)
1. **Topic indicator pill** `<indi-cator>`: absolute white pill, `transform: translateY(calc(var(--y) * 1.5lh))`, `transition: transform .6s var(--ease-spring-2)` (a `linear()` spring). JS sets `--y` on *mouseover* of any label (hover previews the move), resets on mouseout; sibling labels dim to .5.
2. **Odometer counts** `<count-up>`: each digit is a 1lh clipped window over a vertical reel of up to 4 digits, `translate: 0 calc((1 - var(--n)) * 1lh)` with `@starting-style { translate: 0 0 }`, 1s `cubic-bezier(0,0,0,1)`, 60ms stagger per digit; separators blur in. Re-rendered via innerHTML on every filter so the roll replays.
3. **Count badges** (Timeline/Persona): speech-bubble pill (tail cut with a radial `mask`), `scale(0)` until hover/active, pops with `transform 1s var(--ease-spring-4)`, hides in .3s.
4. **Staggered entry**: avatars `@starting-style { scale: 0 }` + `transition-delay: calc(var(--sibling-index) * 50ms)`.
5. **Icon buttons**: hover → `box-shadow: 0 0 5em var(--_shadow-color)` (link/pink/cyan/green by `nth-of-type`), .5s ease-out. Share icon `rotate(-15deg) scale(1.15)` with `cubic-bezier(.5,1.25,.75,1.25)`. RSS arcs pulse 1.4s infinite. Skull logo elastic tilt + PowerGlitch glitch every 12s inside a 2% window (WAAPI `steps()` clip-path slices + `hue-rotate`).
6. **Like button** (Preact island): heart outline with liquid fill — two SVG wave paths drifting (4.5s / 7s reverse, paused until hover/pressed), fill level `--surface-y` over .55s; hover shows a 30% ghost of the next level plus pink drop-shadow glow. Click: WAAPI ring burst (scale .3→2.4, 420ms, `cubic-bezier(.16,.84,.44,1)`), 2–N particles in three tones on random angles (420–800ms), shake keyframe on the control, rAF count tween, localStorage persistence; multi-press allowed.
7. **Scroll-driven** (all `animation-timeline: view()`, gated by `@supports` + reduced-motion): post media scales to 105% over `entry 10%→80%`; divider text drops out at `95%→98%`; comment bubbles `blur(20px) scale(.8)→1` over `contain 0→cover 20%`; footer socials `scale(5)→1`; footer cards `translateY(50px)→0`; article hero `scale(.9) translateY(10vh)` fade on exit; author avatar `rotateY(306deg) scale(0)` on exit; read-time clock hands rotate 1 turn / 6 turns across `cover`; article `li`s slide in from -15px on per-item view-timelines.
8. **Scroll-spy TOC**: native `scroll-target-group: auto` + `a:target-current`, with an anchored `::after` chevron (`position-anchor: --toc-active; top: anchor(top)`) springing between items (`top/left 1s var(--ease-spring-4)`). Fallback: each h2 declares `view-timeline: --h2-N`; the TOC link's `::before` bar runs `scroll-spy` keyframes (scaleY 0→1 on entry, 1→0 on exit) against `animation-timeline: --h2-N`.
9. **View transitions**: `@view-transition { navigation: auto }`. Cards use `view-transition-name: var(--should-vt)`, toggled by scroll-driven keyframes (`toggle-vt-names`) so only on-screen cards get names. Timeline slides left/right in .1s. Lightbox: `startViewTransition` morphs the clicked `<picture>` into a dialog (`--light-box-img`, `overflow: clip`), drag-to-dismiss (pointer capture, 150px threshold, scale/opacity follow distance), proxy clone flies back.
10. **Toast**: FLIP via WAAPI (150ms) + CSS `fade-in .3s, slide-in .7s var(--ease-spring-3), fade-out`; fired by share buttons (`navigator.share` else clipboard + `Toast("Link <b>copied!</b>")`).
11. **Details**: `interpolate-size: allow-keywords` + `::details-content` `block-size 0→auto` with `content-visibility allow-discrete`.
12. Article h2 `::before`: neon-pink block running `cursor-blink 2s linear 10`, then stays lit.
13. **Empty state**: kaomoji-skull SVG with idle bob/twinkle keyframes, one of six random messages glitched on arrival; counts roll to 0, rails dim to .25.
14. Global `outline-offset` 145ms focus transition; `::scroll-marker` dots with `:target-current` on media scrollers.
Easings come from Open Props: `--ease-spring-2/3/4` are `linear()` curves, `--ease-elastic-*` overshoot beziers.

## 6. Sound
**None found.** No `<audio>`, `AudioContext`, Howler/Tone, mp3/wav/ogg requests or `navigator.vibrate` in HTML, CSS, or any of the 8 JS bundles across three pages. The only audio string is an image alt quoting a snippet from a post: `const snap = new Audio('snap.mp3'); scroller.onscrollsnapchange = () => snap.play()` — blogged, not shipped.

## 7. Navigation & wayfinding
Three radio-fieldset rails (author / time / topic); every filter recomputes every count with odometers and dims impossible options. Year labels shrink with age (`font-size: calc(max + (min - max) * var(--_age))`). `focusgroup` + arrow keys on the Timeline `pushState` the hash and scroll; `:target` highlighting; skip link; Esc closes lightbox; styled `console.log` easter egg. No command palette, cursor effects, progress bar or loader.

## 8. Signature moments
1. Hovering the topic rail: the pill springs after your cursor while every count in sight rolls like an odometer.
2. The liquid-fill heart you can mash — waves, ring, particles, shake, count tween.
3. Scroll is the animator: nav blurs away, clock hands turn, the avatar spins off, comments blur in, no JS.

## 9. STEAL LIST (for Tomas)
1. **Rail pill that follows hover**: an `<indi-cator>` behind the 00–08 rail, `translateY(calc(var(--y) * 1lh))` with `transition: transform .6s linear(spring)`; `--y` from `--sibling-index` on mouseover, snapped back to the active section on mouseout. Add a soft tick per step — nerdy has no audio, so this is free differentiation.
2. **Odometer section numbers**: render "00…08" and index counts as `count-up` reels (1lh clipped window, translated digit stack, `@starting-style`, 60ms stagger); replay by re-rendering when the active section or A2UI quota changes.
3. **Spring count badges**: speech-bubble pills (radial `mask` tail) popping from `scale(0)` with `transform 1s linear(spring)` on hover of "log", "writing" or the playground quota.
4. **Mashable reaction on A2UI answers**: liquid-fill icon (two drifting SVG waves, `--surface-y` fill) + WAAPI ring and 3-tone particles per press + rAF count tween, persisted in localStorage; give each press a rising-pitch blip.
5. **Anchor-positioned scroll-spy for case studies** (Dex/Mint/Flagship): `scroll-target-group: auto`, `a:target-current`, an amber `::after` marker with `position-anchor` + `top: anchor(top)` springing between headings, `view-timeline: --h2-N` fallback bar.
6. **Scroll-driven ornaments in the house style**: hairline rules that draw in (`scaleX` via `animation-timeline: view()`), a read-time clock whose hands rotate across `cover`, the "now" stamp rotating off on exit.
7. **Blur-away nav + `toggle-vt-names`**: hide chrome on scroll-down with staggered `translate` + `blur(5px)`; give A2UI surfaces `view-transition-name: var(--should-vt)` only while on screen so cross-document transitions stay cheap.
8. **Toast + glitch seasoning**: FLIP toast for "copied" on share; a WAAPI clip-path glitch on one word ("AI systems") on a 12s cycle inside a 2% window.

## 10. Anti-patterns
367k-pixel single page; multi-neon accents (would wreck the one-amber discipline) and `system-ui` (would discard Newsreader/Geist); three rails need ≥1024px and collapse to a `<select>` on phones; Chrome-only features (`anchor()`, `scroll-target-group`, `corner-shape`, `interpolate-size`) need fallbacks; `javascript:` hrefs for share; permanent glitch loops read as gimmick; a feed skeleton is wrong for a portfolio whose centerpiece is a conversational playground.

## 11. Verdict
Direction: "native-CSS physics" — `linear()` springs, `@starting-style` entries, scroll-driven timelines, anchor-positioned indicators, zero libraries, every count and marker alive. Tomas should lift the mechanics (hover-following rail pill, odometers, spring badges, anchored scroll-spy, mashable button) into his warm-paper world and add the sound layer this site never built. **Score: 7/10** for one variant — the "instrument panel" variant.

Screenshots: `/private/tmp/claude-501/-Users-User-Tomi-personal-site/4eaded3e-1177-425c-a93e-76495f249faf/scratchpad/research/nerdy/` (viewport, seg-00..07, full, mobile), `states/` (hover, like clicks, filter, empty state, nav hide, lightbox, dark, footer), `sub-article/` (css-scroll-axis-lock: hero, TOC rail), `sub-fieldsizing/` (note + comments). CSS: `bundles/style.pretty.css`.
