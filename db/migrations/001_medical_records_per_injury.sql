-- Turns "injuries-treatment" and vitals into per-casualty log tables.
--
-- Both were created as one row per event: PRIMARY KEY ("event-id") makes a
-- second row for the same event impossible, and neither table has an id of its
-- own, so an individual record can't be addressed at all. That's why the
-- original controllers were written event-scoped.
--
-- The medic interface logs many records per casualty over time, so each table
-- needs its own primary key, a clinical timestamp the medic can edit, and an
-- index on "injury-id".
--
-- "recorded-at" is deliberately separate from the existing created_at: created_at
-- stays the audit trail of when the row was written, while "recorded-at" is when
-- the treatment was actually given or the reading actually taken — which is what
-- the medic edits, and is often earlier.
--
-- Run once against the Supabase project (SQL editor or psql) BEFORE deploying
-- the matching server code: the queries in modules/injuriesTreatmentModel.js and
-- modules/vitalsModel.js address rows by id and order by "recorded-at", and
-- fail with a 500 until this has run.
--
-- Re-running is safe. Both tables were empty when this was written, so no
-- backfill is needed; if that changes, note that dropping the event-id primary
-- key does not touch existing rows.

BEGIN;

-- injuries-treatment ---------------------------------------------------------

ALTER TABLE public."injuries-treatment"
  DROP CONSTRAINT IF EXISTS "injuries-treatment_pkey";

ALTER TABLE public."injuries-treatment"
  ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS "recorded-at" timestamptz NOT NULL DEFAULT now();

ALTER TABLE public."injuries-treatment"
  ADD CONSTRAINT "injuries-treatment_pkey" PRIMARY KEY (id);

-- vitals ---------------------------------------------------------------------

ALTER TABLE public.vitals
  DROP CONSTRAINT IF EXISTS "vitals_pkey";

ALTER TABLE public.vitals
  ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS "recorded-at" timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.vitals
  ADD CONSTRAINT "vitals_pkey" PRIMARY KEY (id);

-- Lookups --------------------------------------------------------------------
-- Every read the medic interface makes is scoped to one casualty or one event.
-- "event-id" needs its own index now that it is no longer the primary key.

CREATE INDEX IF NOT EXISTS "injuries-treatment_injury-id_idx"
  ON public."injuries-treatment" ("injury-id");

CREATE INDEX IF NOT EXISTS "injuries-treatment_event-id_idx"
  ON public."injuries-treatment" ("event-id");

CREATE INDEX IF NOT EXISTS "vitals_injury-id_idx"
  ON public.vitals ("injury-id");

CREATE INDEX IF NOT EXISTS "vitals_event-id_idx"
  ON public.vitals ("event-id");

COMMIT;