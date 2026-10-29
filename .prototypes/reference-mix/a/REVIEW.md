# Review of prototype A, "Flood fill"

Reviewed 2026-10-28 by driving it in Python Playwright 1.58 (headless Chromium) at 1440x900 (DPR 2) and 390x844 (DPR 3, touch), against http://127.0.0.1:4321/a/index.html. Evidence paths are relative to `a/`. Every check is a script in `review/scripts/`. Run one with `cd review/scripts && python3 c1_cover.py desktop`. `c2_contrast.py` also needs Pillow.

Console errors across every run: zero. Horizontal overflow at 390px: none on `#/`, `#/blog`, a post, two work pages, or not found.

## Findings, blocking first

### 1. Blocking. The ✳ docks into a header that has already hidden itself

The header gets the `hidden` class at 150px of scroll. The flight target is read from `.brand-star.getBoundingClientRect()`, which includes the `translate`. So the glyph flies to y=-25 on desktop and y=-50 on mobile, off the top of the screen. Nobody ever sees it land.

- Evidence. `review/desktop-scrub-0900.png` shows no header and no ✳. The `c1_cover.py` log shows header `hidden` from y=150 and glyph center `[585, -25]` at y=900 (desktop), `[122, -50]` at y=850 (mobile). Video in `review/desktop-cover-scrub.webm`.
- The landing would also be a swap of two different shapes. `.dock-glyph` is the 7x7 pixel sigil at 21px, and the header holds the text character `✳` at 27px. Both stay visible at once.
- Fix in `app.js` `updateScroll()`. Never add `hidden` while `currentRoute.name === 'home' && scrollPosition < innerHeight` (the sticky range of the 200svh cover).
- Fix in `app.js` boot. Render the header ✳ as the same glyph with `document.querySelector('.brand-star').innerHTML = P.sigil('brand', true)`, and add `.brand-star svg { width: 21px; height: 21px }` to `style.css`.
- Fix in `app.js` `initCover().scroll()`. Take the end size and position from that svg's rect. Set `.brand-star` opacity to 0 while `0 < flight < 1`, then hide `.dock-glyph` and show `.brand-star` at `flight >= 1`, so exactly one ✳ is visible at any moment.

### 2. Blocking. The cells never become the ✳. A large blob sits beside it

The drain is `Math.pow(1 - scrub, 1.3)` and only reaches zero at scrub 1 (900px). The glyph is a separate SVG that fades in at scrub 0.48, 140px wide, while hundreds of cells are still painted.

- Evidence. At 700px, 169 cells remain in a 380x420px blob (x 600 to 980, y 280 to 700) next to a 72px glyph at (655, 190). See `review/desktop-scrub-0700.png`. At 500px the glyph overlaps a 799-cell field, as `review/desktop-scrub-0500.png` shows.
- The amber path does not drain. Its squares are drawn regardless of `cut`, so they float on blank paper after the cave is gone, as `review/desktop-scrub-0900.png` shows.
- Fix in `app.js` `initCover().render()`. Finish the drain by scrub 0.45 (`drain = clamp(1 - scrub / 0.45)`).
- From scrub 0.30 to 0.55, take the 21 cells nearest the seed (`g.order.slice(0, 21)`, the last ones to drain). Ease each from its own cell to its slot in `P.glyph`, centered on the seed cell at the 20px cell size, so the glyph is 140px. Draw them in cobalt on the canvas.
- At 0.55 the canvas glyph matches `.dock-glyph` pixel for pixel. Show the DOM glyph at full opacity with no fade, stop drawing it on the canvas, and fly it over `flight = clamp((scrub - 0.55) / 0.45)`.
- Start `.dock-glyph` at the seed cell center (`rect.left + (g.seed % g.cols + 0.5) * g.cell`), not at `innerWidth * 0.52` and `stage.clientHeight * 0.53`. That way it also follows an R or click re-seed.
- Fix in `pixels.js` `draw()`. Skip path squares where `g.dist[i] > cut`.

### 3. High. The headline loses its paper during the scrub, and the paper boxes cut the cave

The reported problem is half right. At rest, both viewports put each `.hero-line` on a paper box. Only 0.2 to 1.1% of the ink overlaps cells, which is the italic ascenders and descenders poking past the box at 1.57 to 1.65:1 contrast. What fails is everything around that state:

- During the scrub the boxes fade along with the text. At 250px, 30% (1440), 65% (1280), 66% (1920), 42% (390) and 35% (375x667) of the headline ink sits over cells. The fading boxes show as frosted rectangles. See `review/contrast-desktop-1440-scroll250.png`.
- The boxes are not cell-aligned. They cut cobalt cells into partial cells at their edges, as at the right edge of "useful." in `review/desktop-cover-rest.png`.
- During the intro, the boxes are present but the words are not yet. The flood gets clipped into straight vertical cuts with a 2px sliver at x=778. See `shots/desktop-motion-01-cover-0300ms.png`.
- Fix in `pixels.js`. Add `mask: Uint8Array` to the grid shape. `grid(width, height, seed, cell, rects = [])` marks every cell under each rect, grown by one cell on every side, after the smoothing passes. BFS still walks masked cells, so the flood and the amber path pass under the text and come out the other side with timing intact and no cut-off rooms. `draw()` skips masked cells (they stay paper) and skips path squares on them, and `nearest()` skips them so the seed never sits under text.
- Fix in `app.js` `initCover().resize()`. After `document.fonts.ready`, pass the rects of each `.hero-line`, `.hero-kicker`, `.hero-summary`, `.hero-controls` and `.cover-index`, relative to `.cover-sticky`. The ResizeObserver already rebuilds the grid.
- Fix in `style.css`. Remove `background: var(--paper)` from `.hero-line`, and from the other hero boxes once the mask covers them. Text then fades over paper.

### 4. High. The header comes back at the end of every downward flick

`updateScroll()` calls `header.classList.toggle('hidden', ... && delta > 3 && ...)`. Any scroll frame that moves 3px or less removes `hidden`. Trackpad and wheel momentum always ends in small deltas, so the pill drops back in while the visitor is still scrolling down.

- Evidence from `review/scripts/c10_momentum.py`, three decelerating flicks of 80 down to 1px: hidden from 70px down to 6px, then shown again at 3px, every flick.
- Fix in `app.js` `updateScroll()`. Add `hidden` when `delta > 3 && scrollPosition > 120`, remove it only when `delta < -3 || scrollPosition < 100`, and leave it alone otherwise.

### 5. High. The headline never fades word by word

`.cover.playing .hero-word` runs `word-in` with fill mode `both`. A filling CSS animation overrides inline styles, so the per-word `word.style.opacity` in `scroll()` has no effect. Only `.hero-layout` fades, as one block.

- Evidence. Computed opacity of all three words stays 1 at every 50px step from 50 to 1100px (`c1_cover.py`, desktop and mobile).
- Fix in `style.css`. Change the animation to `animation: word-in 0.65s var(--ease) backwards`, which keeps the delay state and drops the fill afterwards.
- Fix in `app.js` `scroll()`. Stop fading the whole `.hero-layout` (fade only the kicker) so the word schedule shows.

### 6. High. On touch the amber path is out of reach

`click()` re-seeds whenever the tapped cell is open, and most of the screen is open. A tap wipes the cave and restarts the flood (progress 0.2 at 250ms, path length 0). Tapping paper gives a 3-cell path to the nearest floor. The brief says a tap sets the target. The hint text says "Tap or press R to restart", which describes the bug.

- Evidence. `review/mobile-tap-open-250ms.png`, `review/mobile-tap-wall.png`, `c4b.py`.
- Fix in `app.js` `initCover()`. Record `e.pointerType` on `pointerdown`. In `click()`, call `move(e)` for touch, and keep the re-seed for mouse clicks and R. Give touch a re-seed gesture, such as a double tap.
- Fix the hint by pointer type. Touch gets "Tap to trace a path. Double-tap to restart." Fine pointers get "Move to explore. Click or press R to restart."

### 7. Medium. Re-seeding with a click or R erases the headline

`replay(index)` also restarts the word animation, so every exploratory click on the cave shrinks the headline to `scale(0.015)` and regrows it.

- Evidence. Word transform `matrix(0.015, ...)` 150ms after R, with focus in the nav or anywhere else. See `review/desktop-click-reseed-250ms.png`, where the headline is gone.
- Fix in `app.js` `initCover()`. Split it in two. `reseed(index)` runs BFS, restarts the flood and clears the path, and it is what R and click call. `replay()` also restarts the words, and only the ✳ and the home mount call it.

### 8. Medium. The difference-blend header turns into a yellow pill over cobalt

`#header.on-blue` blends a white background with `difference`. Over `#0024cc` that computes to `#ffdb33`, which reads as the amber the brief reserves for the shortest path. The band's dithered edge shows through as a black and yellow checker.

- Evidence. `review/desktop-nav-on-blue.png`.
- Fix in `style.css`. Replace the block with explicit cobalt-mode tokens: `background: var(--blue)`, `color: var(--paper)`, a border of paper at 40%, and `.resume` in paper with cobalt text. Keep `difference` only for overlays on photographic media, where it reads as an inversion.

### 9. Medium. Generated cover titles split into yellow and black

`.generated-title` uses `mix-blend-mode: difference` in paper. It comes out yellow over cobalt and near-black over paper, mid-word.

- Evidence. "Mint Mobi" is yellow and "le" is black in `review/desktop-index-grid.png`.
- Fix in `style.css`. Drop the blend and set the title in ink.
- Fix in `app.js` `drawStaticCanvases()`. Pass the title's rect to `P.grid` as a mask (the same mechanism as finding 3), so the title sits in a paper clearing of its own cave.

### 10. Medium. Reading progress never reaches the end and shows on posts with no body

The formula divides by `body.offsetHeight + innerHeight`. It reads 67% (desktop) and 44.5% (mobile) at the bottom of the page, starts at 2.7%, and shows 22.8% at the top of a post that has no body. The width is continuous, so the last cell is cut mid-cell.

- Evidence. `c7_blog.py` output. The bar itself renders (`review/desktop-post-progress-mid.png`).
- Fix in `app.js` `updateScroll()`. Compute `top = body.getBoundingClientRect().top + scrollY` and `p = clamp((scrollY - top + 100) / (body.offsetHeight - innerHeight + 100))`, then set the width to `Math.round(p * Math.floor(innerWidth / 15)) * 15 + 'px'`.
- Set the width to 0 when the post has no `bodyHtml`.

### 11. Medium. The reading column is 76 characters wide

`.reading { max-width: 65ch }` measures with Newsreader's wide `0`. The real line is 773px, about 76 characters at 21px. The brief asks for 60 to 70.

- Evidence. `c7_blog.py` gives `charsPerLine: 76` on desktop and 37 on mobile.
- Fix in `style.css`. Use `.reading { max-width: 32em }` (about 66 characters) and drop the `65ch` cap on `.reading p, .reading li`.

### 12. Low. The re-bloom at the top happens but barely reads

It fires on desktop and mobile. The ripple runs 0.11 to 1.0 over 17 draws, about 600ms. But it is a flat light-cobalt band two cells wide, moving over a cave that the reverse scrub has already refilled, and it reads as a shimmer, not a bloom (`review/desktop-rebloom-120ms.png`, `review/desktop-rebloom-370ms.png`). It also fires on top of the ✳ replay: the ripple is at 0.38 while the intro is at 0.19, 200ms after the click.

- Fix in `app.js` `scroll()`. Arm it only after the visitor passed scrub 0.9, and fire it at `scrub < 0.01`.
- Fix in `pixels.js` `draw()`. Make the ring a 3-cell band that shifts each cell one tone through the dither patterns, instead of a flat `tone = 2`.
- Reset `rippleStart` in `replay()`.
- With findings 1 and 2 fixed, the reversed scrub un-docks the ✳ back into the seed on the way up. That flight plus this ring is the return moment.

### 13. Low. The idle cover repaints 30 times a second for an image that changes every 680ms

`frame()` loops forever and renders whenever 30ms have passed. In a 3-second idle window that is 91 full-canvas draws (measured). Only about 5 of them can differ, because the flip epoch is `tick / 4`, or 680ms (inferred from the code).

- Measured over three 3-second runs, headless Chromium with software raster. Frame times are fine (median 16.7ms, p95 17.0ms). The main thread is 48 to 52% busy on desktop and 21 to 24% on mobile while JS is 1.2%. The limit is rasterizing the 2880x1800 backing store each draw: busy time scales with canvas pixels (5.2M vs 3.0M) and not with script. A GPU-backed Mac pays less per draw, but the redundant count is the same. It costs battery and fan noise, not jank.
- Loops do stop when offscreen. Zero app rAF calls in #index, the footer and a post.
- Fix in `app.js` `frame()`. Render only while the intro or ripple runs, when the path changes, or when `Math.floor(now / 680)` changes. Drop the 30ms throttle during the intro so the flood runs at display rate on 120Hz screens.

### 14. Polish. Hidden header sliver and footer rings

- `#header.hidden` uses `translate: 0 -130%`, which leaves its bottom edge at y=3, a thin arc visible in `review/desktop-scrub-0500.png`. Use `translate: 0 calc(-100% - 24px)`.
- `initFooter()` `ripple()` re-runs BFS and resets `start` on every `pointermove`, so a moving cursor keeps restarting the ring and shows little (`review/desktop-footer-ripple.png`). Start a new ring only once the current one passes 60%, or on `pointerdown`.

### 15. Polish. The words grow from text, not from a pixel seed, and the route wave is flat

- `word-in` scales the italic word up from 0.015. The brief's cobalt pixel seed never appears. Add a `::before` 8px cobalt square at each word's `transform-origin`, visible for the first 120ms of its animation.
- The route wave is a solid cobalt Manhattan diamond (`review/desktop-route-click-150ms.png`). A two-cell leading edge stepping light, dither, cobalt would tie it to the cave's tones.

## Keep (do not regress)

- Intro timing. The flood fills in about 1.2s, the words land between 475 and 1092ms, and the nav enters last (925 to 1242ms).
- The amber path follows real BFS parents, reads clearly as a dotted line (`review/desktop-path-hover.png`), and costs 0.4ms median and 1.0ms max per pointermove, one event per frame. It feels instant.
- Route wave. It starts at the click point (covered at 76ms), swaps under full cover at 392ms and uncovers outward by 676ms. Back and forward start from the center. Focus moves to `main`, scroll resets to 0, and no long animation frames were recorded.
- The ✳ click replays the intro, from deep in home (jump to 0, flood restarts) and from other routes (wave home, then intro).
- Reduced motion shows the final state at first paint (all words at opacity 1, all 1659 cells), never hides the header, and swaps routes instantly.
- Nav. Opacity-only `( Journal )` parentheses, section tracking for Work, Index and Contact, and a 62px mobile header.
- Cards. Cobalt border, 4px halo at 8%, radius 4 to 8px, screenshot scrub with a 0.12 lerp and a `1 / 4` counter, generated covers for all 7 imageless projects, and correct filter counts (2, 5, 4 and 2).
- Journal. Chips, live title search, an empty state with the pixel ✳, 11 distinct sigils, date and reading time on every card, and a 56px mobile chip bar.
- Posts. The TOC closes on Escape and returns focus to its summary. Both copy buttons show "Copied ✓", write the absolute URL or address, announce it, and restore the label after 2.5s.
- Keyboard. Every control is reachable with a visible 3px focus ring, and none ends up hidden or under the header once scrolling settles.
- The work detail hero, a quiet cave behind the cobalt band (`review/desktop-work-detail.png`).

## Design judgment

The first load delivers. A site for an ICPC finalist that floods its cover by breadth-first search and draws the shortest path to your cursor is the most personal idea of the three directions, and it already feels instant. The return to the top and the handoff into the page do not deliver yet. The ✳ docks into a header that has hidden itself, next to a leftover blob, so the transition reads as the cave draining away rather than the cave becoming the brand. It becomes delightful when the last 21 cells visibly assemble into the ✳, click into the wordmark, and fall back into the seed on the way up, with the flood and path running under the headline instead of around paper stickers.
