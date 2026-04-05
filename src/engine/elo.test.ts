import { describe, it, expect } from "vitest";
import { updateRatings, selectMatchup, makePairKey } from "./elo";

// ---------------------------------------------------------------------------
// updateRatings — Task 4
// ---------------------------------------------------------------------------

describe("updateRatings", () => {
  it("winner rating increases and loser decreases on strong prefer", () => {
    const ratings = { A: 1500, B: 1500 };
    const result = updateRatings(ratings, "A", "B", 1.0); // A wins decisively
    expect(result["A"]).toBeGreaterThan(1500);
    expect(result["B"]).toBeLessThan(1500);
  });

  it("rating changes are symmetric for equal-rated teams", () => {
    const ratings = { A: 1500, B: 1500 };
    const result = updateRatings(ratings, "A", "B", 1.0);
    const gainA = result["A"]! - 1500;
    const lossB = 1500 - result["B"]!;
    expect(gainA).toBeCloseTo(lossB, 10);
  });

  it("no change on even vote between equal teams", () => {
    const ratings = { A: 1500, B: 1500 };
    const result = updateRatings(ratings, "A", "B", 0.5); // EVEN
    expect(result["A"]).toBeCloseTo(1500, 10);
    expect(result["B"]).toBeCloseTo(1500, 10);
  });

  it("slight preference moves ratings less than strong preference", () => {
    const ratings = { A: 1500, B: 1500 };
    const strongResult = updateRatings(ratings, "A", "B", 1.0);
    const slightResult = updateRatings(ratings, "A", "B", 0.75);

    const strongGain = strongResult["A"]! - 1500;
    const slightGain = slightResult["A"]! - 1500;
    expect(slightGain).toBeGreaterThan(0);
    expect(slightGain).toBeLessThan(strongGain);
  });

  it("less change when beating a much lower-rated team", () => {
    const ratingsClose = { A: 1500, B: 1500 };
    const ratingsSkewed = { A: 1500, B: 1000 };

    const resultClose = updateRatings(ratingsClose, "A", "B", 1.0);
    const resultSkewed = updateRatings(ratingsSkewed, "A", "B", 1.0);

    const gainClose = resultClose["A"]! - 1500;
    const gainSkewed = resultSkewed["A"]! - 1500;

    // Beating a much weaker opponent should earn fewer points
    expect(gainSkewed).toBeLessThan(gainClose);
  });

  it("preserves ratings of uninvolved teams", () => {
    const ratings = { A: 1500, B: 1500, C: 1600, D: 1400 };
    const result = updateRatings(ratings, "A", "B", 1.0);
    expect(result["C"]).toBe(1600);
    expect(result["D"]).toBe(1400);
  });
});

// ---------------------------------------------------------------------------
// makePairKey
// ---------------------------------------------------------------------------

describe("makePairKey", () => {
  it("returns a canonical sorted key regardless of argument order", () => {
    expect(makePairKey("B", "A")).toBe(makePairKey("A", "B"));
    expect(makePairKey("Z", "A")).toBe("A-vs-Z");
  });
});

// ---------------------------------------------------------------------------
// selectMatchup — Task 5
// ---------------------------------------------------------------------------

describe("selectMatchup", () => {
  it("picks the least-compared team in phase 1 (coverage not met)", () => {
    // All teams have 0 comparisons → phase 1 triggers
    const teamIds = ["A", "B", "C", "D"];
    const ratings = {};
    const comparisonCounts = {};
    const pairCounts = {};

    // Run many times to confirm least-compared is always included
    for (let i = 0; i < 20; i++) {
      const result = selectMatchup(teamIds, ratings, comparisonCounts, pairCounts, null);
      expect(result).not.toBeNull();
      // Phase 1: least-compared (all 0) should be one of the two
      expect(result!.leftTeamId).toBeDefined();
      expect(result!.rightTeamId).toBeDefined();
    }
  });

  it("excludes the user's own team from all matchups", () => {
    const teamIds = ["A", "B", "C", "D"];
    const ratings = {};
    const comparisonCounts = {};
    const pairCounts = {};

    for (let i = 0; i < 20; i++) {
      const result = selectMatchup(teamIds, ratings, comparisonCounts, pairCounts, "A");
      expect(result).not.toBeNull();
      expect(result!.leftTeamId).not.toBe("A");
      expect(result!.rightTeamId).not.toBe("A");
    }
  });

  it("prefers similarly-rated teams in phase 2 (all coverage met)", () => {
    // MIN_COMPARISONS_PER_TEAM = 3, so give everyone 3+ comparisons
    const teamIds = ["A", "B", "C"];
    const ratings = { A: 1500, B: 1505, C: 1700 }; // B is closest to A
    const comparisonCounts = { A: 3, B: 3, C: 3 };
    const pairCounts = {};

    const result = selectMatchup(teamIds, ratings, comparisonCounts, pairCounts, null);
    expect(result).not.toBeNull();
    // A vs B has smallest rating diff (5), should be selected
    const ids = [result!.leftTeamId, result!.rightTeamId].sort();
    expect(ids).toEqual(["A", "B"]);
  });

  it("avoids pairs that have been compared many times in phase 2", () => {
    const teamIds = ["A", "B", "C"];
    const ratings = { A: 1500, B: 1501, C: 1502 }; // all nearly equal
    const comparisonCounts = { A: 3, B: 3, C: 3 };
    // A-vs-B has been compared many times — penalty makes it less attractive
    const pairCounts = { [makePairKey("A", "B")]: 10 };

    const result = selectMatchup(teamIds, ratings, comparisonCounts, pairCounts, null);
    expect(result).not.toBeNull();
    // A-vs-B score = |1500-1501| + 10*200 = 2001
    // A-vs-C score = |1500-1502| + 0*200 = 2
    // B-vs-C score = |1501-1502| + 0*200 = 1  ← best
    const ids = [result!.leftTeamId, result!.rightTeamId].sort();
    expect(ids).toEqual(["B", "C"]);
  });

  it("returns null when fewer than 2 eligible teams", () => {
    // Only 1 team after excluding user's own
    const result = selectMatchup(["A", "B"], {}, {}, {}, "A");
    expect(result).toBeNull();

    // 0 teams
    const result2 = selectMatchup([], {}, {}, {}, null);
    expect(result2).toBeNull();

    // Only 1 team total
    const result3 = selectMatchup(["A"], {}, {}, {}, null);
    expect(result3).toBeNull();
  });
});
