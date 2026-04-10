import type { Region, Team, Player } from "../engine/types";
import { REGION_IDS, REGION_DISPLAY_NAMES, SHEET_ID, type RegionId } from "./constants";

const TEAMS_PER_BLOCK = 4;
const PLAYERS_PER_TEAM = 10;
const ROWS_PER_BLOCK = 1 + PLAYERS_PER_TEAM;
const BLOCKS_PER_REGION = 4;

function buildSheetUrl(tabName: string): string {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;
  const params = new URLSearchParams({ tqx: "out:csv", sheet: tabName });
  return `${base}?${params.toString()}`;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let cell = "";
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '"' && line[j + 1] === '"') {
          cell += '"';
          j += 2;
        } else if (line[j] === '"') {
          break;
        } else {
          cell += line[j];
          j++;
        }
      }
      cells.push(cell);
      i = j + 1;
      if (line[i] === ",") i++;
    } else {
      let j = i;
      while (j < line.length && line[j] !== ",") j++;
      cells.push(line.slice(i, j));
      i = j + 1;
    }
  }
  return cells;
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map(parseCsvLine);
}

function parseMoney(raw: string): number {
  const cleaned = raw.replace(/\$/g, "").trim();
  const n = parseInt(cleaned, 10);
  if (Number.isNaN(n)) {
    throw new Error(`Cannot parse money value: "${raw}"`);
  }
  return n;
}

function slugifyTeamId(regionId: RegionId, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[.']/g, "")
    .replace(/\s+/g, "-");
  return `${regionId}-${slug}`;
}

function parseRegion(regionId: RegionId, regionName: string, rows: string[][]): Region {
  if (rows.length < BLOCKS_PER_REGION * ROWS_PER_BLOCK) {
    throw new Error(
      `Region "${regionName}" has ${rows.length} rows, expected at least ${BLOCKS_PER_REGION * ROWS_PER_BLOCK}`,
    );
  }

  const teams: Team[] = [];
  for (let block = 0; block < BLOCKS_PER_REGION; block++) {
    const headerRow = rows[block * ROWS_PER_BLOCK];
    if (!headerRow) {
      throw new Error(`Missing header row for block ${block} in ${regionName}`);
    }
    for (let col = 0; col < TEAMS_PER_BLOCK; col++) {
      const base = col * 3;
      const name = headerRow[base]?.trim();
      const budgetRaw = headerRow[base + 2];
      if (!name || budgetRaw === undefined) {
        throw new Error(`Missing team header at block ${block}, col ${col} in ${regionName}`);
      }
      const budget = parseMoney(budgetRaw);

      const players: Player[] = [];
      for (let p = 1; p <= PLAYERS_PER_TEAM; p++) {
        const playerRow = rows[block * ROWS_PER_BLOCK + p];
        if (!playerRow) {
          throw new Error(`Missing player row ${p} for ${name} in ${regionName}`);
        }
        const pName = playerRow[base]?.trim();
        const pYear = playerRow[base + 1]?.trim();
        const pPriceRaw = playerRow[base + 2];
        if (!pName || !pYear || pPriceRaw === undefined) {
          throw new Error(
            `Missing player data for ${name} row ${p} in ${regionName}`,
          );
        }
        players.push({ name: pName, year: pYear, price: parseMoney(pPriceRaw) });
      }

      teams.push({
        id: slugifyTeamId(regionId, name),
        name,
        budget,
        players,
      });
    }
  }

  return { id: regionId, name: regionName, teams };
}

async function fetchRegion(regionId: RegionId): Promise<Region> {
  const tabName = REGION_DISPLAY_NAMES[regionId];
  const res = await fetch(buildSheetUrl(tabName));
  if (!res.ok) {
    throw new Error(`Sheet fetch failed for ${tabName}: ${res.status}`);
  }
  const text = await res.text();
  const rows = parseCsv(text);
  return parseRegion(regionId, tabName, rows);
}

export async function loadRegions(): Promise<Record<string, Region>> {
  const regions = await Promise.all(REGION_IDS.map(fetchRegion));
  const out: Record<string, Region> = {};
  for (const r of regions) out[r.id] = r;
  return out;
}
