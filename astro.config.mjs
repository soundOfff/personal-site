// @ts-check
import { defineConfig, sessionDrivers } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // TODO: set the real production domain once chosen (drives canonical URLs / sitemap).
  site: 'https://tomasbrasca.dev',

  // The site is static-first (near-zero JS). Only the live-mode Playground endpoint
  // opts into on-demand rendering via `export const prerender = false`.
  output: 'static',

  // The adapter reads wrangler.toml automatically, so `Astro.locals.runtime.env`
  // (KV, secrets) is simulated locally during `astro dev`.
  adapter: cloudflare({
    imageService: 'passthrough',
  }),

  // The site never uses Astro sessions. Without an explicit driver the adapter
  // auto-binds a SESSION KV namespace that `wrangler deploy` then rejects for
  // having no id — the memory driver keeps the deploy KV-free.
  session: {
    driver: sessionDrivers.memory(),
  },

  integrations: [react(), mdx()],

  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

  vite: {
    ssr: {
      // editorial-ui ships ESM React components; let Vite bundle it for SSR.
      noExternal: ['editorial-ui'],
    },
  },
});
