/**
 * The component registry: the other half of the catalog.
 *
 * `src/lib/a2ui/catalog.ts` tells the agent what exists and the validator what
 * is allowed; this file is what those names actually render as. The two are
 * checked against each other at build time by `REGISTRY satisfies …` at the
 * bottom, so a component declared in the catalog and never implemented — or
 * implemented and never declared — is a type error, not a blank space on the
 * page at runtime.
 *
 * Props arrive as `unknown`, because they were written by a language model.
 * They have already been type-checked server-side by the validator, but this
 * side re-reads them defensively anyway: a stale cached response or a hand-
 * crafted POST should cost one component, never the page.
 */

import { createContext, useContext, type ReactNode } from 'react';
import { Alert, Badge, Chip, Link } from 'editorial-ui';
import type { ComponentType } from '../../lib/a2ui/catalog';

/** Every component receives its resolved props, plus its rendered children. */
export interface RenderProps {
  props: Record<string, unknown>;
  children?: ReactNode;
}

export type A2uiComponent = (props: RenderProps) => ReactNode;

/* ---------------------------------------------------------------- reading */

const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const bool = (value: unknown): boolean => value === true;

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> => typeof item === 'object' && item !== null,
      )
    : [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

/** One of a fixed set, or the fallback — never an arbitrary modifier class. */
function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/* -------------------------------------------------------------- interaction */

/** Lets `Actions` ask a follow-up question without threading a callback down. */
export const AskContext = createContext<(prompt: string) => void>(() => {});

/* ------------------------------------------------------------ inline markup */

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

/**
 * Only site-relative paths, https, and mailto are followed. The agent is told
 * to copy hrefs from the context, but "told to" is not a control — a link is
 * the one thing in a generated surface that can take someone off the site.
 */
function safeHref(href: string): string | null {
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  if (href.startsWith('https://') || href.startsWith('mailto:')) return href;
  return null;
}

/**
 * The small subset of Markdown the agent is allowed: bold, inline code, links.
 * Parsed to React nodes rather than HTML, so there is no path from model output
 * to `dangerouslySetInnerHTML`.
 */
function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((chunk, i) => {
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return <strong key={i}>{chunk.slice(2, -2)}</strong>;
    }
    if (chunk.startsWith('`') && chunk.endsWith('`')) {
      return <code key={i}>{chunk.slice(1, -1)}</code>;
    }

    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(chunk);
    if (link) {
      const href = safeHref(link[2]);
      return href ? (
        <a key={i} href={href}>
          {link[1]}
        </a>
      ) : (
        <span key={i}>{link[1]}</span>
      );
    }

    return chunk;
  });
}

/** External links get the usual `rel` hardening; internal ones stay in-tab. */
function LinkOut({
  href,
  external,
  children,
}: {
  href: string;
  external: boolean;
  children: ReactNode;
}) {
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <a href={href}>{children}</a>
  );
}

/* ------------------------------------------------------------- components */

const Stack: A2uiComponent = ({ props, children }) => (
  <div className={`a2-stack is-${oneOf(props.gap, ['sm', 'md', 'lg'] as const, 'md')}`}>
    {children}
  </div>
);

const Columns: A2uiComponent = ({ children }) => <div className="a2-cols">{children}</div>;

const Heading: A2uiComponent = ({ props }) => {
  const eyebrow = str(props.eyebrow);
  return (
    <div className="a2-heading">
      {eyebrow && <p className="a2-eyebrow">{eyebrow}</p>}
      <h3>{str(props.text)}</h3>
    </div>
  );
};

const Text: A2uiComponent = ({ props }) => <p className="a2-text">{inline(str(props.text))}</p>;

const Callout: A2uiComponent = ({ props }) => {
  const tone = oneOf(props.tone, ['info', 'good', 'warn'] as const, 'info');
  const variant = tone === 'good' ? 'success' : tone === 'warn' ? 'warn' : 'info';
  return (
    <Alert variant={variant} compact className="a2-callout">
      {inline(str(props.text))}
    </Alert>
  );
};

const CodeBlock: A2uiComponent = ({ props }) => {
  const language = str(props.language);
  const caption = str(props.caption);
  return (
    <figure className="a2-code">
      {language && <figcaption className="a2-code-lang">{language}</figcaption>}
      <pre>
        <code>{str(props.code)}</code>
      </pre>
      {caption && <figcaption className="a2-code-cap">{caption}</figcaption>}
    </figure>
  );
};

const ProjectCard: A2uiComponent = ({ props }) => {
  const href = safeHref(str(props.href));
  const badge = str(props.badge);
  const stack = str(props.stack);
  const year = str(props.year);

  const body = (
    <>
      <span className="a2-card-top">
        <b>{str(props.title)}</b>
        {badge && <Badge className="a2-card-badge">{badge}</Badge>}
      </span>
      <span className="a2-card-desc">{str(props.description)}</span>
      {(stack || year) && (
        <span className="a2-card-meta">
          {stack && <span className="a2-card-stack">{stack}</span>}
          {year && <span className="a2-card-year">{year}</span>}
        </span>
      )}
    </>
  );

  return href ? (
    <a className="a2-card is-link" href={href}>
      {body}
    </a>
  ) : (
    <div className="a2-card">{body}</div>
  );
};

const BlogList: A2uiComponent = ({ props }) => (
  <div className="a2-posts">
    {rows(props.items).map((item, i) => {
      const href = safeHref(str(item.href));
      const title = str(item.title);
      const inner = (
        <>
          <span className="a2-post-t">{title}</span>
          <span className="a2-post-meta">
            {str(item.date) && <span className="a2-post-d">{str(item.date)}</span>}
            {str(item.pillar) && <span className="a2-post-p">{str(item.pillar)}</span>}
            {str(item.readingTime) && <span className="a2-post-rt">{str(item.readingTime)}</span>}
          </span>
        </>
      );
      return href ? (
        <a className="a2-post" key={`${href}-${i}`} href={href}>
          {inner}
        </a>
      ) : (
        <div className="a2-post" key={`${title}-${i}`}>
          {inner}
        </div>
      );
    })}
  </div>
);

const Table: A2uiComponent = ({ props }) => {
  const columns = strings(props.columns);
  const body = Array.isArray(props.rows) ? props.rows.filter(Array.isArray) : [];
  const caption = str(props.caption);
  if (!columns.length) return null;

  return (
    <div className="a2-table-wrap">
      <table className="a2-table">
        <thead>
          <tr>
            {columns.map((column, i) => (
              <th key={i}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i}>
              {/* Pad or clip to the header width so a short row can't shift the grid. */}
              {columns.map((_, j) => (
                <td key={j}>{str((row as unknown[])[j], '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {caption && <p className="a2-table-cap">{caption}</p>}
    </div>
  );
};

const Timeline: A2uiComponent = ({ props }) => (
  <ol className="a2-timeline">
    {rows(props.items).map((item, i) => {
      const href = safeHref(str(item.href));
      const title = str(item.title);
      return (
        <li className="a2-tl-item" key={i}>
          <span className="a2-tl-node" aria-hidden="true" />
          <span className="a2-tl-top">
            <span className="a2-tl-date">{str(item.date)}</span>
            {str(item.tag) && <span className="a2-tl-tag">{str(item.tag)}</span>}
          </span>
          <span className="a2-tl-title">
            {href ? (
              <LinkOut href={href} external={!href.startsWith('/')}>
                {title}
              </LinkOut>
            ) : (
              title
            )}
          </span>
        </li>
      );
    })}
  </ol>
);

const Metrics: A2uiComponent = ({ props }) => (
  <div className="a2-metrics">
    {rows(props.items).map((item, i) => (
      <div className="a2-metric" key={i}>
        <div className="a2-metric-v">
          {bool(item.accent) ? <em>{str(item.value)}</em> : str(item.value)}
        </div>
        <div className="a2-metric-k">{str(item.label)}</div>
      </div>
    ))}
  </div>
);

const Chips: A2uiComponent = ({ props }) => (
  <div className="a2-chips">
    {strings(props.items).map((item, i) => (
      <Chip key={`${item}-${i}`}>{item}</Chip>
    ))}
  </div>
);

const LinkComponent: A2uiComponent = ({ props }) => {
  const href = safeHref(str(props.href));
  if (!href) return null;
  const external = bool(props.external) || !href.startsWith('/');
  return (
    <p className="a2-link">
      <Link
        variant="arrow"
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {str(props.label, href)}
      </Link>
    </p>
  );
};

const Actions: A2uiComponent = ({ props }) => {
  const ask = useContext(AskContext);
  const prompts = strings(props.prompts);
  if (!prompts.length) return null;

  return (
    <div className="a2-actions">
      <span className="a2-actions-lbl">next</span>
      {prompts.map((prompt, i) => (
        <button
          className="a2-action"
          type="button"
          key={`${prompt}-${i}`}
          onClick={() => ask(prompt)}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};

/**
 * Type name → component. The `satisfies` check is the contract with the
 * catalog: every declared component must appear here, and nothing may appear
 * here that the agent was never told about.
 */
export const REGISTRY = {
  Stack,
  Columns,
  Heading,
  Text,
  Callout,
  CodeBlock,
  ProjectCard,
  BlogList,
  Table,
  Timeline,
  Metrics,
  Chips,
  Link: LinkComponent,
  Actions,
} satisfies Record<ComponentType, A2uiComponent>;

export function lookup(type: string): A2uiComponent | null {
  return Object.prototype.hasOwnProperty.call(REGISTRY, type)
    ? (REGISTRY as Record<string, A2uiComponent>)[type]
    : null;
}
