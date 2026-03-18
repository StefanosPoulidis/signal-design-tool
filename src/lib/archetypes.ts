import type { ArchetypeParams } from './types';

export const ARCHETYPES: ArchetypeParams[] = [
  {
    name: 'Over-reliant',
    q_base: 0.30,
    phi: 0.95,
    sigma_mu: 0.45,
    alpha_att: 0.30,
    rho: 0,
    description: 'Follows AI advice almost blindly, with poor independent judgment.',
    mechanism: 'Near-full compliance, poor own judgment',
  },
  {
    name: 'Alert-fatigued',
    q_base: 0.50,
    phi: 0.75,
    sigma_mu: 0.30,
    alpha_att: 0.40,
    rho: 0.04,
    description: 'Initially compliant but compliance decays with repeated signals.',
    mechanism: 'Compliance decays with signal frequency',
  },
  {
    name: 'Forward-looking',
    q_base: 0.75,
    phi: 0.55,
    sigma_mu: 0.15,
    alpha_att: 0.50,
    rho: 0,
    description: 'Strong own decision-making ability with moderate AI reliance.',
    mechanism: 'Good own policy, moderate compliance',
  },
  {
    name: 'Compliant',
    q_base: 0.50,
    phi: 0.80,
    sigma_mu: 0.30,
    alpha_att: 0.40,
    rho: 0,
    description: 'Reliably follows AI recommendations with decent baseline skill.',
    mechanism: 'High compliance, moderate skill',
  },
  {
    name: 'Capacity-limited',
    q_base: 0.55,
    phi: 0.40,
    sigma_mu: 0.35,
    alpha_att: 0.65,
    rho: 0,
    description: 'Benefits more from attention/awareness improvements than direct action guidance.',
    mechanism: 'Benefits more from attention than action',
  },
  {
    name: 'Noisy',
    q_base: 0.35,
    phi: 0.50,
    sigma_mu: 0.55,
    alpha_att: 0.35,
    rho: 0,
    description: 'High decision variance with moderate willingness to follow AI.',
    mechanism: 'High variance, moderate compliance',
  },
  {
    name: 'Skeptical',
    q_base: 0.60,
    phi: 0.25,
    sigma_mu: 0.25,
    alpha_att: 0.50,
    rho: 0,
    description: 'Relies heavily on own judgment, rarely follows AI advice.',
    mechanism: 'Low compliance, relies on own judgment',
  },
];

/**
 * Compute effective compliance accounting for fatigue decay
 * phi_eff = phi * exp(-rho * N_cum)
 */
export function effectiveCompliance(phi: number, rho: number, nCum: number): number {
  return phi * Math.exp(-rho * nCum);
}

/**
 * Compute action distribution mu(a_good | s, l)
 * Under signal: μ = φ_eff + (1 - φ_eff) · sigmoid(q_base / σ_μ)
 * Under silence: μ = sigmoid(q_base / σ_μ)   [logistic sigmoid for binary choice]
 */
export function actionDistribution(
  archetype: ArchetypeParams,
  signal: boolean,
  nCum: number = 0
): { pGood: number; pBad: number } {
  const phi_eff = effectiveCompliance(archetype.phi, archetype.rho, nCum);
  const softmax_good = 1 / (1 + Math.exp(-archetype.q_base / archetype.sigma_mu));

  let pGood: number;
  if (signal) {
    pGood = phi_eff + (1 - phi_eff) * softmax_good;
  } else {
    pGood = softmax_good;
  }

  return { pGood, pBad: 1 - pGood };
}

/**
 * Generate compliance decay curve over cumulative signals
 */
export function complianceDecayCurve(
  archetype: ArchetypeParams,
  maxSignals: number = 100
): { nCum: number[]; phiEff: number[] } {
  const nCum = Array.from({ length: maxSignals + 1 }, (_, i) => i);
  const phiEff = nCum.map(n => effectiveCompliance(archetype.phi, archetype.rho, n));
  return { nCum, phiEff };
}
