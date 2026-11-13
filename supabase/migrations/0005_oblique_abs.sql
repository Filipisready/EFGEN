-- Nová svalová partie „šikmé břicho“ (PRD v2.8). Zařazení cviků provede import knihovny.
alter table public.exercises drop constraint if exists exercises_muscle_check;
alter table public.exercises add constraint exercises_muscle_check
  check (muscle in ('hrudník','záda','ramena','biceps','triceps','břicho','šikmé břicho','hýždě','přední stehna','zadní stehna','lýtka','celé tělo'));
