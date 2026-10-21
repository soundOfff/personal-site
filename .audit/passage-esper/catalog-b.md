# Catalog B. A shelf of four films

## Caller and markup
Keep `bootBoxOffice()` and every existing public data hook. `BoxOffice.astro` derives films from `SELECTABLE_REELS` excluding `DEFAULT_REEL`; House lights remains the separate escape route. Mood remains absent through the existing registry filter.

```html
<dialog class="boxoffice" data-boxoffice aria-labelledby="bo-title" aria-describedby="bo-lead">
  <header><!-- Name, “Film collection”, existing sound and close controls --></header>
  <h2 id="bo-title">One portfolio. Four perspectives.</h2>
  <p id="bo-lead">Choose a film to explore the work through its world.</p>
  <ul class="bo-films" aria-label="Films">
    <li><button type="button" data-bo-ticket="REEL_ID" aria-pressed="false">
      <span class="bo-poster" aria-hidden="true"><!-- Static local art --></span>
      <span class="bo-film-title">REGISTRY_TITLE</span>
      <span>REGISTRY_YEAR · REGISTRY_DIRECTOR</span>
      <span class="bo-current">Currently viewing</span>
    </button></li>
  </ul>
  <footer><a href="#readme" data-bo-house>House lights · Read the portfolio</a></footer>
  <p role="status" aria-live="polite" data-bo-status></p>
</dialog>
```
All four cards share one visual language. A charcoal-blue ground, quiet owner masthead, large editorial heading, restrained green selection outline and slim metadata make the image shelf the primary object. The entire card is the button; it contains no nested controls. Four portrait studies form one desktop row and a two-column phone grid. The dialog scrolls normally on short screens; no carousel hides choices. House lights stays a single prominent footer link; size the shelf to keep it visible at laptop height.

## Ownership and behavior
`BoxOffice.astro` owns static catalog markup and local artwork. `boxoffice.css` owns its independent dark tokens, responsive shelf and first-frame bootstrap rules. Replace the antique CSS wholesale, including its font imports, fan, paper, leader and late override block. Use existing site sans typography. `boxoffice.ts` owns dialog lifecycle and one selection-in-flight guard. The engine alone owns reel choice, persistence and sound state.

Opening retains `data-first-visit`, `data-boxoffice`, `showModal()` and the current fallback. First visit focuses the dialog. Reopening focuses the current card or House lights. Track the actual opener for focus return; native `dialog.open` is visibility truth. Derive `data-current` and `aria-pressed` from `hasChosen()/currentReel()` through the existing `onReelChange` subscription.

Selecting a new card calls `switchReel(id, { instant: true })` immediately. Keep the catalog visible with `aria-busy="true"` and a short “Opening [film]” status until that promise settles, then close it and focus the destination heading. This removes both the six-second countdown and the second projector ceremony for catalog selection. Already-current selection calls `restartAtTop()` and closes immediately. Use one optional 120ms opacity transition after successful mounting, never a prerequisite timer. Reduced motion closes directly.

Reject repeat card activations while selection is pending. Sound and Escape remain available. Escape during a pending selection closes the catalog without starting another switch; completion must not reopen it or move focus after dismissal. Reopened Escape/close restores the opener without changing the reel. First-visit Escape/close selects House lights and remembers it, matching current semantics. House lights uses the same instant selection path. Async failure leaves the dialog usable with a polite error and a House lights route; always release the pending guard.

Keep `data-sound-toggle` and `data-sound-label` under the engine's existing sound ownership. Remove paper/tear/leader audio and hover noises; a single existing `sound.click()` acknowledges activation. Preserve Escape through native cancel and the nonmodal fallback. Maintain visible focus rings, 44px control targets, labelled cards and text metadata independent of the images. No fabricated ratings, reviews or social accounts.

## Asset evidence and alternative
Inspection found only `parasite.avif` and `mood.avif` in `src/assets/openings`, not four selectable-film stills. Use four consistent original CSS/SVG studies of house lines, orange city/reticle, pink symmetrical hotel and orbital monolith. Existing assets are optional; never download arbitrary film artwork. Identify these as portfolio interpretations, not official posters. Keep the artwork mapping private to `BoxOffice.astro`; registry supplies every title/year/director and accessible film list.

Rejected alternative. A detail-preview catalog with an active poster, synopsis panel and separate “Enter film” button can look editorial, but adds an intermediate selection state and a second activation. Direct poster buttons concentrate preview and activation in the existing selection hook and remove the entire antique phase machine.

Verify first paint, fresh Escape choosing House lights, remembered visits bypassing the catalog, reopen and focus return, all four selections, repeat activation during loading, loading failure, mute, keyboard-only use, narrow/short layouts and reduced motion. No implementation in this sketch.
