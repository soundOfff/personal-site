# imdaryl.com — research report

## 1. Identity
Daryl Patigas, founding designer at Lottielab (born Cebu, lives London). Concept: the portfolio is an architect's drafting-sheet set (Sheet 01–05, numbered figures, pixel rulers, title block with revision register) that plots itself as a blueprint before the real page is revealed. React + react-router SPA, one 507 KB bundle, no animation library.

## 2. Layout & structure
Single 7,872 px page, 1060 px column ("Column 1060 · Scale 1:1" guide with crosshairs under the nav). Chrome: 19 px pixel rulers top/left; left sheet rail with ticks 01–05 (`.sheetmark.on` turns accent); right-edge minimap that is an `<iframe src="/?map">` of the page itself at scale 0.061 with a section tag (INTRO / CHANGELOG / HOBBIES / CONTACT). Sections alternate surface, not theme: Identity (white) → 3×3 full-bleed video reel → Changelog (`.dark` re-assigns the vars) → Experiments (edge-to-edge justified video wall) → polaroids scattered on a dot grid → Contact on blueprint blue with visitor map, ticket stub, title block. Hand-written margin notes (`.tnote.pin`, −1.6°, sketch arrows) live in the gutters. Reveal: `.rise` stagger (opacity 0→1, translateY 10→0, .7s cubic-bezier(.2,.7,.2,1), delays 0/.04/.08/.14/.22/.30/.36s) that starts only after the plotter finishes.

## 3. Typography
Plus Jakarta Sans (body 17.5px/1.6; h1 `clamp(38px,6.2vw,58px)` 700, −.045em, surname `.sur` at 400 in faint grey). JetBrains Mono for every label: 9.5px uppercase .1em kickers ("SHEET 02 · ASSEMBLY ORDER"), 11px "Fig 0.2 · …" captions, 8.5px ruler numerals, tabular-nums. Architects Daughter for margin notes (14.5px); Caveat on the stub and polaroid captions. DM Sans also loads (guess: the canvas-rendered stub PNG).

## 4. Color & surface
`--bg #FFF · --sunk #F6F7F9 · --elev #F1F3F6 · --ink #0A0C10 · --mid #565B64 · --faint #8B909A · --ac #2E6FFF · --ac2 #5B8CFF · --line rgba(16,20,28,.1) · --grid rgba(16,20,28,.022)`. Dark section `--bg #0A0C10 --panel #0E1116 --ink #F4F6FA --ac #5B8CFF`; blue sheet #2E6FFF with white ink. `color-scheme: light` only, no toggle. Texture is procedural: a `#graphite` SVG filter (feTurbulence .7 + feDisplacementMap scale 1.8) on rules, leaders and sketches so hairlines wobble like pencil; `--worn` noise as `border-image` on the title block; hatched placeholders; 6px conic dither for empty slots. Three soft shadow tiers.

## 5. Motion inventory
- **Blueprint plotter (loader).** `html.plotting.plotlock` blocks wheel/touch/arrow keys, cursor:progress. A `setting-out` pass measures real DOM rects, then draws them on a blue layer: `bpgrid` fade, `bprule`/`bpacross` clip-path wipes, `bpmeasure` (dimension width animates full→`--w`), `bplabel`/`bpletter` per-glyph fades, hatched blocks; then `.wiping`: a 3px cyan→white→pink `.plotline` sweeps down while the blue layer is clipped `inset(var(--y) 0 0 0)`, revealing the real page line by line; a `.plotpct` % tag follows the cursor. Timing 560ms + 110ms/part + 340ms, letters 320ms apart; easings `cubic-bezier(.22,.8,.24,1)` draw, `(.4,0,.2,1)` settle. Skipped under reduced motion.
- **Rulers.** `.rmark` tracks cursor x/y (`--x`, .12s); `.rsel` highlights the hovered element's extent on both rulers (`--sx/--sw`, .14s).
- **Canvas hover inspector (`.ctrail`).** A fixed canvas draws dimension ticks + width/height labels around any hovered `a, button, .chip, .tab` or media, and around text selections (`selectionchange`). Off on touch/reduced motion.
- **Geo popovers.** Dotted-underlined "Cebu/London" → black mono tip with a canvas-dithered map + DMS coords; "11,090 km from Daryl · 13 h 45 by air" is haversine from the visitor's IP location. Nav shows live London time + open-meteo temperature.
- **Reel.** Numbered `shotload` placeholders with a 1.6s `shotSweep` shimmer until video is ready; hover darkens 6%.
- **Changelog editor.** Lottie-style timeline: draggable year ruler (`setPointerCapture`), diamond keyframes (`.kf` 13px rotated square; hover scale 1.12, `.hit` accent + 4px glow ring, .16s), band clips, playhead date digits entering via `digitin` (blur 4px + translateY .45em, .36s) and `glyphswap` (scale .55 + blur .26s); play autoplays five years; craft tabs with a sliding outline pill (`.slidepill:before` translate .32s); row peek tips `top .28s cubic-bezier(.3,.7,.2,1)`.
- **Sort/filter = View Transitions.** `startViewTransition(() => flushSync(set))`; `::view-transition-group(*) .42s cubic-bezier(.3,.7,.2,1)`; entering `rowin` (blur 6→0, +8px, .36s), leaving `rowout` (blur 6, −6px, .28s); `html.vt-list` suppresses the root crossfade. Project links use react-router `viewTransition` with `sheetoff/sheeton` (±12/16px + 4px blur).
- **Experiments wall.** Hover reveals an "on X ↗" tag (opacity + 3px translate, .14s).
- **Polaroids.** Random rotation on grain; hover fires `polaglint` gloss sweep (1.1s, screen blend); draggable (`held` kills transitions); each has an `fp` spring tilting toward the cursor with a specular; touch long-press 320ms picks up and `navigator.vibrate(8)`.
- **Visitor map.** Dot-matrix world, last-visitor `visitpulse` ring (2.4s infinite), device/country bars, ALL TIME / 24 H toggle.
- **Ticket stub.** Closed-form underdamped spring (k=237.6, ζ=7.5, ω=13.47 rad/s, θ=10°·x, |x|≤1.8); `foil` layer (mix-blend screen, conic+linear gradients driven by `--ang/--mx/--my/--lit`); light critically damped (T .4s held / .8s home); follows 120px past the edge before release. A live SVG "draft" beneath plots aim, state, spring line and numeric readouts (θx, θy, ẋ, held/let go) on hover-capable ≥1100px. "Claim stub" renders a PNG on canvas and downloads it; counter via `/api/visit.php?claim`.
- **Minimap.** Fades in on scroll (.28s); thumb recolours by the section under it (`on-dark`/`on-blue` via `elementsFromPoint`); drag scrolls instantly, click jumps smooth; tag swaps with `glyph.swap`.
- Misc: life-in-years strip (9px cells, hover scale 1.35); status dot `ping` 2.6s; `.btn` white→#e5edff gradient with inset accent ring, `:active` brightness .97 at 60ms; chips .12s; dominant easings `cubic-bezier(.3,.7,.2,1)` ×19 and `(.2,.7,.2,1)` ×13, one overshoot `(.22,1.4,.36,1)`; hover durations .12–.16s. No CSS scroll-driven animations; scroll coupling is rAF.

## 6. Sound
Yes, entirely synthesized, zero audio files. Five one-shot clicks `{soft 1750Hz/30ms/gain .05, sharp 2600/28ms/.065, step 3100/16ms/.035, hover 4200/11ms/.014, graze 5200/9ms/.016}`: each is a 6ms white-noise burst through a bandpass (Q 1.2) at the pitch plus a triangle oscillator gliding f→0.6f over the decay, 2ms attack, exponential release. Mapping: links/buttons click "soft", hover "hover"; timeline keyframes/clips click "sharp", hover "graze"; the minimap thumb crossing a section plays "step". A scrub drone: looped brown noise (bandpass 300Hz Q 1.4) + 90Hz sawtooth (lowpass 260Hz), gains ∝ (v/1800 px/s)^1.4, bandpass sweeps 280→1780Hz and tone 88→158Hz with velocity, auto-mutes 110ms after movement stops; used while dragging the minimap and scrubbing the timeline. AudioContext created lazily on first gesture, suppressed under `prefers-reduced-motion`. Haptic: `vibrate(8)` on touch pick-up. No mute toggle anywhere.

## 7. Navigation & wayfinding
No menu: logo, clock+weather, Email, X. Wayfinding is instrumentation: rail ticks 01–05, live minimap with section tag, rulers showing page-px under the cursor, "Sheet NN · name" kickers, "Fig 0.n" captions, a title block ("SHEET 05 of 5 · CHECKED BY whoever reads this far") and revision table P1–P4. No command palette or keyboard shortcuts. Project pages share the chrome, open with a view transition, "← All work" back.

## 8. Signature moments
1. The page drafting itself as a blueprint from its own measured DOM, then wiped away by a plotter head.
2. The personalised ticket stub (your city, OS, time, visit number) tilting on a documented spring, with the equations and live readouts printed on the sheet beneath it.
3. The changelog as a scrubbable animation timeline with a velocity drone and mechanical clicks on every keyframe.

## 9. Steal list (for Tomas)
1. **Synth click palette.** Port the 5-sound engine (noise burst + triangle glide, ~60 lines, no assets); map by element: rail numbers "step", playground Send "sharp", links "soft", index-row hover "graze"; lazy AudioContext, reduced-motion gate, plus a visible mute.
2. **Streaming drone for A2UI.** Reuse the velocity drone but drive gain/bandpass from tokens-per-second while a surface streams, snapping to a "sharp" click when the component commits; 110ms release on pause.
3. **Plotter-compose for generated UI.** Instead of fading surfaces in, measure each A2UI component, draw its wireframe first (amber hairline box, mono tag `CARD 01`, `323 × 52`), then clip-path wipe `inset(var(--y) 0 0 0)` to the filled component. Same keyframes (`bprule`, `bpmeasure`, `bpletter`) in his paper/amber palette; it makes "the agent draws UI" legible.
4. **Rail ticks + live minimap.** Keep 00–08, add `.sheetmark` ticks that light amber and a right-edge `<iframe src="/?map">` thumbnail whose thumb recolours per section via `elementsFromPoint`; label swaps with the `glyphswap` blur.
5. **View-Transition list reorder** for the work index / open-source filters: `startViewTransition` + per-row `view-transition-name`, `rowin/rowout` with 6px blur, `.vt-list` to suppress the root crossfade.
6. **Visitor geo micro-moment.** Dotted-underline "Rosario" opens a canvas-dithered map tip; nav shows "X km from Rosario · N h by air" from IP haversine. Cheap and personal.
7. **Claimable souvenir.** A stub "No. 14,302 · from <city> · on <OS>" rendered to PNG via canvas, spring tilt + foil specular, the spring maths printed underneath in JetBrains Mono. Fits an "AI systems" engineer better than a CTA.
8. **Graphite filter on hairlines.** One SVG `feTurbulence + feDisplacementMap(scale 1.8)` on his existing hairline rules and Newsreader margin notes turns the paper system into a drafting sheet without touching the palette.

## 10. Anti-patterns
- A ~7s forced, scroll-locked loader on every visit, plus a Chrome-only gate ("Drawn for Chrome, for now") that blocks Safari. Run the plotter once (sessionStorage), never lock scroll, never gate browsers.
- 33 autoplaying videos and a 507 KB bundle; nothing is visible until JS and fonts settle.
- Sound with no mute control, and audio tied to the reduced-*motion* preference.
- Five instruments at once (rulers + rail + minimap + margin notes + hover inspector) compete with the work. Pick two.
- Identical "IN THE WORKS" pills on every row and placeholder copy ("[what you owned, be specific]") on the live project page carry no information.
- 8.5–9.5px mono labels sit below comfortable legibility.

## 11. Verdict
Direction: "instrument panel / working drawing": treat the portfolio as an annotated schematic of the systems Tomas builds, where generated A2UI surfaces draft themselves before filling and every control has a small synthesized mechanical voice. Take the sound engine, plotter-compose, rail+minimap, view-transition lists and one physics souvenir; leave the blueprint-blue palette, the forced loader and the video wall. Score: **7/10** of this site's DNA belongs in one variant.

Screenshots: `/private/tmp/claude-501/-Users-User-Tomi-personal-site/4eaded3e-1177-425c-a93e-76495f249faf/scratchpad/research/imdaryl/` (viewport, seg-00..07, full, mobile); interaction states in `states/` (loader-*, after-load-top, geo-hover, editor-idle, kf-hover, scrub-drag, sort-mid, xwall-hover, pola-drag, stub-hover, stub-letgo, minimap-drag, cursor-trail, contact-top, footer-bottom, work-top, work-mid); bundles in `bundles/`; subpage harness in `work-feature-design/`.
