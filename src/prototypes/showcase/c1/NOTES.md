# c1. Clearings in the flood

**Concept.** The cover's cobalt flood does not end at the cover. Below it, every section is a paper clearing carved out of the same cave: the workflow is an overworld map where one idea (the amber ✳, the cover's shortest-path color) walks from room to room, and each product is a clearing whose flood drains away to reveal its demo.

**Workflow (#workflow, 2nd).** Five rooms on one rail (Frame, Design, Build, Review, Decide). Each room shows who works there (Tomas, or Claude Code and Codex as original sprites), its tools with their source, and Tomas's call for that stage, prefixed by his mini sprite. Two return lanes run under the rooms: "Failed checks return to Build" and "A wrong approach returns to Design". The idea walks the rail and alternates loops: one cycle is sent back by failed checks, the next by a wrong approach. A status line narrates the current stage. Pause control included. Under 1280 px the map turns vertical: the rail runs down the left, the lanes run up the right, and the labels sit in the gaps between rooms. The geometry is computed from the DOM, so the same code draws both layouts.

**Work (#work).** One clearing per product. The demo sits inside a cobalt shore that thickens near the screen and dissolves into paper in noise blobs. It pours off the page edge on the far side, and the clearings zigzag down the page. On first view the shore floods outward, and the cells covering the screen drain from blue through dither to the video (BFS-style order, about 1 s). Chapters show up three ways: a numbered list that seeks on click, a caption chip on the video, and a 40-cell track on the shore. A small header row links to each room.

**Snapping.** `y proximity` on `html`, with snap points at the cover top, #workflow, #work (header plus Sift), the FocusQuote and Catcher rooms, and every later section. My sections snap flush to the top (`scroll-margin-top: -100px`) because the header hides on scroll down. It is off under reduced motion and below 640 px of height.

**Alternatives rejected.**
- RPG party screen as the whole workflow. It shows the agents well but turns the loop into a list. I kept only its party legend in the heading.
- A belt-and-gauge machine. Reads as a diagram, not a world, and the loop arrows got lost.
- Cartridges or a console for the products. That is a device mockup in disguise, which the loadmo.re reference argues against, and it shrinks the video.
- A full-height cave behind the whole page. Too much cobalt. The shore only hugs clearings, so paper still dominates.
- Rooms where the idea walks through the text. The rail runs along each room's top ring and the loops along the bottom ring, so no text is ever crossed.
- Mandatory snapping per room. Proximity keeps the tall map and the index free to scroll.

**Prior art used.** cursor.com: a textured backdrop (here the shore) instead of a device frame. loadmo.re: poster under a muted loop, a tiny caption. Pixel Agents and pixtuoid: agents as sprites that animate while their room is active. "Building effective agents": the evaluator-optimizer loop, drawn as the Review lanes. daisyUI RPG notes: a central scene with a party legend.

**Known gaps.**
- Tool purposes only show as hover titles. There is no keyboard path to them.
- Before a room scrolls in, its screen is a cobalt block. A full-page capture taken before a visit shows blocks.
- Sprite poses are a two-frame bob only. There are no per-activity frames (typing, reading).
- The cobalt shores and the experience band sit close together. The middle of the page is blue-heavy at 1440 px.
- Vite's style sub-module goes stale after edits on the shared server. Load the page once after an edit.
