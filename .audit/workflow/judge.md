# Independent design cross-judge

Scores follow the five criteria in `plan.md`. Each cell is 1–5; higher is stronger.

| Criterion | A | B | C |
|---|---:|---:|---:|
| Sequence and feedback are visually clear | 5 | 5 | 4 |
| Readable at narrow widths | 5 | 4 | 4 |
| Accurate tools and conditional use | 5 | 4 | 4 |
| One source feeds page and agent snapshot | 5 | 5 | 3 |
| Small, accessible, all-film implementation | 4 | 4 | 4 |
| **Total** | **24** | **23** | **19** |

## Base and grafts

Choose **A** as the base. Its continuous spine, explicit ownership, return path, conditional branches, 320px treatment and snapshot projection fit the brief with the least ambiguity. Keep the Verify-to-Build-and-Design feedback semantics and never turn conditional branches into gates.

Graft B's clearer failure wording: “Failed check? Revise the slice. Wrong approach? Revisit the design.” Use it as a concise visible caption if it fits beneath the mobile diagram. Keep A's explicit `Me` labels and first-person copy. Avoid B's desktop five-column track, which puts wrapping pressure on a narrow editorial section.

## Findings

- The source page is `src/data/site.ts` and the agent snapshot is `src/lib/portfolio/snapshot.ts`. Today the snapshot maps `tenets` to `principles` title/body records. A preserves that contract and projects skill/feedback context from the same workflow stages. B does too through `support`. C maps only `title` and `body`, so its optional skills and loop/branch meaning disappear from agent context unless copied into body text.
- Attribution is sound in A: pstack coordinates investigation/design work (`how`, `architect`, `arena`); Matt-origin skills support framing, interface design and useful slices. Both authorship/source claims are backed by local skill metadata and the linked source repositories. Keep PRD/issues, design comparison, tests and extra model review explicitly conditional. B is broadly accurate but “I combine pstack coordination with Matt Pocock’s skills” could imply the named tools are all Matt's; label groups by source.
- A and B show a sequence and a return path rather than a generic card grid. C also has visible branch/feedback routing, but its alternating desktop route risks making the order less immediate.
- All three propose ordered-list semantics, textual loop meaning, decorative hidden connectors, normal focusable links and no JS dependency. A gives the clearest 320px constraints and avoids a second layout; B and C need visual validation at that width and in each film.
- Editorial voice must be Tomás speaking about his process. A and B use “I/Me”; C's “You set the goal” addresses the visitor and should be rewritten in first person.

Source check: the pstack design guide describes `/architect` for settling types/boundaries, `/arena` for comparing attempts, `/interrogate` for challenge, and `/swarm` for coverage work. The Matt skills repository is the source for the installed Matt-origin skills. Do not present these as mandatory steps or claim automatic quality/merge.
