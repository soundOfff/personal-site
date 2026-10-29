# c. Synthesis of C1, C2 and C3

**Base: C1.** It keeps every stage, cast member, tool, call and both loops on screen at once, inside a real pixel world, and its demos read best on mobile. The judge scored C1 25, C2 25, C3 26 and recommended C1 as the base. C3 is the most art-directed but shows one stage card at a time and freezes on Frame under reduced motion, so four stages hide from a reader. C2 is the tamest. The coordinator first leaned C3 and switched after reading the judge's clarity argument. The judge was the same model family as the runners (only Claude was available), so its agreement is weaker evidence than a cross-family verdict.

**Convergence.** All three built a five-room overworld with return loops from Review and flood-revealed demo rooms. That shape ships unchanged. The grafts change how much cobalt there is, how the controls work and what text is visible.

## Grafts

- **One halo rule, from C2** (`c2/world.ts` drawHalo). `haloTone()` in `world.ts` makes cells solid at the wall, dithered further out and thinner with distance. The same rule now draws the map (replacing C1's `shoreTone` band) and every demo room. Each place stretches distance on its quiet sides. On the map that is above (the heading), below (the status line) and the page edges. In a room it is the copy side (found from the title's position, so it flips with the alternating sides and becomes the top on narrow screens) and the side under the bar. The map's walls between rooms stay. The full-bleed band and the shores running off both page edges are gone.
- **Demo control bar, from C3** (`c3/Variant.astro` c3-bar, `c3/rooms.ts` expand). It has play/pause, C1's 40-cell track, the loop length and full screen, all with C3's pixel icons, under each screen. It replaces C1's corner button. The bar is paper and part of the clearing, so the halo wraps the screen and its controls as one window. C1's track was paper on cobalt, which would vanish once the halo thinned. In the bar it is line cells that turn blue as the loop plays. The reduced-motion poster keeps C1's big blue play as a mouse target. The keyboard uses the bar button.
- **Tool purposes as text, from C3** (`c3-tool-why`). On narrow screens they sit inline under each tool. On the wide map the rooms at rest stay as C1 drew them. Resting the pointer on a room's tools for 150 ms (hover intent, so a parked cursor or a passing scroll opens nothing), or tabbing to its tools list, opens an RPG-style text box over its lower half with each tool's source and purpose. It is absolutely placed, so nothing shifts, and it is sized to clear the room title. The inline copy stays in the accessibility tree at every width.
- **Viewport-fit stage and hidden-tab pause, from C2** (`c2` room-stage width, visibilitychange). The clearing is `min(100%, (100svh - 320px) * 1.6)` wide on screens at least 640 px tall. `want()` returns false while the tab is hidden, so one `visibilitychange` listener pauses and resumes every demo.
- **Fixed in C1.** `scroll-margin-top: -100px` let the header cover section intros. Now `#workflow` and `#work` use -60 px and rooms use -40 px (with the 100 px scroll padding), so each section's first line lands about 24 px under the header. The root guard moved to the head of the client script.
- **Scrolling, coordinator change.** CSS proximity snapping trapped slow wheel input. The page now uses the shared `../settle.ts` (`initSettle(root)`), a directional settle that only glides forward to a near target. `scroll-snap-type` is `none`, the cover is not a target, and the existing snap-align rules are the settle targets.
- **Styles are `<style is:inline>`.** With hot reload off, the shared dev server cached each page's CSS list, so newly bundled style blocks did not load. Every selector starts with `html:has([data-proto='c'])`, so nothing leaks, and edits load without a restart.

## Rejected

- C3's 5x7 bitmap sign font. It would be a fourth type voice beside Newsreader, Geist and JetBrains Mono.
- C3's one-card-at-a-time stage panel and 2x3 snake map. They hide stages, which is C1's main advantage.
- C2's 10 px cells on small screens. The world keeps the site's 20 px cell everywhere.
- C2's clickable canvas track. C1's beats already seek, and the track stays a readout.
- Pausing the tour while a room is inspected. The tour already has a Pause button.

## Verification

- `python3 src/prototypes/showcase/shoot.py c` printed `c: PASS (4/4 cases ok, 61 shots ...)`. The slow-wheel check moved 1089 px from `#workflow` and 1130 px from `#work` in 10 notches, with no trap.
- A separate headless Playwright script checked the keyboard path. Tab walks Frame, Design, Build and Review tools, and each opens its text box below the title. Tab from "More about FocusQuote" lands on play/pause, Enter and Space toggle the video, and the next Tab reaches full screen. A cursor on a room's sprites opens nothing. A hidden tab pauses every demo. There are no console errors.
- The same script checked landing. Every section and room lands with its first line at least 20 px under the header (desktop and 390 px). Each desktop demo and its bar fit the 900 px screen, with Sift ending at 810 px. Mobile tool purposes are inline, and there is no horizontal overflow.
- Cobalt pixels in the variant's region (full-page capture, recordings hidden): C1 20.6%, c 8.5%.

**Known gap.** With purposes inline, the 390 px workflow is about four screens tall.
