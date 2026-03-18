import type { IDEChannels, IDEParams } from './types';

/**
 * Compute the IDE channel decomposition (Proposition 1 of the paper).
 *
 * Model: binary signal ℓ ∈ {0,1}, binary action a ∈ {a_good, a_bad}
 *
 * Under signal ℓ=1 (recommend):
 *   μ(a_good | x, 1) = φ  (compliance rate)
 *   μ(a_bad  | x, 1) = 1 - φ
 *
 * Under silence ℓ=0:
 *   μ(a_good | x, 0) = q_base  (operator's own judgment quality)
 *   μ(a_bad  | x, 0) = 1 - q_base
 *
 * Channel definitions:
 *   I = Σ_a Δμ(a) · R(s,a)              — Immediate quality gain
 *   D = Σ_a Δμ(a) · w(s,c,a,0)          — Displacement of continuation value
 *   E = [K̄(H|H,s,1) - K̄(H|H,s,0)] · ΔV̄ — Efficacy drift cost
 *
 * where Δμ(a) = μ(a|x,1) - μ(a|x,0) is the action shift from signaling.
 */
export function computeIDE(params: IDEParams): IDEChannels {
  const { phi, beta_d, q_base, r_signal, r_nosignal, deltaV, kappa_0 } = params;

  // Action shift from signaling: Δμ = φ - q_base
  const delta_mu_good = phi - q_base;
  const delta_mu_bad = -delta_mu_good;

  // I = Immediate quality gain = Σ_a Δμ(a) · R(s,a)
  const I = delta_mu_good * r_signal + delta_mu_bad * r_nosignal;

  // D = Displacement effect on continuation value
  // Under action-independent efficacy kernel F (Corollary 1):
  //   w(a_good) = w(a_bad) = κ₀ · ΔV → D = 0
  // This is the paper's key simplification.
  const w_good = kappa_0 * deltaV;
  const w_bad = kappa_0 * deltaV;
  const D = delta_mu_good * w_good + delta_mu_bad * w_bad;

  // E = Efficacy drift channel = -β_d · ΔV
  // Always ≤ 0 when β_d > 0 (signaling degrades future efficacy)
  const E = -beta_d * deltaV;

  return {
    I,
    D,
    E,
    total: I + D + E,
  };
}

/**
 * Compute IDE for a range of drift values to show the crossover point
 * where |E| > I + D, making signaling harmful.
 */
export function computeIDESweep(
  baseParams: IDEParams,
  betaRange: [number, number] = [0, 0.4],
  steps: number = 50
): { betas: number[]; I: number[]; D: number[]; E: number[]; total: number[] } {
  const betas = Array.from({ length: steps }, (_, i) =>
    betaRange[0] + (betaRange[1] - betaRange[0]) * i / (steps - 1)
  );

  const results = betas.map(b => computeIDE({ ...baseParams, beta_d: b }));

  return {
    betas,
    I: results.map(r => r.I),
    D: results.map(r => r.D),
    E: results.map(r => r.E),
    total: results.map(r => r.total),
  };
}
