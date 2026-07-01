# Quarterly Restoration

A personal quarterly accountability system backed by Supabase. It tracks daily execution, weekly evidence, quarterly goals, and end-of-quarter review without turning the morning/evening process into a giant dashboard.

Default active quarter:

```text
2026 Q3
1 July 2026 -> 30 September 2026
```

## Core arenas

- Discipline & Consistency
- Revenue Creation
- Sales Activity
- Emotional Mastery
- Relationships

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Create the project and wait for it to be ready.

### 2. Run the database schema

1. In Supabase, go to **SQL Editor**.
2. Open `schema.sql` from this project.
3. Paste the full contents into the editor.
4. Click **Run**.

This creates:

- `quarters`
- `quarter_goals`
- `quarter_reviews`
- quarter-scoped `days`
- quarter-scoped `weeks`

It also seeds the default 2026 Q3 goals.

### 3. Configure the app

```bash
cp .env.example .env
```

Fill in:

```text
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Views

| View | Description |
| --- | --- |
| Today | Daily Top 3, linked quarterly goals, checklist, scoring, evening review, notes |
| Quarter | Quarter day grid generated from active quarter dates |
| Weekly | Weekly scoreboard for revenue, sales, health, money, relationships, and review |
| Goals | Editable quarterly goals by arena, quarter review, and rollover into next quarter |

## Rollover

At the end of a quarter:

1. Fill the quarter review.
2. Save wins, misses, repeated patterns, lessons, rollover items, and next theme.
3. Click **Start Next Quarter**.

The old quarter is archived. The new quarter starts fresh with default goals, while the database keeps historical days, weeks, goals, and reviews.

## Data model

- `quarters`: one row per quarterly cycle.
- `quarter_goals`: editable goals grouped by arena.
- `days`: one row per day inside a quarter, unique by `quarter_id + day_number`.
- `weeks`: one row per week inside a quarter, unique by `quarter_id + week_number`.
- `quarter_reviews`: final review and rollover notes.

## Build

```bash
npm run build
```

Output goes to `dist/`.
