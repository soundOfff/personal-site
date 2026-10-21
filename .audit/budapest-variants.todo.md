# Budapest variants

Superseded. The user clarified that Budapest stays as-is. The active exploration is other-films.todo.md and .prototypes/film-variants.

- [x] Scope the decision the prototype exists to make: which layout, which interaction, which density, or for an empirical fork which behavior, timing, or approach. No decision means no prototype. Route to Feature.
- [x] Gather references when the design space is open. Search for prior art, summarize a moodboard of themes, palettes, and layouts, let the user pick directions before building. Skip when the direction is set.
  skip: Direction is set by the user, Grand Budapest. Existing artwork and documented prior experiments are the reference.
- [x] Build throwaway in an isolated scratch dir, separate from production source. For a visual decision, vanilla HTML/CSS/JS or the lightest stack that renders the idea, CDN deps, a dev server with hot reload. For a behavioral or timing decision, the smallest script that exercises the question. No production framework, no tests, no abstractions.
- [x] When comparing alternatives, build them behind one switcher (buttons or a keypress), each variant labeled. This is the **exhaust-the-design-space** principle skill made cheap.
- [x] Verify on the matching surface. For a visual decision, screenshot each variant via the driver skill and drive the interaction. For a behavioral or timing decision, observe the thing you are deciding by logging the timing, printing the output, or watching the render. The observation is the test here, not an assertion.
- [x] Present alternatives, tradeoffs, and a recommendation. The output is the decision plus the throwaway artifact, not shippable code. Hand the chosen direction to **Feature** (or `architect` for the shape) for the real build.
- [x] Interrogate with gpt-6-astra, gpt-6.1-sol, gpt-6-luna and synthesize every finding.

Throughput checkpoint. Three read-only reviewers assess the existing site concurrently. The lead builds a single isolated comparison page. No production changes until the visual direction is selected.

Data shape. A selected shot id chooses one of three scenes. A Set of discovered evidence ids tracks optional discoveries. Content links remain directly visible.
