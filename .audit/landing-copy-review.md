# Landing copy review

The copy now introduces Tomas's work directly. It retains the existing layout, film interactions, links, technical stack, dates, and personal proof points.

## Main edits

| Area | Before | After |
| --- | --- | --- |
| Introduction | A general claim about which model most LLM calls need | Web and mobile apps, their APIs, and the work at Dex and Mint Mobile |
| Work teasers | Claims about correctness, speed and production scale | A description of the systems and the author's contribution |
| Practices | Absolute rules about shipping, kill switches and ceilings | Evals, cache decisions, request limits and regression cases |
| Projects | Product pitches and terms such as companion, workspace and taste model | The app's purpose, what it saves or tracks, and the existing implementation status |
| Activity | Commit-style imperatives and launch slogans | Past-tense completed work and ongoing project work |
| Agent | Protocol jargon in ordinary controls and error messages | Clear questions, a useful action, and a plain next step when unavailable |
| Film openings | Abstract slogans about signal, character and unseen work | Short introductions to the work, projects and linked articles |

## Grounding and scope

- Existing portfolio content and CONTEXT.md support the full-stack, web, mobile and backend scope.
- The Dex and Mint case studies support the employer summaries. The text says helped build where the source describes a team contribution.
- The existing project descriptions and log support the Sift, Second Brain, On-Call, Curation Archive and Dana descriptions. No adoption, revenue or performance numbers were added.
- Five questions is a per-IP allowance. The revised text does not describe the shared KV quota as a strict spending cap.
- Existing author-confirmed personal accounts and proof points remain intact.
- Only work titles and descriptions were changed in the case-study files. Their bodies were not rewritten in this task.
- Mood and Parasite already contained concurrent film changes. The local copy-only patch uses their existing film PR revision as its baseline, so it excludes those presentation changes.
- No new runtime behavior, CSS, dependency, schema, event handler, or API route was added.

## Verification

- Targeted ESLint and Prettier passed. Astro check reported zero errors, zero warnings and six existing hints.
- The initial build into /tmp failed while starting the Cloudflare prerender runtime. The established in-project preview build completed successfully.
- All five film headlines were read in the desktop preview. The full landing, work teasers and project summaries were read from the rendered page.
- The first phone pass found that two themes keep the highlighted hero phrase on one line. The phrase was shortened, preserving the existing markup and layout.
- Final phone checks passed for all six themes at 375px, with page width equal to the viewport. The agent welcome panel was opened and read on mobile without sending a live request.

The user subsequently requested commits and direct delivery to main. Three commits were published by a normal fast-forward push: c2e24cc, 8d6b1f6 and 2fafc84. CI and production deployment passed.

Mood and Parasite were adapted to the scene markup currently on main, with the same simpler editorial direction. The newer photographic scene markup and disclosures remain part of the separate design work. The actual main patch is `.audit/landing-copy-main.patch`.

The separate [design PR #7](https://github.com/soundOfff/personal-site/pull/7) now has conflicts in the overlapping scenes and needs an update before landing. No changes were made to that PR or its branch.
