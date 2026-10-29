# a2 · Conservative · the stills start moving

## Concept

Each product becomes one row in the shape of the old bento's wide card: copy on the left, a
large looping demo on the right (about 860 px wide at 1440), framed by one cell of `--light`
with the corner cells knocked out. The frame's bottom edge is the chapter rail: it fills with
cobalt as the loop plays, gaps between segments are the chapter ticks, a click jumps to a beat,
and one caption line under it names the current beat.

The workflow is a two-lane map on the 20 px grid. Tomas's rooms (Frame, Decide) sit high in
cobalt; the agents' rooms (Design, Build, Review) sit low in `--light`; the two feedback loops
arc back over the agents' lane. One amber cell walks the loop, once through a fix and once
through a rethink, in the cover's own path idiom (a 10 px square inside a cell).

## Rejected

- Keeping the 2fr/1fr bento: the 1fr demo is about 420 px wide and the recordings' UI text is
  unreadable there.
- Zigzag rows (media alternating sides): reads as a SaaS template and makes the eye hop.
- Full-width demos: a 16:10 recording at 1344 px is taller than the viewport with its caption.
- A pixel title bar over the video: Catcher's recording already shows browser chrome, so it
  doubled up. The rail-as-bottom-edge does the same job with one element.
- A beat list beside each demo: clearer story, but it repeats the caption. Kept minimal.
- One straight row of five stages for the workflow: the lanes say who owns what at a glance.
- Seeded `PixelSigil` marks for the agents: they looked random. Two hand-drawn 8x8 sprites
  (a terminal with a prompt, a round helper) instead, labelled by name.

## Prior art

loadmo.re for the calm poster-under-video rows and the single caption. rauno.me/craft for title
left, meta right. Pixel Agents for agents as sprites. Building effective agents for the loop.

## Snapping

`y proximity` on `html`; snap at the cover top, `#work`, each product row, `#workflow` and every
later section. Sections use `scroll-margin-top: -100px` so they land flush under the header;
product rows use the page's 100 px scroll padding. Off under reduced motion and below 640 px tall.

## Known gaps

- Between 1180 px and 1440 px the wide diagram scales down, so cells are under 20 px and the
  dither softens. Below 1180 px it switches to the one-column map.
- Tablet widths stack the product rows; untested beyond the 390 and 1440 gates.
- The narrated Sift walkthrough opens the raw mp4 in a new tab.
