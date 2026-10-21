# Candidate C: HAL dialogue as one small opening feature

## Problem

The HAL eye lives in a decorative, aria-hidden opening whose camera fade is driven by `mountCamera`; Odyssey already has a reel-scoped client with sound cues and abort cleanup. The existing `/api/a2ui` request is coupled to forced `render_surface` output and portfolio retrieval, so using it for conversational text would make the caller handle the wrong protocol and retain irrelevant work. Keep the opening composition, give the visitor an accessible compact exchange, and make every paid request follow an explicit submit under the existing limits.

## Usage (caller's view)

In `openings/Odyssey.astro`, the visual eye remains decorative. A compact form and transcript sit with the opening copy; its first greeting and suggested questions are local.

```ts
const hal = mountHalDialogue({ scene, sound: ctx.sound, signal: ctx.signal });
// The form owns submit; first paint makes no request.
hal.ask('What should I notice in 2001?');
// On reel cleanup or when the opening cuts away:
hal.close();
```

The actual form calls `ask` only after submit. A suggestion fills the field; it does not submit. During opening motion, pointer movement updates the eye's inner lens. Touch, keyboard and reduced-motion users get the same conversation without cursor movement.

```ts
// Explicit user action; the module appends one plain-text answer.
await hal.ask(question);
// A later submitted question includes only the bounded prior exchange.
await hal.ask(followUp);
```

## Shape

`src/reels/openings/Odyssey.astro` adds a labelled form, polite transcript, status, and a dedicated inner lens group inside the existing SVG glass. No focusable item sits inside the `aria-hidden` eye. `src/reels/odyssey/hal.ts` owns form events, transcript/history, request cancellation, and the eye pointer RAF; `client.ts` calls `mountHalDialogue` with the opening element and reel signal. CSS translates only the inner lens group using normalized `--hal-x/--hal-y`, clamped to a small radius. The cabinet remains under camera ownership.

The module's one owner state is `HalView = { phase, turns, draft, error }`; `phase` is `ready | sending | unavailable | limited | failed`. Greeting and prompts are static markup. Submitted turns are retained as at most two user/assistant pairs and bounded per turn. Request-in-flight state is private to the module and represented by one `AbortController`; a new submit is disabled until it settles. `close()` aborts, cancels RAF, removes its own listeners, and clears motion variables. Reel signal abort invokes the same idempotent cleanup.

```ts
export interface HalOptions {
  scene: HTMLElement;
  sound: SoundKit;
  signal: AbortSignal;
}
export interface HalTurn { role: 'user' | 'assistant'; text: string }
export interface HalReply { text: string; remaining: number; limit: number }
export function mountHalDialogue(options: HalOptions): {
  ask(message: string): Promise<void>;
  close(): void;
};
```

The module validates and bounds the question before fetch, renders model text with `textContent`, and maps explicit response codes into `limited`, `unavailable`, or `failed`. A brief local status/greeting provides a useful zero-cost first impression; sound uses existing `clunk`, `lensHum`, and `transmission` motifs on user actions and completed replies. There is no TTS or unsolicited network work.

Add `POST /api/hal` as the dedicated plain-text boundary. It parses an unknown JSON body into private domain input, trims/limits the current question (400 chars), accepts at most four prior turns with a strict total character bound, and never accepts system instructions or model options. It calls the existing `checkRateLimit`, `checkDailyLimit`, and `checkGlobalLimit` in order, consuming the same 3/min/IP, 5/day/IP, and 300/day global budgets as A2UI. Return `{ text, remaining, limit }`; use the same error codes/status conventions for 400, 413, 429, 503, and 504. The key and `HAL_MODEL` stay server-only. Request one short text response from OpenRouter using `google/gemini-2.5-flash-lite`; cap output tokens and enforce a timeout. Pass the incoming request signal upstream so browser close, reel unmount, and timeout stop work when possible.

```ts
// src/pages/api/hal.ts — protocol types stay private to this route.
type HalInput = { message: string; history: HalTurn[] };
type HalError = { error: 'bad-request' | 'empty-message' | 'message-too-long'
  | 'rate-limited' | 'daily-budget-exhausted' | 'live-unconfigured' | 'upstream-failed' | 'timeout';
  retryAfter?: number };
function parseHalInput(raw: unknown): HalInput; // validate; no casts trusted
async function answerHal(input: HalInput, env: Env, signal: AbortSignal): Promise<string>;
const HAL_SYSTEM_PROMPT: string; // concise HAL voice; answer film prompts and gentle follow-ups
export const POST: APIRoute; // key → parse → shared gates → answer → JSON
```

When the camera reports the Odyssey cut as complete, it makes this opening scene inert; if focus is inside the form, move focus to the next section heading first. Restore `inert` in camera cleanup. Restrict this behavior to the Odyssey opening, and ensure `close()` also runs before the reel's abort signal. This keeps invisible controls out of keyboard navigation without changing Budapest or other reels.

The interface hides pointer scheduling, bounded history, request lifetime, sound cues, and response handling behind one mount and one `ask` action. The server route owns input validation, quotas, model selection, timeout, and wire parsing. UI types are domain-only; no OpenRouter or A2UI transport types cross the boundary.

## Alternatives considered

- Reuse `/api/a2ui` by adding a text mode: loses on interface depth because the route still loads portfolio context and its response unions renderer messages with chat text; callers and route now share a mode flag and conditional validation. Dedicated text endpoint keeps each request contract narrow while reusing only the rate-limit primitives.
- Build HAL into the A2UI island/drawer: loses because that island owns an interactive portfolio playground, render-surface state, and its own modal lifecycle. HAL would become a second consumer of those internals, and the opening would look like a generic chat widget.

## Tradeoffs accepted

- Keep a small dedicated endpoint and prompt because the route shape is materially different; shared rate-limit functions preserve the budget without coupling to A2UI generation.
- Keep only two exchanges in client memory; enough for a follow-up, with no persistence or account identity.
- Eye tracking respects reduced motion and fine pointer availability; other input modes retain the complete feature without that flourish.
- Model text is plain text and bounded; no rich rendering or voice synthesis is required for this interaction.

## Open questions and risks

- Is the deployed OpenRouter key funded and permitted to call this model? Treat absent key and upstream failure as visible unavailable states; verify deploy configuration before claiming live replies.
- Shared KV read-modify-write counters can race across isolates as they do today; this design adds no new quota mechanism or infrastructure.

## Next implementation step

Add the accessible opening form and lens layer, then implement its single mount owner and the bounded `/api/hal` route against these contracts.
