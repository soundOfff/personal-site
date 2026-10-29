# a1. Conservative: the stills start moving

**Concept.** Each product gets one snapped screen: its recording plays inside a one-cell frame of the cave's lightest dither, and the frame's bottom edge is the chapter track that fills in 8px steps and seeks on click. The workflow is the old five-node diagram redrawn on a visible 20px grid, where one amber cell (the cover's path colour) carries an idea through Frame, Design, Build, Review and both feedback loops to Decide.

**Layout.** Demo 9 of 12 columns (962px video at 1440), copy beside it, sides alternating like the old bento's third card. One live caption line sits under each demo (`02 / 05 Notes as you watch`). Snap points sit at section starts plus each product row (centred). Sections land with their top under the floating header via `scroll-margin-top: -100px`, so the header links land in the same place.

**Rejected.**
- The old bento kept as is. Focus Quote's portrait 0.75 slot puts a 16:10 recording at about 430px, which explains nothing.
- Two demos side by side (about 660px each). The UI text in all three recordings falls under 7px. One product per screen reads in five seconds.
- Name, description and link under the demo, as the brief says. That leaves a three-column hole beside every demo. I kept only the live caption under it and moved the copy beside it.
- A seeded pixel-cave backdrop behind each demo (cursor.com's textured backdrop). Too loud next to a dense UI recording.
- A solid cobalt 20px frame. Three of them plus the experience band was too much blue. The light dither recedes.
- A list of all five beats beside each demo. It repeats the caption. The ticks in the frame already show the structure and seek.
- The old click-to-inspect workflow panel. Hiring managers scan, so every stage shows its owner, its decision question and its tools at once.
- Non-alternating rows (all demos left). Calmer, but it loses the bento's rhythm. This is a one-line CSS swap if Tomas prefers it.

**Prior art.**
- loadmo.re: the poster under a muted loop, one quiet caption.
- rauno.me/craft: a title row and a mono meta row.
- Pixel Agents: one sprite per agent.
- Building effective agents: the evaluator-optimizer loop as the two feedback edges.
- The experience band's checker edge: the dithered node shadows.

**Agents.** Claude Code is a square bot and Codex CLI a visored bot. Both are original 9x8 sprites, labelled by name. Tomas is the ✳ glyph. Each stage shows its question with the ✳ to mark it as his call.

**Gaps.**
- On mobile the feedback lanes run down the right edge without inline labels. A note under Review says what they mean.
- At 1280x720 the workflow is taller than the viewport. Proximity snapping lets it scroll freely.
- Chapter labels swap on `timeupdate` (about 4 Hz), so a beat can lag by up to 250ms.
- The shared dev server's HMR reloads, triggered by sibling variants, can crash a gate run mid-way. Rerun it when that happens.
