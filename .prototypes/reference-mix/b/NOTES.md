# B. Darkroom

Throwaway prototype. The work develops like a photograph: plates start as coarse ink and cobalt dither and sharpen into the real screenshot.

Files: `index.html` (shell, nav, footer, search and menu overlays), `style.css`, `pixel.js` (the `Plate` engine), `app.js` (route table, renderers, interactions), `fonts/` (Archivo, Geist, Newsreader, JetBrains Mono copied from node_modules).

## Where each reference pattern went

| Pattern | Source | Where |
| --- | --- | --- |
| Pixel intro, re-plays on return to top and on back to home | andreas.vision | Contact sheet of 5 plates, 24 to 12 to 6 to 3 px, then crossfade with saturation rising |
| Reduced motion jumps to final state | andreas.vision | Plates paint level 0, no view transitions, CSS animations off |
| Card hover scale only under hover:hover | andreas.vision | All hover rules sit in `(hover: hover) and (pointer: fine)` |
| Cursor X scrub, 0.12 lerp, 4px difference bar | wwwtf | Plate hover scrubs `image` plus every body `<img>`; touch swipes |
| Difference-blend fixed nav, `( Journal )` parens by opacity | wwwtf | Nav; blend kept during route transitions on the `nav` group |
| Edge-to-edge wordmark via SVG viewBox, staircase on mobile | wwwtf | Cover "TOMAS BRASCA", footer "LET'S MAKE IT USEFUL" |
| Zigzag 2/3 + 1/3, giant `(all writing →)` | wwwtf | Selected work rows, writing teaser, post end |
| Two-tone headings, tag tab, 1.12 image scale, cobalt title | Inspiration Grid | Every section head; project cards |
| Blurred 1.5x backdrop, 96px search over 3px rule, fade excerpts | Inspiration Grid | Work detail hero; `/` or Cmd+K search; blog cards |
| Mobile bottom category bar | Inspiration Grid | Blog chips become a fixed 56px sideways bar |
| Paper section, hairline to ink, featured 2 over 3, live search, closing band | Slite | Blog index and post page |

## Invented here

- Exposure ramp per level, so coarse plates read as cobalt and lighten as they develop.
- Hero opens on the screenshot frame you had scrubbed to, then morphs into it.
- Back from a cover project morphs the hero back into its plate, which then re-develops.
- Filter chips animate the grid with a view transition.
- Typographic cards and 404 use generated gradient fields through the same dither engine.
- Reading-minutes numeral as the blog card's image.

## Known gaps

- Blog themes are derived from tags. The content has no pillar field.
- Dex's near-white screenshot gives a faint backdrop tint.
- Reverse morph exists only for the 5 cover plates. Back from a post uses the sheet transition.
- The post card title morph crossfades text sizes, so it softens mid-flight.

Verify with `python3 ../shared/shoot.py b`.

## Fix round

Checked over CDP: 32/32 fix checks, the builder's 61/61 regression checks, `shoot.py` clean. Frames in `review/fix-*.png`.

1. Fixed. A global `[hidden] { display: none !important }` rule. Author `display` rules had overridden the hidden attribute on `.empty` and the featured row.
2. Fixed. The header dither is masked to 10% behind the text column, with a page scrim on that side. The crisp develop now plays on the free right side and on the hero screenshot itself on direct arrivals. A card-morph arrival keeps the real image, so the shared-element morph stays continuous.
3. Fixed. A separate frosted page-colored strip sits under the blended nav on journal, post and not-found once scrolled, and on work once the hero leaves. Home keeps the bare difference nav over the gallery. The nav stays 52px on mobile.
4. Fixed. Offscreen plates leave the runnable set, RAF stops when nothing can run, a hidden tab cancels it, and a plate that scrolls in skips its stagger delay. The hover scrub loop also stops once it settles. Measured 0 frames per second at rest on desktop, mobile and during a resting hover.
5. Fixed. Left and Right on a focused plate scrub with wraparound, move the scrub bar, and announce "Sift, screenshot 2 of 4." Enter still opens on that frame. Focus leaving the plate resets it.
6. Fixed. Same-page section links focus the section heading with `preventScroll`.
7. Fixed. A safe decode in `resolve()` and `renderNotFound()`. `#/%` renders not found and shows the raw hash.
8. Fixed. Both hover rules moved under the pointer guard.

Not measurable here: the hidden-tab pause, because headless Chromium reports `visible`.
