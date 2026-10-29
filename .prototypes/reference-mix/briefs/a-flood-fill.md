# A. Flood fill. The experimental direction

Read `briefs/common.md` first. Build in `a/`.

## Idea

The pixel grid is the whole identity, and it behaves like an algorithm because Tomas is an ICPC finalist who writes about BFS, Dijkstra and binary search. The cover is a cave of cells that floods from a seed like a breadth-first search. The same cells carry route transitions, project covers, post sigils, reading progress and the footer. This direction takes andreas.vision's "one cell system everywhere" pattern furthest and makes it Tomas's own through graph algorithms.

## Tokens

- Page `#f7f3e9` (Tomas's current paper). Ink `#182126`.
- Cell tones: cobalt `#0024cc`, light cobalt `#8a9bff`, paper. A 2px checkerboard dither between neighbor tones gives 5 apparent tones.
- Amber `#e0b81f` is reserved for one thing, the shortest path.
- Display: Newsreader italic (his current emphasis face), large, tight tracking. UI: Geist. Metadata: JetBrains Mono.
- Easing `cubic-bezier(0.22, 1, 0.36, 1)`.

## Pixel engine data shape

Name it before you write logic.

- One grid: `cols`, `rows`, `cell` (about 20px CSS on every screen, only the column count changes).
- `open: Uint8Array`. Which cells are floor and which are wall. Generate walls with value noise plus two or three cellular-automaton smoothing passes so the shapes read as a cave, not static. Aim for about 30 to 40% walls.
- `dist: Int32Array`. The BFS distance from the seed over open cells.
- `tone: Uint8Array`. The current tone per cell.

Everything else (intro, drain, ripples, paths) derives from `dist` and time.

## Cover choreography

The hero is about 200vh with a sticky full-viewport canvas.

1. **Intro, about 1.2s.** Paper first. Water fills the cave in BFS order from a seed near the center, so the wavefront follows the cave shape. Tone comes from distance bands with dither, darker near the seed. From about 500ms, each word of "Ideas made useful." grows out of a small cobalt pixel seed, staggered 100ms. The nav enters last.
2. **Rest.** Single cells flip tone now and then. With a fine pointer, an amber shortest path runs from the seed to the cell under the cursor through open cells, recomputed on move. On touch, a tap sets the target. This is the signature moment and it must feel instant.
3. **Scroll, scrubbed over 0 to 1 viewport.** The field drains in reverse BFS order toward the seed. The headline fades word by word. The last cells condense into a 7x7 pixel ✳ that flies up and docks as the ✳ in the header wordmark "Tomas Brasca ✳".
4. **Back to top.** Scrolling up reverses the scrub exactly. On arrival at the very top after having left, add a short 600ms re-bloom ripple from the seed. Clicking the header ✳ from anywhere scrolls to the top and replays the full intro.
5. **Reduced motion.** Show the filled cave and the full headline, static, with no path animation.

## Route transitions

On an internal link click, take the click point. A fixed overlay canvas covers the viewport with cobalt cells in BFS order from that point (about 320ms). Swap the route under the cover, then uncover by continuing the wave outward (about 320ms), so it reads as one wave passing through. Back and forward start the wave from the center. Reduced motion uses an instant swap.

## Pages and patterns

- **Nav (andreas, wwwtf).** Pill nav with "Tomas Brasca ✳", Work, Index, Journal and Contact, plus a cobalt "Résumé" pill. Active link is `( Journal )` with opacity-only parentheses. Hides on scroll down and returns on scroll up. Over cobalt sections it switches to `mix-blend-mode: difference`.
- **Selected work (wwwtf, andreas).** A bento in zigzag rows of 2/3 and 1/3 for the projects with images. On hover the border turns cobalt, a 4px halo grows and the radius springs from 4 to 8px. Cursor X scrubs through that project's screenshots (its `image` plus every `<img>` in its `bodyHtml`) with a 0.12 lerp and a 4px scrub bar using `difference`. On touch it is a horizontal swipe.
- **Generated covers.** Projects with no image get a pixel cover generated from a hash of the slug with the same cave generator and palette, so the index never shows an empty box.
- **Experience band.** Full-bleed cobalt with stepped dithered edges where it meets the paper.
- **All projects.** Category chips filter the 13 cards with a FLIP reorder.
- **About, writing teasers and the giant CTA (wwwtf).** The CTA is `(read the journal →)`.
- **Footer.** A large ✳ built from cells. Rings ripple out from the cursor in BFS order. "Let's make it useful.", links, and a copy-email button that says "Copied".
- **Blog index (Slite).** Every post gets an 8x8 mirrored pixel sigil generated from its slug. Two featured posts sit above a grid of three. Every card shows the date and reading time. Sticky chips and live search, with an empty state that shows a small pixel ✳ and "Nothing matches “query”."
- **Post (Slite).** Reading progress is a row of cells along the top edge that fill left to right. A collapsible table of contents. Headings get a pixel bullet. A closing band holds the date, reading time, copy-link with an absolute URL, a short bio and three related posts by tag overlap.
- **Work detail.** The header band is the cave field seeded by the slug, short and static after a quick bloom. The body sits in a 65-character column.
- **Not found.** The cave with no path. "A little off course." and a link home.

## Easter egg

Press `R` on the cover, or click any open cell, to re-seed the flood from that cell.
