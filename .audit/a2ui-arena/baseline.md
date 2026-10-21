# Live baseline

Browser at localhost:4321/#playground, Odyssey selected, about 733px wide by 751px tall.

- Launcher occupies a long list of grouped starters. Companion in lower left can cover part of this list.
- Native panel opens successfully and focuses the composer on this viewport.
- Empty panel displays protocol pipeline, technical callout, four follow-ups and four more footer starters.
- One real question, "What has he built?", produced a complete generated surface. The transcript moves to its bottom, making the start of a long response harder to read.
- Settled Odyssey action buttons have foreground rgb(232,232,228) on rgb(21,23,26), opacity 1. The faint screenshot before settling is an entrance-animation issue, not an established contrast defect. Candidates informed.
- Screenshots before-panel.png and before-reply.png saved.

## Existing integration constraints

Native dialog and reel:cue hooks are used by every film. .a2-composer, .a2-action and .a2-panel-bar are styled by film clients, and Odyssey adds a synthetic lens before the composer. Keep the composer input's .a2-input hook if moving to a textarea. Keep launcher class hooks so film styling remains meaningful.

Quota remains server-owned. Clearing a conversation must not reset remaining questions, and cancellation must not claim to refund a server-counted request.
