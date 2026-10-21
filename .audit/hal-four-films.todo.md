# HAL and four screenings

- [x] 1. `how` over the affected subsystem.
- [x] 2. `architect` for parallel design exploration.
- [x] 3. Write the throughput checkpoint as four todo items.
  - Blocking first steps. Read current dirty tree and existing HAL branch before edits.
  - Independent workstreams. Read-only explorers compare designs; one isolated implementation owner.
  - Shared mutable state. Implementation uses /tmp/personal-site-hal-20261021, then a patch applies to the original baseline.
  - Smallest safe decomposition. One owner keeps registry, boot selection, camera lifecycle and HAL endpoint consistent.
- [x] 4. Delegate code-writing to a subagent using your configured feature model.
- [x] 5. Verify on the matching surface.
- [ ] 6. Rebase into small, ordered commits. Stack follow-ups.
  - skip: Preserve the user's existing dirty checkout; deliver a reviewable local diff.
- [ ] 7. If the design is contested, `interrogate` before shipping.
  - skip: No contested design or deployment requested.
- [ ] 8. Run **Opening a PR**.
  - skip: Deliver local changes without publishing unrelated pre-existing work.

## Architecture

- [x] Ground.
- [x] Sketch.
- [x] Agree. Default proceed without human checkpoint.
- [x] Implement.
- [ ] Scrap. Only if evidence disproves the design.

## Data shape

Retain the reel archive and use one selectable-reel collection at all access points. HAL observations are bounded typed page events, separate from free-text conversation. Pointer coordinates remain local. All listeners and requests belong to the active reel abort signal.

## Synthesis decision

Two read-only design passes compared reusing A2UI summaries with extending the existing HAL endpoint. Chosen existing HAL endpoint, separate observation mode and budget. A2UI forces full interface generation and spends the manual question quota. Existing HAL dialog, voice and request parsing are reused selectively from the deployed-code worktree. Static hero visibility moves from the camera cut to HAL's own observer. The original dirty checkout remains the integration target and the implementation runs against an isolated snapshot.

The implementation separates automatic observations into /api/hal-observe while preserving /api/hal conversation compatibility. Both reuse the configured OpenRouter key and global budget. The observation boundary accepts only a closed enum event. Runtime verification found Cloudflare KV rejects TTL under 60 seconds. Fixed the shared limiter's expiry calculation, preserving the shorter observation counting window. Section reactions now wait 650 ms for scrolling to settle.
