# Integrate Parasite and Mood

## Feature

- [x] 1. `how` over the affected subsystem.
- [x] 2. `architect` for parallel design exploration.
- [x] 3. Write the throughput checkpoint as four todo items.
- [x] 4. Delegate code-writing to a subagent using your configured feature model with a specific scope, named data shape, organizing structure, and success criteria.
- [x] 5. Verify on the matching surface. "Inconclusive" or wrong-surface is not a pass. Flag it.
- [x] 6. Rebase into small, ordered commits. Stack follow-ups.
- [x] 7. If the design is contested, `interrogate` before shipping.
- [x] 8. Run **Opening a PR**.

## Architect

- [x] Ground
- [x] Sketch
- [x] Agree
- [x] Implement
- [ ] Scrap
  n/a: Only if implementation contradicts the chosen shape.

## Arena

- [x] Frame
- [x] Fan out
- [x] Cross-judge
- [x] Pick
- [x] Graft
- [x] Verify

## Throughput checkpoint

- [x] Blocking first steps. Read the render and mount path, compare designs, then fix the interface before delegating implementation.
- [x] Independent workstreams. Read-only grounding and design proposals can run independently. The two openings and shared camera integration have one implementation owner.
- [x] Shared mutable state. The implementation owner receives a separate managed worktree. The lead does not edit it until the owner stops.
- [x] Smallest safe decomposition. One owner integrates both scenes because their camera/CSS boundary must remain consistent. An independent reviewer and browser verification follow the implementation.

## Scope

Promote only Parasite and Mood from the approved four-way prototype. Preserve Budapest, Blade Runner, Odyssey and House lights. Keep project, contact and essay links direct. Make scene revelations optional, touch/keyboard accessible and meaningful with reduced motion. Keep exploratory files out of the production commit.

Completed as commit 2506334 on codex/parasite-mood-openings. PR https://github.com/soundOfff/personal-site/pull/7 is open and not a draft. The implementation is also present in the main checkout, without touching concurrent blog edits.

The design was approved and the architect panel converged. The conditional contested-design interrogate step was not needed for promotion. Independent code review and no-comments review completed.
