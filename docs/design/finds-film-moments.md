# Five film moments from Designeer Finds

Original adaptations for the portfolio, selected on 19 October 2026. The references inform the material and interaction; no creator media, code, embeds or runtime services are included.

| Film                     | Find                                                                                                                 | Adaptation                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Parasite                 | [Roktimm: linen grain and X-ray scans](https://designeer.xyz/finds/roktim-2111141670549143748)                       | A muted X-ray window reveals the house's hidden basement and follows the pointer on the garden glass. |
| In the Mood for Love     | [Lagan Bansal: physical watercolour into digital water](https://designeer.xyz/finds/lifeoflagan-2111120481801662675) | Amber water rings and a reflected Chinese title live inside the corridor window.                      |
| Blade Runner 2049        | [Bakers Studio: ASCII + pixel crush](https://designeer.xyz/finds/studiobakers-2111049527797186726)                   | A build-time ASCII retina becomes a slow, user-triggered replicant scan.                              |
| The Grand Budapest Hotel | [David: credit card interaction](https://designeer.xyz/finds/david-visuals-2111096871506591835)                      | A plum-and-gold luggage tag tilts and turns over to reveal its guest.                                 |
| 2001: A Space Odyssey    | [Steve Lauda: Tracelight showreel](https://designeer.xyz/finds/stevelauda-2111337729338507526)                       | Fine orbital geometry traces a spacecraft around the planetary alignment.                             |

## Performance constraints

- No added packages, WebGL contexts, canvas render loops, remote fonts, images or video.
- Existing on-demand film clients import one small shared controller. House lights does not load it.
- ASCII is generated at build time. SVG geometry is rendered once by Astro.
- Pointer events request at most one frame at a time. Geometry is cached and invalidated on resize or scroll; there is no idle JavaScript animation loop.
- IntersectionObserver pauses repeating effects offscreen. Page visibility pauses film CSS motion when the tab is hidden. A projector or box-office cover pauses the new effects too.
- Reduced motion keeps static art and instant card state changes. Buttons retain native keyboard activation and accessible labels.
- Reel unmount cancels pending frames and scan animations, disconnects observers, and removes listeners through the existing abort signal.

## Size comparison

Production builds, summed gzip sizes of emitted files, not network transfer measurements or Core Web Vitals. CSS and JS include all films; only the selected film's assets are loaded by the existing reel engine.

| Artifact | Before (gzip bytes) | After (gzip bytes) | Change |
| -------- | ------------------: | -----------------: | -----: |
| .js      |             108,965 |            110,501 | +1,536 |
| .css     |              87,770 |             89,558 | +1,788 |
| html     |              30,293 |             31,472 | +1,179 |
