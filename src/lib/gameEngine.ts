import type { GameState, GameRound, IDEChannels } from './types';

const HEALTH_LABELS = ['Poor', 'Fair', 'Good', 'Very Good'];

/** Pre-computed optimal policy for the game MDP */
interface GameMDP {
  T: number;
  nHealth: number;
  beta_d: number;
  g_bar: number;
  kappa_0: number;
  r_floor: number;
  V: Float64Array; // V[t * nHealth * 2 + h * 2 + c]
}

function idx(mdp: GameMDP, t: number, h: number, c: number): number {
  return t * mdp.nHealth * 2 + h * 2 + c;
}

/** Reward function: higher health = higher reward, H efficacy adds bonus */
function reward(h: number, nHealth: number, signal: boolean, g_bar: number): number {
  const baseR = h / (nHealth - 1);
  return signal ? baseR + g_bar : baseR;
}

/** Build and solve the game MDP via backward induction */
function solveGameMDP(
  T: number,
  nHealth: number,
  beta_d: number,
  g_bar: number,
  kappa_0: number,
  r_floor: number
): GameMDP {
  const mdp: GameMDP = {
    T, nHealth, beta_d, g_bar, kappa_0, r_floor,
    V: new Float64Array(T * nHealth * 2),
  };

  // Terminal values
  for (let h = 0; h < nHealth; h++) {
    for (let c = 0; c < 2; c++) {
      mdp.V[idx(mdp, T - 1, h, c)] = reward(h, nHealth, false, 0);
    }
  }

  // Backward induction
  for (let t = T - 2; t >= 0; t--) {
    for (let h = 0; h < nHealth; h++) {
      for (let c = 0; c < 2; c++) {
        // Q-values for signal and silence
        const qSignal = computeQ(mdp, t, h, c, true);
        const qSilence = computeQ(mdp, t, h, c, false);
        mdp.V[idx(mdp, t, h, c)] = Math.max(qSignal, qSilence);
      }
    }
  }

  return mdp;
}

function computeQ(mdp: GameMDP, t: number, h: number, c: number, signal: boolean): number {
  const { nHealth, beta_d, g_bar, kappa_0 } = mdp;

  // Immediate reward
  const r = reward(h, nHealth, signal, signal ? g_bar : 0);

  // Health transition: slight degradation tendency, independent of action
  // P(h' = h-1) = 0.3, P(h' = h) = 0.5, P(h' = h+1) = 0.2
  let ev = 0;
  const healthTransProbs = [
    { dh: -1, p: 0.3 },
    { dh: 0, p: 0.5 },
    { dh: 1, p: 0.2 },
  ];

  for (const { dh, p: pHealth } of healthTransProbs) {
    const hNext = Math.max(0, Math.min(nHealth - 1, h + dh));

    // Efficacy transition depends on signal and current efficacy
    let pHighNext: number;
    if (c === 0) { // currently H
      if (signal) {
        // Signal degrades: P(stay H) = 1 - beta_d
        pHighNext = 1 - beta_d;
      } else {
        // Silence preserves: P(stay H) = 1
        pHighNext = 1;
      }
    } else { // currently L
      if (signal) {
        // Even harder to recover under signal
        pHighNext = (1 - kappa_0) * 0.3;
      } else {
        // Can partially recover under silence
        pHighNext = (1 - kappa_0) * 0.8;
      }
    }

    const vH = mdp.V[idx(mdp, t + 1, hNext, 0)];
    const vL = mdp.V[idx(mdp, t + 1, hNext, 1)];
    ev += pHealth * (pHighNext * vH + (1 - pHighNext) * vL);
  }

  return r + ev;
}

function getOptimalAction(mdp: GameMDP, t: number, h: number, c: number): 'signal' | 'silence' {
  const qSignal = computeQ(mdp, t, h, c, true);
  const qSilence = computeQ(mdp, t, h, c, false);
  return qSignal > qSilence ? 'signal' : 'silence';
}

/** Compute a simplified IDE for display in the game */
function computeGameIDE(
  h: number, nHealth: number, c: number,
  beta_d: number, g_bar: number, deltaV: number
): IDEChannels {
  const I = g_bar * (c === 0 ? 1 : 0.5); // Immediate gain (less at low efficacy)
  const D = 0.05 * (h / (nHealth - 1)); // Small displacement
  const E = c === 0 ? -beta_d * deltaV : -beta_d * deltaV * 0.3; // Efficacy drift cost
  return { I, D, E, total: I + D + E };
}

// --- Public API ---

let cachedMDP: GameMDP | null = null;

function getMDP(difficulty: 'easy' | 'medium' | 'hard'): GameMDP {
  const configs = {
    easy: { T: 10, nHealth: 2, beta_d: 0.25, g_bar: 0.15, kappa_0: 0.7, r_floor: 0.1 },
    medium: { T: 15, nHealth: 3, beta_d: 0.18, g_bar: 0.20, kappa_0: 0.65, r_floor: 0.13 },
    hard: { T: 20, nHealth: 4, beta_d: 0.12, g_bar: 0.25, kappa_0: 0.60, r_floor: 0.10 },
  };
  const cfg = configs[difficulty];
  cachedMDP = solveGameMDP(cfg.T, cfg.nHealth, cfg.beta_d, cfg.g_bar, cfg.kappa_0, cfg.r_floor);
  return cachedMDP;
}

export function initGame(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): GameState {
  const mdp = getMDP(difficulty);
  return {
    health: Math.floor(mdp.nHealth / 2),
    efficacy: 'H',
    round: 0,
    maxRounds: mdp.T,
    score: 0,
    optimalScore: 0,
    history: [],
    status: 'playing',
  };
}

export function playRound(
  state: GameState,
  choice: 'signal' | 'silence'
): GameState {
  if (state.status === 'finished' || !cachedMDP) return state;

  const mdp = cachedMDP;
  const h = state.health;
  const c = state.efficacy === 'H' ? 0 : 1;
  const t = state.round;

  const optimalChoice = getOptimalAction(mdp, t, h, c);

  // Compute rewards
  const userReward = reward(h, mdp.nHealth, choice === 'signal', choice === 'signal' ? mdp.g_bar : 0);
  const optReward = reward(h, mdp.nHealth, optimalChoice === 'signal', optimalChoice === 'signal' ? mdp.g_bar : 0);

  // Transition health (deterministic for game clarity)
  const healthDelta = Math.random() < 0.3 ? -1 : Math.random() < 0.7 ? 0 : 1;
  const newHealth = Math.max(0, Math.min(mdp.nHealth - 1, h + healthDelta));

  // Transition efficacy based on user's choice
  let newEfficacy: 'H' | 'L';
  if (state.efficacy === 'H') {
    newEfficacy = (choice === 'signal' && Math.random() < mdp.beta_d) ? 'L' : 'H';
  } else {
    const recoverProb = choice === 'silence' ? (1 - mdp.kappa_0) * 0.8 : (1 - mdp.kappa_0) * 0.3;
    newEfficacy = Math.random() < recoverProb ? 'H' : 'L';
  }

  // Compute approximate value gap for IDE display
  const deltaV = c === 0 ? (mdp.V[idx(mdp, Math.min(t + 1, mdp.T - 1), h, 0)] - mdp.V[idx(mdp, Math.min(t + 1, mdp.T - 1), h, 1)]) : 0.5;
  const ide = computeGameIDE(h, mdp.nHealth, c, mdp.beta_d, mdp.g_bar, deltaV);

  const round: GameRound = {
    health: h,
    efficacy: state.efficacy,
    userChoice: choice,
    optimalChoice,
    reward: userReward,
    optimalReward: optReward,
    newHealth,
    newEfficacy,
    ide,
  };

  const newRound = state.round + 1;
  return {
    health: newHealth,
    efficacy: newEfficacy,
    round: newRound,
    maxRounds: state.maxRounds,
    score: state.score + userReward,
    optimalScore: state.optimalScore + optReward,
    history: [...state.history, round],
    status: newRound >= state.maxRounds ? 'finished' : 'playing',
  };
}

export function getHealthLabel(h: number): string {
  return HEALTH_LABELS[h] || `Level ${h}`;
}

export { HEALTH_LABELS };
