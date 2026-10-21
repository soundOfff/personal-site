# Candidate A. The working loop

## Caller usage

Homepage retains `#principles`, its `data-sec`, Keybar and both Stage hooks, replacing the tenets markup with `<WorkflowDiagram workflow={workflow} />`.
Snapshot retains `principles: workflow.stages.map(stage => ({ title: stage.title, body: describeWorkflowStage(stage, workflow.feedback) }))`.
A visitor follows the numbered spine top to bottom, sees where agents participate, then follows the visible return arrow when checks reveal a problem.
The caller chooses content only. It cannot configure connector coordinates, animation, theme variants or graph layout.

## Visitor experience

A compact heading reads “AI helps with the work. I own the decisions.”
A one-sentence introduction reads “I use pstack to coordinate agents, with Matt Pocock’s skills for framing problems, exploring interfaces and building useful slices.”
Below it is one continuous diagram, never five boxed cards.
Five open rows attach to a slim vertical spine. Large numbered junctions make the route legible from a glance.
The first and final junctions are outlined circles labelled “Me”. The middle junctions have small “Agents + me” labels.
The fourth junction is a small diamond, suggesting a check rather than decorative variety.
A second line runs up the outside from Verify to Design, with an upward arrow and the visible caption “Findings → revise the slice or rethink the design”.
The return line encompasses Build as well as Design. It expresses a loop without falsely promising every failure requires redesign.
A small “when useful” branch beside Design names comparison; a similar branch beside Frame names larger-work planning.
Branches are short rule-connected text, not interactive controls or more panels.

## Canonical stage copy

1. **Frame the problem.** “I set the goal, constraints and what success means. For larger work, I turn the brief into a PRD and small issues.” Supporting skills are grilling, to-prd and to-issues.
2. **Understand, then choose.** “Agents inspect the code and explain the tradeoffs. When the design is uncertain, I compare alternatives before choosing a direction.” Supporting skills are how, architect, arena and design-an-interface.
3. **Build one useful slice.** “Agents implement a complete piece of the change. I use behavior-focused tests where they help, and TDD when the task calls for it.” Supporting skills are tdd and codebase-design.
4. **Check the real result.** “Agents exercise the behavior and review the change independently. Findings go back into the slice or the design.” Supporting skills are code-review and interrogate.
5. **Make the final call.** “I review the evidence and decide what is ready to ship.” No automatic publishing arrow and no claim that tests prove quality.

## Named shape

`type WorkflowStageId = 'frame' | 'design' | 'build' | 'verify' | 'decide';`
`type WorkflowStage = { id: WorkflowStageId; title: string; body: string; owner: 'me' | 'agents-and-me'; skills: readonly string[]; condition?: { label: string; body: string } };`
`type Workflow = { title: string; introduction: string; stages: readonly WorkflowStage[]; feedback: { from: 'verify'; to: readonly ['build', 'design']; label: string }; sources: readonly { label: string; href: string }[] };`
`function describeWorkflowStage(stage: WorkflowStage, feedback: Workflow['feedback']): string;`
This pure projection appends owner, conditional annotation, supporting skill names and the feedback label on Verify to the existing body string.
Do not add a general graph schema. There is one known editorial process and one feedback relationship.
The content value carries English copy, order, ownership, conditional claims and public source URLs.

## Module map and ownership

`src/data/site.ts` owns the single `workflow` value, its named types and the tiny snapshot projection beside the content.
`src/components/WorkflowDiagram.astro` owns native figure/list markup and scoped layout styles. Props accept the workflow value only.
`src/pages/index.astro` owns section placement. `src/lib/portfolio/snapshot.ts` imports and projects workflow content into its unchanged public contract.
Reel files retain scenery, but obsolete tenet layout rules and hooks are removed or retargeted deliberately.
No new client script, graph library, cached copy, context field or theme adapter is necessary.

## Layout, input and accessibility

The figure contains a figcaption, an ordered list, a textual feedback paragraph and two small public source links.
Desktop uses a narrow number/owner column, a main copy column and a return lane. Rows are separated by whitespace and a subtle shared baseline rule, without filled panels.
Use native tokens for ink, muted text, paper and accent. Reserve accent for junctions and the active path; do not use opacity to fade body copy.
On narrow screens the owner moves above each heading and conditional annotations stack within their row. The spine remains vertical and the return lane occupies at most 14px.
At 320px, allow all copy to wrap, use `min-width: 0`, avoid fixed heights, and place the feedback caption below the figure instead of squeezing it into the return lane.
Connectors and geometric junctions are decorative and hidden from assistive technology. Ordered text explicitly carries both ownership and the return path.
No hover is required to read anything. Native source links receive the existing visible focus treatment. Reduced motion has identical content and geometry because the diagram never animates.
House lights and every film inherit their tokens. Verify each selectable mode, and any additional supported reel, rather than assume the mode count from prose.

## Tradeoffs and rejection

The continuous vertical shape takes more height than a horizontal pipeline but remains readable without a second mobile composition.
Reject a node canvas with curved SVG edges. It makes wrapping and conditional annotations fragile and adds coordinate ownership for no useful interaction.
Reject five equal cards. They hide causality, make the feedback an afterthought and resemble the section being replaced.
The only duplicated knowledge is the intentional fixed visual role of Verify; all public copy and snapshot facts derive from one content value.
