# Countdown audio diagnosis

No application files changed. The current source and compiled bundle agree on the countdown schedule.

The visible numerals 3, 2, 1 and 0 each hold for one second. The CSS sweep also lasts one second. The projector begins at numeral 3 and receives a duration of 4.4 seconds. Its noise buffer has that duration, and its envelope holds at gain 0.09 until 4.05 seconds after numeral 3. It fades only after numeral 0 has completed. The source does not schedule a stop at numeral 2.

Sources are `/Users/User/.codex/worktrees/parasite-mood-openings/personal-site/src/reels/boxoffice/boxoffice.ts` lines 29, 82 and 273, `src/reels/boxoffice/boxoffice.css` line 991, and `src/reels/sound.ts` lines 309 through 346. The same schedule appears in `dist/client/_astro/index.astro_astro_type_script_index_0_lang.sc7hyL5U.js`.

Only numeral 2 gets the prominent 1 kHz tone, held near gain 0.2 for about 40 ms. Numerals 1 and 0 get a 10 ms highpass noise click with an exponential decay. Those are different sounds by design. A missing beep after 2 therefore has a concrete source explanation. A disappearance of the sustained projector after 2 does not yet have a reproduced mechanism.

The master compressor has a release of 80 ms. A sustained loss for the following two seconds is not explained by that setting alone. No countdown callback changes the master gain, suspends the context or stops the projector source. Browser suspension or device-level audibility remain untested hypotheses.

`offline-audio.html` embeds the actual source transpiled by `build-diagnostic.mjs`. It renders four graphs with the browser's OfflineAudioContext. They are projector alone, the full countdown, two-pop alone and leader-tick alone. Each passes through the actual SoundKit limiter and master. Visible JSON reports RMS, dBFS and peak levels in time windows relative to numeral 3. A proxy supplies the intended schedule time while building the graph. The real WebAudio implementation renders the nodes. This diagnostic measures generated signal, not perceived audibility or live AudioContext state.

The diagnostic has not yet returned measured output in this agent. One headless dump-dom attempt exited before rendering finished and returned only Running. The parent subsequently required browser interaction through CUA, so no further standalone browser process was used. The parent can open this page through CUA. Rebuild the page with `node .audit/hal/countdown/build-diagnostic.mjs` after source changes.

There is currently no supported duration fix. If the actual request is a recognizable sound on each numeral, the smallest targeted change is the local numeral-cue design. If the actual projector signal drops in the live page, capture master output and AudioContext state across numeral 2 before changing synthesis. Increasing projector duration or restarting it per numeral would not follow the available evidence.

Fix Root Causes shaped the choice to distinguish a missing numeral beep from an interrupted continuous sound. Prove It Works shaped the actual-source WebAudio diagnostic and the explicit limit on the unmeasured result.
