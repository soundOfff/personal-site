# Chosen design

Base B. Native details.open owns disclosure state. One summary supplies both open and close labels through CSS. No parallel hidden or aria-expanded state. mountOpeningDisclosure(scene, signal) adds local Escape, restores summary focus on explicit Escape, and returns an idempotent cleanup that closes without moving focus. The two existing film clients call it.

Each actual scene declares data-opening-mode=flow. mountCamera locates the selected scene, skips flow scenes, and otherwise follows its existing path. Remove its redundant FILMS Set. Do not add required fields to every reel config.

Scoped reel CSS owns photo URLs and intrinsic scene layout. No HTML img src or preload for these photos. House and other films must not activate them. Compressed copies of the approved two sources live in src/assets/openings. The image description is a separate role=img layer, never an ancestor of interactive content.

Use actual film typography. Keep semantic heading levels, direct Work and Contact links, actual content collections and rail. Desktop letter must not obscure underlying actionable links. At mobile or zoomed sizes, the disclosure can grow naturally. Reduced-motion CSS disables reveal transforms and transitions, while native details remains usable.

Remove obsolete Parasite/Mood camera artwork and responsive rules. Preserve all Budapest, Blade Runner and Odyssey camera rules. Own flow selectors must outrank shared camera/mobile/reduced-motion selectors regardless of stylesheet insertion order.

Judge gpt-6-luna agreed with the lead, scoring A=14, B=17, C=14 out of 18. Graft A's explicit distinction between focus-return on user close and no focus-return during cleanup. Reject C's required config field because it touches unrelated films. Reject a custom hidden/button controller because these are inline native disclosures, not dialogs.

Usage. Each opening contains details[data-opening-disclosure]. parasite/client.ts and mood/client.ts call mountOpeningDisclosure(document.querySelector('[data-opening="their-id"]'), ctx.signal), and invoke its cleanup inside existing cleanup. Helper owns only that scene's native details. No new film-selection registry.

Verification contract. Switch in from House and other films, open by keyboard/touch, follow Mint/essay links, close with summary/Escape, switch away while open and return closed, use reduced-motion CSS, inspect narrow/zoomed layouts. Compare Budapest's reference geometry and screenshot after the integration.
