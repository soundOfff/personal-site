## Findings

### 1. [warning] An accented film title switches an English reply to a Spanish voice
**Location**: `/Users/User/.codex/worktrees/hal-conversation/personal-site/src/reels/odyssey/voice.ts:8`
**Finding**: `languageFor` treats any occurrence of `é`, `á`, or several other accented characters as sufficient evidence that the whole response is Spanish. English film conversations naturally include accented film titles and names, so valid English replies can be spoken with a Spanish voice and pronunciation.
**Evidence**: The reply path calls `voice.speak(outcome.text)` in `hal.ts`, then `speak` calls `languageFor(text)` and filters installed voices to the returned language. Evaluating the exact current predicate with `Amélie has such a warm visual rhythm. What scene stayed with you?` returns `es`, despite the response being entirely English apart from its film title. On devices with a Spanish voice installed, that voice is explicitly selected for the entire English answer; otherwise `utterance.lang` still becomes `es-AR`.
**Suggestion**: Do not let an isolated accented character determine the language. Use stronger sentence-level language evidence, or carry an explicit response locale from the server and select the device voice from it.
