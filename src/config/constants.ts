export const ELO_INITIAL_RATING = 1500;
export const ELO_K_FACTOR = 32;

export const MIN_COMPARISONS_PER_TEAM = 3;
export const MIN_COMPARISONS_TO_UNLOCK = 15;

export const TIER_MIN_COUNT = 4;
export const TIER_MAX_COUNT = 7;

export const VOTE_SCORES = {
  STRONGLY_LEFT: 1.0,
  SLIGHTLY_LEFT: 0.75,
  EVEN: 0.5,
  SLIGHTLY_RIGHT: 0.25,
  STRONGLY_RIGHT: 0.0,
} as const;

export const REGION_IDS = ["east", "south", "west", "midwest"] as const;
export type RegionId = (typeof REGION_IDS)[number];

export const REGION_DISPLAY_NAMES: Record<RegionId, string> = {
  east: "Draft 78 East",
  south: "Draft 78 South",
  west: "Draft 78 West",
  midwest: "Draft 78 Midwest",
};

export const TEAM_HEADER_COLORS: Record<RegionId, string[]> = {
  east: ["#b54a2e", "#2e6b8a", "#4a7a3e", "#8a5e2e"],
  south: ["#7a2e8a", "#2e8a5e", "#8a2e3e", "#2e4a8a"],
  west: ["#8a6b2e", "#3e5a8a", "#5e2e7a", "#2e8a7a"],
  midwest: ["#3e7a4a", "#6b3e8a", "#8a3e5e", "#2e6a8a"],
};

export const STORAGE_KEY_PREFIX = "mm-ranker";
