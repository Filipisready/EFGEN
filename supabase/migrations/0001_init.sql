-- EFGEN: základní schéma (PRD v2.2, kap. 5). Čistá PostgreSQL, přenositelná.

create table public.app_settings (
  key text primary key,
  value text not null
);
-- Adresa super admina (FR-05). Změňte před spuštěním, pokud je jiná.
insert into public.app_settings (key, value) values ('admin_email', 'sulc.filip@gmail.com');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'trener' check (role in ('trener', 'admin')),
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id, new.email,
    case when lower(new.email) = lower((select value from public.app_settings where key = 'admin_email'))
         then 'admin' else 'trener' end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create table public.equipment (
  name text primary key,
  note text
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  alt_name text,
  muscle text not null check (muscle in ('nohy','záda','core','hrudník','ramena','paže','celé tělo')),
  level text not null check (level in ('začátečník','pokročilý','expert')),
  equipment text[] not null default '{}',
  environment text not null check (environment in ('uvnitř','venku','obojí')),
  formats text[] not null check (formats <@ array['Tabata','TRX','CrossFit']),
  blocks text[] not null check (blocks <@ array['rozcvička','hlavní','zklidnění'] and cardinality(blocks) > 0),
  cardio_strength smallint not null check (cardio_strength between 1 and 5),
  movement text not null check (movement in ('dřep','výpad','tlak','tah','záklon/předklon','rotace','skok','nosení','jiné')),
  default_value integer,
  unit text not null default 'opakování' check (unit in ('opakování','sekundy','metry')),
  description text not null,
  video_url text check (video_url is null or video_url ~* '^https?://'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  workout_date date not null default current_date,
  group_name text,
  group_size integer,
  format text not null check (format in ('Tabata','TRX','CrossFit')),
  subtype text check (subtype in ('AMRAP','EMOM','For Time')),
  params jsonb not null default '{}',
  content jsonb not null,            -- úplný snímek bloků, cviků, popisů a časů (FR-61)
  note text,
  created_at timestamptz not null default now()
);
create index workouts_user_idx on public.workouts (user_id, created_at desc);

create table public.email_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'workout',
  sent_at timestamptz not null default now()
);
create index email_log_user_idx on public.email_log (user_id, sent_at desc);

-- Row Level Security (FR-06)
alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.equipment enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.email_log enable row level security;

create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy profiles_delete_admin on public.profiles for delete using (public.is_admin());

create policy equipment_read on public.equipment for select to authenticated using (true);
create policy equipment_admin on public.equipment for all using (public.is_admin()) with check (public.is_admin());

create policy exercises_read on public.exercises for select to authenticated using (active or public.is_admin());
create policy exercises_admin on public.exercises for all using (public.is_admin()) with check (public.is_admin());

create policy workouts_own on public.workouts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy email_log_own_read on public.email_log for select using (user_id = auth.uid());
-- zápis do email_log provádí jen server (service role), běžný uživatel nesmí
