/**
 * Turn what the model produced into A2UI messages we are willing to render.
 *
 * The model is asked for a flat `{ root, components[] }` object — the easiest
 * thing to get right. Everything between that and the wire format happens here,
 * server-side, so the browser only ever sees a surface that has already been:
 *
 *   1. type-checked against the catalog (unknown types and props dropped),
 *   2. pruned to the tree actually reachable from `root` (no orphans, no cycles),
 *   3. normalised — list-shaped props are lifted into the data model and
 *      replaced with `{ path }` bindings.
 *
 * Step 3 is not defensive, it is the protocol working as intended: the surface
 * stays a small, stable skeleton and the rows live in the data model, so a later
 * turn can refresh a list with one `dataModelUpdate` instead of a new surface.
 *
 * The rule throughout is repair, not reject. A missing optional prop or one bad
 * child id should cost the visitor that detail, not the whole answer.
 */

import {
  CATALOG,
  DEFAULT_ARRAY_MAX,
  DEFAULT_STRING_MAX,
  MAX_COMPONENTS,
  catalogEntry,
  isComponentType,
  type ComponentType,
  type PropSpec,
} from './catalog';
import type { A2uiMessage, SurfaceComponent } from './types';

/** The flat object the model is asked to produce. */
export interface RenderInput {
  summary: string;
  root: string;
  components: { id: string; type: string; props?: Record<string, unknown> }[];
}

export class A2uiValidationError extends Error {}

/* ------------------------------------------------------------ prop coercion */

/** `undefined` means "drop this prop" — the component keeps its own default. */
function coerce(value: unknown, spec: PropSpec): unknown {
  if (value === null || value === undefined) return undefined;

  switch (spec.type) {
    case 'string': {
      if (typeof value === 'number' || typeof value === 'boolean') value = String(value);
      if (typeof value !== 'string') return undefined;
      const text = value.trim().slice(0, spec.max ?? DEFAULT_STRING_MAX);
      if (!text) return undefined;
      // An out-of-vocabulary enum value is worse than no value: it would reach
      // the renderer as an unknown modifier class.
      if (spec.values && !spec.values.includes(text)) return undefined;
      return text;
    }

    case 'number': {
      const n = typeof value === 'string' ? Number(value) : value;
      return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
    }

    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return undefined;

    case 'children':
    case 'string[]': {
      if (!Array.isArray(value)) return undefined;
      const items = value
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.trim())
        .filter(Boolean)
        .slice(0, spec.max ?? DEFAULT_ARRAY_MAX);
      return items.length ? items : undefined;
    }

    case 'string[][]': {
      if (!Array.isArray(value)) return undefined;
      const rows = value
        .filter(Array.isArray)
        .map((row) =>
          row.slice(0, DEFAULT_ARRAY_MAX).map((cell) => (cell === null ? '' : String(cell))),
        )
        .slice(0, spec.max ?? DEFAULT_ARRAY_MAX);
      return rows.length ? rows : undefined;
    }

    case 'object[]': {
      if (!Array.isArray(value) || !spec.item) return undefined;
      const items = value
        .map((raw) => coerceItem(raw, spec.item as Record<string, PropSpec>))
        .filter((item): item is Record<string, unknown> => item !== null)
        .slice(0, spec.max ?? DEFAULT_ARRAY_MAX);
      return items.length ? items : undefined;
    }
  }
}

/** One element of an `object[]`. Returns null when a required key is missing. */
function coerceItem(
  raw: unknown,
  itemSpec: Record<string, PropSpec>,
): Record<string, unknown> | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;

  const source = raw as Record<string, unknown>;
  const item: Record<string, unknown> = {};

  for (const [key, spec] of Object.entries(itemSpec)) {
    const value = coerce(source[key], spec);
    if (value === undefined) {
      if (spec.required) return null;
      continue;
    }
    item[key] = value;
  }

  return item;
}

/* ------------------------------------------------------------- surface pass */

interface Checked {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  children: string[];
}

/**
 * Type-check one component. Returns null when it can't be rendered at all —
 * an unknown type, or a required prop the model never supplied.
 */
function checkComponent(raw: RenderInput['components'][number]): Checked | null {
  if (typeof raw?.id !== 'string' || !raw.id.trim()) return null;
  if (typeof raw?.type !== 'string' || !isComponentType(raw.type)) return null;

  const entry = catalogEntry(raw.type);
  const source = raw.props ?? {};
  const props: Record<string, unknown> = {};
  let children: string[] = [];

  for (const [key, spec] of Object.entries(entry.props)) {
    const value = coerce(source[key], spec);
    if (value === undefined) {
      if (spec.required) return null;
      continue;
    }
    if (spec.type === 'children') children = value as string[];
    else props[key] = value;
  }

  return { id: raw.id.trim(), type: raw.type, props, children };
}

/**
 * Walk from `root`, keeping only what it can actually reach. Depth-first with a
 * visited set, so a child list that points back up the tree terminates instead
 * of recursing forever — the model has no reason to emit a cycle, but nothing
 * in the format stops it either.
 */
function reachableFrom(root: string, byId: Map<string, Checked>): Map<string, Checked> {
  const kept = new Map<string, Checked>();
  const stack = [root];

  while (stack.length) {
    const id = stack.pop() as string;
    if (kept.has(id)) continue;
    const node = byId.get(id);
    if (!node) continue;

    // Children that were dropped upstream would render as holes; drop the
    // references too so the renderer never looks up a missing id.
    node.children = node.children.filter((childId) => byId.has(childId) && childId !== id);
    kept.set(id, node);
    stack.push(...node.children);
  }

  return kept;
}

/* --------------------------------------------------------------- data model */

/** Props big enough to be worth keeping out of the surface. */
const LIFTED_TYPES = new Set<PropSpec['type']>(['object[]', 'string[][]']);

/**
 * Move list-shaped props into the data model, leaving `{ path }` bindings
 * behind. Paths are `/<componentId>/<prop>`, which is unique by construction
 * because component ids are already deduplicated.
 */
function liftToDataModel(components: Checked[]): Record<string, Record<string, unknown>> {
  const model: Record<string, Record<string, unknown>> = {};

  for (const node of components) {
    const entry = catalogEntry(node.type);
    for (const [key, spec] of Object.entries(entry.props)) {
      if (!LIFTED_TYPES.has(spec.type) || !(key in node.props)) continue;
      (model[node.id] ??= {})[key] = node.props[key];
      node.props[key] = { path: `/${node.id}/${key}` };
    }
  }

  return model;
}

/* ------------------------------------------------------------------ entry */

/**
 * Validate and normalise raw model output into a renderable message stream.
 * Throws `A2uiValidationError` only when there is no surface left to show.
 */
export function toMessages(input: RenderInput): A2uiMessage[] {
  if (!Array.isArray(input?.components) || input.components.length === 0) {
    throw new A2uiValidationError('no components');
  }
  if (typeof input.root !== 'string' || !input.root.trim()) {
    throw new A2uiValidationError('no root');
  }

  // First id wins: a duplicate is the model repeating itself, and the earlier
  // definition is the one the tree above it already references.
  const byId = new Map<string, Checked>();
  for (const raw of input.components.slice(0, MAX_COMPONENTS)) {
    const checked = checkComponent(raw);
    if (checked && !byId.has(checked.id)) byId.set(checked.id, checked);
  }

  const root = input.root.trim();
  if (!byId.has(root)) throw new A2uiValidationError(`root "${root}" was not declared`);

  const kept = [...reachableFrom(root, byId).values()];
  const model = liftToDataModel(kept);

  const surface: SurfaceComponent[] = kept.map((node) => ({
    id: node.id,
    componentProperties: {
      [node.type]: node.children.length ? { ...node.props, children: node.children } : node.props,
    },
  }));

  const messages: A2uiMessage[] = [];
  if (Object.keys(model).length) messages.push({ dataModelUpdate: { path: '/', contents: model } });
  messages.push({ surfaceUpdate: { components: surface } });
  messages.push({ beginRendering: { root } });
  return messages;
}

/** Components in a message stream — the number the console reports. */
export function countComponents(messages: A2uiMessage[]): number {
  return messages.reduce(
    (total, message) =>
      'surfaceUpdate' in message ? total + message.surfaceUpdate.components.length : total,
    0,
  );
}

/** The catalog's component names, for the tool schema's `type` enum. */
export const RENDERABLE_TYPES = Object.keys(CATALOG);
