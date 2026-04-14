import { useEffect, useMemo, useRef, useState } from "react";
import type { Region } from "../../engine/types";
import teamColorsData from "../../config/team-colors.json";
import { buildCatalog, type CatalogEntry } from "./matchup/teamCatalog";
import { TeamSearchInput } from "./matchup/TeamSearchInput";
import { MatchupCard } from "./matchup/MatchupCard";
import { submitForm, type FormMatchup } from "./form/formSubmit";
import "./GenerateFormPage.css";

interface GenerateFormPageProps {
  regions: Record<string, Region>;
  onBack: () => void;
}

interface TeamColor {
  bg: string;
  headerText: string;
  cellText: string;
}

interface MatchupRow {
  id: string;
  home: CatalogEntry | null;
  away: CatalogEntry | null;
}

const teamColors = teamColorsData as Record<string, TeamColor>;
const DEFAULT_COLORS: TeamColor = { bg: "#1c1c2e", headerText: "#ffffff", cellText: "#cccccc" };

function colorsFor(teamId: string): TeamColor {
  return teamColors[teamId] ?? DEFAULT_COLORS;
}

function newRow(): MatchupRow {
  return { id: crypto.randomUUID(), home: null, away: null };
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
    // fall back silently
  }
}

export function GenerateFormPage({ regions, onBack }: GenerateFormPageProps) {
  const catalog = useMemo(() => buildCatalog(regions), [regions]);
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<MatchupRow[]>(() => [newRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const previewRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    ensureFontsReady();
  }, []);

  function updateRow(id: string, patch: Partial<MatchupRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));
    previewRefs.current.delete(id);
  }

  const validMatchups = useMemo<FormMatchup[]>(
    () =>
      rows
        .filter((r): r is MatchupRow & { home: CatalogEntry; away: CatalogEntry } => r.home !== null && r.away !== null)
        .map((r) => ({ home: r.home, away: r.away })),
    [rows],
  );

  const ready = title.trim().length > 0 && validMatchups.length > 0 && !submitting;

  async function handleCreate() {
    if (!ready) return;
    setSubmitting(true);
    setError(null);
    setResultUrl(null);
    try {
      await ensureFontsReady();
      const nodes = rows
        .filter((r) => r.home !== null && r.away !== null)
        .map((r) => previewRefs.current.get(r.id) ?? null);
      const result = await submitForm(title.trim(), validMatchups, nodes);
      setResultUrl(result.editUrl);
      window.open(result.editUrl, "_blank", "noopener");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to create form.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="generate-form-page">
      <button className="generate-form-back" onClick={onBack}>
        ← Back
      </button>
      <h1 className="generate-form-title">Generate Form</h1>

      <label className="generate-form-field">
        <span className="generate-form-field-label">Form name</span>
        <input
          type="text"
          className="generate-form-input"
          value={title}
          placeholder="e.g. Draft 78 First Round Voting"
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <div className="generate-form-matchups">
        {rows.map((row, index) => {
          const hasBoth = row.home !== null && row.away !== null;
          return (
            <div key={row.id} className="generate-form-matchup">
              <div className="generate-form-matchup-header">
                <span className="generate-form-matchup-index">Matchup {index + 1}</span>
                {rows.length > 1 && (
                  <button
                    className="generate-form-matchup-remove"
                    onClick={() => removeRow(row.id)}
                    aria-label={`Remove matchup ${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="generate-form-matchup-controls">
                <TeamSearchInput
                  label="Home"
                  catalog={catalog}
                  selected={row.home}
                  onSelect={(entry) => updateRow(row.id, { home: entry })}
                />
                <TeamSearchInput
                  label="Away"
                  catalog={catalog}
                  selected={row.away}
                  onSelect={(entry) => updateRow(row.id, { away: entry })}
                />
              </div>
              {hasBoth && row.home && row.away && (
                <div className="generate-form-preview-wrap">
                  <div
                    ref={(el) => {
                      previewRefs.current.set(row.id, el);
                    }}
                    className="generate-form-preview"
                  >
                    <MatchupCard team={row.home.team} colors={colorsFor(row.home.team.id)} />
                    <MatchupCard team={row.away.team} colors={colorsFor(row.away.team.id)} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="generate-form-add" onClick={addRow} type="button">
        + Add Matchup
      </button>

      {error && <div className="generate-form-error" role="alert">{error}</div>}
      {resultUrl && (
        <div className="generate-form-success">
          Form created.{" "}
          <a href={resultUrl} target="_blank" rel="noopener noreferrer">
            Open it
          </a>
          .
        </div>
      )}

      <button className="generate-form-submit" onClick={handleCreate} disabled={!ready}>
        {submitting ? "Creating…" : "Create Form"}
      </button>
    </main>
  );
}
