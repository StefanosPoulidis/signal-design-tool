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
        text: `At these settings, AI advice degrades operator competence faster than it improves decisions. The efficacy drift cost (β_d·ΔV = ${sharp.lhs.toFixed(3)}) exceeds the best one-step gain (ḡ = ${params.g_bar.toFixed(3)}). Consider reducing signal frequency or intensity.`,
      };
    }
    if (observable.holds) {
      return {
        variant: 'warning' as const,
        title: 'Observable Condition Triggered',
        text: `The observable condition (using estimated ΔV bound) indicates potential harm, but the sharp condition may not hold with exact ΔV. Field estimation of the value gap would clarify.`,
      };
    }
    return {
      variant: 'success' as const,
      title: 'Safe to Signal',
      text: `At these settings, the immediate benefit of AI advice outweighs the long-term efficacy cost. The safety margin is ${Math.abs(observable.gap).toFixed(3)}.`,
    };
  }, [sharp, observable, params.g_bar]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Should You Signal?
        </h2>
        <p className="text-gray-600">
          Input your scenario parameters to check whether AI advice helps or hurts
          your operators over time.
        </p>
      </div>

      {/* Preset selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 self-center mr-2">Presets:</span>
        {Object.entries(PRESETS).map(([name, preset]) => (
          <button
            key={name}
            onClick={() => setParams(preset)}
            className="px-3 py-1 text-sm rounded-full border border-gray-300 hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            {name}
          </button>
        ))}
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
            tooltip="How much does signaling degrade operator efficacy?"
          />
          <ParamSlider
            label="Best One-Step Gain"
            symbol="ḡ"
            value={params.g_bar}
            min={0}
            max={1.0}
            step={0.01}
            onChange={update('g_bar')}
            tooltip="Maximum immediate reward improvement from signaling"
          />
          <ParamSlider
            label="Efficacy Persistence"
            symbol="κ₀"
            value={params.kappa_0}
            min={0}
            max={0.99}
            step={0.01}
            onChange={update('kappa_0')}
            tooltip="How sticky is high/low competence? Higher = more persistent."
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
            tooltip="Number of decision periods"
          />
          <ParamSlider
            label="Reward Floor"
            symbol="r̲"
            value={params.r_floor}
            min={0}
            max={1.0}
            step={0.01}
            onChange={update('r_floor')}
            tooltip="Minimum per-period reward difference between H and L efficacy"
          />

          {/* Computed Delta_V */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Computed Value Gap Bound</div>
            <div className="font-mono text-sm">
              <FormulaDisplay
                tex={`\\Delta_V \\geq ${deltaV.toFixed(3)}`}
              />
            </div>
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
                description="β_d · ΔV > ḡ: drift cost exceeds immediate gain"
              />
              <ConditionBadge
                label="Observable Condition"
                result={observable}
                description="β_d² · r̲ · (1-κ₀^{T-1})/(1-κ₀) > ḡ: verifiable pre-deployment"
              />
            </div>
          </div>

          <InterpretationBox variant={interpretation.variant} title={interpretation.title}>
            {interpretation.text}
          </InterpretationBox>
        </div>

        {/* Right: Phase Map */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Phase Map</h3>
          <p className="text-xs text-gray-500 mb-3">
            Green = safe to signal, Red = harmful signaling region.
            Your position is marked.
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
        </div>
      </div>
    </div>
  );
}
