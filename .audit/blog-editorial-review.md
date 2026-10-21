# Blog editorial review

## Intent

> Make the blog a consistent, minimal place to read, aligned with the site's restrained editorial direction. Review every article for a clear argument, credible evidence, technical correctness, and a reason for this author to write it. Keep worthwhile work and identify stronger future subjects.

## Review scope

All eleven published MDX articles were read. Claims about the current site were checked against `src/pages/api/a2ui.ts`, `src/lib/a2ui/agent.ts`, `src/lib/ratelimit.ts`, and the current playground. Selected language and platform claims were checked against primary documentation.

This is a single-reviewer critique. No other model reviewed the articles. The side-conversation instruction prohibits subagents. The requested [interrogate skill](/Users/User/.codex/plugins/cache/pstack-claude/pstack/0.9.95/skills/interrogate/SKILL.md) requires "Spawn one reviewer per configured model". That independent review remains blocked, and there is no agreement map to claim.

The user separately authorized article polishing. This pass applies copy improvements and source-backed corrections. It does not delete articles, change draft status, invent personal experiences, or decide which accounts of employer work are true.

## Lead judgment

The strongest writing explains a decision Tomas made, its constraints, and what he learned. The weaker writing tries to be a complete reference or a universal career guide. Those subjects are not inherently bad, but they need a more specific reason to exist on this portfolio.

There is enough material for a coherent blog. Replacing everything would discard the personal perspective that makes several pieces useful. The better direction is fewer broad claims, more worked decisions, and a clear distinction between examples, historical implementations, and measured results.

## Article verdicts

| Article | Verdict | What earns its place | Main issue | Next editorial move |
| --- | --- | --- | --- | --- |
| [The unglamorous middle](../src/content/blog/the-unglamorous-middle.mdx) | Keep near the front. | A personal transition from established backend work to uncertainty at a startup. | The router explanation repeats the routing and eval articles. | Replace some repeated mechanism with one real prioritization decision or disagreement. Preserve the first-person voice. |
| [Evals are contracts](../src/content/blog/evals-are-contracts.mdx) | Keep, strengthen evidence. | A useful argument that a model's eligibility needs a testable quality bar. | It moves between hypothetical examples and strong claims about automatic production gates. The 240-case dataset is illustrative, not an available artifact. | Add one anonymized failure case, its expected result, and what changed in the acceptance criterion. Tomas confirmed the automation and monthly refresh cadence as personal experience. |
| [Rate-limiting a public inference endpoint](../src/content/blog/rate-limiting-inference.mdx) | Keep after the factual refresh. | A real design with useful limitations, including the distinction between a target and a guarantee. | The original article described old quotas and incorrectly treated KV over-admission as a bounded small factor. | The refreshed version documents current limits and their coordination boundary. The next improvement is a measured concurrency experiment or an implemented strict budget, not another cost slogan. |
| [Routing before scaling: the cost arithmetic](../src/content/blog/routing-beats-scaling.mdx) | Refocus as an explanation. | The classification and escalation decision is concrete and relevant to Tomas's work. | The old title promised a cost study without a dataset, measurement protocol, or public results. It also directed visitors to a retired router demo. | Keep illustrative arithmetic clearly labeled. To earn a measured case study, add an authorized traffic breakdown, classification cost, retry cost, quality results, and the comparison window. |
| [Binary search on the answer](../src/content/blog/binary-search-on-the-answer.mdx) | Keep. | The bridge between a contest invariant and a capacity-testing decision is specific. | Real load tests are noisy. An exact-ceiling claim outran the assumptions. Seven midpoint probes did not include setup or confirmation time. | The wording now describes a bracket and operating range. Add one reproducible experiment with repeated probes before making empirical claims. |
| [What ICPC trains you to see](../src/content/blog/what-icpc-trains-you-to-see.mdx) | Keep, narrow the production examples. | The competitive-programming background gives the author a credible perspective on invariants. | The old penalty claim and universal operations-per-second budget were too strong. Router and soft-quota examples were presented as the current system. | Corrections are in place. Prefer one detailed transfer of the habit over several miniature examples. Tomas confirmed the GTS strategy account as personal experience. |
| [Building editorial-ui](../src/content/blog/building-editorial-ui.mdx) | Keep as a focused build log. | CSS exports, side effects, font delivery, and component packaging are concrete engineering details. | The four-rule manifesto takes more room than its actual consequences. The final section described the old demo and assumed every page still followed the original amber rule. | The final section now distinguishes the library baseline from the evolved site. A stronger revision would lead with a packaging failure and show its fix. |
| [Why a static site shows a dynamic demo](../src/content/blog/static-site-dynamic-demo.mdx) | Keep explicitly historical, or replace later with a migration story. | The island and server boundary are still an understandable architectural decision. | It quoted obsolete API paths and fixtures, and its old bundle-size claims could not describe the current build. The update notice appeared only at the end. | The historical notice is now first and old size claims are removed. A replacement about the router-to-A2UI migration would be more distinctive than another general Astro explanation. Keep the existing URL if it is replaced. |
| [Data structures in TypeScript and Python](../src/content/blog/data-structures-typescript-python.mdx) | Keep as a secondary reference; narrow before featuring. | The language comparison helps readers recognize concrete traps. | The inventory is broad, the fake heap distracts from actual heap guarantees, and several implementation claims were inaccurate. | Max-heap availability, Map guarantees, typed storage, and cache validation were corrected. A more memorable article would focus on three runtime differences with failing examples. |
| [Graph traversal in TypeScript and Python](../src/content/blog/graph-traversal-typescript-python.mdx) | Keep as a companion reference; revise the teaching sequence. | Examples in two languages and the queue/stack distinction are useful. | The iterative reachability code was discussed as though it also preserved DFS completion order. Directed and undirected cycle checks were conflated, and leaf-only nodes could raise KeyError in Python examples. | These boundaries are now explicit and the examples were executed. Either implement exit-frame DFS in a later revision or keep the post centered on reachability and shortest paths. |
| [Notes from a software engineering job search](../src/content/blog/how-to-get-a-job-in-big-2026.mdx) | Keep the personal account; reduce the universal advice. | Honest discussion of missed system-design rounds is more distinctive than a resource directory. | The old title promised a universal 2026 guide. Company policy claims were unsourced and perishable. Much of the middle reads as a generic checklist. | The title, opening, and AI-policy advice are narrower. Tomas confirmed the four-offer account as personal experience. A later edit can cut the directory of resources and show one actual preparation artifact or a lesson from a failed round. |

## Act on

1. Historical examples must not be advertised as the current playground. The routing, eval, ICPC, static-site, and library posts were corrected or labeled.
2. A soft KV counter cannot justify a strict global spending promise. The rate-limit article was rebuilt against the current source and distinguishes configured allowance from distributed admission guarantees.
3. A hypothetical cost comparison is not a measured production cost study. The routing title and description now reflect arithmetic, and the rates are labeled as assumptions or historical values.
4. Teach an algorithm's preconditions with the algorithm. The graph article now states Dijkstra's nonnegative-weight requirement and separates reachability, finish order, and directed cycle detection.
5. Avoid dated standard-library claims. Python 3.14 added public max-heap functions. JavaScript Map specifies insertion order and average sublinear access, not a mandated linked-list implementation.
6. Avoid a universal throughput constant or exact capacity claim. The ICPC and binary-search posts now state the assumptions that make the reasoning useful.
7. Make the blog index and every post use one reading shell. The new BlogLayout owns navigation, type, spacing, footer, and narrow reading width. It imports scoped blog CSS and does not depend on the homepage film.

## Consider

- Feature a small set that demonstrates different qualities. The unglamorous middle shows a personal perspective. Evals are contracts shows engineering judgment. The corrected rate-limit article shows willingness to distinguish what a design promises from what it actually enforces.
- Let algorithm references remain available without making them the main identity of the blog. Narrow, tested examples would make them more useful than a large recognition table.
- Replace generic "how to" openings with the actual decision or question behind the article. This improves authorship without requiring more articles.
- Preserve a useful historical URL and put the update at the top. Deleting an older architecture story would lose its migration context.
- Publication dates and reading-time labels were preserved, except the rate-limit article's estimate was adjusted for its new length. A future metadata change should add a real updated date rather than silently pretending the original publication date is the revision date.

## Noted

On 20 October 2026, Tomas confirmed that the four job offers, GTS strategy details, and Dex's automatic eval gates and monthly refresh cadence are accurate personal accounts. Preserve those first-person accounts. Their source is author confirmation; no independent repository verification is claimed. This confirmation does not establish the exact Dex rollout timeline or new quantitative measurements.

Publication chronology also needs confirmation. The library article is dated February and the static-site article April, while the site log records publishing editorial-ui and shipping the site in June. An article can predate a public launch, so this is a question about the intended dates, not proof that either account is false. Dates were not silently changed.

The illustrative extraction suite is not a checked-in dataset. No claim is made that its sample pass rate was measured in this review. No provider pricing benchmark was run.

The article corrections do not repair the live limiter. The implementation still uses eventual-consistency counters and continues locally when KV is missing. Those are separate engineering decisions outside this blog task.

## Dismissed

- Retire every broad tutorial. Too aggressive. They can remain useful reference material if the assumptions and examples are sound.
- Make each article inherit a different film treatment. That conflicts with the requested consistent, minimal reading experience.
- Add a hero image, animation, or decorative card grid to make the blog match the homepage. Typography, color restraint, and spacing provide the connection without interrupting reading.
- Treat passing compilation as article verification. Compilation does not establish that a story happened, an algorithmic claim is true, or a spending bound exists.

## Better subjects to write next

These are proposed subjects, not claims that experiments have already been run.

1. **One component catalog, three consumers.** Explain how the A2UI catalog connects prompt construction, validation, and rendering. Start from an actual component addition and show what prevents those three views from drifting. Source material is in `src/lib/a2ui/catalog.ts`, `prompt.ts`, `validate.ts`, and the renderer.
2. **A quota is not a spending guarantee.** Add a controlled experiment to the corrected rate-limit article. Show what happens when the same bucket is consumed concurrently, then explain which guarantee needs a different implementation. Keep this in the existing article rather than publishing a duplicate thesis.
3. **Replacing the router demo with a portfolio agent.** Show what changed in the reader's task, what the new agent can answer, and which rendering constraints were worth accepting. The old static-site article provides the starting architecture; the current Flagship case study provides the replacement.
4. **Retrieving portfolio context without a vector database.** Walk one real question through the snapshot, ranking, context budget, and final answer. Include a question where keyword retrieval fails and explain the boundary honestly. Source material is in `src/lib/portfolio/snapshot.ts` and `retrieve.ts`.
5. **The question I could not answer in a system-design interview.** Use a real, shareable question and reconstruct the missed tradeoff. This needs Tomas's account. It would be stronger than a general list of system-design resources.

My recommendation is to write the catalog article first. It has inspectable source, a small technical decision, a visible consequence, and no need to invent employer measurements.

## Sources and verification boundaries

- [Python heapq](https://docs.python.org/3/library/heapq.html) documents the max-heap API added in Python 3.14.
- [ECMAScript Map specification](https://tc39.es/ecma262/multipage/keyed-collections.html#sec-map-objects) defines ordering and average sublinear access. It does not mandate the claimed internal structure.
- [Cloudflare KV writes](https://developers.cloudflare.com/kv/api/write-key-value-pairs/) documents concurrent-write behavior and the per-key write limit.
- [How KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/) explains its consistency model and the stronger-coordination alternative.

Laziness Protocol shaped the implementation choice. One blog shell replaces duplicated page chrome, while the landing, global styles, schema, and case studies remain outside this change. Prove It Works shaped verification. The rendered list, filters, headings, prose, code, and diagrams are checked directly, and edited code examples are executed rather than trusted because they compile.

## Verification record

- Astro check passed with zero errors and warnings. Six existing hints remained outside this task's files.
- The blog Astro files passed targeted ESLint and the edited pages, CSS, and eleven articles passed Prettier.
- A production build completed with the output isolated under `.audit/blog-build`, rather than replacing the main preview's dist folder.
- All eleven built article routes were opened. Each had one shared blog shell, one h1, nonempty article content, and working contents targets. A first checker used URL-encoded hashes and incorrectly flagged the résumé heading; checking the actual href attribute confirmed the target exists.
- All eleven articles were checked at a phone breakpoint. Page width matched the available viewport. The two longest tutorial titles were shortened after that inspection. The career article's diagrams now retain readable dimensions inside labeled, focusable scroll regions; a final check confirmed keyboard scrolling and no page overflow at a 375px viewport.
- Topic filtering was exercised, including a URL query that persisted across reload. The evals topic showed three articles.
- Light and dark themes, native contents expansion, and a contents link were exercised in the browser.
- The Python BFS, DFS, and Dijkstra snippets were extracted from the article and executed against ordinary paths, isolated starts, missing leaf entries, and a stale priority-queue entry.
- The published TypeScript LRU snippet was transpiled and executed against recency, eviction, zero capacity, and invalid capacity cases.

These checks do not independently establish employer measurements or biography. Author confirmation is recorded above. No independent reviewer ran and no article was unpublished.

After the user explicitly requested commits, a PR, and a merge, [PR #8](https://github.com/soundOfff/personal-site/pull/8) was opened with two commits and squash-merged to main as `b67d323`. The single-reviewer limitation was disclosed in the PR. PR CI, main CI, and the production deployment all passed. The merged blog files match the tested branch. Concurrent landing work was excluded.
