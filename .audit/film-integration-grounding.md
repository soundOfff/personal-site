# Grounding

Opening.astro renders five scenes under a shared camera track. html[data-reel] selects the visible one. ReelHead loads the selected film's stylesheet and shared camera stylesheet before paint. engine.ts keeps loaded CSS after switches and mounts each film client together with mountCamera(ctx). Cleanup runs before ctx.signal is aborted.

camera.css gives every film a tall scroll track, sticky pin and absolute full-frame scene. The two promoted scenes need intrinsic height and ordinary flow. These overrides must target only Parasite and Mood. Mobile and reduced-motion overrides occur later in that stylesheet and need correct specificity.

Parasite's rail is a left column, Mood's rail a sticky top strip. The approved standalone prototype header cannot be copied wholesale. Keep actual work collection, rail, contact, footer and other film components.

Existing find targets are inside unrendered Stage in:readme branches and their controller has no caller. New interactions belong in the actual opening. Do not revive the dormant machinery.

All scenes exist in HTML even when inactive. A normal img src risks downloading both new photos under House lights. A URL referenced only by each film's lazily loaded scoped CSS can preserve film-aware loading without a separate image controller.

Prototype photos are .prototypes/film-variants/assets/{parasite,mood}.png. Production copies should be compressed without enlarging them. Prototype uses Jost/Playfair; actual film typefaces are Archivo/IBM Plex and Bodoni/Spectral. Decide local typography deliberately.

Source details are in the HOW explainer result. Core paths are src/reels/{Opening.astro,camera.css,camera.ts,engine.ts,stylesheets.ts}, src/reels/openings/{Parasite,Mood}.astro, src/reels/{parasite,mood}/{reel.css,client.ts}.
