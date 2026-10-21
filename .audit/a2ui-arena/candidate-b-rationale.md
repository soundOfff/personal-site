# Candidate B. Conversation desk

## Data shape

`Turn` contains one successful question, summary, rendered state, wire messages and metadata. The transcript does not contain a fabricated welcome turn. `RequestState` is a discriminated union of idle, pending with a question/key, and failed with that question/key plus message/retryability. `activeRequest` is the sole synchronous request owner and contains the controller and matching key. `draft` remains independent, so composing the next question does not overwrite the in-flight question.

The Model the Domain principle changed the implementation from independent pending/error fields to one outcome union. Type System Discipline changed the use of the quota interface to the authoritative response type. The server response assertions remain the existing transport trust boundary, rather than growing a second renderer schema in this presentation change.

## Experience

A compact launcher invites a question and states the daily limit. It has no question menu. Opening the native dialog reveals a quiet welcome with three full-width suggestions and one multiline composer. This is the only starter collection. The welcome is local interface copy, separate from generated answers. Film surface materials remain responsible for the answer's visual identity.

Close and Expand have visible labels and normal targets. Expand disappears on narrow screens. The composer is editable while awaiting a reply and submits with Enter, with Shift+Enter for a newline and composition events respected. The question remains in the composer until successful completion. An unrelated draft typed during a request is preserved. Failed questions remain in the thread and offer focused Retry/Edit controls where retry is appropriate. Retry notes that another daily question may be used. Limit and availability errors give the actual waiting/browsing path instead.

The transcript scrolls to the pending question. On completion it scrolls to the answer's beginning only when the reader has stayed within 48px of the original pending position. Reading earlier messages during a request is respected. A Latest reply/question control gives an explicit route back. Closing and reopening preserves the thread, request and draft.

Model, latency, token counts, cache, estimated cost, component count and raw protocol remain available inside About this reply. They do not compete with the answer. Root component entrance delays are removed within the panel because the endpoint returns a complete response. Film box/surface decoration still has its established short entrance. The reduced-motion rule stops panel descendant animations and transitions.

## Guarantees and tradeoffs

- The active ref prevents same-frame duplicate submissions before React renders.
- Reset invalidates ownership before aborting. It clears the local conversation and draft while retaining a confirmed exhausted allowance. Awaited JSON and error continuations check request identity before changing state. Unmount invalidates and aborts too.
- Resetting an active request dispatches the existing error cue to settle film thinking and audio. There is no cancel cue in the permitted client contract. This can produce the film's brief fault feedback for an intentional reset, but prevents an indefinite thinking state. No model output is fabricated.
- All existing rate and budget enforcement remains server-owned. After failures, a non-exhausted quota becomes unknown because the server may already have counted an unsuccessful request. A confirmed daily exhaustion stays exhausted. A next successful reply restores the server-confirmed count.
- Requests are not canceled merely because the panel closes. Conversation continuity remains useful while browsing the page.
- Request JSON assertions are inherited from the existing implementation. No new transport validation scheme is introduced.

## Alternatives rejected

A rich welcome A2UI demonstration made the visitor understand the protocol before asking a question. It was replaced with a plain invitation. An outside launcher question menu duplicated the dialog and gave the page too many actions. Tiny traffic-light controls did not earn a second control vocabulary. Always scrolling to the bottom skipped the start of tall answers, while never scrolling on completion left a new answer below the fold after a short loading state. A shared request library was unnecessary for this single owner.

## Changed files

- `src/islands/A2UIPlayground.tsx` owns the complete launcher/dialog journey, request lifecycle, draft, focus, transcript positioning and disclosures.
- `src/islands/a2ui/welcome.ts` owns the three suggested questions. Unused welcome protocol/menu exports are removed.
- `src/styles/global.css` adds scoped conversation presentation, hit areas, input sizing and readable response treatment. Existing film styles are preserved. Composer grid columns and the Odyssey pseudo-lens are adapted within the shared scope so they fit the label-plus-entry composition. The native lower-left HAL companion and its mute/speech state are untouched.

## Validation

Targeted ESLint passes for both changed TypeScript files. Prettier passes for all three changed source files. `git diff --check` passes. References to removed welcome exports were searched and none remain.

Per assignment, no Astro dev/check/build, integrated type check, browser session, real API request, shared cache writes or original-checkout writes were run. The parent must verify rendered layout and keyboard behavior in all five styles, especially 733x751 and mobile heights. Automated approval, deployment and shipping are outside this candidate.
