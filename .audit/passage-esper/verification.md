# Final verification

All UI observations use the actual local Wrangler app through the in-app browser. Browser preference was normal motion; reduced motion was checked in source, not emulated.

- Astro check and production build passed after the final engine lock and 320px CSS corrections. Check retains six existing hints.
- Scoped ESLint and Prettier passed for changed application files. git diff --check passed.
- check-switch.mjs reproduced the old competing instant selections as Blade Runner then Parasite. The fixed implementation applies only the accepted pending selection. A rejected load releases the guard so the next selection applies.
- Blog preservation check passed for 12 routes, headings, SEO, article text and metadata.
- Fresh first visit at 127.0.0.1 showed the catalog with exactly parasite, br2049, budapest and odyssey. At 1280px it rendered four equal columns with no horizontal overflow.
- First-visit Escape selected House lights and removed the first-visit cover. Reopening and selecting 2001 with Enter closed the catalog, applied Odyssey and focused the destination heading. Reopened Escape restored the launcher focus. Sound toggle updated the shared mute control.
- The new Odyssey mission strip measured 70px high in the desktop observation. The old large HAL and Parasite miniature each had zero DOM matches. Hero HAL and the small companion remained.
- Parasite's image bottom was above the passage top. Opening preserved the photo and expanded in normal flow. Repeated activation reversed motion; Escape restored summary focus. Switching away and back left the passage closed.
- Esper opened without following the title link. Architecture paragraphs matched Dex, Mint and Flagship source content. Tradeoff selected the corresponding actual case text. The source link opened the real Flagship route. Escape removed the drawer and restored Inspect focus.
- Leaving Blade Runner removed every Esper drawer and Inspect control.
- Actual 390px and 320px same-origin frames showed the two-column poster catalog, all four film choices, native touch selection and no overlapping controls.
- The final 320px Esper viewfinder and readable copy fit inside the column. Tradeoff and Escape worked with native keyboard input. Parasite opened with Enter and closed with Escape in its 390px frame.

Before commit, deslop review found no added casts, generic framework, unnecessary exception handling or dormant duplicate interaction. The comment review's six changed narration lines and two adjacent narration comments were deleted. The final catalog screenshot was taken again after the final build, with four cards, zero old house miniatures and zero large playground HAL nodes.

Screenshots are in this directory. The temporary responsive wrapper lives only in ignored build output and is removed after verification. No live provider question was submitted.
