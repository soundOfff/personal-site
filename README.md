# personal-site

Tomas Brasca's personal site — a backend / systems engineer who builds the systems that make AI products work in production.

Built as a content-first **Astro** site that ships near-zero JavaScript, with a single interactive **React island**: an **A2UI conversational portfolio**. Ask it a question about the work and a Claude agent answers by emitting [A2UI](https://google.github.io/A2UI/) messages — component descriptions, not prose — which a custom client-side renderer turns into project cards, blog lists, comparison tables and timelines.

The look is the **"Workbench"** design — a sticky left meta-rail beside a hairline-divided, engineer's-notebook content column — implemented against my own [`editorial-ui`](https://www.npmjs.com/package/editorial-ui) component library and design tokens.

## Stack

| Layer       | Choice                                                                              |
| ----------- | ----------------------------------------------------------------------------------- |
| Framework   | [Astro](https://astro.build) 6 — static-first, near-zero JS                         |
| UI / island | React 18 island for the Playground only (`client:visible`)                          |
| Agent       | Claude (Haiku 4.5 by default) via forced tool use + prompt caching                  |
| Components  | [`editorial-ui`](https://www.npmjs.com/package/editorial-ui) (tokens + components)  |
| Content     | Astro content collections (MDX blog)                                                |
| Fonts       | Self-hosted via `@fontsource-variable` (Newsreader · Geist · JetBrains Mono)        |
| Host        | Cloudflare Workers — static assets + one on-demand route (`@astrojs/cloudflare`)    |
| Live mode   | On-demand Worker route + KV per-IP rate limit                                       |
| Agent data  | Build-time portfolio snapshot from the content collections, TF-IDF ranked per query |

See [`docs/adr/`](./docs/adr/) for the hard-to-reverse decisions (Astro over Next.js; demo-default Playground; A2UI as the Flagship) and [`BRIEF.md`](./BRIEF.md) / [`CONTEXT.md`](./CONTEXT.md) for positioning and domain language.

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

Ask a question; the agent replies with an interface rather than a paragraph.

- **Demo mode** (default) — bundled A2UI transcripts, fully interactive, free, abuse-proof. No network call.
- **Live mode** (opt-in) — POSTs the question to an on-demand Worker route that holds the API key server-side, ranks the portfolio snapshot against the question, and forces Claude to answer through a single `render_surface` tool call. Per-IP caps (6/min, 25/day) and a global daily budget are enforced in KV. The island never sees the key.

Live mode is **disabled gracefully** until the key is configured: with none set, the endpoint returns `503` and the island answers from its bundled transcripts instead.

### How a turn works

```
question ─▶ /api/a2ui (Worker)
              ├─ rate limits (KV: per-IP burst, per-IP daily, global)
              ├─ snapshot   (build-time JSON from content collections, memoized)
              ├─ retrieval  (TF-IDF rank; top items keep their full text)
              └─ agent      (Claude, forced tool use, cached prompt prefix)
                    │
                    ▼  { root, components[] }
              validate ─▶ type-check vs catalog, prune to reachable tree,
                          lift list props into the data model as { path } bindings
                    │
                    ▼  A2UI messages
        dataModelUpdate ─▶ surfaceUpdate ─▶ beginRendering
                    │
                    ▼
              renderer (browser) ─▶ React components from the registry
```

The **catalog** (`src/lib/a2ui/catalog.ts`) is the single source of truth: it generates the
catalog section of the system prompt, drives the validator, and is type-checked against the
React registry at build time. Add a component in one place, or it doesn't exist.

Every turn shows the model, latency, tokens, cache hits and cost, and can expand to show the
raw A2UI messages behind it. The snapshot the agent is given is public: [`/data/portfolio.json`](http://localhost:4321/data/portfolio.json).

### Configure live mode

Local:

```bash
cp .dev.vars.example .dev.vars   # add ANTHROPIC_API_KEY
```

Production (Cloudflare) — the key lives as a **Worker secret**, set once, surviving every deploy:

```bash
wrangler secret put ANTHROPIC_API_KEY
```

The agent defaults to `claude-haiku-4-5-20251001` — the smallest model that clears the bar,
which is the argument the rest of the site makes. Override with the `A2UI_MODEL` var.

## Deploy

This deploys as a **Cloudflare Worker** (static assets + the one on-demand `/api/a2ui`),
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
  islands/           the one hydrated React island (A2UIPlayground)
    a2ui/            renderer, component registry, data model, demo transcripts
  lib/a2ui/          protocol types, component catalog, validator, prompt, agent
  lib/portfolio/     build-time snapshot + query-time TF-IDF retrieval
  layouts/           page shells
  pages/             routes — homepage, /blog, /work/* case studies,
                     /api/a2ui (agent endpoint), /data/portfolio.json (snapshot)
  content/           MDX blog + case studies (content collections)
  data/              site content (profile, repos, log…) — edit me
  styles/            global.css = editorial-ui tokens/styles + Workbench layout
docs/adr/            architecture decision records + the design handoff
```

Most editable content lives in [`src/data/`](./src/data/) and [`src/content/`](./src/content/) — search for `TODO` to find the spots that still need real facts.

## License

[MIT](./LICENSE)
