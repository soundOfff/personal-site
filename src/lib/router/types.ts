/**
 * The router contract — shared by demo mode (bundled fixtures, in the island)
 * and live mode (real inference, behind the serverless endpoint). Both return
 * exactly this shape so the UI renders them identically.
 */

/** Status-tint applied to the model chip in the result line. */
export type Tone = 'blue' | 'sage' | 'clay' | 'amber';

/** A resolved route — what the console renders after "Route". */
export interface RouteResult {
  model: string;
  provider: string;
  /** Human-formatted, e.g. "240 ms". */
  latency: string;
  /** Human-formatted, e.g. "$0.00012". */
  cost: string;
  /** One-sentence rationale for the choice. */
  why: string;
  /** The model's reply text. */
  response: string;
  /** Tint for the model chip. */
  tone: Tone;
  /** "demo" (fixture) or "live" (real inference) — set by the producer. */
  mode?: 'demo' | 'live';
}

/** A selectable demo prompt and its pre-recorded route. */
export interface PromptFixture extends RouteResult {
  /** Stable key used as the selection id. */
  key: string;
  /** The prompt text shown in the command list. */
  prompt: string;
}

/** Request body POSTed to the live endpoint. */
export interface RouteRequest {
  prompt: string;
}

/** Error payload from the live endpoint (429 rate-limited, 503 unconfigured…). */
export interface RouteError {
  error: string;
  /** Seconds until the rate limit resets, when relevant. */
  retryAfter?: number;
}
