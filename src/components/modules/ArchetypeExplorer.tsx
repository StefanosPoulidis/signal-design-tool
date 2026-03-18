import { useState, useMemo } from 'react';
import Plot from '../shared/PlotWrapper';
import { ARCHETYPES, complianceDecayCurve, actionDistribution } from '../../lib/archetypes';

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
      curve: complianceDecayCurve(ARCHETYPES[i], 80),
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

  // Radar chart data
  const radarCategories = ['q_base', 'phi', 'sigma_mu', 'alpha_att'];
  const radarLabels = ['Baseline Quality', 'Compliance', 'Noise', 'Attn. Reduction'];
  const RADAR_COLORS = ['#3b82f6', '#ef4444', '#22c55e'];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Operator Archetypes
        </h2>
        <p className="text-gray-600">
          Explore 7 operator types from the paper. Select up to 3 to compare.
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
                { key: 'q_base', label: 'q_base', desc: 'Baseline quality' },
                { key: 'phi', label: 'φ', desc: 'Compliance' },
                { key: 'sigma_mu', label: 'σ_μ', desc: 'Noise temp.' },
                { key: 'alpha_att', label: 'α_att', desc: 'Attn. reduction' },
                { key: 'rho', label: 'ρ', desc: 'Fatigue rate' },
              ].map(({ key, label, desc }) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="py-2">
                    <span className="font-mono text-primary-600">{label}</span>
                    <span className="text-xs text-gray-400 ml-1">({desc})</span>
                  </td>
                  {selectedIdx.map(si => (
                    <td key={si} className="text-right font-mono py-2">
                      {(ARCHETYPES[si] as never as Record<string, number>)[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {primary.rho > 0 && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded p-2">
              This archetype exhibits alert fatigue (ρ = {primary.rho}).
              Compliance decays exponentially with cumulative signals.
            </p>
          )}
        </div>

        {/* Compliance decay curves */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            Effective Compliance Over Time
          </h3>

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
              yaxis: { title: 'φ_eff', range: [0, 1] },
              margin: { l: 50, r: 20, t: 10, b: 45 },
              height: 300,
              legend: { x: 0.5, y: 1, font: { size: 10 } },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />

          {/* Action distribution comparison */}
          <h4 className="font-medium text-gray-700 mt-4 mb-2 text-sm">
            Action Distribution (initial)
          </h4>
          <div className="space-y-2">
            {actionDist.map((ad, i) => (
              <div key={ad.name} className="text-xs">
                <div className="font-medium mb-1" style={{ color: RADAR_COLORS[i] }}>
                  {ad.name}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="text-gray-500 mb-0.5">Signal</div>
                    <div className="h-4 bg-gray-100 rounded overflow-hidden flex">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${ad.signal.pGood * 100}%` }}
                      />
                    </div>
                    <div className="font-mono mt-0.5">P(a*) = {ad.signal.pGood.toFixed(2)}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-500 mb-0.5">Silence</div>
                    <div className="h-4 bg-gray-100 rounded overflow-hidden flex">
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${ad.silence.pGood * 100}%` }}
                      />
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
          <h3 className="font-semibold text-gray-900 mb-3">
            Parameter Comparison
          </h3>

          <Plot
            data={selectedIdx.map((si, i) => ({
              type: 'scatterpolar' as const,
              r: radarCategories.map(k => (ARCHETYPES[si] as never as Record<string, number>)[k]),
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
              legend: { x: 0, y: -0.2, font: { size: 10 } },
              showlegend: true,
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
