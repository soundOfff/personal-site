# Independent passage and Esper review

Reviewed the root working-tree diff against `29a3f2f`, including the two untracked modules.
This is a source review. I did not run the app, tests, builds, or browser checks.
The parent reported a passing build, zero Astro errors, three Esper buttons, and working Escape behavior. Those observations are not independent verification by this reviewer.

## Scope

- `src/pages/index.astro`.
- `src/reels/openings/Parasite.astro`.
- `src/reels/parasite/service-passage.ts`, `client.ts`, and `reel.css`.
- `src/reels/br2049/esper.ts`, `client.ts`, and `reel.css`.
- Added scope at the parent's request includes `src/reels/parasite/Stage.astro`, Odyssey `Stage.astro`, `client.ts`, `reel.css`, and `config.ts`, `src/reels/Switcher.astro`, and the removed Odyssey rule in `src/styles/global.css`.
- Read the three current work MDX files and existing table styles as supporting evidence.

## Correctness and accessibility

No actionable correctness defect found in the reviewed changes.

- Source inference. Passage reversal captures the currently rendered height before cancelling the old animation. The destination controls the next toggle, and the finish callback checks animation identity before settling. A stale finish callback cannot close a newly reopened passage.
- Source inference. Closing makes the passage inert immediately. Escape returns focus to the summary before closing. Settled closed content remains hidden by native details behavior. Cleanup restores native details behavior after closing it.
- Source inference. Resize settles to the current destination and clears the inline height. Abort and returned cleanup cancel the animation and listeners. Repeated cleanup is harmless. Cancellation uses callbacks rather than an unhandled `finished` promise.
- Source inference. The current MDX files each contain the exact two requested h2 headings with following paragraphs. The extractor therefore has evidence for all three cases. Templates keep the original full content inert, and cloned evidence strips IDs.
- Source inference. Inspect stops click propagation before the existing row navigation handler. The drawer is a separate sibling row without `data-href`, so its buttons and source links do not invoke project-row navigation.
- Source inference. Closing Esper removes the drawer and its event listeners, cancels current animations, and restores focus when requested. Reel cleanup also removes the inspect buttons. The selected-state union keeps the drawer and its listener controller together.
- Source inference. Specific drawer-row CSS overrides broad work-table display, padding, borders, background, and cursor rules. The drawer has no `.proj`, so project-title and description selectors do not restyle its evidence.
- Source inference. The Parasite image occupies its own normal-flow block above the disclosure. Esper content occupies a new normal-flow row. Neither addition positions evidence over the original work content.
- Source inference. The removed Parasite map has no remaining exact map selectors or mount function. Its removal was explicitly requested and is not a regression.
- Source inference. Odyssey removes the old lens markup, quota observer, lamp selectors, and spending keyframes together. The remaining lamp color variables still have live uses. The mission strip keeps the existing cue consumer, and composer pointer effects keep their cleanup.
- Source inference. The film collection label changes only visible button text and preserves its event hook.

Runtime limits remain. Rapid reversal, Tab during an opening animation, resize during motion, and reel switching during motion were not independently exercised. The source review does not establish rendered contrast, clipping, or narrow-screen fit for the new Odyssey strip.

## Comments audit

Application files touched by this reviewer are none. Proposed deletion count is six changed comment lines, all narration or banners.

- Delete `src/reels/odyssey/Stage.astro:11`, the mission-strip inventory line.
- Delete `src/reels/odyssey/client.ts:7`, the mission-strip inventory line.
- Delete `src/reels/odyssey/client.ts:104`, the mission-transmission banner.
- Delete `src/reels/odyssey/client.ts:429`, the pointer banner.
- Delete `src/reels/odyssey/reel.css:900`, the mission-transmission banner.
- Delete `src/reels/odyssey/reel.css:2506`, the transmission/composer banner.

MUST KILL flags are none. The two new modules introduce no comments or suppressions.
Skipped unchanged commentary outside the changed lines. Adjacent `// reads` and `// writes` in Odyssey `client.ts` are also narration, but are unchanged and excluded from the deletion count.
Skipped the separate film-catalog implementation because it was not integrated when this review ran.

Type System Discipline informed the check of Esper's selected-state union and evidence-view record. Both encode their required members without assertions.
