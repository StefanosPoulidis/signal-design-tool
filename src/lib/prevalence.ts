import type { PrevalenceParams, ConditionResult } from './types';

/**
 * Compute the value gap lower bound from the backward induction lemma:
 * Delta_V >= beta_d * r_floor * (1 - kappa_0^{T-1}) / (1 - kappa_0)
 */
export function computeValueGapBound(params: PrevalenceParams): number {
  const { beta_d, r_floor, kappa_0, T } = params;
  if (kappa_0 === 1) {
    return beta_d * r_floor * (T - 1);
  }
  return beta_d * r_floor * (1 - Math.pow(kappa_0, T - 1)) / (1 - kappa_0);
}

/**
 * Sharp condition: beta_d * Delta_V > g_bar
 * Uses the value gap bound from the accumulation lemma
 */
export function sharpCondition(params: PrevalenceParams): ConditionResult {
  const deltaV = computeValueGapBound(params);
  const lhs = params.beta_d * deltaV;
  const rhs = params.g_bar;
  return {
    holds: lhs > rhs,
    lhs,
    rhs,
    gap: lhs - rhs,
  };
}

/**
 * Observable condition: beta_d^2 * r_floor * (1 - kappa_0^{T-1}) / (1 - kappa_0) > g_bar
 * This is the sharp condition with Delta_V replaced by its lower bound
 */
export function observableCondition(params: PrevalenceParams): ConditionResult {
  const { beta_d, r_floor, kappa_0, T, g_bar } = params;
  let lhs: number;
  if (kappa_0 === 1) {
    lhs = beta_d * beta_d * r_floor * (T - 1);
  } else {
    lhs = beta_d * beta_d * r_floor * (1 - Math.pow(kappa_0, T - 1)) / (1 - kappa_0);
  }
  return {
    holds: lhs > g_bar,
    lhs,
    rhs: g_bar,
    gap: lhs - g_bar,
  };
}

/**
 * Compute the per-state suboptimality gap when the condition holds
 */
export function suboptimalityGap(params: PrevalenceParams): number {
  const obs = observableCondition(params);
  return Math.max(0, obs.gap);
}

/**
 * Generate phase map data: for a grid of (beta_d, g_bar) values,
 * evaluate whether the observable condition holds
 */
export function generatePhaseMap(
  params: PrevalenceParams,
  betaRange: [number, number] = [0, 0.5],
  gRange: [number, number] = [0, 1.0],
  resolution: number = 50
): { beta_d: number[]; g_bar: number[]; z: number[][] } {
  const betas = Array.from({ length: resolution }, (_, i) =>
    betaRange[0] + (betaRange[1] - betaRange[0]) * i / (resolution - 1)
  );
  const gbars = Array.from({ length: resolution }, (_, i) =>
    gRange[0] + (gRange[1] - gRange[0]) * i / (resolution - 1)
  );

  const z = gbars.map(g =>
    betas.map(b => {
      const result = observableCondition({ ...params, beta_d: b, g_bar: g });
      return result.gap;
    })
  );

  return { beta_d: betas, g_bar: gbars, z };
}

/** Preset environments from the paper */
export const PRESETS: Record<string, PrevalenceParams> = {
  'C-MAPSS (turbofan)': {
    beta_d: 0.12,
    g_bar: 0.18,
    kappa_0: 0.65,
    T: 130,
    r_floor: 0.13,
  },
  'Agent Robustness': {
    beta_d: 0.18,
    g_bar: 0.31,
    kappa_0: 0.70,
    T: 20,
    r_floor: 0.20,
  },
  'Ops Maintenance': {
    beta_d: 0.09,
    g_bar: 0.12,
    kappa_0: 0.75,
    T: 20,
    r_floor: 0.15,
  },
};
