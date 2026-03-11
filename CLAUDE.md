# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Back in BeesKnees** is a PT exercise tracker for one user (mom) recovering from knee surgery. Her physical therapist (PT) manages the exercise program through the same app via a hidden PT mode.

Honey/amber bee theme throughout. Fredoka + Quicksand fonts. Mobile-first, max-width 430px.

## Commands

```bash
npm run dev       # local dev server
npm run build     # production build (outputs to dist/)
npm run preview   # preview the production build locally
```

The app deploys to GitHub Pages at `https://divyaspatel.github.io/back-in-beesknees/`. The `base: '/back-in-beesknees/'` in `vite.config.js` is required for this — do not change it.

## Stack

- **Vite + React** (JSX, no TypeScript)
- **Supabase** — data only, no auth (`@supabase/supabase-js`)
- Supabase client: `src/lib/supabase.js`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (in `.env.local`, gitignored)
- Supabase project: `https://pypdzfkpbxxjoldtkjsd.supabase.co`

## Auth & Roles

**No login.** Single-user app. PT mode is unlocked by holding the app title `<h1>` for 700ms. Exit via "Exit ✕" button in the purple banner.

- `mode` state: `'mom'` (default) or `'pt'`
- No AuthContext, no Login page, no Google OAuth — those files have been deleted

## Database Schema

Auth has been removed. Tables were migrated to drop `user_id` columns and disable RLS.

| Table | Purpose |
|---|---|
| `exercises` | Exercise library — PT controls `unlocked`, `sets`, `reps`, `notes` |
| `set_logs` | One row per completed set — `(exercise_id, date, set_index)` unique |
| `equipment` | Global equipment catalog |
| `user_equipment` | Mom's checklist of equipment she has at home |

**`set_logs` model:** `set_index` is 0-based. A row existing = set done; deleting = unchecked.
In-memory shape: `tracking[dateKey][exerciseId][setIndex] = true`

## App Structure

Everything lives in `src/App.jsx` (single file). Key components:

- `Ring` — SVG progress ring (today's completion %)
- `Hex` — single hexagon SVG used in the calendar
- `MonthCalendar` — full month grid of Hex components, color-coded by day status
- `GardenSection` — weekly garden progress widget (see below)
- `ExerciseModal` — bottom sheet; set checkboxes + PT editing (sets/reps/notes)
- `ExerciseCard` — card in the Exercises tab grid
- `App` — main component: state, data loading, views (home/garden/equipment), nav

## Views

- **Home** — progress ring, month calendar, garden widget, today's exercise cards with set buttons
- **Exercises** (tab id: `'garden'`) — grid of all exercises grouped by category; PT can tap to lock/unlock
- **Equipment** — checklist of equipment mom has at home

## Garden Widget (`GardenSection`)

The garden shows a coloring-book PNG (`public/garden.png`, two children watering a garden) with an SVG color overlay using `mix-blend-mode: multiply`. Black outlines stay black; white areas take on color.

**Fill logic:** 24 SVG groups fill progressively as mom completes sets during the week.
- `totalWeeklySets = unlocked exercises × sets_each × 7`
- `filledCount = Math.round(24 × weekDone / totalWeeklySets)`
- Groups fill in a rewarding order: sky/clouds/ground → nature → sunflowers → clothing/cans → hair → skin (Smita & Saavan "come to life" last)
- Each group fades in with `opacity: 0.6s ease-in` transition

**Debug mode:** A small "debug" button in the header toggles an overlay showing a red dashed bounding box for each of the 24 groups, with ‹ › arrows to cycle through them. Used for tuning SVG region coordinates.

SVG viewBox is `0 0 504 360` with `preserveAspectRatio="none"`.
Labels "Smita" (girl, left) and "Saavan" (boy, right) appear above the children.

## Current State

**Fully working:**
- All three views (Home, Exercises, Equipment)
- Supabase data wiring: exercises, set_logs, user_equipment
- Month calendar with hex day status
- Progress ring
- PT mode (hold title 700ms)
- Exercise modal with PT editing
- Garden widget with debug mode, opacity transitions, rewarding fill order

## Deployment

Deployed to GitHub Pages via `.github/workflows/deploy.yml`. Triggers on every push to `main`. Supabase env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are stored as GitHub Actions secrets. Google Fonts are loaded via `<link>` tags in `index.html`.

**Next steps:**
1. **Visual coordinate tuning** — use debug mode to check/nudge the 24 bounding boxes in `GardenSection`'s `GROUP_INFO` array so each region accurately covers its part of `garden.png`
