# Four other films

- [x] Scope the decision the prototype exists to make: which layout, which interaction, which density, or for an empirical fork which behavior, timing, or approach. No decision means no prototype. Route to Feature.
- [x] Gather references when the design space is open. Search for prior art, summarize a moodboard of themes, palettes, and layouts, let the user pick directions before building. Skip when the direction is set.
  skip: The four existing film interpretations and Budapest as the user's reference establish the direction.
- [x] Build throwaway in an isolated scratch dir, separate from production source. For a visual decision, vanilla HTML/CSS/JS or the lightest stack that renders the idea, CDN deps, a dev server with hot reload. For a behavioral or timing decision, the smallest script that exercises the question. No production framework, no tests, no abstractions.
- [x] When comparing alternatives, build them behind one switcher (buttons or a keypress), each variant labeled. This is the **exhaust-the-design-space** principle skill made cheap.
- [x] Verify on the matching surface. For a visual decision, screenshot each variant via the driver skill and drive the interaction. For a behavioral or timing decision, observe the thing you are deciding by logging the timing, printing the output, or watching the render. The observation is the test here, not an assertion.
- [x] Present alternatives, tradeoffs, and a recommendation. The output is the decision plus the throwaway artifact, not shippable code. Hand the chosen direction to **Feature** (or `architect` for the shape) for the real build.
- [x] Interrogate the corrected scope with gpt-6-astra, gpt-6.1-sol and gpt-6-luna. Synthesize all findings.

Throughput checkpoint. The three reviewers inspect the same four film implementations concurrently. The lead builds and drives one isolated four-way comparator. Keep Budapest and production files untouched.

Data shape. A Map associates each film id with its panel, reveal and trigger. A selected film id chooses one panel. A Set remembers which scenes were explored to connect Blade Runner's signal to the later Dex note.
