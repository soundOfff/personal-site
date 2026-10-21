import type { APIRoute } from 'astro';
import { siteUrl } from '../lib/site-origin';

// Generated at build time so the sitemap URL tracks `site` in astro.config.mjs.
export const GET: APIRoute = () => {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${siteUrl('/sitemap-index.xml')}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
