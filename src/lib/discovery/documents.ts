import { getCollection, type CollectionEntry } from 'astro:content';
import { contact, profile } from '../../data/site';
import { getSnapshot } from '../portfolio/snapshot';
import { pageUrl, siteUrl } from '../site-origin';
import { articleBody, markdownText } from './markdown';

export type MarkdownDocument = Readonly<{
  path: string;
  canonical: string;
  body: string;
}>;

export async function publicPosts() {
  return (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}

export function postDocument(post: CollectionEntry<'blog'>): MarkdownDocument {
  const canonical = pageUrl(`/blog/${post.id}`);
  return {
    path: `/blog/${post.id}.md`,
    canonical,
    body:
      [
        `# ${markdownText(post.data.title)}`,
        `Canonical HTML: ${canonical}`,
        `Published: ${post.data.date.toISOString().slice(0, 10)}`,
        `Author: [${markdownText(profile.name)}](${siteUrl()})`,
        markdownText(post.data.description),
        articleBody(post.body ?? '', canonical),
      ].join('\n\n') + '\n',
  };
}

export async function blogDocument(): Promise<MarkdownDocument> {
  const posts = await publicPosts();
  return {
    path: '/blog/index.md',
    canonical: pageUrl('/blog'),
    body:
      [
        '# Writing',
        `Canonical HTML: ${pageUrl('/blog')}`,
        ...posts.map((post) =>
          [
            `## [${markdownText(post.data.title)}](${pageUrl(`/blog/${post.id}`)})`,
            `${post.data.date.toISOString().slice(0, 10)} · ${markdownText(post.data.pillar)}`,
            markdownText(post.data.description),
            `[Full article in Markdown](${siteUrl(`/blog/${post.id}.md`)})`,
          ].join('\n\n'),
        ),
      ].join('\n\n') + '\n',
  };
}

export async function homeDocument(): Promise<MarkdownDocument> {
  const snapshot = await getSnapshot();
  return {
    path: '/index.md',
    canonical: siteUrl(),
    body:
      [
        `# ${markdownText(snapshot.profile.name)}`,
        `Canonical HTML: ${siteUrl()}`,
        markdownText(snapshot.profile.role),
        markdownText(snapshot.profile.lede),
        markdownText(snapshot.profile.summary),
        '## Experience and background',
        ...snapshot.proofs.map(
          (proof) => `- ${markdownText(proof.value)} ${markdownText(proof.label)}`,
        ),
        '## Work',
        ...snapshot.work.map((work) =>
          [
            `### [${markdownText(work.title)}](${pageUrl(work.href)})`,
            markdownText(work.description),
            `${markdownText(work.year)} · ${markdownText(work.stack)}`,
          ].join('\n\n'),
        ),
        '## AI workflow',
        ...snapshot.principles.map(
          (stage) => `### ${markdownText(stage.title)}\n\n${markdownText(stage.body)}`,
        ),
        '## Tools',
        ...snapshot.toolbox.map(
          (group) => `- ${markdownText(group.group)}: ${group.items.map(markdownText).join(', ')}`,
        ),
        '## Now',
        ...snapshot.now.map((item) => `- ${markdownText(item.key)}: ${markdownText(item.value)}`),
        '## Writing',
        `[All writing](${pageUrl('/blog')}) · [Markdown index](${siteUrl('/blog/index.md')})`,
        ...snapshot.posts.map(
          (post) =>
            `- [${markdownText(post.title)}](${pageUrl(post.href)}): ${markdownText(post.description)}`,
        ),
        '## Contact',
        ...contact.map((item) => `- [${markdownText(item.label)}](${siteUrl(item.href)})`),
      ].join('\n\n') + '\n',
  };
}

export function documentHeaders(
  document: Pick<MarkdownDocument, 'canonical'>,
): Record<string, string> {
  return {
    'Content-Type': 'text/markdown; charset=utf-8',
    Link: `<${document.canonical}>; rel="canonical"`,
    'X-Robots-Tag': 'noindex',
  };
}

export function markdownResponse(document: MarkdownDocument): Response {
  return new Response(document.body, { headers: documentHeaders(document) });
}
