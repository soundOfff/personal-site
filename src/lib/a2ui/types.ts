/**
 * The A2UI wire format, shared by the agent (server) and the renderer (client).
 *
 * A2UI (Agent-to-User Interface) lets an agent describe UI instead of prose.
 * This is a faithful, deliberately small subset of Google's protocol — enough
 * to be recognisably A2UI, small enough that a cheap model emits it reliably:
 *
 *   1. `dataModelUpdate`  writes a value into a shared, JSON-pointer-addressed
 *                        data model. UI reads from it by path.
 *   2. `surfaceUpdate`    declares components by id. Containers reference their
 *                         children by id rather than nesting, so a later update
 *                         can replace one node without resending the tree.
 *   3. `beginRendering`   names the root id and tells the client to paint.
 *
 * The separation is the whole point: because components address data by path,
 * the agent can change what is on screen with a `dataModelUpdate` alone, and
 * because children are id references, it can swap one card without resending
 * the surface. Both are what make multi-turn UI generation cheap.
 */

/** One message in the stream the agent produces for a single turn. */
export type A2uiMessage =
  | { dataModelUpdate: DataModelUpdate }
  | { surfaceUpdate: SurfaceUpdate }
  | { beginRendering: BeginRendering };

/**
 * Write `contents` at `path` in the data model. `path` is a JSON Pointer
 * (RFC 6901): "/projects/0/title", or "" / "/" for the whole model.
 */
export interface DataModelUpdate {
  path: string;
  contents: unknown;
}

/** Declare or replace components. Existing ids are overwritten, not merged. */
export interface SurfaceUpdate {
  components: SurfaceComponent[];
}

/** Paint the tree rooted at `root`. Sent last, once the surface is complete. */
export interface BeginRendering {
  root: string;
}

/**
 * A component instance. `componentProperties` carries exactly one key — the
 * component type — mirroring A2UI's one-of encoding, which is what lets the
 * renderer switch on type without a separate discriminator field.
 */
export interface SurfaceComponent {
  id: string;
  componentProperties: ComponentProperties;
}

/** `{ ProjectCard: { title: "…" } }` — one key, the type; its value, the props. */
export type ComponentProperties = Record<string, Record<string, unknown>>;

/**
 * A prop value that may be read from the data model instead of given inline.
 * `{ path: "/posts" }` resolves against the model at render time; anything else
 * is used as-is. Literals keep the common case terse; paths keep list data out
 * of the surface so a `dataModelUpdate` can refresh it on its own.
 */
export interface DataBinding {
  path: string;
}

export function isDataBinding(value: unknown): value is DataBinding {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    typeof (value as DataBinding).path === 'string'
  );
}

/* ---------------------------------------------------------------- transport */

/** One prior turn, replayed by the client so the agent has conversation state. */
export interface HistoryTurn {
  role: 'user' | 'agent';
  /**
   * For `user`, the question as typed. For `agent`, the one-line summary it
   * wrote alongside the surface — plain text stands in for the rendered UI, so
   * history stays a fraction of the size of the messages it describes.
   */
  text: string;
}

/** Request body POSTed to `/api/a2ui`. */
export interface A2uiRequest {
  /** The visitor's question. */
  message: string;
  /** Earlier turns, oldest first. Truncated and length-capped server-side. */
  history?: HistoryTurn[];
}

/** Success payload from `/api/a2ui`. */
export interface A2uiResponse {
  messages: A2uiMessage[];
  /** One-line plain-text description of what was rendered; feeds `history`. */
  summary: string;
  /** Which path produced this turn. */
  mode: 'demo' | 'live';
  /** Observability strip under the surface. Absent in demo mode. */
  meta?: TurnMeta;
}

/** What the console's status line reports about a live turn. */
export interface TurnMeta {
  model: string;
  /** Human-formatted, e.g. "1.2 s". */
  latency: string;
  inputTokens: number;
  outputTokens: number;
  /** Input tokens served from the prompt cache rather than re-read. */
  cachedTokens: number;
  /** Human-formatted, e.g. "$0.00042". */
  cost: string;
  /** Components in the surface — a cheap proxy for how much UI was generated. */
  components: number;
}

/** Error payload from `/api/a2ui` (429 rate-limited, 503 unconfigured…). */
export interface A2uiError {
  error: string;
  /** Seconds until the rate limit resets, when relevant. */
  retryAfter?: number;
}
