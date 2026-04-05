import { REGION_IDS, REGION_DISPLAY_NAMES, MIN_COMPARISONS_TO_UNLOCK } from "../../config/constants";
import type { RegionId } from "../../config/constants";
import type { RegionState } from "../../engine/types";
import "./LandingPage.css";

interface LandingPageProps {
  regionStates: Record<RegionId, RegionState>;
  onSelectRegion: (regionId: RegionId) => void;
}

function formatProgress(state: RegionState): string {
  if (state.rankingsRevealed) return "Rankings revealed";
  const count = state.comparisons.length;
  if (count === 0 && state.myTeamId === null) return "Not started";
  return `${count} / ${MIN_COMPARISONS_TO_UNLOCK} comparisons`;
}

export function LandingPage({ regionStates, onSelectRegion }: LandingPageProps) {
  return (
    <div className="landing-page">
      <h1 className="landing-title">Draft 78 March Madness Ranker</h1>
      <div className="region-grid">
        {REGION_IDS.map((regionId) => (
          <button
            key={regionId}
            className="region-card"
            onClick={() => onSelectRegion(regionId)}
          >
            <div className="region-card-name">
              {REGION_DISPLAY_NAMES[regionId]}
            </div>
            <div className="region-card-progress">
              {formatProgress(regionStates[regionId])}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
