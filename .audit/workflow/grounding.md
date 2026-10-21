# Workflow integration grounding

Read-only investigation, 2026-10-21. Read poteto-mode, how, and Codex mapping. No child delegation.

## Current flow

- `src/data/site.ts:57` owns the four `tenets` as title/body records.
- `src/pages/index.astro:8,211` imports them and renders `.tenets > .tenet` inside `#principles[data-sec='6']`.
- The section preserves `Stages at="in:principles"`, the `Keybar`, and the following `Stages at="after:principles"`.
- `src/data/site.ts:39` supplies the rail link label. Keep its `principles` ID and “how I work” wording.
- `src/lib/portfolio/snapshot.ts:73,168` flattens tenets into `PortfolioSnapshot.principles`.
- `src/lib/portfolio/retrieve.ts:184,245` carries that field unchanged into every agent context. It is not independently ranked.
- `src/pages/data/portfolio.json.ts` emits the static snapshot. `src/pages/api/a2ui.ts:124` uses the memoized snapshot in the Worker.
- Production searches found no other tenets data consumers. Historical design canvases under `docs/adr/design/` are archival.

## Smallest clean integration

- Replace `tenets` with one typed workflow value in `src/data/site.ts`, or a sibling data module if the content needs space.
- Suggested shape has introduction, ordered stages, stage title/body, skill labels and URLs, plus a short return-loop label.
- The homepage renders the ordered stages as an accessible HTML diagram. CSS connectors can be decorative and `aria-hidden`.
- Derive the snapshot’s existing `principles` title/body array from those same stages. Include meaningful skill names in its body text.
- This retains the public snapshot contract and retrieval plumbing while replacing the stale meaning from one source.
- If richer workflow structure must reach the agent, add an explicit `workflow` field and migrate snapshot and retrieve together. There is no benefit for the basic diagram.
- Preserve `#principles`, `data-sec='6'`, and both stage hooks. Renaming this section ripples through the reel SectionId union, acts, client indexes, and scenery.
- Do not put private absolute filesystem paths in public content. Public workflow descriptions can name the tools without exposing local configuration.

## Theme coupling and hazards

- Use fresh `.workflow-*` selectors rather than carrying `.tenets/.tenet` forward. Old selectors impose incompatible layout rules on a diagram.
- Base tenet CSS is `src/styles/global.css:1766-1793`; its phone collapse is near 2377 under max-width 600px. An earlier tablet comment near 2300 also names tenets.
- Odyssey `reel.css:1552-1607` forces four columns, 280px panels, inset glow, and a 22px hover lift. It becomes two columns at 1100px and one at 600px.
- Budapest `reel.css:2386-2434` adds framed panels and replaces numbers with Roman-numeral pseudo content. It collapses at 820px.
- Blade Runner `reel.css:1761-1804` uses a one-column neon list, alternating left offsets, and 34–48px headings. It has additional mobile and hover title rules near 2054, 2104, and 2340.
- Mood `reel.css:2276-2297` adds 58px outlined numerals and larger titles. Its max-width 960px block near 2824 forces one column.
- Parasite `reel.css:1259-1287` changes gap, numbers, and headings. The fluorescent fixture targets `[data-sec='6']`, so it survives the new component.
- Replacing markup without cleanup leaves dead tenet styles in all five reels and the base stylesheet. Remove only tenet-specific rules and preserve shared selectors in grouped rules.
- Four clients attach tenet hover sounds. Odyssey `client.ts:234`; Budapest `client.ts:132`; Blade Runner `client.ts:334`; Mood `client.ts:335,348`.
- Either migrate those sound hooks to workflow stages or remove their tenet branches. Mood’s `tenet` score export has an independent sound-board entry and need not be deleted.
- Odyssey `observations.ts:50-57` explicitly describes evaluations, caching, and limits. Update its context and spoken lines to match the new workflow.
- Budapest `Stage.astro:31` calls this section “House Rules”. Consider a workflow-appropriate label. Other reel configs use cinematic scene slugs, not content claims.
- `src/reels/Slugs.astro` derives scene labels from config. Keybar currently renders its passed plain label directly and does not consume `sec` in markup.
- Stage hooks also anchor Mood scenery and Odyssey’s after-principles star gate. Section height changes deserve a live scroll check.

## Verification boundary

- Check the rendered diagram and `/data/portfolio.json` contain the same ordered workflow and no old tenet claims.
- Check default plus all five reels at desktop and phone widths, with no horizontal overflow and readable connectors/order.
- Check reduced-motion layout and section navigation. Use `npm run check`, lint/build, and direct browser observation for the actual artifact.
