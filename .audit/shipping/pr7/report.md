# PR 7 independent shipping verification

Verdict: PASS+NOTES.

Verifier: ship_verify_7, independent from the implementation author.
PR: https://github.com/soundOfff/personal-site/pull/7
Head branch: codex/parasite-mood-openings
Head SHA: aa695c909c46e79b3d7dcd91c4eddb3f73d2c4fd
Base branch: main
Base SHA: 2fafc84eadb916abd014dee664b159cac35bc742
Stable base-to-head git patch-id: e978189d3d3b1c26a1fd0eb924c00b2230228f7e
Destination: soundOfff/personal-site main.

## Observed behavior

Built both recorded revisions in separate detached worktrees. Drove the generated static pages in real Chrome through CUA on localhost ports 4180 and 4181. No external Playwright process was used.

- Compared parent and head Parasite and Mood openings. The new photographs load. The main headings and introductory words match the recorded main base.
- Parasite B1 opens through its native disclosure. Escape closes it and returns focus to the summary. The engineering link loads the Mint case study. Work and Contact anchors reach #work and #now.
- Mood letter opens through its native disclosure. Escape closes it. The essay link loads The unglamorous middle in the new blog layout. Native lettering remains visible.
- Desktop at 1440 by 900 and mobile at 390 by 844 remain readable. Both mobile disclosures expand in document flow. The measured mobile document scroll width was 375 with an inner width of 390, so there was no horizontal overflow.
- Switching from Mood to Parasite and to Blade Runner works. Blade Runner's illustrated opening still renders. Other films' opening files were outside the diff; they were not all driven independently in this focused verification.

## Note

At 2560 by 899, the rotated Tomas signature in the open Mood letter crosses the essay link near x1305, y450. This is a visible cosmetic defect in the new panel. The essay link remains operable. It does not overlap at the checked 1440 desktop size. The coordinator is carrying this polish into PR 9 before the final stack is complete.

Reproduce by choosing Mood at the wide desktop size and opening A letter left unfinished. See head-mood-open-desktop.png. The true 1440 comparison is head-mood-open-1440.png. The likely cause is rotation of a full-width signature paragraph about its center, inferred from the source. No proposed fix was tested by this verifier.

## Checks and evidence

- Head npm run check passes with 0 errors, 0 warnings and 6 hints. See check.log and check-exits.json.
- Head npm run lint passes. See lint.log and check-exits.json.
- Head npm run build passes with exit 0. See build.log.
- Parent npm run build passes with exit 0. See base-build.log.
- Landing inspection found no auto-merge request or queue entry. See landing-record.json.

Screenshots are in this directory. Head screenshots include both photos, both expanded panels, the 1440 Mood letter, both 390 mobile openings and expanded panels, and Blade Runner. Parent screenshots include both openings at desktop and mobile sizes.

The concurrent Astro dev servers initially collided in the shared symlinked Vite dependency cache. Both were stopped. Browser verification then used the successful build outputs through Python static servers. This was a verification environment issue, not a source defect.

## Handoff

Prove It Works shaped the verification choice. The verdict uses direct browser interactions with both built revisions, rather than relying on passing compilation alone.

No tracked source files were changed. The only worktree addition was the requested node_modules symlink. No commits, push, merge or retarget occurred. Both browser tabs were closed and the viewport override was reset. Both Python static servers and both Astro dev servers were stopped. No active verifier server remains. Worktrees remain available for evidence inspection.
