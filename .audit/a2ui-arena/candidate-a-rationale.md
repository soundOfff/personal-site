# Candidate A

## Data shape

`Turn` derives the complete successful response from `A2uiResponse` and adds its question, stable key, and folded renderer state. `RequestState` is a discriminated union of idle, pending, and failed. Pending owns a question and key. Failed owns the same fields plus its message and retryability. A single `AbortController` ref owns the active network request synchronously. Controller identity is checked after asynchronous response parsing and before any outcome can change state.

Model the Domain shaped this separation. An answer is a completed turn; a failed request cannot masquerade as an answer or enter model history. Type System Discipline shaped the union and the response-derived types. No independent pending/error booleans need to remain synchronized.

## Design

The page offers one invitation, a short description, and a clear call to action. The panel groups a short welcome, three broad starting questions, and the composer near its bottom. The empty state contains neither a generated demonstration nor an implementation diagram. Each starter still asks a real question through the existing API.

Once a question is submitted, the welcome gives way to the actual conversation. Questions have a small authorship label. Body text is larger, follow-up targets have more room, and response metadata plus raw A2UI messages live under a native disclosure. A modest pending indicator communicates that a complete response is being prepared without pretending to stream it.

Close, Expand/Restore, and New chat are visible text controls with 44px minimum targets. Native dialog behavior, Escape, focus containment, existing page bootstrap events, and reel cues remain. The film palettes and actual answer components retain their existing styling. No HAL code or preference was touched. No speculative color override was added after the parent verified that Odyssey's settled action contrast is already correct.

## Alternatives rejected

Keeping the eleven-question launcher and simply restyling chips would preserve the crowded entry. A collapsed history or single-answer carousel would hide context during follow-up questions. A simulated typing sequence would misrepresent the complete-response API. A renderer rewrite would exceed the problem and make the production candidate harder to merge.

## Behavioral guarantees from source inspection

- A synchronous active-request guard prevents a double-click from issuing parallel requests before React commits state.
- Reset and unmount abort the current request and clear its identity. Even if the server finishes or JSON parsing resolves afterward, that response cannot append a turn, change quota, or emit an outcome cue.
- The submitted question stays in the composer while pending and after failure. Retry uses the failed question; Edit question returns focus to the composer. Only a successful matching question clears the draft.
- Closing keeps the draft, completed turns, pending request, and quota in the mounted island. New chat resets conversation state without resetting quota.
- History contains only successful question/summary pairs and retains the existing six-message cap.
- A submitted question scrolls into view. When its reply arrives, the viewport returns to that question's beginning instead of the bottom of a tall generated answer. If the visitor scrolls away from the pending question, completion preserves their reading position and exposes a Read reply action.
- The live status region announces completion without reading the entire generated tree. Removed starter/pending focus can move to the new article without scrolling again.
- Existing API gates remain intact. The interface states the five-question shared-IP allowance before the first request and displays authoritative remaining quota afterward. Reset aborts client waiting; it cannot refund server usage.
- New motion respects reduced motion. The panel entrance is explicitly disabled in reduced-motion mode. New questions and reply reading use immediate scrolling.

## Throughput checkpoint

The implementation is confined to the island, its welcome data, and scoped A2UI CSS. Existing renderer contracts, components, API, content, HAL, ticket system, and film files are unchanged. Integrated browser/type checks remain with the parent because all candidate worktrees share a Vite cache.

## Changed files

- `src/islands/A2UIPlayground.tsx` owns the request lifecycle and the simplified conversation journey.
- `src/islands/a2ui/welcome.ts` contains three verified-topic starter labels and questions.
- `src/styles/global.css` contains scoped presentation, touch targets, disclosure layout, pending/failure states, and reduced-motion corrections.

## Validation and limits

Targeted ESLint passed for both changed TypeScript files. Prettier passed for all three source files. `git diff --check` passed. These are source checks, not browser validation.

Per the arena isolation rules, this candidate did not run Astro dev/check/build, touch the shared Vite cache, call a live API, or spawn agents. The parent should verify mobile and desktop layouts across the selectable films, delayed success while reading earlier content, pending reset with late completion, network failure/retry, quota exhaustion, Escape/focus restoration, and reduced motion. The existing trusted internal API response typing is retained; this candidate does not add a second protocol validator. The existing client daily-cap detection and midnight behavior are retained rather than redesigning quota state.
