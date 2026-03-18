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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          IDE Channel Decomposition
        </h2>
        <p className="text-gray-600">
          Every signal's value decomposes into three channels: Immediate quality gain (I),
          action Displacement (D), and Efficacy drift (E).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Parameters</h3>
          <ParamSlider
            label="Compliance"
            symbol="φ"
            value={params.phi}
            min={0.1}
            max={1.0}
            step={0.01}
            onChange={update('phi')}
            tooltip="Probability operator follows AI recommendation"
          />
          <ParamSlider
            label="Drift Intensity"
            symbol="β_d"
            value={params.beta_d}
            min={0}
            max={0.4}
            step={0.01}
            onChange={update('beta_d')}
          />
          <ParamSlider
            label="Reward (signal action)"
            symbol="R(a*)"
            value={params.r_signal}
            min={0}
            max={1.0}
            step={0.01}
            onChange={update('r_signal')}
          />
          <ParamSlider
            label="Reward (default action)"
            symbol="R(a₀)"
            value={params.r_nosignal}
            min={0}
            max={1.0}
            step={0.01}
            onChange={update('r_nosignal')}
          />
          <ParamSlider
            label="Value Gap"
            symbol="ΔV"
            value={params.deltaV}
            min={0}
            max={5.0}
            step={0.1}
            onChange={update('deltaV')}
          />
          <ParamSlider
            label="Efficacy Persistence"
            symbol="κ₀"
            value={params.kappa_0}
            min={0}
            max={0.99}
            step={0.01}
            onChange={update('kappa_0')}
          />

          <div className="mt-4">
            <FormulaDisplay
              tex="Q(x,\ell') - Q(x,\ell) = \underbrace{\mathcal{I}}_{\text{Immediate}} + \underbrace{\mathcal{D}}_{\text{Displacement}} + \underbrace{\mathcal{E}}_{\text{Efficacy}}"
              displayMode
            />
          </div>
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
              shapes: [{
                type: 'line',
                x0: -0.5, x1: 3.5, y0: 0, y1: 0,
                line: { color: '#6b7280', width: 1, dash: 'dot' },
              }],
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-green-50">
              <div className="text-xs text-gray-500">I</div>
              <div className="font-mono text-sm font-semibold text-green-700">
                {ide.I >= 0 ? '+' : ''}{ide.I.toFixed(3)}
              </div>
            </div>
            <div className="p-2 rounded bg-amber-50">
              <div className="text-xs text-gray-500">D</div>
              <div className="font-mono text-sm font-semibold text-amber-700">
                {ide.D >= 0 ? '+' : ''}{ide.D.toFixed(3)}
              </div>
            </div>
            <div className="p-2 rounded bg-red-50">
              <div className="text-xs text-gray-500">E</div>
              <div className="font-mono text-sm font-semibold text-red-700">
                {ide.E >= 0 ? '+' : ''}{ide.E.toFixed(3)}
              </div>
            </div>
          </div>

          <InterpretationBox
            variant={harmful ? 'danger' : 'success'}
            title={harmful ? '|E| > I + D: Harmful signaling' : 'I + D + E > 0: Signaling is beneficial'}
          >
            {harmful
              ? `The efficacy drift channel (E = ${ide.E.toFixed(3)}) overwhelms the combined immediate and displacement effects (I + D = ${(ide.I + ide.D).toFixed(3)}). Signal value is negative.`
              : `The combined channels produce positive signal value (${ide.total.toFixed(3)}). AI advice is beneficial at these parameters.`
            }
          </InterpretationBox>
        </div>

        {/* Sweep over beta_d */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            Channels vs. Drift Intensity
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            How the three channels change as drift intensity increases.
            The crossover point marks the onset of harmful signaling.
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
              yaxis: { title: 'Channel value', zeroline: true },
              margin: { l: 50, r: 20, t: 10, b: 45 },
              height: 350,
              legend: { x: 0, y: 1, font: { size: 10 } },
              shapes: [{
                type: 'line',
                x0: params.beta_d, x1: params.beta_d,
                y0: -1, y1: 1,
                line: { color: '#6b7280', width: 1, dash: 'dot' },
              }],
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
