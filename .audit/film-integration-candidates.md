# Independent architecture candidates

All three candidates read the same brief and source. The lead read their full returned packages.

## A, gpt-6-astra

Use button plus hidden panel. panel.hidden is the source of truth, and a small mountOpeningDisclosure(ctx) helper derives aria-expanded, moves focus into the labelled panel, closes with Escape and restores focus only for explicit close. Mount it in each of the two clients and reset on cleanup. Use data-opening-mode=still on actual scene markup to skip mountCamera without a separate film list. Keep photos in lazy scoped reel CSS, intrinsic scene geometry, existing film fonts, and no changes to other film markup. Native details is a viable alternative but A favors separate open and close controls for spatial fidelity to the prototype.

## B, gpt-6.1-sol

Use native details with summary labels for open and close. details.open is the only state. A small mountOpeningDisclosure(scene, signal) helper adds local Escape and lifecycle reset. The two clients call it and include cleanup. Use data-opening-mode=flow on the actual scene to skip mountCamera and remove the redundant camera FILMS Set. Each reel stylesheet owns responsive intrinsic geometry and its CSS background URL. Remove obsolete Parasite/Mood blocks from camera.css, while retaining other films exactly. Preserve existing film fonts and actual rail. Keep role=img on a separate visual layer, never an ancestor of interactive descendants. Accept one native summary toggle instead of separate open/close controls.

## C, gpt-6-luna

Use native details and a small mountOpeningDisclosure(ctx) helper for Escape and cleanup. Add required openingMode static|camera|flow to ReelConfig and every film configuration, making the registry the camera participation owner. Remove camera's FILMS Set. Scoped reel CSS handles images and ordinary-flow geometry. C rejects a custom Boolean controller because it would synchronize state across ARIA and hidden. The sketch's role=img grouping must also be separated from controls during implementation.

## Lead preliminary assessment

Prefer B. Native details deletes state synchronization and remains operable without JavaScript. The actual scene's mode avoids touching every film config. Adopt A's emphasis on avoiding covered focusable links and intrinsically growing mobile panels. Reject C's required mode on unrelated configs as unnecessary blast radius for a two-film change.

Rubric, each 0–3. Preserve Budapest/others; preserve actual content and lazy loading; single state owner; keyboard/touch/Escape/reduced motion; minimal runtime/CSS complexity; responsive approved framing.
