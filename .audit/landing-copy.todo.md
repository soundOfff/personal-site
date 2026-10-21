# Landing copy polish

### Feature

**You own the design. Plan, review, verify.** Delegate implementation. Stay in the lead.

1. `how` over the affected subsystem.
2. `architect` for parallel design exploration.
3. Write the throughput checkpoint as four todo items. A dimension that genuinely does not apply (single file, no fan-out) keeps its item with `n/a: <reason>` rather than being dropped:
   - **Blocking first steps.** Gates run before fan-out.
   - **Independent workstreams.** Disjoint files, services, or layers parallelize. Shared writes serialize.
   - **Shared mutable state.** Default to splitting the target (the **separate-before-serializing-shared-state** principle skill). Serialize only for real invariants.
   - **Smallest safe decomposition.** If one worker is best, name why.
4. Delegate code-writing to a subagent using your configured feature model (default in poteto-mode's Models section) with a specific scope (file paths, named data shape and its organizing structure per **principle-model-the-domain**, a state machine over scattered booleans, a table/registry over branching, a typed model over repeated shape assumptions, chosen before the delegate writes logic, and success criteria). Pick each subagent's reasoning level for the job, per the Subagents section. When the implementation admits multiple valid shapes (error handling, abstraction layer, test structure), delegate via the **arena** skill instead so the runners surface the alternatives and the cross-judge guards the pick. Mandatory: no skip-with-reason escape, and Laziness Protocol does not override it (the gain is review separation, not lines saved). A subagent forbidden to spawn satisfies this by owning the diff directly with the same review separation. No "standing by" reply that waits on a nested agent. **Give every file-writing delegate its own worktree** (spawn it with `isolation: "worktree"`, or hand it an exclusive branch), and do not write files or run a suite in a worktree a delegate still holds. On Claude Code, `isolation: "worktree"` branches from the remote default branch unless the `worktree.baseRef` setting is `"head"`. When the delegate builds on commits the default branch lacks, commit them, create its worktree with `git worktree add <path> -b <delegate-branch> HEAD`, and name that base commit in the brief. Fencing a file in the brief's prose is not a lock (**principle-separate-before-serializing-shared-state**). Comments per **Comments**. Surgical edits, re-ground against the source for upstream-derived files. Port shared-primitive improvements to all consumers and verify each. Commit liberally.
5. Verify on the matching surface. "Inconclusive" or wrong-surface is not a pass. Flag it.
6. Rebase into small, ordered commits. Stack follow-ups.
   Use the **sequence-verifiable-units** principle skill, building, verifying, and committing each small unit before the next.
7. If the design is contested, `interrogate` before shipping.
8. Run **Opening a PR**.

Code-coupled work (one feature, one migration) goes to a single owner with the checkpoint inline. That owner fans out internally after the blocking phase. Parent-level fan-out is for slices that produce independent artifacts (audits, cross-subsystem investigations, competing experiments). Rewrite the checkpoint at phase boundaries. Spawn a fresh owner rather than chaining interrupts.

**Reply:** what you built, what you chose and why, the throughput checkpoint, open decisions. Tables for design alternatives.

## Applied scope

- [x] Read the landing content, shared data, work summaries, agent welcome, and the project brief.
- [x] Edit the hero, project descriptions, work teasers, practices, activity log, and agent copy.
- [x] Replace vague professional copy in the film openings while retaining their presentation.
- [x] Check formatting, types, the rendered desktop and phone layout, and the edited diff.

## Throughput checkpoint

- Blocking first steps. Check every factual statement against the existing portfolio and the author's confirmations.
- Independent workstreams. n/a: one copy pass; no agents are allowed in this side chat.
- Shared mutable state. The parent is editing film presentation. Make only exact, minimal text replacements in those files. Leave CSS, event handlers, selectors and unrelated changes intact.
- Smallest safe decomposition. One writer edits existing strings. No new data model, runtime behavior, or dependency is needed.

## Playbook adaptation

- how and architect: skip new architectural exploration because this is prose in existing content fields. Existing content ownership was read directly.
- Delegation and independent panels: skip because side chats forbid subagents. No independent verdict is claimed.
- Commit and PR steps: skip for this local copy pass. The previous shipping request covered the blog.
- Laziness Protocol: retain existing content fields and markup; change only prose.
- Prove It Works: inspect the rendered text and line wrapping in the browser.

## Result

- Thirteen files contain copy changes. No CSS, event handler, data shape, API or dependency changed.
- Targeted ESLint, Prettier, Astro checks and the production preview build passed.
- All six themes fit a 375px phone viewport with no page overflow after shortening the emphasized phrase.
- The agent welcome panel was opened and read on mobile. No live request was sent.
- Copy-only patch: .audit/landing-copy.patch. Editorial record: .audit/landing-copy-review.md.
- Delivered in three commits directly to main at 2fafc84. CI and production deployment passed. The separate design PR #7 needs conflict resolution for its overlapping scenes.
