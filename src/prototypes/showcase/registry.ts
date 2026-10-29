// Every prototype id, in switcher order. Written once before the runners start; never edited after.
// Each entry is a lazy import so a broken candidate only breaks its own ?variant=.
export const variants = [
  { id: 'a', label: 'A · Conservative · synthesized', load: () => import('./a/Variant.astro') },
  { id: 'b', label: 'B · Middle · synthesized', load: () => import('./b/Variant.astro') },
  { id: 'c', label: 'C · Creative · synthesized', load: () => import('./c/Variant.astro') },
  { id: 'a1', label: 'A1 · Conservative · candidate 1', load: () => import('./a1/Variant.astro') },
  { id: 'a2', label: 'A2 · Conservative · candidate 2', load: () => import('./a2/Variant.astro') },
  { id: 'a3', label: 'A3 · Conservative · candidate 3', load: () => import('./a3/Variant.astro') },
  { id: 'b1', label: 'B1 · Middle · candidate 1', load: () => import('./b1/Variant.astro') },
  { id: 'b2', label: 'B2 · Middle · candidate 2', load: () => import('./b2/Variant.astro') },
  { id: 'b3', label: 'B3 · Middle · candidate 3', load: () => import('./b3/Variant.astro') },
  { id: 'c1', label: 'C1 · Creative · candidate 1', load: () => import('./c1/Variant.astro') },
  { id: 'c2', label: 'C2 · Creative · candidate 2', load: () => import('./c2/Variant.astro') },
  { id: 'c3', label: 'C3 · Creative · candidate 3', load: () => import('./c3/Variant.astro') },
] as const;

export type VariantId = (typeof variants)[number]['id'];

export function findVariant(id: string | null) {
  return variants.find((v) => v.id === id) ?? variants[0];
}
