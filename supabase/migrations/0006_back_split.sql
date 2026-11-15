-- Záda rozdělena na „horní záda“ (lopatky) a „spodní záda“ (bederní část) (PRD v2.9).
-- Pořadí: 1) část 1, 2) import knihovny (zařazení cviků), 3) část 2.

-- Část 1
alter table public.exercises drop constraint if exists exercises_muscle_check;
alter table public.exercises add constraint exercises_muscle_check
  check (muscle in ('hrudník','horní záda','spodní záda','ramena','biceps','triceps','břicho','šikmé břicho','hýždě','přední stehna','zadní stehna','lýtka','celé tělo'))
  not valid;

-- Část 2 (po importu):
-- alter table public.exercises validate constraint exercises_muscle_check;
