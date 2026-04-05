# MM Ranker

Pairwise comparison ranking tool for the Historical NBA Drafts community's March Madness format. Client-side only React + Vite + TypeScript app.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## Architecture

- `src/features/` — Feature-based folders (landing, team-select, comparison, rankings)
- `src/engine/` — Elo algorithm and tier generation
- `src/storage/` — localStorage persistence
- `src/config/` — Constants and team data JSON
- Design spec: `docs/superpowers/specs/2026-04-04-mm-ranker-design.md`

## Code Standards

- TypeScript strict mode. No `any`.
- Feature-based folder structure — co-locate components, hooks, types by feature.
- All magic numbers, colors, thresholds go in `src/config/constants.ts`.
- Descriptive names only. No `data`, `handler`, `temp`, `utils2`.
- No dead code. No unused imports.
- No speculative abstractions — only build what the spec requires.

## Design Skills

Run `/teach-impeccable` before starting UI work. Use `/polish`, `/audit`, `/critique` during implementation. Emil Kowalski skill (`emil-design-eng`) is installed for animation and interaction patterns.

## Important Rules

- Each region is an independent ranking pool. Never mix state across regions.
- Team IDs (not display names) are used in all state and comparisons.
- Raw comparison data is never deleted — even after rankings are revealed.
- The user's own team is excluded from matchups and always appears as solo Tier 1.
