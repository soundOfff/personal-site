# Landing copy delivery

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

## User-directed delivery

- User explicitly requested commits and a direct merge to main after the single-reviewer limitation was disclosed. No PR is required for this delivery.
- No subagents may run in this side chat. No independent verdict is claimed.
- Reuse the clean worktree from this chat. Do not modify the dirty shared checkout, other worktrees, or the open film-design PR.
- Main is b67d323d867be32107f9b63d6a8f6fa07ea7b030 at entry. The open film-design PR is #7 at 250633484b2fac9a3246e5dd6d4b5cdf75bc9afc and is not part of this delivery.
- Copy eleven independent files exactly. Port the same editorial direction to the existing Mood and Parasite scene markup on main, because their newer markup belongs to the other PR.
- Validate the exact isolated result before committing. Deliver three ordered commits for the landing, agent wording, and film copy.
- Use a normal fast-forward push to main. Never force push or change branch protections.
- Verify the remote commits, file contents, CI and production deployment.
- The bundled ship-pr helper previously failed due to a missing commander dependency. Git and GitHub API readback will verify the direct update.

## Checklist

- [x] Prepare the isolated copy-only branch.
- [x] Run formatting, lint, type and build checks.
- [x] Verify the exact rendered result.
- [x] Create the commits.
- [x] Push the verified revision to main and read it back.
- [x] Confirm CI and production deployment.

## Preparation record

- Branch codex/landing-copy starts at main b67d323 in the clean worktree /Users/User/.codex/worktrees/blog-polish/personal-site.
- Thirteen changed files. Only copy changes; no design, dependencies, API logic, or schema changes.
- The eleven independent files match the reviewed local copy. Mood and Parasite retain the current main scene markup. Their headlines and captions use the same simpler editorial direction. The future photo disclosures remain in the separate local design work.
- Full repository formatting, lint, Astro checks and build passed. Astro reported zero errors and warnings, with six existing hints.
- Desktop screenshots showed that Mood needs a shorter title beside its existing window frame. The title is now Work and notes. A fresh build is running.
- Deslop inspection found no new suppressions, casts, guards, or implementation comments. Independent agents remain prohibited by the side-chat rules.

## Delivery record

- c2e24cc: landing introduction, work summaries, projects, activity and navigation copy.
- 8d6b1f6: agent launcher, prompts, welcome and error wording.
- 2fafc84: film-opening text on the current main markup.
- All six themes were checked at a 375px viewport. Page width and viewport width matched in every theme.
- Mood and Parasite desktop headings fit their current scene layout. Mood was shortened to Work and notes.
- A normal fast-forward push advanced main from b67d323 to 2fafc84eadb916abd014dee664b159cac35bc742. No force, new PR, protection change or unrelated branch write was used.
- GitHub readback confirmed main at 2fafc84eadb916abd014dee664b159cac35bc742.
- CI run 39513948061 and Deploy run 39513948174 are running.
- The primary dirty checkout was not changed by this shipping pass.

## Confirmed outcome

- main CI passed: https://github.com/soundOfff/personal-site/actions/runs/39513948061
- Production deployment passed: https://github.com/soundOfff/personal-site/actions/runs/39513948174
- GitHub compare confirmed exactly three commits on main.
- Fetched origin/main matches the verified branch exactly and the isolated working tree is clean.
- The open design PR #7 is now CONFLICTING because Mood and Parasite overlap with the new copy. Its branch, auto-merge state and files were not modified. It needs conflict resolution before landing.
- Actual delivered patch is .audit/landing-copy-main.patch. The earlier .audit/landing-copy.patch records the copy on the photographic scene version, which remains separate.
