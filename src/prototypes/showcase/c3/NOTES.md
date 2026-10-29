# c3. The cave opens into rooms

**Concept.** The cover's cobalt cave becomes a dungeon map of how Tomas works: five paper rooms carved out of rock, the amber shortest path through them, two dashed loops back from Review, and a party (Tomas, Claude Code, Codex) that walks the loop while a status panel explains each room. Each product below is a room of the same rock, with its demo as the lit window; a cobalt veil drains off it in BFS order when it comes into view.

**Files.** `Variant.astro` (markup, styles, page snap rules), `map.ts` (layout, BFS walks, tour), `rooms.ts` (demo play logic, chapters, rock frame, drain), `sprites.ts` (party sprites and the 5x7 sign font).

## Alternatives rejected

- A straight left-to-right pipeline. Most diagram-like, least world-like. The 2x3 snake leaves room for the panel beside it and lets the exit point down into `#work`.
- An RPG party screen. It shows agents and skills well, but it cannot show the loop or where Tomas decides.
- A pixel machine with belts. It reads as automation, which undercuts "I own the final call".
- A light dithered halo around each demo, with no solid wall. It read like clouds, a banned motif, and broke the link with the map rooms. Every room now uses one rock material.
- A cartridge or level-select of chapter stills. The stills are illegible at thumbnail size. Numbered beats plus a cell track are clearer.
- A bitmap font for product names. Newsreader stays the identity. The bitmap font only signs the map rooms.
- `mandatory` snap, one room per screen. It is `proximity` on section and room starts, with no points inside the cover.
- A constant-height panel on mobile. It left a large gap, so narrow screens use natural height.

## Prior art, and where

- Pixel Agents and pixtuoid. Agents as sprites that move between activities, here the party walking BFS routes.
- daisyUI RPG notes. A central scene with a status panel, and bitmap signs at whole-number scales (3x desktop, 2x mobile).
- loadmo.re. A poster under a muted loop with a tiny caption tag. Rauno and devouringdetails were not used.
- cursor.com. A textured backdrop instead of a device frame, here the rock frame.
- "Building effective agents". The evaluator loop, here Review sending failed checks to Build and a wrong approach to Design.
- The site's own cover. BFS distance drives the map flood-in, the demo drain and the idle twinkle.

## Known gaps

- Sprites have one idle bob, with no per-activity frames (typing or reading).
- The narrow map shows the loop labels only in the legend, not on the map.
- One tour lap is about 35 s and two laps make a cycle. On mobile the panel sits under the map and changes while the tour runs.
- Mobile demos are 340 px wide. The full-screen button helps, but small UI text in the recordings stays small.
- Resizing while paused regroups the party in the selected room.
- Under reduced motion, the idea token rests on the last amber cell of the exit.
