import { useState, useMemo } from 'react';
import Plot from '../shared/PlotWrapper';
import { ParamSlider } from '../shared/ParamSlider';
import { InterpretationBox } from '../shared/InterpretationBox';
import { FormulaDisplay } from '../shared/FormulaDisplay';
import {
  generateScoreLineData,
  computeEfficientLevels,
  computeThresholds,
  optimalLevel,
  DEFAULT_LEVELS,
} from '../../lib/scoreLine';
import type { ScoreLevel } from '../../lib/types';

const COLORS = ['#6b7280', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

export function ScoreLineGeometry() {
  const [levels, setLevels] = useState<ScoreLevel[]>(DEFAULT_LEVELS);
  const [lambda, setLambda] = useState(1.5);

  const updateLevel = (idx: number, field: 'G' | 'Psi', value: number) => {
    setLevels(prev => prev.map((l, i) =>
      i === idx ? { ...l, [field]: value } : l
    ));
  };

  const scoreData = useMemo(() => generateScoreLineData(levels, 5, 200), [levels]);
  const efficientIdx = useMemo(() => computeEfficientLevels(levels), [levels]);
  const thresholds = useMemo(() => computeThresholds(levels, efficientIdx), [levels, efficientIdx]);
  const currentOptimal = useMemo(() => optimalLevel(levels, lambda), [levels, lambda]);
  const efficientSet = useMemo(() => new Set(efficientIdx), [efficientIdx]);

  // Compute y-range for lambda marker line
  const yRange = useMemo(() => {
    const allScores = scoreData.scores.flat();
    const mn = Math.min(...allScores, 0);
    const mx = Math.max(...allScores);
    return [mn - 0.05, mx + 0.05];
  }, [scoreData]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Multi-Level Signal Design
        </h2>
        <p className="text-gray-600 mb-3">
          Instead of a binary signal/silence choice, the planner can offer an <strong>ordered menu</strong> of
          signal intensities. Each level has a gain (G) and a displacement cost (Ψ).
        </p>
        <div className="bg-gray-50 rounded-lg p-3 mb-2">
          <FormulaDisplay
            tex="S_\ell(\lambda) = G_\ell - \lambda \cdot \Psi_\ell"
            displayMode
          />
        </div>
        <p className="text-xs text-gray-500">
          The <strong>score</strong> of each level is its gain minus λ times its displacement cost.
          The shadow price λ captures how much the planner penalizes displacement risk.
          At any λ, the optimal level is the one with the highest score.
          As λ increases, the planner becomes more conservative, shifting toward lower-intensity signals or silence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Level controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Signal Menu</h3>
          <p className="text-xs text-gray-500 mb-3">
            Adjust the gain (G) and displacement cost (Ψ) of each signal level.
            Blue-highlighted levels are <strong>efficient</strong> (on the concave hull).
          </p>

          {levels.map((level, i) => (
            <div key={i} className={`mb-3 p-3 rounded-lg border ${
              efficientSet.has(i) ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[i] }}
                />
                <span className="text-sm font-medium">{level.label}</span>
                {!efficientSet.has(i) && i > 0 && (
                  <span className="text-xs text-gray-400 ml-auto" title="Never optimal for any λ">dominated</span>
                )}
                {i === currentOptimal && (
                  <span className="text-xs font-bold text-primary-600 ml-auto">
                    OPTIMAL
                  </span>
                )}
              </div>
              {i > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-6 text-gray-500" title="Gain: immediate quality improvement">G</span>
                    <input
                      type="range" min={0} max={1} step={0.01}
                      value={level.G}
                      onChange={e => updateLevel(i, 'G', parseFloat(e.target.value))}
                      className="flex-1 h-1.5 accent-primary-600"
                    />
                    <span className="text-xs font-mono w-10">{level.G.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-6 text-gray-500" title="Displacement cost: efficacy degradation">Ψ</span>
                    <input
                      type="range" min={0} max={1} step={0.01}
                      value={level.Psi}
                      onChange={e => updateLevel(i, 'Psi', parseFloat(e.target.value))}
                      className="flex-1 h-1.5 accent-primary-600"
                    />
                    <span className="text-xs font-mono w-10">{level.Psi.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="mt-4">
            <ParamSlider
              label="Shadow Price"
              symbol="λ"
              value={lambda}
              min={0} max={5} step={0.01}
              onChange={setLambda}
              tooltip="The cost per unit of displacement. Higher λ = more conservative planner."
            />
          </div>

          {thresholds.length > 0 && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <div className="font-semibold mb-1">Switching thresholds:</div>
              {thresholds.map((t, i) => (
                <div key={i} className="font-mono">
                  λ = {t.lambda.toFixed(2)}: {levels[t.fromLevel].label} → {levels[t.toLevel].label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Score lines plot */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Score Lines</h3>
          <p className="text-xs text-gray-500 mb-2">
            Each line shows one level's score as λ varies. Solid = efficient, dashed = dominated.
          </p>

          <Plot
            data={[
              ...levels.map((level, i) => ({
                x: scoreData.lambdas,
                y: scoreData.scores[i],
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: level.label,
                line: {
                  color: COLORS[i],
                  width: efficientSet.has(i) ? 2.5 : 1,
                  dash: efficientSet.has(i) ? 'solid' as const : 'dash' as const,
                },
              })),
              {
                x: [lambda, lambda],
                y: yRange,
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: `λ = ${lambda.toFixed(2)}`,
                line: { color: '#6b7280', width: 1, dash: 'dot' as const },
                showlegend: false,
              },
            ]}
            layout={{
              xaxis: { title: 'λ (shadow price)', range: [0, 5] },
              yaxis: { title: 'Score S(λ)', zeroline: true, zerolinewidth: 1 },
              margin: { l: 50, r: 20, t: 10, b: 45 },
              height: 380,
              legend: { x: 0.55, y: 1, font: { size: 10 } },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />

          <InterpretationBox variant="info">
            At λ = {lambda.toFixed(2)}, the optimal signal level is{' '}
            <strong>{levels[currentOptimal].label}</strong>
            {currentOptimal === 0
              ? '. Silence is optimal — displacement cost outweighs any gain.'
              : `. Net score: ${(levels[currentOptimal].G - lambda * levels[currentOptimal].Psi).toFixed(3)}.`
            }
            {' '}Move the λ slider to see how the optimal level shifts.
          </InterpretationBox>
        </div>

        {/* (Psi, G) plane */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">(Ψ, G) Plane</h3>
          <p className="text-xs text-gray-500 mb-2">
            The upper concave envelope (blue line) connects efficient levels.
            Points below the envelope are dominated.
          </p>

          <Plot
            data={[
              {
                x: levels.map(l => l.Psi),
                y: levels.map(l => l.G),
                type: 'scatter',
                mode: 'markers+text',
                text: levels.map(l => l.label),
                textposition: 'top center' as const,
                textfont: { size: 9 },
                marker: {
                  size: levels.map((_, i) => efficientSet.has(i) ? 12 : 8),
                  color: levels.map((_, i) => efficientSet.has(i) ? COLORS[i] : 'white'),
                  line: { width: 2, color: levels.map((_, i) => COLORS[i]) },
                  symbol: levels.map((_, i) => efficientSet.has(i) ? 'circle' : 'circle-open'),
                },
                name: 'Levels',
                showlegend: false,
              },
              {
                x: efficientIdx.map(i => levels[i].Psi),
                y: efficientIdx.map(i => levels[i].G),
                type: 'scatter',
                mode: 'lines',
                line: { color: '#1e3a8a', width: 2 },
                name: 'Concave hull',
              },
            ]}
            layout={{
              xaxis: { title: 'Ψ (displacement cost)', range: [-0.05, Math.max(0.7, ...levels.map(l => l.Psi)) + 0.1] },
              yaxis: { title: 'G (gain)', range: [-0.05, Math.max(0.7, ...levels.map(l => l.G)) + 0.1] },
              margin: { l: 50, r: 20, t: 10, b: 45 },
              height: 350,
              showlegend: false,
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />

          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p><strong>Filled circles</strong> = efficient levels (on the concave envelope). Only these can be optimal.</p>
            <p><strong>Open circles</strong> = dominated levels. They are never the best choice at any λ.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
