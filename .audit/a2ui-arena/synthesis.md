# A2UI arena synthesis

## Base and verdict

Three independent production candidates used the configured runner panel. Candidate A used gpt-6-astra, B gpt-6.1-sol, C gpt-6-luna, all at high effort. A fresh gpt-6-astra cross-judge read every candidate. The parent also read each complete implementation and rendered all three.

Both choose B. Its editable multiline draft remains independent of the active question, and one request identity guards asynchronous outcomes. The interface is coherent across entry, pending, failure and response reading. A has strong reading affordances but dark header controls regress Budapest contrast, positive quotas stay stale after failure, and reset incorrectly emits successful-completion feedback. C retains small window controls, a synthetic welcome turn in the transcript and unreliable completion scrolling.

| Criterion, 1–5 | A | B | C |
| --- | --- | --- | --- |
| Clear first action | 5 | 5 | 4 |
| Reading and conversation feel | 5 | 4 | 2 |
| Honest interaction states | 3 | 4 | 3 |
| Film integration and accessibility | 3 | 4 | 3 |
| Maintainability | 4 | 4 | 3 |

The parent agrees with the evidence and verdict. All three candidate builds passed. No candidate dropped out.

## Grafts and corrections

- From A, focusable question articles with guarded focus recovery when a starter or pending article disappears.
- From A, a visible unread-reply affordance when a response arrives while the visitor reads elsewhere. Integrate into B's existing Latest reply control rather than adding another footer row.
- From A, flat ruled starter rows instead of B's pill-shaped chips, keeping B's film-aware color tokens and controls.
- B correction. An active reset clears a nonzero remaining quota to unknown, since aborting client waiting cannot refund a question already counted by the server.
- B correction. Empty-state centering uses safe alignment so a short viewport cannot place content above the scroll origin.
- Final review correction. Odyssey quota lamps use a neutral state whenever the launcher has no verified numeric allowance.
- C's best ideas, fewer starters and collapsed metadata, already converge with A/B. No separate graft needed.

## Principles

Separate Before Serializing Shared State gave each candidate its own worktree. Model the Domain selected a request-state union and a single active request identity. Laziness Protocol kept one existing dialog/renderer/API owner. Redesign From First Principles placed the first question ahead of protocol documentation. Prove It Works requires rendered and live-provider evidence after synthesis.

## Verification

- Final `npm run check`: 0 errors, 0 warnings, 6 existing hints. Final `npm run build`, ESLint and Prettier passed. Candidate A, B and C also built successfully before judging.
- Live provider reply completed in the integrated interface. A next-question draft typed during pending survived completion and closing/reopening the dialog. The reply began 20 px below the reading viewport edge with no horizontal overflow; technical details stayed collapsed.
- Keyboard starter submission recovered focus to the resulting article. Close, reopen, Expand, Retry and Edit were exercised. An intentionally static local preview returned HTTP 501 to test failure without consuming provider quota.
- Start over during a live request aborted client waiting, cleared an uncertain positive quota and left zero late turns after settlement. Server quota enforcement is unchanged.
- Rendered empty states checked in Odyssey, Budapest, Parasite, Blade Runner and House lights. A 390 px embedded viewport checked launcher geometry visually. Nested-frame input was unavailable in the browser tool, so mobile panel interaction remains unverified. Reduced-motion rules were inspected, without runtime preference emulation.
- Final independent read-only review found no state/scroll/focus blockers. Its one minor quota-lamp finding was addressed: Odyssey lamps stay neutral when no verified numeric allowance is printed.
- Final screenshots, candidate rationales/patches, check/build logs and source-only `final.patch` are saved beside this report. No deployment or push performed.

## Remaining tradeoffs

The existing film cue contract has no cancellation event. Resetting a pending request uses its existing error cue to settle the film's thinking state; with sound enabled this may produce brief fault feedback. The local preview has a shared five-question daily allowance, so live tests were bounded and no further provider requests were spent on repeated layout checks.
