export interface Player {
  name: string;
  year: string;
  price: number;
}

export interface Team {
  id: string;
  name: string;
  budget: number;
  players: Player[]; // first 5 starters, last 5 bench
}

export interface Region {
  id: string;
  name: string;
  teams: Team[];
}

export interface Comparison {
  leftTeamId: string;
  rightTeamId: string;
  score: number; // 1.0, 0.5, 0, -0.5, -1.0
  timestamp: number;
}

export interface RegionState {
  myTeamId: string | null;
  comparisons: Comparison[];
  ratings: Record<string, number>;
  comparisonCounts: Record<string, number>;
  pairCounts: Record<string, number>; // key: sorted "idA-vs-idB"
  rankingsRevealed: boolean;
}

export interface TierGroup {
  tier: number;
  teams: Team[];
}

export type ViewState =
  | { view: "landing" }
  | { view: "team-select"; regionId: string }
  | { view: "comparison"; regionId: string }
  | { view: "rankings"; regionId: string }
  | { view: "draft-management" }
  | { view: "draft-management-matchup" }
  | { view: "draft-management-form" };
