import type { Region, Team } from "../../../engine/types";
import { REGION_DISPLAY_NAMES, type RegionId } from "../../../config/constants";

export interface CatalogEntry {
  team: Team;
  regionId: RegionId;
  regionName: string;
}

export function buildCatalog(regions: Record<string, Region>): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  for (const regionId of Object.keys(REGION_DISPLAY_NAMES) as RegionId[]) {
    const region = regions[regionId];
    if (!region) continue;
    for (const team of region.teams) {
      entries.push({ team, regionId, regionName: REGION_DISPLAY_NAMES[regionId] });
    }
  }
  return entries;
}

export function searchCatalog(catalog: CatalogEntry[], query: string, limit = 8): CatalogEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return [];
  const matches: CatalogEntry[] = [];
  for (const entry of catalog) {
    if (entry.team.name.toLowerCase().includes(trimmed)) {
      matches.push(entry);
      if (matches.length >= limit) break;
    }
  }
  return matches;
}
