import { VOTE_SCORES } from "../../config/constants";
import "./VoteButtons.css";

interface VoteButtonsProps {
  onVote: (score: number) => void;
  leftTeamName: string;
  rightTeamName: string;
}

const VOTE_OPTIONS = [
  { label: "1", ariaTemplate: "Strongly prefer {left}", score: VOTE_SCORES.STRONGLY_LEFT },
  { label: "2", ariaTemplate: "Slightly prefer {left}", score: VOTE_SCORES.SLIGHTLY_LEFT },
  { label: "3", ariaTemplate: "Teams are even", score: VOTE_SCORES.EVEN },
  { label: "4", ariaTemplate: "Slightly prefer {right}", score: VOTE_SCORES.SLIGHTLY_RIGHT },
  { label: "5", ariaTemplate: "Strongly prefer {right}", score: VOTE_SCORES.STRONGLY_RIGHT },
] as const;

export function VoteButtons({ onVote, leftTeamName, rightTeamName }: VoteButtonsProps) {
  return (
    <div className="vote-container" role="group" aria-label="Vote on which team you prefer">
      <div className="vote-hint">
        <span>← Prefer left</span>
        <span>Prefer right →</span>
      </div>
      <div className="vote-buttons">
        <span className="vote-label">Prefer left</span>
        {VOTE_OPTIONS.map((option) => (
          <button
            key={option.label}
            className="vote-circle"
            onClick={(e) => { (e.target as HTMLElement).blur(); onVote(option.score); }}
            aria-label={option.ariaTemplate.replace("{left}", leftTeamName).replace("{right}", rightTeamName)}
          >
            {option.label}
          </button>
        ))}
        <span className="vote-label">Prefer right</span>
      </div>
    </div>
  );
}
