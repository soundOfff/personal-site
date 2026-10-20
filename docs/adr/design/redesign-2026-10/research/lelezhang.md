# lelezhang.design — research report (saved by orchestrator; agent could not write)

## 1. Identity
Lele (Cherrilynn) Zhang, product designer, SF. Next.js 15 + Tailwind v4 + framer-motion, "coded by me & Claude". Concept: a desk — a fan of polaroids you drag into an envelope to chat with an AI "lele", while a CD player spins lo-fi in the corner.

## 2. Layout & structure
One 7.5k-px page. Fixed glass-pill header (contact · ♥ working & playing | script wordmark | san francisco, ca · CD player). Hero: 600px intro paragraph, "what i • make" label, 9 cards at hard-coded {x,y,rotate,z}, a gradient into the envelope chat ("TALK 2 ME"). Then a filter row and stacked case studies with mono [n] footnote links, 12-col image grids. Footer: links, script signature, mono "26159TH VISITOR". No scroll reveal anywhere. Mobile: FAB bottom-right expands nav pills.

## 3. Typography
Untitled Sans (Klim) 300–700, body 16/26, nav/card titles 12px. Compagnon (mono) for labels/footer, uppercase .05em. Miss Fajardose script signature; Caveat handwritten section heads; Gelica serif on /pearl. Scale deliberately tiny; footnote [1] in mono is the link affordance.

## 4. Color & surface
One ink: --slate #2f3557; every gray is slate at alpha (5/8/10/20/40/55%). Page #fbfbfc. Glass pills #c6c7d2@30% → hover #a2a5bb@30%, backdrop-blur 20px. Slate-tinted shadows. No dark mode. /draw: warm paper #faf9f7/#efeeec, ink #262523, dot grid.

## 5. Motion inventory
Home (framer-motion): card fan entrance opacity 0 + blur(8px)→0 .5s + scale spring 200/25/1.2. Card press: transform-origin at pointer, random ±4°, scale 1.08, spring 500/25/.8, cursor grab. Drag: dragElastic .1; past 128px card scales .7 and envelope drop zone fades in; drop → 600ms pull, re-deal, posts that card's question to chat. Placeholder swap on input hover: per-char 75ms blur(2px) fade, 10ms stagger. "what i • ___" word per hovered card: fadeInLetter .2s, 30ms/char. Typing dots bounce .9s. CD player: disc angle in rAF with v += (target−v)·(1−0.05^dt) spins up/coasts down; hover preloads widget; click play/pause; dblclick next.
/draw: keycap buttons :active { animation: btnPress 130ms } 64→57px with bottom-shadow key; tool icons slide up from tray when selected; palette dice slot-reel swatches (reelSpringAccum from --spring-stiffness/--spring-damping/--reel-items); hand-wobble canvas feTurbulence+feDisplacementMap; custom SVG cursor; a live "dialkit" panel writing durations/easings into CSS vars, synthesizing linear() strings.

## 6. Sound (four layers)
1. Music: hidden SoundCloud iframe, opt-in, hover preloads.
2. UI SFX: 100% procedural Web Audio. Recipe = sine pitch-drop + filtered noise burst. button-click: 990→660Hz/10ms + 5ms noise HP 5kHz gain .06. stroke-thin/medium/thick: 1320→880 / 990→660 / 660→440Hz — PITCH ENCODES PEN SIZE. color-swatch: 6ms noise BP 5.5kHz Q2.7 tick. clear-canvas: 270ms pink noise BP sweep 600→2000Hz 45ms attack (whoosh). palette-dice: 11 noise ticks on sinusoidal schedule ~500ms, decaying, last tick lower/louder. claude-done: 6 chimes (Ding 1050Hz + 2898/5670 partials + pink transient .8s; Double; Beep square 1800×3; Bowl 520+524Hz beating 1.8s; Chime 880→660; Triple). AudioContext unlocked on first touch/click via 1-sample buffer.
3. Stroke sonification (Tone.js): MonoSynth→Vibrato→Filter→FeedbackDelay→Panner→Reverb. Y→pentatonic C3–C5, X→pan, speed→cutoff/volume, color→root.
4. Haptics: WebHaptics; tool selection, swatch soft, pen size light/medium/heavy, dice 4-pulse.

## 7. Navigation
Pills smooth-scroll; category filter; footnotes; visitor counter; outline without scroll-spy on /chat-explorations. /draw: Space send, Esc close.

## 8. Signature moments
1. Drag polaroid into envelope → AI answers and asks back. 2. CD that preloads on hover and spins up/coasts down. 3. /draw keycap toolbar with synthesized click/tick/rattle, slot-reel palette, wobbly ink.

## 9. STEAL LIST
1. Procedural SFX module (~3KB, zero assets): play(name) = osc pitch-drop + noise burst; rail click 990→660, surface composed 5.5kHz tick, agent done Ding, reset pink whoosh. Resume context on first pointerdown.
2. Pitch encodes kind: give A2UI card/table/timeline different pitches so you hear what the agent built while it streams.
3. Drag-to-ask: Dex/Mint/Flagship cards draggable into playground input; drop seeds prompt.
4. Hover-preload: warm agent session + AudioContext on mouseenter.
5. Keycap send button: :active btnPress 130ms 64→57px + bottom shadow, with click SFX; also rail numbers.
6. CSS-var spring reel for the 00–08 odometer and quota countdown.
7. Coasting spinner v += (target−v)·(1−0.05^dt) for the agent thinking indicator.
8. Char-stagger placeholder: 75ms blur fade, 10ms/char; input swaps "ask anything" → example prompts on hover/focus.

## 10. Anti-patterns
SoundCloud iframe; zero reduced-motion; seven font families; 12px 55% alpha text; hard-coded overlapping card coordinates; outline without scroll-spy; kaomoji voice is hers; no dark mode.

## 11. Verdict
"Instrument, not page": the playground as a tactile desk — keycap input, draggable prompt cards, per-surface sound vocabulary, done-chime, all procedural. DNA 7/10 for a "sound & touch" variant.

Screenshots: scratchpad/research/lelezhang/ (viewport, seg-00..07, mobile, full, analysis.json; states/; sub-draw/, sub-pearl/, sub-chat-explorations/; bundles/ — sound module in common-5a9c58ff3bd4e7a5.js module 15489).
