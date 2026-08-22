-- Fixes two related problems found while seeding hospitals (008):
--
-- 1. locations.type's enum ("loaction-type", typo and all) uses hyphenated
--    labels ('landing-pad', 'exchange-point'), but every other enum in this
--    schema uses snake_case (force_type: 'merkava_3', 'black_hawk', etc. --
--    see 006_forces.sql), and the client (EvacuationMap.jsx) checks for
--    "landing_pad" / "exchange_point" with underscores. The hyphenated
--    labels are the outlier here, not the client -- nothing else in either
--    repo depends on the hyphenated spelling, so renaming is safe and avoids
--    having to patch the client to match a typo.
--
-- 2. The 3 pre-existing rows (LP_001/LP_002/LP_003) have type = NULL, so
--    they don't render on the map at all today. Backfilled to the renamed
--    'landing_pad' label.
--
-- Guarded like 007_event_status_enum.sql: ALTER TYPE ... RENAME VALUE
-- errors if run twice against an already-renamed label, so each rename is
-- wrapped in an existence check. The UPDATE is naturally idempotent.
--
-- Run once against the Supabase project (SQL editor or psql).

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'loaction-type' AND e.enumlabel = 'landing-pad'
  ) THEN
    ALTER TYPE "loaction-type" RENAME VALUE 'landing-pad' TO 'landing_pad';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'loaction-type' AND e.enumlabel = 'exchange-point'
  ) THEN
    ALTER TYPE "loaction-type" RENAME VALUE 'exchange-point' TO 'exchange_point';
  END IF;
END $$;

UPDATE public.locations
   SET type = 'landing_pad'
 WHERE name IN ('LP_001', 'LP_002', 'LP_003');

COMMIT;
