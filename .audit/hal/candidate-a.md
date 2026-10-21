# Candidate A — scene-owned HAL console

## Usage (caller's view)

The visitor sees the original HAL cabinet, a softly following eye, and “Talk to HAL”. Activating the eye opens a compact transmission panel beside it (below it on narrow screens). A local greeting asks a question immediately. A labeled text field and “Transmit” send one real request; “Give me a film line” fills the field and requires the same explicit submission. The header remains reachable because this is a nonmodal disclosure.

```ts
// src/reels/odyssey/client.ts, inside mount(ctx)
const stopHal = mountHal(ctx);
// Existing returned cleanup calls stopHal() before other Odyssey teardown.

// src/reels/camera.ts, inside its existing paint/visibility path
// Publish one semantic boolean, using camera-owned cut and actual pin visibility.
scene.toggleAttribute('data-opening-interactive', visibleFirstShot);

// src/pages/api/hal.ts; all provider/budget policy lives behind this boundary.
export const POST: APIRoute = ({ request, clientAddress }) =>
  answerHal(request, { env: workerEnv, clientAddress });
```

`mountHal` owns interaction, request cancellation, focus, transcript, eye movement and its sound handle. The camera only says whether the opening can currently be interacted with. The route passes HTTP context into one server boundary; it never assembles provider messages.

## Problem

HAL is presently an aria-hidden decorative cabinet beneath full-frame copy and orbit layers. Camera scroll changes its transform and fades the whole first shot. Existing Odyssey logic already owns another eye and the playground's sound state. Adding a second writer to those states, relying on intersection alone, or putting a modal above the header would produce invisible controls or break the cinematic composition.

## Shape

```ts
// src/reels/odyssey/hal.ts — only export
export function mountHal(ctx: ReelContext): () => void;

// Private state: completed exchanges stay separate from an in-flight draft.
type Exchange = Readonly<{ question: string; answer: string }>;
type Quota = Readonly<{ remaining: number; limit: number }>;
type ConsoleMode =
  | { kind: 'closed' }
  | { kind: 'ready' }
  | { kind: 'waiting'; controller: AbortController; question: string }
  | { kind: 'failed'; reason: 'limited' | 'unavailable' | 'timeout'; retryAfter?: number };
type HalSession = {
  mode: ConsoleMode;
  exchanges: readonly Exchange[];
  draft: string;
  quota: Quota | null;
};
// availability is read from the camera-owned DOM attribute, never copied into session.
// Private functions: open(), close(reason), submit(), render(), teardown().
// Async completion is accepted only while mode.waiting.controller === capturedController.

// src/lib/hal.ts — only export; server module, never imported by browser code.
export function answerHal(
  request: Request,
  runtime: { env: Pick<Env, 'RL' | 'OPENROUTER_API_KEY' | 'HAL_MODEL'>; clientAddress: string },
): Promise<Response>;
// Private parsed domain input: { question: string; exchanges: readonly Exchange[] }.
// Private provider call: generateReply(input, env, signal): Promise<string>.
// Private parsing functions return validated values or explicit typed failures.
```

Bodies are intentionally unspecified; implementation follows these contracts.

Module map:

- `openings/Odyssey.astro`: accessible eye button, hidden nonmodal labeled panel, form, polite response status, close button. Decorative SVG stays aria-hidden; remove aria-hidden from the interactive ancestor.
- `odyssey/hal.ts`: complete browser feature; no global playground cues or `data-od-agent` writes.
- `camera.ts`: publish first-shot availability; clear it on cleanup. Existing camera remains sole owner of scroll phase.
- `camera.css`: scoped composition, focus rings, inner eye translation, explicit panel `[hidden]` handling. Copy and orbit get pointer-events:none; controls opt in.
- `lib/hal.ts`, `pages/api/hal.ts`, `env.d.ts`: server policy, tiny Astro adapter, optional server-only `HAL_MODEL` binding.

The API is deep: one mount call hides all browser lifetime rules; one server call hides validation, rate limits and provider protocol. The semantic DOM attribute is the only new camera contract (boundary-discipline). There is no controller/event bus, generic chat framework or provider abstraction.

## Scroll, focus and cleanup contract

1. Camera emits availability only when the first shot is still clearly visible (`cut < 0.15`), the pinned frame overlaps at least half its own height with the viewport, and the document is visible. Calculate from its existing cut value and frame rectangle; do not duplicate the scroll equation in HAL. Initial markup is inert until camera first paints. Reduced motion uses cut=0 and the same viewport rule.
2. HAL observes only `data-opening-interactive`. Losing availability closes the panel, aborts its request, stops its sound and marks the controls inert. Before inert, if focus is inside HAL, move it with `preventScroll` to the visible header reel button. If focus is elsewhere, leave it alone. Returning to the scene enables the eye button but never reopens the panel.
3. Explicit close or Escape returns focus to the eye if the scene is available. Escape is handled only inside the HAL panel. Opening focuses the input with `preventScroll`; no trap, scroll lock or native modal top layer.
4. Before dispatch, reject blank drafts, unavailable scenes and an existing waiting state. Closing removes waiting state synchronously before aborting; a late response cannot append or play sound. Preserve the draft and completed exchanges for reopening within this mount. Cancelled/failed questions never become successful history.
5. Returned cleanup is idempotent and runs safely before `ctx.signal` abort: invalidate state, abort request, stop hum, disconnect MutationObserver, cancel eye RAF, remove own listeners/inline eye values, close/reset controls. Bind cleanup to abort too; repeated calls do nothing. A new mount gets a fresh conversation.
6. Eye translation affects only an inner SVG group clipped to its circular glass. Cabinet and metal rim remain fixed relative to the camera. Pointer updates are RAF batched, clamped and disabled for reduced motion/coarse pointers; reset when inactive or pointer leaves. Do not add the opening to the existing `.od-lens` writer.

## Server and budget contract

- Read no more than 8 KiB actual body bytes, then parse JSON. Require a nonblank question of at most 400 characters and at most three complete question/answer pairs, each side at most 400 characters. Reject malformed shapes; clients cannot supply system roles, model ids or tools.
- Check configuration before spending allowance. Use existing IP resolution and exact `checkRateLimit`, `checkDailyLimit`, `checkGlobalLimit` buckets in that order. No HAL namespace or bonus quota. Return remaining allowance on success and post-consumption errors; accurately label it shared with the playground.
- Use OpenRouter chat completions with `HAL_MODEL || 'google/gemini-2.5-flash-lite'`, no tools, a short fixed system instruction, bounded history, `max_tokens: 180`, and a 12-second timeout combined with request cancellation. Never retry automatically or launch a request on open, hover or scroll.
- System instruction: playful calm HAL-inspired conversation, brief answers, one relevant question, occasional short recognizable film phrase, respect visitor language, no claim of real identity. This endpoint does not answer portfolio facts without source context; direct those questions to the existing playground rather than duplicating retrieval.
- Validate successful provider response as nonempty plain text and cap it to 400 characters; DOM uses textContent exclusively. Map missing key to unavailable/503, shared limits to 429 or global budget/503 with Retry-After, timeout to 504, provider/funding/malformed replies to unavailable/502. Never display raw provider bodies or substitute scripted text for a failed live reply.
- Keep the initial greeting explicitly local. Show “HAL is unavailable” after failure, preserve the draft, and permit only manual resubmission where the quota allows. A submitted request can consume quota even if it subsequently fails or is cancelled; aborting cannot guarantee upstream billing stops.

## Tradeoffs accepted

- We accept a tiny semantic camera attribute plus observer in exchange for avoiding scroll-formula duplication and preventing hidden focus targets.
- We accept nonstreaming replies in exchange for one bounded response, simple cancellation and inexpensive short generations.
- We accept a session that closes when scrolling away in exchange for keeping HAL physically attached to the opening. Header navigation always works.
- We retain existing KV cross-isolate budget races; this feature does not claim stronger cost guarantees than the existing limiter.

## Alternatives considered

- Native modal dialog: hides focus complexity, but takes over the header and leaves a disconnected overlay when its cinematic anchor fades; loses the core integration requirement.
- React chat island: hides rendering mechanics but requires another runtime boundary to coordinate camera availability, reel abort, sound and focus; public coordination surface is larger for this one small form.
- Merge HAL into the playground's forced render_surface protocol: reuses transport but exposes irrelevant surface state and expensive context to dialogue callers, while still needing separate lens/focus rules.

## Synthesis decision

Pending orchestrator comparison. Candidate passes the red-flag screen: one writer for camera phase, one for HAL state; wire/provider types private; three-file maximum client→HTTP→server trace.

## Implementation reconciliation

No implementation yet. Verify small-height/mobile layout and actual provider/key availability before declaring the live experience complete. Independently fix the reported countdown sound; it does not belong in the HAL state machine.

## Next implementation step

Build the semantic camera availability signal and static accessible disclosure, then verify scrolling and keyboard focus before adding requests.

Rubric (0–3): cinematic usability/accessibility 3; small API/state ownership 3; budget/validation 3; scroll/cleanup/focus 3; scope/maintainability 3.
