-- AI-inferred evacuation priority, kept separate from the medic's own
-- "evac-priority" column.
--
-- The two are deliberately not the same column. "evac-priority" is the medic's
-- judgment, edited by hand in the casualty table; this one is advisory output
-- from the triage model and is rendered read-only beside it. Writing both to one
-- column would mean every AI run silently discarded whatever the medic had
-- entered, which is precisely what the split avoids.
--
-- Nullable with no default: NULL means "no ranking has been generated for this
-- casualty yet", which the table renders as a neutral placeholder. Integer, to
-- match "evac-priority" — 1 evacuates first, higher numbers later.

ALTER TABLE public.casualties
  ADD COLUMN IF NOT EXISTS ai_evacuation_priority integer;

COMMENT ON COLUMN public.casualties.ai_evacuation_priority IS
  'AI-inferred evacuation rank (1 = first). Advisory only; the medic''s own ranking lives in "evac-priority".';
