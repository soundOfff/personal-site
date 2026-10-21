# Candidate B. The service seam and evidence margin

## Problem
Both interactions should feel like opening a concealed part of an existing object. Parasite already owns a native disclosure; BR already owns case rows with working navigation. Keep those owners and expose optional evidence in normal flow.

## Usage, written first
```ts
// parasite/client.ts, replacing its current disclosure mount call.
const stopPassage = mountServicePassage(ctx);
// br2049/client.ts, alongside memoryLab, not inside it.
cleanups.push(mountEsper(ctx));
```
```astro
<!-- index.astro, existing entries paired with await render(w) at build time. -->
<tr data-href={`/work/${w.id}`}>
  <!-- Existing title anchor and metadata remain. -->
  <template data-case-evidence>
    <Content />
  </template>
</tr>
```
The template belongs inside the existing `.proj` cell, not directly under `tr`. `mountEsper` adds an Inspect button beside that cell's title and creates one evidence margin for the work section. Callers do not coordinate selection, positioning, animations, or teardown.

## Shape
```ts
// Private BR domain after reading the rendered row once at mount.
type Case = {
  readonly row: HTMLTableRowElement;
  readonly trigger: HTMLButtonElement;
  readonly title: string;
  readonly href: string;
  readonly evidence: HTMLTemplateElement;
};
type EsperState = { readonly kind: 'closed' }
  | { readonly kind: 'inspecting'; readonly selected: Case; readonly detail: number };
export function mountEsper(ctx: ReelContext): () => void;
export function mountServicePassage(ctx: ReelContext): () => void;
```
Astro renders each existing work entry into its inert template at build time using `render(w)`. Esper derives its evidence from the real Architecture and The key tradeoff sections, taking each heading and following siblings until the next heading. It keeps native paragraphs and lists. Clone only those sections into the panel and remove copied element IDs. If headings change, fall back to the existing row description and case link. Dex exposes classify/dispatch/eval gating; Mint exposes cached reads/transactional checkout; Flagship exposes its catalog and budget. No separate claims, project registry, Markdown parser or frontmatter schema are introduced.

Parasite uses the existing `details.open` as its sole state. Do not mirror it with a second boolean. Retain `mountOpeningDisclosure` for Escape and abort behavior; the dedicated wrapper adds only bounded visual transitions. Model the Domain shaped this choice and Esper's closed/selected union.

## Interaction
Parasite's summary becomes a readable book spine, “Service passage · pull to open”, resting at the lower edge of the house photo. A visible seam, angled spine and small floor marker make discovery explicit. Activation tilts the spine, slides a narrow shelving panel sideways, then unfolds the existing B1 vignette below the image. The house remains visible and the following page moves down. The shelf motion is decorative within the frame, never over text. The Mint vignette stays the sole hidden floor.

BR places an amber Inspect affordance beside each unchanged title link. Clicking it selects that case and reveals an evidence margin on the right of the table. A thin line and case number connect the selected row to the margin. The panel starts with a coarse complete overview; “Enhance detail” advances through the available evidence sections, revealing sharper typography and a bounded rectangular scan. These are real case claims, labelled as narrative evidence where appropriate. A normal “Read case study” anchor stays visible throughout. No pointer tracking or image asset is required.

On narrow screens the same panel moves into a generated `tr > td[colspan=4]` immediately after the selected case. One `matchMedia` listener chooses the host. On wide screens its host is a normal-flow aside beside the table in a generated grid wrapper. Moving the one panel avoids two copies, synchronized focus state, or hidden duplicate links.

Inspect's click listener calls `stopPropagation`, never `preventDefault` on anchors. The existing global row handler stays unchanged. Clicking elsewhere in a row still opens the case. Panel clicks also stop bubbling when its mobile host is within the table.

## Motion and accessibility
Native summary supports touch, Enter and Space. Inspect and Enhance are real buttons with 44px targets. Inspect exposes `aria-expanded` and `aria-controls`. The panel has a labelled region, a close button, and a short polite status announcing selected case and detail number. Selection does not steal focus; Escape closes and returns focus to the initiating control. Enhance always preserves the full overview and link, so a cinematic reveal never withholds the essential information.

Use one finite WAAPI animation per activation, cancel before replacement, and settle to the latest selected state. Passage animates measured content height and a small shelf transform. Esper animates a clipped decorative scan and evidence opacity over approximately 300ms. Reduced motion renders the settled state immediately, including after preference changes. No fixed panels, scroll capture, autoplay, perpetual frames, or paid calls.

## Module map
- `openings/Parasite.astro` owns the book-shaped summary and existing Mint vignette.
- `parasite/service-passage.ts` owns disclosure animation; its client owns the cleanup handle.
- `parasite/reel.css` replaces the existing full-frame open-state swap with flow expansion.
- `pages/index.astro` renders actual work MDX into inert evidence templates within its existing work iteration.
- `br2049/esper.ts` owns row discovery, generated controls, one panel, selection and responsive hosting.
- `br2049/reel.css` owns active-reel presentation. `client.ts` installs the mount beside existing mounts.

No Stage/config change is needed. Esper belongs to the existing work DOM and only exists during BR's client mount. This avoids an unrendered stage branch or passing collection data through the stage renderer.

## Tradeoffs and alternative
Accept one responsive DOM relocation in exchange for preserving table markup and showing evidence beside the exact selected case on mobile. Accept additional inert HTML in exchange for source-backed rich evidence with no duplicated claims or browser Markdown parser. Laziness Protocol shaped the two mount-only APIs and the decision to leave the shared row handler alone.

Rejected alternative. Render a second case browser in `after:work` with its own case selector. It hides row ownership inside a component, but asks readers to find their case twice and requires a second rendered index. Its interface is smaller for the implementer and worse for the reader. A per-row disclosure is simpler on mobile but cannot create a right-hand evidence margin without changing table layout or duplicating panels.

## Reconciliation and first step
Candidate only; no implementation deviations exist. First change Parasite's open geometry and verify the existing disclosure, then render the existing case templates and mount Esper. Verify native navigation, repeated selection, Escape, narrow/wide relocation, reduced motion and switching reels mid-animation. Cleanup cancels animations and listeners, removes generated nodes, unwraps the table and restores every changed attribute. Remount starts closed. Main implementation risk is table width at intermediate breakpoints; select the side layout only when both table and margin fit, otherwise use the inline host.
