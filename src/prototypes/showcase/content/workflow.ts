// Prototype copy of the workflow content. src/data/workflow.ts stays the live source for /index.md
// and the agent snapshot; this adds the agents and tools Tomas named for the new section.
import { workflow as base, type WorkflowStageId } from '../../../data/workflow';

export type ToolKind = 'agent' | 'skill' | 'orchestration' | 'check';
export type SkillSource = 'pstack' | 'Matt Pocock' | 'flow kit';

export interface Tool {
  name: string;
  kind: ToolKind;
  /** Only for skills. */
  source?: SkillSource;
  purpose: string;
}

/** The two coding agents. Work is split between them so neither does everything. */
export const agents = [
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
] as const;

/** Tools per stage, in the order a visitor should read them. */
export const tools: Record<WorkflowStageId, Tool[]> = {
  frame: [
    { name: 'grilling', kind: 'skill', source: 'Matt Pocock', purpose: 'Questions the brief and exposes assumptions.' },
    { name: 'to-prd', kind: 'skill', source: 'Matt Pocock', purpose: 'For larger work, records the problem and requirements.' },
    { name: 'flow-create', kind: 'skill', source: 'flow kit', purpose: 'Maps the feature against the code and plans what to reuse.' },
  ],
  design: [
    { name: 'how', kind: 'skill', source: 'pstack', purpose: 'Explains the existing code and who owns each behavior.' },
    { name: 'architect', kind: 'skill', source: 'pstack', purpose: 'Explores types, signatures and module boundaries.' },
    { name: 'arena', kind: 'skill', source: 'pstack', purpose: 'Runs competing attempts and grafts the best parts.' },
    { name: 'prototype', kind: 'skill', source: 'Matt Pocock', purpose: 'Throwaway variants to settle a design question by looking.' },
  ],
  build: [
    { name: 'Claude Code + Codex CLI', kind: 'agent', purpose: 'Builder agents split the slice, each in its own worktree.' },
    { name: 'poteto-mode', kind: 'skill', source: 'pstack', purpose: 'The working style: deliberate subagents, simple code, verified work.' },
    { name: 'tdd', kind: 'skill', source: 'Matt Pocock', purpose: 'Builds through failing behavior tests when tests should lead.' },
    { name: 'flow-build', kind: 'skill', source: 'flow kit', purpose: 'Builds one issue with disjoint paths and red-green evidence.' },
    { name: 'Orca', kind: 'orchestration', purpose: 'Coordinates the workers, their tasks and hand-offs.' },
  ],
  verify: [
    { name: 'Playwright checks', kind: 'check', purpose: 'Drives the real page in a browser and keeps screenshots as evidence.' },
    { name: 'interrogate', kind: 'skill', source: 'pstack', purpose: 'Independent challenges when a decision needs scrutiny.' },
    { name: 'code-review', kind: 'skill', source: 'Matt Pocock', purpose: 'Checks the change against the brief and repository standards.' },
    { name: 'flow-code-check', kind: 'skill', source: 'flow kit', purpose: 'Correctness and quality review of the pinned change.' },
    { name: 'flow-design-check', kind: 'skill', source: 'flow kit', purpose: 'Design drift and visual antipatterns in the rendered result.' },
  ],
  decide: [],
};

export const workflow = {
  ...base,
  introduction:
    'Claude Code and Codex do the exploring, building and challenging, guided by pstack, Matt Pocock’s skills and my own flow kit. I own the direction and the final call.',
  agents,
  tools,
  sources: [
    ...base.sources,
    { label: 'My flow kit', href: 'https://github.com/soundOfff/skills' },
  ],
};

export type ShowcaseWorkflow = typeof workflow;
