# Cross-judge

Scores use the plan rubric, in order: unobstructed reading, cinematic specificity, input parity, single content source and lifecycle ownership, interruptible motion with reduced-motion support.

| Design | Reading | Cinema | Parity | Source / lifecycle | Motion | Total |
|---|---:|---:|---:|---:|---:|---:|
| A | 5 | 5 | 5 | 5 | 5 | 25/25 |
| B | 5 | 5 | 5 | 4 | 5 | 24/25 |
| C | 5 | 3 | 4 | 2 | 4 | 18/25 |

A is the recommended base. Its row-local drawer keeps evidence beside its case at every width, native title links remain independent, and the inert template renders from the same work entry. The excerpt is cloned from rendered case prose, so the claim stays authored once. The book, shelf, and warm stair light give the passage a clear visual metaphor while normal-flow disclosure preserves the page. Its button, focus, Escape, abort, and reduced-motion behavior are concrete and bounded.

B is a close alternative. It also renders actual MDX into an inert template, and the enhanced evidence sections give readers more source material. Its one-panel relocation between a side host and generated table row adds responsive host state, relocation cleanup, and a breakpoint risk that A avoids. Keep B's 44px target guidance and explicit close button if adopting A; consider its richer section extraction only if one paragraph proves too thin in the actual cases.

C violates the handcopied-evidence constraint. `esperEvidence` duplicates narrative claims in frontmatter even if initially copied from the case body; future edits can drift and the rendered evidence is no longer sourced from the actual case content. Its schema change and row-handler exception also add shared-surface coupling. The adjacent aside is straightforward and unobstructed, but its description does not specify a particularly cinematic Esper treatment.

The smallest synthesis is A plus B's 44px Inspect target and a visible close button in the drawer. Keep A's row-local DOM and single-paragraph extraction. Do not add C's evidence field or separate claim copy. Before implementation, confirm Astro emits the rendered `Content` inside the inert template as intended and check that cloning the paragraph preserves safe, readable markup.
