# Tools evaluation: Painterly ("Painting Loaders") and Nexvyn UI

Research root: `/private/tmp/claude-501/-Users-User-Tomi-personal-site/4eaded3e-1177-425c-a93e-76495f249faf/scratchpad/research/`

## A. Painterly -> actually "Painting Loaders" (painterly.design-tools.workers.dev)

**What it is.** A gallery of 12 generative watercolour *loading animations* by Sasha (x.com/aleksksaa), on Cloudflare Workers. Not a texture, brush or SVG-filter generator and it has no sliders. Each tile is a 600x600 WebGL p5.js canvas painted stroke-by-stroke with p5.brush 2.2.2 (p5 2.3.3): 11 Monet-style scenes (Garden, Dawn, Willow, Wisteria, Orchard, Irises, Poppies, Koi, Roses, Oranges, Sail) plus one abstract (Dusk, vertical drips). A painting takes 9 s, holds 1.5 s, loops, and a status line cycles phrases ("creating...", "blooming...", "finished"). Fonts: Newsreader display + system/Geist body, warm paper `#f7f4ee`, accent `#c2542a` (the site is almost Tomas's current palette already). Hover a tile to watch it paint; click for a full-screen view with prev/next.

**Output.** One mechanism: **Copy code** -> a self-contained HTML file (~20-23 KB) that serialises the live functions and pins p5 + p5.brush from jsDelivr. No PNG/SVG/CSS export, no UI parameters. Everything is editable in the copied file: `S` dials (water, coverage, density, scale, soft, glaze, touch, detail, brushSize, vivid, flower; Dusk adds pattern/flow), `PALETTE` (seed, ground, washes[4], foliage[4], accents[3-5], highlights[2], phrases), `canvasSize`, `loopMs`, `holdMs`. The engine also accepts `freeze: 0..1` (paint to a progress point in one pass, ~0.8 s headless) and `nextConfig` (rotate scenes per cycle). Seeds are fixed (1874), so output is deterministic.

**Integration (Astro + React island).**
- *Static (recommended):* patch the copied file with `freeze: 1`, screenshot the canvas, ship WebP. Zero runtime cost; this is what the gallery itself does for its stills. I produced three this way (paths below).
- *Live:* an Astro island or plain `<script>` loading p5 (287 KB gz) + p5.brush (28 KB gz) + the 20 KB file. p5 global mode (`setup/draw` on window), one engine per page (brush scaling is once-only, all scenes must share `canvasSize`), three WebGL contexts per engine. Keep it out of the React island or wrap in p5 instance mode. ~1 s of GPU work per full painting; the 9 s pace is intentional.

**Uses for Tomas.**
1. Hero ground: the amber Dusk still under the headline with `mix-blend-mode: multiply` (dark-ember variant for dark mode).
2. Playground "thinking" state: a live Dusk painting whose `phrases` are the router stages ("routing...", "sampling...", "streaming..."), `holdMs` tied to response arrival.
3. Per-project cover art: seed = hash(slug), palette = project accent; render at build time.
4. 404 / empty states: Koi ("Stillness is just movement too slow to notice") with its own phrase list.
5. Page-transition curtain: a 1.5 s `freeze` sweep (walk `renderTo(t)`) as the view transition.

**Sound.** None. Pairing is easy: the engine has a per-stroke timeline (`strokes[i].start/dur`, `beginStroke`, `foldStroke`), so a Web Audio noise burst filtered by stroke bbox size on each stroke start, plus a soft tick on phrase change, gives a "brush on paper" loop.

**Verdict: 8/10 as art, 5/10 as a tool.** Gotchas: no explicit licence (only "(c) 2026 Painting Loaders"; the copy button and tagline "take it home in code" imply permission, but ask Sasha before shipping); scene palettes are hand-tuned, so recolouring Oranges to amber gave olive foliage (fine) while Dusk recolours beautifully; no reduced-motion handling in the standalone; heavy for a "near-zero JS" site unless pre-rendered.

## B. Nexvyn UI (ui.nexvyn.dev) and `bars-theme`

**What it is.** A free React component library "for design engineers" (github.com/Nexvyn/Nexvyn-ui, ~238 stars): 34 components (20 "Unique", 14 basic), TypeScript + Tailwind v4 + `motion`, distributed as a **shadcn registry**: `npx shadcn@latest add https://ui.nexvyn.dev/r/<name>.json`. Verified in a throwaway project: the CLI dropped `src/components/ui/bars-theme.tsx`, `src/lib/hooks/use-css-color-rgb.ts`, `src/lib/resolve-css-color.ts` and added `motion@14` (peer React ^18||^19, so fine with his React 18.3). Licence (on every page): free personal and commercial, no attribution, not resellable standalone; the anatomy diagrams are CC BY-NC 4.0. Docs have anatomy overlays, dark mode (T) and a site-wide mute (M).

**bars-theme.** Despite the name it is **not a theme switcher**: it is an AI voice-state indicator (port of alexanderqchen/orb-ui), five rounded bars sharing a travelling sine wave. Props: `state` (idle | connecting | listening | thinking | speaking | error), `volume` 0-1, `size` px, `interactive` (renders a `<button>`, 0.96 press scale), `disabled`, `onClick`, aria passthrough. Idle = minimum height with a diamond-shaped hover boost; speaking = volume-scaled wave; listening = half-height slower wave; thinking = sequential pulse; error = destructive colour; 280 ms blend between states; rAF paused offscreen via IntersectionObserver; honours reduced motion. 12.8 KB TSX, **zero Tailwind classes** (inline styles), colour read from `--color-fg` / `--color-destructive`, timing from `--motion-dur-base|fast`, `--motion-ease-out`. Only runtime import is `useReducedMotion` from motion (trivially replaceable with `matchMedia`). Drops into editorial-ui CSS by defining five custom properties.

**Uses for Tomas.**
1. Playground status glyph: connecting -> thinking -> speaking while streaming, `volume` = tokens/sec.
2. Rail-footer sound toggle: `interactive`, click flips the site mute; bars idle when muted, plus a click sound.
3. Self-listening visualiser: feed `volume` from an `AnalyserNode` on the site's own UI sounds so the bars react to every click.
4. Project-card "live" badge at `size={20}` for deployed projects.
5. 404 in `error` state.

**Sound.** bars-theme itself is silent but is built for a volume signal. The real prize: **19 of 34 components ship `lib/sound.ts`**, a 230-line Web Audio synth kit with no audio files: `playHoverSound` (sine 1400->350 Hz, 12 ms), `playClickSound` (triangle 850->160 Hz, 20 ms), `playTickSound` (sine 1800->450 Hz, 10 ms), `playBounceSound` (sine 260->650->190 Hz + triangle sub, 140 ms), `playTileNote` (1.1 s sine with octave shimmer), mute persisted in `localStorage['sound-muted']`, cross-tab sync, autoplay unlock on first pointer/key. Wiring convention: hover -> hover, select/click -> click, slider value change -> tick (fader, ratio-slider, colour-picker arc), nav jump -> bounce. Lift this file even if nothing else is used.

**Verdict: 8/10.** Gotchas: most components use Tailwind v4 utilities and `cn()` from `@/lib/utils` (clsx + tailwind-merge), which the registry does **not** ship; bars-theme, glow-orb and color-picker are the Tailwind-free ones. All expect shadcn-style tokens (`--color-fg/surface/accent/muted`, `--motion-*`), so budget a small token bridge. glow-orb/fluid-orb are WebGL. Young project, thin prop docs, "Blocks coming next"; vendoring (what the CLI does) insulates from churn.

### Other Nexvyn components worth considering
1. **dia-text** - /components/dia-text - diagonal clip-path reveal for display type (`clip|sweep`, angle, colors, triggerOnView, repeat). Hero Newsreader headline; add a tick per word.
2. **navigation-compass** - /components/navigation-compass - draggable compass-dial nav; scroll rotates it with lag, links light up in the active zone. The "experimental" primary nav; tick per detent.
3. **scroll-indicator** - /components/scroll-indicator - vertical tick ruler with section labels and position readout, click sound. Rail replacement.
4. **fader** - /components/fader - console fader with detents and elastic overdrag, tick sound per detent. Site volume control, or temperature in the Playground.
5. **glow-orb / fluid-orb** - /components/glow-orb - WebGL fbm orbs, same `OrbState` API; fluid-orb takes `audioLevel`. Alternative Playground presence.
6. **goo-dropdown** - /components/goo-dropdown - SVG goo-filter pill-to-panel morph with spring and click/hover sounds. Model picker.
7. **switch** - /components/switch - thumb travel plus click/hover sounds, Tailwind-light. Sound and theme toggles.
8. **icon-bar** - /components/icon-bar - bloom-open label reveal, accent dot, roving tabindex. Rail social/theme bar.
9. **action-button** - /components/action-button - idle -> pending -> success/error state machine with sounds and abort. Playground "Send".
10. **color-picker** - /components/color-picker - canvas-drawn blossom picker, Tailwind-free, hover/click/tick sounds. "Paint your own accent" easter egg that could also recolour a Painterly palette.

## Paths
- Painterly shots: `research/painterly/` (viewport, seg-00/01, full, mobile, page.html, analysis.json); sources `research/painterly/src/`; live full-screen captures `research/painterly/exports/live-detail-koi-*.png`.
- Painterly samples (`research/painterly/exports/`, each `*.html` is the Copy-code output, `*-frozen.html` adds `freeze: 1`, `*-final.png` is the finished 600x600 canvas, `*-midpaint.png` at t = 4.5 s):
  - `dusk-amber-paper-final.png` - Dusk, ground `#f6f1e8`, washes `#e8c9a0 #d9a86b #f0dcc0 #c98a4a`, accents `#b8692a #e0963f #8a4e1e`, highlights `#f9e4b8 #fff7e8`, stock dials, seed 1874.
  - `dusk-dark-ember-final.png` - Dusk, ground `#141210`, washes `#2a2420 #3a2c22 #1e1a17 #4a3526`, accents `#c2542a #e0763f #6b3a1c`, highlights `#f0b06a #f7d9a8`.
  - `oranges-amber-paper-final.png` - Oranges, ground `#f6f1e8`, washes `#eadbc2 #e3cfae #f3e8d6 #d8c9a8`, foliage `#8a7a4a #5e5230 #3c3520 #b8a86a`, accents `#e0763f #c2542a #f09a4a #9c3f14`, highlights `#fff3dc #fbe8c0`.
  - `dusk-stock-final.png`, `oranges-stock-final.png` - unmodified references.
- Nexvyn shots: `research/nexvyn/` (bars-theme docs page), `index-page/`, `home-page/`, `comp-dia-text/`, `comp-navigation-compass/`, `comp-fader/`, `comp-glow-orb/`; interactions `research/nexvyn/interact/` (preview-state-*, preview-hover, anatomy, dark, get-code); all 34 registry JSONs `research/nexvyn/registry/`; CLI trial `research/nexvyn/trial/`.
- Scripts: `scratchpad/tools/painterly-export.mjs`, `painterly-freeze.mjs`, `nexvyn-interact.mjs`, `nexvyn-preview.mjs`.
