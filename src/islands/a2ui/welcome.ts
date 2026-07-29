/**
 * The welcome surface: the one set of A2UI messages on this page the agent
 * didn't write.
 *
 * It answers a question nobody asked, so the section has something to render
 * before the first turn. Hand-written in the wire format on purpose — nothing
 * here imports the catalog or the validator, so the client bundle carries no
 * server code, and this file stays the clearest single answer in the repo to
 * "what does an A2UI message actually look like?".
 */

import type { A2uiMessage } from '../../lib/a2ui/types';

interface Spec {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  /**
   * Props that belong in the data model rather than the surface. Lifted to
   * `/<id>/<prop>` and replaced with a binding — the same normalisation the
   * server applies to live turns, so this renders through one path with them.
   */
  data?: Record<string, unknown>;
  children?: string[];
}

function surface(root: string, specs: Spec[]): A2uiMessage[] {
  const model: Record<string, Record<string, unknown>> = {};
  const components = specs.map((spec) => {
    const props: Record<string, unknown> = { ...spec.props };
    for (const [key, value] of Object.entries(spec.data ?? {})) {
      (model[spec.id] ??= {})[key] = value;
      props[key] = { path: `/${spec.id}/${key}` };
    }
    if (spec.children) props.children = spec.children;
    return { id: spec.id, componentProperties: { [spec.type]: props } };
  });

  const messages: A2uiMessage[] = [];
  if (Object.keys(model).length) messages.push({ dataModelUpdate: { path: '/', contents: model } });
  messages.push({ surfaceUpdate: { components } });
  messages.push({ beginRendering: { root } });
  return messages;
}

/**
 * Shown before the first question.
 *
 * It answers "what is this?" the way the agent would answer anything else — the
 * pipeline behind the panel, drawn as a `Flow` rather than described in a
 * sentence. The first surface a visitor sees is the argument for the rest.
 */
export const WELCOME: { summary: string; messages: A2uiMessage[] } = {
  summary: 'Introduced the agent, diagrammed the turn, and offered four starting questions.',
  messages: surface('root', [
    { id: 'root', type: 'Stack', children: ['intro', 'pipe', 'note', 'next'] },
    {
      id: 'intro',
      type: 'Text',
      props: {
        text: 'Ask about the work, the writing, or the background. Every answer comes back as generated UI — cards, charts, diagrams, timelines — not as a paragraph.',
      },
    },
    {
      id: 'pipe',
      type: 'Flow',
      data: {
        steps: [
          { label: 'question' },
          { label: 'retrieve', note: 'ranked context' },
          { label: 'agent', note: 'one tool call' },
          { label: 'A2UI', note: 'components' },
          { label: 'this panel' },
        ],
      },
      props: {
        caption: 'What a turn does. This surface was built the same way, just ahead of time.',
      },
    },
    {
      id: 'note',
      type: 'Callout',
      props: {
        tone: 'info',
        text: 'Every question runs a **real agent turn**: Claude composes the surface from scratch and the console under it reports the model, latency, tokens and cost.',
      },
    },
    {
      id: 'next',
      type: 'Actions',
      props: {
        prompts: [
          'What has he shipped?',
          'How does the LLM routing work?',
          'What is he writing about?',
          'What does ICPC say about him?',
        ],
      },
    },
  ]),
};

/**
 * Starter questions, grouped so the empty state reads as a menu of what the
 * agent knows rather than three arbitrary examples. Every one is answerable
 * from the snapshot — a starter that misses would be the worst first turn.
 */
export const STARTER_GROUPS: { label: string; prompts: string[] }[] = [
  {
    label: 'work',
    prompts: ['What has he shipped?', 'What did he build at Dex?', 'What happened at Mint?'],
  },
  {
    label: 'ai systems',
    prompts: [
      'How does the LLM routing work?',
      'How does he keep LLM costs down?',
      'How does he test an AI feature?',
    ],
  },
  {
    label: 'writing',
    prompts: ['What is he writing about?', 'What does "evals are contracts" mean?'],
  },
  {
    label: 'background',
    prompts: ['What does ICPC say about him?', 'What is his stack?', 'What is he working on now?'],
  },
];

/** One per group: the short row that fits under the composer. */
export const QUICK_STARTERS = STARTER_GROUPS.map((group) => group.prompts[0]);
