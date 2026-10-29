# C. Typeset. The refined direction

Read `briefs/common.md` first. Build in `c/`.

## Idea

This is the closest direction to Tomas's current Pigment identity and the quietest. The pixel moment is typographic. The hero headline is first set in a hand-built bitmap font made of cells, and then each glyph resolves into the real typeface. After that the page is a calm, reading-first editorial site. Motion is short and exact. This is Slite's reading experience with its flaws fixed, dressed in Tomas's paper and blue.

## Tokens

These are the current Pigment values from `shared/current-site.md`.

- Paper `#f7f3e9`. Ink `#182126`. Muted `#48545a`. Hairline `#c8c6b8`. Near-white cards `#fdfcf8`.
- Cobalt `#0024cc`. Amber `#e0b81f`, used rarely.
- Headings: Geist. Reading and italic emphasis: Newsreader. Metadata: JetBrains Mono.
- Durations stay short, mostly 120 to 240ms. Easing `cubic-bezier(0.22, 1, 0.36, 1)`.

## Pixel engine data shape

Name it before you write logic.

- `FONT` is a table from character to a 5x7 bitmap. Write every glyph by hand, original to this prototype: A to Z, a to z, 0 to 9, and `. , ' ! ? : - ✳`.
- `layoutCells(text, box)` returns the cell list `{ x, y, glyphIndex }` for the hero headline, with cell size and line breaks matched to where the real HTML text will sit. Measure the real text with a Range or a hidden clone, so each glyph's cells sit over its real glyph.
- Per glyph, an animation state `t` from 0 (bitmap) to 1 (real type).

## Cover choreography

1. **Intro, at most 1.4s.** The headline "Ideas made useful." first appears as ink bitmap cells on a canvas over the real text, which starts hidden. Glyph by glyph, left to right with a 35ms stagger, the cells shrink toward their glyph's center while the real glyph fades in from a 4px blur. The result is real, selectable HTML text. A 7x7 pixel ✳ stays after the headline and blinks in steps like a cursor. It is the only pixel that persists.
2. **Back to top.** When the hero re-enters after the visitor scrolled past it, the headline re-pixelates quickly (about 250ms) and resolves again. Navigating back to home does the same.
3. **Section headings.** The first time each section heading scrolls into view, it runs a short version of the same bitmap-to-type resolve (about 600ms), once.
4. **Reduced motion.** Real text, with a static ✳ and no blinking.

## Route transitions

Quiet ones. Use `document.startViewTransition` with a crossfade plus an 8px rise over 220ms. The post title morphs from the list row into the post header (`view-transition-name`). Without the API, use a plain 160ms fade. Reduced motion is instant.

## Pages and patterns

- **Header (Slite, andreas, wwwtf).** A hairline header that stays sticky and compact, and gains a 1px shadow once you scroll. It hides on scroll down and returns on scroll up. "Tomas Brasca ✳", Work, Index, Journal, Contact and "Résumé". Active link is `( Journal )` with opacity-only parentheses.
- **Selected work (wwwtf, Slite, andreas).** Three features in zigzag rows of 2/3 and 1/3, as near-white cards on paper. The hairline darkens to ink on hover. Card scale 1.03 over 300ms and image scale 1.06 over 600ms.
- **Project index (wwwtf).** A typographic index list. Each row has a mono number, the title, the category, the stack and the year. Hovering a row turns its text cobalt. A preview image follows the cursor with a 0.12 lerp and arrives through a short pixel dissolve. Projects with no image show a small typographic plate. On touch, a tap expands the row inline with its image. Category chips filter the list.
- **About.** Two columns of Newsreader prose. A copy-email button that says "Copied".
- **Writing teasers (Inspiration Grid).** The two featured posts, whose descriptions fade out with a gradient instead of "…".
- **Blog index (Slite, Inspiration Grid).** A list, not a grid. Each row has a mono date and reading time, the title and the description with a gradient fade. One compact sticky filter row of chips plus search, no taller than 56px, that scrolls sideways on mobile. Live search with an empty state. `/` focuses search.
- **Post (Slite).** A cobalt progress hairline at the top. A collapsible table of contents. Newsreader at 20/32 in a 65-character column, with pull quotes styled. A closing band holds the date, reading time, copy-link with an absolute URL and "Copied" feedback, a short bio and three related posts.
- **Work detail.** Title, role, stack and links, then the body in the reading column, then previous and next project.
- **Footer.** An ink band with "Let's make it useful.", links and the copy-email button.
- **Not found.** "A little off course." set in the bitmap font. It resolves when hovered or focused.
- **Micro.** Link underlines draw in left to right over 200ms. Buttons press to scale 0.98. Focus rings are a 2px cobalt outline with a 2px offset.
