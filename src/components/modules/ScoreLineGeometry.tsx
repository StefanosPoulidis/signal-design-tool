import { useState, useMemo } from 'react';
import Plot from '../shared/PlotWrapper';
import { ParamSlider } from '../shared/ParamSlider';
import { InterpretationBox } from '../shared/InterpretationBox';
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

  const efficientSet = new Set(efficientIdx);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Multi-Level Signal Design
        </h2>
        <p className="text-gray-600">
          Explore the score-line geometry for ordered signal menus.
          Each level has a gain (G) and displacement cost (Ψ).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Level controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Signal Levels</h3>

          {levels.map((level, i) => (
            <div key={i} className={`mb-4 p-3 rounded-lg border ${
              efficientSet.has(i) ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[i] }}
                />
                <span className="text-sm font-medium">{level.label}</span>
                {!efficientSet.has(i) && i > 0 && (
                  <span className="text-xs text-gray-400 ml-auto">dominated</span>
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
                    <span className="text-xs w-6">G</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={level.G}
                      onChange={e => updateLevel(i, 'G', parseFloat(e.target.value))}
                      className="flex-1 h-1.5 accent-primary-600"
                    />
                    <span className="text-xs font-mono w-10">{level.G.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-6">Ψ</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
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
              min={0}
              max={5}
              step={0.01}
              onChange={setLambda}
              tooltip="Cost of displacement risk. Higher = prefer lower intensity."
            />
          </div>

          {thresholds.length > 0 && (
            <div className="mt-3 text-xs text-gray-500">
              <div className="font-semibold mb-1">Threshold λ values:</div>
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
          <h3 className="font-semibold text-gray-900 mb-3">
            Score Lines: S(λ) = G - λ·Ψ
          </h3>

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
              // Current lambda marker
              {
                x: [lambda, lambda],
                y: [-1, 1],
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: `λ = ${lambda.toFixed(2)}`,
                line: { color: '#6b7280', width: 1, dash: 'dot' as const },
                showlegend: false,
              },
            ]}
            layout={{
              xaxis: { title: 'λ (shadow price)', range: [0, 5] },
              yaxis: { title: 'Score S(λ)', zeroline: true },
              margin: { l: 50, r: 20, t: 10, b: 45 },
              height: 380,
              legend: { x: 0.6, y: 1, font: { size: 10 } },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />

          <InterpretationBox variant="info">
            At λ = {lambda.toFixed(2)}, the optimal signal level is{' '}
            <strong>{levels[currentOptimal].label}</strong>.
            {currentOptimal === 0
              ? ' Silence is optimal: the displacement cost outweighs any gain.'
              : ` This level maximizes the net score G - λ·Ψ = ${(levels[currentOptimal].G - lambda * levels[currentOptimal].Psi).toFixed(3)}.`
            }
          </InterpretationBox>
        </div>

        {/* (Psi, G) plane */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            (Ψ, G) Plane &amp; Concave Hull
          </h3>

          <Plot
            data={[
              // All points
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
                  line: {
                    width: 2,
                    color: levels.map((_, i) => COLORS[i]),
                  },
                  symbol: levels.map((_, i) => efficientSet.has(i) ? 'circle' : 'circle-open'),
                },
                name: 'Levels',
                showlegend: false,
              },
              // Concave hull line
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
              xaxis: { title: 'Ψ (displacement)', range: [-0.05, 0.7] },
              yaxis: { title: 'G (gain)', range: [-0.05, 0.7] },
              margin: { l: 50, r: 20, t: 10, b: 45 },
              height: 350,
              showlegend: false,
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />

          <p className="text-xs text-gray-500 mt-2">
            Filled circles = efficient levels (on the upper concave envelope).
            Open circles = dominated levels (never optimal for any λ).
          </p>
        </div>
      </div>
    </div>
  );
}
