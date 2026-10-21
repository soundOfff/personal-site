# Candidate C: reading leaves a trace

## Parasite

The scholar's stone in the living-room window settles into the lawn as the reader moves into the lower floors. It sinks in four steps from writing through the bunker, then rises as the reader returns upstairs. The stone stays in the scenery, clear of the headline, and stops moving under reduced motion. The page's vertical route gives the film's symbol of good fortune a growing physical weight.

Other ideas considered:

- Raise floodwater in the living-room window as the reader descends. The rain interlude already has a flood scene, so this would repeat an existing image.
- Make the hidden-floor X-ray change as the reader visits sections. The current X-ray find already owns that motif, and the reveal would add another version of the same interaction.

## Blade Runner 2049

The scrubber now records a section when it crosses the middle reading band. A small diamond stamps each recalled section, and the rail readout counts them. The section link's accessible name also announces when its memory has been recalled. The observer disconnects and restores the links when the reel closes. The memory archive grows through normal reading, without adding a control or covering the page.

Other ideas considered:

- Change the baseline readout based on time spent in each section. Dwell time can mean reading, pausing, or leaving a tab open, so it would make a weak claim about the visitor.
- Project selected page text into the opening hologram. Text selection is already used to copy content, so intercepting it would get in the reader's way.

## Implementation choices

Parasite models stone depth as five section levels, from the garden through the deepest position. The existing `onSection` callback sets one root data attribute, CSS maps that level to a position, and reel cleanup removes the attribute. The stone is decorative and cannot catch input.

Blade Runner models recalled sections as a `Set` of rail links. An `IntersectionObserver` with a centered viewport band adds each link once, updates the count, and has no scroll listener or animation loop. Keyboard navigation still uses the original section links. Reduced-motion users see the same recalled state without an animated transition.
