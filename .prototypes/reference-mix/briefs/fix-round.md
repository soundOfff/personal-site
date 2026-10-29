# Fix round

You are fixing one prototype of the reference mix after an independent review. The prototype letter and directory are given in your task line as `<x>`.

Read in order:
1. `briefs/common.md`, the goal and must-haves for all prototypes.
2. Your direction brief in `briefs/` (a-flood-fill.md, b-darkroom.md or c-typeset.md).
3. `<x>/REVIEW.md`, the reviewer's ranked findings, keep list and design judgment.
4. `<x>/NOTES.md`.

Write only inside `<x>/`. Never modify `<x>/REVIEW.md` or anything outside `<x>/`.

## What to do

Fix every blocking and major finding. Then fix as many polish findings as are cheap. Do not regress anything on the keep list. When the review's design judgment names what would make the direction delightful, treat it as a finding and do the cheapest version that lands it.

## You can see the page now

A headless Chromium runs outside your sandbox with the DevTools protocol at `http://127.0.0.1:9222`, and the reference-mix folder is served at `http://127.0.0.1:4321/`. Your sandbox cannot launch a browser, but it can connect to that one.

- Screenshots: `SHOOT_CDP=http://127.0.0.1:9222 SHOOT_BASE=http://127.0.0.1:4321 python3 /Users/User/Tomi/personal-site/.prototypes/reference-mix/shared/shoot.py <x>`
- Contact sheets: `SHOOT_CDP=http://127.0.0.1:9222 python3 /Users/User/Tomi/personal-site/.prototypes/reference-mix/shared/contact.py <x>`, then view `<x>/shots/contact-desktop.png`, `contact-mobile.png` and `contact-reduced.png`.
- Interactions: write a short Python Playwright script that calls `p.chromium.connect_over_cdp("http://127.0.0.1:9222")`, opens `browser.new_context(...)`, and drives hover, clicks, keys and scrolls. Save frames under `<x>/review/fix-*.png` and look at them. Close only the contexts you open, never the browser.

If the connection to port 9222 fails, say so plainly, keep fixing from the code, and still run `node --check` on every JS file.

Iterate until `shoot.py` exits clean and the contact sheets look right.

## Report

Append a "Fix round" section to `<x>/NOTES.md` that lists each finding number as fixed or skipped, with a reason for each skip. Your final message is 150 words or fewer. It gives the last `shoot.py` summary line, what you fixed, what you skipped and why, and whether the CDP connection worked.
