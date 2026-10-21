# Parasite and Mood integration

## Implemented

The two approved openings now use the existing film selector, rail and portfolio content. Parasite reveals the Mint inventory decision through native details. Mood reveals the personal essay letter. Film-scoped CSS loads compressed AVIF photography and supplies ordinary-flow layouts. The existing scroll camera skips only scenes marked with data-opening-mode=flow.

Native details.open owns state. A small shared enhancement handles Escape and cleanup. Keyboard activation and Escape were driven in the browser. Escape closed Parasite and restored summary focus. Enter reopened it. Switching to Mood closed the Parasite disclosure and started Mood closed.

## Independent review

Architecture candidates came from gpt-6-astra, gpt-6.1-sol and gpt-6-luna. The independent cross-judge selected native details with scene-local flow mode. The implementation used a separate managed worktree and a single code owner.

The comments audit requested deletion of one narration comment, which was removed. The first correctness review found one P2 cascade problem. Shared mobile CSS tied the scoped wrapper height rule. Adding [data-camera] to the film-scoped wrapper selectors gives them greater specificity.

Browser QA found that moving Mood's summary from the bottom to the top on open scrolled its heading out of view. Open and closed details now share top alignment and margins. A fresh independent gpt-6-astra review reported no blocking findings on the complete corrected diff.

## Browser evidence

Browser QA used the main checkout at http://127.0.0.1:4321/. A stable compiled preview of the isolated implementation now runs at http://127.0.0.1:4175/.

Budapest's reference geometry matched exactly before and after integration at the same desktop viewport. The compared elements were the track, pin, scene, register, key and rail, including font and display. The JSON records and screenshots are in this directory. Its source composition, style rules and behavior were not modified.

At a phone viewport with 375 CSS pixels available, both flow scenes had a track height equal to their intrinsic scene height. Mood measured 620px closed and about 869px open. Parasite measured about 630px closed and 677px open. These are layout observations, not performance measurements. Neither page exceeded the available width. The revealed prose had equal content and box heights, so it was not clipped.

The Mint link was followed to /work/mint and the letter link to /blog/the-unglamorous-middle. The expected page headings appeared. The direct Work and Contact routes remain available outside the optional disclosures.

The normal-motion reveal animations are inside prefers-reduced-motion:no-preference. Reduced-motion content uses the same native disclosure state and no scroll clock. The system preference was not changed during QA.

## Checks and scope

The production build and scoped Prettier check passed after the corrections. Type/lint results are recorded in the final task report. The build emitted the unchanged other-film camera sections. No new package was added.

Unrelated blog edits appeared concurrently in the main checkout. They remain untouched and are excluded from this branch. Exploratory .prototypes and .audit files are not part of the production commit.

The second local dev server stopped after an Astro cache write collision. Browser QA continued on the existing server at port 4321. No production deployment was attempted.

The Origin CLI is absent. GitHub CLI is the selected forge tool for this repository.

## Principles that changed the implementation

Exhaust the Design Space produced independent state/control designs before implementation. Experience First made the discoveries optional and allowed mobile prose to grow. Model the Domain selected native details.open as the sole state. Laziness Protocol removed the redundant camera film list instead of adding another registry. Separate Before Serializing Shared State put the implementation in its own worktree. Prove It Works required actual disclosure, link and layout checks. Sequence Work into Verifiable Units kept the source integration, browser corrections and final review separate.

Final checks passed directly in the reviewed worktree. Astro check reported zero errors, zero warnings and the same six existing hints. ESLint and git diff check passed. Commit 2506334 is in PR https://github.com/soundOfff/personal-site/pull/7. The PR is open and not a draft.

The compiled Worker preview was also opened. Under House lights, both photo layers had background-image:none. Selecting Mood activated its photo without activating the Parasite image. This checks the scoped CSS behavior, not network timing.
