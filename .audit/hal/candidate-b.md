# Candidate B: a conversation beside the eye

## Usage (caller's view)

The opening presents a real button over the red lens, labelled “Talk to HAL”. Clicking it reveals a compact ship-terminal dialogue beside the cabinet; on phones it occupies the composition's lower area. A local greeting asks “What brings you aboard?” and offers question suggestions. Opening it spends nothing. Only submitting a question calls the model. HAL answers briefly and may end with one question or a short film phrase. The site header remains usable throughout.

```ts
// src/reels/odyssey/client.ts, inside mount(ctx)
const disposeHal = mountHal(ctx);
// Existing reel cleanup:
disposeHal();
```

```html
<!-- Odyssey.astro: sibling controls, never nested interactive elements -->
<div class="ok-first" inert>
  <!-- existing copy and cabinet; SVG remains decorative -->
  <button data-hal-open aria-controls="hal-dialog">Talk to HAL</button>
  <dialog id="hal-dialog" aria-labelledby="hal-title">
    <!-- heading, explicit Close, bounded transcript, labelled input and Send -->
  </dialog>
</div>
```

```ts
// Inside the controller, on an explicit form submit:
const outcome = await requestReply({ question, turns, signal: pending.signal });
// Inside the endpoint, after parsing and shared budget checks:
const reply = await completeHal({ conversation, apiKey, model, signal });
```

## Problem

The camera owns the cabinet transform and fades `.ok-first` using `--shot-cut`; `.ok-copy` and `.ok-orbit` currently block pointer access. Existing `.od-lens` tracking belongs to another on-page lens and A2UI cues. HAL conversation must have its own lifetime and state without hijacking A2UI's forced rendering tool or introducing a second allowance.

## Shape

```ts
// Public client interface: one operation, no UI/network coordination for callers.
export function mountHal(ctx: ReelContext): () => void {
  throw new Error('not implemented');
}

// Private to opening-hal.ts. A closed screen cannot carry a pending request.
type Turn = { role: 'user' | 'assistant'; text: string };
type Transcript = readonly Turn[];
type Conversation =
  | { kind: 'closed'; turns: Transcript }
  | { kind: 'ready'; turns: Transcript }
  | { kind: 'waiting'; turns: Transcript; question: string; request: AbortController }
  | { kind: 'failed'; turns: Transcript; draft: string; problem: Problem };
type Problem =
  | { kind: 'limited'; retryAfter: number }
  | { kind: 'unavailable' }
  | { kind: 'connection' };
type Reply = { text: string; remaining: number; limit: number };
type ReplyOutcome = { kind: 'reply'; reply: Reply } | { kind: 'problem'; problem: Problem };
function requestReply(args: {
  question: string; turns: Transcript; signal: AbortSignal;
}): Promise<ReplyOutcome> { throw new Error('not implemented'); }

// Private to api/hal.ts: external JSON never becomes trusted through a cast.
type HalQuestion = { message: string; history: readonly Turn[] };
function parseQuestion(raw: unknown): HalQuestion | Response {
  throw new Error('not implemented');
}
function completeHal(args: {
  conversation: HalQuestion; apiKey: string; model: string; signal: AbortSignal;
}): Promise<string> { throw new Error('not implemented'); }
```

`opening-hal.ts` owns state, rendering, pending request, focus restoration, opening visibility and eye tracking. `dialog.open` is a rendering result of `Conversation`, never a second state variable. A request result is applied only when the current waiting state still contains that request controller. Closing first transitions to closed and aborts; late completions cannot reopen or append. Transcript contains completed exchanges only; the pending question remains a separate field until success. There is no automatic retry.

Use `dialog.show()`, not `showModal()`. This is a native nonmodal dialogue with explicit Close and Escape handling, not a focus trap. Focus moves to the labelled input on activation; users can tab to the header. Explicit close restores focus to the eye when it is still available. A scroll-triggered close moves focus to the next visible content heading only if focus was inside the fading controls. `aria-live="polite"` announces reply/status without moving focus. Waiting disables Send but leaves Close available.

The controller observes the opening scene's `style` changes and intersection with the viewport. It derives availability from the camera's actual `.ok-first` computed opacity and visible bounds, avoiding a second copy of its easing/progress formula. Once opacity falls below 0.95 or the opening leaves the viewport, close, abort, and apply `inert` before it becomes invisible. Returning to the first shot makes the eye focusable again; it does not reopen the conversation. Default `inert` protects static markup before mount. Watch only the parent scene style, so the controller's own child writes cannot loop the observer.

Pointer motion writes bounded `--hal-x/--hal-y` to an inner SVG group, never `.ok-hal`. One RAF batches reads/writes; reduced motion skips tracking, touch leaves the eye centred. The controller cancels RAF, disconnects observers, aborts pending fetch, stops its own hum, closes dialogue and restores markup on dispose. Its own AbortController is aborted immediately during dispose because reel cleanup precedes `ctx.signal` abort. External reel abort also disposes idempotently.

Module map: `Odyssey.astro` owns semantic markup; existing `camera.css` owns opening composition, including responsive dialogue; new `odyssey/opening-hal.ts` owns the entire client feature; new `pages/api/hal.ts` owns HTTP validation, allowance, prompt and provider adapter; existing Env declaration gains server-only `HAL_MODEL`. No shared transport module or framework island is needed. A caller learns only `mountHal(ctx)`; provider schemas remain private at the two network boundaries (boundary-discipline).

Endpoint policy: reject invalid JSON, non-object bodies, empty/>400-char messages and >8 KiB bodies; sanitize at most six short history turns, allow only user/assistant, and cap each to 400 chars. Reject huge bodies before parsing; check declared length and actual streamed bytes. The route invokes existing `checkRateLimit`, `checkDailyLimit`, and `checkGlobalLimit` in their existing order and namespaces. Return remaining daily allowance on success. Requests stopped by a limit never call OpenRouter. Existing cross-isolate KV races remain a known infrastructure limitation.

Use `google/gemini-2.5-flash-lite` unless server-only `HAL_MODEL` overrides it, `max_tokens: 160`, no tools, no streaming or TTS, and a short static HAL persona prompt. No portfolio snapshot is needed for this film conversation; HAL directs portfolio questions to the site's existing Playground. The prompt asks for one to three sentences, at most one follow-up, and occasional short film phrases rather than quote dumps. Treat supplied history as visitor data, never instructions. Bound provider output text and validate unknown JSON at the gateway boundary. Connect request cancellation plus a 12-second timeout to upstream fetch. Map missing key, timeout, provider HTTP/error bodies and empty content to explicit unavailable; never return scripted text as a successful AI reply. Use `textContent` only.

Local clunk on opening/submission and transmission on success use existing SoundKit; a waiting hum is optional and owned locally. Do not emit generic A2UI cues: those currently drive the other lens and quota lamps. The new UI labels the allowance as shared with Playground; before a successful response it makes no claim about remaining count.

## Tradeoffs accepted

- We accept a nonmodal dialogue's explicit Escape/focus handling in exchange for preserving usable header navigation and a compact integrated composition.
- We accept reading camera output at the DOM boundary in exchange for keeping camera/engine APIs unchanged and having one authority for the fade.
- We accept session-memory history and short text replies in exchange for no persistence, extra infrastructure, output renderer, or token-heavy context.
- We accept budget consumption on failed/aborted requests because existing quota functions charge before upstream work and cannot safely refund across isolates.

## Alternatives considered

- Native modal dialog: hides focus trapping, but `showModal()` makes the header inert and a top-layer presentation separates the conversation from the opening. Its small browser API hides the wrong interaction policy here.
- Inline disclosure region: also integrates well and avoids dialog mechanics, but requires custom show/focus semantics and a separate expanded-state representation. Viable; nonmodal dialog supplies a clear labelled conversation boundary with less manual ARIA.
- Extend A2UI with a HAL mode: would expose answer-format and persona branching throughout an existing structured-surface flow. Shared quota functions already provide the useful reuse without sharing tool contracts or client state.

## Synthesis decision / reconciliation

Candidate only; parent synthesis pending. No source implementation or accepted deviations yet. Red-flag screen: one client state owner; no pass-through layers; no wire types exported; no duplicated scroll timeline; one endpoint for this text conversation.

## Verification and score

Exercise mouse-follow without cabinet movement; keyboard open/send/Escape; header focus while open; 390px viewport with software-keyboard-sized height; reduced motion; scroll fade while waiting; close/reopen before delayed reply; reel switch and return; missing key and 429; real funded reply with actual provider result. Test API rejection/limit behavior without spending calls; make only an explicitly submitted live turn to establish funding. Projector countdown diagnosis remains an independent source-level fix, not part of this API.

Scores (0–3): cinematic usability/accessibility 3; small coherent API/state owner 3; request budget/validation 3; cleanup/invisible focus 3; scope/maintainability 2 (visibility observer is the main complexity).

## Open question and next step

Can a nonmodal dialogue fit the smallest supported opening viewport while the on-screen keyboard is visible? Resolve by driving the rendered mobile composition, with a scrollable transcript and bounded panel height. First build the static dialogue and controller lifecycle, verify those interactions, then connect the bounded endpoint.
