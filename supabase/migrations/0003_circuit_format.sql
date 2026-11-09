-- Formát „Tabata“ nahrazen formátem „Kruhový trénink“ (PRD v2.5).

-- 1) Odstranit staré kontroly povolených formátů (bez ohledu na jejich automatický název)
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname
    from pg_constraint c
    where c.contype = 'c'
      and c.conrelid in ('public.exercises'::regclass, 'public.equipment'::regclass, 'public.workouts'::regclass)
      and pg_get_constraintdef(c.oid) ilike '%tabata%'
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end $$;

-- 2) Převést data
update public.exercises set formats = array_replace(formats, 'Tabata', 'Kruhový trénink');
update public.equipment set formats = array_replace(formats, 'Tabata', 'Kruhový trénink');
alter table public.equipment alter column formats set default array['Kruhový trénink','TRX','CrossFit'];

-- Starší uložené tréninky ve formátu Tabata se převedou na kruhový trénink s výchozími časy.
-- Popis struktury se u nich přepočítá po první úpravě v aplikaci.
update public.workouts
set format = 'Kruhový trénink',
    params = '{"workSec":40,"restSec":20,"rounds":3,"pauseSec":60}'::jsonb,
    content = jsonb_set(
                jsonb_set(
                  jsonb_set(content, '{format}', '"Kruhový trénink"'),
                  '{context,format}', '"Kruhový trénink"'),
                '{params}', '{"workSec":40,"restSec":20,"rounds":3,"pauseSec":60}'::jsonb)
where format = 'Tabata';

-- 3) Nové kontroly
alter table public.exercises add constraint exercises_formats_check
  check (formats <@ array['Kruhový trénink','TRX','CrossFit']);
alter table public.equipment add constraint equipment_formats_check
  check (formats <@ array['Kruhový trénink','TRX','CrossFit']);
alter table public.workouts add constraint workouts_format_check
  check (format in ('Kruhový trénink','TRX','CrossFit'));
