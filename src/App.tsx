import { useState, useCallback, useEffect, useMemo } from "react";
import type { ViewState } from "./engine/types";
import type { RegionState } from "./engine/types";
import type { RegionId } from "./config/constants";
import { REGION_IDS } from "./config/constants";
import fallbackTeams from "./config/teams.json";
import { loadRegions } from "./config/teamsSource";
import type { Region } from "./engine/types";
import { loadRegionState, saveRegionState, resetRegionState, createInitialState } from "./storage/regionStorage";
import { LandingPage } from "./features/landing/LandingPage";
import { TeamSelect } from "./features/team-select/TeamSelect";
import { ComparisonView } from "./features/comparison/ComparisonView";
import { RankingsView } from "./features/rankings/RankingsView";
import { DraftManagementPage } from "./features/draft-management/DraftManagementPage";
import { GenerateMatchupPage } from "./features/draft-management/GenerateMatchupPage";
import { GenerateFormPage } from "./features/draft-management/GenerateFormPage";

const fallbackRegions = fallbackTeams.regions as Record<string, Region>;

function getTeamIds(regions: Record<string, Region>, regionId: string): string[] {
  return regions[regionId]?.teams.map((t) => t.id) ?? [];
}

function loadAllRegionStates(regions: Record<string, Region>): Record<RegionId, RegionState> {
  const states = {} as Record<RegionId, RegionState>;
  for (const regionId of REGION_IDS) {
    states[regionId] = loadRegionState(regionId, getTeamIds(regions, regionId));
  }
  return states;
}

export function App() {
  const [viewState, setViewState] = useState<ViewState>({ view: "landing" });
  const [regions, setRegions] = useState<Record<string, Region>>(fallbackRegions);
  const [regionStates, setRegionStates] = useState<Record<RegionId, RegionState>>(() =>
    loadAllRegionStates(fallbackRegions),
  );

  useEffect(() => {
    loadRegions()
      .then((fetched) => {
        setRegions(fetched);
        console.info("[mm-ranker] Loaded team data from Google Sheet");
      })
      .catch((err) => {
        console.warn(
          "[mm-ranker] Sheet fetch failed — falling back to bundled teams.json",
          err,
        );
      });
  }, []);

  const refreshRegionStates = useCallback(() => {
    setRegionStates(loadAllRegionStates(regions));
  }, [regions]);

  const currentRegion = useMemo(() => {
    if (viewState.view === "landing" || viewState.view === "draft-management" || viewState.view === "draft-management-matchup" || viewState.view === "draft-management-form") return null;
    return regions[viewState.regionId] ?? null;
  }, [viewState, regions]);

  const currentState = useMemo(() => {
    if (viewState.view === "landing" || viewState.view === "draft-management" || viewState.view === "draft-management-matchup" || viewState.view === "draft-management-form") return null;
    return regionStates[viewState.regionId as RegionId] ?? null;
  }, [viewState, regionStates]);

  function handleSelectRegion(regionId: RegionId) {
    const state = regionStates[regionId];
    if (state.myTeamId === null && state.comparisons.length === 0) {
      setViewState({ view: "team-select", regionId });
    } else if (state.rankingsRevealed) {
      setViewState({ view: "rankings", regionId });
    } else {
      setViewState({ view: "comparison", regionId });
    }
  }

  function handleTeamSelect(teamId: string | null) {
    if (viewState.view !== "team-select") return;
    const regionId = viewState.regionId as RegionId;
    const teamIds = getTeamIds(regions, regionId);
    const state = createInitialState(teamIds);
    state.myTeamId = teamId;
    saveRegionState(regionId, state);
    refreshRegionStates();
    setViewState({ view: "comparison", regionId });
  }

  function handleStateChange(newState: RegionState) {
    if (viewState.view !== "comparison") return;
    const regionId = viewState.regionId as RegionId;
    saveRegionState(regionId, newState);
    refreshRegionStates();
  }

  function handleGoToRankings() {
    if (viewState.view !== "comparison") return;
    const regionId = viewState.regionId as RegionId;
    const state = regionStates[regionId];
    const revealed: RegionState = { ...state, rankingsRevealed: true };
    saveRegionState(regionId, revealed);
    refreshRegionStates();
    setViewState({ view: "rankings", regionId });
  }

  function handleReset() {
    if (viewState.view === "landing" || viewState.view === "draft-management" || viewState.view === "draft-management-matchup" || viewState.view === "draft-management-form") return;
    const regionId = viewState.regionId as RegionId;
    resetRegionState(regionId);
    refreshRegionStates();
    setViewState({ view: "team-select", regionId });
  }

  function handleBack() {
    setViewState({ view: "landing" });
  }

  function handleOpenDraftManagement() {
    setViewState({ view: "draft-management" });
  }

  function handleOpenMatchup() {
    setViewState({ view: "draft-management-matchup" });
  }

  function handleOpenForm() {
    setViewState({ view: "draft-management-form" });
  }

  function handleBackToDraftManagement() {
    setViewState({ view: "draft-management" });
  }

  switch (viewState.view) {
    case "landing":
      return (
        <LandingPage
          regionStates={regionStates}
          onSelectRegion={handleSelectRegion}
          onOpenDraftManagement={handleOpenDraftManagement}
        />
      );

    case "draft-management":
      return (
        <DraftManagementPage
          onBack={handleBack}
          onOpenMatchup={handleOpenMatchup}
          onOpenForm={handleOpenForm}
        />
      );

    case "draft-management-matchup":
      return <GenerateMatchupPage onBack={handleBackToDraftManagement} />;

    case "draft-management-form":
      return <GenerateFormPage onBack={handleBackToDraftManagement} />;

    case "team-select":
      if (!currentRegion) return null;
      return (
        <TeamSelect
          regionId={viewState.regionId as RegionId}
          teams={currentRegion.teams}
          onSelect={handleTeamSelect}
          onBack={handleBack}
        />
      );

    case "comparison":
      if (!currentRegion || !currentState) return null;
      return (
        <ComparisonView
          regionId={viewState.regionId as RegionId}
          teams={currentRegion.teams}
          state={currentState}
          onStateChange={handleStateChange}
          onGoToRankings={handleGoToRankings}
          onReset={handleReset}
          onBack={handleBack}
        />
      );

    case "rankings":
      if (!currentRegion || !currentState) return null;
      return (
        <RankingsView
          regionId={viewState.regionId as RegionId}
          teams={currentRegion.teams}
          state={currentState}
          onReset={handleReset}
          onBack={handleBack}
        />
      );
  }
}
