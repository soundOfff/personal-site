import type { ActTokens } from './types';

/**
 * Shorthand for an act's palette: the eight values every film board on the
 * design canvas carried, plus optional overrides. Whatever is left out is
 * derived with color-mix() so a new reel can start from those eight.
 */
export interface ActInput {
  bg: string;
  surface: string;
  ink: string;
  ink2: string;
  muted: string;
  line: string;
  accent: string;
  accentInk: string;
  page?: string;
  bg2?: string;
  muted2?: string;
  line2?: string;
  accentSoft?: string;
  onAccent?: string;
  vars?: Record<string, string>;
}

/** WCAG relative luminance of a #rgb / #rrggbb colour; null for anything else. */
export function luminance(color: string): number | null {
  const hex = color.trim().replace(/^#/, '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** True when the colour reads as a dark ground (drives `color-scheme`). */
export function isDark(color: string): boolean {
  const l = luminance(color);
  return l !== null && l < 0.18;
}

export function tokens(a: ActInput): ActTokens {
  // Text on an accent fill: whichever of the act's ink or ground reads better.
  const onAccent =
    a.onAccent ??
    ((contrast(a.accent, a.ink) ?? 0) >= (contrast(a.accent, a.bg) ?? 0) ? a.ink : a.bg);
  return {
    page: a.page ?? a.bg,
    paper: a.bg,
    paper2: a.bg2 ?? `color-mix(in oklab, ${a.ink} 5%, ${a.bg})`,
    paper3: a.surface,
    ink: a.ink,
    ink2: a.ink2,
    muted: a.muted,
    muted2: a.muted2 ?? `color-mix(in oklab, ${a.muted} 55%, ${a.bg})`,
    rule: a.line,
    rule2: a.line2 ?? `color-mix(in oklab, ${a.ink} 24%, ${a.bg})`,
    accent: a.accent,
    accentInk: a.accentInk,
    accentSoft: a.accentSoft ?? `color-mix(in oklab, ${a.accent} 16%, ${a.bg})`,
    onAccent,
    vars: a.vars,
  };
}
