# A2UI arena

- [x] Frame.
- [x] Fan out.
- [x] Cross-judge.
- [x] Pick.
- [x] Graft.
- [x] Verify.

## Throughput checkpoint

- Blocking first steps. Inspect the live launcher and agent panel, current React state and film overrides. Freeze the dirty checkout as the shared baseline.
- Independent workstreams. Three implementation candidates each own an isolated worktree. All receive the same production task.
- Shared mutable state. Candidates cannot modify the original checkout, call live APIs or run shared Vite build/check caches concurrently. Parent alone integrates and verifies.
- Smallest safe decomposition. Each candidate owns the full launcher-to-answer experience so markup, state and CSS remain coherent.

## Artifact

A working improvement to the A2UI launcher, panel, composer and answer presentation. Preserve real model-generated A2UI surfaces, film styling, backend quota enforcement, semantic controls and existing HAL integration. Compare implementations, choose a base and graft specific strengths.

## Rubric

Score each from 1 to 5.

1. Clear first action. Visitors can ask immediately without reading a wall of starter questions or protocol explanations.
2. Reading and conversation feel. Replies start in a useful viewport position, follow-ups stay easy to reach and the panel feels composed rather than like a debug console.
3. Honest interaction states. Pending, cancellation/reset, network failure, retry and daily allowance remain correct, with drafts and conversations preserved as appropriate.
4. Film integration and accessibility. The four film themes and House lights retain their identity. Keyboard, reduced motion, mobile geometry and HAL coexistence remain usable.
5. Maintainability. The change respects existing renderer/API contracts and keeps lifecycle and styling ownership small and clear.
