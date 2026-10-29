# C — Typeset
A quiet Pigment portfolio: a hand-set bitmap becomes selectable type, then gets out of the way.

| Reference | Pattern used here |
| --- | --- |
| andreas.vision | Original bitmap-to-type opening, hero replay, directional header, restrained card/media scale. |
| wwwtf.site | Parenthesized nav, cobalt accent, asymmetric features, numbered index and following previews. |
| The Inspiration Grid | Corner tabs, two-tone journal heading, fading excerpts and scrolling mobile themes. |
| Slite | Paper/cards, filters/search, reading column, contents and author/share/related-post closing band. |

Invented: hand-drawn alphabet, pixel cursor, three-line mobile cover, dissolving previews and touch expansion. Fonts are local Geist, Newsreader and JetBrains Mono.
Coverage: home, 13 work pages, 11 posts, journal and 404; filters, search/reset, copy feedback, TOC, history, mobile modal navigation and reduced motion. Three post bodies are complete; eight link to the originals. The agent teaser links to the live playground.
Initial verification: syntax and static 27-page checks passed, but local Chromium launch was denied; initial browser verification was deferred. The fix-round results below supersede that limitation.
Known source gaps: missing media/years were not invented; content follows the shared source. With another day: tune the bitmap spacing further and try the motion on physical touch devices.

## Fix round
- 1 — Fixed: variable-width nine-row alphabet, proper descenders, shared cell size and measured baselines. Hero/404 baseline error is below 0.001px at both sizes.
- 2 — Fixed: pending first-paint guard and failsafe, Geist-only font wait, immediate bitmap initialization inside route rendering, and headings waiting until the reading zone.
- 3 — Fixed: 400ms whole-bitmap hero hold, 120ms heading hold, ease-in-out cell collapse, and real type beginning at 45% of each glyph's resolve.
- 4 — Fixed: 570px / 28.5em reading column; measured first-paragraph median 65 characters on desktop, 41 on mobile. The suggested 600px still measured 69.
- 5 — Fixed: descriptions fade only when measured content overflows, including after filtering, font loading, and resizing; 0/11 desktop and 11/11 mobile descriptions clamp.
- 6 — Fixed: hero replay waits for 60% visibility; smooth footer-to-top replay now presents the complete bitmap beat.
- 7 — Fixed: only the selected title receives the shared transition name; history return names only its matching list row or teaser.
- 8 — Fixed: one 90px anchor offset, Journal remains active during TOC jumps, and About/Writing clear the home navigation selection.
- 9 — Fixed: cursor blinks evenly after the intro; its bottom measures within 0.3px of the baseline on desktop and mobile.
- 10 — Fixed: the mobile category strip has a fading continuation edge and trailing space.
- 11 — Fixed: scroll-frame hit testing retains or retargets the preview under a stationary pointer.
- 12 — Fixed: original markup returns after resolving, restoring kerning; the final period has over 4px of ink clearance at both sizes.
- 13 — Fixed: copy feedback preserves button width until the label restores.
- 14 — Fixed: the scrolled header adds a soft shadow beneath its hairline.
- 15 — Fixed: mobile current-page state, touch plus/close cues, and keyboard-focus parentheses.
- Design judgment — Fixed: section headings gain the same transient pixel cursor; index numbers use the original alphabet, with the same 2px cell unit as the preview dissolve.
- Skipped: none. Existing content/source gaps described above remain unchanged.
- Browser evidence: CDP connected successfully; updated contact sheets and `review/fix-*.png` were visually inspected. Measurements and interaction checks are in `review/fix-check.py` and `review/fix-measurements.json`; route, motion, first-paint, copy-width, and morph checks are in `review/fix-regressions.py`.
- Syntax: `node --check app.js` and `node --check pixels.js` pass.
- Regression checks pass: 27 routes × desktop/mobile × normal/reduced motion; zero runtime errors, zero page overflow, zero idle animation frames, matching forward/back title morphs, stable copy widths, and bitmap-first paint with Geist delayed 600ms. Browser checks were run serially to avoid CDP emulation interference.
- Last screenshot summary: `c: 25 shots in /Users/User/Tomi/personal-site/.prototypes/reference-mix/c/shots, 0 console errors, 0 routes under 200 chars of text`.
