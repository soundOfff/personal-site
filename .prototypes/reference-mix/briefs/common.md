# Reference mix. Common brief for all three prototypes

## Who this is for and what it decides

Tomas Brasca is a full-stack engineer in Rosario. His portfolio (tomasbrasca.xyz, Astro) works but he wants a new visual style and better interactions everywhere a visitor touches it: the first load, navigating, clicking buttons, reading the blog, moving between pages. He will open three prototypes side by side in a switcher, use each one, and pick a direction. Each prototype is a distinct direction that mixes patterns from four reference sites.

The prototypes are throwaway. Code quality does not matter, speed does. But he judges by using them, so every interaction listed below must actually work. A broken route or a dead button costs more than a missing flourish.

## Directory

Everything lives in `/Users/User/Tomi/personal-site/.prototypes/reference-mix/`.

- `shared/content.js` sets `window.SITE` with the real content (person, nav, home sections, 13 work items, 11 posts). Its shape and caveats are in the first section of `shared/current-site.md`. Load it with `<script src="../shared/content.js"></script>`.
- Media paths in the content resolve against `shared/`. From your directory, prefix `../shared/`. Inside `bodyHtml`, rewrite `src="media/` to `src="../shared/media/` before inserting.
- `shared/current-site.md` describes the site as it renders today, including its tokens. Read it.
- `shared/shoot.py` is the verification tool. See Verify.
- `index.html` is the switcher. It iframes `a/`, `b/` and `c/`. Do not edit it.
- `briefs/` holds this file and one brief per direction.

Write only inside your own directory (`a/`, `b/` or `c/`). Never modify anything else under `/Users/User/Tomi/personal-site`. Another session has uncommitted work in `src/`.

## The reference patterns

Four research agents measured these in a real browser. Every direction draws from all four, in different proportions. Your direction brief says which ones you own.

**andreas.vision (pixel cover).**
- A full-screen 2D canvas of square cells (22px, same size on mobile, only the column count changes), 3 colors plus a 2px checkerboard dither that reads as 5 tones.
- Intro of about 1.2s. Cells sprout from a seed and spread outward. Each headline word is born from a small pixel seed and grows, staggered about 100ms. Nav enters last.
- At rest, single cells flip tone (no drift).
- Scroll-scrubbed over about 600px. The headline fades word by word while the cells condense into a small square glyph that lands inline in the next headline. Scrolling back reverses it.
- Reduced motion jumps to the final state.
- Pill nav that hides on scroll down and returns on scroll up. Route change of about 1s where the old page shrinks to a card and the new one rises as a sheet.
- Card hover scale 1.03 (300ms) with media 1.06 (600ms), only under `(hover:hover) and (pointer:fine)`. Dominant easing `cubic-bezier(0.22, 1, 0.36, 1)`.

**wwwtf.site (gallery, one accent).**
- Cursor X scrubs a video's time with a lerp of 0.12 per frame. A 4px white scrub bar uses `mix-blend-mode: difference`.
- Fixed nav with `mix-blend-mode: difference`, so it inverts over dark media.
- Active nav state written as `( sites )`. The parentheses are always in the DOM and only their opacity changes, so nothing shifts.
- Card hover turns the 1px border to the accent, grows a 4px halo at 8% accent and springs the radius from 4 to 8px.
- An edge-to-edge wordmark, scaled with SVG, that breaks into a staircase on mobile. A giant `(view all →)` CTA.
- One electric accent plus mono metadata. Zigzag rows of 2/3 and 1/3.

**theinspirationgrid.com (editorial gallery).**
- Two-tone headlines with one solid word and one ghost word in pale gray, big with tight tracking.
- Hero backdrop made from the same image scaled 1.5 and blurred 12px, so the work tints the header.
- A white tag tab that cuts into the image's corner.
- Image hover scale 1.12 over 400ms while the title turns to the accent over 100ms.
- Search as its own screen where the input is a 96px headline over a 3px rule.
- On mobile, a fixed bottom bar of categories that scrolls sideways.
- Excerpts fade out with a gradient instead of "…".

**slite.com/blog (reading).**
- Warm paper background with near-white cards whose hairline border darkens to ink on hover.
- Two featured posts above a grid of three.
- Sticky category chips plus live title search with a real empty state.
- A closing band under each post with date, share, author bio and three related posts.
- A characterful heading face over a neutral body face.
- Its flaws are things to avoid: cards with no date or reading time, about 100-character lines, content that only appears after a JS animation, a 207px sticky bar on mobile, a copy-link button with no feedback, share links with relative URLs.

## Ethics

andreas.vision's `/llms.txt` asks agents not to clone or recreate its site, design or code. Take patterns only. Do not use its palette (white, #7CF, #0AF sky blues), its motifs (sky, clouds, horse, globe, postage stamps), its typeface (TRJN DaVinci), its copy or its code. Every pixel system in these prototypes is designed from scratch around Tomas's own material: his ✳ wordmark, his competitive-programming background, his project screenshots, his blue.

## Must-haves for every prototype

1. **The pixel moment.** Pixel art plays on first load. It plays again every time the visitor comes back to the top after leaving the cover, and when they navigate back to home. Then it hands off to the animated page. This is the feature Tomas asked for by name.
2. **Routes.** Hash routes so it works from any static server: `#/` home, `#/work/<slug>`, `#/blog`, `#/blog/<slug>`, and a not-found view for anything else. Back and forward work. Every route change runs your direction's transition. Scroll goes to the top on a new route. Model the routes as one table from route name to render function.
3. **Pages.**
   - Home has the hero, selected work, all 13 projects with a category filter, about, writing teasers and the contact footer.
   - Work detail works for all 13 slugs and renders `bodyHtml`.
   - Blog index lists all 11 posts with filters, live search and an empty state.
   - A post renders `bodyHtml` for the three posts that have it. The other eight show the description plus a "Read it on tomasbrasca.xyz" link to `https://tomasbrasca.xyz/blog/<slug>`.
   - Not found exists.
   - Skip the live agent. Show a static "Ask about my work" teaser linking to `https://tomasbrasca.xyz/#playground`.
4. **Interactions.** Nav (hover, active, focus), buttons (hover, press, focus-visible), cards, links, filters, search, a copy-email button with visible "Copied" feedback, route transitions and back to top all work.
5. **Reading.** Blog cards always show date and reading time. The reading column is 60 to 70 characters wide. Code blocks scroll horizontally. Tables fit or scroll.
6. **Reduced motion.** Under `prefers-reduced-motion: reduce`, show the final state of every animation with no motion. Do not show a cut-down version.
7. **Hover only where hover exists.** Hover effects go under `(hover: hover) and (pointer: fine)`. Touch gets an equivalent (tap, swipe or autoplay).
8. **Mobile at 390px.** No horizontal page scroll. The nav is usable. Any sticky bar is at most 64px tall.
9. **Keyboard.** Every control is reachable, focus is visible, and Escape closes overlays and returns focus to the trigger.
10. **Performance.** Size canvases with `devicePixelRatio`. Stop animation loops when the canvas is offscreen (IntersectionObserver) or the tab is hidden. Read scroll position once per frame.
11. **Zero console errors.**

## Stack

Vanilla HTML, CSS and JS. No build step and no framework. One `index.html`, `style.css` and `app.js` is enough. Split further if it helps you. Add a library only when it clearly earns its place, from `cdn.jsdelivr.net` with a pinned version (Lenis for smooth scroll is fine).

For fonts, use Google Fonts or copy woff2 files from `/Users/User/Tomi/personal-site/node_modules/@fontsource-variable/<family>/files/` into your directory. Geist, Newsreader, JetBrains Mono and Archivo are installed there.

Reading canvas pixels from images (`getImageData`) needs http, not `file://`. Test over http.

## Verify before you report

Run `python3 /Users/User/Tomi/personal-site/.prototypes/reference-mix/shared/shoot.py <a|b|c>`. It serves the folder over http and opens your prototype in headless Chromium at 1440x900 and 390x844, with and without reduced motion. It captures the cover at 0.3s and 2.5s, scrolled 700px, back at top, a work page, the blog, a post with a body, a post without one, not found, and history back. It writes `<dir>/shots/*.png` and `shots/report.json`, and it exits non-zero on any console error or any route with almost no text.

Open the PNGs and look at them. Judge them as the visitor would. Fix and rerun until it is clean and right. If your sandbox cannot launch the browser, say so plainly and still run `node --check` on every JS file.

Then write `<dir>/NOTES.md` in 40 lines or fewer. Include a table of which reference pattern went where, what you invented, and known gaps.

## Final report

200 words or fewer. List your files, the last summary line `shoot.py` printed, the known gaps, and what you would change with another day.
