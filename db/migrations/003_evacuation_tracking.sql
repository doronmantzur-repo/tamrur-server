-- Casualty evacuation tracking + the event-level evacuation state machine.
--
-- Adds:
--   casualties.is_evacuated   — has this casualty left the scene
--   casualties.evacuated_at   — when (server stamps it; see casualtiesModel.js)
--   events.gathering_status   — is casualty collection still running
--   events.evac_status        — 0 not started | 1 in progress | 2 complete
--
-- `evac_status` is DERIVED, never written by hand. It is recomputed by
-- recalc_event_evac_status() whenever a casualty row changes or an event's
-- gathering_status changes, so it cannot drift no matter which code path (or
-- which teammate's psql session) does the writing.
--
-- Run once against the Supabase project. Re-running is safe.

BEGIN;

-- 1. Columns -----------------------------------------------------------------

ALTER TABLE public.casualties
  ADD COLUMN IF NOT EXISTS is_evacuated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS evacuated_at timestamptz;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS gathering_status text NOT NULL DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS evac_status smallint NOT NULL DEFAULT 0;

-- Plain text + CHECK rather than new enum types: these two are app-level state,
-- and a CHECK is far easier to extend than an enum when the workflow grows.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_gathering_status_check') THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_gathering_status_check
      CHECK (gathering_status IN ('in_progress', 'completed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_evac_status_check') THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_evac_status_check CHECK (evac_status IN (0, 1, 2));
  END IF;
END $$;

-- The active/evacuated split is the medic table's main read.
CREATE INDEX IF NOT EXISTS "casualties_event-id_is_evacuated_idx"
  ON public.casualties ("event-id", is_evacuated);

-- 2. The state machine, in one place -----------------------------------------

CREATE OR REPLACE FUNCTION public.recalc_event_evac_status(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total     integer;
  v_evacuated integer;
  v_gathering text;
  v_next      smallint;
BEGIN
  IF p_event_id IS NULL THEN
    RETURN;
  END IF;

  SELECT gathering_status INTO v_gathering FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RETURN;                                   -- casualty pointing at a deleted event
  END IF;

  SELECT count(*), count(*) FILTER (WHERE is_evacuated)
    INTO v_total, v_evacuated
    FROM public.casualties
   WHERE "event-id" = p_event_id;

  -- Order matters: rule 1 wins outright, then rule 3, else rule 2.
  IF v_total = 0 OR v_evacuated = 0 THEN
    v_next := 0;
  ELSIF v_evacuated = v_total AND v_gathering = 'completed' THEN
    v_next := 2;
  ELSE
    v_next := 1;
  END IF;

  UPDATE public.events
     SET evac_status = v_next
   WHERE id = p_event_id
     AND evac_status IS DISTINCT FROM v_next;   -- no-op writes stay no-ops
END;
$$;

-- 3. Triggers ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.casualties_recalc_evac_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_event_evac_status(OLD."event-id");
    RETURN OLD;
  END IF;

  PERFORM public.recalc_event_evac_status(NEW."event-id");

  -- A casualty moved between events leaves the old one needing a recount too.
  IF TG_OP = 'UPDATE' AND NEW."event-id" IS DISTINCT FROM OLD."event-id" THEN
    PERFORM public.recalc_event_evac_status(OLD."event-id");
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.events_recalc_evac_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.recalc_event_evac_status(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS casualties_evac_status_trg ON public.casualties;
CREATE TRIGGER casualties_evac_status_trg
  AFTER INSERT OR UPDATE OF is_evacuated, "event-id" OR DELETE
  ON public.casualties
  FOR EACH ROW EXECUTE FUNCTION public.casualties_recalc_evac_status();

-- Scoped to gathering_status so the function's own write to evac_status
-- cannot re-enter this trigger.
DROP TRIGGER IF EXISTS events_evac_status_trg ON public.events;
CREATE TRIGGER events_evac_status_trg
  AFTER UPDATE OF gathering_status
  ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.events_recalc_evac_status();

-- 4. Backfill existing events ------------------------------------------------

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.events LOOP
    PERFORM public.recalc_event_evac_status(r.id);
  END LOOP;
END $$;

COMMIT;
