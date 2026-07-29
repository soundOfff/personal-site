/**
 * The component catalog: the single source of truth for what the agent is
 * allowed to render.
 *
 * One declaration drives three consumers, so they can never drift:
 *   • `src/lib/a2ui/prompt.ts`   turns it into the catalog docs in the system prompt
 *   • `src/lib/a2ui/validate.ts` uses it to type-check and strip agent output
 *   • `src/islands/a2ui/components.tsx` implements each entry as a React component
 *
 * Adding a component means adding it here, describing it well enough for a model
 * to pick it correctly, and implementing it in the registry. Nothing else.
 */

/** Fallback caps for props that don't set `max` explicitly. */
export const DEFAULT_STRING_MAX = 1200;
export const DEFAULT_ARRAY_MAX = 12;

/** Hard ceiling on components in one surface, before unreachable ones are pruned. */
export const MAX_COMPONENTS = 40;

/** The shape of a single prop. `item` describes elements of `object[]`. */
export interface PropSpec {
  type: 'string' | 'number' | 'boolean' | 'string[]' | 'string[][]' | 'children' | 'object[]';
  required?: boolean;
  /** Written for the model: say when to use it, not just what it is. */
  doc: string;
  /** Allowed values for `string` props. */
  values?: readonly string[];
  /** Per-key specs for `object[]` items. */
  item?: Record<string, PropSpec>;
  /**
   * Upper bound enforced by the validator so one turn can't flood the page:
   * element count for arrays, character count for strings. Strings default to
   * `DEFAULT_STRING_MAX`, arrays to `DEFAULT_ARRAY_MAX`.
   */
  max?: number;
}

export interface CatalogEntry {
  /** Written for the model: when to reach for this component. */
  doc: string;
  props: Record<string, PropSpec>;
}

/* --------------------------------------------------------- shared item specs */

const HREF: PropSpec = {
  type: 'string',
  doc: 'Site-relative URL, e.g. "/work/dex" or "/blog/evals-are-contracts". Use paths from the context; never invent one.',
};

export const CATALOG = {
  /* -- containers -------------------------------------------------------- */

  Stack: {
    doc: 'Vertical container. The root of almost every surface. Children render top to bottom.',
    props: {
      children: { type: 'children', required: true, doc: 'Ids of the components to stack.' },
      gap: {
        type: 'string',
        values: ['sm', 'md', 'lg'],
        doc: 'Spacing between children. Defaults to "md".',
      },
    },
  },

  Columns: {
    doc: 'Two-column grid that collapses to one column on narrow screens. Use for side-by-side comparison of two cards, not for long lists.',
    props: {
      children: { type: 'children', required: true, doc: 'Ids of the components to lay out.' },
    },
  },

  /* -- text -------------------------------------------------------------- */

  Heading: {
    doc: 'Section heading. Use at most two per surface; the first one usually opens it.',
    props: {
      text: {
        type: 'string',
        required: true,
        doc: 'The heading itself. Sentence case, no period.',
      },
      eyebrow: {
        type: 'string',
        doc: 'Short lowercase mono label above the heading, e.g. "work index" or "3 matches".',
      },
    },
  },

  Text: {
    doc: 'A paragraph of prose. This is how you talk to the visitor — answer the question here, then show the evidence in components below. Supports **bold**, `code`, and [label](/path) links.',
    props: {
      text: {
        type: 'string',
        required: true,
        doc: 'One to three sentences. Be specific, not warm.',
      },
    },
  },

  Callout: {
    doc: 'A boxed aside. Use for caveats, for "I could not find that", and for anything you want visually separated from the answer.',
    props: {
      text: { type: 'string', required: true, doc: 'One or two sentences. Same markup as Text.' },
      tone: {
        type: 'string',
        values: ['info', 'good', 'warn'],
        doc: '"info" (default) for context, "good" for a strong claim, "warn" for a limitation.',
      },
    },
  },

  CodeBlock: {
    doc: 'A fenced code sample. Only use code that appears in the context; do not write new code.',
    props: {
      code: { type: 'string', required: true, max: 4000, doc: 'The source, with real newlines.' },
      language: { type: 'string', doc: 'e.g. "ts", "python", "bash". Used as a label only.' },
      caption: { type: 'string', doc: 'One line under the block saying what it shows.' },
    },
  },

  /* -- portfolio data ---------------------------------------------------- */

  ProjectCard: {
    doc: 'One piece of work — a case study or a repo. The default way to show a project. Use several inside a Stack to show a list.',
    props: {
      title: { type: 'string', required: true, doc: 'Project name, exactly as in the context.' },
      description: { type: 'string', required: true, doc: 'One sentence on what it is.' },
      stack: { type: 'string', doc: 'Short mono tech line, e.g. "Routing · evals".' },
      year: { type: 'string', doc: 'e.g. "2026".' },
      href: HREF,
      badge: { type: 'string', doc: 'Short status pill, e.g. "case study", "open source".' },
    },
  },

  BlogList: {
    doc: 'Rows of writing. Use whenever the answer is "these posts", instead of listing titles in prose.',
    props: {
      items: {
        type: 'object[]',
        required: true,
        max: 8,
        doc: 'The posts, most relevant first.',
        item: {
          title: { type: 'string', required: true, doc: 'Post title.' },
          href: { ...HREF, required: true },
          date: { type: 'string', doc: 'ISO date, e.g. "2026-04-03".' },
          readingTime: { type: 'string', doc: 'e.g. "6 min".' },
          pillar: { type: 'string', doc: 'The post’s pillar, shown as a tag.' },
        },
      },
    },
  },

  Table: {
    doc: 'Comparison grid. The right choice when the visitor asks how two things differ, or wants numbers side by side.',
    props: {
      columns: { type: 'string[]', required: true, max: 5, doc: 'Header cells, 2–5 of them.' },
      rows: {
        type: 'string[][]',
        required: true,
        max: 10,
        doc: 'Body rows. Every row must have exactly as many cells as there are columns.',
      },
      caption: { type: 'string', doc: 'One line under the table.' },
    },
  },

  Timeline: {
    doc: 'Dated events, newest first. Use for career history, shipping history, and "what have you been doing".',
    props: {
      items: {
        type: 'object[]',
        required: true,
        max: 8,
        doc: 'The events, newest first.',
        item: {
          date: { type: 'string', required: true, doc: 'e.g. "jun 2026".' },
          title: { type: 'string', required: true, doc: 'What happened, one line.' },
          tag: { type: 'string', doc: 'Short mono label, e.g. "launch", "writing".' },
          href: HREF,
        },
      },
    },
  },

  Metrics: {
    doc: 'A strip of two to five headline numbers. Use for proof points, never for prose that happens to contain a number.',
    props: {
      items: {
        type: 'object[]',
        required: true,
        max: 5,
        doc: 'The numbers.',
        item: {
          value: { type: 'string', required: true, doc: 'The figure, e.g. "2-3M".' },
          label: { type: 'string', required: true, doc: 'What it counts, e.g. "users at Mint".' },
          accent: { type: 'boolean', doc: 'true tints this one amber. At most one per strip.' },
        },
      },
    },
  },

  /* -- charts and diagrams ---------------------------------------------- */

  BarChart: {
    doc: 'Horizontal bars, largest first. The right choice whenever the answer compares quantities that appear in the context — traffic, latency, cost per turn, model share, years per role. Two to six bars.',
    props: {
      items: {
        type: 'object[]',
        required: true,
        max: 6,
        doc: 'The bars, largest first.',
        item: {
          label: { type: 'string', required: true, max: 40, doc: 'What the bar is, e.g. "Mint".' },
          value: {
            type: 'string',
            required: true,
            max: 16,
            doc: 'The figure as it should read, e.g. "2-3M" or "180 ms". Copied from the context.',
          },
          percent: {
            type: 'number',
            required: true,
            doc: 'Bar length, 0–100, scaled so the largest bar is 100. This is presentation only — the visitor reads `value`.',
          },
          accent: { type: 'boolean', doc: 'true tints this bar amber. At most one per chart.' },
        },
      },
      caption: {
        type: 'string',
        max: 160,
        doc: 'One line under the chart saying what it measures.',
      },
    },
  },

  Flow: {
    doc: 'A pipeline diagram: labelled stages joined by arrows. Use whenever the answer is a sequence — a request path, a routing decision, a build or eval loop. Much clearer than the same steps written as a sentence.',
    props: {
      steps: {
        type: 'object[]',
        required: true,
        max: 6,
        doc: 'The stages, in order.',
        item: {
          label: {
            type: 'string',
            required: true,
            max: 28,
            doc: 'One to three words, e.g. "classify" or "small model".',
          },
          note: {
            type: 'string',
            max: 40,
            doc: 'Optional half-line under the stage, e.g. "~40 ms".',
          },
        },
      },
      caption: { type: 'string', max: 160, doc: 'One line under the diagram.' },
    },
  },

  Gauge: {
    doc: 'A single share, drawn as a dial. Use only when the context gives you an actual percentage or ratio — "82% of turns never reach the big model". If you have a figure but no percentage, use Metrics or BarChart instead.',
    props: {
      percent: { type: 'number', required: true, doc: 'The share, 0–100.' },
      label: {
        type: 'string',
        required: true,
        max: 80,
        doc: 'What the share is of, e.g. "turns served by the small model".',
      },
      display: {
        type: 'string',
        max: 12,
        doc: 'Text in the middle of the dial. Defaults to the percentage; set it for things like "top 1%".',
      },
    },
  },

  Chips: {
    doc: 'A row of small tags. Use for stacks, tools, and languages.',
    props: {
      items: { type: 'string[]', required: true, max: 12, doc: 'Short labels, one or two words.' },
    },
  },

  Link: {
    doc: 'A single standalone link, styled as a call to action. For links inside a sentence, use Text markup instead.',
    props: {
      label: { type: 'string', required: true, doc: 'Link text.' },
      href: { ...HREF, required: true },
      external: { type: 'boolean', doc: 'true for off-site URLs (opens in a new tab).' },
    },
  },

  /* -- interaction ------------------------------------------------------- */

  Actions: {
    doc: 'Suggested follow-up questions. Clicking one asks it. End almost every surface with this — it is what makes the portfolio conversational rather than a search box.',
    props: {
      prompts: {
        type: 'string[]',
        required: true,
        max: 4,
        doc: 'Three or four questions in the visitor’s voice, e.g. "How did the routing work?". Each must be answerable from the context, and each should open a different thread — one deeper on what you just showed, the others sideways into work, writing, or background the visitor has not seen yet.',
      },
    },
  },
} as const satisfies Record<string, CatalogEntry>;

export type ComponentType = keyof typeof CATALOG;

export const COMPONENT_TYPES = Object.keys(CATALOG) as ComponentType[];

export function isComponentType(name: string): name is ComponentType {
  return Object.prototype.hasOwnProperty.call(CATALOG, name);
}

/** Entry lookup that survives the `as const satisfies` narrowing above. */
export function catalogEntry(type: ComponentType): CatalogEntry {
  return (CATALOG as Record<string, CatalogEntry>)[type];
}
