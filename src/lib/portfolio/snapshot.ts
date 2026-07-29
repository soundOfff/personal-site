/**
 * The portfolio snapshot: everything on this site, flattened into one JSON
 * object the agent can be given as context.
 *
 * Built once at build time from the Astro content collections and the `src/data`
 * modules, so the agent's view of the site can never drift from the pages — add
 * a post, and the agent knows about it on the next deploy, with no separate
 * index to maintain and no database to run.
 *
 * Two consumers share this module:
 *   • `src/pages/data/portfolio.json.ts` emits it as a static artifact, so the
 *     pipeline is inspectable from the outside,
 *   • `src/pages/api/a2ui.ts` calls `getSnapshot()`, which memoises it for the
 *     lifetime of the Worker isolate. Collections are bundled into the server
 *     build, so this costs one pass over the content on the isolate's first
 *     request and nothing after that — no network hop, no cache to invalidate.
 */

import { getCollection } from 'astro:content';
import { log, now, profile, proofs, tenets, toolbox } from '../../data/site';
import { repos } from '../../data/repos';

export interface WorkItem {
  id: string;
  n: string;
  title: string;
  description: string;
  stack: string;
  year: string;
  /** Personal projects ship real code; employer case studies are narrative-only. */
  code: boolean;
  href: string;
  excerpt: string;
}

export interface PostItem {
  id: string;
  title: string;
  description: string;
  /** ISO date, e.g. "2026-04-03". */
  date: string;
  pillar: string;
  tags: string[];
  readingTime: string;
  href: string;
  excerpt: string;
}

export interface RepoItem {
  name: string;
  description: string;
  language: string;
  href: string;
}

export interface LogItem {
  date: string;
  tag: string;
  message: string;
  href?: string;
  upcoming: boolean;
}

export interface PortfolioSnapshot {
  generatedAt: string;
  profile: { name: string; role: string; status: string; lede: string; summary: string };
  proofs: { value: string; label: string }[];
  work: WorkItem[];
  posts: PostItem[];
  repos: RepoItem[];
  log: LogItem[];
  principles: { title: string; body: string }[];
  toolbox: { group: string; items: string[] }[];
  now: { key: string; value: string }[];
}

/**
 * MDX body → the first real paragraph, as plain text.
 *
 * Only ever used to give the agent something to quote, so this trades fidelity
 * for never producing markup: frontmatter, imports, JSX, fenced code, headings,
 * and inline emphasis all come out as prose or disappear. Blockquotes are
 * dropped rather than unwrapped — in this content they are editor's notes
 * ("narrative only, no proprietary code"), which is the one thing an excerpt
 * meant to summarise the piece should not open with.
 */
function excerpt(body: string | undefined, limit = 400): string {
  if (!body) return '';

  const prose = body
    .replace(/^---\n[\s\S]*?\n---\n/, '') // frontmatter
    .replace(/^import[^\n]*\n/gm, '') // MDX imports
    .replace(/```[\s\S]*?```/g, '') // fenced code
    .replace(/^>.*$/gm, '') // blockquotes
    .replace(/<[^>]+>/g, '') // JSX / HTML tags
    .replace(/^#{1,6}\s+/gm, '') // heading markers
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '') // list markers
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → their label
    .replace(/[*_`]/g, '') // emphasis / inline code
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .find((block) => block.length > 60);

  if (!prose) return '';
  return prose.length > limit ? `${prose.slice(0, limit).trimEnd()}…` : prose;
}

/** `<em>` in the hero lede is presentation; the agent wants the sentence. */
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

export async function buildSnapshot(): Promise<PortfolioSnapshot> {
  const work = (await getCollection('work', ({ data }) => !data.draft))
    .sort((a, b) => a.data.n.localeCompare(b.data.n))
    .map<WorkItem>((entry) => ({
      id: entry.id,
      n: entry.data.n,
      title: entry.data.title,
      description: entry.data.description,
      stack: entry.data.stack,
      year: entry.data.year,
      code: entry.data.code,
      href: `/work/${entry.id}`,
      excerpt: excerpt(entry.body),
    }));

  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map<PostItem>((entry) => ({
      id: entry.id,
      title: entry.data.title,
      description: entry.data.description,
      date: entry.data.date.toISOString().slice(0, 10),
      pillar: entry.data.pillar,
      tags: entry.data.tags,
      readingTime: entry.data.readingTime,
      href: `/blog/${entry.id}`,
      excerpt: excerpt(entry.body, 320),
    }));

  return {
    generatedAt: new Date().toISOString(),
    profile: {
      name: profile.name,
      role: profile.role,
      status: profile.status,
      lede: stripTags(profile.lede),
      summary: profile.sub,
    },
    proofs: proofs.map(({ value, key }) => ({ value, label: key })),
    work,
    posts,
    repos: repos.map(({ org, name, description, language, href }) => ({
      name: `${org}${name}`,
      description,
      language,
      href,
    })),
    log: log.map((item) => ({
      date: item.date,
      tag: item.tag,
      message: item.msg,
      ...(item.link ? { href: item.link.href } : {}),
      upcoming: item.upcoming === true,
    })),
    principles: tenets.map(({ title, body }) => ({ title, body })),
    toolbox: toolbox.map(({ h, items }) => ({ group: h, items: [...items] })),
    now: now.map(({ dt, dd }) => ({ key: dt, value: dd })),
  };
}

let cached: PortfolioSnapshot | null = null;

/**
 * The snapshot, built at most once per Worker isolate. Requests after the first
 * pay nothing; a deploy replaces the isolate, which is exactly when the content
 * can have changed.
 */
export async function getSnapshot(): Promise<PortfolioSnapshot> {
  cached ??= await buildSnapshot();
  return cached;
}
