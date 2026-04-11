import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Region } from "../../engine/types";
import teamColorsData from "../../config/team-colors.json";
import { buildCatalog, type CatalogEntry } from "./matchup/teamCatalog";
import { TeamSearchInput } from "./matchup/TeamSearchInput";
import { MatchupCard } from "./matchup/MatchupCard";
import "./GenerateMatchupPage.css";

interface GenerateMatchupPageProps {
  regions: Record<string, Region>;
  onBack: () => void;
}

interface TeamColor {
  bg: string;
  headerText: string;
  cellText: string;
}

const teamColors = teamColorsData as Record<string, TeamColor>;
const DEFAULT_COLORS: TeamColor = { bg: "#1c1c2e", headerText: "#ffffff", cellText: "#cccccc" };

function colorsFor(teamId: string): TeamColor {
  return teamColors[teamId] ?? DEFAULT_COLORS;
}

function slugForFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function ensureFontsReady(): Promise<void> {
  if (!("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load("700 12pt \"Fira Sans\""),
      document.fonts.load("400 11pt \"Fira Sans\""),
    ]);
    await document.fonts.ready;
  } catch {
    // Fonts failing to resolve shouldn't block rendering — fall back silently.
  }
}

export function GenerateMatchupPage({ regions, onBack }: GenerateMatchupPageProps) {
  const catalog = useMemo(() => buildCatalog(regions), [regions]);
  const [home, setHome] = useState<CatalogEntry | null>(null);
  const [away, setAway] = useState<CatalogEntry | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureFontsReady();
  }, []);

  async function handleGenerate() {
    if (!home || !away || !previewRef.current) return;
    setGenerating(true);
    setError(null);
    try {
      await ensureFontsReady();
      const dataUrl = await toPng(previewRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `matchup-${slugForFilename(home.team.name)}-vs-${slugForFilename(away.team.name)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      setError("Failed to generate image. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  const ready = home !== null && away !== null;

  return (
    <main className="generate-matchup-page">
      <button className="generate-matchup-back" onClick={onBack}>
        ← Back
      </button>
      <h1 className="generate-matchup-title">Generate Matchup</h1>

      <div className="generate-matchup-controls">
        <TeamSearchInput label="Home" catalog={catalog} selected={home} onSelect={setHome} />
        <TeamSearchInput label="Away" catalog={catalog} selected={away} onSelect={setAway} />
      </div>

      {ready && (
        <div className="generate-matchup-preview-wrap">
          <div ref={previewRef} className="generate-matchup-preview">
            <MatchupCard team={home.team} colors={colorsFor(home.team.id)} />
            <MatchupCard team={away.team} colors={colorsFor(away.team.id)} />
          </div>
        </div>
      )}

      {error && <div className="generate-matchup-error" role="alert">{error}</div>}

      <button
        className="generate-matchup-submit"
        onClick={handleGenerate}
        disabled={!ready || generating}
      >
        {generating ? "Generating…" : "Generate matchup image"}
      </button>
    </main>
  );
}
