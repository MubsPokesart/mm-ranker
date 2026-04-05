# March Madness Ranker — Design Spec

## Overview

A client-side web app for the Historical NBA Drafts community to rank teams within March Madness regions using pairwise comparisons. Users compare teams head-to-head, the system builds Elo ratings from those comparisons, and final rankings are presented as tiers.

The app is shared via a Discord link. There are no user accounts — all state is stored in localStorage. Each of the 4 regions (East, South, West, Midwest) is an independent ranking pool with 16 teams.

## Data Model

### Team Data

Team data is stored as a hardcoded JSON file organized by region. Each team has:

- `id` — stable internal identifier (e.g., `"east-arizona-wildcats"`)
- `name` — display name (e.g., `"Arizona Wildcats"`)
- `budget` — budget number from the spreadsheet
- `players` — array of 10 players, each with `name`, `year`, and `price` (first 5 are starters, last 5 are bench)

Source data is extracted from `Historical NBA Drafts March Madness Team Pool.xlsx`. The spreadsheet has 4 sheets (one per region), each containing 16 teams arranged in a 4-column x 4-block grid. Each team block spans 11 rows: 1 header row (team name, "Year", budget) and 10 player rows.

### User State (per region, in localStorage)

```typescript
interface RegionState {
  myTeamId: string | null;
  comparisons: Comparison[];
  ratings: Record<string, number>;
  comparisonCounts: Record<string, number>;
  pairCounts: Record<string, number>; // key: "teamIdA-vs-teamIdB" (sorted)
  rankingsRevealed: boolean;
}

interface Comparison {
  leftTeamId: string;
  rightTeamId: string;
  score: number; // 1.0, 0.5, 0, -0.5, -1.0
  timestamp: number;
}
```

- Team IDs are used internally instead of display names so state stays stable if names change.
- Each region is an independent ranking pool with its own saved state.
- Raw comparison data is retained even after rankings are revealed, so the system can recompute results or debug issues later.

## Elo Algorithm

### Rating Updates

All teams in a region start at 1500 Elo. After each comparison:

1. Calculate expected scores: `E_a = 1 / (1 + 10^((R_b - R_a) / 400))`
2. Map vote outcome to actual scores:
   - Strongly prefer left: `S_a = 1.0, S_b = 0.0`
   - Slightly prefer left: `S_a = 0.75, S_b = 0.25`
   - Even: `S_a = 0.5, S_b = 0.5`
   - Slightly prefer right: `S_a = 0.25, S_b = 0.75`
   - Strongly prefer right: `S_a = 0.0, S_b = 1.0`
3. Update ratings: `R_a' = R_a + K * (S_a - E_a)`, same for team B
4. K-factor: fixed at 32

The 0.75/0.25 split for "slightly" keeps intensity weighting modest — a strong preference moves ratings roughly twice as much as a slight one, but not more. This captures confidence without letting aggressive voters distort rankings.

### Matchup Selection

Two phases:

**Phase 1 (coverage):** Prioritizes under-compared teams until all teams in the region reach a minimum of 3 comparisons each. The least-compared team is paired with a random eligible opponent (excluding the user's own team).

**Phase 2 (refinement):** Prioritizes informative matchups between similarly rated teams while avoiding excessive repeats of the same pair. Uses both per-team comparison counts and per-pair counts to make selection decisions.

The user's own team (if selected) is excluded from all matchups.

## Tier Generation

After the user clicks "Go to Rankings" (available after 15+ comparisons):

1. Sort teams by Elo rating (descending), excluding the user's own team from the Elo-based tiers.
2. If the user selected their own team, it is placed as solo Tier 1.
3. Find natural gaps: calculate the rating difference between each consecutive pair of sorted teams.
4. Split at the largest gaps to form tiers, aiming for roughly 4–7 tiers when the data supports it.
5. If ratings are too tightly clustered to produce clear breaks, fall back to a simpler balanced split.
6. Teams within the same tier are treated as meaningfully equivalent, even if Elo is used internally to order them.

### Display Format

Text-based tier list:

```
Tier 1: Arizona Wildcats
Tier 2: UConn Huskies, Penn Quakers
Tier 3: Illinois Fighting Illini, Kansas Jayhawks, Miami RedHawks
...
```

## Page Flow

### Landing Page

- Title: "Draft 78 March Madness Ranker"
- 4 region rectangles: East, South, West, Midwest
- Each shows progress (e.g., "5/15 comparisons" or "Rankings revealed")
- Click a region to enter it

### Team Selection (first visit to a region)

- Prompt: "Do you have a team in this region?"
- List of 16 teams to choose from, or "No, I don't"
- Selection is stored; the chosen team is excluded from all matchups and placed as solo Tier 1 in rankings

### Comparison Mode

- Two team cards displayed side-by-side
- Team cards match the Google Sheets dark theme: dark navy background, colored team name headers, grid lines, 3-column layout (Player | Year | Price)
- 5 clickable vote buttons between the cards:
  - Strongly prefer left
  - Slightly prefer left
  - Even
  - Slightly prefer right
  - Strongly prefer right
- Progress indicator: "7 / 15 comparisons"
- "Go to Rankings" button appears after 15 comparisons but the user can continue doing more comparisons before clicking it
- Reset button available to clear progress and start over

### Rankings View

- Text-based tier list display
- Tier 1 is the user's own team (if they selected one)
- Tiers 2+ are generated from Elo gap analysis
- Reset button available (clears everything including revealed rankings, returns to team selection)

### Navigation

- Users can freely jump between regions, picking up where they left off in each
- Each region maintains independent state

## Tech Stack

- **Framework:** React + Vite + TypeScript (strict mode)
- **Hosting:** Static, client-side only (GitHub Pages, Netlify, or similar)
- **Storage:** localStorage only, no backend
- **Dependencies:** Minimal — React, Vite, TypeScript. No external UI or state management libraries.

## Project Structure

```
src/
  config/
    constants.ts        — K-factor, min comparisons, tier bounds, initial Elo, colors
    teams.json          — all 64 teams organized by region
  features/
    landing/
      LandingPage.tsx
    team-select/
      TeamSelect.tsx
    comparison/
      ComparisonView.tsx
      TeamCard.tsx
      VoteButtons.tsx
    rankings/
      RankingsView.tsx
  engine/
    elo.ts              — Elo calculation, matchup selection
    tiers.ts            — gap-based tier generation
    types.ts            — shared types (Team, Comparison, RegionState, etc.)
  storage/
    localStorage.ts     — per-region state persistence
  App.tsx
  main.tsx
```

## Coding Standards

- **Feature-based folder organization** — components, hooks, utils, and types co-located by feature
- **TypeScript strict mode** — no `any`, explicit types at module boundaries
- **No hardcoded values** — colors, thresholds, magic numbers extracted to `constants.ts`
- **Descriptive naming** — no vague names like `data`, `handler`, `temp`, `utils2`
- **No dead code** — no unused imports, unreferenced functions, or orphaned files
- **YAGNI** — no speculative abstractions, no features beyond what's specified

## Design Skills

The following design skills are installed and should be used during implementation:

- **impeccable.style** — 21 commands for typography, color, layout, motion, and design audit
- **Emil Kowalski (emil-design-eng)** — UI polish, animation decisions, component design philosophy

Run `/teach-impeccable` at the start of implementation to set up the project's design context.
