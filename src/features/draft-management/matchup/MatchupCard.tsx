import type { Team } from "../../../engine/types";
import "./MatchupCard.css";

interface MatchupCardProps {
  team: Team;
  colors: { bg: string; headerText: string; cellText: string };
}

export function MatchupCard({ team, colors }: MatchupCardProps) {
  return (
    <div className="matchup-card" style={{ background: colors.bg }}>
      <div className="matchup-card-row matchup-card-row--header" style={{ color: colors.headerText }}>
        <div className="matchup-card-cell matchup-card-cell--name">{team.name}</div>
        <div className="matchup-card-cell matchup-card-cell--year">Year</div>
      </div>
      {team.players.map((player, i) => (
        <div key={i} className="matchup-card-row" style={{ color: colors.cellText }}>
          <div className="matchup-card-cell matchup-card-cell--name">{player.name}</div>
          <div className="matchup-card-cell matchup-card-cell--year">{player.year}</div>
        </div>
      ))}
    </div>
  );
}
