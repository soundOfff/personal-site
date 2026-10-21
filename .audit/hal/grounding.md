# HAL grounding

Opening HAL is decorative aria-hidden .ok-hal in src/reels/openings/Odyssey.astro. Existing .od-lens elsewhere follows cursor through RAF-batched normalized --lx/--ly in src/reels/odyssey/client.ts. Cabinet transform is already owned by scroll camera. Animate an inner lens layer instead.

Camera uses 225svh opening and --shot-cut fades HAL to orbital scene. Full-frame .ok-copy z-index2 and orbit need pointer handling. Invisible opening must not leave focusable controls. Reel mount cleanup runs before ctx.signal abort. Both own listener/request lifetime.

POST /api/a2ui owns forced render_surface OpenRouter model requests and portfolio context. Separate HAL dialogue should avoid its forced tool. Same server-only OPENROUTER_API_KEY available. Default existing A2UI model is Haiku4.5; own HAL default should be google/gemini-2.5-flash-lite. OpenRouter official listing verified input $0.10/M output $0.40/M. Keep HAL_MODEL override server-only.

src/lib/ratelimit.ts provides shared 3/min/IP, 5/day/IP, 300/day global buckets. Reuse functions rather than new free allowance. KV increments not atomic across isolates, existing limitation. No new infrastructure needed.

SoundKit is gesture-unlocked and mute-aware. Existing lensHum, transmission, clunk can accompany text. No need TTS. Greeting/question local; network only on submission. Short plain text responses + one followup. No HTML. Validate external body/history, timeout provider, abort on close/reel cleanup, bound context/output, explicit unavailable state rather than simulated AI.

User also reported projector countdown sound is audible only 3 to 2. Root cause investigation pending, independent of HAL but verify/fix in this worktree.
