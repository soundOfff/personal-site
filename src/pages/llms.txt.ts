import type { APIRoute } from 'astro';
import { profile } from '../data/site';
import { publicPosts } from '../lib/discovery/documents';
import { markdownText } from '../lib/discovery/markdown';
import { pageUrl, siteUrl } from '../lib/site-origin';

export const GET: APIRoute = async () => {
  const posts = await publicPosts();
  const body =
    [
      `# ${markdownText(profile.name)}`,
      `> ${markdownText(profile.role)}. ${markdownText(profile.sub)}`,
      'HTML pages are canonical. Portfolio Markdown summarizes the profile, work and workflow. Article Markdown contains full prose and code; visual diagrams link to the HTML article.',
      '## Profile and work',
      `- [Portfolio](${siteUrl()}): Biography, work and AI workflow.`,
      `- [Portfolio Markdown](${siteUrl('/index.md')}): Profile, work summaries, workflow and contact links.`,
      '## Writing',
      `- [Writing index](${pageUrl('/blog')}): All published articles.`,
      `- [Writing Markdown index](${siteUrl('/blog/index.md')}): Article descriptions and full-text links.`,
      ...posts.map(
        (post) =>
          `- [${markdownText(post.data.title)}](${siteUrl(`/blog/${post.id}.md`)}): ${markdownText(post.data.description)}`,
      ),
    ].join('\n\n') + '\n';
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  });
};
