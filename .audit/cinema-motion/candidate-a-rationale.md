# Candidate A

## Parasite ideas

| Idea               | Response to browsing                                                                                                                                                                        | Assessment                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| House in section   | The room belonging to the current section opens its outer wall. Previously visited floors retain an opening and low light. Floor links let the visitor inspect or travel through the house. | Selected. The house becomes a persistent spatial account of the visit, and the architectural action improves orientation. |
| Rain arrives first | A waterline moves through an architectural section ahead of the reader during the descent from the rain interlude.                                                                          | Strong film reference, but it needs more visual space and can suggest timed reading pressure.                             |
| Service passage    | A bookshelf between the stack and now sections hinges aside to expose the bunker.                                                                                                           | Strong reveal, but an automatic door would interrupt reading and a required door action would obstruct navigation.        |
| Moving daylight    | The window aperture shrinks from the garden view to a street slit to a bulb as the reader descends.                                                                                         | Coherent atmosphere, but too similar to the existing palette and window changes.                                          |

The selected house replaces the small floor label beneath the existing staircase navigation. Its four floor links retain real fragment navigation. The architecture uses different windows for the living room, stairs, semi-basement and bunker. The current room opens further and contains an occupant. Leaving a floor retains its lit interior, so returning upward reveals a house that remembers where the visitor has been. Pointer hover and keyboard focus preview a floor without changing the current location. The existing Morse key also illuminates the upstairs room.

On phones the same structure becomes a compact four-room strip in the rail. The floor targets stay operable with touch. Reduced motion shows the same room states without the wall transitions.

## Blade Runner 2049 ideas

| Idea                    | Response to browsing                                                                                                                                                               | Assessment                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Memory archive          | The project nearest the reader's sightline pulls forward from a physical rack. Hover and keyboard focus override the sightline. An archive readout identifies the recalled record. | Selected. Inspection gives existing work entries physical depth and borrows the film's tangible records and unreliable memories. |
| Baseline examination    | Rapid scrolling strains a baseline trace; pausing restores the measured grid and typography.                                                                                       | The reader controls the effect naturally, but it risks framing normal browsing as failure and makes speed the main subject.      |
| Holographic recognition | A giant profile in the empty side of the page turns toward the project or section under examination.                                                                               | Memorable, but needs a strong original visual asset and risks dominating the portfolio.                                          |
| Wallace chamber         | Project or playground activity moves reflected light between architectural pools in the page gutters.                                                                              | Atmospheric but too close to adding another glow or parallax layer.                                                              |

The selected archive keeps every existing project link and its descriptive content. A slim console is mounted immediately before the work index from a reel-owned template. The active record gains a solid cyan-toned edge and moves forward with visible side and bottom faces. Other records remain readable in their slots. No preview action intercepts a click or a touch gesture. Reading, hovering and focusing all share the same selected-record state.

The sightline uses layout positions rather than transformed card bounds, so the animation cannot move its own selection threshold. Scroll, resize and layout observation share one cancellable animation-frame request. There is no recurring frame while idle. Phones use a smaller displacement. Reduced motion changes only the selected record's color and readout.

## Implementation and review

Model the Domain shaped the state choice. Parasite holds the occupied floor, an optional inspected floor and a set of visited floors. Blade Runner holds the recalled row and the row under the pointer; keyboard focus comes directly from the DOM. Type System Discipline shaped the DOM boundaries. The template and cloned node are narrowed with `instanceof`; new code adds no casts.

All six changed source files are within the allowed scope. Cleanup removes the mounted console, selected classes, house state and current-location attributes, disconnects the observer, cancels the pending frame and unsubscribes the house section listener. Event listeners use the reel abort signal. New work sets no root CSS variables or inline styles. Existing openings, particles, sound cues, scrubber, staircase and Morse key remain intact.

Scoped ESLint passed for both clients and both Astro files. Prettier ran on all six files. `git diff --check` passed. Build, Astro check and browser verification are intentionally reserved for the coordinating agent under the production contract.

Browser review should inspect the house at desktop rail height and the four-room strip at 390px, then scroll the work index and test hover, keyboard focus and touch navigation. Verify that the template console appears only while Blade Runner is mounted and disappears on switching reels. With reduced motion enabled, verify the room states and recalled-record indicator without animated displacement.
