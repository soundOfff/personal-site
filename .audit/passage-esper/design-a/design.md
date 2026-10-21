# Native passage and per-case Esper drawer

## Usage (caller’s view)

Visitors pull a visibly offset book to open the existing Parasite basement. The book remains the native summary control. The shelf swings aside and the existing Mint story appears behind it. Visitors choose “Inspect” beside a Blade Runner case to unfold an Esper drawer directly under that case; its ordinary title link still navigates.

```ts
// Existing Parasite client, unchanged public contract.
const stopOpening = mountOpeningDisclosure(scene, ctx.signal);
// Blade Runner client, alongside memoryLab(ctx).
cleanups.push(mountEsper(ctx));
```
```astro
---
const renderedWork = await Promise.all(work.map(async (entry) => ({
  entry, ...(await render(entry)),
})));
---
<!-- Within the existing .proj cell in work.map. -->
<template data-esper-case>
  <article aria-label={`${w.data.title} evidence`}>
    <h3>{w.data.title}</h3><p>{w.data.description}</p>
    <dl><dt>System</dt><dd>{w.data.stack}</dd>
      <dt>Recorded</dt><dd>{w.data.year}</dd></dl>
    <a href={`/work/${w.id}`}>Read the case study ↗</a>
  </article>
  <div data-esper-source><Content /></div>
</template>
```
Change the existing row iteration to `renderedWork.map(({ entry: w, Content }) => ...)`. Import Astro’s `render` with `getCollection`. Templates are inert outside BR and derive from the same entry as the visible row. No second project list or content registry exists. The client clones the first nonempty semantic paragraph from `data-esper-source` into the evidence article, then discards the source wrapper from the clone. This supplies actual case prose without copied frontmatter; the existing description is the fallback if a case has no paragraph.

## Shape

```ts
type Cleanup = () => void;
type Capture = 'overview' | 'system' | 'record';
type EsperCase = Readonly<{
  row: HTMLTableRowElement;
  trigger: HTMLButtonElement;
  drawer: HTMLTableRowElement;
  evidence: HTMLElement;
}>;
type EsperState =
  | { kind: 'idle' }
  | { kind: 'inspecting'; case: EsperCase; capture: Capture };
export function mountEsper(ctx: ReelContext): Cleanup {
  throw new Error('not implemented');
}
```
`mountEsper` solely owns state, injected controls, drawer nodes, and bounded animations. Internal DOM discovery accepts only rows containing a valid template and title anchor. Each valid row gets an Inspect button and a sibling drawer row with one `td colspan="4"`. Invalid rows retain normal reading and navigation. State holds the case object directly; no parallel selected index or duplicated identity map.

Only one drawer is open. Selecting another closes the previous drawer and reveals the new one. Selecting the active trigger closes it. The drawer contains three ordinary buttons, “Overview”, “System”, and “Record”, and the evidence article. These select an outlined target inside the evidence and move the viewfinder crop. Actual text always remains readable outside the decorative crop. No drag state or gesture recognition is required.

## Interaction and motion

Parasite’s summary becomes a book spine with the accessible label “Open service passage”. Opening tilts the book, rotates a noninteractive shelf face about its left edge, then reveals warm stair light and the existing Mint content. Content remains ordinary disclosure content with its native link. Keep the summary available after opening with “Close service passage”. The current helper provides Escape and focus return. Use `details[open]` as the single state source. Animate entry only if native closing cannot be animated reliably; do not invent a second disclosure state for a closing flourish.

The shelf and viewfinder are decorative DOM or SVG, `aria-hidden`, with no input interception. Parasite’s hidden native content cannot remain tabbable. The frame stays in normal flow; opening cannot cover the introduction or downstream reading.

Esper uses a finite 320 ms scan when a case opens and a 220 ms reticle translation when a capture button is activated. A brief sharpen from blur to clarity gives the photographic effect. A cropped enlargement belongs in the left drawer column and readable evidence in the right. On narrow screens evidence follows the image. The drawer is immediately after its source row at every width, preserving reading order.

Inspect buttons stop their own bubbling `click` before the existing row navigation listener. Do not install a table-wide click interceptor. Native title and case-study anchors remain untouched. Drawer rows have no `data-href` and therefore no inherited row navigation enhancement.

Pointer click, tap, Enter, and Space activate the same native buttons. Focus stays on Inspect when opening; Tab enters the adjacent drawer. `aria-expanded` and `aria-controls` describe the relationship. Escape inside the drawer closes it and restores its trigger. Capture buttons use `aria-pressed`; an understated polite status announces the selected case and capture. No hover-only evidence.

Reduced motion removes transforms, blur, scans, and animated duration. Evidence and state changes remain immediate. Abort cancels owned animations, removes every injected button/drawer, and clears state; cleanup is safe twice. No timers, persistent RAF, global keyboard listener, or shared reel state.

## Module map

- `src/reels/openings/Parasite.astro` owns shelf/book decoration and existing basement semantics.
- `src/reels/parasite/reel.css` owns the passage’s bounded animation and responsive layout.
- `src/reels/openings/disclosure.ts` retains its current interface and shared Escape behavior.
- `src/pages/index.astro` emits inert evidence templates from existing work entries.
- `src/reels/br2049/esper.ts` owns all Esper behavior behind `mountEsper(ctx)`.
- `src/reels/br2049/client.ts` calls the mount and registers its cleanup.
- `src/reels/br2049/reel.css` owns drawer, reticle, and reduced-motion presentation.

## Rationale and tradeoffs

Native disclosure keeps passage state and accessibility in the browser. Per-case drawers make the relation between work and evidence explicit, avoid measuring table rows against a remote side panel, and preserve locality on mobile. One mounting interface hides DOM validation, click ownership, focus, lifecycle, and animation cancellation. Its only exposed dependency is the existing reel lifecycle.

We accept full case-body markup in inert templates for build-time content correctness and no custom Markdown parser. We accept repeated drawer scaffolding while mounted for adjacent layout and no relocation races. Esper combines actual case prose with existing system and date fields. The excerpt remains sourced from the case body when the author edits it.

## Alternatives considered

A shared workstation beside the whole table reuses one evidence node and presents a larger image. It hides rendering behind one mount, but requires selected-row tracking, responsive relocation, and focus restoration across distant controls. It loses the immediate relationship between a chosen case and its evidence on phones.

A full-screen cinematic viewer introduces dialog ownership, focus trapping, scroll restoration, and obstruction. It cannot satisfy unobstructed reading as directly.

## Synthesis and reconciliation

Candidate only. The parent chooses the synthesis. No implementation deviations exist yet. Verify real-browser table layout and native summary focus before accepting styling; verify title navigation, keyboard/touch activation, Escape, reduced motion, and abort during a scan before considering the feature complete.
