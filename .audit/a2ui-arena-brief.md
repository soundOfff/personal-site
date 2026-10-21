# A2UI production improvement

The user says in Spanish, "Necesito mejorar el A2UI y se sienta mejor," and explicitly invokes pstack arena. Produce a working production candidate for a more inviting, tactile, readable conversational portfolio agent. Make a coherent choice for the complete journey rather than a cosmetic layer over today's overloaded interface. All user-facing product copy remains English, matching the site.

## Grounding

The site is Astro with one React island and a server-generated A2UI component renderer. PRODUCT.md defines a cinematic, tactile, restrained personal portfolio for hiring managers, founders and engineers. Four selectable film interpretations plus House lights. Preserve those identities and current user changes, including HAL's lower-left companion and its speech/mute preference.

Relevant files are src/islands/A2UIPlayground.tsx, src/islands/a2ui/{welcome,Renderer,model,components}.tsx/ts, src/styles/global.css, src/lib/a2ui/{types,catalog,validate,prompt,agent}.ts, src/pages/api/a2ui.ts. Existing film overrides for a2-* classes live in each src/reels/<film>/reel.css. Native dialog, reel:cue events and playground:open bootstrap currently integrate the island with film clients. Existing backend limits are five questions per IP per UTC day, per-minute bursts and a global cap. Never fake model output or remove those gates.

Current launcher has a paragraph, big open button and eleven grouped question chips. Empty panel shows an implementation pipeline, a technical callout, one row of suggestions inside WELCOME and another under the composer. Tiny traffic-light controls are the only close/size controls. Live metadata stays exposed under every reply. New turns scroll to the transcript bottom, which can skip the beginning of a tall answer. Reset can race with an in-flight response. Ask clears the draft before an error, with no focused retry. Review these concrete issues and use your judgement on what earns a place.

Live baseline inspected at about 733px wide and 751px tall. Odyssey panel fills the viewport and renders a dark "transmission" surface on a pale shell; some follow-up chips have nearly black text on dark surfaces. The composer sits below a large empty gap and a repeated row of starters. The underlying renderer's real components should stay readable in all five selectable site styles.

## Work

Implement your strongest cohesive improvement to launcher, panel, composer, loading/retry, transcript reading and answer presentation. Choose your own design shape while preserving the site's cinematic/editorial style. Simplify entry and progressive disclosure, make asking feel direct, improve focus/spacing/hit areas and clarify the pending-to-answer transition. Keep technical observability available on demand. Preserve semantic dialog, Escape, keyboard focus, reduced motion, quota honesty, follow-up actions and draft/conversation continuity. No dependencies, no new backend architecture or quotas, no routing redesign, no fake streaming, no invented portfolio facts. Existing API returns complete messages per response.

Name the request/state data shape before editing. Prefer one clear owner for active requests and outcomes, and cancellation or identity checks that prevent stale answers after reset/unmount. Do not refactor the entire renderer just to polish it.

Allowed source scope is src/islands/A2UIPlayground.tsx, src/islands/a2ui/welcome.ts, a new tightly scoped presentation or request-state module within src/islands/a2ui if justified, and scoped A2UI CSS in src/styles/global.css. If contrast requires it, add a small scoped correction to a film's reel.css. Avoid changes to actual model/renderer contracts, API, content, HAL, ticket system and unrelated site CSS. You may adjust components.tsx only for a concrete user-visible issue you can explain.

## Isolation and output

Your assigned worktree is exclusive. The baseline is aa6d83b7019f1296e3e232e17644bf9eb3628be3 and captures the user's dirty checkout. Never edit /Users/User/Tomi/personal-site. Read /Users/User/.codex/plugins/cache/pstack-claude/pstack/0.9.99/skills/poteto-mode/SKILL.md, the TypeScript skill beside it, and /Users/User/.codex/skills/react-best-practices/SKILL.md. Do not spawn children. Do not call live APIs, change credentials, deploy, push, open PRs or run Astro dev/check/build. The node_modules symlink shares a Vite cache, so parent alone runs integrated build/type/browser verification. Targeted ESLint and Prettier in your worktree are safe.

Write candidate-rationale.md at your worktree root with the data shape, design, alternatives rejected, concrete behavioral guarantees, changed files and validation. Produce candidate.patch against the baseline, including new files via git add -N. Commit is optional. Parent will read every implementation, cross-judge and synthesize before applying anything.
