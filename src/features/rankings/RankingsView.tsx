import type { Team, RegionState, TierGroup } from "../../engine/types";
import type { RegionId } from "../../config/constants";
import { REGION_DISPLAY_NAMES } from "../../config/constants";
import { generateTiers } from "../../engine/tiers";
import "./RankingsView.css";

interface RankingsViewProps {
  regionId: RegionId;
  teams: Team[];
  state: RegionState;
  onReset: () => void;
  onBack: () => void;
}

export function RankingsView({ regionId, teams, state, onReset, onBack }: RankingsViewProps) {
  const tiers: TierGroup[] = generateTiers(teams, state.ratings, state.myTeamId);

  return (
    <div className="rankings-view">
      <h2 className="rankings-title">{REGION_DISPLAY_NAMES[regionId]} Rankings</h2>

      <div className="rankings-tier-list">
        {tiers.map((tierGroup) => (
          <div key={tierGroup.tier} className="rankings-tier">
            <span className="rankings-tier-label">Tier {tierGroup.tier}:</span>
            <span className="rankings-tier-teams">
              {tierGroup.teams.map((t) => t.name).join(", ")}
            </span>
          </div>
        ))}
      </div>

      <div className="rankings-actions">
        <button className="rankings-back-button" onClick={onBack}>
          ← Regions
        </button>
        <button className="rankings-reset-button" onClick={onReset}>
          Reset Region
        </button>
      </div>
    </div>
  );
}
