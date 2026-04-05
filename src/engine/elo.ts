import { ELO_K_FACTOR, MIN_COMPARISONS_PER_TEAM } from "../config/constants";

interface MatchupResult {
  leftTeamId: string;
  rightTeamId: string;
}

export function updateRatings(
  ratings: Record<string, number>,
  leftTeamId: string,
  rightTeamId: string,
  scoreLeft: number
): Record<string, number> {
  const ratingLeft = ratings[leftTeamId] ?? 1500;
  const ratingRight = ratings[rightTeamId] ?? 1500;

  const expectedLeft = 1 / (1 + Math.pow(10, (ratingRight - ratingLeft) / 400));
  const expectedRight = 1 - expectedLeft;

  const scoreRight = 1 - scoreLeft;

  const newRatingLeft = ratingLeft + ELO_K_FACTOR * (scoreLeft - expectedLeft);
  const newRatingRight = ratingRight + ELO_K_FACTOR * (scoreRight - expectedRight);

  return {
    ...ratings,
    [leftTeamId]: newRatingLeft,
    [rightTeamId]: newRatingRight,
  };
}

export function makePairKey(idA: string, idB: string): string {
  return [idA, idB].sort().join("-vs-");
}

export function selectMatchup(
  teamIds: string[],
  ratings: Record<string, number>,
  comparisonCounts: Record<string, number>,
  pairCounts: Record<string, number>,
  excludeTeamId: string | null
): MatchupResult | null {
  const eligible = teamIds.filter((id) => id !== excludeTeamId);
  if (eligible.length < 2) return null;

  const allCovered = eligible.every(
    (id) => (comparisonCounts[id] ?? 0) >= MIN_COMPARISONS_PER_TEAM
  );

  if (!allCovered) {
    // Phase 1: pick least-compared team, pair with random opponent
    const sorted = [...eligible].sort(
      (a, b) => (comparisonCounts[a] ?? 0) - (comparisonCounts[b] ?? 0)
    );
    const leastCompared = sorted[0]!;
    const opponents = eligible.filter((id) => id !== leastCompared);
    const opponent = opponents[Math.floor(Math.random() * opponents.length)]!;
    return { leftTeamId: leastCompared, rightTeamId: opponent };
  }

  // Phase 2: find closest-rated pair with fewest pair comparisons
  let bestPair: MatchupResult | null = null;
  let bestScore = Infinity;

  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      const idA = eligible[i]!;
      const idB = eligible[j]!;
      const ratingDiff = Math.abs((ratings[idA] ?? 1500) - (ratings[idB] ?? 1500));
      const pairCount = pairCounts[makePairKey(idA, idB)] ?? 0;
      const score = ratingDiff + pairCount * 200;
      if (score < bestScore) {
        bestScore = score;
        bestPair = { leftTeamId: idA, rightTeamId: idB };
      }
    }
  }
  return bestPair;
}
