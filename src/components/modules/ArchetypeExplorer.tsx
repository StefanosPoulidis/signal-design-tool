import { useState, useMemo } from 'react';
import Plot from '../shared/PlotWrapper';
import { InterpretationBox } from '../shared/InterpretationBox';
import { ARCHETYPES, complianceDecayCurve, actionDistribution } from '../../lib/archetypes';

const MAX_SIGNALS = 100;

export function ArchetypeExplorer() {
  const [selectedIdx, setSelectedIdx] = useState<number[]>([0]);

  const toggleArchetype = (idx: number) => {
    setSelectedIdx(prev => {
      if (prev.includes(idx)) {
        return prev.length > 1 ? prev.filter(i => i !== idx) : prev;
      }
      return prev.length >= 3 ? [...prev.slice(1), idx] : [...prev, idx];
    });
  };

  const primary = ARCHETYPES[selectedIdx[0]];

  const decayCurves = useMemo(
    () => selectedIdx.map(i => ({
      archetype: ARCHETYPES[i],
      curve: complianceDecayCurve(ARCHETYPES[i], MAX_SIGNALS),
    })),
    [selectedIdx]
  );

  const actionDist = useMemo(
    () => selectedIdx.map(i => ({
      name: ARCHETYPES[i].name,
      signal: actionDistribution(ARCHETYPES[i], true),
      silence: actionDistribution(ARCHETYPES[i], false),
    })),
    [selectedIdx]
  );

  const radarCategories = ['q_base', 'phi', 'sigma_mu', 'alpha_att'];
  const radarLabels = ['Baseline Quality', 'Compliance', 'Noise Temp.', 'Attn. Reduction'];
  const RADAR_COLORS = ['#3b82f6', '#ef4444', '#22c55e'];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Operator Archetypes
        </h2>
        <p className="text-gray-600 mb-3">
          The paper identifies 7 behavioral profiles that capture how different operators
          respond to AI signals. Each archetype is defined by 5 parameters that determine
          compliance, independent judgment quality, noise, and fatigue.
        </p>
        <p className="text-xs text-gray-500">
          <strong>Select up to 3 archetypes</strong> to compare side by side. Click a card to select/deselect.
        </p>
      </div>

      {/* Archetype cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
        {ARCHETYPES.map((arch, i) => (
          <button
            key={arch.name}
            onClick={() => toggleArchetype(i)}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              selectedIdx.includes(i)
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-semibold text-gray-900 mb-1">{arch.name}</div>
            <div className="text-xs text-gray-500 leading-snug">{arch.mechanism}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameter table */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Parameters</h3>
          <p className="text-xs text-gray-500 mb-3">
            Behavioral parameters from Table 3 of the paper.
          </p>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">Param</th>
                {selectedIdx.map((si, i) => (
                  <th key={si} className="text-right py-2 font-medium" style={{ color: RADAR_COLORS[i] }}>
                    {ARCHETYPES[si].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'q_base', label: 'q', desc: 'Baseline quality', tip: 'P(correct) without AI' },
                { key: 'phi', label: 'φ', desc: 'Compliance', tip: 'P(follows AI)' },
                { key: 'sigma_mu', label: 'σ_μ', desc: 'Noise temp.', tip: 'Higher = noisier decisions' },
                { key: 'alpha_att', label: 'α_att', desc: 'Attn. reduction', tip: 'Signal improves attention' },
                { key: 'rho', label: 'ρ', desc: 'Fatigue rate', tip: 'Compliance decay rate' },
              ].map(({ key, label, desc, tip }) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="py-2" title={tip}>
                    <span className="font-mono text-primary-600">{label}</span>
                    <span className="text-xs text-gray-400 ml-1">({desc})</span>
                  </td>
                  {selectedIdx.map(si => (
                    <td key={si} className="text-right font-mono py-2">
                      {ARCHETYPES[si][key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">About <strong>{primary.name}</strong>:</div>
            <p className="text-xs text-gray-700">{primary.description}</p>
          </div>

          {primary.rho > 0 && (
            <InterpretationBox variant="warning" title="Alert Fatigue">
              This archetype has ρ = {primary.rho}, meaning compliance decays
              exponentially: φ_eff = φ · exp(-ρ · N). After ~{Math.round(1 / primary.rho)} signals,
              compliance drops to 37% of initial.
            </InterpretationBox>
          )}
        </div>

        {/* Compliance decay + action distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Compliance Over Time</h3>
          <p className="text-xs text-gray-500 mb-2">
            How effective compliance changes as cumulative signals increase.
            Flat = no fatigue; declining = alert fatigue (ρ {'>'} 0).
          </p>

          <Plot
            data={decayCurves.map(({ archetype, curve }, i) => ({
              x: curve.nCum,
              y: curve.phiEff,
              type: 'scatter' as const,
              mode: 'lines' as const,
              name: archetype.name,
              line: { color: RADAR_COLORS[i], width: 2 },
            }))}
            layout={{
              xaxis: { title: 'Cumulative signals (N)' },
              yaxis: { title: 'Effective compliance (φ_eff)', range: [0, 1] },
              margin: { l: 50, r: 20, t: 10, b: 45 },
              height: 280,
              legend: { x: 0.5, y: 1, font: { size: 10 } },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />

          <h4 className="font-medium text-gray-700 mt-4 mb-2 text-sm">
            Action Distribution (N = 0)
          </h4>
          <p className="text-xs text-gray-500 mb-2">
            P(correct action) with vs. without signal. The gap = action shift from signaling.
          </p>
          <div className="space-y-2">
            {actionDist.map((ad, i) => (
              <div key={ad.name} className="text-xs">
                <div className="font-medium mb-1" style={{ color: RADAR_COLORS[i] }}>{ad.name}</div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="text-gray-500 mb-0.5">With signal</div>
                    <div className="h-4 bg-gray-100 rounded overflow-hidden flex">
                      <div className="bg-green-500 h-full" style={{ width: `${ad.signal.pGood * 100}%` }} />
                    </div>
                    <div className="font-mono mt-0.5">P(a*) = {ad.signal.pGood.toFixed(2)}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-500 mb-0.5">Without signal</div>
                    <div className="h-4 bg-gray-100 rounded overflow-hidden flex">
                      <div className="bg-blue-500 h-full" style={{ width: `${ad.silence.pGood * 100}%` }} />
                    </div>
                    <div className="font-mono mt-0.5">P(a*) = {ad.silence.pGood.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Parameter Comparison</h3>
          <p className="text-xs text-gray-500 mb-2">
            All axes 0–1. Larger area = more capable operator.
          </p>

          <Plot
            data={selectedIdx.map((si, i) => ({
              type: 'scatterpolar' as const,
              r: radarCategories.map(k => ARCHETYPES[si][k] as number),
              theta: radarLabels,
              fill: 'toself' as const,
              name: ARCHETYPES[si].name,
              line: { color: RADAR_COLORS[i] },
              opacity: 0.6,
            }))}
            layout={{
              polar: {
                radialaxis: { visible: true, range: [0, 1] },
              },
              margin: { l: 40, r: 40, t: 30, b: 30 },
              height: 350,
              legend: { x: 0, y: -0.15, font: { size: 10 } },
              showlegend: true,
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />

          <InterpretationBox variant="info" title="What the parameters mean">
            <ul className="space-y-1 mt-1">
              <li><strong>q (Baseline quality):</strong> how good decisions are without AI</li>
              <li><strong>φ (Compliance):</strong> how often the operator follows AI advice</li>
              <li><strong>σ_μ (Noise):</strong> randomness in decision-making</li>
              <li><strong>α_att (Attention):</strong> how much the signal improves focus</li>
            </ul>
          </InterpretationBox>
        </div>
      </div>
    </div>
  );
}
