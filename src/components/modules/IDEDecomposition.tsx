import { useState, useMemo } from 'react';
import Plot from '../shared/PlotWrapper';
import { ParamSlider } from '../shared/ParamSlider';
import { FormulaDisplay } from '../shared/FormulaDisplay';
import { InterpretationBox } from '../shared/InterpretationBox';
import { computeIDE, computeIDESweep } from '../../lib/ide';
import type { IDEParams } from '../../lib/types';

export function IDEDecomposition() {
  const [params, setParams] = useState<IDEParams>({
    phi: 0.75,
    beta_d: 0.15,
    q_base: 0.50,
    r_signal: 0.8,
    r_nosignal: 0.3,
    deltaV: 2.0,
    kappa_0: 0.65,
  });

  const update = (key: keyof IDEParams) => (value: number) =>
    setParams(prev => ({ ...prev, [key]: value }));

  const ide = useMemo(() => computeIDE(params), [params]);
  const sweep = useMemo(
    () => computeIDESweep(params, [0, 0.4], 60),
    [params]
  );

  const harmful = ide.total < 0;

  // Find crossover beta_d where total = 0
  const crossover = useMemo(() => {
    for (let i = 1; i < sweep.total.length; i++) {
      if (sweep.total[i - 1] >= 0 && sweep.total[i] < 0) {
        // Linear interpolation
        const t = sweep.total[i - 1] / (sweep.total[i - 1] - sweep.total[i]);
        return sweep.betas[i - 1] + t * (sweep.betas[i] - sweep.betas[i - 1]);
      }
    }
    return null;
  }, [sweep]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          IDE Channel Decomposition
        </h2>
        <p className="text-gray-600 mb-3">
          Every signal's value decomposes into three channels: <strong>Immediate</strong> quality gain (I),
          action <strong>Displacement</strong> (D), and <strong>Efficacy</strong> drift (E).
        </p>
        <div className="bg-gray-50 rounded-lg p-3 mb-2">
          <FormulaDisplay
            tex="Q(x,\ell') - Q(x,\ell) = \underbrace{\mathcal{I}}_{\text{Immediate}} + \underbrace{\mathcal{D}}_{\text{Displacement}} + \underbrace{\mathcal{E}}_{\text{Efficacy}}"
            displayMode
          />
        </div>
        <p className="text-xs text-gray-500">
          <strong>I</strong> captures the direct reward improvement from better actions.
          <strong> D</strong> captures how shifting actions changes continuation value (zero under action-independent efficacy).
          <strong> E</strong> captures the cost of degrading future operator competence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Parameters</h3>
          <ParamSlider
            label="Compliance Rate"
            symbol="φ"
            value={params.phi}
            min={0.1}
            max={1.0}
            step={0.01}
            onChange={update('phi')}
            tooltip="Probability the operator follows the AI recommendation when signaled. φ = 1 means perfect compliance."
          />
          <ParamSlider
            label="Baseline Quality"
            symbol="q"
            value={params.q_base}
            min={0.1}
            max={0.9}
            step={0.01}
            onChange={update('q_base')}
            tooltip="Probability the operator makes the right decision on their own (without AI). Higher = more skilled operator."
          />
          <ParamSlider
            label="Drift Intensity"
            symbol="β_d"
            value={params.beta_d}
            min={0}
            max={0.4}
            step={0.01}
            onChange={update('beta_d')}
            tooltip="How much each signal degrades the operator's future efficacy. Higher = more skill erosion per signal."
          />
          <ParamSlider
            label="Reward (AI action)"
            symbol="R(a*)"
            value={params.r_signal}
            min={0}
            max={1.0}
            step={0.01}
            onChange={update('r_signal')}
            tooltip="Per-period reward when the operator takes the AI-recommended action."
          />
          <ParamSlider
            label="Reward (default action)"
            symbol="R(a₀)"
            value={params.r_nosignal}
            min={0}
            max={1.0}
            step={0.01}
            onChange={update('r_nosignal')}
            tooltip="Per-period reward when the operator takes their default (non-AI) action."
          />
          <ParamSlider
            label="Value Gap"
            symbol="ΔV"
            value={params.deltaV}
            min={0}
            max={5.0}
            step={0.1}
            onChange={update('deltaV')}
            tooltip="Lifetime value difference between high and low operator efficacy. Larger = higher stakes for maintaining competence."
          />
          <ParamSlider
            label="Efficacy Persistence"
            symbol="κ₀"
            value={params.kappa_0}
            min={0}
            max={0.99}
            step={0.01}
            onChange={update('kappa_0')}
            tooltip="How sticky is the operator's competence level? κ₀ close to 1 means efficacy changes persist for many periods."
          />
        </div>

        {/* Channel Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Channel Values</h3>

          <Plot
            data={[
              {
                x: ['I (Immediate)', 'D (Displacement)', 'E (Efficacy)', 'Total'],
                y: [ide.I, ide.D, ide.E, ide.total],
                type: 'bar',
                marker: {
                  color: [
                    '#22c55e', // I - green
                    '#f59e0b', // D - amber
                    '#ef4444', // E - red
                    ide.total >= 0 ? '#22c55e' : '#ef4444', // total
                  ],
                },
                hovertemplate: '%{x}: %{y:.4f}<extra></extra>',
              },
            ]}
            layout={{
              yaxis: { title: 'Value', zeroline: true, zerolinewidth: 2 },
              margin: { l: 50, r: 20, t: 10, b: 80 },
              height: 300,
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-green-50">
              <div className="text-xs text-gray-500">I (Immediate)</div>
              <div className="font-mono text-sm font-semibold text-green-700">
                {ide.I >= 0 ? '+' : ''}{ide.I.toFixed(3)}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {ide.I > 0 ? 'Better actions now' : 'Worse actions now'}
              </div>
            </div>
            <div className="p-2 rounded bg-amber-50">
              <div className="text-xs text-gray-500">D (Displacement)</div>
              <div className="font-mono text-sm font-semibold text-amber-700">
                {ide.D >= 0 ? '+' : ''}{ide.D.toFixed(3)}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {Math.abs(ide.D) < 0.001 ? 'Zero (action-indep. F)' : 'Continuation shift'}
              </div>
            </div>
            <div className="p-2 rounded bg-red-50">
              <div className="text-xs text-gray-500">E (Efficacy)</div>
              <div className="font-mono text-sm font-semibold text-red-700">
                {ide.E >= 0 ? '+' : ''}{ide.E.toFixed(3)}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {ide.E < 0 ? 'Skill erosion cost' : 'No drift'}
              </div>
            </div>
          </div>

          <InterpretationBox
            variant={harmful ? 'danger' : 'success'}
            title={harmful ? 'Harmful: |E| > I + D' : 'Beneficial: I + D + E > 0'}
          >
            {harmful
              ? <>The efficacy drift channel (<strong>E = {ide.E.toFixed(3)}</strong>) overwhelms the combined immediate and displacement effects (<strong>I + D = {(ide.I + ide.D).toFixed(3)}</strong>). Signal value is <strong>negative {ide.total.toFixed(3)}</strong> — AI advice destroys more value through skill erosion than it creates through better immediate decisions.</>
              : <>The combined channels produce positive signal value (<strong>{ide.total.toFixed(3)}</strong>). AI advice is beneficial: the immediate quality gain outweighs any competence degradation.</>
            }
          </InterpretationBox>

          {Math.abs(ide.D) < 0.001 && (
            <p className="text-xs text-gray-500 mt-2 italic">
              Note: D = 0 because the model assumes action-independent efficacy
              (Corollary 1 from the paper). The operator's future competence depends
              on whether they received a signal, not which action they took.
            </p>
          )}
        </div>

        {/* Sweep over beta_d */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            Channels vs. Drift Intensity
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            How the three channels change as β_d (drift intensity) increases.
            The crossover point marks when signaling flips from beneficial to harmful.
          </p>

          <Plot
            data={[
              {
                x: sweep.betas,
                y: sweep.I,
                type: 'scatter',
                mode: 'lines',
                name: 'I (Immediate)',
                line: { color: '#22c55e', width: 2 },
              },
              {
                x: sweep.betas,
                y: sweep.D,
                type: 'scatter',
                mode: 'lines',
                name: 'D (Displacement)',
                line: { color: '#f59e0b', width: 2 },
              },
              {
                x: sweep.betas,
                y: sweep.E,
                type: 'scatter',
                mode: 'lines',
                name: 'E (Efficacy)',
                line: { color: '#ef4444', width: 2 },
              },
              {
                x: sweep.betas,
                y: sweep.total,
                type: 'scatter',
                mode: 'lines',
                name: 'Total (I+D+E)',
                line: { color: '#1e3a8a', width: 3, dash: 'dash' },
              },
            ]}
            layout={{
              xaxis: { title: 'β_d (drift intensity)' },
              yaxis: { title: 'Channel value', zeroline: true, zerolinewidth: 2 },
              margin: { l: 50, r: 20, t: 10, b: 45 },
              height: 350,
              legend: { x: 0, y: 1, font: { size: 10 } },
              shapes: [{
                type: 'line',
                x0: params.beta_d, x1: params.beta_d,
                y0: -2, y1: 1,
                line: { color: '#6b7280', width: 1, dash: 'dot' },
              }],
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />

          <InterpretationBox variant="info" title="How to read this chart">
            The dashed blue line is the <strong>total signal value</strong>. When it crosses
            zero, signaling becomes harmful. The green line (I) is flat because immediate
            gains don't depend on drift. The red line (E) falls linearly with β_d.
            {crossover !== null && (
              <> The crossover occurs at <strong>β_d = {crossover.toFixed(3)}</strong> —
              below this threshold, signaling is safe; above it, silence is better.</>
            )}
          </InterpretationBox>
        </div>
      </div>
    </div>
  );
}
