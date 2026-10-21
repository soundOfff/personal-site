# Candidate B. The return track

## Caller usage first
```astro
<WorkflowDiagram workflow={workflow} />
```
```ts
import { workflow } from '../data/site';
const principles = workflow.stages.map(({ title, body, support }) => ({
  title, body: `${body} ${support}`,
}));
```
The homepage gives the component one complete value. The portfolio snapshot derives its existing title/body records from that same value. No second copy of workflow copy or skill names.

## Visitor experience
An unboxed diagram shows five stops on one continuous track. Human ownership bookends three agent stops. A return track beneath the agent work points backward from verification to building and design. It reads immediately as a process, including what happens when something fails.
Heading copy is “I set the direction. Agents help me get there.” Supporting copy is “I combine pstack coordination with Matt Pocock’s skills, choosing the tools each change needs.”
Desktop structure is `Frame → Understand & design → Build a slice → Verify & review → Decide`.
The return track reads “Failed check? Revise the slice. Wrong approach? Revisit the design.” It spans the three middle stops, with two arrowheads pointing to the appropriate destinations.

## Named shape
```ts
type WorkflowStage = Readonly<{
  id: 'frame' | 'design' | 'build' | 'verify' | 'decide';
  owner: 'human' | 'agents'; title: string; body: string; support: string;
}>;
type Workflow = Readonly<{
  title: string; intro: string;
  stages: readonly [WorkflowStage, WorkflowStage, WorkflowStage, WorkflowStage, WorkflowStage];
  feedback: string;
  sources: readonly Readonly<{ label: string; href: string }>[];
}>;
```
The fixed five-stop representation matches the actual content rather than introducing a general graph engine. The component owns track geometry; content owns the account of the work. Feedback is textual, so its meaning survives without decoration.

## Content on the track
1. **Frame · Me.** “I define the goal, constraints and what success looks like.” Support “Grilling sharpens the brief. Larger work can become a PRD and vertical slices.”
2. **Understand & design · Agents.** “Investigate the code and compare approaches when the decision is uncertain.” Support “pstack how, architect and arena. Matt’s interface design skills.”
3. **Build a slice · Agents.** “Implement one complete change against the agreed direction.” Support “Small vertical slices; behavior tests where useful. Independent tasks can run in parallel.”
4. **Verify & review · Agents.** “Check real behavior and get an independent review appropriate to the change.” Support “Actual-app checks, code review and interrogate for contested decisions.”
5. **Decide · Me.** “I review the result and own the final call.” Support “Revise, continue or ship when the work meets the goal.”
Skill references stay in smaller support text. Public footer links point to the verified pstack and Matt sources. No model or configuration claims appear.

## Module ownership
`src/data/site.ts` replaces `tenets` with the typed workflow constant. `src/components/WorkflowDiagram.astro` owns semantic markup and scoped diagram styles. `src/lib/portfolio/snapshot.ts` derives principles without changing its contract. `src/pages/index.astro` retains principles ID, section number, Keybar and both Stages hooks.
Remove stale tenet-specific CSS and hover-sound branches. Update Odyssey spoken content and Budapest’s section label to agree with the diagram.

## Visual, interaction and responsive behavior
Use one ruled diagram surface with five equal columns, small numbered nodes and thin connecting arrows across their shared baseline. No panel backgrounds, card borders, shadows, hover lifts or scroll effects. Human nodes use an outlined lozenge; agent nodes use a circle. Text labels also state ownership.
Use existing foreground and secondary text tokens. Connector strokes use currentColor at readable opacity, with a single existing accent reserved for the return track. Inherit film typography with local minimum text sizes and reset oversized cinematic headings inside the component. House lights reads through the same tokens.
Below 900px the track becomes vertical with nodes on the left and content on the right. The feedback track becomes a vertical return bracket connecting the middle stages, with its sentence beneath them. At 320px only one narrow gutter is reserved for connectors; body content retains usable line width. No horizontal scrolling.
Use a figure with a visible caption, an ordered list, explicit owner labels, and a final feedback paragraph. Decorative arrows are aria-hidden. DOM order always matches the five steps. Only source links receive focus; there is no simulated progress or selection state. The whole account works without JavaScript.

## Tradeoffs and red-flag screen
We accept a custom five-stop layout in exchange for a diagram visitors can read without interaction. A freeform SVG graph would expose layout coordinates alongside content and force duplicate accessibility text. A card grid hides sequencing and feedback. Both lose to a single semantic list with private CSS geometry.
The interface is one prop. One module owns wording; one component owns layout. No graph library, controller, synchronized tooltip data, copied snapshot array or writable state is needed. The main implementation risk is inherited reel styling; verify all selectable films and House lights at 320px and desktop, plus the actual portfolio JSON.
