# Verification

## Baseline

- Original checkout has existing uncommitted portfolio/blog/opening changes. Snapshot ff236bb in the isolated worktree captures them before this task's implementation.
- `npm run check` passes with zero errors and zero warnings. Six pre-existing hints.
- Browser reproduces published Talk to HAL label at the bottom edge of the metal panel.
- Browser reproduces local five-ticket picker. Before screenshot saved as lobby-before.png.
- Running Astro checks and a Vite dev server against shared dependency cache caused a stale dependency overlay. Final verification must restart the dev server after checks finish.

## Required final evidence

- Four film tickets and four film swatches plus House lights. No Mood control.
- Mood source files retained, saved Mood id rejected by bootstrap and engine.
- Distinct old picture-house lobby with tickets intact.
- HAL home starts visible, Talk to HAL does not overlap speaker, no orbit scroll transformation.
- Normal portfolio remains usable after scrolling.
- Companion appears after hero leaves, opens conversation, can pause, and stops on reel switch.
- English observations use bounded event categories, local-only pointer tracking and a separate automatic quota.
- API rejects invalid event/malformed bodies; actual configured provider returns a plain-text response.
- Build and type checks pass against final code.

## Principles applied

- Model the Domain. Selectable reels derive from the archive; automatic observations are a typed event union instead of free DOM text.
- Boundary Discipline. Parse and bound incoming event data at the endpoint.
- Prove It Works. Verify the rendered landing and a real provider response, then record limits on what was observed.

## Final results

- Final original-checkout `npm run check` passed with zero errors, zero warnings and the same six hints. `npm run build` passed. ESLint passed for all six HAL modules and the shared limiter. Prettier corrected the companion formatting; focused ESLint and diff whitespace checks passed afterward.
- Built HTML independently checked. Tickets are parasite, br2049, budapest and odyssey. Five picker controls include House lights. No active orbit or match-cut markup. Mood opening and client source files remain.
- Browser tested desktop hero, nonoverlapping Talk to HAL label, manual chat, scrolling companion, pointer-driven lens style, pause across navigation, minimize, conversation from offscreen, and companion removal on House lights switch.
- Real configured manual AI response succeeded in the dialog and reduced its daily quota from five to four.
- Real observation endpoint returned HTTP 200 with `The vastness outside warrants careful contemplation.` Browser also displayed an AI observation after the shared limiter fix.
- Invalid automatic event and extra pointer field returned HTTP 400. Oversized body returned 413. Both HAL endpoints reject GET with 405. Empty manual message returned 400.
- Runtime failure reproduced before fix. `KV PUT failed: 400 Invalid expiration_ttl of 25. Expiration TTL must be at least 60.` The shared limiter now stores counters for at least 60 seconds while retaining its 20-second counting window. The same endpoint succeeded afterward.
- Source comparison against snapshot ff236bb found only the fifteen intended existing source files changed. New HAL files are additive. Pre-existing blog, portfolio content and other-film opening edits remain intact.
- Final built Worker served locally with Wrangler. Four-ticket old-cinema lobby visibly verified. Screenshots saved as lobby-after.png, hal-home.png and hal-chat.png.
- Independent review reported no actionable correctness/security issues. Three redundant comments removed. A suggested match-cut issue was retracted because its insertion point was already dormant; its config access was removed as well.
- Exact mobile viewport and audio playback were not exercised. Responsive CSS and reduced-motion paths are present. No deployment, push or PR performed.

## Companion position and voice follow-up

- Moved the companion to the lower left, including its mobile positioning and safe-area offset.
- Voice is enabled by default when the site sound is on. Dedicated Mute HAL / Unmute HAL controls persist the visitor's preference and remain visible when minimized. Unsupported speech engines disable the control.
- Browser verification observed `Synthetic voice · speaking` after Unmute HAL and `Synthetic voice · sound is off` after the global mute. The dedicated toggle also stopped speech and persisted after reload.
- Browser measured companion left offset at 20 pixels. Screenshot saved as companion-left.png.
- Check, build, focused ESLint and formatting passed for this follow-up.
