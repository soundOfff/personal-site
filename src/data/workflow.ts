export type WorkflowStageId = 'frame' | 'design' | 'build' | 'verify' | 'decide';

/** Where a skill is published. */
export type SkillSource = 'pstack' | 'Matt Pocock' | 'flow kit';

/** Something used at a stage. Only skills come from a published source. */
export type WorkflowTool = Readonly<
  | { kind: 'skill'; name: string; source: SkillSource; purpose: string }
  | { kind: 'agent' | 'orchestration' | 'check'; name: string; purpose: string }
>;

export type WorkflowAgent = Readonly<{
  id: 'claude' | 'codex';
  name: string;
  model: string;
  role: string;
}>;

type WorkflowStage<Id extends WorkflowStageId = WorkflowStageId> = Readonly<{
  id: Id;
  title: string;
  label: string;
  hint: string;
  body: string;
  owner: 'Me' | 'Agents + me';
  input: string;
  action: string;
  output: string;
  humanDecision: string;
  /** In the order a reader should meet them. */
  tools: readonly WorkflowTool[];
  condition: Readonly<{ label: string; body: string }> | null;
}>;

type FeedbackLoop<To extends WorkflowStageId> = Readonly<{
  to: To;
  /** The label on the return lane. */
  lane: string;
  body: string;
}>;

export type Workflow = Readonly<{
  introduction: string;
  agents: readonly [WorkflowAgent, WorkflowAgent];
  stages: readonly [
    WorkflowStage<'frame'>,
    WorkflowStage<'design'>,
    WorkflowStage<'build'>,
    WorkflowStage<'verify'>,
    WorkflowStage<'decide'> & Readonly<{ outcomes: readonly string[] }>,
  ];
  feedback: Readonly<{
    from: 'verify';
    label: string;
    loops: readonly [FeedbackLoop<'build'>, FeedbackLoop<'design'>];
  }>;
  sources: readonly Readonly<{ label: string; href: string }>[];
}>;

/** What to print beside a tool: a skill's source, otherwise its kind. */
export const toolOrigin = (tool: WorkflowTool): string =>
  tool.kind === 'skill' ? tool.source : tool.kind;

export const workflow: Workflow = {
  introduction:
    'Claude Code and Codex do the exploring, building and challenging, guided by pstack, Matt Pocock’s skills and my own flow kit. I own the direction and the final call.',
  agents: [
    {
      id: 'claude',
      name: 'Claude Code',
      model: 'Opus',
      role: 'Plans, reads the codebase, builds and reviews. Runs the skills.',
    },
    {
      id: 'codex',
      name: 'Codex CLI',
      model: 'gpt-6-astra',
      role: 'Takes a share of research and build lanes, and gives a second opinion.',
    },
  ],
  stages: [
    {
      id: 'frame',
      label: 'Frame',
      hint: 'Goal & constraints',
      title: 'Frame the problem',
      body: 'Before asking an agent to write code, I make the problem concrete enough to question.',
      owner: 'Me',
      input: 'An idea, a bug or a change I want to make.',
      action:
        'I work through the goal, constraints and assumptions with an agent. We define what someone should be able to do when the change is finished.',
      output: 'A brief with a clear scope and observable acceptance criteria.',
      humanDecision: 'Is this the right problem, and what is outside the scope?',
      tools: [
        {
          kind: 'skill',
          name: 'grilling',
          source: 'Matt Pocock',
          purpose: 'Questions the brief and exposes assumptions.',
        },
        {
          kind: 'skill',
          name: 'to-prd',
          source: 'Matt Pocock',
          purpose: 'For larger work, records the problem and requirements.',
        },
        {
          kind: 'skill',
          name: 'flow-create',
          source: 'flow kit',
          purpose: 'Maps the feature against the code and plans what to reuse.',
        },
      ],
      condition: {
        label: 'When the scope is larger',
        body: 'A PRD and issues earn their place when the work needs coordination. A small change can start with a short brief.',
      },
    },
    {
      id: 'design',
      label: 'Design',
      hint: 'Choose an approach',
      title: 'Understand, then choose',
      body: 'Agents read the existing code before proposing where a change belongs.',
      owner: 'Agents + me',
      input: 'The agreed brief and the code that already owns the behavior.',
      action:
        'Agents trace the current behavior, map dependencies and compare approaches. For a module or API, we look at the types and what callers need to know.',
      output: 'A chosen approach with its boundaries, tradeoffs and a first slice to build.',
      humanDecision: 'Which tradeoffs fit the product and the code I want to maintain?',
      tools: [
        {
          kind: 'skill',
          name: 'how',
          source: 'pstack',
          purpose: 'Explains the existing code and who owns each behavior.',
        },
        {
          kind: 'skill',
          name: 'architect',
          source: 'pstack',
          purpose: 'Explores types, signatures and module boundaries.',
        },
        {
          kind: 'skill',
          name: 'arena',
          source: 'pstack',
          purpose: 'Runs competing attempts and grafts the best parts.',
        },
        {
          kind: 'skill',
          name: 'prototype',
          source: 'Matt Pocock',
          purpose: 'Throwaway variants to settle a design question by looking.',
        },
      ],
      condition: {
        label: 'When the approach is uncertain',
        body: 'I compare alternatives or try a small prototype before choosing the approach.',
      },
    },
    {
      id: 'build',
      label: 'Build',
      hint: 'One useful slice',
      title: 'Build one useful slice',
      body: 'I give agents a bounded piece of the change with a result I can inspect.',
      owner: 'Agents + me',
      input: 'The chosen approach, a concrete slice and its acceptance criteria.',
      action:
        'Agents implement the behavior through the relevant layers. I keep the change focused and use tests where they give useful evidence about what a caller or user can do.',
      output: 'A working slice, its diff and the checks needed to assess it.',
      humanDecision:
        'Does the implementation still fit the intent, or does the plan need to change?',
      tools: [
        {
          kind: 'agent',
          name: 'Claude Code + Codex CLI',
          purpose: 'Builder agents split the slice, each in its own worktree.',
        },
        {
          kind: 'skill',
          name: 'poteto-mode',
          source: 'pstack',
          purpose: 'The working style: deliberate subagents, simple code, verified work.',
        },
        {
          kind: 'skill',
          name: 'tdd',
          source: 'Matt Pocock',
          purpose: 'Builds through failing behavior tests when tests should lead.',
        },
        {
          kind: 'skill',
          name: 'flow-build',
          source: 'flow kit',
          purpose: 'Builds one issue with disjoint paths and red-green evidence.',
        },
        {
          kind: 'orchestration',
          name: 'Orca',
          purpose: 'Coordinates the workers, their tasks and hand-offs.',
        },
      ],
      condition: {
        label: 'When tests should lead',
        body: 'I use TDD when the task benefits from a failing behavior test that guides the implementation.',
      },
    },
    {
      id: 'verify',
      label: 'Review',
      hint: 'Test & challenge',
      title: 'Check the real result',
      body: 'A plausible diff is a starting point. I want evidence from the behavior it changes.',
      owner: 'Agents + me',
      input: 'The working change, the original brief and the evidence gathered so far.',
      action:
        'Agents run the relevant checks, exercise the result and review the diff independently. I inspect the behavior and weigh the findings against the original goal.',
      output: 'Evidence of what works, concrete findings and any remaining uncertainty.',
      humanDecision: 'What needs fixing, and is the evidence strong enough to trust the result?',
      tools: [
        {
          kind: 'check',
          name: 'Playwright checks',
          purpose: 'Drives the real page in a browser and keeps screenshots as evidence.',
        },
        {
          kind: 'skill',
          name: 'interrogate',
          source: 'pstack',
          purpose: 'Independent challenges when a decision needs scrutiny.',
        },
        {
          kind: 'skill',
          name: 'code-review',
          source: 'Matt Pocock',
          purpose: 'Checks the change against the brief and repository standards.',
        },
        {
          kind: 'skill',
          name: 'flow-code-check',
          source: 'flow kit',
          purpose: 'Correctness and quality review of the pinned change.',
        },
        {
          kind: 'skill',
          name: 'flow-design-check',
          source: 'flow kit',
          purpose: 'Design drift and visual antipatterns in the rendered result.',
        },
      ],
      condition: {
        label: 'When more challenge helps',
        body: 'I use interrogate when a contested or consequential choice needs several independent perspectives.',
      },
    },
    {
      id: 'decide',
      label: 'Decide',
      hint: 'My final call',
      title: 'Make the final call',
      body: 'I keep responsibility for the result, including the choice to revise it or leave it out.',
      owner: 'Me',
      input: 'The actual result, review findings and any limits in the verification.',
      action:
        'I compare the result with the goal, inspect what changed and decide whether more work is needed before it ships.',
      output: 'A decision to ship, revise the slice or reconsider the approach.',
      humanDecision: 'Am I ready to own this change?',
      tools: [],
      outcomes: ['Ship it', 'Revise the slice', 'Reconsider the approach'],
      condition: null,
    },
  ],
  feedback: {
    from: 'verify',
    label: 'Findings feed back into the work',
    loops: [
      {
        to: 'build',
        lane: 'Failed checks return to Build',
        body: 'Failed checks return to the slice.',
      },
      {
        to: 'design',
        lane: 'A wrong approach returns to Design',
        body: 'A wrong approach returns to design.',
      },
    ],
  },
  sources: [
    { label: 'pstack', href: 'https://github.com/michael-denyer/pstack-claude' },
    { label: "Matt Pocock's skills", href: 'https://github.com/mattpocock/skills' },
    { label: 'my flow kit', href: 'https://github.com/soundOfff/skills' },
  ],
};
