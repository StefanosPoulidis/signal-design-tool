/**
 * Governance frontier computation.
 * Sweeps signal cap Psi_bar from 0 to 1 and computes constrained MDP value.
 *
 * Simplified model: at each period, the planner can signal (cost Psi per period)
 * or stay silent (cost 0). Signal gives immediate gain g but costs beta_d * DeltaV
 * in efficacy. The constraint is that total expected displacement <= Psi_bar * T.
 */

interface GovernanceParams {
  T: number;
  g_bar: number;     // immediate gain from signaling
  beta_d: number;    // drift intensity
  deltaV: number;    // value gap
  psi_per: number;   // per-period displacement cost of signaling
}

interface FrontierPoint {
  psiBar: number;
  value: number;
  lambda: number;    // shadow price
  signalRate: number;
}

/**
 * More nuanced model: value depends on state, and signaling degrades future value.
 * Use a simplified 2-state (H/L) model with T periods.
 */
function solveConstrainedMDP(params: GovernanceParams, psiBar: number): FrontierPoint {
  const { T, g_bar, beta_d, psi_per } = params;

  // Binary search for lambda that satisfies the constraint
  let lambdaLo = 0;
  let lambdaHi = 10;

  // Value function approach: for each lambda, solve unconstrained problem
  // and check if displacement constraint is met
  for (let iter = 0; iter < 50; iter++) {
    const lambdaMid = (lambdaLo + lambdaHi) / 2;

    // Per-period score: signal iff g_bar - lambda * psi_per > 0
    // But we need to account for dynamic efficacy effects
    const scoreSignal = g_bar - lambdaMid * psi_per;
    const costPerPeriod = beta_d * params.deltaV;

    // Signal rate depends on how many states have positive net score
    // In our simplified model, there's a threshold: signal when
    // in state H and score > cost
    const signalInH = scoreSignal > costPerPeriod;
    const signalRate = signalInH ? 0.6 : 0; // ~60% time in H state on average

    const totalPsi = signalRate * T * psi_per;

    if (totalPsi > psiBar * T) {
      lambdaLo = lambdaMid; // Need to tighten
    } else {
      lambdaHi = lambdaMid; // Can relax
    }
  }

  const lambda = (lambdaLo + lambdaHi) / 2;

  // Compute value at this lambda
  const scoreSignal = g_bar - lambda * psi_per;
  const costPerPeriod = beta_d * params.deltaV;
  const signalInH = scoreSignal > costPerPeriod;

  // Value accumulation
  let value = 0;
  let pHigh = 1.0; // Start in H
  for (let t = 0; t < T; t++) {
    if (signalInH) {
      // Signal when in H, silent when in L
      const vSignal = g_bar - costPerPeriod;
      value += pHigh * Math.max(vSignal, 0) + (1 - pHigh) * 0;
      // Efficacy transition
      pHigh = pHigh * (1 - beta_d) + (1 - pHigh) * 0.1;
    } else {
      // Always silent — preserve efficacy
      value += 0;
      pHigh = pHigh * 1.0 + (1 - pHigh) * 0.15; // Slow recovery
    }
  }

  const signalRate = signalInH ? pHigh : 0;

  return { psiBar, value, lambda, signalRate };
}

/**
 * Generate the full governance frontier
 */
export function computeGovernanceFrontier(
  T: number,
  g_bar: number,
  beta_d: number,
  kappa_0: number,
  r_floor: number,
  resolution: number = 50
): FrontierPoint[] {
  // Compute Delta_V from accumulation lemma
  let deltaV: number;
  if (kappa_0 === 1) {
    deltaV = beta_d * r_floor * (T - 1);
  } else {
    deltaV = beta_d * r_floor * (1 - Math.pow(kappa_0, T - 1)) / (1 - kappa_0);
  }

  const params: GovernanceParams = {
    T,
    g_bar,
    beta_d,
    deltaV,
    psi_per: 0.1, // displacement per signal event
  };

  const psiBars = Array.from({ length: resolution }, (_, i) =>
    i / (resolution - 1)
  );

  return psiBars.map(pb => solveConstrainedMDP(params, pb));
}
