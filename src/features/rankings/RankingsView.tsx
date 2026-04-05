import type { Team, RegionState, TierGroup } from "../../engine/types";
import type { RegionId } from "../../config/constants";
import { REGION_DISPLAY_NAMES } from "../../config/constants";
import { generateTiers } from "../../engine/tiers";
import teamColorsData from "../../config/team-colors.json";
import "./RankingsView.css";

const teamColors = teamColorsData as Record<string, { bg: string; headerText: string; cellText: string }>;

const DEFAULT_COLORS = { bg: "#1c1c2e", headerText: "#ffffff", cellText: "#cccccc" };

function getTeamColors(teamId: string) {
  return teamColors[teamId] ?? DEFAULT_COLORS;
}

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
    <main className="rankings-view">
      <h2 className="rankings-title">{REGION_DISPLAY_NAMES[regionId]} Rankings</h2>

      <div className="rankings-tier-list">
        {tiers.map((tierGroup) => (
          <div key={tierGroup.tier} className="rankings-tier">
            <span className="rankings-tier-label">Tier {tierGroup.tier}</span>
            <div className="rankings-tier-teams">
              {tierGroup.teams.map((t) => {
                const colors = getTeamColors(t.id);
                return (
                  <span
                    key={t.id}
                    className="rankings-team-badge"
                    style={{ background: colors.bg, color: colors.headerText }}
                  >
                    {t.name}
                  </span>
                );
              })}
            </div>
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
    </main>
  );
}
