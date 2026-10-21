# Candidate B. The house remembers your route

The visitor gets two film-specific spatial responses to ordinary browsing. Parasite plots the reader inside a cutaway of the house. Blade Runner 2049 turns visited sections into a wooden-horse memory specimen.

## Parasite alternatives

| Concept | Page response | Comparison |
| --- | --- | --- |
| House section, selected | A person traverses the living room, stairs, semi-basement, and bunker on an architectural drawing. The street line stays fixed. | Expresses the film's central vertical relationship. Complements the existing stair navigation with a view of the building the stairs occupy. |
| Rain follows the rich | Water in the gutters reaches lower sections before the visitor. The semi-basement catches runoff from above. | Strong class metaphor, but the reel already has a flood interlude. A second flood could become decorative repetition. |
| Lines you cannot cross | Section entrances become door thresholds. Passing a heading transfers the reader's silhouette between rooms. | Ties directly to reading, but text needs stable space. Doorway transformations around content risk distraction. |

The selected drawing uses the existing floor model. A dashed route crosses the large first-floor window before descending below street level. A small person moves along the route as the reader scrolls. The current room gets a restrained light fill. Its floor readout uses the same acts as the existing navigation and sound.

The drawing stays in the existing rail. It does not cover content, intercept input, or add another control. The existing semantic navigation remains the way to choose sections. On compact screens the drawing is omitted to preserve the existing mobile rail. Reduced motion changes position only at section arrivals.

## Blade Runner 2049 alternatives

| Concept | Page response | Comparison |
| --- | --- | --- |
| Memory specimen, selected | Reading sections carves nine slices of the wooden horse. In the archive section the visitor inspects slices and returns to the sections that formed them. | Makes an artifact out of the visitor's actual route. Uses the film's specific object and memory laboratory instead of another atmospheric layer. |
| Joi learns your path | A holographic figure appears in the unused edge of each section and turns toward links the visitor considers. | A companion could be memorable, but it overlaps the HAL companionship direction and needs substantial character animation. |
| Esper evidence chamber | Focus on a work item develops a forensic scan in a neighboring frame. Keyboard focus and touch drive the same evidence view. | Useful for inspecting work, but copied content adds maintenance and scanning is already present in the retinal interaction. |

The selected specimen lives inline after the stack heading, inside the portfolio's records-archive act. It is an etched wooden horse with nine carved strips. Visiting a section records one strip. Small memory marks in each section heading connect the first reading to the later artifact.

Every section remains available as a real anchor in the specimen's index. Hovering or focusing an anchor raises its corresponding strip by five pixels. Keyboard focus has an explicit outline. Touch activates the same anchors with minimum 44-pixel target height. The specimen does not obscure portfolio copy or require interaction to continue.

The final section supplies the final slice. Returning to the archive produces the complete memory. A visitor who jumps straight to the archive sees their actual incomplete route rather than an invented history. Reel switching deliberately starts a fresh memory.

## Data and lifetime

Model the Domain changed the implementation choice. Parasite uses one section-to-route-position table and the existing floor function. Blade Runner uses a set of visited section indices, so recording the same section twice cannot add a second fragment.

Type System Discipline changed the DOM boundary. The memory template must clone to a DocumentFragment and contain its expected aside before it enters the page. The code uses typed element queries and no new casts.

The Parasite drawing schedules one animation frame per batch of scroll, resize, or section events. It has no settling loop. Disposal cancels that frame and restores the initial SVG coordinates and room state. Its listeners use the reel signal.

The memory specimen has no animation-frame loop or timers. Section subscription and event listeners belong to the reel lifetime. Disposal removes the cloned specimen and the heading marks. The template remains inert until the reel mounts. Reduced motion removes the specimen's CSS interpolation while retaining selection and navigation.

The existing openings, Morse key, lights, weather, scrubber, sound, and semantic navigation remain in place.

## Verification and remaining QA

Source verification passed in this worktree.

- Prettier formatted the exact six owned source files.
- ESLint passed for both clients and both Astro stages.
- `git diff --check` passed.
- The patch contains only the six source files named in the brief.

The parent owns browser QA and all sequential build or check commands. This candidate has not been evaluated in a running browser. Check the added rail height at short desktop heights, the specimen's placement in the stack section, both reduced-motion modes, and switching away while a drawing update is queued.

## Throughput checkpoint

The blocking work was to read the film clients, stage markup, styling, configs, and shared reel context before choosing the two concepts. This candidate is one independent workstream in its own worktree. No shared files or caches changed. One worker owns both concepts because their six-file scope is small, and the parent compares the complete paired candidate against the other designs.
