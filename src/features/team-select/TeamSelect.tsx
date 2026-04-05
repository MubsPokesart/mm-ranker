import type { Team } from "../../engine/types";
import { REGION_DISPLAY_NAMES, type RegionId } from "../../config/constants";
import "./TeamSelect.css";

interface TeamSelectProps {
  regionId: RegionId;
  teams: Team[];
  onSelect: (teamId: string | null) => void;
}

export function TeamSelect({ regionId, teams, onSelect }: TeamSelectProps) {
  return (
    <div className="team-select">
      <h2 className="team-select-title">{REGION_DISPLAY_NAMES[regionId]}</h2>
      <p className="team-select-prompt">Do you have a team in this region?</p>
      <div className="team-select-list">
        {teams.map((team) => (
          <button
            key={team.id}
            className="team-select-option"
            onClick={() => onSelect(team.id)}
          >
            {team.name}
          </button>
        ))}
        <button
          className="team-select-option team-select-none"
          onClick={() => onSelect(null)}
        >
          No, I don't
        </button>
      </div>
    </div>
  );
}
