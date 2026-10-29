# Direction A. Conservative: the stills start moving

Read `common.md` first. This brief sets your direction inside it.

## Stance

Today's page, improved where it matters and nowhere else. A visitor who knew the old site should feel it got better, not that it changed. The win is that each product now shows itself working, the workflow becomes a clear picture, and the page settles on sections. Restraint is the point: no new interaction model, no theatrics. Think loadmo.re calm.

## Section order

Cover, `#work` (projects), then `#workflow` (3rd on the page), then the rest.

## Projects (`#work`)

- Keep the current rhythm of the selected-work area: the "Products in focus." heading and a composed layout of three projects (today a bento of `WorkCard`s, see `src/components/WorkCard.astro` and `.bento` in `flood.css`). You may rebalance the layout so each demo is large enough to read (a 16:10 recording needs real width; a product at thumbnail size explains nothing).
- Replace each still with its looping demo inside a minimal frame drawn on the pixel grid (for example a 1-cell border, a stepped corner, or a thin title bar made of cells). No browser chrome, no laptop mockups.
- Under each demo, one quiet caption line that follows the current chapter (`demo.chapters`), plus the product name, a one-line description and a link to the detail page.

## Workflow (`#workflow`)

The 5-stage loop (Frame, Design, Build, Review, Decide) drawn on the 20 px grid as a calm, readable diagram, with the two feedback edges (Review back to Build, Review back to Design) and the tools grouped per stage. The previous site had a node diagram (`src/components/WorkflowDiagram.astro`, no longer used on the page); keep its clarity, make it pixel art. Small, quiet motion at most (a cell travelling along the loop is enough). Name Claude Code and Codex as the agents doing the work and Tomas as the owner of Frame and Decide.

## Snapping

`scroll-snap-type: y proximity` on the page, snap points at section starts (including the top of the cover and the top of `#work`), nothing inside the cover, everything within the common hard limits.
