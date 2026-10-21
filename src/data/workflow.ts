export type WorkflowStageId = 'frame' | 'design' | 'build' | 'verify' | 'decide';

type SkillGroup = Readonly<{
  source: 'pstack' | 'Matt Pocock';
  skills: readonly string[];
}>;

type WorkflowStage<Id extends WorkflowStageId = WorkflowStageId> = Readonly<{
  id: Id;
  title: string;
  body: string;
  owner: 'Me' | 'Agents + me';
  skillGroups: readonly SkillGroup[];
  condition: Readonly<{ label: string; body: string }> | null;
}>;

export type Workflow = Readonly<{
  title: string;
  introduction: string;
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
  title: 'AI helps with the work. I own the decisions.',
  introduction:
    "I use pstack to coordinate agents, with Matt Pocock's skills to sharpen the brief, explore interfaces and build useful slices. Each change gets the tools it needs.",
  stages: [
    {
      id: 'frame',
      title: 'Frame the problem',
      body: 'I set the goal, constraints and what success means.',
      owner: 'Me',
      skillGroups: [{ source: 'Matt Pocock', skills: ['grilling'] }],
      condition: {
        label: 'For larger work',
        body: "I turn the brief into a PRD and small issues with Matt Pocock's to-prd and to-issues.",
      },
    },
    {
      id: 'design',
      title: 'Understand, then choose',
      body: 'Agents inspect the code and explain the tradeoffs. I choose a direction.',
      owner: 'Agents + me',
      skillGroups: [
        { source: 'pstack', skills: ['how', 'architect', 'arena'] },
        { source: 'Matt Pocock', skills: ['design-an-interface'] },
      ],
      condition: {
        label: 'When the design is uncertain',
        body: 'I compare alternatives before committing to an approach.',
      },
    },
    {
      id: 'build',
      title: 'Build one useful slice',
      body: 'Agents implement a complete piece of the change. I use behavior-focused tests where they help, and TDD when the task calls for it.',
      owner: 'Agents + me',
      skillGroups: [{ source: 'Matt Pocock', skills: ['tdd', 'codebase-design'] }],
      condition: null,
    },
    {
      id: 'verify',
      title: 'Check the real result',
      body: 'Agents exercise the behavior and review the change independently. I use extra challenge when a decision needs it.',
      owner: 'Agents + me',
      skillGroups: [
        { source: 'Matt Pocock', skills: ['code-review'] },
        { source: 'pstack', skills: ['interrogate'] },
      ],
      condition: null,
    },
    {
      id: 'decide',
      title: 'Make the final call',
      body: 'I review the evidence and decide what is ready to ship.',
      owner: 'Me',
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
