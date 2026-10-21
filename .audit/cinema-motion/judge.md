# Independent candidate review

Recommend B as the overall base. Its Blade Runner memory specimen is the most recognizable film idea and makes something out of the reader's actual route. Graft A's Parasite house rooms across the three Parasite files, with the preview correction below. This combines B's strongest invention with A's persistent, operable house on desktop and mobile. Do not combine both Parasite diagrams or add A's archive rack alongside B's specimen.

This verdict comes from reading all three complete patches and rationales against the common baseline, the shared context and engine lifecycle, film configs, affected page markup, and surrounding client/CSS implementation. No browser, build, check, dev server, API or shared cache was used. Visual scores are source-based predictions. The parent owns rendering verification.

| Criterion, scored 1 to 5 | A | B | C |
| --- | ---: | ---: | ---: |
| Film-specific invention | 4 | 5 | 2 |
| Visible improvement and cohesion | 4 | 4 | 1 |
| Reader agency and usability | 4 | 4 | 3 |
| Motion/runtime quality | 4 | 4 | 3 |
| Maintainability | 4 | 4 | 2 |
| Total, equal weights | 20 | 21 | 11 |

A ties the project drawer to actual portfolio inspection and keeps semantic project links. Its house records visited floors, responds to Morse, and has mobile targets. The tradeoff is a second navigation system and a less specific Blade Runner object than B's horse. Its callbacks are bounded, the archive requestAnimationFrame is cancellable, and cleanup removes inserted DOM, classes and observers. The focused or hovered house state needs correction before adoption.

B gives both films spatial models. Its horse is specific to Blade Runner and the archive location is coherent with the existing section slug. Its layout is an inline addition rather than an overlay. The lab has real section anchors and 44px minimum target heights. Its strongest weakness is that the Parasite addition disappears entirely below 821px, so phone users get no new Parasite behavior. The specimen's recorded state also needs accessible text, and the selected-slice geometry does not currently produce the promised raised silhouette.

C is small, but it misses the requested visible interaction improvement. Its stone belongs to the opening scenery and only starts changing from section 5. It returns to its original state by the time the reader reaches the opening again. Its Blade Runner memory count is a conventional visited indicator. This candidate also contains a static TypeScript defect and changes opening markup that the brief excludes.

## Findings to resolve before adoption

1. A, medium severity. `src/reels/parasite/client.ts:374-416` stores one `preview` for both pointer and focus, and `visit()` never clears it. Click a floor anchor and then scroll while the anchor remains focused. The visible occupied room and location stay at that preview even while `aria-current` moves to another floor. Moving a pointer from a different room can also clear the preview of a still-focused room. Derive focused inspection from `document.activeElement` and `:focus-visible`, keep mouse inspection separately, and let section visits clear stale pointer inspection when browsing resumes. A's archive already demonstrates a clearer focus/pointer priority at `src/reels/br2049/client.ts:128-129`. Verify mouse-click then scroll, keyboard activation then scroll, and mixed keyboard/pointer inspection.

2. B, medium severity. `src/reels/br2049/Stage.astro:100-151` hides the whole specimen and count from accessibility APIs. `memoryLab()` only adds CSS classes to visited links and heading marks. A screen-reader user hears the instruction that visits carve pieces, but cannot determine which pieces exist or how many. Expose the readout as ordinary readable text and add a recorded/unrecorded description to each navigation link. Continuous live announcements are unnecessary. C's original-label restoration shows the right lifecycle discipline for this kind of graft, although its observer should not be copied.

3. B, medium visual severity. `src/reels/br2049/Stage.astro:116-124` clips the entire slices container to the fixed horse silhouette. Translating a child slice up by 5px cannot lift that section of the silhouette beyond the ancestor clip. The rectangles remain tall enough to fill the same clipped outline, so selection mainly changes fill and grain. If retaining the promised physical lift, clip each slice's horse fragment inside a separately translated outer group. Keep the unchanged outline as the reference silhouette. Verify the raised edge in the actual SVG at desktop and phone sizes.

4. B, delivery gap. `src/reels/parasite/reel.css:2441-2444` hides the sole new Parasite effect on phones. This is a safe layout fallback but does not deliver a richer Parasite reel for mobile users. The recommended A Parasite graft addresses this with its four-room strip and real anchors.

5. C, high severity before shipping. `src/reels/br2049/client.ts:245` accesses `a.hash` before narrowing `a`. `ticks` comes from the existing untyped `$$`, so its elements have type `Element`, which has no `hash` property. The later `tick instanceof HTMLAnchorElement` does not narrow the earlier callback parameter. Use a typed anchor query or narrow inside `find`. This is a static source finding, not a claimed compiler run. Type System Discipline shaped this finding by checking the DOM boundary before property access.

6. C, delivery gap. `src/reels/parasite/client.ts:109-113` maps sections 0 through 4 to the same stone depth. The stone markup is inside `at === 'in:readme'`, and `.px-window` is ordinary section content rather than a persistent viewport element. The depth only changes when that scenery is offscreen in normal browsing. Do not graft this interaction. It also changes the opening that the brief excluded.

## Precise integration recommendation

Use B's three Blade Runner files. Keep `memoryLab`, its route Set, inline template, cleanup, actual fragment navigation, and no-loop behavior. Apply findings 2 and 3. Remove the unconditional link-click call to `remember(index)` and let the existing section subscription record arrival, so modifier-clicking a link does not falsely record a visit in the current page. This also reduces state updates.

Use A's three Parasite files instead of B's three Parasite files. Keep the visited-floor Set, real floor fragment targets, Morse response, current-location attribute, reduced-motion styles and compact room strip. Apply finding 1. Delete A's now-unused `.px-floor` rules, including its old mobile rule, because A replaces that markup. Preserve the existing staircase and semantic section navigation.

Do not graft C's second section observer. The shared section subscription already supplies the relevant event, and B's memory model needs no new viewport geometry. Do not graft A's work rack into B's lab candidate. That would introduce a second competing memory metaphor, another console, and movement of the portfolio rows without resolving a gap in B's chosen design. Keep the archive rack as the strongest alternate Blade Runner concept in the ideas document.

Reject the scholar's stone in the opening for this task, additional flood effects that repeat the existing interlude, timed baseline judgments about reading speed, and character companions that require assets outside the six-file scope. All three rationales considered at least three concepts per film. B's alternatives are the most directly connected to the requested film-specific behavior.

## Runtime and verification boundaries

No new perpetual animation-frame loop was found. A batches archive scroll/resize work and disconnects its observer. B batches house work and cancels its pending frame. B's lab uses no frame loop or timer. The shared `contextFor().onSection()` automatically unregisters on abort, so C's unretained section unsubscribe is not a leak in this engine. B calls its stop routines through both mount cleanup and abort; these routines are idempotent, so this is redundant but safe. No new root inline styles survive the shown cleanup paths.

Reduced motion is supported through event-driven states and CSS media queries. B still moves its selected SVG group instantly, with no interpolation. C removes transitions but does not freeze the stone position despite the rationale saying it stops moving. That discrepancy is minor compared with its invisible-in-use behavior.

Parent rendering checks should cover the hybrid house in a short desktop rail, the 390px strip, reduced motion, forward and backward section navigation, clicking a floor then scrolling, mixed pointer and keyboard focus, specimen recorded-state accessibility, raised SVG slice geometry, and repeated reel switching while a frame is queued. A's archive alternate additionally needs a real layout check that its row `offsetTop` values use the positioned table as the offset parent and that horizontal translation does not cause a hover boundary oscillation. Those are verification targets, not established defects.

## Added-comment audit

Read the comment-sicko instructions and reviewed added comments only. No code or comments were edited.

| Candidate | Added comments inspected | Recommended deletions | Actual deletions | MUST KILL flags |
| --- | ---: | ---: | ---: | ---: |
| A | 2 | 2 | 0 | 0 |
| B | 0 | 0 | 0 | 0 |
| C | 1 | 1 | 0 | 0 |

A's `src/reels/br2049/reel.css:2996` comment narrates that the archive advances to the reader's sightline. A's `src/reels/parasite/reel.css:2384` comment narrates that rooms open as the reader descends. C's `src/reels/parasite/reel.css:573` comment narrates the stone sinking. Delete all three if their code is adopted. None documents an external constraint or a public API contract. No added lint or TypeScript suppressions, workaround sermons, or commented-out code were found. Existing comments and rationale prose were outside this comment audit. No restored comments, reruns, architect sketch, encoding offers or unresolved comment constraints apply.
