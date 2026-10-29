# b1. The flood stage

**Concept.** One interaction carries the page: a pinned demo stage where each product is a snap step, and the cover's cobalt cave floods over the old demo, then drains from the same seed to reveal the next. Below it, the workflow is a quiet pixel assembly line on the same grid: my ✳ frames and decides, Claude Code and Codex carry an amber ticket through Design, Build and Review, and Review sends it back over two return tracks.

**Order: cover, #work, #workflow.** The cover ends with "Scroll to see the work" and the header's first link is Work, so the products come first. The workflow then answers the question the demos raise: how one engineer ships three products with agents.

## Choices, and what I rejected

- Wipe fires when the scroll crosses a step's midpoint and runs on time (720 ms). Rejected a scroll-scrubbed wipe: a visitor resting mid-step would see a half-flooded demo, and the 5-second read needs a clean frame at rest.
- Cave-weighted flood (walls cost 3, corridors flood first) from the edge the next product comes from. Rejected a plain BFS diamond and a dither crossfade: neither looks like the cover.
- The product names are the index: solid for the active one, ghost for the rest, the same solid/ghost rule as every `.section-heading`. Rejected tabs and a 1/3 dot pager as extra chrome.
- Names are anchor links to the snap steps. Scroll stays the only source of truth, so keyboard, no-JS and jumps all play the same wipe.
- Chapter rail: equal segments that fill in whole 8 px cells, labels underneath, clickable to seek. Rejected proportional ticks: a 2.9 s chapter cannot hold its label. No text over the video; mobile shows only the current label.
- A "Scroll for FocusQuote ↓" hint names the next step, so the pinned stage explains itself.
- Workflow: one ticket, the agents walk with it, return tracks overhead so station labels sit right under the belt. Rejected an agent pair parked at each station (six sprites, too busy) and a vertical mobile layout (loses the line).
- The tools panel follows the live station until a station is hovered, focused or clicked (click pins it). Rejected a static default: the moving panel narrates the line.
- Amber is the ticket only. Agents are original bots (a terminal face, an antenna face), labelled by name.
- `scroll-padding-top: 0` for this variant: every section has its own top padding, so snaps and anchors land flush and the stage pins exactly on each step.

## Prior art

- loadmo.re: poster under a muted loop, tiny captions, no device frame.
- rauno.me/craft: title and meta beside the media, poster as placeholder.
- Pixel Agents, pixtuoid: one sprite state per activity (idle bob, walk, typing arms, blinking cursor).
- Building effective agents: the evaluator-optimizer loop drawn as the two return tracks.

## Known gaps

- Desktop viewports shorter than about 680 px squeeze the left column; the stage does not unpin there.
- Under reduced motion the stage still swaps by scroll position, instantly, and each product needs its own Play press.
- The workflow lap restarts from Frame the first time the section scrolls into view, not on every visit.
- At 390 px the agents overlap the ticket slightly at their station.
- The shared dev server reloads the page when any variant is saved, so gate runs can crash mid-run and need a rerun.
