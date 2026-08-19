-- events.evac_status: smallint (0 | 1 | 2) -> a typed enum.
--
--   0 -> 'pending'     no casualty evacuated yet
--   1 -> 'initiated'   evacuation under way
--   2 -> 'full'        gathering closed and every casualty evacuated
--
-- Supersedes the integer column and CHECK constraint added by
-- 003_evacuation_tracking.sql, whose header comment describes the old encoding.
-- That migration is left as it was applied; this one is the current truth.
--
-- The type is named "event-evac-status", NOT "evac_status": an "evac-status"
-- enum already exists on this schema for evacuations.status
-- (not_started | started | completed), which is a different concept with a
-- different value set. Two types one hyphen apart would be a standing trap, so
-- this one is scoped to the table that owns it and follows the kebab-case
-- convention the other enums here use ("evac-ability", "event-status").
--
-- evac_status remains DERIVED — recalc_event_evac_status() is still the only
-- writer, and the column name is unchanged, so the API contract is untouched
-- apart from the value shape.
--
-- Re-runnable: each step is guarded, so applying this twice is a no-op.

-- 1. The type ----------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public' AND t.typname = 'event-evac-status'
  ) THEN
    CREATE TYPE public."event-evac-status" AS ENUM ('pending', 'initiated', 'full');
  END IF;
END $$;

-- 2. The column --------------------------------------------------------------
--
-- The default and the CHECK both have to go before the cast: a smallint default
-- cannot be cast implicitly, and the CHECK compares against integer literals.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'events'
       AND column_name = 'evac_status' AND udt_name <> 'event-evac-status'
  ) THEN
    ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_evac_status_check;
    ALTER TABLE public.events ALTER COLUMN evac_status DROP DEFAULT;

    ALTER TABLE public.events
      ALTER COLUMN evac_status TYPE public."event-evac-status"
      USING (
        CASE evac_status
          WHEN 0 THEN 'pending'
          WHEN 1 THEN 'initiated'
          WHEN 2 THEN 'full'
        END::public."event-evac-status"
      );

    ALTER TABLE public.events
      ALTER COLUMN evac_status SET DEFAULT 'pending'::public."event-evac-status";
  END IF;
END $$;

-- 3. The state machine, now returning enum values ----------------------------
--
-- Same three rules and the same precedence as 003; only v_next's type and the
-- literals it takes have changed.

CREATE OR REPLACE FUNCTION public.recalc_event_evac_status(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total     integer;
  v_evacuated integer;
  v_gathering text;
  v_next      public."event-evac-status";
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
    v_next := 'pending';
  ELSIF v_evacuated = v_total AND v_gathering = 'completed' THEN
    v_next := 'full';
  ELSE
    v_next := 'initiated';
  END IF;

  UPDATE public.events
     SET evac_status = v_next
   WHERE id = p_event_id
     AND evac_status IS DISTINCT FROM v_next;   -- no-op writes stay no-ops
END;
$$;

-- 4. Recompute every event ---------------------------------------------------
--
-- The cast in step 2 preserved each row's meaning, so this changes nothing on a
-- consistent database. It runs anyway so the migration leaves the column
-- provably in step with the casualty counts.

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.events LOOP
    PERFORM public.recalc_event_evac_status(r.id);
  END LOOP;
END $$;
