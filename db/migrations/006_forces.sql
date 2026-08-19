-- Static reference table of forces, for the MVP map layer. Deliberately not
-- linked to any other table (no FKs) -- it's a standalone list of markers,
-- not part of the operational casualty/evacuation workflow.
--
-- type/subtype are native Postgres enums rather than the CHECK-constraint
-- style used elsewhere in this schema (e.g. drugs.dose_unit/route) -- a
-- deliberate choice for this table, not an oversight. subtype is nullable
-- because 'infantry' has no platform of its own (there's no equipment to
-- name), unlike every other type.
--
-- The DB does not enforce that a row's subtype actually belongs to its type,
-- nor that non-infantry rows have a subtype set -- Postgres enums can't
-- express that without a lookup table or a CHECK function, which would
-- reintroduce the coupling this standalone table is meant to avoid. Fine for
-- a manually-populated, one-time-inserted MVP dataset.
--
-- Run once against the Supabase project (SQL editor or psql) BEFORE deploying
-- the matching server code. The CREATE TYPE/TABLE portion is idempotent
-- (IF NOT EXISTS guards); the seed INSERT at the bottom is not -- re-running
-- it will duplicate rows, since this is a one-time data load, not a
-- repeatable seed script.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'force_type') THEN
    CREATE TYPE force_type AS ENUM (
      'armor',
      'infantry',
      'drone',
      'uav',
      'artillery',
      'transport',
      'bulldozer',
      'vehicle',
      'apc',
      'aircraft',
      'helicopter'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'force_subtype') THEN
    CREATE TYPE force_subtype AS ENUM (
      -- Armor
      'merkava_3',
      'merkava_4',
      'merkava_5',

      -- Drone
      'quadcopter',

      -- UAV
      'heron_tp',
      'heron_1',
      'hermes_900',
      'hermes_450',
      'orbiter_4',
      'skylark_1',
      'skylark_3',

      -- Artillery
      'm109',
      'sigma_155',

      -- Transport
      'truck',

      -- Bulldozer
      'd9',

      -- Vehicle
      'david',
      'sufa',
      'abir',

      -- APC
      'namer',
      'eitan',
      'achzarit',

      -- Aircraft
      'f_15',
      'f_16',
      'f_35',

      -- Helicopter
      'apache',
      'black_hawk'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.forces (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        force_type NOT NULL,
  subtype     force_subtype,
  brigade     text NOT NULL,
  battalion   text NOT NULL,
  location    geography(Point,4326) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security, matching every other table in this schema: RLS is turned
-- on and no policies are defined. The API server connects as the
-- table-owning `postgres` role (via DATABASE_URL), which bypasses RLS.
ALTER TABLE public.forces ENABLE ROW LEVEL SECURITY;

COMMIT;

-- One-time seed data: ~31 illustrative forces per border (Gaza, Lebanon,
-- Jordan) modeled on a real division sector's force mix -- infantry as the
-- largest element, an armor/APC mechanized backbone, division artillery,
-- engineering, transport, recon drones/UAVs, light patrol vehicles, and a
-- light dusting of Air Force fixed-wing/helicopter support. Brigade/battalion
-- names are real, publicly-known IDF unit names used as realistic
-- training-scenario labels -- not an assertion of actual current deployment.
--
-- Coordinates walk a multi-point path per border, anchored to real,
-- well-known settlements/crossings along that border (e.g. Zikim/Erez/
-- Kissufim/Kerem Shalom for Gaza; Rosh Hanikra/Metula/Har Dov for Lebanon;
-- Argaman/Fasayil/Netiv HaGdud for the Jordan Valley), rather than a single
-- straight line between two guessed endpoints -- an earlier version of this
-- seed used a straight 2-point line, which didn't follow the border's actual
-- shape and drifted off it entirely in places. This is still an
-- approximation from general knowledge, not surveyed GIS data.

INSERT INTO public.forces (type, subtype, brigade, battalion, location) VALUES
  ('infantry', NULL, 'Givati Brigade', '12th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.52648,31.59694]}'), 4326)::geography),
  ('infantry', NULL, 'Givati Brigade', '13th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.52784,31.57263]}'), 4326)::geography),
  ('infantry', NULL, 'Givati Brigade', 'Shaked Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.49754,31.57592]}'), 4326)::geography),
  ('infantry', NULL, 'Givati Brigade', '12th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.50202,31.55367]}'), 4326)::geography),
  ('infantry', NULL, 'Givati Brigade', '13th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.48884,31.53561]}'), 4326)::geography),
  ('armor', 'merkava_3', '401st Armored Brigade', '9th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.51162,31.51921]}'), 4326)::geography),
  ('armor', 'merkava_4', '401st Armored Brigade', '52nd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.49544,31.50101]}'), 4326)::geography),
  ('armor', 'merkava_4', '401st Armored Brigade', '46th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.50707,31.49542]}'), 4326)::geography),
  ('armor', 'merkava_5', '401st Armored Brigade', '9th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.51889,31.47167]}'), 4326)::geography),
  ('apc', 'namer', '401st Armored Brigade', '52nd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.51401,31.46812]}'), 4326)::geography),
  ('apc', 'eitan', '401st Armored Brigade', '52nd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.49227,31.46738]}'), 4326)::geography),
  ('apc', 'achzarit', '401st Armored Brigade', '52nd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.48928,31.44322]}'), 4326)::geography),
  ('artillery', 'm109', 'Gaza Division Artillery', '282nd Artillery Regiment', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.46567,31.44482]}'), 4326)::geography),
  ('artillery', 'm109', 'Gaza Division Artillery', '215th Artillery Regiment', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.46268,31.42066]}'), 4326)::geography),
  ('artillery', 'sigma_155', 'Gaza Division Artillery', '282nd Artillery Regiment', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.43345,31.42929]}'), 4326)::geography),
  ('drone', 'quadcopter', 'Nahal Brigade', '931st Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.4317,31.40356]}'), 4326)::geography),
  ('drone', 'quadcopter', 'Nahal Brigade', '932nd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.40935,31.4036]}'), 4326)::geography),
  ('drone', 'quadcopter', 'Nahal Brigade', '933rd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.40948,31.37553]}'), 4326)::geography),
  ('uav', 'heron_1', 'Gaza Division', 'Division UAV Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.39031,31.37164]}'), 4326)::geography),
  ('uav', 'hermes_450', 'Gaza Division', 'Division UAV Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.40532,31.35672]}'), 4326)::geography),
  ('transport', 'truck', 'Nahal Brigade', '931st Battalion Logistics Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.38887,31.3359]}'), 4326)::geography),
  ('transport', 'truck', 'Nahal Brigade', '931st Battalion Logistics Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.39846,31.31971]}'), 4326)::geography),
  ('transport', 'truck', 'Nahal Brigade', '931st Battalion Logistics Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.3768,31.31768]}'), 4326)::geography),
  ('bulldozer', 'd9', 'Combat Engineering Corps', '601st Combat Engineering Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.37526,31.29337]}'), 4326)::geography),
  ('bulldozer', 'd9', 'Combat Engineering Corps', '601st Combat Engineering Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.3516,31.29356]}'), 4326)::geography),
  ('vehicle', 'david', 'Givati Brigade', 'Reconnaissance Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.35006,31.26926]}'), 4326)::geography),
  ('vehicle', 'sufa', 'Givati Brigade', 'Reconnaissance Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.32036,31.27613]}'), 4326)::geography),
  ('vehicle', 'abir', 'Givati Brigade', 'Reconnaissance Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.32016,31.25034]}'), 4326)::geography),
  ('aircraft', 'f_16', 'Israeli Air Force', '105 Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.29784,31.24905]}'), 4326)::geography),
  ('helicopter', 'apache', 'Israeli Air Force', '190 Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.29965,31.22104]}'), 4326)::geography),
  ('helicopter', 'black_hawk', 'Israeli Air Force', '124 Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.27532,31.22197]}'), 4326)::geography),
  ('infantry', NULL, 'Golani Brigade', '12th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.10927,33.08414]}'), 4326)::geography),
  ('infantry', NULL, 'Golani Brigade', '13th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.12752,33.10547]}'), 4326)::geography),
  ('infantry', NULL, 'Golani Brigade', '51st Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.1414,33.08284]}'), 4326)::geography),
  ('infantry', NULL, 'Golani Brigade', '12th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.17073,33.08335]}'), 4326)::geography),
  ('infantry', NULL, 'Golani Brigade', '13th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.17911,33.05835]}'), 4326)::geography),
  ('armor', 'merkava_3', '7th Armored Brigade', '75th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.21034,33.06118]}'), 4326)::geography),
  ('armor', 'merkava_4', '7th Armored Brigade', '82nd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.22161,33.03921]}'), 4326)::geography),
  ('armor', 'merkava_4', '7th Armored Brigade', '71st Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.2437,33.05168]}'), 4326)::geography),
  ('armor', 'merkava_5', '7th Armored Brigade', '75th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.26647,33.03217]}'), 4326)::geography),
  ('apc', 'namer', '7th Armored Brigade', '82nd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.28842,33.05064]}'), 4326)::geography),
  ('apc', 'eitan', '7th Armored Brigade', '82nd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.31372,33.04224]}'), 4326)::geography),
  ('apc', 'achzarit', '7th Armored Brigade', '82nd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.3235,33.06855]}'), 4326)::geography),
  ('artillery', 'm109', '91st Division Artillery', '334th Artillery Regiment', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.35094,33.06699]}'), 4326)::geography),
  ('artillery', 'm109', '91st Division Artillery', '286th Artillery Regiment', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.36072,33.09331]}'), 4326)::geography),
  ('artillery', 'sigma_155', '91st Division Artillery', '334th Artillery Regiment', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.39297,33.08415]}'), 4326)::geography),
  ('drone', 'quadcopter', '769th "Hiram" Territorial Brigade', '1st Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.40169,33.11215]}'), 4326)::geography),
  ('drone', 'quadcopter', '769th "Hiram" Territorial Brigade', '2nd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.42805,33.11228]}'), 4326)::geography),
  ('drone', 'quadcopter', '769th "Hiram" Territorial Brigade', '3rd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.42975,33.1446]}'), 4326)::geography),
  ('uav', 'heron_tp', '91st Division', 'Division UAV Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.45751,33.14882]}'), 4326)::geography),
  ('uav', 'hermes_900', '91st Division', 'Division UAV Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.46443,33.17322]}'), 4326)::geography),
  ('transport', 'truck', '300th "Baram" Territorial Brigade', 'Logistics Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.49435,33.17536]}'), 4326)::geography),
  ('transport', 'truck', '300th "Baram" Territorial Brigade', 'Logistics Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.49696,33.20394]}'), 4326)::geography),
  ('transport', 'truck', '300th "Baram" Territorial Brigade', 'Logistics Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.52184,33.21094]}'), 4326)::geography),
  ('bulldozer', 'd9', 'Combat Engineering Corps', '605th Combat Engineering Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.52517,33.23882]}'), 4326)::geography),
  ('bulldozer', 'd9', 'Combat Engineering Corps', '605th Combat Engineering Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.55221,33.24374]}'), 4326)::geography),
  ('vehicle', 'david', 'Golani Brigade', 'Reconnaissance Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.55554,33.27162]}'), 4326)::geography),
  ('vehicle', 'sufa', 'Golani Brigade', 'Reconnaissance Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.57327,33.26575]}'), 4326)::geography),
  ('vehicle', 'abir', 'Golani Brigade', 'Reconnaissance Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.60161,33.27331]}'), 4326)::geography),
  ('aircraft', 'f_15', 'Israeli Air Force', '133 Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.61578,33.25107]}'), 4326)::geography),
  ('helicopter', 'apache', 'Israeli Air Force', '190 Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.6454,33.26134]}'), 4326)::geography),
  ('helicopter', 'black_hawk', 'Israeli Air Force', '114 Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.65828,33.23639]}'), 4326)::geography),
  ('infantry', NULL, 'Paratroopers Brigade', '101st Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.53402,32.49455]}'), 4326)::geography),
  ('infantry', NULL, 'Paratroopers Brigade', '202nd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.5492,32.47386]}'), 4326)::geography),
  ('infantry', NULL, 'Paratroopers Brigade', '890th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.52255,32.45701]}'), 4326)::geography),
  ('infantry', NULL, 'Paratroopers Brigade', '101st Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.53972,32.43614]}'), 4326)::geography),
  ('infantry', NULL, 'Paratroopers Brigade', '202nd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.52403,32.41828]}'), 4326)::geography),
  ('armor', 'merkava_3', '179th Armored Brigade', '184th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.54419,32.39715]}'), 4326)::geography),
  ('armor', 'merkava_4', '179th Armored Brigade', '195th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.52551,32.37956]}'), 4326)::geography),
  ('armor', 'merkava_4', '179th Armored Brigade', '409th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.5357,32.35933]}'), 4326)::geography),
  ('armor', 'merkava_5', '179th Armored Brigade', '184th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.513,32.34354]}'), 4326)::geography),
  ('apc', 'namer', '179th Armored Brigade', '195th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.52673,32.32108]}'), 4326)::geography),
  ('apc', 'eitan', '179th Armored Brigade', '195th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.51011,32.3049]}'), 4326)::geography),
  ('apc', 'achzarit', '179th Armored Brigade', '195th Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.52287,32.28264]}'), 4326)::geography),
  ('artillery', 'm109', 'Judea and Samaria Division Artillery', '9210th Artillery Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.50331,32.26706]}'), 4326)::geography),
  ('artillery', 'm109', 'Judea and Samaria Division Artillery', '9215th Artillery Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.51607,32.24481]}'), 4326)::geography),
  ('artillery', 'sigma_155', 'Judea and Samaria Division Artillery', '9210th Artillery Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.4877,32.23105]}'), 4326)::geography),
  ('drone', 'quadcopter', 'Nahal Brigade', '932nd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.50241,32.20839]}'), 4326)::geography),
  ('drone', 'quadcopter', 'Nahal Brigade', '933rd Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.48481,32.19241]}'), 4326)::geography),
  ('drone', 'quadcopter', 'Nahal Brigade', '50th "Palchan" Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.50247,32.16914]}'), 4326)::geography),
  ('uav', 'orbiter_4', 'Judea and Samaria Division', 'Division UAV Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.48193,32.15376]}'), 4326)::geography),
  ('uav', 'skylark_1', 'Judea and Samaria Division', 'Division UAV Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.48979,32.13252]}'), 4326)::geography),
  ('transport', 'truck', '417th Jordan Valley Territorial Brigade', 'Logistics Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.46631,32.11775]}'), 4326)::geography),
  ('transport', 'truck', '417th Jordan Valley Territorial Brigade', 'Logistics Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.47337,32.09573]}'), 4326)::geography),
  ('transport', 'truck', '417th Jordan Valley Territorial Brigade', 'Logistics Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.45231,32.086]}'), 4326)::geography),
  ('bulldozer', 'd9', 'Combat Engineering Corps', '614th Combat Engineering Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.45694,32.06077]}'), 4326)::geography),
  ('bulldozer', 'd9', 'Combat Engineering Corps', '614th Combat Engineering Battalion', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.441,32.04701]}'), 4326)::geography),
  ('vehicle', 'david', 'Paratroopers Brigade', 'Reconnaissance Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.45926,32.02899]}'), 4326)::geography),
  ('vehicle', 'sufa', 'Paratroopers Brigade', 'Reconnaissance Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.43561,32.00813]}'), 4326)::geography),
  ('vehicle', 'abir', 'Paratroopers Brigade', 'Reconnaissance Company', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.45586,31.99024]}'), 4326)::geography),
  ('aircraft', 'f_35', 'Israeli Air Force', '140 "Golden Eagle" Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.43932,31.97238]}'), 4326)::geography),
  ('helicopter', 'apache', 'Israeli Air Force', '190 Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.45793,31.94986]}'), 4326)::geography),
  ('helicopter', 'black_hawk', 'Israeli Air Force', '124 Squadron', ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.43805,31.93365]}'), 4326)::geography);
