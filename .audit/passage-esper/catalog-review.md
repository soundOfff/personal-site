# Independent catalog review

Reviewed the complete integrated `BoxOffice.astro`, `boxoffice.ts`, and `boxoffice.css`, plus the Switcher label change. Read engine switching, bootstrap, and registry code as supporting evidence. This is source review only. No tests, scripts, builds, or browser checks ran.

## Finding

P2. Dismissing a pending choice exposes competing rail selections before the old choice completes.

`src/reels/boxoffice/boxoffice.ts:166` changes the state to choosing with a null session and calls `hide`, which restores background interaction. The awaited `switchReel` at line 135 continues. In `src/reels/engine.ts:281`, the instant path neither claims the engine's `switching` lock nor checks whether a newer request superseded it after preload.

Source-inferred reproduction. Start a cold film selection in the catalog, press Escape while its module is loading, then select another film from the rail. If the old catalog preload finishes after the newer selection, it calls `apply` and replaces the newer reel. The catalog state prevents catalog reentry but does not serialize the rail.

Use a shared selection generation or cancellation contract so an older request cannot apply after a later request. Alternatively, enforce one shared lock for all selection controls until the pending selection settles. A browser check with delayed loading should exercise this sequence after the fix.

## Other checks

- Source inference. The revised try/catch ends before success changes the state to closed, so error handling reads the choosing state's session without a cast or invalid union access.
- Source inference. Native close events queued by `hide` cannot dismiss a newly reopened dialog because the close handler checks `dialog.open`. Completion after a pending dismissal does not steal focus because the visible session is null.
- Source inference. Normal reopened dismissal restores the connected opener. Successful visible selection focuses the visible portfolio heading. The fallback modal snapshots each sibling's inert value and restores it on hide.
- Source inference. The fallback modal traps Tab at its first and last controls and handles Escape. Native modal behavior supplies the corresponding containment when `showModal` succeeds.
- Source inference. First-visit Skip selects House lights. With JavaScript disabled, bootstrap never sets the first-visit attribute and the closed dialog stays hidden. If bootstrap runs but the module fails, the native House lights anchor targets `#readme`; the first-visit CSS stops hiding the portfolio when a target exists.
- Source inference. Mobile CSS changes to two poster columns, hides the redundant collection label, retains the sound label for assistive technology, and allows catalog scrolling. Pixel fit and contrast were not independently observed.
- Source inference. Both the catalog and rail use `SELECTABLE_REELS`; the registry excludes Mood, and `reelById` also rejects it. Four film cards and House lights are the current selectable choices.
- Source inference. Busy state blocks duplicate catalog requests through the state guard while preserving the close control. The current-choice marker uses `aria-current`, and selection progress uses a live status element.

## Comments audit

Application files touched by this reviewer are none. Proposed comment deletion count is zero. The three catalog files contain no comments or suppressions. The unchanged Switcher header is outside the label-only diff. MUST KILL flags are none.

The previous six changed Odyssey comment lines and adjacent read/write narration were reported deleted by the parent. That cleanup was not part of this catalog-only audit.

Type System Discipline informed the review of the closed, browsing, and choosing union. Its nullable choosing session correctly represents a dismissed pending catalog, but it cannot coordinate a separate rail caller.

## Fix review

Re-read the actual engine instant branch after the parent added its shared `switching` lock. The P2 race is closed by source inspection. The branch sets the lock before its first await and holds it through preload, apply, mount, and announcement. Rail requests during that period now return before preparation or mutation, consistent with the engine's existing policy of ignoring requests during a switch. `finally` releases the lock on success and failure. Escape can still dismiss the catalog immediately. Re-read the catalog's narrowed try/catch and found no further issue. This verdict is source evidence only; the parent's build and planned runtime checks are separate evidence.
