/**
 * Canned demo data adapted from /Users/User/Tomi/gen-ui/60-seconds/game/
 * - case-studies.ts for case definitions
 * - mocks/fixtures.ts for sample blocks and verdicts
 *
 * Scoped to 2 case studies (login-form, pricing-card) for demo purposes.
 */

import type { CaseStudy, GeneratedBlock, PanelVerdict } from './types';

export const DEMO_CASES: CaseStudy[] = [
  {
    id: 'login-form',
    title: 'Sign-in screen',
    brief:
      'Design the sign-in screen for a productivity app called Cadence. A returning user should be able to log in quickly and recover from a forgotten password.',
    requirements: [
      'Email and password inputs, clearly labeled',
      'A single primary "Sign in" action',
      'A "forgot password" affordance and a way to reach sign-up',
      'A place to surface a sign-in error',
    ],
    difficulty: 'beginner',
    allowedComponents: ['heading', 'paragraph', 'field', 'checkboxRow', 'buttonRow', 'alert', 'divider'],
    rubric: { requirement: 35, uiQuality: 20, completeness: 25, tokenEfficiency: 10, innovation: 10 },
  },
  {
    id: 'pricing-card',
    title: 'Pro plan pricing card',
    brief:
      'Design a single pricing card for the "Pro" tier of a SaaS product. It should make the plan feel worth it and drive an upgrade click.',
    requirements: [
      'The plan name, price, and billing period',
      'A short list of what the plan includes',
      'One clear primary call-to-action to upgrade',
      'Some signal of value (a badge, a highlight, or a note)',
    ],
    difficulty: 'intermediate',
    allowedComponents: ['heading', 'priceTag', 'list', 'badgeRow', 'buttonRow', 'paragraph', 'card', 'divider'],
    rubric: { requirement: 25, uiQuality: 30, completeness: 20, tokenEfficiency: 10, innovation: 15 },
  },
];

export const DEMO_BLOCKS: Record<string, GeneratedBlock[]> = {
  'login-form': [
    { component: 'heading', props: { title: 'Welcome back', subtitle: 'Sign in to Cadence', align: 'center' } },
    {
      component: 'alert',
      props: {
        variant: 'error',
        title: 'Incorrect email or password',
        message: 'Please try again or reset your password below.',
      },
    },
    { component: 'field', props: { label: 'Email', type: 'email', placeholder: 'you@company.com', required: true } },
    { component: 'field', props: { label: 'Password', type: 'password', placeholder: '••••••••', required: true } },
    { component: 'checkboxRow', props: { items: [{ label: 'Remember me', checked: true }] } },
    { component: 'buttonRow', props: { buttons: [{ label: 'Sign in', variant: 'primary' }], align: 'stretch' } },
    { component: 'divider', props: { label: 'or' } },
    {
      component: 'buttonRow',
      props: {
        buttons: [
          { label: 'Forgot password?', variant: 'ghost' },
          { label: 'Create account', variant: 'secondary' },
        ],
        align: 'center',
      },
    },
  ],

  'pricing-card': [
    { component: 'badgeRow', props: { badges: [{ label: 'Most popular', tone: 'accent' }] } },
    { component: 'heading', props: { title: 'Pro', subtitle: 'For growing teams that need more' } },
    { component: 'priceTag', props: { amount: '$29', period: 'per month', note: 'billed annually' } },
    {
      component: 'list',
      props: {
        title: "What's included",
        items: [
          { primary: 'Unlimited projects', checked: true },
          { primary: 'Advanced analytics', checked: true },
          { primary: 'Priority support', checked: true },
          { primary: 'Up to 10 team members', checked: true },
        ],
      },
    },
    { component: 'divider', props: {} },
    { component: 'buttonRow', props: { buttons: [{ label: 'Upgrade to Pro', variant: 'primary' }], align: 'stretch' } },
    {
      component: 'paragraph',
      props: { content: '30-day money-back guarantee. Cancel anytime.', align: 'center', muted: true },
    },
  ],
};

export const DEMO_VERDICTS: Record<string, PanelVerdict> = {
  'login-form': {
    results: [
      {
        model: 'gpt-4o',
        ok: true,
        score: {
          scores: { requirement: 9, uiQuality: 8, completeness: 8, tokenEfficiency: 7, innovation: 6 },
          total: 81,
          headline: 'A clean, on-brief take on the sign-in screen — covers the essentials well.',
          strengths: ['Every required section is present and clearly labeled', 'Sensible top-to-bottom hierarchy'],
          improvements: ['A little more visual emphasis on the primary action would sharpen it'],
        },
      },
      {
        model: 'claude-sonnet-3-5-20240620',
        ok: true,
        score: {
          scores: { requirement: 8, uiQuality: 9, completeness: 7, tokenEfficiency: 8, innovation: 7 },
          total: 79,
          headline: 'Well composed and efficient — strong component choices for the job.',
          strengths: ['Good grouping and spacing', 'Terse prompt still produced a complete UI'],
          improvements: ['One edge case is under-served', 'Consider a supporting line to set context'],
        },
      },
      {
        model: 'gemini-1.5-pro',
        ok: true,
        score: {
          scores: { requirement: 7, uiQuality: 7, completeness: 9, tokenEfficiency: 6, innovation: 5 },
          total: 72,
          headline: 'Thorough coverage; plays it safe rather than surprising.',
          strengths: ['Nothing important is missing', 'Reads clearly at a glance'],
          improvements: ['Leans conventional — a non-obvious touch would elevate it', 'Trim a redundant section for efficiency'],
        },
      },
    ],
    panelScore: 77,
    participating: 3,
  },

  'pricing-card': {
    results: [
      {
        model: 'gpt-4o',
        ok: true,
        score: {
          scores: { requirement: 9, uiQuality: 8, completeness: 8, tokenEfficiency: 7, innovation: 6 },
          total: 79,
          headline: 'A clean, on-brief take on the pro plan pricing card — covers the essentials well.',
          strengths: ['Every required section is present and clearly labeled', 'Sensible top-to-bottom hierarchy'],
          improvements: ['A little more visual emphasis on the primary action would sharpen it'],
        },
      },
      {
        model: 'claude-sonnet-3-5-20240620',
        ok: true,
        score: {
          scores: { requirement: 8, uiQuality: 9, completeness: 7, tokenEfficiency: 8, innovation: 7 },
          total: 80,
          headline: 'Well composed and efficient — strong component choices for the job.',
          strengths: ['Good grouping and spacing', 'Terse prompt still produced a complete UI'],
          improvements: ['One edge case is under-served', 'Consider a supporting line to set context'],
        },
      },
      {
        model: 'gemini-1.5-pro',
        ok: true,
        score: {
          scores: { requirement: 7, uiQuality: 7, completeness: 9, tokenEfficiency: 6, innovation: 5 },
          total: 70,
          headline: 'Thorough coverage; plays it safe rather than surprising.',
          strengths: ['Nothing important is missing', 'Reads clearly at a glance'],
          improvements: ['Leans conventional — a non-obvious touch would elevate it', 'Trim a redundant section for efficiency'],
        },
      },
    ],
    panelScore: 76,
    participating: 3,
  },
};

export function getDemoCase(id: string): CaseStudy | undefined {
  return DEMO_CASES.find((c) => c.id === id);
}

export function getDemoBlocks(caseId: string): GeneratedBlock[] {
  return DEMO_BLOCKS[caseId] ?? [];
}

export function getDemoVerdict(caseId: string): PanelVerdict | null {
  return DEMO_VERDICTS[caseId] ?? null;
}
