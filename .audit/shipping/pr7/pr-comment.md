PASS+NOTES. Independent shipping verification by ship_verify_7, who did not write the implementation.

- Head `aa695c909c46e79b3d7dcd91c4eddb3f73d2c4fd` on `codex/parasite-mood-openings`.
- Base `main` at `2fafc84eadb916abd014dee664b159cac35bc742`.
- Stable base-to-head patch-id `e978189d3d3b1c26a1fd0eb924c00b2230228f7e`.

Built both revisions and compared their real Chrome surfaces through CUA. Both photographs load. Parasite B1 and Mood's letter open and close, Escape restores summary focus, the case study and essay links load, and Work/Contact anchors navigate. Main's headings and introductory copy remain present. Checked 1440x900 desktop and 390x844 mobile layouts with no mobile horizontal overflow. Film switching works, including the existing Blade Runner opening.

Head check, lint and build pass. Check reports 0 errors, 0 warnings and 6 hints. Parent build passes. No paid endpoint was exercised.

Cosmetic note for subsequent polish: at 2560x899, the rotated Tomas signature in the open Mood letter crosses the essay link. The link remains operable; the checked 1440 layout separates them. The coordinator is carrying this into PR 9. Local evidence is saved under `.audit/shipping/pr7/`, including `report.md`, `head-mood-open-desktop.png`, `head-mood-open-1440.png`, mobile screenshots and check logs.

No source changes or topology operations were performed by this verifier. Browser tabs are closed, the viewport override is reset, and verifier servers are stopped.
