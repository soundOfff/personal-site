# Candidate C rationale

The design treats the blog as a personal publication with one shared visual language. A restrained paper-and-ink palette, Newsreader headings, compact Geist controls, and sparse amber link details fit the self-hosted type and existing theme tokens. The index gives dates a stable reading position and lets titles carry the hierarchy. Article pages use a narrower reading measure and keep author, date, and reading time together above the text.

The existing data shape already matches the job: a date-sorted collection of published posts, each with metadata and tags, rendered as an ordered list. I kept that shape, the topic select, and its `?tag=` URL updates. The updated count announces filter changes to assistive technology. The article page continues to render the existing MDX headings and content without changing route, metadata, or hash IDs.

Code blocks, tables, and diagram wrappers scroll within their own width. The page and reading column set `min-width: 0` so those wide elements cannot stretch the document. Focus outlines cover links, controls, summaries, and keyboard-scrollable diagrams. Print rules remove navigation and controls, restore a readable article measure, and expose external link destinations. The site's global reduced-motion rule already disables smooth scrolling and transitions, so no duplicated motion override was needed.

`BlogLayout` still composes `BaseLayout` directly. It imports the neutral blog stylesheet, contains no `ReelHead`, and has no film/runtime branching. The page-level style uses the shared site tokens and fonts, so the appearance stays coherent across every film.

| Considered | Decision | Reason |
| --- | --- | --- |
| Topic chips for every tag | Kept the existing select | There are many tags; the select preserves deep links and stays operable on narrow screens without a large filter bar. |
| Card grid for posts | Rejected | Dates and titles scan faster in a chronological list, and the existing publication has no cover art to make cards useful. |
| Wider article measure | Rejected | Long technical paragraphs, code, and tables benefit from a focused text column; wide material gets local scrolling. |
| Separate dark-mode stylesheet | Rejected | Existing tokens already follow the theme preference and the toggle in `BaseLayout` persists user choice. |
| Extra diagram behavior | Rejected | Existing diagrams are labeled, keyboard-focusable regions; local horizontal scrolling is enough to access their full width. |

The only source change outside CSS is `aria-live="polite"` on the existing result count. The four-file patch stays limited to the assigned blog layout, index, article page, and stylesheet paths; unchanged files do not appear in the patch.

The throughput checkpoint was satisfied in one owner because the shared shell, index, article, and stylesheet need one design decision and the assigned worktree isolates all source changes. There were no independent workstreams to dispatch. The parent owns Astro checks and the final browser comparison, as required by the brief. I ran `git diff --check` and Prettier's check on the four owned files; both passed. I did not run Astro build, check, or dev.

The frontend-design skill and `Experience First` shaped the choice to keep the index and article deliberately quiet and limit the UI to the existing filter. `Model the Domain` shaped the choice to retain the existing post-and-tags model instead of adding another filter state structure. `Laziness Protocol` shaped the decision to reuse theme tokens, global reduced-motion behavior, and existing diagram wrappers rather than add a new component or dependency. `Unslop` shaped this rationale by keeping copy literal and specific.
