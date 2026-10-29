import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'editorial-ui';
import { Renderer } from './a2ui/Renderer';
import { AskContext } from './a2ui/components';
import { QUICK_STARTERS } from './a2ui/welcome';
import { stateFrom, type A2uiState } from './a2ui/model';
import type {
  A2uiError,
  A2uiMessage,
  A2uiResponse,
  HistoryTurn,
  TurnMeta,
} from '../lib/a2ui/types';

const MAX_HISTORY = 6;
const DAILY_LIMIT = 5;

interface Turn {
  key: number;
  question: string;
  summary: string;
  messages: A2uiMessage[];
  state: A2uiState;
  meta: TurnMeta;
}

type RequestState =
  | { kind: 'idle' }
  | { kind: 'pending'; key: number; question: string }
  | { kind: 'failed'; key: number; question: string; message: string; retryable: boolean };

interface ActiveRequest {
  key: number;
  controller: AbortController;
}

function formatRetry(seconds: number): string {
  if (seconds < 90) return `${seconds}s`;
  if (seconds < 5400) return `${Math.round(seconds / 60)} min`;
  return `${Math.round(seconds / 3600)} h`;
}

function historyFrom(turns: Turn[]): HistoryTurn[] {
  return turns
    .flatMap((turn): HistoryTurn[] => [
      { role: 'user', text: turn.question },
      { role: 'agent', text: turn.summary },
    ])
    .slice(-MAX_HISTORY);
}

function cue(name: 'ask' | 'surface' | 'error' | 'open' | 'close', count?: number) {
  document.dispatchEvent(new CustomEvent('reel:cue', { detail: { name, count } }));
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

export default function A2UIPlayground() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [request, setRequest] = useState<RequestState>({ kind: 'idle' });
  const [open, setOpen] = useState(false);
  const [maxed, setMaxed] = useState(false);
  const [unreadReply, setUnreadReply] = useState(false);
  const [quota, setQuota] = useState<A2uiResponse['quota'] | null>(null);
  const activeRequest = useRef<ActiveRequest | null>(null);
  const nextKey = useRef(1);
  const pendingScrollTop = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const started = turns.length > 0 || request.kind !== 'idle';
  const pending = request.kind === 'pending';
  const spent = quota !== null && quota.remaining <= 0;
  const latestKey = request.kind === 'idle' ? turns.at(-1)?.key : request.key;

  const ask = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || question.length > 400 || activeRequest.current || spent) return;

      const active: ActiveRequest = { key: nextKey.current++, controller: new AbortController() };
      activeRequest.current = active;
      setUnreadReply(false);
      setRequest({ kind: 'pending', key: active.key, question });
      cue('ask');

      const fail = (message: string, retryable: boolean) => {
        setRequest({ kind: 'failed', key: active.key, question, message, retryable });
        setQuota((current) => (current?.remaining === 0 ? current : null));
        setDraft((current) => (current.trim() ? current : question));
        cue('error');
      };

      try {
        const res = await fetch('/api/a2ui', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ message: question, history: historyFrom(turns) }),
          signal: active.controller.signal,
        });

        if (res.ok) {
          const body = (await res.json()) as A2uiResponse;
          if (activeRequest.current !== active) return;
          const state = stateFrom(body.messages);
          if (body.quota) setQuota(body.quota);
          setTurns((prior) => [
            ...prior,
            {
              key: active.key,
              question,
              summary: body.summary,
              messages: body.messages,
              state,
              meta: body.meta,
            },
          ]);
          setRequest({ kind: 'idle' });
          setDraft((current) => (current.trim() === question ? '' : current));
          cue('surface', body.messages.length);
          return;
        }

        const body = (await res.json().catch(() => ({}))) as A2uiError;
        if (activeRequest.current !== active) return;
        if (res.status === 429) {
          const retryAfter = body.retryAfter ?? 60;
          if (retryAfter > 60) {
            setQuota({ remaining: 0, limit: DAILY_LIMIT });
            fail(
              `Today's ${DAILY_LIMIT} questions have been used. The allowance resets at 00:00 UTC, about ${formatRetry(retryAfter)} from now. You can still explore the work and blog.`,
              false,
            );
          } else {
            fail(
              `A few questions arrived too quickly. Please wait ${formatRetry(retryAfter)} before asking again.`,
              false,
            );
          }
          return;
        }
        if (res.status === 503) {
          fail(
            body.error === 'daily-budget-exhausted'
              ? 'The agent has reached its daily limit. Please return after 00:00 UTC, or explore the work and blog.'
              : 'The agent is unavailable right now. You can keep this conversation open and try later.',
            false,
          );
          return;
        }
        fail(
          "The agent couldn't finish this reply. You can retry this question or edit it below.",
          true,
        );
      } catch {
        if (activeRequest.current !== active) return;
        fail(
          'The reply could not be reached. Check your connection, then retry your question.',
          true,
        );
      } finally {
        if (activeRequest.current === active) activeRequest.current = null;
      }
    },
    [spent, turns],
  );

  const reset = useCallback(() => {
    const active = activeRequest.current;
    activeRequest.current = null;
    active?.controller.abort();
    if (active) {
      setQuota((current) => (current?.remaining === 0 ? current : null));
      cue('error');
    }
    setTurns([]);
    setRequest({ kind: 'idle' });
    setDraft('');
    setUnreadReply(false);
    pendingScrollTop.current = null;
    composerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(
    () => () => {
      const active = activeRequest.current;
      activeRequest.current = null;
      active?.controller.abort();
    },
    [],
  );

  useEffect(() => {
    const root = document.documentElement;
    const take = () => {
      root.removeAttribute('data-playground-want');
      setOpen(true);
    };
    if (root.hasAttribute('data-playground-want')) take();
    root.setAttribute('data-playground-ready', '');
    document.addEventListener('playground:open', take);
    return () => {
      document.removeEventListener('playground:open', take);
      root.removeAttribute('data-playground-ready');
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cue('open');
      if (window.matchMedia('(min-width: 700px)').matches) {
        composerRef.current?.focus({ preventScroll: true });
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prior = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = prior;
    };
  }, [open]);

  const readLatest = useCallback(() => {
    const scroller = scrollRef.current;
    const article = latestRef.current;
    if (!dialogRef.current?.open || !scroller || !article) return;
    setUnreadReply(false);
    const top =
      article.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop -
      20;
    scroller.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (request.kind === 'pending') {
      readLatest();
      pendingScrollTop.current = scroller?.scrollTop ?? null;
      return;
    }
    if (scroller && pendingScrollTop.current !== null) {
      if (dialogRef.current?.open && Math.abs(scroller.scrollTop - pendingScrollTop.current) < 48) {
        readLatest();
      } else if (request.kind === 'idle') {
        setUnreadReply(true);
      }
    }
    pendingScrollTop.current = null;
  }, [latestKey, request.kind, readLatest]);

  useEffect(() => {
    if (
      open &&
      started &&
      (document.activeElement === document.body || document.activeElement === dialogRef.current)
    ) {
      latestRef.current?.focus({ preventScroll: true });
    }
  }, [open, started, latestKey, request.kind]);

  return (
    <>
      <div className="console a2-launch">
        <div className="console-bar">
          <span className="who">
            <span className="lights" aria-hidden="true">
              <i></i>
              <i></i>
              <i></i>
            </span>
            portfolio agent
          </span>
          {quota && (
            <span className="a2-launch-count">
              {quota.remaining} of {quota.limit} left today
            </span>
          )}
        </div>
        <div className="console-body a2-launch-body">
          <p className="a2-launch-title">Explore the work.</p>
          <p className="a2-launch-lede">Ask about my projects, experience and writing.</p>
          <div className="a2-launch-row">
            <Button variant="amber" onClick={() => setOpen(true)}>
              <GlyphIcon id={started ? 'i-arrow-r' : 'i-play'} />
              <span>{started ? 'Continue our conversation' : 'Ask about my work'}</span>
            </Button>
            <span className="a2-launch-hint">{DAILY_LIMIT} live questions a day per IP</span>
          </div>
        </div>
      </div>

      <dialog
        className={maxed ? 'a2-drawer is-max' : 'a2-drawer'}
        ref={dialogRef}
        aria-labelledby="a2-dialog-title"
        onClose={() => {
          setOpen(false);
          cue('close');
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className={started ? 'a2-panel' : 'a2-panel is-empty'}>
          <div className="console-bar a2-panel-bar">
            <span className="who" id="a2-dialog-title">
              portfolio agent
            </span>
            <div className="a2-bar-right">
              <button
                type="button"
                className="a2-window-button a2-expand"
                onClick={() => setMaxed((prior) => !prior)}
                aria-pressed={maxed}
              >
                {maxed ? 'Restore' : 'Expand'}
              </button>
              <button type="button" className="a2-window-button" onClick={() => setOpen(false)}>
                <span aria-hidden="true">×</span> Close
              </button>
            </div>
          </div>

          <div className="a2-panel-scroll" ref={scrollRef}>
            {!started && (
              <div className="a2-welcome">
                <p className="a2-welcome-eyebrow">The work, in conversation</p>
                <h2>What would you like to know?</h2>
                <p>
                  Ask about Tomas’s projects, experience or ideas. Replies draw from this site, with
                  cards and diagrams when they help.
                </p>
                <div className="a2-welcome-questions" aria-label="Questions to start with">
                  {QUICK_STARTERS.map((prompt) => (
                    <button
                      type="button"
                      className="a2-action"
                      key={prompt}
                      disabled={spent}
                      onClick={() => void ask(prompt)}
                    >
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <AskContext.Provider value={(prompt) => void ask(prompt)}>
              <div className="a2-thread">
                {turns.map((turn) => (
                  <article
                    className="a2-turn"
                    tabIndex={-1}
                    key={turn.key}
                    ref={turn.key === latestKey ? latestRef : undefined}
                  >
                    <p className="a2-ask">
                      <span className="car" aria-hidden="true">
                        ❯
                      </span>
                      <span>{turn.question}</span>
                    </p>
                    <Renderer state={turn.state} />
                    <details className="a2-peek a2-reply-details">
                      <summary>About this reply</summary>
                      <dl className="a2-reply-facts">
                        <div>
                          <dt>Model</dt>
                          <dd>{turn.meta.model}</dd>
                        </div>
                        <div>
                          <dt>Response time</dt>
                          <dd>{turn.meta.latency}</dd>
                        </div>
                        <div>
                          <dt>Tokens</dt>
                          <dd>
                            {turn.meta.inputTokens} in / {turn.meta.outputTokens} out
                          </dd>
                        </div>
                        <div>
                          <dt>Cached tokens</dt>
                          <dd>{turn.meta.cachedTokens}</dd>
                        </div>
                        <div>
                          <dt>Estimated cost</dt>
                          <dd>{turn.meta.cost}</dd>
                        </div>
                        <div>
                          <dt>Components</dt>
                          <dd>{turn.meta.components}</dd>
                        </div>
                      </dl>
                      <details className="a2-peek">
                        <summary>A2UI messages</summary>
                        <pre>{JSON.stringify(turn.messages, null, 2)}</pre>
                      </details>
                    </details>
                  </article>
                ))}
                {request.kind !== 'idle' && (
                  <article
                    className={`a2-turn is-${request.kind}`}
                    tabIndex={-1}
                    key={request.key}
                    ref={latestRef}
                  >
                    <p className="a2-ask">
                      <span className="car" aria-hidden="true">
                        ❯
                      </span>
                      <span>{request.question}</span>
                    </p>
                    {request.kind === 'pending' ? (
                      <div className="a2-waiting">
                        <p className="a2-composing">Preparing your reply…</p>
                        <p>You can keep reading while the agent works.</p>
                      </div>
                    ) : (
                      <div className="a2-failure">
                        <p role="alert">{request.message}</p>
                        {request.retryable && (
                          <p className="a2-retry-note">A retry may use another daily question.</p>
                        )}
                        <div className="a2-failure-actions">
                          {request.retryable && !spent && (
                            <button
                              type="button"
                              className="a2-window-button"
                              onClick={() => void ask(request.question)}
                            >
                              Retry question
                            </button>
                          )}
                          {!spent && (
                            <button
                              type="button"
                              className="a2-reset"
                              onClick={() => {
                                setDraft(request.question);
                                composerRef.current?.focus({ preventScroll: true });
                              }}
                            >
                              Edit question
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                )}
              </div>
            </AskContext.Provider>
          </div>

          <div className="a2-panel-foot">
            <form
              className="a2-composer"
              onSubmit={(event) => {
                event.preventDefault();
                void ask(draft);
              }}
            >
              <label className="a2-composer-label" htmlFor="a2-question">
                {started ? 'Keep the conversation going' : 'Your question'}
              </label>
              <div className="a2-composer-entry">
                <textarea
                  id="a2-question"
                  ref={composerRef}
                  className="a2-input"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      void ask(draft);
                    }
                  }}
                  placeholder={
                    spent ? 'Questions reset at 00:00 UTC' : 'Ask anything about the work…'
                  }
                  maxLength={400}
                  rows={2}
                  disabled={spent}
                  aria-describedby="a2-allowance"
                />
                <Button
                  variant="amber"
                  type="submit"
                  className="a2-send"
                  disabled={pending || spent || !draft.trim()}
                >
                  <span>{pending ? 'Asking…' : 'Ask'}</span>
                  <GlyphIcon id="i-send" />
                </Button>
              </div>
            </form>
            <div className="a2-footnote">
              <p id="a2-allowance">
                {quota
                  ? `${quota.remaining} of ${quota.limit} questions left today`
                  : `${DAILY_LIMIT} questions a day per IP`}{' '}
                · Resets 00:00 UTC
              </p>
              {started && (
                <div className="a2-footnote-actions">
                  <button
                    type="button"
                    className="a2-reset a2-latest"
                    data-unread={unreadReply || undefined}
                    onClick={readLatest}
                  >
                    {unreadReply
                      ? 'New reply ready ↑'
                      : `Latest ${request.kind === 'idle' ? 'reply' : 'question'} ↑`}
                  </button>
                  <button type="button" className="a2-reset" onClick={reset}>
                    Start over
                  </button>
                </div>
              )}
            </div>
            <p className="a2-sr-only" role="status">
              {pending
                ? 'Preparing your reply.'
                : request.kind === 'failed'
                  ? 'Your question needs attention.'
                  : turns.length
                    ? 'Reply ready. Use Latest reply to return to its beginning.'
                    : ''}
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
