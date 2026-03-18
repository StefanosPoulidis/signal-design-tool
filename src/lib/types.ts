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
  sigma_mu: number;  // softmax temperature
  alpha_att: number; // attention noise reduction
  rho: number;       // fatigue decay rate
  description: string;
  mechanism: string;
}

export interface GameState {
  health: number;       // 0-3 (poor, fair, good, very good)
  efficacy: 'H' | 'L';
  round: number;
  maxRounds: number;
  score: number;
  optimalScore: number;
  history: GameRound[];
  status: 'playing' | 'finished';
}

export interface GameRound {
  health: number;
  efficacy: 'H' | 'L';
  userChoice: 'signal' | 'silence';
  optimalChoice: 'signal' | 'silence';
  reward: number;
  optimalReward: number;
  newHealth: number;
  newEfficacy: 'H' | 'L';
  ide: IDEChannels;
}

export interface DeploymentNodeResult {
  passed: boolean;
  value: number;
  threshold: number;
  recommendation: string;
}

export type ModuleId = 'landing' | 'simulator' | 'ide' | 'scoreline' | 'archetypes' | 'game' | 'deployment' | 'governance';
