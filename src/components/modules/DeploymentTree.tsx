import { useState, useMemo } from 'react';
import { ParamSlider } from '../shared/ParamSlider';
import { FormulaDisplay } from '../shared/FormulaDisplay';
import { observableCondition } from '../../lib/prevalence';

interface NodeState {
  // Node 1: Near-optimality certificate
  rho_tilde: number;
  delta_mu_tv: number;
  e_max: number;
  epsilon: number;
  T: number;
  R_max: number;
  // Node 2: Impossibility test
  pValue: number;
  // Node 3: Prevalence check
  beta_d: number;
  r_floor: number;
  kappa_0: number;
  g_bar: number;
}

export function DeploymentTree() {
  const [state, setState] = useState<NodeState>({
    rho_tilde: 0.15,
    delta_mu_tv: 0.10,
    e_max: 0.05,
    epsilon: 0.5,
    T: 50,
    R_max: 1.0,
    pValue: 0.08,
    beta_d: 0.12,
    r_floor: 0.13,
    kappa_0: 0.65,
    g_bar: 0.18,
  });

  const update = (key: keyof NodeState) => (value: number) =>
    setState(prev => ({ ...prev, [key]: value }));

  // Node 1 computation
  const node1 = useMemo(() => {
    const { rho_tilde, delta_mu_tv, e_max, epsilon, T, R_max } = state;
    const distortion = rho_tilde * delta_mu_tv + e_max;
    const threshold = (2 * epsilon) / (T * (T - 1) * R_max);
    return {
      distortion,
      threshold,
      passed: distortion <= threshold,
    };
  }, [state]);

  // Node 2 computation
  const node2 = useMemo(() => ({
    passed: state.pValue > 0.05,
  }), [state.pValue]);

  // Node 3 computation
  const node3 = useMemo(
    () => observableCondition({
      beta_d: state.beta_d,
      g_bar: state.g_bar,
      kappa_0: state.kappa_0,
      T: state.T,
      r_floor: state.r_floor,
    }),
    [state]
  );

  // Determine active path
  const activePath = node1.passed ? 1 : node2.passed ? 2 : node3.holds ? 3 : 4;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Deployment Decision Guide
        </h2>
        <p className="text-gray-600">
          Walk through the 4-node deployment architecture. Input your measurements
          to find the right deployment strategy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision tree visual */}
        <div className="space-y-4">
          {/* Node 1 */}
          <div className={`rounded-xl border-2 p-5 transition-all ${
            activePath === 1 ? 'border-green-500 bg-green-50' :
            'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                node1.passed ? 'bg-green-500' : 'bg-gray-400'
              }`}>1</div>
              <h3 className="font-semibold text-gray-900">Near-Optimality Certificate</h3>
              {node1.passed && <span className="ml-auto text-green-600 font-bold">STOP</span>}
            </div>

            <div className="text-sm mb-2">
              <FormulaDisplay
                tex={`\\tilde{\\rho} \\cdot \\|\\Delta\\mu\\|_{\\mathrm{TV}} + \\mathcal{E}_{\\max} = ${state.rho_tilde.toFixed(2)} \\cdot ${state.delta_mu_tv.toFixed(2)} + ${state.e_max.toFixed(3)} = ${node1.distortion.toFixed(4)}`}
              />
              <FormulaDisplay
                tex={`\\text{Threshold: } \\frac{2\\varepsilon}{T(T{-}1)R_{\\max}} = ${node1.threshold.toFixed(6)}`}
              />
            </div>

            <div className={`text-sm font-medium ${node1.passed ? 'text-green-700' : 'text-gray-500'}`}>
              {node1.passed
                ? 'Deploy LCG (local confidence-gating). Gap is at most ε.'
                : 'Certificate does not hold. Proceed to Node 2.'
              }
            </div>
          </div>

          {/* Arrow */}
          {!node1.passed && (
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-300" />
            </div>
          )}

          {/* Node 2 */}
          {!node1.passed && (
            <div className={`rounded-xl border-2 p-5 transition-all ${
              activePath === 2 ? 'border-green-500 bg-green-50' :
              'border-gray-200 bg-white'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  node2.passed ? 'bg-green-500' : 'bg-gray-400'
                }`}>2</div>
                <h3 className="font-semibold text-gray-900">Impossibility Test</h3>
                {node2.passed && <span className="ml-auto text-green-600 font-bold">STOP</span>}
              </div>

              <p className="text-sm text-gray-600 mb-2">
                Regress efficacy outcomes on signal level, controlling for action.
                If no residual effect (p &gt; 0.05): harmful signaling is ruled out.
              </p>

              <div className={`text-sm font-medium ${node2.passed ? 'text-green-700' : 'text-gray-500'}`}>
                {node2.passed
                  ? 'No signal-dependent efficacy drift detected. K is signal-independent. Safe to deploy any policy.'
                  : 'Signal-dependent efficacy detected (p ≤ 0.05). Proceed to Node 3.'
                }
              </div>
            </div>
          )}

          {/* Arrow */}
          {!node1.passed && !node2.passed && (
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-300" />
            </div>
          )}

          {/* Node 3 */}
          {!node1.passed && !node2.passed && (
            <div className={`rounded-xl border-2 p-5 transition-all ${
              activePath === 3 ? 'border-amber-500 bg-amber-50' :
              'border-gray-200 bg-white'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  node3.holds ? 'bg-amber-500' : 'bg-gray-400'
                }`}>3</div>
                <h3 className="font-semibold text-gray-900">Prevalence Check</h3>
              </div>

              <div className="text-sm mb-2">
                <FormulaDisplay
                  tex={`\\beta_d^2 \\cdot \\underline{r} \\cdot \\frac{1-\\kappa_0^{T-1}}{1-\\kappa_0} = ${node3.lhs.toFixed(4)} \\;${node3.holds ? '>' : '\\leq'}\\; ${node3.rhs.toFixed(4)} = \\bar{g}`}
                />
              </div>

              <div className={`text-sm font-medium ${node3.holds ? 'text-amber-700' : 'text-gray-500'}`}>
                {node3.holds
                  ? 'Harmful signaling is prevalent. Drift-aware optimization is strongly indicated.'
                  : 'Prevalence condition not met. May still benefit from drift-aware optimization.'
                }
              </div>
            </div>
          )}

          {/* Arrow */}
          {!node1.passed && !node2.passed && (
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-300" />
            </div>
          )}

          {/* Node 4 */}
          {!node1.passed && !node2.passed && (
            <div className={`rounded-xl border-2 p-5 border-primary-500 bg-primary-50`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-primary-600">4</div>
                <h3 className="font-semibold text-gray-900">Solve &amp; Deploy</h3>
              </div>
              <p className="text-sm text-gray-700">
                Estimate K from pilot data. Solve via DP, LP (occupancy measure), or
                one-step rule (G - λΨ). Monitor behavioral stability and
                re-estimate when μ-drift exceeds threshold.
              </p>
            </div>
          )}
        </div>

        {/* Input panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Node 1: Certificate Inputs
            </h3>
            <ParamSlider label="Transition distortion" symbol="ρ̃" value={state.rho_tilde} min={0} max={1} step={0.01} onChange={update('rho_tilde')} />
            <ParamSlider label="Action TV distance" symbol="||Δμ||" value={state.delta_mu_tv} min={0} max={1} step={0.01} onChange={update('delta_mu_tv')} />
            <ParamSlider label="Max efficacy drift" symbol="E_max" value={state.e_max} min={0} max={0.5} step={0.005} onChange={update('e_max')} />
            <ParamSlider label="Target gap" symbol="ε" value={state.epsilon} min={0.01} max={5} step={0.01} onChange={update('epsilon')} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Node 2: Regression
            </h3>
            <ParamSlider
              label="Regression p-value (l-effect on efficacy)"
              value={state.pValue}
              min={0}
              max={1}
              step={0.01}
              onChange={update('pValue')}
              format={v => v.toFixed(2)}
            />
            <p className="text-xs text-gray-500 mt-1">
              p &gt; 0.05: no significant signal-dependent efficacy drift
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Node 3: Prevalence
            </h3>
            <ParamSlider label="Drift intensity" symbol="β_d" value={state.beta_d} min={0} max={0.5} step={0.01} onChange={update('beta_d')} />
            <ParamSlider label="Reward floor" symbol="r̲" value={state.r_floor} min={0} max={1} step={0.01} onChange={update('r_floor')} />
            <ParamSlider label="Efficacy persistence" symbol="κ₀" value={state.kappa_0} min={0} max={0.99} step={0.01} onChange={update('kappa_0')} />
            <ParamSlider label="Best one-step gain" symbol="ḡ" value={state.g_bar} min={0} max={1} step={0.01} onChange={update('g_bar')} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Shared
            </h3>
            <ParamSlider label="Horizon" symbol="T" value={state.T} min={5} max={200} step={1} onChange={update('T')} format={v => v.toString()} />
            <ParamSlider label="Max reward" symbol="R_max" value={state.R_max} min={0.1} max={5} step={0.1} onChange={update('R_max')} />
          </div>
        </div>
      </div>
    </div>
  );
}
