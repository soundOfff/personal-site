# Four-film shelf with immediate selection

`bootBoxOffice()` stays the only public entry point. Existing `data-boxoffice-open` controls reopen the same native dialog. `SELECTABLE_REELS` owns availability; separate its House lights entry from its four films. Mood remains inaccessible.

```astro
<dialog class="boxoffice" data-boxoffice aria-labelledby="bo-title" aria-describedby="bo-lead" tabindex="-1">
  <header><!-- Profile name, existing sound hooks, data-bo-close. --></header>
  <h2 id="bo-title">A portfolio in four films.</h2>
  <p id="bo-lead">Choose a film to explore the same work through a different lens.</p>
  <ul class="bo-films" aria-label="Films">{films.map(r => <li>
    <button type="button" data-bo-ticket={r.id} data-label={r.title}>
      <span class="bo-poster" data-film={r.id} aria-hidden="true" />
      <span>{r.title}</span><span>{r.year} · {r.director}</span><span data-bo-current>Currently selected</span>
    </button></li>)}</ul>
  <footer><a href="#readme" data-bo-house>House lights · View the portfolio</a></footer>
  <p role="status" data-bo-status></p>
</dialog>
```

`type State = { kind: 'closed' } | { kind: 'browsing'; first: boolean; opener: HTMLElement | null } | { kind: 'choosing'; first: boolean; opener: HTMLElement | null; reel: string }`. The controller owns dialog state and focus. Engine owns current reel, memory, sound preference, and loading. Current markers derive from `onReelChange`; no second selected-reel variable exists.

Choosing calls `switchReel(id, { instant: true })` immediately. Keep the catalog visible and busy while loading; ignore repeated choices, close on resolve, restore browsing with a retryable status on failure. This bypasses both countdown and projector ceremony. Current film selection calls `restartAtTop()` and closes. Remove `CUE`, timer queues, phases, ticket sounds, clock, leader DOM, and `fromBlack` handoff. Keep `bootBoxOffice` and stable data hooks.

Escape on first browsing chooses and remembers House lights; on reopened browsing it only closes. During choosing it dismisses while the committed selection completes. Gate reopen until that promise settles so a late result cannot close another session. Route cancel/close through one idempotent dismissal. Reopened dismissal restores its opener; first open focuses the dialog, reopened open focuses the current choice.

Replace antique CSS wholesale with charcoal blue, restrained name masthead, editorial introduction, and four level 2:3 poster cards. Original CSS/SVG studies depict house lines, orange city/reticle, pink symmetrical hotel, and orbital monolith. Registry provides every title/year/director. Use four columns on desktop and two on phones; short screens scroll vertically. Keep House lights prominent. No fabricated ratings or downloaded artwork.

Preserve `data-first-visit` first-frame cover, native `showModal`, root scroll lock, and `#readme` fallback when module JS fails. Nonmodal fallback adds background inertness and Tab containment, restored on close. Native buttons provide identical click/tap/Enter/Space behavior. Use visible focus, `aria-current` for selected film, hidden decorative artwork, and existing engine-owned sound hooks. A 160 ms image lift is optional; reduced motion removes it entirely.

The three existing boxoffice files own markup, visual rules, and behavior respectively; registry and engine contracts stay intact. A two-pane preview with a separate Enter button was rejected because it adds preview versus committed selection state and an extra phone activation. Verify first visit, remembered reload, reopen focus, Escape in every state, slow/failing loading, double activation, 320px layout, no-JS House lights escape, and reduced motion.
