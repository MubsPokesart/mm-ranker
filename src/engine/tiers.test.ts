import { describe, it, expect } from "vitest";
import { generateTiers } from "./tiers";
import type { Team } from "./types";

function makeTeam(id: string, name: string): Team {
  return { id, name, budget: 95, players: [] };
}

describe("generateTiers", () => {
  it("should place user's own team as solo tier 1", () => {
    const teams = [makeTeam("t1", "Team 1"), makeTeam("t2", "Team 2"), makeTeam("t3", "Team 3")];
    const ratings: Record<string, number> = { t1: 1400, t2: 1600, t3: 1500 };
    const tiers = generateTiers(teams, ratings, "t1");
    expect(tiers[0]!.tier).toBe(1);
    expect(tiers[0]!.teams).toHaveLength(1);
    expect(tiers[0]!.teams[0]!.id).toBe("t1");
  });

  it("should sort remaining teams by rating descending", () => {
    const teams = [makeTeam("t1", "A"), makeTeam("t2", "B"), makeTeam("t3", "C")];
    const ratings: Record<string, number> = { t1: 1400, t2: 1600, t3: 1500 };
    const tiers = generateTiers(teams, ratings, null);
    const allTeamIds = tiers.flatMap((t) => t.teams.map((team) => team.id));
    expect(allTeamIds).toEqual(["t2", "t3", "t1"]);
  });

  it("should produce between 4 and 7 tiers for 15 teams", () => {
    const teams = Array.from({ length: 15 }, (_, i) => makeTeam(`t${i}`, `Team ${i}`));
    const ratings: Record<string, number> = {};
    teams.forEach((t, i) => { ratings[t.id] = 1800 - i * 30; });
    const tiers = generateTiers(teams, ratings, null);
    expect(tiers.length).toBeGreaterThanOrEqual(4);
    expect(tiers.length).toBeLessThanOrEqual(7);
  });

  it("should fall back to balanced split when ratings are tightly clustered", () => {
    const teams = Array.from({ length: 12 }, (_, i) => makeTeam(`t${i}`, `Team ${i}`));
    const ratings: Record<string, number> = {};
    teams.forEach((t, i) => { ratings[t.id] = 1500 + i; });
    const tiers = generateTiers(teams, ratings, null);
    expect(tiers.length).toBeGreaterThanOrEqual(4);
    expect(tiers.length).toBeLessThanOrEqual(7);
  });

  it("should work with no user team selected", () => {
    const teams = [makeTeam("t1", "A"), makeTeam("t2", "B")];
    const ratings: Record<string, number> = { t1: 1600, t2: 1400 };
    const tiers = generateTiers(teams, ratings, null);
    expect(tiers[0]!.tier).toBe(1);
    expect(tiers[0]!.teams[0]!.id).toBe("t1");
  });

  it("should handle a single non-user team", () => {
    const teams = [makeTeam("t1", "A"), makeTeam("t2", "B")];
    const ratings: Record<string, number> = { t1: 1600, t2: 1400 };
    const tiers = generateTiers(teams, ratings, "t1");
    expect(tiers).toHaveLength(2);
    expect(tiers[0]!.teams[0]!.id).toBe("t1");
    expect(tiers[1]!.teams[0]!.id).toBe("t2");
  });
});
