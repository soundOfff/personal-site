# Candidate B

A quiet personal publication with a warm neutral ground, a restrained olive link accent, and a clear division between browsing and reading. Every film receives the same blog. BlogLayout continues to compose BaseLayout directly and never imports ReelHead or the film runtime.

The archive pairs a large Newsreader title with the existing introduction, then gives article titles and descriptions a consistent row. Dates sit in a narrow margin on desktop and above their title on mobile. Geist article titles distinguish the archive from the serif reading experience. Metadata is 12–13px instead of the former 9–10px. The native topic select keeps the archive small enough to scan.

Articles use 22px Newsreader text in a 700px column, reduced to 20px on mobile. Headings establish clear section boundaries without decorative labels. Contents remain a native disclosure, which avoids placing a long directory between the title and first paragraph. The article footer exposes existing tags as links to the matching archive filter. All title, description, date, pillar, reading time, and MDX content stay intact.

The fixed blog palette controls its own background, text, rules, diagrams, focus rings, and selection in light and dark modes. The self-hosted Newsreader, Geist, and JetBrains Mono imports stay in BaseLayout. Theme storage, system preference, SEO, canonical URLs, RSS, and article structured data retain their existing owner.

Wide tables, code, and diagrams scroll locally. Diagram wrappers retain their existing keyboard focus. Code and tables receive a keyboard target without replacing the native table role. Print rules remove navigation, retain article metadata, wrap code, use black syntax text, and shrink diagrams to the printable measure. This design adds no motion. The existing global reduced-motion preference remains effective.

| Considered approach | Decision |
| --- | --- |
| Sticky side contents rail | Rejected because it would compete with the reading column and add a second layout to maintain. |
| Uniform sans-serif reading text | Rejected because the serif reading column gives the publication a clear typographic identity using an already hosted font. |
| Topic chips or search | Rejected because eleven posts need a small native filter more than additional controls. |
| Featured article and cards | Rejected because a chronological archive should keep every title easy to compare. |

Model the Domain shaped the filter data. Each rendered entry carries its JSON tag array and the script keeps that array next to its element. This removes the comma-delimited tag protocol. Unslop shaped visible copy. The existing introduction and article descriptions remain unchanged; the decorative eyebrow and title punctuation are removed.

The throughput checkpoint used the four source files as one unit. Reading BaseLayout, global prose rules, and representative posts was the blocking step. There were no independent implementation workstreams within this candidate. The exclusive worktree removes shared source writes. One owner kept layout, markup, and CSS consistent while the arena provides independent design alternatives and review.

Prettier completed for all four owned files. ESLint completed for all three Astro files. `git diff --check` passed. Astro builds, checks, development servers, browser inspection, and live APIs were intentionally left to the parent coordinator under the arena instructions. Visual appearance and production rendering remain unverified in this candidate environment.

The deliverable patch contains only the four scoped source files against baseline `871b04bc9eb675d18a6c99f958c091760ff86d6e`.
