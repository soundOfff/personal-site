# Catalog home and reduced repetition

New user steering while passage/Esper implementation was finishing:

- Replace the large decorative HAL in the playground, shown together with the small companion, with another 2001 motif. Keep the hero HAL and companion. Prefer a restrained mission diagram, no second character or large status module.
- Remove the entire redundant Parasite “The house in section” rail miniature, keeping the stair navigation and new service passage.
- Change the old-cinema home to a Letterboxd-inspired film catalog. Interpret home as the first-visit/reopen film chooser, currently an antique box office with ticket tearing and a countdown. Keep all four accessible films and House lights, selection memory, sound control, Escape and reopen behavior. Mood stays coded but inaccessible.

Grounding: BoxOffice.astro maps SELECTABLE_REELS to native data-bo-ticket buttons. boxoffice.css owns independent dialog colors and first-frame data-first-visit bootstrap. boxoffice.ts upgrades dialog, tracks selected reel, opens from data-boxoffice-open, chooses via switchReel, counts for six seconds then hands off to projector. Replace antique display and delay; keep stable data hooks/API. Current old CSS imports multiple film fonts and is large; replace obsolete ticket/leader styles rather than adding overrides.

Available assets in src/assets/openings contain each film’s existing AVIF still. Use these as poster studies cropped to portrait, clear film typography/year/director from registry, no fabricated ratings/reviews. Catalog inspiration means matte charcoal blue, a restrained masthead, editorial introduction and an orderly poster shelf. No social app clone or new network service.

Propose only a concise design sketch and behavior contract for the film chooser. Read actual three boxoffice files and registry. Compare a structurally distinct alternative. No implementation. Write only assigned design file. Maximum50lines.
