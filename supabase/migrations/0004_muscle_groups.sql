-- Jemnější svalové partie (PRD v2.7):
--   core -> břicho; paže -> biceps / triceps; nohy -> hýždě / přední stehna / zadní stehna / lýtka.
-- Zařazení jednotlivých cviků provede import knihovny (scripts/import-exercises.ts, soubor docs/cviky_import.xlsx).
-- Pořadí: 1) tento soubor (část 1), 2) import, 3) část 2 (ověření nové kontroly na všech řádcích).

-- Část 1: nová kontrola, platí pro nové a upravené řádky; stávající řádky se ověří až po importu
alter table public.exercises drop constraint if exists exercises_muscle_check;
alter table public.exercises add constraint exercises_muscle_check
  check (muscle in ('hrudník','záda','ramena','biceps','triceps','břicho','hýždě','přední stehna','zadní stehna','lýtka','celé tělo'))
  not valid;

-- Část 2 (po importu):
-- alter table public.exercises validate constraint exercises_muscle_check;
