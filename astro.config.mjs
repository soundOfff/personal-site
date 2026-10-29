// @ts-check
import { URL } from 'node:url';
import { defineConfig, sessionDrivers } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import { SITE_ORIGIN } from './src/lib/site-origin';

// https://astro.build/config
export default defineConfig({
  site: SITE_ORIGIN,

  // The site is static-first (near-zero JS). Only the live-mode Playground endpoint
  // opts into on-demand rendering via `export const prerender = false`.
  output: 'static',

  // /work has no index page — case studies live at /work/<id> and the index is
  // the #work section on the homepage. Catch the guessable bare URL.
  redirects: {
    '/work': '/#work',
  },

  // The adapter reads wrangler.toml automatically, so `Astro.locals.runtime.env`
  // (KV, secrets) is simulated locally during `astro dev`.
  adapter: cloudflare({
    imageService: 'passthrough',
  }),

  // The site never uses Astro sessions. Without an explicit driver the adapter
  // auto-binds a SESSION KV namespace that `wrangler deploy` then rejects for
  // having no id — an in-memory driver keeps the deploy KV-free. (`lruCache`
  // rather than `memory`: both are in-memory, but only `lruCache` is in
  // Astro's sessionDrivers type definitions.)
  session: {
    driver: sessionDrivers.lruCache(),
  },

  // sitemap emits /sitemap-index.xml at build time — robots.txt points at it.
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '') || '/';
        return (
          !/\.[^/]+$/.test(path) &&
          (path === '/' || path === '/blog' || /^\/(blog|work|showcase)\/.+/.test(path))
        );
      },
    }),
  ],

  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

  vite: {
    ssr: {
      // editorial-ui ships ESM React components; let Vite bundle it for SSR.
      noExternal: ['editorial-ui'],
    },
  },
});
