# b2. Flood stage

**Concept.** `#work` is a pinned stage. Each scroll step (or tab) floods the demo with the cover's cobalt, routed through a seeded cave from the tab you chose, and drains to reveal the next product's loop. `#workflow` is a quiet pixel assembly line. My ✳ stamps a ticket at Frame and Decide, Claude Code and Codex walk it through Design, Build and Review, and failures ride drawn return loops.

**Order: work 2nd, workflow 3rd.** The cover's "Scroll to see the work" and the header's Work link land on the stage. The stage pins right where the cover's sticky scrub ends, so the one signature interaction follows the cover directly. The products come first and the workflow then explains how they were built.

**Snapping.** `proximity` on html, with `scroll-padding-top: 0` so pinned steps align at 0. There are 3 step markers 75svh apart, plus section starts. No snap inside the cover. Snapping is off under reduced motion and below 640px tall.

**Rejected.**
- 100svh steps. A 405px wheel gesture stopped between snap points and nothing changed, a dead gesture. 75svh gives one gesture per product, and Page Down still moves one product. 50svh made Page Down skip a product.
- A scroll-scrubbed wipe, with the wave tied to scroll position. Proximity can rest half-and-half, and every frame composites two videos. The time-based wipe fires at the step midpoint and behaves the same for clicks.
- A Manhattan-distance wipe. It read as a mechanical diagonal. Walls in a seeded `grid()` cave cost 3 steps, so the front follows corridors like the cover flood.
- Chapters as a list in the left column. That duplicated the rail. I kept story-style equal segments under the video, each with its label, because proportional widths cannot hold short chapters' labels.
- A tools panel that follows the ticket. It changed every 2 s and could not be read. It follows hover, focus or tap instead, starting at Frame.
- Agent sprites duplicated at every station. One crew walks with the ticket instead.
- A device frame or textured mat. Either one shrinks the demo, so the video runs full-bleed with a 1px border.

**Prior art.**
- loadmo.re. A poster under a muted loop, no device frame, one small pause chip.
- Story-style segmented progress for chapter ticks. The fill is masked into 4px pixel ticks.
- Pixel Agents and pixtuoid. One sprite state per activity: idle, walk, work (bob plus sparks).
- Anthropic's evaluator-optimizer loop. The two return loops from Review.
- daisyUI RPG notes. A central scene with a status line and a panel, at whole-number pixel scales (6, 4 and 3 px).

**Known gaps.**
- A tab click ignores scroll-driven changes for up to 1.4 s while the smooth scroll runs. If the visitor interrupts the scroll, the product syncs on the next scroll event.
- If the tab is hidden mid-wipe, the swap waits until it is visible again.
- The loop labels are canvas text. Screen readers get the canvas `aria-label` and the tab panels instead.
- Below 700px tall on mobile the description hides to keep the pinned stage in view.
- The 3 videos use `preload="metadata"`. The first frame after a switch shows the poster until data arrives.
