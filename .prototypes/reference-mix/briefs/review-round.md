# Review round

You are the independent reviewer for one prototype of the reference mix. The prototype letter and directory are given in your task line as `<x>`. Another model built it. Tomas, the site owner, will open it next to two other directions and pick one, so what matters most is how it feels to use.

Read in order:
1. `briefs/common.md`, the goal, reference patterns and must-haves.
2. Your direction brief in `briefs/` (a-flood-fill.md, b-darkroom.md or c-typeset.md).
3. `<x>/NOTES.md`, the builder's notes. Distrust its claims and check them.

Do not edit the prototype. Write only `<x>/REVIEW.md` and screenshots under `<x>/review/`.

## How to see it

A headless Chromium runs outside your sandbox with the DevTools protocol at `http://127.0.0.1:9222`, and the reference-mix folder is served at `http://127.0.0.1:4321/`. Your sandbox cannot launch a browser, but it can connect to that one.

- Screenshots: `SHOOT_CDP=http://127.0.0.1:9222 SHOOT_BASE=http://127.0.0.1:4321 python3 /Users/User/Tomi/personal-site/.prototypes/reference-mix/shared/shoot.py <x>`
- Contact sheets: `SHOOT_CDP=http://127.0.0.1:9222 python3 /Users/User/Tomi/personal-site/.prototypes/reference-mix/shared/contact.py <x>`, then view the three `<x>/shots/contact-*.png` files.
- Interactions: write short Python Playwright scripts that call `p.chromium.connect_over_cdp("http://127.0.0.1:9222")`, open `browser.new_context(...)` at 1440x900 and at 390x844 with touch, and drive hover, clicks, keys and scrolls. Capture frame sequences for animations. Close only the contexts you open, never the browser.

## What to check

Every must-have in the common brief and every pattern in the direction brief. In particular, check these.

- The pixel moment on first load, on every return to the top, and on navigating back home, frame by frame.
- Every route transition, including back and forward.
- Every hover, press and focus state, and the touch equivalents.
- Filters, search, empty states, and copy feedback.
- Keyboard reach, visible focus, and Escape on overlays.
- Reduced motion shows final states.
- Console errors.
- Whether animation loops stop offscreen.

## Write `<x>/REVIEW.md`

- Findings ranked from blocking to polish, at most 15. Each has what is wrong, the evidence (a screenshot path, a measured value or a console line), and a concrete fix that names the file and what to change.
- A short "keep" list of what works and must not regress.
- Two or three sentences of honest design judgment. Does the pixel moment deliver what Tomas asked for? What would make this direction delightful?

Your final message is 150 words or fewer. It gives the path to REVIEW.md, the top three findings, and whether the CDP connection worked.
