# Product Requirements Document
## Back in BeesKnees — PT Exercise Tracker

---

## Overview

Back in BeesKnees is a mobile web app that helps one person (mom, Kavita) stay consistent with her physical therapy exercises while recovering from knee surgery. Her physical therapist manages the exercise program through the same app via a hidden PT mode — no separate admin interface needed.

---

## Problem

After knee surgery, PT recovery depends on daily adherence to a prescribed set of exercises. But:
- Exercise sheets are easy to lose or ignore
- There's no feedback loop — patients don't see their progress at a glance
- PTs can't easily update the program remotely between appointments
- Generic fitness apps are overwhelming and not designed for rehabilitation

---

## Users

### Kavita (Mom) — Primary User
- Recovering from knee surgery
- Not highly technical; needs a simple, encouraging interface
- Uses the app on her phone daily to track sets as she completes them
- Motivated by visual progress and positive reinforcement

### The PT — Secondary User
- Manages Kavita's exercise program remotely
- Accesses PT mode by holding the app title for 700ms (hidden from Kavita)
- Uses the app to unlock/lock exercises, adjust sets/reps, and leave notes
- Does not need a separate login or admin portal

---

## User Stories

### Kavita
- As Kavita, I want to see today's exercises and check off each set as I complete it, so I feel a sense of accomplishment.
- As Kavita, I want to see how much of today's program I've finished at a glance, so I know how much more I have to do.
- As Kavita, I want to see a visual reward as I progress through the week, so I stay motivated to keep going.
- As Kavita, I want to see which days this month I completed my exercises, so I can feel proud of my streak.
- As Kavita, I want to know what equipment I need at home, so I'm always prepared.

### The PT
- As the PT, I want to unlock or lock specific exercises for Kavita's current phase of recovery, so she only sees what's appropriate for her.
- As the PT, I want to update the sets and reps for any exercise, so the program evolves as Kavita gets stronger.
- As the PT, I want to leave notes on exercises (e.g. "keep knee at 90°"), so Kavita has guidance while doing the movement.
- As the PT, I want to access PT mode discreetly without a login screen, so the app stays simple for Kavita.

---

## Goals

1. **Daily use** — Kavita opens the app every day and logs her sets without friction.
2. **Visual motivation** — Progress is always visible: a completion ring, a monthly calendar, and a weekly garden that fills in as she works.
3. **Remote program management** — The PT can update the exercise program from anywhere without needing a separate tool.
4. **Zero friction** — No logins, no accounts, no passwords. The app just opens and works.

---

## Non-Goals

- Not a multi-user platform (one patient, one PT)
- Not a video/instruction library for exercises
- Not a scheduling or reminder system
- Not connected to any wearable or health platform

---

## Features

### Home View
- **Progress ring** — SVG ring showing % of today's exercises completed
- **Month calendar** — Hex grid of the current month; each day color-coded: done (amber), partial (yellow), missed (red), future (gray), today (outlined)
- **Garden widget** — Weekly coloring-book garden scene (pure SVG) that fills in progressively as sets are logged; 24 regions unlock in a rewarding order, culminating in Kavita and Saavan's faces appearing (grand finale)
- **Exercise cards** — One card per unlocked exercise; each card shows set checkboxes that toggle on tap

### Exercises View
- Grid of all exercises grouped by category
- PT can tap any card to lock/unlock it for Kavita
- Locked exercises are hidden from Kavita in the Home view

### Equipment View
- Checklist of equipment Kavita has at home
- Sourced from the global equipment catalog managed by the PT

### Exercise Modal (bottom sheet)
- Opens when Kavita taps an exercise card
- Shows set checkboxes, reps, and any PT notes
- In PT mode: editable sets, reps, and notes fields

### PT Mode
- Activated by holding the app title `<h1>` for 700ms
- Purple banner appears at the top indicating PT mode is active
- Exit via "Exit ✕" button in the banner
- No login required

---

## Design Principles

- **Honey/amber bee theme** — warm, cheerful, encouraging
- **Fredoka + Quicksand fonts** — rounded, friendly, easy to read
- **Mobile-first** — max width 430px, designed for one-handed phone use
- **Positive reinforcement** — the app celebrates progress, never shames missed days

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React (JSX), single file `src/App.jsx` |
| Database | Supabase (hosted Postgres, no auth, RLS disabled) |
| Hosting | GitHub Pages (`https://divyaspatel.github.io/back-in-beesknees/`) |
| Deployment | GitHub Actions on push to `main` |

---

## Current Status

**Done:**
- All three views (Home, Exercises, Equipment)
- Supabase data wiring
- Progress ring, month calendar, garden widget
- PT mode with exercise editing
- GitHub Pages deployment

**Next:**
- Visual fine-tuning of the garden SVG (use debug mode to adjust group positions)
