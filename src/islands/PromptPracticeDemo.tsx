/**
 * Portable interactive demo of "60 Seconds to Prompt" project
 *
 * Source: /Users/User/Tomi/gen-ui/60-seconds
 *
 * Flow: Choose case → Read brief → Type prompt → Replay sample → View UI + judges
 * Displays prerecorded model output only (no actual evaluation).
 */

import { useState } from 'react';
import { DEMO_CASES, getDemoCase, getDemoBlocks, getDemoVerdict } from './prompt-demo/fixtures';
import { RenderedUI } from './prompt-demo/blocks';
import { ScoreCard } from './prompt-demo/scorecard';
import './prompt-demo/styles.css';

export default function PromptPracticeDemo() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(false);

  const currentCase = selectedCaseId ? getDemoCase(selectedCaseId) : null;
  const blocks = showResult && currentCase ? getDemoBlocks(currentCase.id) : [];
  const verdict = showResult && currentCase ? getDemoVerdict(currentCase.id) : null;

  const handleReplaySample = () => {
    if (!currentCase) return;
    setShowResult(true);
  };

  const handleReset = () => {
    setSelectedCaseId('');
    setUserPrompt('');
    setShowResult(false);
  };

  return (
    <div className="prompt-demo">
      <div className="demo-banner">
        Interactive sample · Fixed model responses and sample scores. Your prompt is not evaluated.
      </div>

      <div className="demo-controls">
        <label>
          <span>Choose a case study</span>
          <select
            value={selectedCaseId}
            onChange={(e) => {
              setSelectedCaseId(e.target.value);
              setUserPrompt('');
              setShowResult(false);
            }}
          >
            <option value="">Select a case...</option>
            {DEMO_CASES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.difficulty})
              </option>
            ))}
          </select>
        </label>

        {currentCase && (
          <>
            <div className="brief-section">
              <h3>Brief</h3>
              <p>{currentCase.brief}</p>
              <h3>Requirements</h3>
              <ul>
                {currentCase.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>

            <label>
              <span>Your prompt (practice only)</span>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Type a prompt that describes the UI you want to build..."
              />
            </label>

            <div className="demo-actions">
              <button className="pb-btn pb-btn-secondary" onClick={handleReset}>
                Reset
              </button>
              <button
                className="pb-btn pb-btn-primary"
                onClick={handleReplaySample}
                disabled={!currentCase}
              >
                Replay sample output
              </button>
            </div>
          </>
        )}
      </div>

      {showResult && currentCase && (
        <>
          <div className="pb-canvas-frame">
            <div className="pb-canvas-titlebar">
              <div className="pb-dot" />
              <div className="pb-dot" />
              <div className="pb-dot" />
              <span className="pb-canvas-title">{currentCase.title}</span>
            </div>
            <div className="pb-canvas">
              {blocks.length > 0 ? (
                <RenderedUI blocks={blocks} />
              ) : (
                <div className="pb-empty-canvas">No output to display</div>
              )}
            </div>
          </div>

          {verdict && <ScoreCard verdict={verdict} caseStudy={currentCase} />}
        </>
      )}

      {!selectedCaseId && (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--muted)',
            padding: '40px 0',
            fontSize: '14px',
          }}
        >
          Select a case study above to begin the demo.
        </div>
      )}
    </div>
  );
}
