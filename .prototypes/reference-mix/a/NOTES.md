# A — Flood fill

A connected cave, rather than a decorative particle field: the flood and amber path
use actual breadth-first distances. All changes are confined to `a/`.

| Reference pattern | Where it went |
| --- | --- |
| andreas.vision: one cell system, intro, scroll handoff | Original cave flood; 200vh cover; reverse drain; header glyph; re-bloom; R/click reseed |
| andreas.vision: navigation and page motion | Hiding pill nav; click-origin cell-wave route cover; reduced-motion final states |
| wwwtf.site: one accent, gallery scrub, active parentheses | Cobalt UI; screenshot scrubbing with 0.12 lerp; touch swipes; stable nav labels |
| wwwtf.site: zigzag gallery and giant CTA | Sift / FocusQuote / Catcher bento; journal invitation |
| Inspiration Grid: ghost headlines, media tint, corner tab | Section headings; blurred project-image backdrops; category tabs |
| Inspiration Grid: mobile categories and excerpt fading | Fixed 56px journal topic bar; gradient-faded excerpts |
| Slite: paper, featured articles, discovery | Two featured cards; three-column journal; live title search and topic filters |
| Slite: reading and closing band | 65ch prose; scrollable code/tables; contents; date/time; copy link; bio; related posts |

## Invented here
- Seeded value-noise caves, two smoothing passes, and narrow corridors joining rooms.
- Amber shortest paths through real open cells; deterministic project covers and mirrored post sigils.
- Paper-backed italic headline blocks and a pixel asterisk that docks in the wordmark.
- Footer asterisk with pointer-triggered BFS rings; cell-based reading progress.

## Verification
- `node --check app.js` and `node --check pixels.js`: passed.
- Offline render check: 27 route templates; valid internal work/post links; no thin routes.
- All shared image references exist. Content: 13 projects, 11 posts, 3 complete post bodies.
- Cave checks at 1440×900, 390×844, and 400×250: every floor connected; every shortest path valid; 34–35% walls.
- Required `shoot.py a` ran but Chromium could not launch in this sandbox.
- Last summary line: none. Launch failed with `bootstrap_check_in ... Permission denied (1100)`.
- Browser-tool preview was also denied by origin approval. No PNGs were produced or visually reviewed.

## Known gaps / another day
- Browser rendering, console cleanliness, interaction timing, and mobile overflow remain unverified.
- The cave-to-wordmark handoff blends a separate pixel glyph rather than tracking each original cell.
- With another day: complete the screenshot matrix, tune flood composition on actual screens, and refine the cell-to-glyph choreography.

## Fix round

Findings: **1 fixed** — visible header and identical docked glyph; **2 fixed** — 21 visible seed-neighbor cells assemble, drain ends early, path drains; **3 fixed** — cell-aligned text masks; **4 fixed** — directional nav hysteresis; **5 fixed** — independent word fades; **6 fixed** — touch traces, double-tap reseeds; **7 fixed** — reseeding preserves words; **8 fixed** — cobalt header tokens; **9 fixed** — ink cover titles in masked clearings; **10 fixed** — complete-cell reading progress, absent on excerpts; **11 fixed** — 32em reading column; **12 fixed** — armed return ripple and replay reset; **13 fixed** — event/epoch-driven drawing; **14 fixed** — fully hidden header and throttled footer rings; **15 fixed** — 8px word seeds and dithered route edge. Nothing skipped.
Verification supersedes the earlier gaps: CDP worked; desktop/mobile interactions, reduced motion, contact sheets and JS syntax checked. Idle cover: 4–5 draws/3s. Evidence: `review/fix-*.png`, `review/fix-observations.json`, `review/fix-details.log`. Last shoot: `a: 25 shots in /Users/User/Tomi/personal-site/.prototypes/reference-mix/a/shots, 0 console errors, 0 routes under 200 chars of text`. Another day: tune cell trajectories and cave clearings across more screen sizes.
