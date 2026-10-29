# c2. The cave becomes a map

**Concept.** The cover's flood opens into a small pixel world. `#workflow` is a level map: five rooms on one corridor (Frame, Design, Build, Review, Decide), two original agent sprites (Claude Code, Codex CLI) walking it, and the amber shortest path filling in behind them, which pays off the cover's line "Every good idea finds a path". `#work` is three rooms: each demo sits in a clearing carved out of a cobalt cell halo, revealed by a draining flood, with its chapters as a clickable beat list and a whole-cell progress track.

**Reading in 30 seconds.** The map is a header row for five text columns aligned under their rooms, so every stage's tools and "✳ my call" question is visible at once. Nothing hides behind a click. The walk detours once from Review back to Build along a dashed return corridor; a second, longer loop returns to Design. Both loops carry labels inside them.

**Alternatives rejected.**
- RPG party screen as the main frame. The party survives as a three-line legend; as the whole section it turned stage content into menu chrome and hid the loop.
- Pixel machine with belts and gauges. Direction of the feedback loop read worse than corridors, and it needed far more drawing.
- Cartridges or cabinets for products. Reads as a device mockup and puts the demo inside a toy. The brief wants the demo as the hero.
- A full cave behind each room, like the cover. Too busy next to dense UI recordings; the halo keeps paper dominant.
- Tabs or a stepper for stages. Hides four of five stages from a 30 second scan.
- A dither wipe driven by scroll between sections. Any scroll-tied JS risks fighting momentum; the per-room flood reveal does the same job on IntersectionObserver.
- A snap point at the cover's top. Proximity pulls small trackpad scrolls back to 0 and fights the scrub, so the first snap is `#workflow`.

**Snapping.** `html` gets `y proximity` (no `mandatory`, no `snap-stop`), snap starts on `#workflow`, each room, every later section and the footer. `scroll-padding-top` drops to 0 while snapping, because rooms are full-viewport and carry their own header clearance. Off under reduced motion and below 640 px tall.

**Prior art.** loadmo.re for poster plus silent loop and a tiny caption. cursor.com for demos on a textured backdrop instead of a device frame. Pixel Agents / pixtuoid for agents as sprites with a walk cycle. daisyUI RPG notes for whole-number sprite scales and a scene with a status legend. Anthropic's evaluator loop for the Review to Build return path.

**Known gaps.**
- Loop labels are positioned for wide screens; between 900 and 1100 px wide the Build loop label can overflow its loop.
- On mobile the stage list is long (about two viewports) and drops the owner tag.
- The walk timeline restarts after Decide; it does not react to which column you hover beyond highlighting the room.
- Halo and wipe cells are 20 px on desktop and 10 px under 600 px of screen width, not tied to the cover's cell exactly.
