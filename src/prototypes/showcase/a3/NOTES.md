# a3. Conservative: the frame is the timeline

Concept. Each product becomes one row: a large looping demo on the left or right (8 of 12 columns, about 860 px wide on desktop), its name, one line and links on the other side, alternating like the old bento's third card. The pixel frame is a 1-cell dither border with stepped corners, and its bottom edge is the timeline: one cobalt segment per chapter fills a whole cell at a time, and the current chapter's label sits under it as the only caption.

Workflow. Five cobalt blocks on the 20 px grid, each holding its cast as 8x8 sprites (a person for Tomas at Frame and Decide, two terminals for Claude Code and Codex in between). The main path is cobalt dots. The two feedback loops are light dots above the row, each labelled. One amber cell walks the loop and takes a feedback loop back every other lap. Tools are listed under each stage. Decide shows Tomas's question in place of tools.

Snapping. `y proximity` on `html`, start points on every section (one at the cover top, none inside), center points on each product row so each demo settles in the middle of the screen. Off under reduced motion and below 640 px tall. `scroll-padding-top` goes to 0 while snapping is on, because the sections already carry 100 px of top padding.

## Rejected

- Keeping the bento (2fr + 1fr, then a full row). The 1fr column puts a 16:10 recording at about 440 px, too small to read Focus Quote's dashboard.
- One shared player with product tabs. It is a new interaction model, which this direction rules out.
- Every demo full width with the copy underneath. At 1344 px a 16:10 frame is about 840 px tall, so a row no longer fits a 900 px screen and center snapping stops working.
- A flood-fill cave as the backdrop behind each demo, like cursor.com's textured backdrop. It is on brand but competes with the recording. The dither frame keeps the texture to a 20 px border.
- A beats list (all chapters as text) beside each demo. It duplicated the caption. The segment buttons carry the labels for screen readers and seek on click.
- An SVG diagram scaled with a viewBox. Cells land on fractional pixels and the dither smears. The canvas is sized with devicePixelRatio and reads node positions from the HTML, so the same code draws the row on desktop and the vertical rail on mobile.

## Prior art

- loadmo.re: the poster under a muted loop and one quiet caption line. No device chrome.
- devouringdetails.com: the poster as the element background, so the frame is never empty while the video loads.
- Pixel Agents and pixtuoid.dev: agents drawn as small sprites, one per actor.
- Building effective agents: the Review loop drawn as evaluator-optimizer feedback edges.

## Known gaps

- The sprites are generic terminals. Claude Code and Codex differ only in their inner pattern and their labels.
- Tool purposes are left out of the board to keep it calm. Only names and sources show.
- Hovering a chapter segment does not preview its label.
- Sift's optional narrated walkthrough is not linked.
