import type { APIRoute, GetStaticPaths } from 'astro';
import { documentHeaders, publicPosts } from '../lib/discovery/documents';
import { pageUrl, siteUrl } from '../lib/site-origin';

export const getStaticPaths = (() => [
  { params: { discoveryHeaders: '_headers' } },
]) satisfies GetStaticPaths;

export const GET: APIRoute = async () => {
  const documents = [
    { path: '/index.md', canonical: siteUrl() },
    { path: '/blog/index.md', canonical: pageUrl('/blog') },
    ...(await publicPosts()).map((post) => ({
      path: `/blog/${post.id}.md`,
      canonical: pageUrl(`/blog/${post.id}`),
    })),
  ];
  const body =
    [
      ...documents.map((document) =>
        [
          document.path,
          ...Object.entries(documentHeaders(document)).map(([key, value]) => `  ${key}: ${value}`),
        ].join('\n'),
      ),
      '/llms.txt\n  Content-Type: text/plain; charset=utf-8\n  X-Robots-Tag: noindex',
    ].join('\n\n') + '\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
