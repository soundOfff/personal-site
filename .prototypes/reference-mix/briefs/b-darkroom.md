# B. Darkroom. The balanced direction

Read `briefs/common.md` first. Build in `b/`.

## Idea

The work is the hero, and it develops like a photograph. Project screenshots first appear as coarse ordered-dither pixel plates in ink and cobalt, then sharpen step by step into the real full-color image. The rest of the site is a calm editorial gallery built from wwwtf's single accent and Inspiration Grid's typography. The pixel moment belongs to the images rather than to an abstract field.

## Tokens

- Page `#f6f5f1`. Ink `#111214`. Ghost gray `#d6d9dc` for ghost words.
- One electric accent, cobalt `#0024cc`.
- Dither tones: ink, cobalt and page.
- Wordmark: Archivo at its widest width axis, heavy, uppercase. UI: Geist. Reading: Newsreader. Metadata: JetBrains Mono.
- Easing `cubic-bezier(0.22, 1, 0.36, 1)`.

## Pixel engine data shape

Name it before you write logic.

- A `Plate` is `{ img, canvas, level }`. `level` steps through `[24, 12, 6, 3, 0]`, where the number is the cell size in CSS pixels and 0 means the real image.
- At each level, downsample the image to `cols x rows`, map each cell's luminance through a 4x4 Bayer matrix to one of the three dither tones, and draw squares. Cache each level once per plate, because `getImageData` is slow and needs http.
- Developing means stepping through the levels about every 180ms, then crossfading level 3 into the real image while saturation rises from 0.

## Cover choreography

1. **Wordmark.** "TOMAS BRASCA" runs edge to edge, scaled with an SVG `viewBox` so it fills the width exactly. On mobile it breaks into a staircase, "TOMAS" over an indented "BRASCA". Under it sits a two-tone line, solid "Ideas" with ghost "made useful.".
2. **Contact sheet.** A row of five plates for Sift, FocusQuote, Catcher, Dex and Dana, with a mono caption under each. On first load each plate develops from 24px dither to the real image in about 1.4s, staggered 120ms per plate.
3. **Back to top.** When the sheet re-enters the viewport after the visitor scrolled past it, every plate snaps back to 24px dither and develops again.
4. **Hover a plate (wwwtf).** Cursor X scrubs through that project's screenshots (its `image` plus every `<img>` in its `bodyHtml`) with a 0.12 lerp and a 4px scrub bar using `difference`. Each new frame arrives through a fast 6px to 0 develop of about 120ms. On touch it is a horizontal swipe.
5. **Reduced motion.** Show the developed images, static.

## Route transitions

Use the View Transitions API (`document.startViewTransition`) for same-document swaps.

- **Card to work detail.** A shared-element morph. The clicked card's image becomes the detail hero (`view-transition-name: work-<slug>`), and the title morphs too.
- **Post card to post.** The title morphs into the post header.
- **Everything else.** The old view drops 24px and fades, and the new view rises like a sheet, over 450ms.
- **Fallback.** Without the API, run the sheet rise in plain CSS.
- **Reduced motion.** Instant.

## Pages and patterns

- **Nav (wwwtf).** A fixed full-width bar with `mix-blend-mode: difference` and white text. ✳ logo, Work, Index, Journal and Contact, a "Search /" trigger and a "Résumé" link. Active link is `( Journal )` with opacity-only parentheses.
- **Search (Inspiration Grid).** `/` or Cmd+K opens a full-screen search. The input is a 96px headline over a 3px ink rule. Live results cover projects and posts. Ghost text completes the top match in pale gray. Arrow keys and Enter navigate. Escape closes and returns focus.
- **Section headings (Inspiration Grid).** Two-tone throughout, for example solid "Products" with ghost "in focus.".
- **Project index (Inspiration Grid).** Cards with a page-colored tag tab cutting into the image's top-left corner. On hover the image scales to 1.12 over 400ms and the title turns cobalt over 100ms. Hairline borders. Projects with no image get a typographic card with the title set large and a dithered cobalt block. Category chips filter the 13 projects.
- **Work detail (Inspiration Grid).** The hero backdrop is the project image scaled 1.5 and blurred 12px, so the work tints the header. A dither layer over it develops once on enter. The body sits in a 65-character column.
- **Blog index (Slite).** A warm paper section with near-white cards whose hairline darkens to ink on hover. Two featured posts above a grid of three. Posts have no images, so each card carries a big ghost numeral of its reading minutes. Every card shows the date and reading time. Sticky chips and live search with an empty state. On mobile the chips move to a fixed bottom bar no taller than 56px that scrolls sideways.
- **Post (Slite).** Newsreader at 20/32 in a 65-character column. On desktop a table-of-contents sidebar with scrollspy. A cobalt progress hairline. A closing band holds the date, reading time, copy-link with an absolute URL, a short bio and three related posts. Then the giant CTA `(all writing →)`.
- **Footer.** An ink band with "LET'S MAKE IT USEFUL" edge to edge in the wordmark face, links, and a copy-email button that says "Copied".
- **Not found.** One dithered plate that never develops. "A little off course." and a link home.
