# Family Calendar

A shared family calendar app — same architecture as [Family Kanban](https://family-kanban.tonyquilici.workers.dev).

**Live app:** https://family-calendar.tonyquilici.workers.dev

## Features
- 📅 Month, Week, Day views
- 👨‍👩‍👧‍👦 Per-person color coding and filtering
- ☁️ GitHub as database — all events stored in `calendar-data.json`
- 🔄 Auto-sync to GitHub on every change
- 📱 PWA — add to home screen on iPhone, iPad, Mac
- 🌙 Dark / light theme
- ✈️ Repeating events (daily, weekly, monthly, yearly)

## Setup

1. Open the app
2. Tap ⚙ (Settings) → enter your GitHub token + repo `tquilici/family-calendar`
3. Tap **Connect & Sync**

All family members use the same GitHub token stored locally on their device. Events sync via GitHub.

## Deploy (Cloudflare Workers)

```bash
cd family-calendar
npx wrangler login
npx wrangler deploy
```

## Data format

Events live in `calendar-data.json`:
```json
{
  "version": 1,
  "nextId": 1,
  "nextPersonId": 6,
  "people": [...],
  "events": [
    {
      "id": 1,
      "title": "Europe Trip",
      "date": "2026-07-31",
      "endDate": "2026-08-10",
      "allDay": true,
      "assignees": ["p1","p2","p3","p4","p5"]
    }
  ]
}
```
