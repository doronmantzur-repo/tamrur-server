-- Medication administration log: one row per drug given to one casualty.
--
-- Naming note: this table uses snake_case FKs (`casualty_id`, `event_id`) as
-- specified, unlike the older record tables which use quoted kebab-case
-- ("event-id", "injury-id"). Snake_case needs no quoting, so it is the better
-- convention going forward — but be aware the two styles now coexist.
--
-- Unlike those older tables, the foreign keys here CASCADE: a drug entry has no
-- meaning without the casualty it was given to, so deleting the casualty should
-- take its medication log with it rather than blocking the delete.
--
-- Run once against the Supabase project. Re-running is safe.

BEGIN;

CREATE TABLE IF NOT EXISTS public.drugs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  casualty_id     uuid NOT NULL REFERENCES public.casualties (id) ON DELETE CASCADE,
  event_id        uuid NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  drug_name       text NOT NULL,
  dose_amount     numeric NOT NULL,
  dose_unit       text NOT NULL,
  route           text NOT NULL,
  administered_at timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Text + CHECK rather than Postgres enums, matching how gathering_status was
-- added in 003: extending a CHECK is a one-line migration, extending an enum
-- that is already in use is not.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drugs_dose_unit_check') THEN
    ALTER TABLE public.drugs
      ADD CONSTRAINT drugs_dose_unit_check CHECK (dose_unit IN ('mcg', 'mg', 'g'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drugs_route_check') THEN
    ALTER TABLE public.drugs
      ADD CONSTRAINT drugs_route_check
      CHECK (route IN ('IV', 'IM', 'PO', 'PR', 'SC', 'IO', 'Inhalation'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drugs_dose_amount_check') THEN
    ALTER TABLE public.drugs
      ADD CONSTRAINT drugs_dose_amount_check CHECK (dose_amount > 0);
  END IF;
END $$;

-- The medic interface reads a whole event's drugs at once and groups them by
-- casualty client-side, exactly as it does for treatments and vitals.
CREATE INDEX IF NOT EXISTS drugs_event_id_idx ON public.drugs (event_id);
CREATE INDEX IF NOT EXISTS drugs_casualty_id_idx ON public.drugs (casualty_id);

-- Row Level Security, matching every other table in this schema: RLS is turned
-- on and no policies are defined.
--
-- WARNING, and it applies to the whole schema rather than to this table: with
-- RLS enabled and zero policies, the Supabase `anon` and `authenticated` roles
-- can read nothing here. The application works only because the API server
-- connects over DATABASE_URL as the table-owning `postgres` role, which bypasses
-- RLS entirely. If anything is ever pointed at this database using the anon key,
-- it will silently see no rows until real policies are written.
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;

COMMIT;
