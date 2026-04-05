import type { Team } from "../../engine/types";
import "./TeamCard.css";

interface TeamCardProps {
  team: Team;
  headerColor: string;
}

export function TeamCard({ team, headerColor }: TeamCardProps) {
  return (
    <div className="team-card">
      <div className="team-card-header" style={{ background: headerColor }}>
        <div className="team-card-header-name">{team.name}</div>
        <div className="team-card-header-label">Year</div>
        <div className="team-card-header-budget">{team.budget}</div>
      </div>
      {team.players.map((player, index) => (
        <div className="team-card-row" key={index}>
          <div className="team-card-player-name">{player.name}</div>
          <div className="team-card-player-year">{player.year}</div>
          <div className="team-card-player-price">{player.price}</div>
        </div>
      ))}
    </div>
  );
}
