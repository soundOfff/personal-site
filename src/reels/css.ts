import type { ActTokens, ReelConfig } from './types';
import { SECTION_IDS } from './types';
import { isDark } from './tokens';

/**
 * Build-time CSS generated from the reel configs, inlined once in the
 * homepage head so a returning visitor's film paints on the first frame.
 *
 *   - the root follows the act of the section in view (rail, page ground),
 *   - every section keeps its own act's palette wherever it is on screen,
 *   - each reel's stages, slugs and default title card show only under it.
 *
 * `html:root[data-reel]` outranks editorial-ui's `:root[data-theme='dark']`, so
 * a film's palette wins over the visitor's theme while it is screening.
 */

const TOKEN_VARS: [keyof Omit<ActTokens, 'vars'>, string][] = [
  ['page', '--page'],
  ['paper', '--paper'],
  ['paper2', '--paper-2'],
  ['paper3', '--paper-3'],
  ['ink', '--ink'],
  ['ink2', '--ink-2'],
  ['muted', '--muted'],
  ['muted2', '--muted-2'],
  ['rule', '--rule'],
  ['rule2', '--rule-2'],
  ['accent', '--amber'],
  ['accentInk', '--amber-deep'],
  ['accentSoft', '--amber-soft'],
  ['onAccent', '--on-accent'],
];

function declarations(t: ActTokens): string {
  const out = TOKEN_VARS.map(([k, v]) => `${v}:${t[k]}`);
  for (const [k, v] of Object.entries(t.vars ?? {})) out.push(`--${k}:${v}`);
  out.push(`color-scheme:${isDark(t.paper) ? 'dark' : 'light'}`);
  return out.join(';');
}

export function reelCss(reels: readonly ReelConfig[]): string {
  const rules: string[] = [];
  for (const reel of reels) {
    const on = `html:root[data-reel='${reel.id}']`;

    if (reel.acts.length) {
      const type = reel.type
        ? [
            `--font-display:${reel.type.display}`,
            `--font-serif:${reel.type.display}`,
            `--font-sans:${reel.type.body}`,
            `--font-mono:${reel.type.mono}`,
            `--font-title:${reel.type.title ?? reel.type.display}`,
          ].join(';') + ';'
        : '';
      rules.push(`${on}{${type}${declarations(reel.acts[0].tokens)}}`);
      reel.acts.forEach((act, i) => {
        rules.push(`${on}[data-act='${i}']{${declarations(act.tokens)}}`);
        const secs = act.sections.map((s) => `${on} [data-sec='${SECTION_IDS.indexOf(s)}']`);
        if (secs.length) rules.push(`${secs.join(',')}{${declarations(act.tokens)}}`);
      });
    }

    // Stages and slugs belong to one reel; the title stage belongs to the projector.
    rules.push(
      `${on} .reel-stage[data-stage='${reel.id}']:not([data-at='title']){display:contents}`,
      `${on} .reel-slug[data-for='${reel.id}']{display:inline}`,
      `.projector[data-title='${reel.id}'] .reel-stage[data-stage='${reel.id}'][data-at='title']{display:contents}`,
    );
    if (!reel.stages.includes('title')) {
      rules.push(
        `.projector[data-title='${reel.id}'] .pj-title[data-for='${reel.id}']{display:flex}`,
      );
    }
  }
  return rules.join('\n');
}
