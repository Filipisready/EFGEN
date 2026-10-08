-- Pomůcky: zobrazení podle formátu a anglické názvy pro CrossFit (PRD v2.3).
alter table public.equipment add column if not exists cf_label text;
alter table public.equipment add column if not exists formats text[] not null default array['Tabata','TRX','CrossFit'];
alter table public.equipment drop constraint if exists equipment_formats_check;
alter table public.equipment add constraint equipment_formats_check check (formats <@ array['Tabata','TRX','CrossFit']);

-- Nové pomůcky pro CrossFit
insert into public.equipment (name, note, cf_label, formats) values
  ('kruhy', 'Gymnastické kruhy.', 'rings', array['CrossFit']),
  ('sáně', 'Sáně na tlačení a tažení (sled).', 'sled', array['CrossFit']),
  ('lavice', 'Plochá lavice.', 'bench', array['CrossFit']),
  ('GHD', 'Lavice na cviky GHD.', 'GHD', array['CrossFit']),
  ('šplhací lano', 'Lano na šplhání.', 'rope', array['CrossFit'])
on conflict (name) do nothing;

-- Anglické názvy v CrossFitu
update public.equipment set cf_label = v.l from (values
  ('kettlebell','kettlebell'), ('činky','dumbbell'), ('odporová guma','band'), ('medicinbal','med ball'),
  ('švihadlo','jump rope'), ('bedna','BOX'), ('hrazda','pull-up bar'), ('osa','barbell'), ('row','row'),
  ('SkiErg','SkiErg'), ('bike','bike'), ('echo bike','echo bike'), ('sandbag','sandbag'), ('kotouče','plates')
) as v(n, l) where name = v.n;

-- V CrossFitu se nepoužívají
update public.equipment set formats = array['Tabata','TRX'] where name in ('TRX','lano','bosu','roller','stepper');
