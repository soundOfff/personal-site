import type { ComponentProps } from 'react';
import type {
  Heading,
  Paragraph,
  Field,
  CheckboxRow,
  ButtonRow,
  Alert,
  BadgeRow,
  Divider,
  PriceTag,
  List,
} from './blocks';

/**
 * Type definitions adapted from /Users/User/Tomi/gen-ui/60-seconds/game/types.ts
 * for the portable demo component.
 */

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface CaseStudy {
  id: string;
  title: string;
  brief: string;
  requirements: string[];
  difficulty: Difficulty;
  allowedComponents: string[];
  rubric: Record<string, number>;
}

type BlockProps = {
  heading: ComponentProps<typeof Heading>;
  paragraph: ComponentProps<typeof Paragraph>;
  field: ComponentProps<typeof Field>;
  checkboxRow: ComponentProps<typeof CheckboxRow>;
  buttonRow: ComponentProps<typeof ButtonRow>;
  alert: ComponentProps<typeof Alert>;
  badgeRow: ComponentProps<typeof BadgeRow>;
  divider: ComponentProps<typeof Divider>;
  priceTag: ComponentProps<typeof PriceTag>;
  list: ComponentProps<typeof List>;
};
export type GeneratedBlock = {
  [Name in keyof BlockProps]: { component: Name; props: BlockProps[Name] };
}[keyof BlockProps];

export interface JudgeScore {
  scores: Record<string, number>;
  total: number;
  headline: string;
  strengths: string[];
  improvements: string[];
}

export type JudgeResult =
  | { model: string; ok: true; score: JudgeScore }
  | { model: string; ok: false; error: string };

export interface PanelVerdict {
  results: JudgeResult[];
  panelScore: number | null;
  participating: number;
}
