export type WorkflowStageId = 'frame' | 'design' | 'build' | 'verify' | 'decide';

type WorkflowSkill = Readonly<{
  name: string;
  purpose: string;
}>;

type SkillGroup = Readonly<{
  source: 'pstack' | 'Matt Pocock';
  skills: readonly WorkflowSkill[];
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
  skillGroups: readonly SkillGroup[];
  condition: Readonly<{ label: string; body: string }> | null;
}>;

export type Workflow = Readonly<{
  title: string;
  introduction: string;
  preview: string;
  stages: readonly [
    WorkflowStage<'frame'>,
    WorkflowStage<'design'>,
    WorkflowStage<'build'>,
    WorkflowStage<'verify'>,
    WorkflowStage<'decide'>,
  ];
  feedback: Readonly<{
    from: 'verify';
    to: readonly ['build', 'design'];
    label: string;
    body: string;
  }>;
  sources: readonly Readonly<{ label: string; href: string }>[];
}>;

export const workflow: Workflow = {
  title: 'My AI workflow',
  introduction:
    "I use pstack and Matt Pocock's skills to turn an idea into a change I can inspect. Agents explore, build and challenge the work. I own the direction and the final call.",
  preview:
    'How I frame a problem, compare approaches and check what agents build before deciding what ships.',
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
      skillGroups: [
        {
          source: 'Matt Pocock',
          skills: [
            { name: 'grilling', purpose: 'Questions the brief and exposes assumptions.' },
            { name: 'to-prd', purpose: 'For larger work, records the problem and requirements.' },
            {
              name: 'to-issues',
              purpose: 'Splits an agreed plan into complete, reviewable slices.',
            },
          ],
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
      skillGroups: [
        {
          source: 'pstack',
          skills: [
            { name: 'how', purpose: 'Explains the existing code and who owns each behavior.' },
            { name: 'architect', purpose: 'Explores types, signatures and module boundaries.' },
            {
              name: 'arena',
              purpose: 'Compares competing approaches when the choice is uncertain.',
            },
          ],
        },
        {
          source: 'Matt Pocock',
          skills: [
            {
              name: 'design-an-interface',
              purpose: 'Compares module and API interfaces before committing callers to one.',
            },
          ],
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
      skillGroups: [
        {
          source: 'Matt Pocock',
          skills: [
            {
              name: 'codebase-design',
              purpose: 'Keeps module boundaries and caller responsibilities clear.',
            },
            {
              name: 'tdd',
              purpose: 'Builds through failing behavior tests when the task calls for TDD.',
            },
          ],
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
      skillGroups: [
        {
          source: 'Matt Pocock',
          skills: [
            {
              name: 'code-review',
              purpose: 'Checks the change against the brief and repository standards.',
            },
          ],
        },
        {
          source: 'pstack',
          skills: [
            {
              name: 'interrogate',
              purpose: 'Adds independent challenges when a decision needs closer scrutiny.',
            },
          ],
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
      skillGroups: [],
      condition: null,
    },
  ],
  feedback: {
    from: 'verify',
    to: ['build', 'design'],
    label: 'Findings feed back into the work',
    body: 'Failed checks return to the slice. A wrong approach returns to design.',
  },
  sources: [
    { label: 'pstack', href: 'https://github.com/michael-denyer/pstack-claude' },
    { label: "Matt Pocock's skills", href: 'https://github.com/mattpocock/skills' },
  ],
};
