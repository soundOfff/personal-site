# Blog shipping

### Shipping

Resolve the driver skill through [poteto-mode's Non-negotiables](../SKILL.md#non-negotiables).

**You own what lands. Verify each PR independently, land only the verified run from the root, then keep your hands off the stack.** Landing needs the user's landing authority, and each landing is confirmed before the next starts.

1. **Resolve the forge, then verify each PR independently before it lands.** GitHub CLI (`gh`) is the default. If `command -v origin` succeeds and Origin can resolve the repository, use `origin pr` for every PR operation. Otherwise stay on `gh` and record the fallback. Never require Graphite (`gt`). Capture the affected chain bottom-to-top, each head branch and SHA, base branch and SHA, and the intended destination repository and branch, and leave unrelated PRs alone. Read [Merge and restack safety](../references/merge-safety.md) before merging, arming, rebasing, or retargeting. Inspect pending merge requests on entry, and cancel and read back any that lack the verification gates in step 4 before a lengthy review. One verifier per PR, each a subagent in its own worktree, runs the change the way a user would through the driver skill, parent against head, and posts `PASS`, `PASS+NOTES`, or `FAIL` on that PR. Only a verdict from an agent that did not write the code counts, because an author checks what it meant to build. Green CI and an approving bot review are not verdicts, because neither runs the change as a user would. Record each verdict's head SHA, base SHA, base branch, and stable `git patch-id` of the base-to-head diff.
2. **Land only the contiguous verified run rooted at the bottom.** Walk up from the lowest unmerged PR and stop at the first one without `PASS` or `PASS+NOTES`. The PRs below it are the run, and the top one is the ceiling. A verified PR above an unverified one waits, because it cannot land without the code below it. One whose branch neither holds nor needs that code can move onto trunk and land on its own. It needs a fresh verdict first, because its old one ran with that code beneath it and trunk does not have it.
3. **Re-check that the verdicts still describe the code.** A verdict covers a patch, and a chain rebase moves every PR above it to a new SHA without failing any check. Compare `git patch-id` at the verdict SHA with the current head before trusting an older verdict. When the patches differ only in tests, docs, or lint config, a lane's result stands if what it ran builds the same at both SHAs apart from noise. Noise is a difference that also shows up between two builds of the verdict SHA, or an embedded commit SHA. Report each kind of noise with its files, so a reader can check the call. The change itself still gets fresh checks and a review, because the old verdict never saw it. A lane with no build output, such as a dev server, cannot show this, so rerun it, and re-verify anything else that drifted. A matching patch-id keeps a review only after you check that it applies to the new destination and dependencies, so re-verify changed behavior or uncertain applicability, and rerun checks and mergeability after every rewrite or retarget.
4. **Land bottom-up, one PR at a time.** Always merge the run's lowest unmerged PR under a service-enforced head condition, because a last-second read without one leaves a race. On GitHub, use `gh pr merge <pr> --repo <owner/repo> --squash --match-head-commit <verified-head>`, and confirm the destination right before the request, since the head guard does not guard the base. Use `origin pr merge <pr>` only once Origin's CLI proves an equivalent server-side head condition. Otherwise stop at merge-ready and report the limitation. On Origin the plain command also merges every PR below the one you name, and on GitHub a PR whose base is still its parent's branch merges into that branch, not trunk. Read the PR back for the result (`origin pr view <pr>` or `gh pr view <pr> --json state,mergedAt,baseRefName`), because a merge command can report success when a merge queue only queued the PR, and a requested auto-merge is not a merge. A landed PR reads merged with trunk as its base, not its parent's branch. Then fetch the destination and confirm the merge commit is in its history, and stop the chain if anything contradicts the verified landing. Arm `--auto` (Origin merge-when-ready or GitHub auto-merge) only on a PR whose verdict covers its current head, because it lands whatever head is ready, and only behind repository rules that enforce the verdict and required CI on the revision that will land. A queue-required branch can turn a plain merge into queue admission, so it takes the same rules. Never change protection settings or use `--admin` to get there. Before any push, rebase, or base edit, run `ship-pr inspect` and `ship-pr cancel-pending` from the safety reference for every PR the change can affect, and require a `cancelled` result. If cancellation fails, state is unavailable, or a PR merges meanwhile, stop and reconcile actual state first. After a merge lands, retarget the PR whose base was the merged branch to trunk (`origin pr edit <pr> --base <trunk>` or `gh pr edit <pr> --base <trunk>`), replay only its own commits onto the merge result from the recorded old parent boundary, as in the safety reference, and push with a lease on the remote SHA captured before the rewrite. The verdict covers the patch, not its commits, so step 3's patch-id rule decides whether the verdict survives. Merge it once its checks pass and its verdict survives.
5. **Leave the stack alone while it lands.** Step 4's move of the next PR is the only change to a branch or base, because a merge lands whatever its branch and base hold at that moment, verdict or not. On GitHub, watch the run with the queued watcher from `playbooks/babysit.md` (`scripts/watch-pr/watch-pr --queued-stack --stack-prs <bottom-to-top>`) under `/loop` in dynamic mode until it reports `COMPLETE` at the ceiling. On Origin, re-read the current PR with `origin pr view <pr> --checks` each time `origin pr checks <pr> --watch` returns, until the ceiling reads merged. A base that moves to trunk when its parent merges is expected, not damage to repair. If a merge stalls, find out why before you change anything. At each wakeup, compare the landing revision, including the base OID, with the approved record through `ship-pr inspect`, and cancel a pending request whose evidence no longer applies.

   The watcher owns GitHub blocker classification. Preserve `BLOCKER` reasons and route them through `playbooks/babysit.md`: conflicts and `behind-base` to the topology owner, threads and CI to the PR owner, human approval gates to a wait. Do not rearm an unchanged blocker. `WAITING`, including `merge-queue`, is non-terminal. Pending checks are neither failure nor completion. Diagnose `TIMEOUT` and `status-query` blockers, since unknown state never permits a merge.
6. **Stop at the ceiling.** Extending the run takes new verdicts, so it is a new pass through step 1.

**Reply:** the verified run and its ceiling, each PR's verdict and who produced it, what was armed or cancelled and read back, what landed and how you confirmed it, any unresolved state or service limit, and what the next gap needs.

### Opening a PR

Invoked at the end of every other playbook.

**Worktree.** Work from a git worktree off main. Subagents inherit it. Multiple `Agent` calls on the same branch each get their own worktree, or `git fetch && git reset --hard origin/<branch>` between them. Dirty branch with unrelated work: patch out, fresh worktree, apply. Snarled worktree: reset from main, redo minimally. Before you commit, merge, or deploy from a worktree, list the live agents and stop every one that holds it, including grandchildren you never launched. A delegate's children do not inherit its brief, so a read-only instruction never reaches them. Confirm each stop, then run `git status` and read the tree you are about to ship.

**Commits.** Commit liberally. Rebase into small, ordered commits before opening PRs. Each commit is a future PR: landable, ordered to tell the story. Amend when the fix belongs in a just-made commit. New commit when separable. Commit bodies don't restate the subject.

**PRs.** Run `/deslop` over the diff before commit and `/no-comments` before review. Write every PR title, description, and commit body with `/technical-writing` (every layer except Diátaxis, and apply the STE vocabulary rules: one word per action, keep articles, a plain verb over `-ing` where one works), then apply `/unslop`.

**Titles.** Conventional Commits `type(scope): subject`, no trailing period. Type such as `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, or `perf`. Scope is the area, such as `pstack` or `poteto-mode`. Subject is short, imperative, and names a real symbol when one carries the change, for example `fix(pstack): retarget opening-a-pr babysit trigger`.

**Descriptions.** The PR body is a one-minute briefing, not a lab notebook, for a reviewer who has the diff. It says why the change exists, what it leaves out, what it could break, and how you proved it works. Write short, simple sentences with few identifiers, no walls of text. The body becomes the squash commit body, so keep that commit under about 40 lines. Use `##` headings, not bold lead-ins, in this order, and drop a section with nothing to say:

- `## Why`: the problem and approach, 1–3 short sentences. No SHAs, rebase genealogy, or "based on main" preamble.
- `## What changed`: 1–3 short bullets. Name a real symbol or path only when it carries the change. Name both sides of a rename or retarget.
- `## Scope`: always. 1–3 short items on what it covers and what it deliberately leaves out (a follow-up, a known gap). No symbols, paths, or file-by-file essay.
- `## Tradeoffs`: only rejected alternatives a reviewer would otherwise ask about. Skip when there was no real choice.
- `## Blast Radius`: 1–2 sentences on who or what it touches and why that is safe or risky. If main is red, state the cost of leaving it red.
- `## Verification`: 1–3 bullets, each a real run path and its outcome. Perf: one primary number with its unit, `before → after`, and a link to the arena or swarm directory for the rest. No sample-size methodology, swarm recitals, or metric tables.

After the sections, attach videos or screenshots when they prove a claim. Full SHAs, swarm or arena lane recitals, lever-correction essays, file-by-file checklists, and "CLEAN" verdicts go in a linked artifact, not the body.

**Forge.** Resolve the forge before the first PR operation and keep that choice for create, edit, view, watch, and merge. GitHub CLI (`gh`) is the default. If `command -v origin` succeeds and Origin can resolve the repository, prefer `origin pr ...`. If Origin is absent or cannot resolve the repository, stay on `gh` and record the fallback. Do not require Graphite (`gt`).

**Built-in PR tool.** When the run provides a built-in PR tool, create, edit, retarget, and mark ready through it, never through a forge CLI. A CLI-made PR misses what the tool tracks. Use the resolved forge for everything the tool does not cover, and for every PR operation when the run has no such tool.

**Size and stacks.** Prefer five narrow PRs to one large PR. A stack is a base-branch chain. The root PR targets trunk. Each child branch rebases onto its parent's exact tip and its PR targets the parent branch. As a parent merges, move its child onto trunk per `playbooks/shipping.md` step 4. Without a built-in PR tool, per the resolved forge, create a child with `origin pr create --status open --base <parent-branch>` or `gh pr create --base <parent-branch>`, and retarget one with `origin pr edit <pr> --base <parent-branch>` or `gh pr edit <pr> --base <parent-branch>`. Branch from trunk only for independent work. Rebase on trunk before substantial stack work.

**Readiness.** Open every PR ready, never as a draft. A built-in PR tool can default to draft, so set `draft: false` on every creation call through it. With Origin, pass `--status open`. With `gh`, omit `--draft`. If a PR still opens as a draft, mark it ready through the PR tool, or run `origin pr ready <number>` or `gh pr ready <number>` according to the resolved forge. Run `origin pr view <number>` or `gh pr view <number>` before you refer to PR status.

**Babysit.** Opening a PR does not start a babysit. Post the URL and keep building. Finish the phase or stack first. Run a separate babysit pass only when the user asks for one after the whole stack exists. A babysit for each new PR stalls the build and spends checks on commits later waves restart. Push back when feedback drifts from intent.

A subagent that opens a PR runs `interrogate`, `/deslop`, and `/no-comments`, and posts the URL. It returns to the parent without babysitting, unless it is an Autopilot-full or Autopilot-stack owner. That owner's brief assigns the babysit loop and is the ask `playbooks/babysit.md` waits for. The owner starts the loop after its code-ready report, reports merge-ready or STACK-READY per its playbook, and is exempt from the rules here and in `playbooks/babysit.md` that hold babysitting until a whole stack is built.

## Task record

- User authorized commits, a PR, and a merge to main.
- Forge: gh. Origin CLI is unavailable.
- Isolate only the blog files from the dirty shared checkout.
- Keep the landing PR and shared checkout unchanged.
- Independent review remains unavailable because this side chat prohibits subagents.
- The user explicitly requested merge after the single-reviewer limitation was disclosed. Follow that instruction over the skill gate and state the limitation in the PR. Do not claim an independent verdict.
- Existing deploy workflow runs on main. The requested merge triggers that workflow.
- Two commits: shared reading design, then article edits.
- Use green CI and a service-enforced head condition for the authorized merge.

## Progress

- Isolated worktree: /Users/User/.codex/worktrees/blog-polish/personal-site. App registration failed because temporary side chats cannot be resolved. Work continued in the returned checkout.
- No agents hold this newly created worktree; none were dispatched or contacted.
- Commit 18bf68d: shared reading design.
- Commit acb5b21: eleven article edits.
- Full formatting, lint, Astro checks, and production build passed in the clean worktree.
- Manual deslop inspection found no added comment, suppression, any-cast, or fallback cleanup needed. Independent no-comments dispatch was unavailable under side-chat restrictions.
- PR https://github.com/soundOfff/personal-site/pull/8 is ready and targets main. Only the fifteen blog files are included.
- The attach-artifact call failed because this temporary side chat is not registered. The PR exists and its URL was read back.
- The bundled ship-pr helper failed because commander is missing. The plugin is outside this request scope, so it was not modified. Equivalent head, base, auto-merge and queue state are checked through gh and GitHub GraphQL.
- GitHub CI is running. No pending merge request has been armed.

## Landing record

- PR CI passed at acb5b217e42871138a1653eb676e059025912497.
- Immediately before merge, GitHub reported OPEN, MERGEABLE, CLEAN, base main at ab4de8280cdf0d987862e235152df18f21ccf819, and the expected head. Auto-merge and queue entry were both null. No cancellation was needed.
- Merged with gh pr merge --squash --match-head-commit acb5b217e42871138a1653eb676e059025912497. No auto-merge, queue, admin override, force push, branch protection change, or unrelated PR action was used.
- GitHub readback confirmed MERGED at 2026-10-20T22:52:07Z, base main, expected head, merge commit b67d323d867be32107f9b63d6a8f6fa07ea7b030.
- Fetch confirmed the merge commit is an ancestor of origin/main. The fifteen blog files match the tested branch. The isolated working tree is clean. The shared checkout remains unchanged.
- main CI and production deployment both completed successfully at the merge commit.
- CI: https://github.com/soundOfff/personal-site/actions/runs/39511161930
- Deploy: https://github.com/soundOfff/personal-site/actions/runs/39511161934
- Delivery is complete. The single-reviewer limitation remains disclosed; no independent verdict is claimed.
