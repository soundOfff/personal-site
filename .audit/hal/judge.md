# HAL candidate cross-judge

Scores use the five criteria in `design-brief.md` (0–3 each).

| Candidate | Cinematic usability + accessibility | Small API + one state owner | Budget + validation | Cleanup + invisible focus | Scope + maintainability | Total |
|---|---:|---:|---:|---:|---:|---:|
| A — scene-owned console | 3 | 3 | 3 | 3 | 2 | 14/15 |
| B — dialogue beside eye | 3 | 3 | 3 | 3 | 2 | 14/15 |
| C — opening feature | 2 | 2 | 2 | 2 | 2 | 10/15 |

## Recommendation

Use **Candidate A as the base**, with one useful graft from B: native nonmodal `<dialog>` semantics (`show()`) for the compact conversation panel, while keeping A's camera-owned `data-opening-interactive` signal and single `mountHal(ctx)` cleanup boundary. This pairs a precise availability contract with a well-labeled dialogue boundary and keeps camera progress out of the HAL controller.

A is the strongest match for the requested eye-led interaction: the lens is the entry point, the panel stays attached to the scene, the header remains usable, and the client and server each have one clear owner. Its semantic camera signal avoids an observer trying to infer visibility from style and intersection changes. The user-facing layer also has a clear no-network greeting and manual-send path.

B is a close alternative and has good native-dialog details, completed-turn state, and explicit visibility handling. The visibility observer adds a second interpretation of camera state by checking computed opacity and bounds. Prefer A's direct camera signal, but graft B's native nonmodal dialog where it simplifies labeling and Escape behavior. Keep focus handling explicit: do not trap focus; restore to the eye on intentional close, and move focus to visible content only when camera cut makes focused HAL controls unavailable.

C keeps the dedicated route and avoids rendering HAL inside the eye, but its API is less coherent: `mountHalDialogue` returns `ask` and `close`, while the examples also imply the mount owns submission and camera cut. The eye itself is decorative and does not activate the conversation, weakening the cinematic link. Its quota and history bounds are less fully specified than A/B, and “same error conventions” depends on undocumented existing conventions. These are fixable, but require more decisions before implementation.

## Useful grafts

- From B: use `<dialog>.show()` for a nonmodal, labeled panel; leave close available while a request is pending; keep the pending question outside completed history.
- From A: preserve the explicit camera availability attribute, one mount/dispose API, and the exact existing shared limit functions and order.
- From C: retain the concise action-to-endpoint explanation and the useful suggestion behavior (fill the field without submitting).

## Complexity to reject

- Do not add a generic chat framework, React island, A2UI text mode, provider abstraction, event bus, or exported transport types.
- Do not add a second camera timeline or have HAL infer the fade through opacity/intersection observers when the camera can publish one semantic availability bit.
- Do not duplicate rate limits, add a new allowance, persist chat, add streaming/TTS, retry automatically, or send requests on opening/hover/scroll.
- Do not build a focus trap or modal top layer over the header. Keep the panel compact and anchored to the opening.

## Rubric notes

- **A:** Best interaction and boundary design. Its detailed visibility, focus, request, and server contracts are unusually extensive for a small feature; keep only the conditions needed for correctness when implementing. The inner-lens-only motion and explicit quota handling are strong.
- **B:** Equally strong core UX and state model. The dialog is a clean semantic fit, but observing style plus intersection is more machinery than a camera signal, and opacity `0.95` is a brittle proxy for availability. Small-height mobile layout remains an open validation item.
- **C:** The dedicated endpoint and plain text handling are sound in direction, but no precise response/output bounds, request body byte strategy, or detailed failure mapping are committed. Returning an object with `ask` and `close` expands the caller surface and makes cleanup/camera ownership less clear. The static form may also compete with opening copy on small screens.

## Independent issue

The projector countdown audio defect is in scope per grounding and should be investigated and fixed as a separate, small change during implementation. It should not be folded into HAL dialogue state.
