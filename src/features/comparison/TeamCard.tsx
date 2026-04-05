import type { Team } from "../../engine/types";
import "./TeamCard.css";

interface TeamCardProps {
  team: Team;
  colors: {
    bg: string;
    headerText: string;
    cellText: string;
  };
}

export function TeamCard({ team, colors }: TeamCardProps) {
  return (
    <div className="team-card" style={{ background: colors.bg }}>
      <div className="team-card-header" style={{ color: colors.headerText }}>
        <div className="team-card-header-name">{team.name}</div>
        <div className="team-card-header-label">Year</div>
      </div>
      {team.players.map((player, index) => (
        <div className="team-card-row" key={index} style={{ color: colors.cellText }}>
          <div className="team-card-player-name">{player.name}</div>
          <div className="team-card-player-year">{player.year}</div>
        </div>
      ))}
    </div>
  );
}
