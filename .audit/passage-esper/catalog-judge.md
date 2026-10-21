# Catalog cross-judge

| Design | No redundant selection steps | Lifecycle, focus, async safety | Four films on mobile | API / code size |
|---|---:|---:|---:|---:|
| A | 5 | 5 | 5 | 4 |
| B | 5 | 4 | 5 | 5 |

A is the better base. Both designs remove the countdown and projector handoff, keep House lights separate, and preserve the stable boot and data hooks. A's closed/browsing/choosing state makes the first-visit, reopen, and in-flight cases explicit, and its reopen gate prevents a late selection from closing a newer dialog session. Both offer all four native-button choices in a two-column phone layout with visible film metadata.

Graft B's destination-heading focus after a successful selection, conditional on the dialog still being open. Keep B's rule that completion after Escape does not steal focus. Also take its 44px targets and explicit removal of passive ticket/leader noises; retain at most one click acknowledgement on activation. For an already-current film, preserve A's immediate restart-at-top behavior.

B is the smaller implementation shape, but its single in-flight guard leaves reopen-during-switch coordination less explicit than A's state and gate. A should keep the state machine private to `boxoffice.ts`; neither design needs a new public API or registry state. Both retain native `showModal`, sound hooks, first-frame bootstrap, no-JS House lights fallback, and reduced-motion behavior. B's failure path is clearer; graft its usable error status and guard release into A.
