import { useState } from "react";
import { REGION_IDS, REGION_DISPLAY_NAMES, MIN_COMPARISONS_TO_UNLOCK } from "../../config/constants";
import type { RegionId } from "../../config/constants";
import type { RegionState } from "../../engine/types";
import { DraftGateModal } from "../draft-management/DraftGateModal";
import { readGateConfig, verifyPasscode } from "../draft-management/draftGate";
import { getCachedPasscode, clearCachedPasscode } from "../draft-management/draftGateStorage";
import "./LandingPage.css";

interface LandingPageProps {
  regionStates: Record<RegionId, RegionState>;
  onSelectRegion: (regionId: RegionId) => void;
  onOpenDraftManagement: () => void;
}

function formatProgress(state: RegionState): string {
  if (state.rankingsRevealed) return "Rankings revealed";
  const count = state.comparisons.length;
  if (count === 0 && state.myTeamId === null) return "Not started";
  return `${count} / ${MIN_COMPARISONS_TO_UNLOCK} comparisons`;
}

export function LandingPage({ regionStates, onSelectRegion, onOpenDraftManagement }: LandingPageProps) {
  const [gateOpen, setGateOpen] = useState(false);

  async function handleDraftManagementClick() {
    const cached = getCachedPasscode();
    if (cached) {
      const config = readGateConfig();
      if (config && (await verifyPasscode(cached, config))) {
        onOpenDraftManagement();
        return;
      }
      clearCachedPasscode();
    }
    setGateOpen(true);
  }

  function handleUnlock() {
    setGateOpen(false);
    onOpenDraftManagement();
  }

  return (
    <main className="landing-page">
      <h1 className="landing-title">Draft 78 March Madness Ranker</h1>
      <nav className="region-grid" aria-label="Regions">
        {REGION_IDS.map((regionId) => (
          <button
            key={regionId}
            className={`region-card ${regionStates[regionId].comparisons.length > 0 || regionStates[regionId].rankingsRevealed ? "region-card--active" : ""}`}
            onClick={() => onSelectRegion(regionId)}
          >
            <div className="region-card-name">
              {REGION_DISPLAY_NAMES[regionId]}
            </div>
            <div className={`region-card-progress ${regionStates[regionId].rankingsRevealed ? "region-card-progress--done" : ""}`}>
              {formatProgress(regionStates[regionId])}
            </div>
          </button>
        ))}
      </nav>

      <section className="draft-mgmt-section" aria-label="Draft Management">
        <button className="draft-mgmt-button" onClick={handleDraftManagementClick}>
          Draft Management
        </button>
      </section>

      {gateOpen && (
        <DraftGateModal onUnlock={handleUnlock} onClose={() => setGateOpen(false)} />
      )}
    </main>
  );
}
