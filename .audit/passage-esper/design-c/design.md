# Candidate C: one native passage and a workbench readout

## Problem

Parasite already has a native disclosure for Mint evidence, while BR's work cases come from the shared Astro collection and keep native title links. The design should make discovery cinematic without covering the reading surface, cloning case content, or adding navigation interception. Stage declarations only matter when their matching branch is rendered; the existing home page renders `in:work` and `after:work`, and never renders `in:readme`.

## Usage (visitor's view)

On Parasite, the visitor activates the existing “There is another floor” control with pointer, touch, Enter, or Space. The photo remains visible above as the floor unfolds beneath it; the Mint case link remains a normal link. Escape closes the passage and returns focus to the control.

On BR, each work row gains an “Inspect” control. Activating it reveals that case's evidence in a reader panel beside the table on wide screens and directly below the selected case on narrow screens. Selecting another case replaces the evidence; the title link still opens its case page. Escape closes the panel and returns focus to “Inspect.”

## Shape

```ts
// Work content remains authored once in src/content/work/<slug>.mdx.
type WorkEntry = CollectionEntry<'work'> & {
  data: { esperEvidence: string };
};

// Astro renders each inspect control and adjacent evidence mount from `work`.
function WorkIndex({ work }: { work: WorkEntry[] }): AstroComponent;

// BR client owns only the transient selected state and panel lifecycle.
function mountEsper(workSection: HTMLElement, signal: AbortSignal): () => void;

// Parasite keeps details as the source of open state; the existing helper owns reset.
function mountOpeningDisclosure(scene: Element | null, signal: AbortSignal): () => void;
```

Add required `esperEvidence` to the existing work collection schema and fill it in the corresponding MDX frontmatter with a concise claim already supported by that case narrative. The collection remains the only project list. Render one button per row with `data-esper-inspect`, the stable entry id, and evidence text; render one initially empty `<aside>` adjacent to the table. Keep the title `<a>` untouched. The row-click listener explicitly ignores `[data-esper-inspect]` so the control cannot route to the case. The BR client delegates button clicks, writes the selected entry's text into the aside, exposes it with `aria-live="polite"`, and closes it on Escape. No cloned table or duplicated case route.

Parasite's current `details[data-opening-disclosure]` becomes the service passage. Keep its Mint content and link, restyle `summary` as the book spine/handle, and let the revealed panel participate in normal document flow below the photograph. Preserve native `details` toggling and `mountOpeningDisclosure` abort reset. Use CSS grid row expansion for the fluid reveal; `prefers-reduced-motion` removes the transition while retaining the same open state.

```text
src/pages/index.astro                 canonical work map, controls, evidence mount, row-handler exception
src/content/config.ts                 required esperEvidence validation
src/content/work/*.mdx                concise evidence sourced from each case narrative
src/reels/openings/Parasite.astro     existing native disclosure, now passage affordance
src/reels/parasite/reel.css           flow reveal, book styling, reduced-motion rule
src/reels/parasite/client.ts          existing disclosure mount and abort cleanup
src/reels/br2049/Stage.astro          in:work stage wrapper/style hooks if needed
src/reels/br2049/reel.css            scoped adjacent evidence-panel presentation
src/reels/br2049/client.ts           delegated inspect state, Escape, focus, cleanup
```

The Astro build validates `esperEvidence` at the content boundary; internal rendering consumes typed entries. One selected case id is the sole BR state. Event listeners use `ctx.signal`; panel text, selection attributes, and focus state are cleared on unmount. With reduced motion, BR keeps all controls and evidence available and omits transitions. Neither reel adds scrolling or a frame loop.

## Synthesis decision

This candidate chooses two native surfaces with distinct owners: `details` owns Parasite disclosure state, and one BR client owns the transient selected case. The small row-handler exception is necessary because the existing row enhancement routes clicks outside anchors.

## Tradeoffs accepted

- We accept a small evidence excerpt in each case's frontmatter in exchange for a focused panel that avoids parsing rendered MDX at runtime.
- We accept one explicit row-handler exclusion in exchange for keeping the control beside its case and preserving existing title-link behavior.
- We accept duplicated event-shape code between the two reels in exchange for avoiding a generic interaction framework for two distinct interactions.

## Alternatives considered

A second, hidden Parasite basement button plus a separate Mint panel would preserve the current summary behavior but create two competing discoveries for the same case and duplicate the existing Mint passage. It exposes a second disclosure to maintainers without hiding any meaningful complexity.

A click-to-zoom Esper overlay would keep the table unchanged, but would cover the very case content being inspected, complicate keyboard focus, and break the requested adjacent evidence layout. A shared cross-reel state machine could coordinate both effects, but its options would expose film-specific presentation while hiding little; the existing reel clients already provide the right cleanup boundary.

## Open questions and risks

Does the current `work` content schema permit adding a required `esperEvidence` field without affecting non-home consumers? If it does not, add it as optional in the collection schema and require it only in the BR template's mapped work entries.

## Next implementation step

Confirm the work collection schema and render the controls and evidence mount from the existing homepage `work` array before wiring the BR client.
