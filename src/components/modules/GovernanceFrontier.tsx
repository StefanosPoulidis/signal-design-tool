import { useState, useMemo } from 'react';
import Plot from '../shared/PlotWrapper';
import { ParamSlider } from '../shared/ParamSlider';
import { InterpretationBox } from '../shared/InterpretationBox';
import { computeGovernanceFrontier } from '../../lib/governance';

export function GovernanceFrontier() {
  const [T, setT] = useState(30);
  const [g_bar, setGBar] = useState(0.20);
  const [beta_d, setBetaD] = useState(0.15);
  const [kappa_0, setKappa0] = useState(0.65);
  const [r_floor, setRFloor] = useState(0.13);

  const frontier = useMemo(
    () => computeGovernanceFrontier(T, g_bar, beta_d, kappa_0, r_floor, 60),
    [T, g_bar, beta_d, kappa_0, r_floor]
  );

  const maxValue = Math.max(...frontier.map(f => f.value));
  const kinkPoint = frontier.find(f => f.value >= maxValue * 0.99);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Governance Frontier
        </h2>
        <p className="text-gray-600">
          Explore the trade-off between signal caps and lifecycle value.
          The shadow price λ* reveals the marginal cost of tightening the signal budget.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Parameters</h3>
          <ParamSlider label="Horizon" symbol="T" value={T} min={5} max={100} step={1} onChange={setT} format={v => v.toString()} />
          <ParamSlider label="One-step gain" symbol="ḡ" value={g_bar} min={0} max={0.5} step={0.01} onChange={setGBar} />
          <ParamSlider label="Drift intensity" symbol="β_d" value={beta_d} min={0} max={0.4} step={0.01} onChange={setBetaD} />
          <ParamSlider label="Efficacy persistence" symbol="κ₀" value={kappa_0} min={0} max={0.99} step={0.01} onChange={setKappa0} />
          <ParamSlider label="Reward floor" symbol="r̲" value={r_floor} min={0} max={1} step={0.01} onChange={setRFloor} />

          <InterpretationBox variant="info" title="How to read this">
            The <strong>value curve</strong> shows lifecycle performance as you allow more
            signaling. The <strong>shadow price λ*</strong> shows how much each
            additional unit of signal capacity is worth. When λ* drops to zero,
            the constraint is slack (unconstrained optimum).
          </InterpretationBox>
        </div>

        {/* Value plot */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            Lifecycle Value vs. Signal Cap
          </h3>

          <Plot
            data={[
              {
                x: frontier.map(f => f.psiBar),
                y: frontier.map(f => f.value),
                type: 'scatter',
                mode: 'lines',
                name: 'Value V(Ψ̅)',
                line: { color: '#2563eb', width: 3 },
                fill: 'tozeroy',
                fillcolor: 'rgba(37, 99, 235, 0.1)',
              },
              ...(kinkPoint ? [{
                x: [kinkPoint.psiBar],
                y: [kinkPoint.value],
                type: 'scatter' as const,
                mode: 'markers' as const,
                name: 'Unconstrained optimum',
                marker: {
                  size: 12,
                  color: '#dc2626',
                  symbol: 'diamond' as const,
                },
              }] : []),
            ]}
            layout={{
              xaxis: { title: 'Ψ̅ (signal cap)', range: [0, 1] },
              yaxis: { title: 'Lifecycle Value V' },
              margin: { l: 55, r: 20, t: 10, b: 45 },
              height: 350,
              legend: { x: 0.5, y: 1, font: { size: 10 } },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />

          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Max Value</div>
              <div className="font-mono text-lg font-bold text-gray-900">
                {maxValue.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Optimal Cap</div>
              <div className="font-mono text-lg font-bold text-primary-600">
                {kinkPoint ? kinkPoint.psiBar.toFixed(2) : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Shadow price plot */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            Shadow Price λ*
          </h3>

          <Plot
            data={[
              {
                x: frontier.map(f => f.psiBar),
                y: frontier.map(f => f.lambda),
                type: 'scatter',
                mode: 'lines',
                name: 'λ*(Ψ̅)',
                line: { color: '#dc2626', width: 2 },
              },
            ]}
            layout={{
              xaxis: { title: 'Ψ̅ (signal cap)', range: [0, 1] },
              yaxis: { title: 'λ* (shadow price)' },
              margin: { l: 55, r: 20, t: 10, b: 45 },
              height: 350,
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />

          <InterpretationBox variant="warning" title="Key Insight">
            The first few percentage points of signal capacity are{' '}
            <strong>disproportionately valuable</strong>. λ* is highest when the cap
            is tightest, meaning loosening a strict cap has large marginal returns.
            Beyond the kink point, additional signal capacity adds no value.
          </InterpretationBox>
        </div>
      </div>
    </div>
  );
}
