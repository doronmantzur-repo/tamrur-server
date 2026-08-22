-- One-time seed of real Israeli hospital locations into public.locations, so
-- the brigade dashboard's map layer (which already filters
-- location.type === "hospital") has real markers to render. Modeled on
-- 006_forces.sql's seed block: locations has no POST/PUT route, so this
-- table is populated by hand, directly against Supabase, not through the
-- app. type is inserted as a bare string ('hospital'), which Postgres
-- implicitly casts to the existing "loaction-type" enum backing this column
-- (labels: 'landing-pad', 'exchange-point', 'hospital' -- note the table's
-- own enum type name is itself misspelled "loaction-type").
--
-- locations.id is bigint NOT NULL with no default/identity -- the sequence
-- that would normally back it (landing_pads_id_seq, left over from before
-- this table was renamed/repurposed from landing_pads) isn't wired to the
-- column and is stale, so ids are assigned explicitly here, continuing on
-- from the table's current max id (3, from the existing LP_001..LP_003
-- rows) as of this migration being written.
--
-- Run once against the Supabase project (SQL editor or psql). Not
-- idempotent -- re-running duplicates rows.

BEGIN;

INSERT INTO public.locations (id, name, type, is_ok, status_update, location) VALUES
  (4, 'Sheba Medical Center (Tel HaShomer)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.8431,32.0469]}'), 4326)::geography),
  (5, 'Tel Aviv Sourasky Medical Center (Ichilov)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.7892,32.0803]}'), 4326)::geography),
  (6, 'Rambam Health Care Campus', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.9867,32.8256]}'), 4326)::geography),
  (7, 'Hadassah Medical Center (Ein Kerem)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.1486,31.7645]}'), 4326)::geography),
  (8, 'Hadassah Medical Center (Mount Scopus)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.2411,31.7969]}'), 4326)::geography),
  (9, 'Shaare Zedek Medical Center', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.1911,31.7719]}'), 4326)::geography),
  (10, 'Soroka University Medical Center', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.7997,31.2592]}'), 4326)::geography),
  (11, 'Rabin Medical Center (Beilinson Campus)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.8647,32.0906]}'), 4326)::geography),
  (12, 'Rabin Medical Center (Hasharon Campus)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.8731,32.0911]}'), 4326)::geography),
  (13, 'Schneider Children''s Medical Center', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.8653,32.0900]}'), 4326)::geography),
  (14, 'Shamir Medical Center (Assaf Harofeh)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.8419,31.9639]}'), 4326)::geography),
  (15, 'Meir Medical Center', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.9125,32.1764]}'), 4326)::geography),
  (16, 'Edith Wolfson Medical Center', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.7675,32.0336]}'), 4326)::geography),
  (17, 'Barzilai Medical Center', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.5583,31.6669]}'), 4326)::geography),
  (18, 'Samson Assuta Ashdod University Hospital', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.6644,31.7828]}'), 4326)::geography),
  (19, 'Hillel Yaffe Medical Center', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.9081,32.4347]}'), 4326)::geography),
  (20, 'Galilee Medical Center (Nahariya)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.1158,33.0075]}'), 4326)::geography),
  (21, 'Ziv Medical Center (Safed)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.5019,32.9792]}'), 4326)::geography),
  (22, 'Baruch Padeh Medical Center (Poriya)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.5414,32.7539]}'), 4326)::geography),
  (23, 'Emek Medical Center (Afula)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.3061,32.6206]}'), 4326)::geography),
  (24, 'Carmel Medical Center (Haifa)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.9886,32.7981]}'), 4326)::geography),
  (25, 'Bnai Zion Medical Center (Haifa)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.9961,32.8106]}'), 4326)::geography),
  (26, 'Laniado Hospital (Netanya)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.8658,32.3414]}'), 4326)::geography),
  (27, 'Ma''aynei HaYeshua Medical Center', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.8328,32.0864]}'), 4326)::geography),
  (28, 'Yoseftal Medical Center (Eilat)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.9458,29.5539]}'), 4326)::geography),
  (29, 'Herzliya Medical Center', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.8000,32.1625]}'), 4326)::geography),
  (30, 'Assuta Ramat HaChayal (Tel Aviv)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.8361,32.1097]}'), 4326)::geography),
  (31, 'ALYN Hospital (Jerusalem)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.1764,31.7708]}'), 4326)::geography),
  (32, 'Herzog Hospital (Jerusalem)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.1883,31.7881]}'), 4326)::geography),
  (33, 'Reuth Medical & Rehabilitation Center', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.7806,32.0494]}'), 4326)::geography),
  (34, 'Loewenstein Rehabilitation Hospital', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[34.8719,32.1817]}'), 4326)::geography),
  (35, 'Holy Family Hospital (Nazareth)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.3014,32.7092]}'), 4326)::geography),
  (36, 'Nazareth Hospital (EMMS / The English Hospital)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.2936,32.7033]}'), 4326)::geography),
  (37, 'St. Vincent de Paul Hospital (French Hospital, Nazareth)', 'hospital', true, NULL, ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Point","coordinates":[35.2975,32.7011]}'), 4326)::geography);

COMMIT;
