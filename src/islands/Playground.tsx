import { useCallback, useRef, useState } from 'react';
import { SegmentedControl, Button, Alert } from 'editorial-ui';
import { FIXTURES } from '../lib/router/fixtures';
import type { RouteError, RouteRequest, RouteResult } from '../lib/router/types';

type Mode = 'demo' | 'live';

const DEMO_DELAY_MS = 420;

/** Seconds → a human retry hint; daily caps reset hours out, not seconds. */
function formatRetry(seconds: number): string {
  if (seconds < 90) return `${seconds}s`;
  if (seconds < 5400) return `${Math.round(seconds / 60)} min`;
  return `${Math.round(seconds / 3600)} h`;
}

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <use href="#i-refresh"></use>
    </svg>
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

export default function Playground() {
  const [current, setCurrent] = useState(FIXTURES[0].key);
  const [mode, setMode] = useState<Mode>('demo');
  const [routing, setRouting] = useState(false);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fixture = FIXTURES.find((f) => f.key === current) ?? FIXTURES[0];

  const finish = useCallback((r: RouteResult | null, err: string | null) => {
    setResult(r);
    setError(err);
    setRouting(false);
  }, []);

  const routeDemo = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => finish({ ...fixture, mode: 'demo' }, null), DEMO_DELAY_MS);
  }, [fixture, finish]);

  const routeLive = useCallback(async () => {
    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: fixture.key } satisfies RouteRequest),
      });

      if (res.ok) {
        finish((await res.json()) as RouteResult, null);
        return;
      }

      const body = (await res.json().catch(() => ({}))) as RouteError;
      if (res.status === 429) {
        finish(
          null,
          `Rate limit reached. Try again in ${formatRetry(body.retryAfter ?? 60)}. Demo mode is always free.`,
        );
      } else if (res.status === 503) {
        finish(
          { ...fixture, mode: 'demo' },
          body.error === 'daily-budget-exhausted'
            ? "Live mode's shared daily budget is spent; showing the cached demo route. Resets at 00:00 UTC."
            : "Live mode isn't enabled on this deploy yet; showing the cached demo route instead.",
        );
      } else {
        finish(null, 'The router hit an upstream error. Try demo mode, or try again.');
      }
    } catch {
      finish(null, 'Network error reaching the router. Demo mode works offline.');
    }
  }, [fixture, finish]);

  const route = useCallback(() => {
    setRouting(true);
    setError(null);
    if (mode === 'live') void routeLive();
    else routeDemo();
  }, [mode, routeLive, routeDemo]);

  const hasResult = result !== null || error !== null;

  return (
    <div className="console" data-pg>
      <div className="console-bar">
        <span className="who">
          <span className="lights" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </span>
          router: {mode}
        </span>
        <SegmentedControl
          className="seg-mono"
          items={[
            { id: 'demo', label: 'demo' },
            { id: 'live', label: 'live' },
          ]}
          activeId={mode}
          onChange={(id) => setMode(id as Mode)}
          aria-label="Router mode"
        />
      </div>

      <div className="console-body">
        <div className="cmds" role="listbox" aria-label="Prompts">
          {FIXTURES.map((f) => {
            const active = f.key === current;
            return (
              <button
                key={f.key}
                type="button"
                className={`cmd${active ? ' is-active' : ''}`}
                role="option"
                aria-selected={active}
                onClick={() => setCurrent(f.key)}
              >
                <span className="car" aria-hidden="true">
                  ❯
                </span>
                <span>{f.prompt}</span>
              </button>
            );
          })}
        </div>

        <div className="console-run">
          <div className="run-info">
            <span className="cap">
              {mode === 'live' ? 'real inference · capped' : 'cached at edge · free'}
            </span>
            {!hasResult && <span className="console-empty">select a prompt and route it</span>}
          </div>
          <Button
            variant="amber"
            type="button"
            className={`pg-route${routing ? ' is-routing' : ''}`}
            disabled={routing}
            onClick={route}
          >
            <span>{routing ? 'Routing…' : 'Route'}</span>
            <RefreshIcon />
          </Button>
        </div>

        {mode === 'live' && (
          <Alert variant="info" compact className="live-note">
            Live mode runs real inference behind a serverless function; keys stay server-side,
            capped at 5 routes/min and 20/day.
          </Alert>
        )}

        {hasResult && (
          <div className="console-out" data-pg-result>
            {result && (
              <>
                <div className="statusline">
                  <span className="seg ok">● routed</span>
                  <span className="sep">·</span>
                  <span className={`seg chip-tone is-${result.tone}`}>
                    <b>{result.model}</b>
                  </span>
                  <span className="sep">·</span>
                  <span className="seg">{result.provider}</span>
                  <span className="sep">·</span>
                  <span className="seg">
                    <b>{result.latency}</b>
                  </span>
                  <span className="sep">·</span>
                  <span className="seg">
                    cost <b>{result.cost}</b>
                  </span>
                </div>
                <p className="whyline">
                  <GlyphIcon id="i-bulb" />
                  <span>{result.why}</span>
                </p>
                <pre className={`reply${result.response.includes('\n') ? ' is-block' : ''}`}>
                  {result.response}
                </pre>
              </>
            )}
            {error && (
              <p className="console-error">
                <GlyphIcon id="i-info" />
                <span>{error}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
