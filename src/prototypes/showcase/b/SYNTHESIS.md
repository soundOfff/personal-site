# b. Synthesis of B1, B2 and B3

**Base: B3.** Its demo stage is the clearest (beat list beside the frame, a rail whose segments are proportional to chapter length, a "Next" link), its line is plain DOM and SVG driven by one beat table, so stations stay real buttons and a new beat is one row, and it is the quietest page of the three.

**Judge.** B1 28, B2 26, B3 28; B3 as base for demo clarity and an extensible DOM workflow. The judge was the same model family as the runners (only Claude was available), so its agreement is weaker evidence than a cross-family verdict.

**Grafts.**
- B2, 75svh steps. `--step: 75svh` on `.b-work` (was 85svh). A 0.45-viewport wheel gesture now ends within reach of the next step instead of halfway between two.
- B2, flood seeded from the product name. `pourFrom(k)` in `stage.ts` seeds B3's cave flood (Dijkstra, walls cost 3) at the frame cell nearest name `k` (B2's clamped `seedFor`). Desktop pours in from the left edge at the name's height, mobile from the top edge under the name. The cover seeds from the incoming name, whether a click or the scroll asked for it, and the drain re-seeds from the name now shown at full cover, where every field is solid, so B3's reversible band survives intact.
- B2, jumps skip the products in between. A click or arrow key now goes straight to its product and the steps it scrolls past are ignored until it lands (or the scroll ends). Without this, Sift to Catcher poured from FocusQuote and flashed its demo.
- B1, copy as JSON. The frontmatter builds `stageCopy` and `lineCopy` and puts them on `#work` and `#workflow` as `data-copy`. The scripts parse them. No more regex on `textContent`. The first narration line and the "Next" label render from the same objects.
- Copy. The headline is now "Agents iterate. *I decide.*", under the "My AI workflow" eyebrow. Agents explore at Design, build, and challenge at Review, which is the loop the line draws. Tomas frames and makes the final call.

**Leak fix.** B3's imported stylesheet is gone. Its rules, renamed to `html:has([data-proto='b'])` and `.b-*`, live in a `<style is:inline>` block in `Variant.astro`. I picked `is:inline` over B1's `is:global` because in dev, `?variant=a1` loads every variant's bundled `<style>` module (b1, b2, c1 and the rest, plus B3's stylesheet), since the registry imports every variant lazily. A bundled block would put `b/` on a1's page. An inline block renders only in b's HTML.

**Settle (coordinator update).** CSS proximity snapping is gone. `initSettle(root)` from `../settle` glides forward to a target after the scroll stops. The `scroll-snap-align` rules stay as its targets: the three steps and the section starts. I deleted the `scroll-snap-type: y proximity` line and the `.cover` and `#contact` targets instead of adding `none !important` overrides. The base page sets neither, so there was nothing else to override, and `#contact` sits outside `main`, where settle never looks. The stage still picks `round(progress)`, so if a visitor stops between steps they see one whole product.

**Rejected.**
- B1's canvas line. DOM and SVG keep stations focusable and the text crisp.
- B2's product tabs. The stacked names already are the tabs.
- B2's fixed-time wipe. It cannot reverse mid-swap like B3's band.
- B1's "Scroll for" hint. B3's "Next" link both says it and does it.

**Convergence.** All three converged strongly: the same order (cover, `#work`, `#workflow`), a sticky pin with step markers, a flood wipe in the cover's cave language, solid and ghost product names, a chapter rail, and one ticket with two return loops. Little needed grafting. These are refinements, not a merge of shapes.

**Verification.**
- Gate. The shared `shoot.py` crashes on every case with "'str' object is not callable": line 105 assigns `settle = page.evaluate(...)`, which shadows the `settle()` helper. A scratch copy with only that local renamed prints `b: PASS (4/4 cases ok, 53 shots ...)`.
- Wheel stops. Desktop: 1800 Sift, 2475 FocusQuote, 3150 Catcher, 3555, then 4050 `#workflow`. Mobile: 1688, 2321, 2954, 3334, then 3798. That is one stop per product with no stop between steps. The one extra stop is the stage unpinning on the way out, which takes 100svh of scroll in every candidate.
- Slow wheel: `#work` 1800 to 2875, `#workflow` 4050 to 5147. Page Down shows each product once (1800, 2660, 3520) but does not land flush on a step, because settle never pulls back.
- Leak. Of the files loaded on `?variant=a1`, 0 come from `b/`. Neither a1 nor b gets a 404 or a console error.
- Keyboard. From page load, 10 Tabs reach Sift with a visible focus ring. ArrowDown swaps to FocusQuote, then Catcher, and stops there. ArrowUp goes back. Click jumps go 0 to 2 and 2 to 0 with no product in between.
