# Candidate A

Readers get an index with larger titles and readable metadata, followed by articles set in Newsreader at 21px with a 660px measure. The publication uses warm neutral backgrounds and a restrained green link color. Its header, dates and controls use Geist. There are no cards, animation sequences or film references.

The index opens with an asymmetric title and short description. Dates form a small left column on desktop. On phones, each date sits above its title and description. The topic selector remains native, and each article ends with links to its topics. These links use the existing tag query protocol.

The article title and summary occupy a 720px measure. The body narrows to 660px. This gives the title room while keeping long paragraphs comfortable. A native disclosure preserves the table of contents without placing a persistent sidebar beside the text. Each heading keeps its original ID. The article element now includes its title, metadata and body.

The shared BaseLayout still owns canonical URLs, structured data, RSS discovery and color preference persistence. BlogLayout does not import film code. Blog palette and font tokens are explicitly scoped to the presence of the publication shell, so this design does not depend on a film token set.

## Alternatives considered

| Direction | Decision |
| --- | --- |
| Dense technical notebook with monospace metadata and sans-serif body | Rejected. It keeps technical material compact but repeats the original small-label problem and makes longer essays feel like interface documentation. |
| Magazine cover with a featured article, thumbnail cards and oversized introductory copy | Rejected. Eleven posts do not need a promotional hierarchy, and this would compete with the actual titles. |
| Book-like single publication with a chronological list | Selected. The content supplies the variety. Serif body text, a fixed reading measure and quiet navigation support both technical guides and personal essays. |
| Persistent desktop contents sidebar | Rejected. The existing collapsible contents meet the navigation need with less visual weight and fewer responsive states. |

## Domain and implementation choices

Model the Domain shaped the filter data. The index script holds one array of records containing each entry element and its tag array. Tags are serialized as JSON rather than a comma-delimited string. The native select is the sole selected-topic state. Known tag links filter immediately. Unknown tag links show their actual value and an empty state instead of silently removing the requested tag. Changes preserve unrelated query parameters and hash links.

Code and tables scroll inside their own bounds and receive keyboard focus. Existing diagram scroll regions retain their labels and tab stops. Diagram figures remain at a readable width inside those regions. Print rules wrap code, fit tables, preserve diagrams, remove controls and enforce light colors even when the saved theme is dark. Reduced-motion users retain immediate anchor scrolling.

The intended maintenance cost is four source files with no added dependency. No MDX content, frontmatter, homepage, HAL, A2UI, RSS implementation or URL paths changed.

## Verification

Prettier passed on all four owned files. ESLint passed on all three Astro files. Git diff whitespace checks passed. An isolated Node execution of the actual inline filter script passed known-tag, unknown-tag and unfiltered cases, topic changes, clearing the filter, unrelated query preservation and hash preservation.

Astro build/check/dev and browser verification were explicitly reserved for the parent. They were not run here. The CSS layout, actual visual contrast and print rendering still require the coordinated browser pass. This candidate is ready for that comparison, not represented as visually verified.

## Throughput checkpoint

The blocking reads covered the four owned files, BaseLayout, the relevant global prose and diagram rules, representative posts, and the requested skills. One agent owned this complete candidate because its layout and typography decisions span all four files. The worktree was exclusive. Shared node_modules was only read by formatting and lint tools. No build or cache-mutating tool ran. Parent agents own the independent comparison, build and final verification.
