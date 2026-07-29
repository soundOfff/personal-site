/**
 * The A2UI renderer: folded state → React tree.
 *
 * There is no official A2UI client library, so this is the whole of it, and it
 * is deliberately small. Walk from the root id, look each component's type up in
 * the registry, resolve any `{ path }` props against the data model, recurse
 * into children.
 *
 * Everything unusual here is about not trusting the surface. The agent is a
 * language model, the surface travels over the wire, and this code runs in the
 * visitor's browser — so an unknown type renders as a visible gap rather than
 * throwing, a cycle the validator somehow let through is stopped by the visited
 * set, and a pathological nesting depth is stopped by the depth cap. A bad turn
 * costs you that answer, never the page.
 */

import { memo, type ReactNode } from 'react';
import { lookup } from './components';
import { resolveProps, type A2uiState } from './model';

/** Deeper than any sensible surface; shallow enough that recursion is safe. */
const MAX_DEPTH = 12;

interface NodeProps {
  id: string;
  state: A2uiState;
  /** Ids on the path from the root, so a cycle terminates instead of recursing. */
  seen: string[];
  depth: number;
}

function Node({ id, state, seen, depth }: NodeProps): ReactNode {
  if (depth > MAX_DEPTH || seen.includes(id)) return null;

  const node = state.components[id];
  if (!node) return null;

  const Component = lookup(node.type);
  if (!Component) {
    // Say so out loud rather than rendering nothing: a type the catalog and the
    // registry disagree about is a bug worth seeing during development, and in
    // production it reads as one missing block instead of a silently short answer.
    return (
      <p className="a2-unknown" key={id}>
        unrenderable component: {node.type}
      </p>
    );
  }

  const nextSeen = [...seen, id];
  const children = node.children.length
    ? node.children.map((childId) => (
        <Node key={childId} id={childId} state={state} seen={nextSeen} depth={depth + 1} />
      ))
    : undefined;

  return <Component props={resolveProps(node.props, state.data)}>{children}</Component>;
}

export interface RendererProps {
  state: A2uiState;
}

/**
 * Paint the surface. Memoised on `state`, which the fold in `model.ts` replaces
 * by identity only when something actually changed — so a turn that appends to
 * the transcript doesn't re-render every surface above it.
 */
export const Renderer = memo(function Renderer({ state }: RendererProps) {
  if (!state.root) return null;
  return (
    <div className="a2-surface">
      <Node id={state.root} state={state} seen={[]} depth={0} />
    </div>
  );
});
