import type { RegionState } from "../engine/types";
import { STORAGE_KEY_PREFIX, ELO_INITIAL_RATING } from "../config/constants";

function storageKey(regionId: string): string {
  return `${STORAGE_KEY_PREFIX}-${regionId}`;
}

export function createInitialState(teamIds: string[]): RegionState {
  const ratings: Record<string, number> = {};
  const comparisonCounts: Record<string, number> = {};
  for (const id of teamIds) {
    ratings[id] = ELO_INITIAL_RATING;
    comparisonCounts[id] = 0;
  }
  return {
    myTeamId: null,
    comparisons: [],
    ratings,
    comparisonCounts,
    pairCounts: {},
    rankingsRevealed: false,
  };
}

export function loadRegionState(regionId: string, teamIds: string[]): RegionState {
  const raw = localStorage.getItem(storageKey(regionId));
  if (!raw) return createInitialState(teamIds);
  try {
    return JSON.parse(raw) as RegionState;
  } catch {
    return createInitialState(teamIds);
  }
}

export function saveRegionState(regionId: string, state: RegionState): void {
  localStorage.setItem(storageKey(regionId), JSON.stringify(state));
}

export function resetRegionState(regionId: string): void {
  localStorage.removeItem(storageKey(regionId));
}
