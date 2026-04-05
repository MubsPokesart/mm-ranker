import { useMemo } from "react";
import type { Team, RegionState } from "../../engine/types";
import type { RegionId } from "../../config/constants";
import {
  REGION_DISPLAY_NAMES,
  MIN_COMPARISONS_TO_UNLOCK,
} from "../../config/constants";
import { selectMatchup, updateRatings, makePairKey } from "../../engine/elo";
import { TeamCard } from "./TeamCard";
import { VoteButtons } from "./VoteButtons";
import teamColorsData from "../../config/team-colors.json";
import "./ComparisonView.css";

const teamColors = teamColorsData as Record<string, { bg: string; headerText: string; cellText: string }>;

const DEFAULT_COLORS = { bg: "#1c1c2e", headerText: "#ffffff", cellText: "#cccccc" };

function getTeamColors(teamId: string) {
  return teamColors[teamId] ?? DEFAULT_COLORS;
}

interface ComparisonViewProps {
  regionId: RegionId;
  teams: Team[];
  state: RegionState;
  onStateChange: (state: RegionState) => void;
  onGoToRankings: () => void;
  onReset: () => void;
  onBack: () => void;
}

export function ComparisonView({
  regionId,
  teams,
  state,
  onStateChange,
  onGoToRankings,
  onReset,
  onBack,
}: ComparisonViewProps) {
  const teamIds = useMemo(() => teams.map((t) => t.id), [teams]);
  const teamMap = useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams]
  );

  const matchup = useMemo(
    () =>
      selectMatchup(
        teamIds,
        state.ratings,
        state.comparisonCounts,
        state.pairCounts,
        state.myTeamId
      ),
    [teamIds, state.ratings, state.comparisonCounts, state.pairCounts, state.myTeamId]
  );

  const canReveal = state.comparisons.length >= MIN_COMPARISONS_TO_UNLOCK;

  function handleVote(score: number) {
    if (!matchup) return;

    const newRatings = updateRatings(
      state.ratings,
      matchup.leftTeamId,
      matchup.rightTeamId,
      score
    );

    const pairKey = makePairKey(matchup.leftTeamId, matchup.rightTeamId);

    onStateChange({
      ...state,
      comparisons: [
        ...state.comparisons,
        {
          leftTeamId: matchup.leftTeamId,
          rightTeamId: matchup.rightTeamId,
          score,
          timestamp: Date.now(),
        },
      ],
      ratings: newRatings,
      comparisonCounts: {
        ...state.comparisonCounts,
        [matchup.leftTeamId]: (state.comparisonCounts[matchup.leftTeamId] ?? 0) + 1,
        [matchup.rightTeamId]: (state.comparisonCounts[matchup.rightTeamId] ?? 0) + 1,
      },
      pairCounts: {
        ...state.pairCounts,
        [pairKey]: (state.pairCounts[pairKey] ?? 0) + 1,
      },
    });
  }

  if (!matchup) {
    return (
      <main className="comparison-view">
        <h2 className="comparison-region-name">All matchups completed</h2>
        <p style={{ color: "var(--color-text-muted)" }}>
          You've compared every available pair in this region.
        </p>
        {canReveal && (
          <button className="comparison-action-button comparison-rankings-button" onClick={onGoToRankings}>
            Go to Rankings
          </button>
        )}
        <button className="comparison-action-button comparison-reset-button" onClick={onReset}>
          Reset
        </button>
      </main>
    );
  }

  const leftTeam = teamMap.get(matchup.leftTeamId);
  const rightTeam = teamMap.get(matchup.rightTeamId);
  if (!leftTeam || !rightTeam) return null;

  return (
    <main className="comparison-view">
      <nav className="comparison-header" aria-label="Navigation">
        <button className="comparison-back-button" onClick={onBack}>
          ← Regions
        </button>
        <span className="comparison-region-name">{REGION_DISPLAY_NAMES[regionId]}</span>
        <span className="comparison-progress">
          {state.comparisons.length} / {MIN_COMPARISONS_TO_UNLOCK} comparisons
        </span>
      </nav>

      <section className="comparison-cards" aria-label="Team comparison">
        <TeamCard team={leftTeam} colors={getTeamColors(leftTeam.id)} />
        <TeamCard team={rightTeam} colors={getTeamColors(rightTeam.id)} />
      </section>

      <VoteButtons onVote={handleVote} leftTeamName={leftTeam.name} rightTeamName={rightTeam.name} />

      <div className="comparison-actions">
        {canReveal && (
          <button className="comparison-action-button comparison-rankings-button" onClick={onGoToRankings}>
            Go to Rankings
          </button>
        )}
        <button className="comparison-action-button comparison-reset-button" onClick={onReset}>
          Reset
        </button>
      </div>
    </main>
  );
}
