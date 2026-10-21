## Why

The film openings were mostly passive illustrations. Give each one a distinct response to visitor input and make HAL the central interaction in the Odyssey hero.

## What changed

- HAL follows the pointer, asks a question, answers through Gemini Flash-Lite, and speaks through the device's native synthetic voice.
- Parasite switches house circuits and signals B1. Mood reveals a letter through a fog-wipe gesture. Blade Runner exposes a scan control. Budapest's existing key registers arrival.
- Every visible countdown numeral now gets a clear beep.

## Scope

- This follows the photographic Parasite and Mood openings in #7. Budapest keeps its existing composition.
- Voice uses an available device voice with a calm delivery. It is disclosed as synthetic and can be stopped or muted.
- Other film interactions run locally. HAL text requests use the existing shared visitor and global limits.

## Blast Radius

Reel cleanup aborts pending HAL requests, stops speech, resets controls, and removes listeners. The new text endpoint validates bounded input and provider output. Device voice quality varies by browser.

## Verification

- Astro check, ESLint, production build, scoped formatting, and diff whitespace checks pass.
- Real browser checks cover two live Spanish AI turns with history, speech start and mute, pointer tracking, keyboard controls, mobile layout, the Mood wipe gesture, the B1 signal, and the room key.
- Actual-source WebAudio rendering confirms one beep before the fix and four synchronized beeps afterward. HTTP checks reject malformed and oversized bodies, including chunked input.
