# Blog polish

- [x] Ground the blog architecture and inventory every article.
- [x] Choose one shared reading layout independent of the homepage film.
- [x] Implement the layout and minimal index without changing landing files.
- [x] Polish article copy and mark historical examples explicitly.
- [x] Review every article for a distinct argument, evidence, correctness and reader value.
- [x] Verify the index, filters, article typography, code, diagrams and mobile layout.
- [x] Present the editorial verdicts and the strongest replacement topics.

Throughput checkpoint.

- Blocking first steps. Read the eleven articles and trace claims about the live demo against current source.
- Independent workstreams. Layout and editorial work are local to the blog. No subagents are allowed in this side conversation.
- Shared mutable state. Do not edit landing, reel, global CSS, BaseLayout, schema or package files. Use BlogLayout and blog-scoped CSS.
- Smallest safe decomposition. One writer changes the blog shell and focused copy. Article retirement and unverified personal claims remain recommendations.

Data shape. The existing blog collection owns posts, metadata and draft status. A shared BlogLayout owns the reading shell. Each article supplies its rendered content and headings. A selected tag filters existing article elements on the index.

How. The index and every MDX page currently use BaseLayout directly, then duplicate navigation and a sheet. Global prose rules also style case studies. BlogLayout can wrap BaseLayout and localize new styles without changing either the landing or case studies.

Design. Compared global prose overrides with a separate blog shell. Chose the shell because it makes every blog page consistent and leaves concurrent landing work untouched. No independent architecture panel ran because this side conversation forbids subagents.

Interrogate status. Single-reviewer editorial critique only. BLOCKED: independent review. No multi-model consensus, merge-ready claim, commit, PR or deploy.

Delivery update. The user requested commits, a PR, and a merge after the review limitation was disclosed. PR #8 was opened with two commits and squash-merged to main as b67d323. PR CI, main CI, and production deployment passed. Independent review did not run and is not claimed.
