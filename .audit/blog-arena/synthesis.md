# Blog arena synthesis

## Decision

Candidate A is the base. All three candidates completed and built. Parent read every candidate end to end and rendered each archive/article combination. An independent gpt-6-astra source judge also chose A. The runner panel used gpt-6-astra, gpt-6.1-sol and gpt-6-luna, at high effort, in isolated worktrees.

A gives the publication one consistent serif hierarchy, a 660px reading measure, 21px Newsreader body text with 20px on mobile, readable Geist metadata and scoped neutral colors. Its compact navigation and honest filter empty state make it the strongest complete base. B also has comfortable article text but its different archive typography and taller mobile navigation were not adopted. C preserved too much small interface typography and had incomplete print/keyboard handling.

| Criterion | Parent A / B / C | Judge A / B / C |
| --- | --- | --- |
| Long-form readability | 5 / 5 / 3 | 5 / 5 / 3 |
| Minimal editorial identity | 5 / 4 / 3 | 4 / 5 / 4 |
| Browsing/navigation | 4 / 4 / 3 | 5 / 4 / 3 |
| Robustness/accessibility | 4 / 4 / 3 | 4 / 4 / 2 |
| Maintainability/integration | 4 / 4 / 4 | 4 / 4 / 4 |

The judge tied A and B at 22/25 and preferred A's scoped styling and complete tag behavior. Parent preferred A's rendered coherence. Both chose the same base.

## Grafts and rejections

- B's simpler introduction removes the redundant Notes & essays eyebrow and its index-only grid rule.
- B's single named article element removes A's extra outer wrapper while preserving title, metadata, body, topic navigation and footer together.
- B's accessible table name clarifies keyboard targets while preserving native table semantics. A's code regions and existing diagram regions remain focusable.
- B's narrower diagram selector assigns the readable minimum width only inside a scroll wrapper.
- Remove A's unused publication data marker. Its shell class already identifies style ownership.
- Do not mix the two typographic systems. Keep A's book-like archive and article hierarchy.
- Do not add B's optional popstate behavior. The current filter replaces its existing URL entry, so this did not solve an observed problem.
- No separate C graft is needed. Its useful local overflow/focus ideas already converge with A/B. Reject its print URL expansion and small metadata.

## Principles applied

Separate Before Serializing Shared State gave each writer an exclusive worktree and kept Astro builds sequential because node_modules is shared. Model the Domain retained the existing published-post collection and represented each filter record as its element plus JSON tag array. Laziness Protocol kept one shared BlogLayout/blog.css and removed a redundant article wrapper. Redesign From First Principles made the publication independent of film decoration at its existing layout boundary. Prove It Works required rendered and interaction checks after integration, plus checks of all built article text and metadata.

## Verification

- Final npm run check passed with 0 errors, 0 warnings and 6 existing hints. Final build, ESLint, Prettier and whitespace checks passed. All three candidate builds passed.
- verify-content.py passed on all candidates and the final build. All 12 blog routes retain their original title/description/canonical and article body text. Every route has one h1. No film stylesheet hooks appear. MDX files are untouched.
- A byte/hash comparison with the frozen source snapshot confirms that only the four authorized blog files changed. Original dirty work outside this task is preserved.
- Archive filtering showed 3 matching evals articles. An unknown tag stayed visible with an honest zero-result state. Clearing restored 11 posts while retaining unrelated query parameters and the hash.
- Integrated mobile frames rendered at 390px and 320px. Native interaction exercised topic selection, expanded contents and a heading jump. A technical table remained within its local scrolling region and retained its accessible name. Screenshots are saved beside this note.
- Integrated article rendered in both color modes. Measured body text is 21px/34.65px at a 660px measure in the current 733px window. Keyboard focus reaches a labeled code region. No document overflow was measured.
- Computed-color contrast against the page is 14.33:1 body, 5.57:1 metadata and 6.84:1 links in light mode; 14.40:1, 7.92:1 and 9.56:1 in dark mode.
- Real UI film switches settled before each observation. Parasite, Blade Runner, Budapest and Odyssey all opened an identical neutral blog, with no root reel attribute or film stylesheet hooks and no document overflow. film-independence.json contains the readings. An initial probe read the transition too early; it was discarded and repeated using an explicit settled-film wait.
- Independent added-comment review found zero comments, suppressions, deletion requests or MUST KILL flags. Parent grafts add no comments.
- Print CSS and reduced-motion overrides were inspected in source. Runtime print preview and OS preference emulation were not available in the browser driver, so these are not claimed as rendered tests. Mobile uses embedded browser viewports rather than physical devices.

No deployment, push or PR was performed. Candidate patches/rationales, independent verdict, screenshots and final.patch remain beside this synthesis.
