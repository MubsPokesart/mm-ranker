import { VOTE_SCORES } from "../../config/constants";
import "./VoteButtons.css";

interface VoteButtonsProps {
  onVote: (score: number) => void;
}

const VOTE_OPTIONS = [
  { label: "Strongly prefer left", score: VOTE_SCORES.STRONGLY_LEFT },
  { label: "Slightly prefer left", score: VOTE_SCORES.SLIGHTLY_LEFT },
  { label: "Even", score: VOTE_SCORES.EVEN },
  { label: "Slightly prefer right", score: VOTE_SCORES.SLIGHTLY_RIGHT },
  { label: "Strongly prefer right", score: VOTE_SCORES.STRONGLY_RIGHT },
] as const;

export function VoteButtons({ onVote }: VoteButtonsProps) {
  return (
    <div className="vote-buttons">
      {VOTE_OPTIONS.map((option) => (
        <button
          key={option.label}
          className="vote-button"
          onClick={() => onVote(option.score)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
