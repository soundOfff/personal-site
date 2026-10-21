# Candidate C: The working loop

## Visitor experience

Show a single continuous workflow line with five numbered waypoints, not five equal cards. The first and last waypoint are visibly owned by the person. Agents contribute in the middle, with the last person waypoint labeled as a decision to continue, revise, or stop. Skill names appear as small supporting links under the relevant work, not as the main content.

## Diagram shape

Use a winding path: the main route runs from “You set the goal” through “Understand and shape,” “Build a useful slice,” “Check behavior and review,” and back to “You choose what happens next.” A visible return connector leaves the check waypoint and rejoins “Understand and shape” when evidence changes the plan; a shorter return to “Build a useful slice” handles a failed check. At desktop, alternate waypoints around a central vertical spine so the feedback lines fit in the margins. At phone width, use one left-aligned vertical route and a compact return bracket beside the relevant steps.

Keep two conditional side notes attached to the shaping step. Larger work may add a PRD and issues. An uncertain design may compare options before implementation. Label both “when useful” so they read as branches, not required gates. Put the skill labels at the point of use: `how` and `codebase-design` for understanding; `architect`, `arena`, and `design-an-interface` for uncertain designs; `tdd` for behavior checks when useful; `code-review` for independent review; `to-prd` and `to-issues` on the larger-work branch.

## Caller usage

```ts
// src/pages/index.astro
<WorkflowDiagram workflow={workflow} />

// src/lib/portfolio/snapshot.ts
principles: workflow.stages.map(({ title, body }) => ({ title, body }))
```

The first call renders the visual explanation. The second preserves the existing agent-facing `principles` title/body contract from the same source.

## Data shape

```ts
type WorkflowStage = {
  id: 'frame' | 'shape' | 'build' | 'check' | 'decide';
  title: string;
  body: string;
  owner: 'you' | 'agents' | 'you-and-agents';
  skills?: { label: string; href: string }[];
};

type Workflow = {
  intro: string;
  stages: [WorkflowStage, WorkflowStage, WorkflowStage, WorkflowStage, WorkflowStage];
  loops: { from: 'check'; to: 'shape' | 'build'; label: string }[];
  branches: { from: 'shape'; label: string; skills: string[] }[];
};
```

Keep this content in one exported `workflow` value in `src/data/site.ts`. The component owns layout and accessible markup; the snapshot adapter derives its current title/body list from `stages`. Do not store a second list of stages or invent a second agent-context field.

## Visual, input, and responsive behavior

Use native ordered-list semantics for the five waypoints. Render route lines and loop arrows as CSS decoration with `aria-hidden="true"`; stage titles and branch labels carry the meaning in text. Skill references are ordinary links, with visible focus. The diagram works without JavaScript and has no hover-only information. Keep text width and connector labels within the 320px viewport; at small widths remove the alternating offsets and let the loop bracket sit outside the text column. Use fresh `.workflow-*` styles and tune each film's colors through existing theme variables, without inheriting `.tenet` rules. Preserve `#principles`, `data-sec="6"`, Keybar, and both Stage hooks.

## Tradeoff

This winding route makes ownership and feedback legible at a glance, including the fact that review can send work back. It needs careful CSS tuning across the film themes; a simple vertical timeline would be easier to skin but would make the feedback loop feel like a footnote.
