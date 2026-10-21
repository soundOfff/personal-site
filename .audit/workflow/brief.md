# AI workflow diagram

Replace #principles “How I work” with a readable diagram of the user's current AI development workflow combining pstack and Matt Pocock skills. English product copy, Spanish discussion. User asks for implementation, not an essay or a skill catalog.

## Evidence and content

Installed Matt-origin skills are confirmed by /Users/User/.agents/.skill-lock.json. Relevant installed skills read locally: grilling, to-prd, to-issues, design-an-interface, tdd, code-review, codebase-design. pstack configured locally includes poteto-mode, how/why, architect, arena, swarm, interrogate and actual per-role model preferences. This chat directly demonstrates parallel design comparison, synthesis, isolated implementation, independent review and actual-app checks.

Compose an honest personal workflow from that evidence. Human owns goal/constraints and final judgement. Agents investigate the code, explore alternatives where needed, build small complete slices, verify behavior and independently review. Feedback loops return failed checks to implementation or design. pstack coordinates these tasks; Matt's skills sharpen problem framing, interface design, vertical slices and behavior-oriented tests. Do not claim every tiny change gets a PRD, always uses TDD, always uses multiple models, automatically merges/publishes, or guarantees model quality. Skill names should support the process, not dominate every screen.

Possible compact sequence: Frame → Understand/design → Build a slice → Verify/review → Human decision. Larger work can carry PRD/to-issues; uncertain designs use architect/arena/design-an-interface. Test behavior where useful, no rigid mandatory ceremony implied. Show the loop, not just five cards in a grid.

Verified original sources: https://github.com/mattpocock/skills and pstack guide at https://github.com/cursor/plugins/blob/main/pstack/docs/guide/04-design.md. Installed pstack port metadata points to https://github.com/michael-denyer/pstack-claude. Small source links are appropriate, no copied source prose.

## Grounding and boundaries

Read .audit/workflow/grounding.md. One data source should feed a new reusable Astro diagram component and the existing snapshot.principles title/body interface. Preserve id=principles, data-sec=6, Keybar and Stage hooks. All four selectable films and House lights must remain readable at320px. Avoid old .tenets/.tenet styles which have strong theme layouts and movement. No paid API or new diagram dependencies. Native HTML/CSS with decorative connectors is preferred. Keep reading possible without JS. No scroll animation or overlay.

Each candidate produces only one concise design package, max70lines: visitor experience, diagram structure including feedback, caller usage, named data shape, ownership/module map, input/accessibility/responsive behavior, and rejected alternative. Read architect runner prompt and red flags. Do not implement or delegate. Write only the assigned file.
