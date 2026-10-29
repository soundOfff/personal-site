# a. Conservative, synthesized

**Base: A2.** It had the best result. The judge scored A1 27, A2 28 and A3 26, and the coordinator agreed. A2 keeps the name first in each row, the frame's bottom edge as the chapter rail, a two-lane ownership board, and demo logic that resets a play the visitor started once the demo leaves view.

**Judge verdict.** A2 as the base, one point ahead of A1. The judge was the same model family as the runners (only Claude was available), so treat the agreement as weaker evidence.

**Convergence.** The three candidates converged closely on one shape. Each puts one product per row with a demo about 860 to 960 px wide, uses the frame's bottom edge as the chapter track, shows one caption line under it, sends one amber cell around the loop and draws the agents as sprites. The grafts are details, not structure.

## Grafts

- **A1: Tomas's question at every stage, marked ✳.** It sits in each stage's note, between the hint and the tools, in quiet italic. Decide uses the same style instead of A2's one larger line. Tomas's lane (the mobile owners line on small screens) says what the ✳ means. The wide board gained 6 rows. The tall board is now built from each room's top row (`column()` in `layout.ts`), so its spacing is set in one place.
- **A1: one Tab stop per chapter track.** ← and → move between chapters and seek, wrapping at the ends. Home and End also work. Handled keys call `preventDefault()`, so the switcher ignores them. While focus is outside the track, its Tab stop follows the playing chapter.
- **A3: the 2 px dithered frame with stepped corners**, replacing A2's solid `--light` slab. The rail stays solid `--light` with cobalt fill on a paper row, so it reads against the dither. The chapter focus ring moved inside the segment in ink, because the frame's clip-path cut A2's outer ring.
- **A3: a reachable play control** that reads "Play the Sift demo 0:23". Only one play control shows at a time: the labelled one in the frame while the demo is held, the caption toggle while it can run. Focus moves between them when they swap.
- **A3: chapter preview on keyboard focus as well as hover.** The caption shows the hovered chapter, else the focused one, else the playing one, and turns blue when that is not the playing one. This replaces A2's separate preview flag.
- **Fix: lit rooms use tokens only.** The room the cell is in gets a 2 px `--ink` outline around its stepped corners, replacing `#193de0` and `#a3b0ff`.
- Small fixes: `aria-current` is now `"true"` (an empty value counts as false), and the mobile owners line is no longer hidden from screen readers.

## Rejected

- Swapping the lit room to a dither or another token's fill. The dither hurt label contrast, and a cobalt agents' room reads as Tomas's.
- A3's always-visible caption Play/Pause text next to its overlay. Two controls for one action, announced twice.
- Arrows that only move focus while Enter seeks (A3's preview-first model). The brief asked for arrows that seek, so the focus preview shows mainly when Tab lands on a chapter or the video plays on past the focused one.
- A1's and A3's alternating sides, A1's node diagram and A3's canvas workflow. They would change the base's structure, which is not the job of a graft.

## Infrastructure changes

- **Styles render inline** (`<style is:inline>`, every selector prefixed with the root). With HMR off, Astro 6 builds each page's dev CSS list once (`astro/dist/vite-plugin-css`), and the placeholder had no style block. So a scoped `<style>` in `a/` never reached the page without a server restart.
- **Scrolling uses the shared `settle.ts`** (`initSettle(root)`) instead of `scroll-snap-type: y proximity`, per the coordinator. Proximity snapping trapped slow wheel input. CSS snap is off, the cover is not a target, and the snap-align rules on section starts and product rows are now settle targets.

## Verification

- `shoot.py a`, the full run, prints `a: PASS (4/4 cases ok, 61 shots ...)` on desktop and mobile, each with and without reduced motion. The slow-wheel check moves the page about 1,200 px from both #work and #workflow.
- Keyboard (headless Chrome, `keys.py` in the grafter's scratchpad): 22 of 22 steps pass. One Tab stop per track. → twice moves 1 to 3, seeks to 9.0 s and changes the caption, and the switcher stays put. Under reduced motion, Tab reaches "Play the Sift demo 0:23", and Enter plays the demo and moves focus to Pause.
- Workflow fit, measured: no note spills off the board or into a room at 1440, 1280, 1180, 1100, 768 or 390 px. The tightest case is Build at 1180 px, with 2 px to spare.
- Shots judged: each demo sits calm in its dither frame, with the solid rail clear under it. Under reduced motion the play control is legible on every poster. The board shows one question per stage without crowding, and the mobile column stays readable.
