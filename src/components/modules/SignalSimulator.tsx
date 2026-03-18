import { useState, useMemo } from 'react';
import Plot from '../shared/PlotWrapper';
import { ParamSlider } from '../shared/ParamSlider';
import { ConditionBadge } from '../shared/ConditionBadge';
import { FormulaDisplay } from '../shared/FormulaDisplay';
import { InterpretationBox } from '../shared/InterpretationBox';
import {
  sharpCondition,
  observableCondition,
  generatePhaseMap,
  computeValueGapBound,
  PRESETS,
} from '../../lib/prevalence';
import type { PrevalenceParams } from '../../lib/types';

export function SignalSimulator() {
  const [params, setParams] = useState<PrevalenceParams>({
    beta_d: 0.12,
    g_bar: 0.18,
    kappa_0: 0.65,
    T: 130,
    r_floor: 0.13,
  });

  const update = (key: keyof PrevalenceParams) => (value: number) =>
    setParams(prev => ({ ...prev, [key]: value }));

  const sharp = useMemo(() => sharpCondition(params), [params]);
  const observable = useMemo(() => observableCondition(params), [params]);
  const deltaV = useMemo(() => computeValueGapBound(params), [params]);

  const phaseMap = useMemo(
    () => generatePhaseMap(params, [0, 0.5], [0, 1.0], 60),
    [params]
  );

  const interpretation = useMemo(() => {
    if (observable.holds && sharp.holds) {
      return {
        variant: 'danger' as const,
        title: 'Harmful Signaling Detected',
        text: `At these settings, AI advice degrades operator competence faster than it improves decisions. The drift cost (β_d · ΔV = ${sharp.lhs.toFixed(3)}) exceeds the best one-step gain (ḡ = ${params.g_bar.toFixed(3)}). Consider reducing signal frequency, lowering signal intensity, or investing in operator training to reduce β_d.`,
      };
    }
    if (observable.holds) {
      return {
        variant: 'warning' as const,
        title: 'Borderline — Observable Condition Triggered',
        text: `The observable condition (using the ΔV lower bound) flags potential harm, but the sharp condition may not hold with the exact value gap. Field estimation of ΔV would clarify. Proceed with caution and monitor operator performance.`,
      };
    }
    return {
      variant: 'success' as const,
      title: 'Safe to Signal',
      text: `At these settings, the immediate benefit of AI advice outweighs the long-term efficacy cost. Safety margin: ${Math.abs(observable.gap).toFixed(3)}. The larger this margin, the more robust the conclusion is to parameter uncertainty.`,
    };
  }, [sharp, observable, params.g_bar]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Should You Signal?
        </h2>
        <p className="text-gray-600 mb-3">
          Input your scenario parameters to check whether AI advice helps or hurts
          your operators over time. This tests the paper's two prevalence conditions.
        </p>
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
          <p><strong>Sharp condition:</strong> β_d · ΔV {'>'} ḡ — if this holds, harmful signaling pervades all high-efficacy states.</p>
          <p><strong>Observable condition:</strong> uses a computable lower bound on ΔV, so it can be checked pre-deployment without knowing the exact value gap.</p>
        </div>
      </div>

      {/* Preset selector */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500 mr-2">Load a preset:</span>
          {Object.entries(PRESETS).map(([name, preset]) => (
            <button
              key={name}
              onClick={() => setParams(preset)}
              className="px-3 py-1.5 text-sm rounded-full border border-gray-300 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          These presets correspond to calibrated scenarios from the paper (Table 2).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Parameter sliders */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Parameters</h3>
          <ParamSlider
            label="Drift Intensity"
            symbol="β_d"
            value={params.beta_d}
            min={0}
            max={0.5}
            step={0.01}
            onChange={update('beta_d')}
            tooltip="How much each signal degrades operator efficacy. Higher β_d means faster skill erosion."
          />
          <ParamSlider
            label="Best One-Step Gain"
            symbol="ḡ"
            value={params.g_bar}
            min={0}
            max={1.0}
            step={0.01}
            onChange={update('g_bar')}
            tooltip="Maximum immediate reward improvement from a single signal. This is the 'upside' of giving advice."
          />
          <ParamSlider
            label="Efficacy Persistence"
            symbol="κ₀"
            value={params.kappa_0}
            min={0}
            max={0.99}
            step={0.01}
            onChange={update('kappa_0')}
            tooltip="How sticky is operator competence? κ₀ near 1 means efficacy changes persist. κ₀ near 0 means efficacy resets quickly."
          />
          <ParamSlider
            label="Horizon"
            symbol="T"
            value={params.T}
            min={5}
            max={200}
            step={1}
            onChange={update('T')}
            format={v => v.toString()}
            tooltip="Number of decision periods. Longer horizons amplify the cumulative effect of drift."
          />
          <ParamSlider
            label="Reward Floor"
            symbol="r̲"
            value={params.r_floor}
            min={0}
            max={1.0}
            step={0.01}
            onChange={update('r_floor')}
            tooltip="Minimum per-period reward difference between high and low efficacy states. Used to bound ΔV from below."
          />

          {/* Computed Delta_V */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Computed Value Gap Lower Bound</div>
            <div className="font-mono text-sm">
              <FormulaDisplay
                tex={`\\Delta_V \\geq ${deltaV.toFixed(3)}`}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              From Lemma 2: ΔV ≥ β_d · r̲ · (1 - κ₀^(T-1)) / (1 - κ₀)
            </p>
          </div>
        </div>

        {/* Center: Conditions + Interpretation */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Conditions</h3>

            <div className="mb-4">
              <FormulaDisplay
                tex={`\\text{Sharp: } \\beta_d \\cdot \\Delta_V = ${params.beta_d.toFixed(2)} \\times ${deltaV.toFixed(3)} = ${sharp.lhs.toFixed(4)} \\;${sharp.holds ? '>' : '\\leq'}\\; ${params.g_bar.toFixed(2)} = \\bar{g}`}
                displayMode
              />
            </div>

            <div className="space-y-3">
              <ConditionBadge
                label="Sharp Condition"
                result={sharp}
                description="β_d · ΔV > ḡ: the cumulative drift cost exceeds the best immediate gain"
              />
              <ConditionBadge
                label="Observable Condition"
                result={observable}
                description="Uses the ΔV lower bound — can be checked before deployment"
              />
            </div>
          </div>

          <InterpretationBox variant={interpretation.variant} title={interpretation.title}>
            {interpretation.text}
          </InterpretationBox>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-medium text-gray-700 text-sm mb-2">What do these conditions mean?</h4>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
              <li><strong>Sharp condition holds:</strong> for <em>every</em> high-efficacy state, silence strictly dominates signaling. The planner should withhold AI advice.</li>
              <li><strong>Observable condition holds but sharp doesn't:</strong> a warning flag — signaling may be harmful, but the exact ΔV needs field estimation.</li>
              <li><strong>Neither holds:</strong> signaling is safe — the immediate quality gain outweighs the drift cost at all high-efficacy states.</li>
            </ul>
          </div>
        </div>

        {/* Right: Phase Map */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Phase Map</h3>
          <p className="text-xs text-gray-500 mb-3">
            The map shows which (β_d, ḡ) combinations are safe (green/yellow) vs. harmful (red).
            Your current parameters are marked with a white circle.
          </p>
          <Plot
            data={[
              {
                z: phaseMap.z,
                x: phaseMap.beta_d,
                y: phaseMap.g_bar,
                type: 'heatmap',
                colorscale: [
                  [0, '#dc2626'],
                  [0.5, '#fbbf24'],
                  [1, '#16a34a'],
                ],
                zmid: 0,
                showscale: false,
                hovertemplate: 'β_d: %{x:.2f}<br>ḡ: %{y:.2f}<br>Gap: %{z:.3f}<extra></extra>',
              },
              {
                x: [params.beta_d],
                y: [params.g_bar],
                type: 'scatter',
                mode: 'markers',
                marker: {
                  size: 14,
                  color: 'white',
                  line: { width: 3, color: '#1e3a8a' },
                  symbol: 'circle',
                },
                name: 'Your scenario',
                hovertemplate: 'Your scenario<br>β_d: %{x:.2f}<br>ḡ: %{y:.2f}<extra></extra>',
              },
            ]}
            layout={{
              xaxis: { title: 'β_d (drift intensity)', range: [0, 0.5] },
              yaxis: { title: 'ḡ (best one-step gain)', range: [0, 1.0] },
              margin: { l: 50, r: 20, t: 10, b: 45 },
              height: 350,
              showlegend: false,
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />
          <p className="text-xs text-gray-500 mt-2">
            <strong>Green region:</strong> safe to signal (gap {'>'} 0). <strong>Red region:</strong> harmful signaling
            (gap {'<'} 0). The boundary is the curve where β_d² · r̲ · (1-κ₀^(T-1))/(1-κ₀) = ḡ.
            Move your parameters with the sliders above to see how your position shifts.
          </p>
        </div>
      </div>
    </div>
  );
}
