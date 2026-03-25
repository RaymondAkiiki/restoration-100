# 100-Day Restoration Challenge
**27 March → 4 July 2026**

A personal accountability tracker backed by Supabase. Two views: Owner (full edit) and Partner (accountability notes only). Black, white, monospace. No bloat.

---

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Give it a name (e.g. `restoration-100`), set a database password, choose a region close to Uganda (e.g. `eu-west-2` London or `us-east-1`)
4. Wait for the project to be ready (~1 minute)

### 2. Run the database schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file `schema.sql` from this project
4. Paste the entire contents into the editor
5. Click **Run**
6. You should see: `Success. No rows returned`

This creates two tables (`days`, `weeks`), auto-timestamp triggers, and open RLS policies.

### 3. Get your API keys

1. In Supabase, go to **Settings → API** (left sidebar)
2. Copy:
   - **Project URL** (looks like `https://abcxyz.supabase.co`)
   - **anon / public** key (long string under "Project API Keys")

### 4. Configure the app

```bash
# In the project root
cp .env.example .env
```

Open `.env` and fill in:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Deploy to:
- **Vercel**: `npx vercel` (free, zero config)
- **Netlify**: drag the `dist/` folder to netlify.com/drop
- **Any static host**: serve the `dist/` folder

> **If deploying to Vercel/Netlify**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the hosting dashboard. Do not commit `.env` to git.

---

## Views

| View      | Description |
|-----------|-------------|
| **Today** | Opens today's day automatically with morning plan, checklist, scoring, review, and notes |
| **Calendar** | 100-day grid split by phase. Black = 3+ tasks done. Click any day to open it |
| **Weekly** | 14-week business numbers tracker (revenue, units, leads, meetings, SOPs, collections) + leadership review |
| **Targets** | Phase targets, daily schedule, spending rules, triggers, stop-doing list, emotional adulthood rules |

---

## Roles

Switch at the top right. No login required — it is a view toggle.

| Role | Can do |
|------|--------|
| **Owner** | Everything: fill morning plan, checklist, score, review, owner notes |
| **Partner** | Read all data. Add partner accountability notes only |

---

## Data structure

All data is stored in Supabase PostgreSQL.

- `days` table: one row per day (1–100). Upserted on save. Stores top3, checklist, scores, review, notes.
- `weeks` table: one row per week (1–15). Stores business metrics, leadership reflection, next priorities.

---

## The challenge

```
Phase 1 — Stabilize   Days   1–39    27 Mar → 4 May 2026
Phase 2 — Build       Days  40–74     5 May → 8 Jun 2026
Phase 3 — Prove       Days  75–99     9 Jun → 3 Jul 2026
Day 100 — Arrival     Day  100         4 Jul 2026 — Birthday
```

---

## File structure

```
restoration/
├── schema.sql                    # Run this in Supabase SQL Editor first
├── .env.example                  # Copy to .env and fill in keys
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                  # Entry point
    ├── App.jsx                   # Root — routing and stats
    ├── App.module.css
    ├── styles/
    │   └── index.css             # Global monospace black/white styles
    ├── lib/
    │   ├── supabase.js           # Supabase client init
    │   ├── constants.js          # Challenge config, checks, scores, biz fields, helpers
    │   └── db.js                 # All Supabase read/write functions
    └── components/
        ├── Nav.jsx / .module.css
        ├── Sec.jsx / .module.css       # Accordion section
        ├── DayPage.jsx / .module.css   # Daily journal — core view
        ├── CalPage.jsx / .module.css   # 100-day calendar
        ├── WeekPage.jsx / .module.css  # Weekly business review
        └── TargetsPage.jsx / .module.css # Targets and rules
```
