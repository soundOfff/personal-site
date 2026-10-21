## Why

Parasite and In the Mood for Love required long opening scroll sequences without a working discovery in the visible composition. Both now introduce the portfolio through a photographic scene with optional content.

## What changed

- Add Parasite's B1 reveal with the Mint inventory decision and Mood's letter linking to the personal essay.
- Use native disclosures, film-scoped AVIF backgrounds and intrinsic layouts. Skip the scroll camera for these two scenes.

## Scope

- Covers the Parasite and Mood openings and their disclosure lifecycle.
- Preserves Grand Budapest, Blade Runner, Odyssey, House lights and the existing portfolio content.

## Blast Radius

The shared camera reads a scene-local flow marker. Other scenes retain the existing camera path. Budapest's reference geometry matched before and after integration.

## Verification

- Astro check, ESLint, production build, scoped Prettier check and git diff check passed.
- Exercised opening, Escape, Enter, focus restoration, film switching and real destination links in the browser.
- Reloaded both saved films at phone width and confirmed intrinsic track height, no horizontal overflow and unclipped revealed prose.
