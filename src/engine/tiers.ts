import type { Team, TierGroup } from "./types";
import { TIER_MIN_COUNT, TIER_MAX_COUNT } from "../config/constants";

export function generateTiers(
  teams: Team[],
  ratings: Record<string, number>,
  myTeamId: string | null
): TierGroup[] {
  const tiers: TierGroup[] = [];
  let tierNumber = 1;

  // User's own team is always solo Tier 1
  if (myTeamId !== null) {
    const myTeam = teams.find((t) => t.id === myTeamId);
    if (myTeam) {
      tiers.push({ tier: tierNumber, teams: [myTeam] });
      tierNumber++;
    }
  }

  // Sort remaining teams by rating descending
  const remaining = teams
    .filter((t) => t.id !== myTeamId)
    .sort((a, b) => (ratings[b.id] ?? 0) - (ratings[a.id] ?? 0));

  if (remaining.length === 0) return tiers;

  if (remaining.length <= 3) {
    for (const team of remaining) {
      tiers.push({ tier: tierNumber, teams: [team] });
      tierNumber++;
    }
    return tiers;
  }

  // Calculate gaps between consecutive ratings
  const gaps: { index: number; gap: number }[] = [];
  for (let i = 0; i < remaining.length - 1; i++) {
    const ratingA = ratings[remaining[i]!.id] ?? 0;
    const ratingB = ratings[remaining[i + 1]!.id] ?? 0;
    gaps.push({ index: i, gap: ratingA - ratingB });
  }

  // Check if ratings are tightly clustered
  const maxGap = Math.max(...gaps.map((g) => g.gap));
  const avgGap = gaps.reduce((sum, g) => sum + g.gap, 0) / gaps.length;
  const isClustered = maxGap < avgGap * 2 || maxGap < 10;

  let splitIndices: number[];

  if (isClustered) {
    const targetTiers = Math.min(TIER_MIN_COUNT, remaining.length);
    const baseSize = Math.floor(remaining.length / targetTiers);
    const extras = remaining.length % targetTiers;
    splitIndices = [];
    let pos = 0;
    for (let i = 0; i < targetTiers - 1; i++) {
      pos += baseSize + (i < extras ? 1 : 0);
      splitIndices.push(pos - 1);
    }
  } else {
    const sortedGaps = [...gaps].sort((a, b) => b.gap - a.gap);
    splitIndices = [];
    for (let i = 0; i < sortedGaps.length && splitIndices.length < TIER_MAX_COUNT - 1; i++) {
      if (splitIndices.length >= TIER_MIN_COUNT - 1 && sortedGaps[i]!.gap <= avgGap) {
        break;
      }
      splitIndices.push(sortedGaps[i]!.index);
    }
    splitIndices.sort((a, b) => a - b);
  }

  // Build tiers from split indices
  let start = 0;
  for (const splitAt of splitIndices) {
    const tierTeams = remaining.slice(start, splitAt + 1);
    if (tierTeams.length > 0) {
      tiers.push({ tier: tierNumber, teams: tierTeams });
      tierNumber++;
    }
    start = splitAt + 1;
  }

  const finalTeams = remaining.slice(start);
  if (finalTeams.length > 0) {
    tiers.push({ tier: tierNumber, teams: finalTeams });
  }

  return tiers;
}
