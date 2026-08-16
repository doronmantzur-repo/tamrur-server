-- Extends `casualties` to cover the paper triage/evacuation form the medics work
-- from (איסוף פצועים / טריאז' / סיכום טריאז' / דגשים לפינוי).
--
-- Additive only: every column the dashboard, brigade and airforce views already
-- read (urgency, "evac-priority", "evac-ability", "evac-ready", escort,
-- "recommended-evac-dest", created_at) keeps its current name and meaning, so
-- those screens are unaffected.
--
-- Columns deliberately NOT added, because the form's field already has a home:
--   פציעות             -> the existing `description` column (was unused)
--   דחיפות             -> the existing `urgency` enum
--   קדימות לפינוי      -> the existing "evac-priority"
--   יכולת פינוי        -> the existing "evac-ability" enum (walk|sit|lie)
--   מוכן לפינוי        -> the existing "evac-ready"
--
-- `escort` stays a boolean so the dashboard's yes/no column keeps working; the
-- new "escort-type" records *which* escort, and the server keeps the two in
-- sync on write.
--
-- Naming follows this table's existing kebab-case convention rather than the
-- snake_case used elsewhere, so the row reads consistently.
--
-- Run once against the Supabase project. Re-running is safe.

BEGIN;

ALTER TABLE public.casualties
  -- מס' פצוע — per-event casualty number, auto-assigned on insert when omitted.
  ADD COLUMN IF NOT EXISTS "casualty-number" smallint,
  -- טיפולים — free-text checklist, each entry { text, done }.
  ADD COLUMN IF NOT EXISTS "treatments" jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- קדימות לטיפול — ranked separately from evacuation priority.
  ADD COLUMN IF NOT EXISTS "treatment-priority" smallint,
  -- מונשם — none | ambu | tube | cric, or free text.
  ADD COLUMN IF NOT EXISTS "ventilation" text,
  -- ליווי — none | matab | medic, or free text. Mirrored into `escort`.
  ADD COLUMN IF NOT EXISTS "escort-type" text,
  -- מוסק — evacuate by helicopter.
  ADD COLUMN IF NOT EXISTS "helivac" boolean NOT NULL DEFAULT false;

-- The casualty table is always read one event at a time, ordered by this number.
--
-- This index was first created while the table was still called `injuries`, and
-- Postgres keeps index names through a table rename — so carry the old name over
-- rather than leaving a second, identical index behind.
ALTER INDEX IF EXISTS public."injuries_event-id_casualty-number_idx"
  RENAME TO "casualties_event-id_casualty-number_idx";

CREATE INDEX IF NOT EXISTS "casualties_event-id_casualty-number_idx"
  ON public.casualties ("event-id", "casualty-number");

COMMIT;
