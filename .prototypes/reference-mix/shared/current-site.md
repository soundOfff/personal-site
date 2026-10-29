# Current portfolio: working-tree reference

Read from `/Users/User/Tomi/personal-site`, including uncommitted files, on 2026-10-28. Paths below are relative to that project. The public origin in `src/lib/site-origin.ts` is `https://tomasbrasca.xyz`.

## How to use the shared content

- Load `shared/content.js` with a normal script tag; it sets only `window.SITE`, with no imports, fetches, or build dependency. Resolve `media/...` against the `shared/` directory, including image URLs inside `bodyHtml`; script-relative URLs are not automatically document-relative URLs.
- `work` contains all 13 projects in the homepage index order. Each body preserves the showcase narrative, contributions, flow, and media notes from `src/data/project-stories.json`. Mint, Dex, and Conversational portfolio also include their complete MDX engineering case study, identified by `section[data-source]`: `/work/mint`, `/work/dex`, `/work/flagship`. The last belongs to project slug `a2ui`; do not duplicate it as another project.
- Work titles/summaries/stack/category come from `src/data/projects.ts`; roles come from the stories. Tags contain the existing category followed by stack labels. Years exist only for the three MDX studies. `href` uses an external website when available, otherwise the public source repository; source links are also preserved in bodies.
- All 11 posts are included, newest first. Ties preserve the collection's lexical insertion order, matching the current date-only sort in `src/lib/discovery/documents.ts`. Only the homepage's two teasers are featured: job-search notes and binary search.
- Exactly three full post bodies: `data-structures-typescript-python` (7 headings, 8 code blocks, a large table), `building-editorial-ui` (6 headings, 5 code blocks, numbered list), and `what-icpc-trains-you-to-see` (5 headings, 3 code blocks, numbered list and quotation). They deliberately cover different reading structures. Other bodies are omitted.
- Reading minutes are calculated as ceiling(body words / 230), including code text, excluding frontmatter/imports/markup. These replace the hand-authored `readingTime` estimates. The content is preserved, not fact-updated.
- `home` follows the seven rendered sections in order. An `id` is omitted where the section has none; the writing section has only a heading ID, `writing-title`. Navigation contains the four actual main-nav links; the separate header Résumé link is represented by `person.cv`.
- Preserve or remap the original `/blog/...`, `/work/...`, `/showcase/...` and homepage anchor links when building prototype routes. Loading the data from `file://` works; original site-root links still require routing or conversion to the public origin.

## Routes and visible content

- `/`: horizontal wordmark/navigation/résumé header; oversized “Ideas made useful.” hero; selected-project gallery (Sift, FocusQuote, Catcher); blue engineering-experience band (Mint then Dex); filterable 13-project index and expandable GitHub archive; two-column biography; two journal teasers; collapsed “Ask about my work.” Playground; shared contact footer. Source: `src/pages/index.astro`.
- `/blog`: “Thinking out loud.” journal hero, article/theme counts, all 11 articles with pillar/date/title/description/read time, pillar buttons and tag selector, and a project link outro. `src/pages/blog/index.astro`.
- `/blog/<slug>`: article title/dek/author/date/read time, collapsible contents when there are more than two H2s, MDX body, topic links, discussion email, newer/older navigation. Job-search notes include five static SVG diagrams from `src/components/diagrams/`. `src/pages/blog/[...id].astro`, `src/layouts/BlogLayout.astro`.
- `/showcase/<project-id>`: 13 project pages with category/status, title/subtitle, summary, role/stack, external/source/demo actions, screenshots or illustrated cover, contribution story, three-step product flow and next-project link. Catcher has a real controlled video; 60 Seconds has an interactive sample; Letterboxd links to a PDF booklet. `src/pages/showcase/[id].astro`, `src/components/ProjectPreview.astro`.
- `/work/dex`, `/work/mint`, `/work/flagship`: longer engineering studies, year/stack and narrative/real-code badge, conditional contents, prose and previous/next studies. `/work` redirects to `/#work` in `astro.config.mjs`; there is no work index page. `src/pages/work/[...slug].astro`.
- `/404`: “A little off course.” with home and journal links. `/cv.pdf` is the actual résumé download; no `/cv` page is present despite an older source comment. `src/pages/404.astro`, `public/cv.pdf`.
- Discovery/data routes: `/index.md`, `/blog/index.md`, `/blog/<slug>.md`, `/rss.xml`, `/data/portfolio.json`, `/llms.txt`, `/robots.txt`, generated sitemaps and discovery-header endpoints. They expose text/data rather than separate designed screens (`src/pages/`, `src/lib/discovery/`).
- API routes `/api/a2ui`, `/api/hal`, `/api/hal-observe` remain in the tree. The current visible Playground calls only `/api/a2ui` (`src/islands/A2UIPlayground.tsx`).
- `/designs` is a noindex comparison room; `/designs/candidate-1` through `candidate-5`, each with `/blog`, remain separate design previews. Names: Cobalt studio, Editorial, Night shift, Pigment Studio, Tidal Studio. They are not the current homepage. Sources: `src/pages/designs/`.

## Typography and composition

- `src/layouts/BaseLayout.astro` self-hosts **Geist Variable**, **Newsreader Variable** (regular/italic), and **JetBrains Mono Variable**, then imports editorial-ui tokens/styles and finally `src/styles/pigment.css`. No Google Fonts import is used by this layout.
- Geist: navigation, body UI, project titles, large display headings, article H1/H2/H3, table text. Newsreader: italic display emphasis, article reading prose, showcase subtitles and some showcase story headings (later scoped rules win), agent reading text/titles. JetBrains Mono: code, diagrams, showcase step numbers, agent metadata and controls. Pigment's small homepage labels mostly inherit Geist, despite the older library's mono-label convention.
- Hero/journal H1: `clamp(82px, 10.5vw, 180px)`, weight 500, line-height .82, tracking -.09em; italic Newsreader emphasis is blue. Main section titles usually `clamp(42px, 4.8vw, 78px)`. Body labels are generally 11px; supporting prose 13–24px (`src/styles/pigment.css`).
- Shell: `min(100% - 64px, 1440px)`, centered; below 760px, `min(100% - 36px, 1440px)`. Header minimum height 82px, 74px on mobile; it is not sticky. Hero columns 1.8fr / minmax(250px,.55fr); gallery selector 205px minimum / flexible preview. Experience and biography use two columns.
- Project index: 3 columns, 2 below 1100px, 1 below 520px. Hero/gallery/experience collapse below 760px; gallery selectors become three horizontal choices. Journal rows use .31fr / 1fr, becoming single-column below 760px. Showcase summary/story grids and three-step flow collapse below 700px.
- Reading: final `.article-column` max 860px; prose max 720px; article footer max 660px. Prose is Newsreader 21px/1.75, 20px below 600px. Article headings reach 84px; code is 13px/1.7 with 22px padding (12px/16px on mobile). Tables and code scroll horizontally. `src/styles/reading.css` overrides its own earlier 720/660px column/prose declarations.
- There is no shared spacing-token scale in active Pigment CSS: explicit 4/6/8/10/12/14/16/18/20/24/28/30/32/40px controls/gaps and 45–125px section spacing. Common desktop section paddings are 65/80/90/100/110px; mobile mostly 45–80px. Borders are 1px, main cards/controls square; gallery images have a large shadow. `src/styles/pigment.css`, `src/styles/reading.css`, scoped showcase styles.
- The prompt-practice sample intentionally uses a separate system sans stack: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`; max-width 1120px, 14px panels and 9px small radii (`src/islands/prompt-demo/styles.css`).

## Colors: actual cascade

The current BaseLayout explicitly sets `data-theme="light"` and `color-scheme: light`; it has no theme toggle. The dark footer and blue experience band are sections, not a dark-mode switch. These final light overrides are in `src/styles/pigment.css`:

| Tokens | Active values |
| --- | --- |
| `--page`, `--paper` | `#f7f3e9` |
| `--paper-2` | `#efe6c5` |
| `--paper-3`, `--paper-deep`, `--amber-soft` | `#ebd999` |
| `--ink`, `--ink-2` | `#182126`, `#354147` |
| `--muted`, `--muted-2` | `#48545a`, `#59656a` |
| `--line`, `--rule`; `--rule-2` | `#c8c6b8`; `#a3a38f` |
| `--blue`, `--amber-deep`; `--ocher`, `--amber` | `#0024cc`; `#e0b81f` |
| inherited `--blue-soft/ink/edge` | `#e0ebf1` / `#2e5c73` / `#bcd3dd` |
| inherited `--sage-soft/ink/edge` | `#e1ebdf` / `#4a6a47` / `#c6d7c2` |
| inherited `--clay-soft/ink/edge`; `--popup-border` | `#f2ddd3` / `#a04b26` / `#e8c7b7`; `#dad3c2` |

The imported `node_modules/editorial-ui/dist/styles/tokens.css` also defines dormant dark values: paper/paper-2/paper-3 `#1b1814/#221e18/#2a251f`; ink/ink-2 `#f0ebdb/#c9c2ae`; muted/muted-2 `#8c8576/#5e5950`; rule/rule-2 `#2c2822/#383229`; amber-soft `#3d2d14`; page/popup-border `#110f0c/#3b342b`; blue soft/ink/edge `#1e3340/#8fbcd0/#2d4859`; sage `#233326/#a4c49c/#354a38`; clay `#3a241a/#e0967a/#4e332a`. Those are library definitions, not a supported current Pigment dark theme.

The permanently dark prompt sample has bg/bg-2 `#0b0d13/#0f131c`, panel/panel-2 `#151a25/#1b212e`, line/line-2 `#262d3d/#333b4e`, ink/muted/faint `#e7ebf3/#98a2b6/#6b7488`, accent/accent-2/accent-ink `#7c8bff/#a5b0ff/#ffffff`, good/warn/bad `#34d399/#fbbf24/#f87171` (`src/islands/prompt-demo/styles.css`).

## Motion and interactions currently connected

- Navigation is ordinary page loading, with Astro hover-prefetch configured in `astro.config.mjs`; no ClientRouter/view transitions. Anchors scroll smoothly, disabled under reduced-motion. Links underline on hover; keyboard focus shows blue outlines (cream on dark/blue sections); the skip link moves into view on focus. `src/layouts/BaseLayout.astro`, `src/styles/pigment.css`.
- Home: click one of three gallery buttons to show its panel immediately, with `aria-pressed`; no carousel timer or animation. Project-category buttons hide unmatched cards, update a live count, and expose Clear filter, which restores focus to All. Controls are progressively revealed by JS; all projects/gallery panels remain available without it. Archive and Playground use native `<details>`. Buttons change to blue/white on hover or selection. `src/pages/index.astro`, `src/styles/pigment.css`.
- Journal: pillar buttons plus tag select combine filters, update live counts/empty state, and reset together; tag changes update `?tag=` via history replacement. Article topic links open that filter; newer/older/email links and collapsible table of contents complete the reading flow. Blog code/table regions receive keyboard focus attributes; diagrams scroll on narrow screens. `src/pages/blog/index.astro`, `src/pages/blog/[...id].astro`, `src/pages/work/[...slug].astro`, `src/styles/reading.css`.
- Showcase: thumbnail buttons switch screenshots and pressed state immediately; full-size images open in a new tab; anchor actions jump to media; next-project navigation cycles through projects. Catcher video exposes native playback controls; Letterboxd opens the booklet. Illustrated ProjectPreview covers are static. `src/pages/showcase/[id].astro`, `src/components/ProjectPreview.astro`.
- Prompt sample: choose a case, read brief/requirements, type practice text, replay fixed output and judge scores, reset. Typing does not trigger inference or affect sample scoring. Buttons use .06s transform and .15s background transitions, hover colors and a pressed shift; ordinary sample form controls render within the canned UI. `src/islands/PromptPracticeDemo.tsx`, `src/islands/prompt-demo/{blocks.tsx,scorecard.tsx,styles.css}`.
- Playground hydrates on visibility; after expanding the section, its launch button opens a native modal drawer. It supports Close, backdrop click/Escape, Expand/Restore (hidden on small screens), focus management and background scroll lock; closing retains the conversation. `src/pages/index.astro`, `src/islands/A2UIPlayground.tsx`.
- Agent interaction: starter questions, 400-character composer, Enter to submit/Shift+Enter newline, live request/pending/error/quota states, retry/edit, Start over (aborts pending requests), structured cards/tables/diagrams, follow-up action buttons, expandable reply metadata and raw A2UI JSON. Five daily questions per IP are displayed; actual answers depend on the backend. `src/islands/A2UIPlayground.tsx`, `src/islands/a2ui/{Renderer.tsx,components.tsx}`, `src/pages/api/a2ui.ts`.
- Agent scroll: submission scrolls to the latest turn; responses auto-position only if the reader stayed nearby, otherwise a “New reply ready” button appears. Manual Latest reply scroll is instant, not smooth. `src/islands/A2UIPlayground.tsx`.
- Agent motion: drawer slides from right in .3s; blurred backdrop fades .3s; expanded width transitions .26s. Cards/follow-up controls/links transition colors and borders .12s; window controls use .16s background/pressed translation; rendered bar charts sweep .55s after .2s. Reduced-motion disables drawer/descendant animations/transitions. The old staggered .32s reply rise is explicitly disabled by a later rule; skeleton shimmer CSS remains but current pending UI is text. `src/styles/playground.css`.
- The actual editorial-ui Button used by the agent also supplies .12s surface/border/shadow/color transitions and hover/active brightness; Pigment changes its primary background to blue. `node_modules/editorial-ui/dist/styles/index.css`, `src/styles/playground.css`.
- Current main routes have no scrollspy, parallax, cinematic opening, soundtrack, film switcher or back-to-top control. Their old implementations still exist in `src/components/Rail.astro`, `src/styles/global.css`, `src/reels/` and `src/components/WorkflowDiagram.astro`, but BaseLayout/home no longer import them. Agent `reel:cue` events alone do not play audio.

## Separate design-preview behavior

- `/designs` switches miniature portfolio/journal views and their destination URLs (`src/pages/designs/index.astro`). Candidate 1 is Cobalt paper/blue (`#f5f3ee/#173dc9/#1d2928`); candidate 3 is final Night shift forest/lime (`#14201d/#d5ed89/#e2e8d7`); candidate 4 is the Pigment precursor; candidate 5 is Tidal mint/navy (`#a6e6db/#0d2b52/#f4f8f5`). Their Geist/Newsreader typography, layout and hover rules are isolated in each `candidate.css`.
- Candidate 2 uses Geist UI/Newsreader headings and an 8px spacing unit, with a persisted light/dark toggle: bg/text/muted/border/accent/hover `#fafafa/#1a1a1a/#666/#e0e0e0/#2563eb/#1d4ed8` versus `#0f0f0f/#e8e8e8/#999/#2a2a2a/#60a5fa/#93c5fd`. Its blog filters tags via select/URL; homepage cards lift/change shadow and links/surfaces transition .2s. `src/pages/designs/candidate-2/{index.astro,blog.astro}`.
- Candidate 3 lifts its Sift window 8px on hover (.2s) and transitions circular-link colors; candidate 4 switches gallery/category and journal-topic filters; candidate 5 opens project quick-view dialogs (Close/backdrop/Escape) and combines journal text search/topic chips with clear/reset and counts. These previews also use ordinary link hovers and smooth anchors. `src/pages/designs/candidate-{3,4,5}/` (page scripts and candidate styles).

## Uncommitted header/footer change

`src/components/PigmentHeader.astro` replaces the previous rail/chrome with a horizontal “Tomas Brasca ✳” wordmark, Work / Index / Journal / Contact navigation and a separate Résumé link; Journal alone gets the current-page indicator. `src/components/PigmentFooter.astro` adds the full-width ink contact section with “Let’s make it useful.”, Email/GitHub/LinkedIn/Journal/RSS links, current-year copyright and Rosario · UTC−3; the modified BaseLayout mounts both on the main routes.

## Asset coverage and source gaps

`shared/media/` contains 14 images plus `cv.pdf`: 15 files, 1,480,009 bytes total. Homepage previews are prioritized, then Sift/FocusQuote/Dex/Dana screenshots and Letterboxd scenes 1–3. Sift's first showcase screenshot is byte-identical to `sift.png` and shares that file. Letterboxd scenes 4–5, its booklet PDF, the Catcher MP4, unused Sift settings screenshot and global social OG image were not copied; source routes/assets above identify them. No avatar/portrait or per-post cover image was found in the requested sources; `public/images/` has no image files. No missing years, URLs or portraits were invented.

The Flagship MDX still describes recorded transcripts/demo-by-default, but the current A2UI island starts with an empty live conversation; the case-study prose is preserved verbatim while the behavior inventory follows the code. The three historical router articles likewise retain their original context and update notices. Prototype authors should treat those statements as article content, not instructions to recreate removed UI.
