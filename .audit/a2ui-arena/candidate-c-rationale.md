# Candidate C rationale

## Request shape

The client request lifecycle is `RequestState = idle | pending | failed`. Pending carries a monotonically increasing request id and the original question. Failed carries the original question, user-facing message, and whether an immediate retry is meaningful. `activeRequest` is the sole owner of the active `AbortController` and identity. The controlled composer keeps the question until a successful answer arrives.

## Design

The launcher keeps one primary action and places four answerable examples in a collapsed disclosure. The panel opens on a compact editorial welcome, centers it in the available reading space, and leaves the composer in its fixed footer. Generated answers remain the main content. Per-turn model, latency, token, cache, cost, component metadata, and raw A2UI messages are nested under “Turn details.” Pending copy describes the real wait without implying streaming. Errors retain the question, focus the composer, and provide an immediate retry action for transient failures.

The request identity and abort signal prevent a response from appending after reset or unmount. New turns scroll to the pending question and keep that reading position when the complete response arrives, so tall replies begin at their start. The panel still uses the native dialog and keeps the transcript and draft when closed. Reduced-motion preferences disable panel and skeleton animation and make scroll jumps immediate.

## Alternatives rejected

Keeping the grouped eleven-question menu would preserve the overload described in the brief. Showing starters both in the welcome surface and below the composer would repeat choices. Leaving metadata exposed below every answer would compete with reading; hiding it entirely would lose useful observability. Clearing the composer at submit time would lose the question on failure. Letting fetch completion mutate state without an identity check would allow a reset thread to receive an old response. No film color override was added because the measured settled Odyssey action text had sufficient contrast; the initial dim screenshot was the reveal animation.

## Changed files

- `src/islands/A2UIPlayground.tsx` owns the discriminated request lifecycle, cancellation, retained retry draft, shorter launcher, on-demand turn details, and question-anchored scrolling.
- `src/islands/a2ui/welcome.ts` replaces the implementation diagram and repeated suggestion row with a short welcome surface and four curated launcher prompts.
- `src/styles/global.css` styles the disclosure, retry affordance, centered empty state, larger control hit regions, on-demand protocol block, and reduced-motion behavior.

## Throughput checkpoint

- Blocking first steps: read the shared brief, inspected the three requested skills and local A2UI ownership, and confirmed the assigned checkout starts at the stated baseline.
- Independent workstreams: n/a. This is one request lifecycle and presentation journey across the allowed files.
- Shared mutable state: kept all edits inside `/tmp/a2ui-arena-c-20261021`; no other candidate checkout or original workspace was read or modified.
- Smallest safe decomposition: one owner was necessary because launcher, request state, transcript rendering, and scroll positioning share component state. No child agent was spawned, per the task instruction.

## Validation

Targeted ESLint passed for both changed TypeScript files. Targeted Prettier completed for the two TypeScript files and `src/styles/global.css`. `git diff --check` passed. No Astro build, check, dev server, live API, or browser verification was run, as assigned. Integrated and visual verification remain for the parent.
