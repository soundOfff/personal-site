# Passage and Esper grounding

This is a source inspection of the current homepage. It uses the pstack how and poteto-mode skills. It does not claim browser verification or change product code.

## Overview

The homepage owns one set of portfolio content. Reels supply presentation and optional interaction through config data, static Astro markup, scoped CSS, and a client module. The engine mounts only the selected reel's client. It hides other reels' static markup through CSS. See [the contract](/Users/User/Tomi/personal-site/src/reels/types.ts:1), [stage rendering](/Users/User/Tomi/personal-site/src/reels/Stages.astro:19), and [generated visibility rules](/Users/User/Tomi/personal-site/src/reels/css.ts:64).

The current opening is a separate composition from each reel's `Stage.astro`. [The homepage](/Users/User/Tomi/personal-site/src/pages/index.astro:48) renders `Opening`, which includes all five [opening components](/Users/User/Tomi/personal-site/src/reels/Opening.astro:9). **There is no `Stages at="in:readme"` call.** Both configs list that point, and both Stage files implement it, but neither hero branch renders. Adding a passage or Esper to those branches alone has no visible effect.

## Current ownership

Parasite's [config](/Users/User/Tomi/personal-site/src/reels/parasite/config.ts:35) maps the existing nine sections to four floors and supplies palettes, typography, slugs, and stage declarations. Its rendered Stage points are `backdrop`, `rail`, `after:log`, `in:writing`, `in:now`, `after:now`, `credits`, and `title`. They provide grain, floor navigation, rain, smoke, the bulb, Morse interaction, credits, and projector title. `in:readme` remains declared but unrendered. The list is at [config line 146](/Users/User/Tomi/personal-site/src/reels/parasite/config.ts:146).

The actual [Parasite opening](/Users/User/Tomi/personal-site/src/reels/openings/Parasite.astro:1) is already a normal-flow house photograph with native `details` and `summary`. Its hidden level contains Mint checkout evidence and a real `/work/mint` link. This existing story must be accounted for before adding another Mint passage. Its [CSS](/Users/User/Tomi/personal-site/src/reels/parasite/reel.css:2159) overrides the common sticky camera geometry. Opening the details currently stretches a dark panel across the photograph. It does not animate the disclosure height, and it does not implement a book spine. The only entry animation moves the revealed copy 20 pixels and fades it over 0.5 seconds when reduced motion is off. See [the details styles](/Users/User/Tomi/personal-site/src/reels/parasite/reel.css:2238).

Parasite's [client mount](/Users/User/Tomi/personal-site/src/reels/parasite/client.ts:107) attaches `mountOpeningDisclosure`, then owns floor tracking, lamps, rain, sounds, playground cues, and Morse behavior. [The disclosure helper](/Users/User/Tomi/personal-site/src/reels/openings/disclosure.ts:1) preserves native activation, closes on Escape, returns focus to the summary, and closes during cleanup. It does not own layout or animation.

BR2049's [config](/Users/User/Tomi/personal-site/src/reels/br2049/config.ts:70) maps the same sections to five acts. `work`, `oss`, and `log` use the Las Vegas act. Its only rendered Stage points are `backdrop`, `rail`, `credits`, and `title`. Its `in:readme` hero, retinal button, and flight markup are dormant. See [the stage list](/Users/User/Tomi/personal-site/src/reels/br2049/config.ts:187) and [the Stage](/Users/User/Tomi/personal-site/src/reels/br2049/Stage.astro:1).

The actual [Blade Runner opening](/Users/User/Tomi/personal-site/src/reels/openings/BladeRunner.astro:13) contains an iris and a graphic cut to Dex routing copy. The shared [camera](/Users/User/Tomi/personal-site/src/reels/camera.ts:10) supplies its scroll variables. Parasite opts out through `data-opening-mode="flow"`. Neither the rendered BR Stage nor client currently implements Esper case evidence. BR's [memory lab](/Users/User/Tomi/personal-site/src/reels/br2049/client.ts:99) is a separate pattern. It clones a template from the rail Stage into `#stack`, records section visits, and removes the clone and section marks on cleanup.

## Work content and native links

[The homepage work index](/Users/User/Tomi/personal-site/src/pages/index.astro:17) reads the non-draft `work` collection, sorts by `data.n`, and renders title, description, stack, and year once. Each row has a real title anchor at `/work/${w.id}`. A separate [row-click enhancement](/Users/User/Tomi/personal-site/src/pages/index.astro:274) navigates clicks outside anchors. A new button inside a row would also trigger that handler unless the handler recognizes that control.

The same collection supplies [case-study routes](/Users/User/Tomi/personal-site/src/pages/work/[...slug].astro:9). Current entries are [Dex](/Users/User/Tomi/personal-site/src/content/work/dex.mdx:1), [Mint](/Users/User/Tomi/personal-site/src/content/work/mint.mdx:1), and [the site agent](/Users/User/Tomi/personal-site/src/content/work/flagship.mdx:1). Dex and Mint are narrative employer work. Their claims must remain within those accounts. Mint's cache-versus-transaction explanation is at [line 56](/Users/User/Tomi/personal-site/src/content/work/mint.mdx:56). Dex's classify-then-dispatch account is at [line 22](/Users/User/Tomi/personal-site/src/content/work/dex.mdx:22).

`in:work` already renders before the work keybar. `after:work` already renders after the section. Neither Parasite nor BR2049 currently registers either point. A new branch needs both an implemented Stage branch and a config entry. Neither insertion point is inside an individual case row. See [the work section](/Users/User/Tomi/personal-site/src/pages/index.astro:74).

## Mounting and cleanup

`engine.loadModule` combines each film's mount with shared camera mounting. `mount` first cleans up the previous reel, creates an AbortController, builds its context, and mounts the loaded module. `unmount` calls the returned cleanup before aborting the controller. Context section and cue subscriptions automatically unsubscribe on abort. See [module composition](/Users/User/Tomi/personal-site/src/reels/engine.ts:156), [context](/Users/User/Tomi/personal-site/src/reels/engine.ts:178), and [unmount](/Users/User/Tomi/personal-site/src/reels/engine.ts:201).

Parasite explicitly clears timers, closes its opening, resets Morse and lamp state, stops rain, restores nav text, and removes its datasets. See [its cleanup](/Users/User/Tomi/personal-site/src/reels/parasite/client.ts:341). BR accumulates cleanup functions for generated nodes, timers, sound listeners, nav styling, and waveform state. See [its mount](/Users/User/Tomi/personal-site/src/reels/br2049/client.ts:164) and [cleanup return](/Users/User/Tomi/personal-site/src/reels/br2049/client.ts:404). DOM listeners use the reel signal. The [camera cleanup](/Users/User/Tomi/personal-site/src/reels/camera.ts:79) cancels its queued frame, disconnects observers, and removes inline camera state.

## Integration constraints

The optional Parasite service passage and adjacent BR Esper evidence belong to the active reel's markup, styles, and mount cleanup. Keep the canonical work collection and native links authoritative. Existing config fields such as `motifs`, `scroll`, and `layout` describe behavior. They do not install it. See [the config contract](/Users/User/Tomi/personal-site/src/reels/types.ts:124).

The user's no-covering-content requirement calls for document-flow expansion or reserved adjacent space. The current Parasite opening panel replaces the photograph's visible area, so copying that geometry wholesale would not establish the requested behavior. Transforming that existing disclosure into the service passage would avoid a second hidden-floor interaction. The user's current `#work` position does not constrain the service passage location. The common [camera frame](/Users/User/Tomi/personal-site/src/reels/camera.css:22) clips overflow and pins the opening. An expanding BR evidence panel inside it would need explicit layout accommodation. A panel next to `#work` avoids those camera constraints.

Keep one case index. Any visual passage or Esper treatment can expose concise case evidence while preserving the existing case links. Avoid cloning the whole table or pasting a second case study. Preserve keyboard activation, Escape and focus behavior, touch access, a visible reduced-motion state, and reset on switch away and return. Remove all temporary DOM, attributes, animation work, observers, and timers during the owning reel's cleanup.

Type System Discipline shaped this inspection by treating `StagePoint` and `ReelConfig` as the ownership contract and checking actual call sites before accepting a declared insertion point as rendered behavior. No new types or code were introduced.
