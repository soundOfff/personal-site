/**
 * The Playground: a conversational portfolio.
 *
 * A visitor asks a question about the work; an agent answers by generating a
 * user interface, and this island renders it. The island itself is deliberately
 * thin — it owns the transcript, the mode switch and the network call, and
 * nothing about what an answer looks like. That all lives in the surfaces the
 * agent sends and in `a2ui/`, which is the point of the protocol.
 *
 * Two modes, the same architecture the router demo used and for the same
 * reasons. **Demo** replays bundled transcripts: free, offline, abuse-proof, and
 * what the page boots into, so the section is fully interactive before any
 * network call. **Live** posts to the Worker, which holds the key and the caps.
 *
 * The console reports what a live turn actually cost — model, latency, tokens,
 * cache hits, dollars — and every turn will show you the raw A2UI messages
 * behind it. Both are there because the audience for this page opens dev tools
 * out of habit, and a demo that can't be checked isn't evidence.
 */

import { useCallback, useRef, useState } from 'react';
import { Alert, Button, Input, SegmentedControl } from 'editorial-ui';
import { Renderer } from './a2ui/Renderer';
import { AskContext } from './a2ui/components';
import { STARTERS, WELCOME, demoAnswer } from './a2ui/demo';
import { stateFrom, type A2uiState } from './a2ui/model';
import type {
  A2uiError,
  A2uiMessage,
  A2uiResponse,
  HistoryTurn,
  TurnMeta,
} from '../lib/a2ui/types';

type Mode = 'demo' | 'live';

/** Long enough to read as work, short enough not to feel like a stall. */
const DEMO_DELAY_MS = 480;

/** How many prior turns travel with a live request. Matches the server's cap. */
const MAX_HISTORY = 6;

interface Turn {
  key: number;
  /** null for the welcome surface, which answers a question nobody asked. */
  question: string | null;
  summary: string;
  messages: A2uiMessage[];
  state: A2uiState;
  meta?: TurnMeta;
  /** A note attached to the answer, e.g. why live fell back to demo. */
  notice?: string;
}

/** Seconds → a human retry hint; daily caps reset hours out, not seconds. */
function formatRetry(seconds: number): string {
  if (seconds < 90) return `${seconds}s`;
  if (seconds < 5400) return `${Math.round(seconds / 60)} min`;
  return `${Math.round(seconds / 3600)} h`;
}

function GlyphIcon({ id }: { id: string }) {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <use href={`#${id}`}></use>
    </svg>
  );
}

const WELCOME_TURN: Turn = {
  key: 0,
  question: null,
  summary: WELCOME.summary,
  messages: WELCOME.messages,
  state: stateFrom(WELCOME.messages),
};

export default function A2UIPlayground() {
  const [mode, setMode] = useState<Mode>('demo');
  const [turns, setTurns] = useState<Turn[]>([WELCOME_TURN]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nextKey = useRef(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const append = useCallback((turn: Omit<Turn, 'key'>) => {
    setTurns((prior) => [...prior, { ...turn, key: nextKey.current++ }]);
    setPending(null);
  }, []);

  /** Replay the thread as text. Agent turns travel as their summary line. */
  const historyFrom = useCallback((prior: Turn[]): HistoryTurn[] => {
    const history: HistoryTurn[] = [];
    for (const turn of prior) {
      if (!turn.question) continue;
      history.push({ role: 'user', text: turn.question });
      history.push({ role: 'agent', text: turn.summary });
    }
    return history.slice(-MAX_HISTORY);
  }, []);

  const answerFromDemo = useCallback(
    (question: string, notice?: string) => {
      const turn = demoAnswer(question);
      append({
        question,
        summary: turn.summary,
        messages: turn.messages,
        state: stateFrom(turn.messages),
        ...(notice ? { notice } : {}),
      });
    },
    [append],
  );

  const askLive = useCallback(
    async (question: string, prior: Turn[]) => {
      try {
        const res = await fetch('/api/a2ui', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ message: question, history: historyFrom(prior) }),
        });

        if (res.ok) {
          const body = (await res.json()) as A2uiResponse;
          append({
            question,
            summary: body.summary,
            messages: body.messages,
            state: stateFrom(body.messages),
            ...(body.meta ? { meta: body.meta } : {}),
          });
          return;
        }

        const body = (await res.json().catch(() => ({}))) as A2uiError;

        if (res.status === 429) {
          setPending(null);
          setError(
            `Rate limit reached. Try again in ${formatRetry(body.retryAfter ?? 60)}. Demo mode is always free.`,
          );
          return;
        }

        // Anything the agent can't answer still gets an answer: fall back to the
        // bundled transcript and say why, rather than leaving an empty turn.
        if (res.status === 503) {
          answerFromDemo(
            question,
            body.error === 'daily-budget-exhausted'
              ? "Live mode's shared daily budget is spent; this is the recorded answer. Resets at 00:00 UTC."
              : "Live mode isn't enabled on this deploy yet; this is the recorded answer.",
          );
          return;
        }

        setPending(null);
        setError(
          body.error === 'message-too-long'
            ? 'That question is longer than the endpoint accepts. Try a shorter one.'
            : 'The agent failed to compose a surface. Try rephrasing, or switch to demo mode.',
        );
      } catch {
        setPending(null);
        setError('Network error reaching the agent. Demo mode works offline.');
      }
    },
    [append, answerFromDemo, historyFrom],
  );

  const ask = useCallback(
    (raw: string) => {
      const question = raw.trim();
      if (!question || pending) return;

      if (timer.current) clearTimeout(timer.current);
      setDraft('');
      setError(null);
      setPending(question);

      if (mode === 'live') {
        void askLive(question, turns);
      } else {
        timer.current = setTimeout(() => answerFromDemo(question), DEMO_DELAY_MS);
      }
    },
    [answerFromDemo, askLive, mode, pending, turns],
  );

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setTurns([WELCOME_TURN]);
    setPending(null);
    setError(null);
    setDraft('');
  }, []);

  const started = turns.length > 1;

  return (
    <div className="console a2-console" data-pg>
      <div className="console-bar">
        <span className="who">
          <span className="lights" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </span>
          portfolio agent: {mode}
        </span>
        <div className="a2-bar-right">
          {started && (
            <button type="button" className="a2-reset" onClick={reset}>
              clear
            </button>
          )}
          <SegmentedControl
            className="seg-mono"
            items={[
              { id: 'demo', label: 'demo' },
              { id: 'live', label: 'live' },
            ]}
            activeId={mode}
            onChange={(id) => setMode(id as Mode)}
            aria-label="Agent mode"
          />
        </div>
      </div>

      <div className="console-body">
        <AskContext.Provider value={ask}>
          <div className="a2-thread">
            {turns.map((turn) => (
              <article className="a2-turn" key={turn.key}>
                {turn.question && (
                  <p className="a2-ask">
                    <span className="car" aria-hidden="true">
                      ❯
                    </span>
                    <span>{turn.question}</span>
                  </p>
                )}

                <Renderer state={turn.state} />

                {turn.notice && (
                  <p className="a2-notice">
                    <GlyphIcon id="i-info" />
                    <span>{turn.notice}</span>
                  </p>
                )}

                {turn.meta && (
                  <div className="statusline a2-status">
                    <span className="seg ok">● rendered</span>
                    <span className="sep">·</span>
                    <span className="seg">
                      <b>{turn.meta.model}</b>
                    </span>
                    <span className="sep">·</span>
                    <span className="seg">
                      <b>{turn.meta.latency}</b>
                    </span>
                    <span className="sep">·</span>
                    <span className="seg">
                      {turn.meta.inputTokens} in / {turn.meta.outputTokens} out
                    </span>
                    {turn.meta.cachedTokens > 0 && (
                      <>
                        <span className="sep">·</span>
                        <span className="seg">{turn.meta.cachedTokens} cached</span>
                      </>
                    )}
                    <span className="sep">·</span>
                    <span className="seg">
                      cost <b>{turn.meta.cost}</b>
                    </span>
                    <span className="sep">·</span>
                    <span className="seg">{turn.meta.components} components</span>
                  </div>
                )}

                {/* The protocol, on demand. `details` keeps it free until opened. */}
                <details className="a2-peek">
                  <summary>view the A2UI messages</summary>
                  <pre>{JSON.stringify(turn.messages, null, 2)}</pre>
                </details>
              </article>
            ))}

            {pending && (
              <article className="a2-turn is-pending" aria-live="polite">
                <p className="a2-ask">
                  <span className="car" aria-hidden="true">
                    ❯
                  </span>
                  <span>{pending}</span>
                </p>
                <div className="a2-skeleton" aria-label="Composing the surface">
                  <span className="a2-sk-line is-w70"></span>
                  <span className="a2-sk-line is-w90"></span>
                  <span className="a2-sk-block"></span>
                </div>
                <p className="a2-composing">composing surface…</p>
              </article>
            )}
          </div>
        </AskContext.Provider>

        {error && (
          <p className="console-error">
            <GlyphIcon id="i-info" />
            <span>{error}</span>
          </p>
        )}

        <form
          className="a2-composer"
          onSubmit={(event) => {
            event.preventDefault();
            ask(draft);
          }}
        >
          <Input
            className="a2-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about the work, the writing, the background…"
            maxLength={400}
            disabled={pending !== null}
            aria-label="Ask the portfolio agent"
          />
          <Button variant="amber" type="submit" className="a2-send" disabled={pending !== null}>
            <span>{pending ? 'Asking…' : 'Ask'}</span>
            <GlyphIcon id="i-send" />
          </Button>
        </form>

        {!started && !pending && (
          <div className="a2-starters">
            {STARTERS.map((prompt) => (
              <button type="button" className="a2-action" key={prompt} onClick={() => ask(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        )}

        <Alert variant="info" compact className="live-note">
          {mode === 'live'
            ? 'Live mode runs a real agent behind a serverless function; the key stays server-side, capped at 6 questions/min and 25/day.'
            : 'Demo mode replays recorded answers — free, offline, no API call. Switch to live for a real agent turn.'}
        </Alert>
      </div>
    </div>
  );
}
