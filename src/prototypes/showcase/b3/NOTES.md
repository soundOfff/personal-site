# b3. Middle: the flood stage

**Concept.** One signature interaction: a pinned demo stage where each scroll step swaps Sift, FocusQuote and Catcher, and every swap floods the frame with the cover's own cobalt cave before draining to reveal the next demo. Everything else stays quiet: the product names double as the section title and the tabs, the beat list is the caption, and the workflow below is a small pixel assembly line that loops one ticket back from Review before my ✳ ships it.

**Order.** Cover, `#work`, `#workflow`. The cover's own call to action says "Scroll to see the work", the header's first link is Work, and a hiring manager should see shipped products before the process that made them. The workflow then answers "how" while the demos are still fresh.

**How it works.**
- `#work` is 100svh plus 85svh per extra product. Three invisible `.b3-stop` markers are the snap points (proximity), the stage is `position: sticky`, and `round(progress)` picks the product. Page Down and a flick go straight through.
- The wipe is a flood band `p` in 0..2 over a 20 px grid. Per-cell flood time comes from Dijkstra over `pixels.grid()` (open cells cost 1, walls 3), so the flood runs through the cave first and the walls fill behind it. The swap happens at `p = 1`, full cover. It reverses cleanly if the visitor scrolls back mid-wipe.
- Three stacked videos keep their own playhead. Play at half in view, on hover or focus; a Pause control is always there (WCAG 2.2.2). Reduced motion: no wipe, no autoplay, a centred Play button over the poster.
- The rail under the video and the beat list beside it both follow the playhead and both seek. A "Next: <product>" link under the rail steps forward without scrolling. Sift also links its narrated walkthrough.
- The line is a table of beats (`at`, `belt`, `loop`, `exit`) and its state is a pure function of time, so reduced motion is one frozen moment with both loops drawn. The detail panel follows the ticket until you hover, focus or click (pin) a station.

**Alternatives rejected.**
- Workflow second. It is the stronger visual, but it would make the cover's "see the work" promise wait a whole section.
- A diamond (Manhattan) or plain dither wipe. Generic. The cave-shaped flood is recognisably the cover's language.
- One `<video>` swapping `src`. It flashes on load and loses the playhead.
- A caption chip inside the frame on desktop. The beat list already captions it; the frame stays a clean recording like loadmo.re. Mobile gets a one-line caption above the rail instead.
- A tools panel that only appears on hover. Passive readers would never see a tool, so the panel narrates by default.
- A canvas-only line. DOM and SVG keep stations as real focusable buttons and the text crisp.
- 100svh per product. Too much scrolling for three products; 85svh still reads as a step.

**Prior art.** loadmo.re for the poster under a muted loop and minimal captions. rauno.me/craft for title left, meta right. Pixel Agents and pixtuoid for one sprite state per activity (walk, type, blink). Anthropic's evaluator-optimizer loop for Review feeding back to Build or Design.

**Known gaps.**
- No blurred poster placeholder while a video buffers; the poster shows instead.
- The stage is one region for screen readers; inactive panels are `inert`, but scroll-driven swaps are not announced.
- On phones the beat list collapses to the current beat; the full list lives on the detail page.
- On a phone the stage content is centred in 100svh, which leaves paper above it while the header is hidden.
- Station details follow the ticket by default, so a slow reader may want to click a station to pin it.
