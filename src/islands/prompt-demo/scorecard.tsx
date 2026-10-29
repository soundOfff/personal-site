/**
 * Scorecard component adapted from /Users/User/Tomi/gen-ui/60-seconds/components/scorecard.tsx
 * Shows judge panel results for the demo.
 */

import type { CaseStudy, JudgeResult, PanelVerdict } from './types';

const RUBRIC_CRITERIA = [
  { key: 'requirement', label: 'Requirement' },
  { key: 'uiQuality', label: 'UI Quality' },
  { key: 'completeness', label: 'Completeness' },
  { key: 'tokenEfficiency', label: 'Efficiency' },
  { key: 'innovation', label: 'Innovation' },
];

function prettyModel(model: string): string {
  if (model.startsWith('gpt-4o')) return 'GPT-4o';
  if (model.startsWith('claude-sonnet')) return 'Claude Sonnet 3.5';
  if (model.startsWith('gemini')) return 'Gemini 1.5 Pro';
  return model;
}

export function ScoreCard({
  verdict,
  caseStudy,
}: {
  verdict: PanelVerdict | null;
  caseStudy: CaseStudy;
}) {
  if (!verdict) return null;

  const { results, panelScore, participating } = verdict;

  return (
    <div className="pb-scorecard">
      <div className="pb-panel-summary">
        <div className="pb-panel-score">
          <span className="pb-panel-score-num">{panelScore ?? '—'}</span>
          <span className="pb-panel-score-max">/ 100</span>
        </div>
        <div className="pb-panel-meta">
          <strong>Sample panel score</strong>
          <span>
            {participating > 0
              ? `Mean of ${participating} judge${participating === 1 ? '' : 's'} · ${caseStudy.title}`
              : 'All judges abstained'}
          </span>
        </div>
      </div>

      <div className="pb-judges">
        {results.map((r, i) => (
          <JudgeCard key={i} result={r} caseStudy={caseStudy} />
        ))}
      </div>
    </div>
  );
}

function JudgeCard({ result, caseStudy }: { result: JudgeResult; caseStudy: CaseStudy }) {
  const name = prettyModel(result.model);

  if (!result.ok) {
    return (
      <div className="pb-judge pb-judge-abstain">
        <div className="pb-judge-head">
          <strong>{name}</strong>
          <span className="pb-judge-total pb-abstain-tag">abstained</span>
        </div>
        <p className="pb-judge-headline">{result.error}</p>
      </div>
    );
  }

  const { score } = result;

  return (
    <div className="pb-judge">
      <div className="pb-judge-head">
        <strong>{name}</strong>
        <span className="pb-judge-total">{score.total}</span>
      </div>
      <p className="pb-judge-headline">{score.headline}</p>

      <div className="pb-criteria">
        {RUBRIC_CRITERIA.map((c) => {
          const raw = score.scores[c.key] ?? 0;
          return (
            <div
              key={c.key}
              className="pb-criterion"
              title={`${c.label} — weight ${caseStudy.rubric[c.key]}`}
            >
              <span className="pb-criterion-label">{c.label}</span>
              <span className="pb-criterion-bar">
                <span className="pb-criterion-fill" style={{ width: `${(raw / 10) * 100}%` }} />
              </span>
              <span className="pb-criterion-num">{raw}</span>
            </div>
          );
        })}
      </div>

      {(score.strengths.length > 0 || score.improvements.length > 0) && (
        <div className="pb-judge-notes">
          {score.strengths.length > 0 && (
            <div className="pb-notes pb-notes-plus">
              <span className="pb-notes-head">Strengths</span>
              <ul>
                {score.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {score.improvements.length > 0 && (
            <div className="pb-notes pb-notes-minus">
              <span className="pb-notes-head">To improve</span>
              <ul>
                {score.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
