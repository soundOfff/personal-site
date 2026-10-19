# designeer.xyz — Visuals + Components (saved by orchestrator; condensed from agent report)

designeer.xyz is a curated LINK directory (not a registry). /visuals = 55 links (type, color, 3D, shaders, icons). /components = 120 (109 libraries, mostly shadcn re-skins, + 11 motion tools). The good stuff is near the bottom: soundcn, cuelume, sensory-ui, interior.dev, UICapsule, 1iad, Fluid Functionalism.

Install patterns: (1) shadcn registry copying React+Tailwind+motion into the island (interior, UICapsule, 1iad, Evil Buttons, Fluid, sensory-ui, soundcn, Oneko, Orbkit); (2) npm packages with framework-agnostic cores that run in plain .astro pages with no island: cuelume, slot-text, Scritto, morphicons (has an Astro SSR shell), NumberFlow, Rolling Number, Paper Shaders vanilla. For Astro + one island, (2) is frictionless.

## Shortlist
SOUND
1. cuelume — https://cuelume.dev — 14 cues (tap, type, select, toggle, open, close, navigate, success, warning, error, loading, ready, attention, count), 4 themes (Default/Mech/Bubble/Press), Web Audio synth, vanilla ESM, zero deps, SSR-safe, MIT. BEST MATCH. loading→ready→success = the agent-composing arc; `count` pairs with odometers.
2. sensory-ui — https://www.sensory-ui.com — shadcn comps with `sound` prop; 17 roles × 9 packs synth; React only; ~28kb; MIT.
3. soundcn — https://soundcn.xyz — 816 CC0 sampled SFX (Kenney) as shadcn items, base64 data URIs + tiny Web Audio engine + useSound. 23 UI-tagged (click-soft, hover-tick, switch-on/off, success-chime, error-buzz, notification-pop). Avoid the unlicensed WoW pack.
4. Bencho Sounds — https://bencho.dev/sounds — curated cues (Whisk, Drift, Hush, Tick, Latch, Knock, Boot, Purr), account-gated downloads.
TEXT / NUMBERS
5. NumberFlow — https://number-flow.barvian.me — animated numbers, dep-free, React/Vue/Svelte/vanilla, MIT.
6. Rolling Number — https://rolling.kitlangton.dev — interruptible per-digit roll, vanilla core, MIT.
7. slot-text (textmotion.dev) — https://textmotion.dev — label roll, flash("Copied") auto-revert; vanilla + bindings; MIT; same author as cuelume.
8. Scritto — https://scrit.to — only changed characters roll; web component; SSR-safe; MIT.
9. Fancy Components text set — https://www.fancycomponents.dev — scramble-hover/in, variable-font-cursor-proximity (Newsreader is variable), vertical-cut-reveal; React+motion; MIT.
10. Motion Primitives — https://motion-primitives.com — text-scramble, text-roll, sliding-number, dock, magnetic, cursor; verify license (no LICENSE file).
MICRO-INTERACTIONS
11. interior.dev — https://www.interior.dev — 54 "half-second after a click" comps: copy-button, hold-to-confirm, like-burst, icon-morph, press-depth, streaming-text, task-steps, live-activity, command-palette, value-flash, slider-detents, long-press. shadcn, MIT. task-steps + live-activity + streaming-text = the agent-composing moment.
12. Fluid Functionalism — https://www.fluidfunctionalism.com — useFluidHover (one highlight glides to nearest item), spring tokens, ThinkingIndicator/ThinkingSteps/CommandMenu; MIT.
13. UICapsule — https://www.uicapsule.com — dynamic-ai-composer, dynamic-island, volume-control, vibe-dial, light-dark-toggle, radial-slider, diffusion-reveal, terminal-disintegrate, spinner-pixel-grid; MIT.
14. 1iad — https://1iad.com — Wind Chimes (inline Web Audio), Vinyl Player, Physical Theme Switch, LED Board, Presence Orb, Shimmer Thought, Prompt Box, Precision Scrubber; MIT.
15. Evil Buttons — https://www.evilbuttons.com — RealisticSwitch (inline Web Audio click), DitherButton; Apache-2.0; rest is loud.
TEXTURE / CURSOR / ICONS
16. Paper Shaders — https://shaders.paper.design — @paper-design/shaders vanilla; paper texture, grain gradient, dithering, halftone, dot grid, perlin; Apache-2.0. Vanilla runs outside the island.
17. React Bits — https://reactbits.dev — Click Spark, Target Cursor, Decrypted Text, Count Up, Dot Grid; MIT + Commons Clause; skip its backgrounds.
18. morphicons — https://www.morphicons.com — morph any stroke icon to another with springs, 6kb, morphicons/astro SSR shell + <morph-icon>; MIT.
19. Oneko — cursor-chasing pixel cat; opt-in only.
20. Orbkit — https://orbkit.zzzzshawn.cloud — WebGL orbs for Idle/Thinking/Speaking; 14 MIT.

## Combos
A. Paper, ink, a quiet click (Astro-native): Paper Shaders paper/grain + slot-text labels + cuelume Default + morphicons toggles.
B. The agent at work (island): interior task-steps + streaming-text + live-activity, Fluid useFluidHover + ThinkingSteps, one orb, cuelume loading→ready→success per surface, NumberFlow + count for tokens/ms.
C. Toy shelf (quarantined playful section): 1iad Wind Chimes + Physical Theme Switch, UICapsule Volume Control, Evil RealisticSwitch, React Bits Click Spark, soundcn hover-tick on a Dock.

## Avoid
shadcn re-skins (spotlight cards, border beams, meteors, bento-for-bento, logo marquees, shiny text, aurora heroes, 3D tilt cards, globes); React Bits backgrounds; glass orbs on warm paper (one at most); confetti/glitch/detonate buttons; sound traps (hover sounds everywhere, firing before gesture, no mute, cues on palette keystrokes); cursors that hide the native one; scroll hijacking.

Screenshots: research/designeer-visuals/, research/designeer-components/, research/designeer/sites*/ (per-library probes), readmes/, registries/. Probe script: tools/probe_sites.mjs.
