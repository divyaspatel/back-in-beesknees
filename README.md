# Back in BeesKnees 🐝

**Live app:** https://divyaspatel.github.io/back-in-beesknees/

A mobile web app to help Smita stay consistent with her physical therapy exercises while recovering from knee surgery.

---

## Goal

Make it easy for mom to remember her exercises, track her progress, and stay motivated every day — while giving her PT a simple way to manage the program remotely.

---

## Features

### For Smita (Mom)
- **Today tab** — see all unlocked exercises with set buttons to check off each set as it's completed
- **Progress ring** — shows today's completion percentage at a glance
- **Month calendar** — color-coded hexagon grid showing which days were completed, partially done, or missed
- **Past-day review** — tap any previous day to see a read-only summary of what was completed
- **My Garden** — a photo garden that fills with flowers as exercises are completed (each rep = one flower, forever)
- **All Exercises tab** — browse all exercises with stick-figure illustrations, sets/reps, and embedded YouTube videos
- **Equipment tab** — checklist of equipment available at home

### For the PT
- **Hidden PT mode** — hold the app title for 700ms to enter PT mode (no login required)
- Lock or unlock exercises for Smita's current phase of recovery
- Adjust sets and reps for any exercise
- Leave notes on exercises (e.g. "keep knee at 90°")

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React (JSX), single file `src/App.jsx` |
| Database | Supabase (Postgres, no auth) |
| Hosting | GitHub Pages |
| Deployment | GitHub Actions on push to `main` |
