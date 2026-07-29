/**
 * The renderer's state machine: A2UI messages folded into something React can
 * paint. Pure — no React, no DOM — so the protocol logic can be reasoned about
 * (and would be tested) on its own.
 *
 * The state is deliberately the two halves A2UI separates:
 *
 *   • `data`       — a JSON tree written by `dataModelUpdate`, addressed by
 *                    JSON Pointer, holding the values components display.
 *   • `components` — the surface, written by `surfaceUpdate`: a flat map of id
 *                    to component, with containers holding child ids.
 *
 * Folding rather than replacing is what makes the protocol worth having. A turn
 * that only wants to change the rows of a table sends one `dataModelUpdate`; the
 * surface is untouched, the React tree keeps its identity, and nothing below the
 * change re-mounts.
 */

import { isDataBinding, type A2uiMessage } from '../../lib/a2ui/types';

export interface SurfaceNode {
  type: string;
  props: Record<string, unknown>;
  children: string[];
}

export interface A2uiState {
  data: Record<string, unknown>;
  components: Record<string, SurfaceNode>;
  /** Set by `beginRendering`; null means nothing has been told to paint yet. */
  root: string | null;
}

export const EMPTY_STATE: A2uiState = { data: {}, components: {}, root: null };

/* ------------------------------------------------------------ JSON Pointer */

/** "/a/b" → ["a","b"]; "" and "/" → [] (the whole document). */
export function parsePointer(path: string): string[] {
  if (!path || path === '/') return [];
  return path
    .replace(/^\//, '')
    .split('/')
    .map((token) => token.replace(/~1/g, '/').replace(/~0/g, '~'));
}

/** Read a pointer. Returns undefined for any step that doesn't exist. */
export function getAt(source: unknown, tokens: string[]): unknown {
  let cursor: unknown = source;
  for (const token of tokens) {
    if (cursor === null || typeof cursor !== 'object') return undefined;
    cursor = Array.isArray(cursor)
      ? cursor[Number(token)]
      : (cursor as Record<string, unknown>)[token];
  }
  return cursor;
}

/**
 * Write a pointer, copying only the nodes along the path. Everything off the
 * path keeps its identity, so React's reference checks still short-circuit for
 * the parts of the tree the update didn't touch.
 */
export function setAt(
  source: Record<string, unknown>,
  tokens: string[],
  value: unknown,
): Record<string, unknown> {
  if (!tokens.length) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? { ...(value as Record<string, unknown>) }
      : {};
  }

  const [head, ...rest] = tokens;
  const next = { ...source };
  const existing = next[head];

  next[head] = rest.length
    ? setAt(
        existing !== null && typeof existing === 'object' && !Array.isArray(existing)
          ? (existing as Record<string, unknown>)
          : {},
        rest,
        value,
      )
    : value;

  return next;
}

/* ------------------------------------------------------------------- fold */

/** Apply one turn's messages to the previous state, returning a new one. */
export function applyMessages(state: A2uiState, messages: A2uiMessage[]): A2uiState {
  let next = state;

  for (const message of messages) {
    if ('dataModelUpdate' in message) {
      const { path, contents } = message.dataModelUpdate;
      next = { ...next, data: setAt(next.data, parsePointer(path), contents) };
      continue;
    }

    if ('surfaceUpdate' in message) {
      const components = { ...next.components };
      for (const component of message.surfaceUpdate.components) {
        const [type, rawProps] = Object.entries(component.componentProperties)[0] ?? [];
        if (!type) continue;
        const { children, ...props } = (rawProps ?? {}) as Record<string, unknown>;
        components[component.id] = {
          type,
          props,
          children: Array.isArray(children) ? (children as string[]) : [],
        };
      }
      next = { ...next, components };
      continue;
    }

    if ('beginRendering' in message) {
      next = { ...next, root: message.beginRendering.root };
    }
  }

  return next;
}

/** Fold a turn's messages on their own, from nothing. */
export function stateFrom(messages: A2uiMessage[]): A2uiState {
  return applyMessages(EMPTY_STATE, messages);
}

/**
 * Swap `{ path }` bindings for the values they point at. Only the top level of
 * a prop object is scanned, which is all the validator ever produces — bindings
 * are created by lifting whole props, never individual fields inside them.
 */
export function resolveProps(
  props: Record<string, unknown>,
  data: Record<string, unknown>,
): Record<string, unknown> {
  let resolved: Record<string, unknown> | null = null;

  for (const [key, value] of Object.entries(props)) {
    if (!isDataBinding(value)) continue;
    resolved ??= { ...props };
    resolved[key] = getAt(data, parsePointer(value.path));
  }

  // No bindings: hand back the same object so memoised children don't re-render.
  return resolved ?? props;
}
