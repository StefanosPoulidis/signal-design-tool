import type { ScoreLevel } from './types';

/**
 * Compute score S_l(x; lambda) = G_l - lambda * Psi_l for each level
 */
export function computeScores(
  levels: ScoreLevel[],
  lambda: number
): { label: string; score: number }[] {
  return levels.map(l => ({
    label: l.label,
    score: l.G - lambda * l.Psi,
  }));
}

/**
 * Find the optimal level at a given lambda
 */
export function optimalLevel(levels: ScoreLevel[], lambda: number): number {
  const scores = computeScores(levels, lambda);
  let bestIdx = 0;
  let bestScore = scores[0].score;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i].score > bestScore) {
      bestScore = scores[i].score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Compute the upper concave envelope (efficient levels) in (Psi, G) space.
 * Returns indices of efficient levels.
 */
export function computeEfficientLevels(levels: ScoreLevel[]): number[] {
  if (levels.length <= 1) return [0];

  // Sort by Psi (ascending)
  const indexed = levels.map((l, i) => ({ ...l, idx: i }));
  indexed.sort((a, b) => a.Psi - b.Psi);

  // Build upper convex hull using Andrew's monotone chain
  // In (Psi, G) space, we want points on the upper envelope
  const hull: number[] = [];

  for (const pt of indexed) {
    while (hull.length >= 2) {
      const a = levels[hull[hull.length - 2]];
      const b = levels[hull[hull.length - 1]];
      // Cross product: if turning clockwise or collinear, remove last point
      const cross = (b.Psi - a.Psi) * (pt.G - a.G) - (b.G - a.G) * (pt.Psi - a.Psi);
      if (cross >= 0) {
        hull.pop();
      } else {
        break;
      }
    }
    hull.push(pt.idx);
  }

  return hull;
}

/**
 * Compute lambda thresholds where optimal level switches
 */
export function computeThresholds(
  levels: ScoreLevel[],
  efficientIndices: number[]
): { lambda: number; fromLevel: number; toLevel: number }[] {
  if (efficientIndices.length <= 1) return [];

  const thresholds: { lambda: number; fromLevel: number; toLevel: number }[] = [];

  // Sort efficient levels by Psi (ascending) — higher Psi = more intense signal
  const sorted = [...efficientIndices].sort((a, b) => levels[a].Psi - levels[b].Psi);

  for (let i = 0; i < sorted.length - 1; i++) {
    const j = sorted[i];
    const k = sorted[i + 1];
    const dPsi = levels[k].Psi - levels[j].Psi;
    if (Math.abs(dPsi) < 1e-10) continue;
    const lambda = (levels[k].G - levels[j].G) / dPsi;
    if (lambda >= 0) {
      thresholds.push({
        lambda,
        fromLevel: k, // higher intensity active at lower lambda
        toLevel: j,   // lower intensity active at higher lambda
      });
    }
  }

  thresholds.sort((a, b) => a.lambda - b.lambda);
  return thresholds;
}

/**
 * Generate score line data for plotting
 */
export function generateScoreLineData(
  levels: ScoreLevel[],
  lambdaMax: number = 5,
  resolution: number = 200
): { lambdas: number[]; scores: number[][] } {
  const lambdas = Array.from({ length: resolution }, (_, i) =>
    (lambdaMax * i) / (resolution - 1)
  );

  const scores = levels.map(level =>
    lambdas.map(lam => level.G - lam * level.Psi)
  );

  return { lambdas, scores };
}

/** Default 5-level menu from the paper */
export const DEFAULT_LEVELS: ScoreLevel[] = [
  { label: 'Silence', G: 0, Psi: 0 },
  { label: 'Alert', G: 0.15, Psi: 0.05 },
  { label: 'Partial Info', G: 0.35, Psi: 0.15 },
  { label: 'Guided', G: 0.50, Psi: 0.30 },
  { label: 'Full Rx', G: 0.55, Psi: 0.55 },
];
