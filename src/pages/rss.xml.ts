import rss from '@astrojs/rss';
import { publicPosts } from '../lib/discovery/documents';
import { pageUrl, siteUrl } from '../lib/site-origin';
import type { APIRoute } from 'astro';
import { profile } from '../data/site';

export const GET: APIRoute = async () => {
  const posts = await publicPosts();

  return rss({
    title: `${profile.name} · Writing`,
    description:
      'Build logs, backend & AI systems, algorithms & competitive programming, and startup-engineering notes.',
    site: siteUrl(),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: pageUrl(`/blog/${post.id}`),
      categories: [post.data.pillar, ...post.data.tags],
    })),
  });
};
