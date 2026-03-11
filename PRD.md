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

## Goals

**Primary goal:** Make it easy for mom to:
1. Remember the exercises available to her
2. Quickly identify which exercises she needs to focus on
3. Reference how to do an exercise if she forgets

**Subgoal:** Motivate mom to train every day through visual progress and positive reinforcement.

---

## Users

### Kavita (Mom) — Primary User
- Recovering from knee surgery
- Not highly technical; needs a simple, encouraging interface
- Uses the app on her phone daily to track sets as she completes them
- Motivated by visual progress and positive reinforcement
- The only person who logs into the app

### The PT — Secondary User
- Manages Kavita's exercise program remotely
- Accesses PT mode by holding the app title for 700ms (hidden from Kavita)
- Uses the app to unlock/lock exercises, adjust sets/reps, and leave notes
- Does not need a separate login or admin portal

---

## User Stories

### Kavita
- As Kavita, I want to see today's exercises organized by Morning / Afternoon / Evening, so I know what to do at each part of the day.
- As Kavita, I want to tap "Start Set" and have a popup walk me through each exercise in order, so I don't have to remember what comes next.
- As Kavita, I want each exercise popup to show me a video of how to do the movement, so I can always do it correctly.
- As Kavita, I want to navigate forward and backward through exercises in a set, so I can go at my own pace.
- As Kavita, I want to see all the exercises available to me in one place, so I know what my current program looks like.
- As Kavita, I want to see the exercises I haven't graduated to yet, so I know what I'm working toward.
- As Kavita, I want each exercise card to show a nickname and an image, so I can recognize it at a glance.
- As Kavita, I want to tap into an exercise and see the full details — video, reps/sets, which body part it targets, and how to progress it — so I have everything I need in one place.
- As Kavita, I want to update a checklist of the equipment I have at home, so the app always reflects what I can actually use.
- As Kavita, I want to see a calendar at the top of my Today page showing which days I've completed all, some, or no exercises, so I can see my consistency over the month.
- As Kavita, I want to see a visual reward as I progress through the week, so I stay motivated to keep going.

### The PT
- As the PT, I want to unlock or lock specific exercises for Kavita's current phase of recovery, so she only sees what's appropriate for her.
- As the PT, I want to update the sets and reps for any exercise, so the program evolves as Kavita gets stronger.
- As the PT, I want to leave notes on exercises (e.g. "keep knee at 90°"), so Kavita has guidance while doing the movement.
- As the PT, I want to access PT mode discreetly without a login screen, so the app stays simple for Kavita.

---

## MVP Features (Priority Order)

### 1. Today Tab
- Mom is the only user; no login required
- Exercises are grouped into **Morning**, **Afternoon**, and **Evening** sections
- Each section shows exercises with their set count
- A **"Start Set" button** opens a workout popup that walks through exercises one at a time

#### Start Set Popup
- Shows one exercise at a time with:
  - **Title** — the nickname mom recognizes
  - **Embedded video** — how to perform the exercise
  - **Back / Forward arrows** — navigate to previous or next exercise in the set
- Lets mom move through the full set without leaving the popup

### 2. Exercises Tab — Available
- Grid of all exercises currently unlocked for mom
- Each card shows:
  - **Title** — nickname of the exercise
  - **Image** — quick visual of what the exercise looks like

#### Exercise Detail (tap into a card)
- **Title** — nickname
- **Subtitle** — actual clinical name of the exercise
- **Reps × Sets** — prescribed volume
- **Embedded video** — YouTube or other link showing how to perform it
- **Body part image** — diagram showing which area is being worked
- **Progression notes** — how to make the exercise harder over time

### 3. Exercises Tab — Locked / Future
- Grid of exercises not yet unlocked for mom
- Page subtitle: *"You'll graduate to these exercises soon"*
- Same card format as available exercises (nickname + image)

### 4. Equipment Tab
- Checklist of equipment mom has available at home
- Mom can check/uncheck items to keep the list current

### 5. Calendar (Today Tab — top of page)
- Month view at the top of the Today tab
- Each day color-coded:
  - **All done** — full color (amber)
  - **Some done** — partial color (yellow)
  - **None done** — missed (red/muted)
  - **Future** — gray
  - **Today** — outlined/highlighted

---

## Non-MVP (Future Considerations)

- Garden / weekly progress widget (motivational visual — already built)
- Progress ring showing today's completion %
- PT mode for remote program management (already built)
- Reminders or push notifications
- Wearable or health platform integrations

---

## Design Principles

- **Honey/amber bee theme** — warm, cheerful, encouraging
- **Fredoka + Quicksand fonts** — rounded, friendly, easy to read
- **Mobile-first** — max width 430px, designed for one-handed phone use
- **Positive reinforcement** — the app celebrates progress, never shames missed days

---

## Non-Goals

- Not a multi-user platform (one patient, one PT)
- Not a scheduling or reminder system
- Not connected to any wearable or health platform

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

**Next (MVP gaps to build):**
- Morning / Afternoon / Evening grouping on Today tab
- "Start Set" popup with video embed and back/forward navigation
- Exercise detail view with video, body part image, and progression notes
- Locked exercises tab with "You'll graduate to these soon" subtitle
- Exercise cards with images
