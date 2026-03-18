import type { IDEChannels, IDEParams } from './types';

/**
 * Compute the IDE channel decomposition.
 *
 * The model: binary signal l in {0,1}, binary action a in {a_good, a_bad}
 *
 * Under signal l=1 (recommend):
 *   mu(a_good | x, 1) = phi (compliance)
 *   mu(a_bad  | x, 1) = 1 - phi
 *
 * Under signal l=0 (silence):
 *   mu(a_good | x, 0) = q_base (own judgment quality)
 *   mu(a_bad  | x, 0) = 1 - q_base
 *
 * R(s, a_good) = r_signal, R(s, a_bad) = r_nosignal
 *
 * Efficacy kernel under action-independent F:
 *   K_bar(H|H,s,1) - K_bar(H|H,s,0) = -beta_d (drift)
 */
export function computeIDE(params: IDEParams): IDEChannels {
  const { phi, beta_d, r_signal, r_nosignal, deltaV, kappa_0 } = params;

  // For this simplified model, we use a baseline quality q_base
  // derived implicitly: under silence, the operator uses own judgment
  const q_base = 0.5; // default baseline; in full model this comes from archetype

  // Delta_mu = mu(a|x,1) - mu(a|x,0)
  const delta_mu_good = phi - q_base;
  const delta_mu_bad = -delta_mu_good;

  // I = sum_a Delta_mu_a * R(s,a)
  const I = delta_mu_good * r_signal + delta_mu_bad * r_nosignal;

  // w_t(s,c,a,0) = continuation value under silence for action a
  // Under action-independent F, this simplifies to:
  // w(a) ≈ kappa_0 * deltaV for a_good, (kappa_0 - small) * deltaV for a_bad
  const w_good = kappa_0 * deltaV;
  const w_bad = (kappa_0 * 0.8) * deltaV; // slightly lower continuation for bad action

  // D = sum_a Delta_mu_a * w_t(s,c,a,0)
  const D = delta_mu_good * w_good + delta_mu_bad * w_bad;

  // E = efficacy drift channel
  // Under the direct K-bar computation:
  // E = [K_bar(H|H,s,1) - K_bar(H|H,s,0)] * Delta_V_bar
  // K_bar(H|H,s,0) - K_bar(H|H,s,1) >= beta_d
  // So E <= -beta_d * deltaV (negative = harmful)
  const E = -beta_d * deltaV;

  return {
    I,
    D,
    E,
    total: I + D + E,
  };
}

/**
 * Compute IDE for a range of drift values to show how channels shift
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
