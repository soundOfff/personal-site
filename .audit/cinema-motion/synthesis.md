# Cinema interaction synthesis

## Commit boundary

All prior work was committed first as 442613e269e9c0cf207fd85ee3f4e2015fd55d3d, as requested. This arena starts from that clean source snapshot. The new work covers compact HAL, softer Budapest navigation/framing and innovative Parasite/Blade Runner interactions. The user-facing ideas are in ideas.md.

## Arena decision

Three production candidates used gpt-6-astra, gpt-6.1-sol and gpt-6-luna at high effort in exclusive worktrees. Every patch and rationale was read end to end. All three built, and C failed its actual Astro type check at Element.hash. A and B were rendered. No candidate dropped out.

Use B as the conceptual base for Blade Runner, with A's complete Parasite house graft. The independent gpt-6-astra judge recommends the same combination, scoring A20, B21 and C11 out of 25 from source. Parent runtime scores and evidence are in parent-scores.md. B's horse is a more specific film object than A's work rack, and A's house gives both desktop and mobile a tangible response to browsing.

## Grafts and corrections

- Graft A's three Parasite files in place of B's desktop-only map. Rooms open as the visitor changes floors, retain visited light, preview under pointer/keyboard and become four native links on phones.
- Correct A's stale inspection. Pointer and keyboard inspection have separate state, both clear on a real section arrival or navigation. The open room returns to the occupied floor when browsing resumes. Name the visual state is-open, while aria-current tracks actual location.
- Keep B's Blade Runner memory specimen and visited-section Set. Each section records a horse fragment; focus or hover lifts that fragment; native anchors revisit sections.
- Graft A's rendered rail-template placement. Runtime verification found B's in:readme template never appeared because the homepage now uses Opening instead of rendering that stage. Hosting the template in rail solves that actual integration defect.
- Correct B's clipping. Each translated slice carries its own rectangle/horse clips, so the raised edge can leave the fixed reference outline. The observed focus transform reached -4.57px during its 5px lift.
- Correct B's accessibility. Recorded and unrecorded states are in link names, and the count is readable ordinary text. Recording follows section arrival, not link clicks, so modifier-clicks do not fabricate visits.
- Use existing palette/font tokens. Replace undefined blue/body tokens in the initial lab with existing accent/sans tokens.
- Insert the cloned lab with insertAdjacentElement. Cloudflare's ambient Element.after overload rejected a DocumentFragment even with a typed HTML query. This was confirmed by the actual compiler, then corrected without casting.
- Reject C's stone. Its old opening stage is not rendered, and its section-depth schedule would happen outside that opening anyway. Do not graft its extra observer or type error.
- Keep A's physical work rack as an alternate idea, without adding a second memory system. Reject duplicate floods/particles and baseline judgments of scrolling speed.

## HAL and Budapest

HAL uses idle, remark and open presentation states. Idle is a 56px circular eye. A transient single remark rises above it and retires automatically. Touch/click opens the small anchored panel; Talk and voice are the primary controls, with pause inside Settings. Escape, explicit close and outside press dismiss it. Pointer gaze batches one frame per input. The companion hides for the hero, other dialogs, title cards and box office. All timers, requests, observers and voice stop on disposal.

Page observations have two authored variations per category and a delayed, bounded AI path. The backend prompt now favors concise page-specific thoughts and dry wit rather than repeated warnings. It receives only the existing event category and its public page context. Request quotas and global budgets are unchanged. An observation produces one line rather than speaking a fallback and then interrupting it with a replacement AI line.

Budapest keeps native smooth fragment navigation. The former deferred instant jump, interaction lock and whole-content smear are removed. Matte dimension/inset transitions last 1.1 seconds and are no longer disabled during navigation. Reduced-motion rules remain immediate. Audio stays attached to the original activation.

## Verification

- Final Astro check passed with 0 errors, 0 warnings and 6 existing hints. Final production build, scoped ESLint, Prettier and whitespace checks passed. Independent final source review found no concrete remaining issues in the 13 changed files.
- HAL was measured at 56 × 56 px in idle. Open, close, Escape, voice/mute toggles, global mute, pause/resume and manual conversation were exercised. The manual dialog hides the companion and restores focus to its eye on close. Opening A2UI also hides the companion, then returns it to idle when closed. No paid manual AI question was submitted.
- Local fallback observations were seen and retired. The revised AI prompt and cancellation/quotas were source-reviewed. Speech controls and engine state were exercised; recorded audible output is not claimed.
- Embedded real browser viewports at 390 and 320 px showed the compact eye, open HAL panel, operable Parasite room strip and Blade Runner specimen/index. Mobile Escape returned HAL to its eye. These are browser viewport checks, not physical-device tests.
- Parasite room navigation reached bunker/current 3, then pointer scrolling returned both open room and aria-current to stairs/current 1. Previously visited rooms remained lit. No stale preview was observed.
- Blade Runner rendered one lab. Eight then nine actual section records matched its text/count/classes. Keyboard focus selected a lifted fragment with both clips. Switching to Parasite removed all labs and all nine heading marks.
- Budapest's wide 1422 × 800 frame exposed 1.1-second width/height transitions, native smooth scrolling and no gb-whipping class. Forward/back navigation changed eras 2 and 0. A screenshot captures the completed era2 frame. The driver can change a background tab's viewport on navigation, so zero-sized matte readings on narrow/hidden views are not used as motion proof.
- Box-office ticket activation includes its existing long leader/countdown. A 10-second wait expired before a real switch completed; a later DOM read confirmed Parasite and successful cleanup. This was a verification timeout, not a source defect.
- Reduced-motion branches and cleanup were read in source. OS preference emulation and physical touch were not available, so no runtime reduced-motion claim is made.
- Added-comment review requested two narrative CSS deletions from A and one from rejected C. The adopted A house comment was removed; A's archive comment and C's stone were not adopted. Independent final review found no gratuitous added comments or suppressions. No MUST KILL flags remain.

## Principles

Separate Before Serializing Shared State isolated candidate sources and kept shared-cache builds sequential. Model the Domain separated HAL presentation from watching/paused behavior and used Sets for visited floors/fragments. Type System Discipline kept API responses unknown until checked and avoided casts at DOM insertion. Redesign From First Principles removed the panel from idle rather than shrinking its old controls. Laziness Protocol kept native anchors and existing voice/quota owners. Prove It Works found the unrendered template that source review missed. Apple Design's origin and interruptibility guidance anchored HAL's panel to its eye and preserved continuous native navigation.

The source patch, candidate patches/rationales, independent reports, screenshots and logs are saved beside this note. No deployment or remote push was performed.
