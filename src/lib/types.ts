/** Shared type definitions for the signal design tool */

export interface PrevalenceParams {
  beta_d: number;   // drift intensity
  g_bar: number;    // best one-step gain
  kappa_0: number;  // efficacy persistence
  T: number;        // horizon
  r_floor: number;  // reward floor
}

export interface ConditionResult {
  holds: boolean;
  lhs: number;
  rhs: number;
  gap: number;      // lhs - rhs (positive = condition holds)
}

export interface IDEChannels {
  I: number;  // Immediate quality gain
  D: number;  // Displacement effect
  E: number;  // Efficacy drift cost
  total: number;
}

export interface IDEParams {
  phi: number;         // compliance
  beta_d: number;      // drift intensity
  q_base: number;      // baseline decision quality (without AI)
  r_signal: number;    // reward under signal action
  r_nosignal: number;  // reward under no-signal action
  deltaV: number;      // value gap
  kappa_0: number;     // efficacy persistence
}

export interface ScoreLevel {
  label: string;
  G: number;   // gain relative to silence
  Psi: number; // displacement relative to silence
}

export interface ArchetypeParams {
  name: string;
  q_base: number;    // baseline decision quality
  phi: number;       // action-signal compliance
  sigma_mu: number;  // sigmoid temperature (binary choice noise)
  alpha_att: number; // attention noise reduction
  rho: number;       // fatigue decay rate
  description: string;
  mechanism: string;
  [key: string]: string | number; // index signature for dynamic access
}

export type ModuleId = 'landing' | 'simulator' | 'ide' | 'scoreline' | 'archetypes';
