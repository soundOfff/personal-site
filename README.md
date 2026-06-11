# personal-site

Tomas Brasca's personal site — a backend / systems engineer who builds the systems that make AI products work in production.

Built as a content-first **Astro** site that ships near-zero JavaScript, with a single interactive **React island**: a live multi-LLM **router Playground** that, given a prompt, picks the cheapest model that clears the bar and shows the model, provider, latency, cost, and reasoning.

The look is the **"Workbench"** design — a sticky left meta-rail beside a hairline-divided, engineer's-notebook content column — implemented against my own [`editorial-ui`](https://www.npmjs.com/package/editorial-ui) component library and design tokens.

## Stack

| Layer       | Choice                                                                             |
| ----------- | ---------------------------------------------------------------------------------- |
| Framework   | [Astro](https://astro.build) 6 — static-first, near-zero JS                        |
| UI / island | React 18 island for the Playground only (`client:visible`)                         |
| Components  | [`editorial-ui`](https://www.npmjs.com/package/editorial-ui) (tokens + components) |
| Content     | Astro content collections (MDX blog)                                               |
| Fonts       | Self-hosted via `@fontsource-variable` (Newsreader · Geist · JetBrains Mono)       |
| Host        | Cloudflare Workers — static assets + one on-demand route (`@astrojs/cloudflare`)   |
| Live mode   | On-demand Worker route + KV per-IP rate limit                                      |

See [`docs/adr/`](./docs/adr/) for the two hard-to-reverse decisions (Astro over Next.js; demo-default Playground) and [`BRIEF.md`](./BRIEF.md) / [`CONTEXT.md`](./CONTEXT.md) for positioning and domain language.

## Develop

```bash
nvm use            # Node 22 (see .nvmrc)
npm install
npm run dev        # http://localhost:4321
```

Quality gates (also run in CI):

```bash
npm run format:check   # Prettier
npm run lint           # ESLint (astro + ts + jsx-a11y)
npm run check          # astro check (types)
npm run build          # production build
```

## The Playground

- **Demo mode** (default) — bundled fixtures, fully interactive, free, abuse-proof. No network.
- **Live mode** (opt-in) — POSTs the prompt to an on-demand Worker route that holds the provider keys server-side, runs classify-then-dispatch routing across OpenAI / Groq / OpenRouter, enforces a per-IP rate limit (5/min, cheap models only) via KV, and returns the same shape. The island never sees provider keys.

Live mode is **disabled gracefully** until keys are configured: with no keys set, the endpoint returns `503` and the island stays in demo mode.

### Configure live mode

Local:

```bash
cp .dev.vars.example .dev.vars   # fill in any provider keys you want active
```

Production (Cloudflare) — keys live as **Worker secrets**, set once, surviving every deploy:

```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put GROQ_API_KEY
wrangler secret put OPENROUTER_API_KEY
```

## Deploy

This deploys as a **Cloudflare Worker** (static assets + the one on-demand `/api/route`),
not Cloudflare Pages — the build emits `dist/client` (assets) and `dist/server` (worker).

**CI (recommended):** every push to `main` deploys via
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). One-time setup: add the
`CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit + Workers KV Storage: Edit) and
`CLOUDFLARE_ACCOUNT_ID` repository secrets. The workflow finds-or-creates the `RL`
rate-limit KV namespace and pins its id automatically — no manual KV setup.

**Manual:**

```bash
wrangler kv namespace create RL   # once; paste the id into wrangler.toml
npm run deploy                    # astro build && wrangler deploy
npm run preview                   # local prod-like run: astro build && wrangler dev
```

## Structure

```
src/
  components/        Astro section components (dogfooding editorial-ui, statically rendered)
  islands/           the one hydrated React island (Playground)
  layouts/           page shells
  pages/             routes — homepage, /blog, /work/* case studies, /api/route (live endpoint)
  content/           MDX blog (content collection)
  data/              site content (profile, work, repos, fixtures…) — edit me
  styles/            global.css = editorial-ui tokens/styles + Workbench layout
docs/adr/            architecture decision records + the design handoff
```

Most editable content lives in [`src/data/`](./src/data/) and [`src/content/`](./src/content/) — search for `TODO` to find the spots that still need real facts.

## License

[MIT](./LICENSE)
