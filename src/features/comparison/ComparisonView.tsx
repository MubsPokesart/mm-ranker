import { useMemo } from "react";
import type { Team, RegionState } from "../../engine/types";
import type { RegionId } from "../../config/constants";
import {
  REGION_DISPLAY_NAMES,
  MIN_COMPARISONS_TO_UNLOCK,
  TEAM_HEADER_COLORS,
} from "../../config/constants";
import { selectMatchup, updateRatings, makePairKey } from "../../engine/elo";
import { TeamCard } from "./TeamCard";
import { VoteButtons } from "./VoteButtons";
import "./ComparisonView.css";

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
  const teamIds = teams.map((t) => t.id);
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
      <div className="comparison-view">
        <p>No more matchups available.</p>
        {canReveal && (
          <button className="comparison-action-button comparison-rankings-button" onClick={onGoToRankings}>
            Go to Rankings
          </button>
        )}
      </div>
    );
  }

  const leftTeam = teamMap.get(matchup.leftTeamId);
  const rightTeam = teamMap.get(matchup.rightTeamId);
  if (!leftTeam || !rightTeam) return null;

  const leftColorIndex = teams.indexOf(leftTeam) % TEAM_HEADER_COLORS[regionId].length;
  const rightColorIndex = teams.indexOf(rightTeam) % TEAM_HEADER_COLORS[regionId].length;

  return (
    <div className="comparison-view">
      <div className="comparison-header">
        <button className="comparison-back-button" onClick={onBack}>
          ← Regions
        </button>
        <span className="comparison-region-name">{REGION_DISPLAY_NAMES[regionId]}</span>
        <span className="comparison-progress">
          {state.comparisons.length} / {MIN_COMPARISONS_TO_UNLOCK} comparisons
        </span>
      </div>

      <div className="comparison-matchup">
        <TeamCard team={leftTeam} headerColor={TEAM_HEADER_COLORS[regionId][leftColorIndex]!} />
        <VoteButtons onVote={handleVote} />
        <TeamCard team={rightTeam} headerColor={TEAM_HEADER_COLORS[regionId][rightColorIndex]!} />
      </div>

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
    </div>
  );
}
