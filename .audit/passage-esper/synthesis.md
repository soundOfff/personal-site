# Service passage and Esper design

## Parent scores

| Candidate | Unobstructed reading | Cinematic specificity | Input parity | Content and lifecycle | Motion | Total |
| --- | --- | --- | --- | --- | --- | --- |
| A | 5 | 4 | 5 | 5 | 3 | 22 |
| B | 4 | 5 | 5 | 4 | 5 | 23 |
| C | 4 | 3 | 4 | 2 | 3 | 16 |

## Decision

Use A's per-case normal-flow drawers. They preserve the wide work typography and reading order at every width. B scores higher for motion but its responsive panel relocation introduces ownership and focus work that does not help the requested interaction. Reject C's hand-copied evidence fields. No overlay, second project browser or shared cinematic framework.

Graft B's actual rendered Architecture and The key tradeoff evidence into A. Render each existing collection entry once into an inert template inside its existing project cell. Clone only the first meaningful paragraph under a chosen heading into the visible panel and remove copied IDs. The case itself remains the source. No custom Markdown parser or new authored evidence registry.

Graft B's measured, cancellable passage opening and closing. Replace the existing full-photo disclosure with an expansion beneath the image. Keep the native summary as the book spine, existing Mint vignette and native case link. Escape closes and returns focus. A dedicated Parasite mount owns bounded animations and reset; Mood's shared helper stays unchanged.

## Contract

The independent cross-judge also chose A. It scored A 25/25 and B 24/25, whereas the parent penalized A's incomplete closing motion. The final synthesis resolves that motion gap with B's cancellable animation and retains A's simpler row-local structure. B's 44px controls and visible close button are accepted.

Caller usage is `mountServicePassage(ctx)` in Parasite and `mountEsper(ctx)` alongside BR memoryLab. Both return idempotent cleanup functions. No signature change to the shared engine or shared disclosure helper.

Esper owns a closed-or-selected case state. It injects one Inspect button per case and an adjacent `tr > td[colspan=4]` drawer. Its content area has a decorative photographic viewfinder and a readable evidence column. Real native buttons select Architecture or Tradeoff excerpts. Selected outline and a bounded scan respond to selection. Retain the original case title anchors. Inspect stops its own click propagation before the existing row handler. Focus stays on Inspect on opening; Tab reaches its panel, Escape closes and restores focus.

Service passage stays one native details with a discoverable book spine and decorative shelf seam. Animate height and decorative transforms; cancel an in-progress animation from its current geometry on reversal. Hidden or closing content must not accept tab focus. No scroll manipulation or perpetual frames. Abort restores closed state and clears inline animation geometry.

Reduced motion shows the same content immediately. Keep max one visible Esper drawer, cancel finite animations on replacement/unmount, and remove generated nodes on cleanup.

## Verification

Implementation is complete. Independent source and comment reviews are in review.md and catalog-review.md. Browser checks covered keyboard activation, Escape/focus restoration, mobile layouts, case links and reel cleanup.

## Accepted implementation corrections

Astro's combined DOM/Cloudflare ambient types reject Element.append and Element.after for DOM nodes. The integrated Esper mount uses appendChild and insertAdjacentElement instead, with no API or behavior change. The same platform collision was recorded in the preceding cinema work.

Actual 320px browser rendering showed that a mobile viewfinder's minimum height and aspect ratio forced it wider than the reading column. A definite 100% width and zero minimum height corrected the actual layout. The final screenshot is after-esper-mobile-fixed.png.

The catalog's load try/catch now encloses only loading. Success teardown and heading focus occur after the catch, preserving the discriminated-state contract without assertions.

Independent review found that the engine's instant branch omitted its existing shared switch lock. Escape during loading could expose another caller and allow stale selection. The branch now claims the same lock as the projector branch and releases it in finally. check-switch.mjs executes the actual parsed switchReel function, reproduces the old overwrite and verifies serialization and failure unlock. No new engine signature was needed.
