-- events.status: free-standing, user-picked lifecycle field -> DERIVED,
-- following the same shape as evac_status (006_evac_status_enum.sql).
--
-- New values, replacing evaluated | controlled | ready_for_evacuation |
-- evacuation_started | completed:
--
--   gathering_casualties   gathering_status = 'in_progress' (wins outright,
--                           regardless of evac_status)
--   casualties_assessment  gathering_status = 'completed', evac_status = 'pending'
--   evacuation_initiated   gathering_status = 'completed', evac_status = 'initiated'
--   full_evacuation        gathering_status = 'completed', evac_status = 'full'
--   closed                 terminal; only reachable via the app's dedicated
--                           "close event" action while status = full_evacuation,
--                           never recomputed once set (see step 2 below)
--
-- No migration in this repo ever created events.status (it exists directly in
-- Supabase — 006's header comment implies a kebab-case "event-status" enum is
-- already there, but nothing here defines it). Rather than assume its current
-- shape, this detaches the column to text first and reattaches a fresh enum,
-- which works whether the live column is currently an enum or plain text.
--
-- Old 'completed' rows are genuinely-closed events from before this change —
-- preserved as 'closed'. Every other old value becomes a placeholder that
-- step 3's backfill loop immediately overwrites with the real derived value,
-- so no event ends up on a status inconsistent with its own gathering_status/
-- evac_status/casualty data.
--
-- Run once against the Supabase project. Re-running is safe.

BEGIN;

-- 1. The type + column, swapped together --------------------------------------
--
-- "Already migrated" is detected by checking whether the column's type is
-- already an enum named event-status that carries the new 'gathering_casualties'
-- label — that's true only once this block has actually run, regardless of
-- whether the column started out as some other enum, as text, or missing
-- entirely, so the whole swap stays a no-op on a second run.

DO $$
DECLARE
  already_migrated boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
      FROM information_schema.columns c
     WHERE c.table_schema = 'public' AND c.table_name = 'events' AND c.column_name = 'status'
       AND c.udt_name = 'event-status'
       AND EXISTS (
         SELECT 1 FROM pg_enum e
           JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'event-status' AND e.enumlabel = 'gathering_casualties'
       )
  ) INTO already_migrated;

  IF NOT already_migrated THEN
    -- Detach from whatever type status currently is.
    ALTER TABLE public.events ALTER COLUMN status TYPE text USING status::text;
    ALTER TABLE public.events ALTER COLUMN status DROP DEFAULT;
    DROP TYPE IF EXISTS public."event-status";

    -- Create the new enum.
    CREATE TYPE public."event-status" AS ENUM (
      'gathering_casualties',
      'casualties_assessment',
      'evacuation_initiated',
      'full_evacuation',
      'closed'
    );

    -- Reattach, mapping old values onto the new set. Old 'completed' rows are
    -- genuinely closed; everything else is a placeholder step 5 overwrites.
    ALTER TABLE public.events
      ALTER COLUMN status TYPE public."event-status"
      USING (
        CASE status
          WHEN 'completed' THEN 'closed'
          ELSE 'gathering_casualties'
        END::public."event-status"
      );

    ALTER TABLE public.events
      ALTER COLUMN status SET DEFAULT 'gathering_casualties'::public."event-status";
  END IF;
END $$;

-- 2. The state machine, now also computing status -----------------------------
--
-- Same evac_status logic as 006; adds the status derivation on top, using the
-- same gathering_status/evac_status inputs so nothing new has to be tracked.
-- Guarded at the top so a closed event is never recomputed past 'closed' --
-- closing is a one-way action (matches the client's own "closing is a
-- one-way action" comment on the status badge).

CREATE OR REPLACE FUNCTION public.recalc_event_evac_status(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total          integer;
  v_evacuated      integer;
  v_gathering      text;
  v_current_status public."event-status";
  v_next           public."event-evac-status";
  v_status_next    public."event-status";
BEGIN
  IF p_event_id IS NULL THEN
    RETURN;
  END IF;

  SELECT gathering_status, status INTO v_gathering, v_current_status
    FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RETURN;                                   -- casualty pointing at a deleted event
  END IF;

  IF v_current_status = 'closed' THEN
    RETURN;                                   -- terminal, never recomputed
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

  -- gathering_status = 'in_progress' wins outright, regardless of v_next.
  IF v_gathering = 'in_progress' THEN
    v_status_next := 'gathering_casualties';
  ELSE
    v_status_next := CASE v_next
      WHEN 'pending'   THEN 'casualties_assessment'
      WHEN 'initiated' THEN 'evacuation_initiated'
      WHEN 'full'      THEN 'full_evacuation'
    END;
  END IF;

  UPDATE public.events
     SET evac_status = v_next,
         status = v_status_next
   WHERE id = p_event_id
     AND (evac_status IS DISTINCT FROM v_next OR status IS DISTINCT FROM v_status_next);
END;
$$;

-- 3. Backfill: recompute every non-closed row from real data ------------------

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.events LOOP
    PERFORM public.recalc_event_evac_status(r.id);
  END LOOP;
END $$;

COMMIT;
