# C. Typeset. Independent review

Reviewed 2026-10-28 in headless Chromium (Playwright 1.58) against `http://127.0.0.1:4321/c/index.html`. Viewports were 1440x900 and 390x844 (touch, DPR 2), each with and without reduced motion. Motion was captured with the CDP screencast at about 60 fps and aligned to `Typeset.start`, so the frame times below are measured, not estimated. All evidence lives in `c/review/`.

Console: zero errors and zero warnings across desktop, mobile and both reduced-motion runs.

## Findings, blocking first

### 1. Blocking. Bitmap glyphs have no shared baseline and no shared cell size
Confirmed. Narrow letters render small and hang from the top of the line like superscripts. Wide letters render oversized.

Evidence. See `review/bitmap-overlay-hero-desktop.png` and `review/bitmap-overlay-404-desktop.png`, where the real text is at 28% opacity under the frozen t=0 bitmap. The same problem shows in `review/bitmap-overlay-*-mobile.png` and `review/not-found-rest-mobile.png`. Measured on the desktop hero (Geist 171px, baseline at y=343):
- Cell size runs from 4.2px on `.` and 6.4px on `I` and `l`, through 16.5px on `d`, to 22.9px on `m`. That is a 3.6x spread inside one headline.
- Bitmap bottoms float above the baseline by 98px (`I`, `l`), 70px (`f`), 113px (`.`) and 27 to 43px (lowercase). `m` sinks 17px below it.
- On the 404 heading, `A` gets 12.8px cells while `l` gets 4.5px and `i` gets 4.0px. Every bitmap top is pinned at y=208, so the line reads "A ˡⁱᵗᵗˡe off course".

Root cause is in `pixels.js` `layoutCells`. `size = min(rect.width/5.5, rect.height*.72/7)` derives cell size from each glyph's advance, which includes the -0.071em tracking. `top = rect.top + rect.height*.13` then pins every bitmap to the top of the line box. The data has a smaller problem too. `g p q y` sit in rows 1 to 6, so their bowls ride a row high and their tails never go below the baseline.

Fix in `pixels.js`:
- **Glyph box.** 9 rows tall with a variable width of 1 to 5 columns. Rows 0 to 6 sit above the baseline, and the bottom edge of row 6 is the baseline. Rows 7 and 8 hold descenders. Cap height is 7 rows and x-height is 5 rows (rows 2 to 6). Geist's real x-height to cap ratio is 95/122, close to 5/7.
- **FONT data.** Append two empty rows to every current glyph. Move the bowls of `g p q y` down to rows 2 to 6 with tails in rows 7 and 8, for example `g` rows 2 to 8 as `01111,10001,10001,10001,01111,00001,01110` and `p` as `11110,10001,10001,10001,11110,10000,10000`. Give `j` a stem down to row 7 and a hook on row 8, and put the comma in rows 5 to 7. Redraw the narrow glyphs narrow: `I i l . ' ! :` at 1 column, and `t f r j` at 3 columns. Trim empty edge columns of every glyph when the table loads.
- **layoutCells.** Compute one cell size per element: `cell = ctx.measureText('H').actualBoundingBoxAscent / 7`, with a canvas `ctx.font` built from the element's computed weight, size and family. That gives about 17.4px on the desktop hero, 7.0px on the mobile hero and 11.4px on the desktop 404. Compute the baseline per glyph as `rangeRect.top + ctx.measureText('H').fontBoundingBoxAscent`. Set `top = baseline - 7*cell`. Center each bitmap on the glyph's ink, `rect.left + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft)/2`, not on its advance box. Use that ink center, at x-height center, as the shrink target (`cx`, `cy`).
- **Verify.** In devtools, for every glyph of `#hero-title` and `#lost-title`, the bottom of row 6 should equal the baseline within 1px, and every glyph should report the same `size`.

### 2. Blocking. The finished headline paints before the bitmap, so the pixel moment starts by spoiling itself
Evidence:
- **First load, local.** The first two frames (+41 and +53ms) are the final Geist headline. The bitmap first appears at +70ms. See `review/first-paint-desktop.png`.
- **First load, fonts delayed 600ms to mimic the real web.** The headline renders in the fallback font from +118ms to +664ms, then swaps to Geist, then turns to bitmap, then resolves. See `review/first-paint-desktop-fonts-600ms.png`. The cause is `await document.fonts.ready` in `navigate()`. It waits for all fonts in use, Newsreader and Mono included, before `initAnimations()` runs, and nothing hides the headline meanwhile.
- **Return home.** The real headline shows for 290ms, through the whole view transition, before the bitmap appears. See `review/return-home-desktop.png`. `initAnimations()` runs only after `transition.finished`.
- **Section headings.** The first frame in view is the real heading, then it turns to bitmap. See the +10ms frame in `review/section-heading-resolve-desktop.png`.

Fix:
- In `index.html` add an inline head script. Under motion it adds `html.pixel-pending`. In `style.css` add `.pixel-pending .hero-title{visibility:hidden}`.
- In the `Typeset` constructor, draw frame 0 (all glyphs `t=0`, opacity 0) for any unplayed, non-reduced-motion instance, the way the `manual` branch already does. Then remove `pixel-pending`. Add a 1200ms failsafe that removes it anyway.
- In `app.js` `navigate()`, replace `document.fonts.ready` with `document.fonts.load('450 1em Geist')`. Call `initAnimations()` inside `render()` for non-initial routes, so the view transition's new snapshot already holds the bitmap.
- Give heading observers `rootMargin:'0px 0px -15% 0px'` so the bitmap is on screen before it resolves. Headings then rest as pixels until they reach the reading zone, which adds pixel moments for free.

### 3. High. The bitmap is never held whole, so it reads as a blur crossfade more than pixel art
Evidence. In `pixels.js`, `lead` is 110ms and the cubic ease-out makes a glyph's real text 49% opaque 88ms after it starts. The intact bitmap headline exists for about 110ms. `I` is half resolved by +200ms and half the line is type by +365ms (`review/intro-desktop.png`, `review/intro-mobile.png`).

Fix in `pixels.js` `play()` and `tick()`. Set `lead` to 400ms for the hero and 120ms for headings. That totals 400 + 15x35 + 440 = 1365ms, inside the 1.4s budget. Split the curve. Cells collapse with an ease-in-out over the full duration, and the real glyph's opacity and blur start only at local t 0.45, so each letter visibly condenses before the type arrives.

### 4. High. Desktop reading column is 84 characters, over the 60 to 70 must-have
Evidence. Characters were counted per rendered line with Ranges on the first paragraph of `#/blog/data-structures-typescript-python` at 1440. Median is 84 and max is 86 at 720px (`review/post-toc-progress-desktop.png`). `65ch` is measured on Newsreader's wide `0`, so it resolves to 720px.

Fix in `style.css`. Set `.prose{max-width:30em}` (600px at 20px, about 70 characters). Set `.article-layout` columns to `200px minmax(0,30em)` and `.work-reading{max-width:30em}`. Re-count afterwards and target a median of 66 or less. Mobile is fine at a median of 41.

### 5. High. The description fade cuts off text that is not cut off
Evidence. On desktop all 11 journal descriptions fit in their 2 lines (`scrollHeight <= clientHeight` for 11 of 11), yet the mask fades the last line to nearly invisible. "did not pass." is barely readable in `review/blog-row-fade-desktop.png`. The mask starts at 30%, so even line 1 dims. On mobile all 11 do overflow, and the fade is right there.

Fix:
- In `style.css`, move the mask to `.fade-description.is-clamped{mask-image:linear-gradient(to bottom,#000 calc(100% - 1.6em),transparent)}`.
- In `app.js`, after `journalRows()` and `home()` render, and on resize, run `p.classList.toggle('is-clamped', p.scrollHeight > p.clientHeight + 1)` for each description.

### 6. High. Back to top replays the hero before the visitor gets there
Evidence. With the footer's smooth "Back to top", the replay starts 587ms after the click. The scroll reaches the top at 1086ms and the replay runs 1325ms. The 250ms re-pixelation finishes while the hero is still sliding in, so the visitor sees only the tail of the resolve. The instant jump is fine, starting 18ms after it (`review/back-to-top-replay-desktop.png`).

Fix in `pixels.js`. Observe with `threshold:[0,.6]` and replay when `departed && entry.intersectionRatio >= .6`. Keep setting `departed` when `boundingClientRect.bottom < 0`.

### 7. High. The title morph drags 10 other titles along
Evidence. Clicking a journal row captured 16 view-transition pseudos. That includes `::view-transition-old(post-*)` for every unclicked row. At +170ms the title "Notes from a software engineering job search" still floats alone after its row has faded (`review/morph-blog-to-post-desktop.png`). The same happens from the home teasers.

Fix in `app.js`:
- Drop the inline `view-transition-name` from `journalRows()` and `teaser()`.
- In the click handler, set `style.viewTransitionName='post-title'` on the clicked row's heading before the hash changes. `post()` uses `view-transition-name:post-title` on its `h1`.
- On back navigation into `#/blog`, name only the row whose href matches the post being left, inside `render()`.

### 8. Medium. The table of contents jump lands 180px low and clears `( Journal )`
Evidence. Clicking TOC item 3 put the heading 180px from the top with the header hidden. `html{scroll-padding-top:90px}` and `.prose h2{scroll-margin-top:90px}` both apply. Active nav became `[]` because `anchorSection()` calls `setActive(headingId)`. On home, `( Index )` also stays active through About and Writing, because only `work`, `index` and `contact` are observed (`review/post-toc-progress-desktop.png`).

Fix:
- In `style.css`, drop `scroll-margin-top` from `.prose h2`.
- In `app.js` `anchorSection()`, call `setActive` only for `work`, `index` and `contact`.
- Observe `readme` and `writing` too and map them to no active item.

### 9. Medium. The ✳ cursor flickers rather than blinks, and hangs below the baseline
Evidence:
- Opacity was sampled for 5s. The mark dims to 0.25 for 250ms once every 2.4s (9.9% of the time), which reads as a glitch.
- It is 73.7px tall and its bottom sits 47px below the headline baseline. `inline-grid` takes its baseline from the first 8.8px row, and `vertical-align:.1em` only lifts that row.

Fix in `style.css`. Use `@keyframes cursor-blink{0%,50%{opacity:1}50.01%,100%{opacity:0}}` at `1.06s steps(1,end)`, started once the intro ends via a class from `finish()`. Set `.pixel-mark{vertical-align:.38em}` and check that `rect.bottom` equals the glyph baseline within 1px.

### 10. Medium. Mobile journal chips look complete when they are not
Evidence. The chip row is 369px of content in a 240px box. It clips exactly after "AI" of "AI & systems", so it reads as a chip named "AI", and "Career" is out of sight (`review/blog-toolbar-mobile.png`).

Fix in `style.css`. Add `.blog-toolbar .filter-row{mask-image:linear-gradient(90deg,#000 calc(100% - 28px),transparent);padding-right:24px}` so the edge visibly continues.

### 11. Medium. The index preview vanishes on scroll and stays gone
Evidence. With the pointer resting on a row, an 80px wheel scroll hid the preview, and it was still hidden 500ms later. `addEventListener('scroll', hidePreview)` fires, and nothing re-shows the preview until the pointer crosses into another element.

Fix in `app.js`. Store the last pointer position. In the scroll rAF, hit-test `document.elementFromPoint(x, y)?.closest('[data-project]')`. Show or retarget the preview on a hit and hide it only on a miss.

### 12. Polish. The resting headline is not properly set type
Evidence:
- Each character stays an `inline-block` span, which breaks kerning. Words measure 2 to 8px wider than the same text unsplit ("Products" +7.7px, "useful." +5.2px, "little" +5.1px).
- At -0.071em tracking the period's ink overlaps the `l` by 0.9px, so the headline reads "usefuL".

Fix:
- In `pixels.js`, keep the original markup. Restore it in `finish()` and re-split in `play()`.
- In `style.css`, open the period. Use `.hero-title{letter-spacing:-.062em}` or a `margin-left:.03em` on the final `.glyph`. Check that the `.` ink starts at least 4px after the `l` ink ends.

### 13. Polish. Copy buttons jump in width
Evidence. "Copy email" is 133.5px wide and shrinks to 88.9px as "Copied ✓", then grows back (`review/copy-email-desktop.png`). Copy link does the same.

Fix in `app.js` `copy()`. Set `button.style.minWidth = button.offsetWidth + 'px'` before swapping the label, and clear it when the label restores.

### 14. Polish. The scroll shadow is a second hairline
Evidence. The header has `border-bottom:1px solid #c8c6b8`. `.scrolled` adds `box-shadow:0 1px 0 #c8c6b8` in the same color, so scrolling only thickens the line to 2px (`review/header-scrolled-desktop.png`).

Fix in `style.css`. Use `.site-header.scrolled{box-shadow:0 1px 0 var(--line),0 8px 18px -14px #18212640}`.

### 15. Polish. Active and expanded cues are missing on mobile and keyboard
Evidence:
- The mobile menu has no current-page state. `aria-current` is null on all 5 links (`review/menu-open-mobile.png`).
- Tap-to-expand rows keep the ↗ arrow, which promises navigation (`review/index-tap-expand-mobile.png`).
- Keyboard focus on a header link shows the ring but not the parentheses that hover shows (`review/focus-02-desktop.png`).

Fix:
- Add `data-nav` to the dialog links in `index.html` so `setActive()` covers them, and style `dialog nav a.active`.
- On touch, show `+` and rotate it 45deg when `aria-expanded="true"`.
- Add `.site-header nav a:focus-visible span{opacity:1}`.

## Keep. These work and must not regress
- Zero console errors on all runs and all 27 routes. No horizontal scroll at 390px on any route.
- Animation loops stop. No `requestAnimationFrame` calls over 5s idle at the top or 2s scrolled away. Reduced motion makes 2 calls in total.
- Section headings resolve exactly once. Two full scroll passes produced no repeat. The hero replays on return to top and on return home.
- Reduced motion shows final states. Glyphs are opaque at 150ms, no canvas shows, the ✳ holds opacity 1, nothing replays, no view transition runs, and the 404 is real text.
- Header hides on scroll down and returns on scroll up. `( Journal )` toggles parenthesis opacity only. Nav positions are identical before and after (612, 678, 745, 825).
- Feature card hover hits spec. Card scale is 1.03, image 1.06, the border goes to ink and the title to cobalt.
- Project index rows turn cobalt. The preview follows with a visible lerp, and the cell dissolve reads. The 7 imageless projects get the cobalt plate. The filter counts are right (13, 2, 5, 4, 2), and tap-to-expand on touch keeps a separate "View project".
- Journal. The toolbar is exactly 56px and sticks under the header. `/` focuses search and live search updates the count. The empty state's reset clears everything and refocuses search.
- Post. The progress hairline tracks, the TOC starts closed on mobile, and code scrolls sideways on mobile. Copy link writes `https://tomasbrasca.xyz/blog/<slug>`, shows "Copied ✓" and announces through the live region.
- Mobile menu. Focus moves to Close, and Escape closes it and returns focus to Menu. A backdrop tap closes it, and links navigate and close it.
- History back and forward render the right route and reset scroll to 0.

## Design judgment
Today the pixel moment does not deliver what Tomas asked for. It opens on the finished headline, holds the bitmap for about a tenth of a second, and the bitmap itself looks like a broken font. Fixed per findings 1 to 3, it becomes a real first-load and return-to-top beat. After that the page has nothing pixel left but the ✳, so the direction risks reading as a well-made template that is too plain to win.

The quiet way to fix that is to make the ✳ a real typing cursor that belongs to one cell grid. It blinks after the headline. When a section heading enters the reading zone, the cursor appears at its end and the heading is set in bitmap behind it before resolving. The index numbers and the preview dissolve use the same cell size. One cursor, one grid, and always type keeps it calm while making it unmistakably his.
