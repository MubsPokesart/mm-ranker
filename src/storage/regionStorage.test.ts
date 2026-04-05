import { describe, it, expect, beforeEach } from "vitest";
import { loadRegionState, saveRegionState, resetRegionState, createInitialState } from "./regionStorage";

describe("regionStorage", () => {
  beforeEach(() => { localStorage.clear(); });

  it("should return initial state when no saved state exists", () => {
    const teamIds = ["t1", "t2", "t3"];
    const state = loadRegionState("east", teamIds);
    expect(state.myTeamId).toBeNull();
    expect(state.comparisons).toEqual([]);
    expect(state.rankingsRevealed).toBe(false);
    expect(state.ratings.t1).toBe(1500);
    expect(state.ratings.t2).toBe(1500);
    expect(state.ratings.t3).toBe(1500);
  });

  it("should round-trip save and load", () => {
    const teamIds = ["t1", "t2"];
    const state = createInitialState(teamIds);
    state.myTeamId = "t1";
    state.ratings.t2 = 1550;
    state.comparisons.push({ leftTeamId: "t1", rightTeamId: "t2", score: 1.0, timestamp: Date.now() });
    saveRegionState("east", state);
    const loaded = loadRegionState("east", teamIds);
    expect(loaded.myTeamId).toBe("t1");
    expect(loaded.ratings.t2).toBe(1550);
    expect(loaded.comparisons).toHaveLength(1);
  });

  it("should reset to initial state", () => {
    const teamIds = ["t1", "t2"];
    const state = createInitialState(teamIds);
    state.myTeamId = "t1";
    state.rankingsRevealed = true;
    saveRegionState("east", state);
    resetRegionState("east");
    const loaded = loadRegionState("east", teamIds);
    expect(loaded.myTeamId).toBeNull();
    expect(loaded.rankingsRevealed).toBe(false);
  });

  it("should not interfere between regions", () => {
    const teamIds = ["t1"];
    const eastState = createInitialState(teamIds);
    eastState.myTeamId = "t1";
    saveRegionState("east", eastState);
    const westState = loadRegionState("west", teamIds);
    expect(westState.myTeamId).toBeNull();
  });
});
