# The scroll is the camera

Five original photographed sets replace the smaller decorative opening props. The rest of each film's portfolio keeps its own art direction. The opening uses native document scroll, a sticky viewfinder, a photographed world, a separate foreground and four moving mattes. No scroll interception, wheel handlers, animation library or WebGL context.

| Film                     | Framing            | Camera                                                                      |
| ------------------------ | ------------------ | --------------------------------------------------------------------------- |
| Parasite                 | 2.39 → 1.85        | Through the window, toward the garden; foreground mullions leave the frame. |
| In the Mood for Love     | 1.66 → 2.35        | A slow lateral approach past a dark doorway into the amber corridor.        |
| Blade Runner 2049        | 2.39 → 1.85        | A deliberate push into the scale of an orange, deserted city.               |
| The Grand Budapest Hotel | 1.37 → 2.35 → 1.85 | A centered approach toward the hotel, with three changing frames.           |
| 2001: A Space Odyssey    | 2.20 → 1.66        | Move from the planetary horizon toward the orbital station.                 |

The figures describe the opening's changing viewport, not a claim that each original film changed formats. Portrait screens have a taller crop and a shorter movement. Reduced motion shows a single still with no extra scroll runway.

## Assets and generation

Generated with the built-in `imagegen` tool, five separate images. The shipped assets live in `public/images/cinema/`, with one desktop AVIF and one smaller mobile AVIF per film. Only the active film's background is requested. Original PNGs remain in the generation library; no remote media or embeds are used.

The prompt set asked for single horizontal images, no UI, lettering, logos or watermarks, with space for real HTML typography:

- **Parasite:** Photographic original Korean modernist house interior. Dark concrete and walnut, huge sliding glass doors, sculptural pine and manicured sloping lawn, warm late-afternoon light, olive and stone palette, architectural perspective, no people. Shadowed left quarter for typography.
- **Mood:** Original 1962 Hong Kong corridor at night, repeated timber doorways, emerald flock wallpaper, oxblood wainscot, amber sconce, red distant light, rainy glass, close dark doorway and out-of-focus red curtain for depth. Romantic loneliness, halation and 35mm grain, no people.
- **Blade Runner:** Original deserted brutalist plaza swallowed by orange dust. Tiny solitary black-coated person, immense eroded concrete architecture and half-buried monumental sculpture, hazy sun, fine sand and long shadows. Monumental photographic scale with smooth left-hand haze for type.
- **Budapest:** Original photographed handcrafted 1932 alpine hotel miniature. Symmetric rose facade, burgundy mansards, central dome, cream moldings and golden entrance. Snowy lavender Alps, pines and funicular, tactile painted plaster and snowy foreground. Pink sky for type; hotel centered for changing crops.
- **Odyssey:** Original 65mm-like science fiction photograph. Blue planetary horizon, central warm sunrise, thin atmospheric rim and restrained horizontal flare. Detailed white double-wheel station with spokes and docking hub at right, practical miniature realism, deep black space at left, no fantasy nebula.

## Performance

Desktop AVIFs: Parasite 120,231 B; Mood 55,167 B; Blade Runner 55,787 B; Budapest 199,578 B; Odyssey 76,121 B. Mobile versions: 15–80 KB. The largest selected background is under 200 KB.

The camera module and stylesheet load only with a film. Geometry is cached on resize; scroll requests at most one animation frame, with no idle JS loop. Motion changes transforms and opacity. The intersection observer releases compositing hints offscreen; hidden tabs suspend updates. Unmount disconnects observers, cancels pending work and removes listeners via the reel's abort signal.

The production build's HTML dropped from 31,472 to 26,084 gzip bytes by removing the old opening scenery. Across all emitted JS, CSS and homepage HTML, the combined gzip size is about 1.1 KB smaller than the previous version, excluding the new backgrounds. This is an artifact comparison, not a network or Core Web Vitals measurement. No new dependency or font was added.

Visual browser iteration and a production build, with no automated tests, per the portfolio's requested visual-first workflow.
