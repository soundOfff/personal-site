# Open implementation findings from blog review

These are tracked locally because this side-conversation task authorizes blog changes, not a redesign of the live inference controls.

## Global quota is best-effort

Status. Open.

Source. `src/lib/ratelimit.ts`, consume and checkGlobalLimit.

The shared daily counter is KV-backed read-modify-write. In-isolate increments prevent one local race but do not provide a globally atomic admission decision. Separate isolates can read stale counts. A shared key also encounters KV's per-key write-rate limit. Calling this an exact global ceiling is unsupported.

The article now describes the configured target and its limitations. No rate-limiter code changed.

## Missing KV removes durable coordination

Status. Open policy decision.

Source. `src/lib/ratelimit.ts`, consume's missing-KV branch.

The implementation permits requests using only in-memory allowance when KV is absent. Isolate restart or multiplication creates fresh local counters. Cheap individual requests do not prove a bound on aggregate spending.

The article documents this distinction. A fail-closed production policy, atomic budget, or provider-side cap requires separate implementation and verification.
