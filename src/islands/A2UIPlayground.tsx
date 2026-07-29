/**
 * The Playground: a conversational portfolio.
 *
 * A visitor asks a question about the work; an agent answers by generating a
 * user interface, and this island renders it. The island itself is deliberately
 * thin — it owns the transcript and the network call, and nothing about what an
 * answer looks like. That all lives in the surfaces the agent sends and in
 * `a2ui/`, which is the point of the protocol.
 *
 * There is one path: every question posts to the Worker, which holds the key
 * and the caps, and every surface on screen was composed by the model for that
 * question. Nothing is pre-recorded, so a failure shows as a failure rather
 * than as a canned answer wearing the agent's voice.
 *
 * The console reports what each turn actually cost — model, latency, tokens,
 * cache hits, dollars — and every turn will show you the raw A2UI messages
 * behind it. Both are there because the audience for this page opens dev tools
 * out of habit, and a demo that can't be checked isn't evidence.
 *
 * The surfaces need room the 600px content column doesn't have, so the console
 * lives in a right-hand slideover and the page keeps only a launcher. The
 * transcript is state in this island, not in the dialog, so closing the panel
 * parks the thread rather than throwing it away.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Input } from 'editorial-ui';
import { Renderer } from './a2ui/Renderer';
import { AskContext } from './a2ui/components';
import { QUICK_STARTERS, STARTER_GROUPS, WELCOME } from './a2ui/welcome';
import { stateFrom, type A2uiState } from './a2ui/model';
import type {
  A2uiError,
  A2uiMessage,
  A2uiResponse,
  HistoryTurn,
  TurnMeta,
} from '../lib/a2ui/types';

/** How many prior turns travel with a request. Matches the server's cap. */
const MAX_HISTORY = 6;

interface Turn {
  key: number;
  /** null for the welcome surface, which answers a question nobody asked. */
  question: string | null;
  summary: string;
  messages: A2uiMessage[];
  state: A2uiState;
  meta?: TurnMeta;
}

/** Seconds → a human retry hint; daily caps reset hours out, not seconds. */
function formatRetry(seconds: number): string {
  if (seconds < 90) return `${seconds}s`;
  if (seconds < 5400) return `${Math.round(seconds / 60)} min`;
  return `${Math.round(seconds / 3600)} h`;
}

/** The daily allowance, mirrored from the server so the copy has a number. */
const DAILY_LIMIT = 5;

/**
 * The burst window is a minute, so anything longer than that came from the
 * daily cap — which means the visitor is out of questions, not just early.
 */
const isDailyCap = (retryAfter: number) => retryAfter > 60;

interface Quota {
  remaining: number;
  limit: number;
}

/** The grouped menu of starting questions. Rendered wherever there is room. */
function StarterMenu({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="a2-starter-menu">
      {STARTER_GROUPS.map((group) => (
        <div className="a2-starter-group" key={group.label}>
          <span className="a2-starter-lbl">{group.label}</span>
          <div className="a2-starters">
            {group.prompts.map((prompt) => (
              <button
                type="button"
                className="a2-action"
                key={prompt}
                onClick={() => onPick(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
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
  const [turns, setTurns] = useState<Turn[]>([WELCOME_TURN]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [maxed, setMaxed] = useState(false);
  /** null until the first turn answers; the server owns the real count. */
  const [quota, setQuota] = useState<Quota | null>(null);
  const nextKey = useRef(1);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const askAgent = useCallback(
    async (question: string, prior: Turn[]) => {
      try {
        const res = await fetch('/api/a2ui', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ message: question, history: historyFrom(prior) }),
        });

        if (res.ok) {
          const body = (await res.json()) as A2uiResponse;
          if (body.quota) setQuota(body.quota);
          append({
            question,
            summary: body.summary,
            messages: body.messages,
            state: stateFrom(body.messages),
            meta: body.meta,
          });
          return;
        }

        const body = (await res.json().catch(() => ({}))) as A2uiError;
        setPending(null);

        if (res.status === 429) {
          const retryAfter = body.retryAfter ?? 60;
          if (isDailyCap(retryAfter)) {
            setQuota({ remaining: 0, limit: DAILY_LIMIT });
            setError(
              `That was your ${DAILY_LIMIT} questions for today. The cap resets at 00:00 UTC — about ${formatRetry(retryAfter)} from now. Everything the agent knows is also on the page below.`,
            );
            return;
          }
          setError(`Slow down a moment — try again in ${formatRetry(retryAfter)}.`);
          return;
        }

        if (res.status === 503) {
          setError(
            body.error === 'daily-budget-exhausted'
              ? 'The shared daily budget for live turns is spent. It resets at 00:00 UTC — that cap is what keeps this endpoint open to everyone without a login.'
              : "The agent isn't configured on this deploy: no API key is set server-side, so there is nothing to ask.",
          );
          return;
        }

        setError('The agent failed to compose a surface. Try rephrasing the question.');
      } catch {
        setPending(null);
        setError('Network error reaching the agent. Check the connection and ask again.');
      }
    },
    [append, historyFrom],
  );

  const spent = quota !== null && quota.remaining <= 0;

  const ask = useCallback(
    (raw: string) => {
      const question = raw.trim();
      if (!question || pending || spent) return;

      setDraft('');
      setError(null);
      setPending(question);
      void askAgent(question, turns);
    },
    [askAgent, pending, spent, turns],
  );

  const reset = useCallback(() => {
    setTurns([WELCOME_TURN]);
    setPending(null);
    setError(null);
    setDraft('');
  }, []);

  /** Open the panel, optionally with a question already in flight. */
  const launch = useCallback(
    (prompt?: string) => {
      setOpen(true);
      if (prompt) ask(prompt);
    },
    [ask],
  );

  /* The dialog is native, so Esc, the backdrop and focus containment are the
     platform's job; React only keeps `open` in step with the element. */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      // The composer is the point of the panel — but not at the cost of
      // throwing up a keyboard over a phone screen the moment it opens.
      if (window.matchMedia('(min-width: 700px)').matches) {
        dialog.querySelector<HTMLInputElement>('input')?.focus();
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  /* showModal() makes the page inert but not unscrollable. */
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prior = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = prior;
    };
  }, [open]);

  /* Follow the transcript: a new turn or a pending one should be in view. */
  useEffect(() => {
    if (!open) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
  }, [open, turns, pending]);

  const started = turns.length > 1;
  const asked = turns.length - 1;

  return (
    <>
      {/* The page keeps a door, not the room. */}
      <div className="console a2-launch">
        <div className="console-bar">
          <span className="who">
            <span className="lights" aria-hidden="true">
              <i></i>
              <i></i>
              <i></i>
            </span>
            portfolio agent: live
          </span>
          {quota ? (
            <span className="a2-launch-count">
              {quota.remaining} of {quota.limit} left today
            </span>
          ) : (
            started && <span className="a2-launch-count">{asked} asked</span>
          )}
        </div>

        <div className="console-body a2-launch-body">
          <p className="a2-launch-lede">
            Ask a question about the work and an agent answers by composing a user interface for it
            — cards, charts, diagrams, timelines, not paragraphs. Nothing here is pre-recorded.
          </p>

          <div className="a2-launch-row">
            <Button variant="amber" onClick={() => launch()}>
              <GlyphIcon id={started ? 'i-arrow-r' : 'i-play'} />
              <span>{started ? 'Reopen the playground' : 'Open the playground'}</span>
            </Button>
            {started ? (
              <button type="button" className="a2-reset" onClick={reset}>
                clear thread
              </button>
            ) : (
              <span className="a2-launch-hint">or start with a question:</span>
            )}
          </div>

          {!started && <StarterMenu onPick={launch} />}

          <Alert variant="info" compact className="live-note">
            Every question runs a real agent behind a serverless function; the key stays
            server-side, and each visitor gets {DAILY_LIMIT} questions a day.
          </Alert>
        </div>
      </div>

      <dialog
        className={maxed ? 'a2-drawer is-max' : 'a2-drawer'}
        ref={dialogRef}
        aria-label="Portfolio agent playground"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Clicks that land on the dialog itself are backdrop clicks; the
          // panel fills the dialog, so anything inside stops here.
          if (event.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="a2-panel">
          <div className="console-bar a2-panel-bar">
            <span className="who">
              {/* The console's decorative traffic lights, made real: the panel
                  is a window, so the dots are where you'd reach for first. */}
              <span className="a2-lights" role="group" aria-label="Panel controls">
                <button
                  type="button"
                  className="a2-lamp is-close"
                  onClick={() => setOpen(false)}
                  title="Close"
                  aria-label="Close the panel"
                >
                  <span aria-hidden="true">×</span>
                </button>
                <button
                  type="button"
                  className="a2-lamp is-min"
                  onClick={() => setOpen(false)}
                  title="Minimize"
                  aria-label="Minimize the panel — the thread is kept"
                >
                  <span aria-hidden="true">–</span>
                </button>
                <button
                  type="button"
                  className="a2-lamp is-max"
                  onClick={() => setMaxed((prior) => !prior)}
                  title={maxed ? 'Restore' : 'Maximize'}
                  aria-label={maxed ? 'Restore the panel width' : 'Maximize the panel'}
                  aria-pressed={maxed}
                >
                  {/* the panel grows leftward, so the arrow points that way */}
                  <span aria-hidden="true">{maxed ? '»' : '«'}</span>
                </button>
              </span>
              portfolio agent: live
            </span>
            <div className="a2-bar-right">
              {quota && (
                <span className={spent ? 'a2-quota is-spent' : 'a2-quota'}>
                  {quota.remaining}/{quota.limit} today
                </span>
              )}
              {started && (
                <button type="button" className="a2-reset" onClick={reset}>
                  clear
                </button>
              )}
            </div>
          </div>

          <div className="a2-panel-scroll" ref={scrollRef}>
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
          </div>

          <div className="a2-panel-foot">
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
                placeholder={
                  spent
                    ? `Out of questions until 00:00 UTC — ${DAILY_LIMIT} a day per visitor.`
                    : 'Ask about the work, the writing, the background…'
                }
                maxLength={400}
                disabled={pending !== null || spent}
                aria-label="Ask the portfolio agent"
              />
              <Button
                variant="amber"
                type="submit"
                className="a2-send"
                disabled={pending !== null || spent}
              >
                <span>{pending ? 'Asking…' : 'Ask'}</span>
                <GlyphIcon id="i-send" />
              </Button>
            </form>

            {!started && !pending && (
              <div className="a2-starters">
                {QUICK_STARTERS.map((prompt) => (
                  <button
                    type="button"
                    className="a2-action"
                    key={prompt}
                    onClick={() => ask(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
