-- =============================================================
--  Empreinte : espace membre
--  À exécuter une seule fois dans Supabase > SQL Editor.
-- =============================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- Profils (un par compte auth.users)
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'member' check (role in ('member', 'admin')),
  calendar_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- -------------------------------------------------------------
-- Formation : modules > leçons
-- -------------------------------------------------------------
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  summary text not null default '',
  position integer not null default 0,
  bunny_video_id text,
  video_status text not null default 'none',
  video_duration integer not null default 0,
  content jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists lessons_module_idx on public.lessons(module_id, position);

create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- -------------------------------------------------------------
-- Agenda : explorations, labs et autres lives
-- -------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'lab' check (type in ('exploration', 'lab', 'autre')),
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  zoom_url text not null default '',
  capacity integer,
  replay_video_id text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists events_starts_idx on public.events(starts_at);

create table if not exists public.event_registrations (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- Inscription à un créneau avec verrou : impossible de dépasser la capacité.
create or replace function public.register_for_event(p_event_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_count integer;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    return 'non_connecte';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found or not v_event.published then
    return 'introuvable';
  end if;
  if v_event.starts_at < now() then
    return 'passe';
  end if;
  if exists (select 1 from public.event_registrations where event_id = p_event_id and user_id = v_user) then
    return 'deja_inscrit';
  end if;

  select count(*) into v_count from public.event_registrations where event_id = p_event_id;
  if v_event.capacity is not null and v_count >= v_event.capacity then
    return 'complet';
  end if;

  insert into public.event_registrations (event_id, user_id) values (p_event_id, v_user);
  return 'ok';
end;
$$;

-- Droits d'exécution : le trigger n'est jamais appelé via l'API,
-- les deux autres fonctions sont réservées aux personnes connectées.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.register_for_event(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.register_for_event(uuid) to authenticated;

-- -------------------------------------------------------------
-- Ressources
-- -------------------------------------------------------------
create table if not exists public.resource_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.resource_categories(id) on delete set null,
  title text not null,
  description text not null default '',
  kind text not null default 'file' check (kind in ('file', 'video', 'link')),
  file_path text,
  file_name text,
  file_size bigint,
  bunny_video_id text,
  url text,
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists resources_category_idx on public.resources(category_id, position);

-- -------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.resource_categories enable row level security;
alter table public.resources enable row level security;

-- profiles
drop policy if exists "profiles: lecture" on public.profiles;
create policy "profiles: lecture" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles: mise à jour admin" on public.profiles;
create policy "profiles: mise à jour admin" on public.profiles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- modules : tout le monde voit la liste (les non publiés apparaissent verrouillés)
drop policy if exists "modules: lecture" on public.modules;
create policy "modules: lecture" on public.modules
  for select to authenticated using (true);
drop policy if exists "modules: admin" on public.modules;
create policy "modules: admin" on public.modules
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- lessons : les membres ne voient que les leçons publiées de modules publiés
drop policy if exists "lessons: lecture" on public.lessons;
create policy "lessons: lecture" on public.lessons
  for select to authenticated
  using (
    public.is_admin()
    or (published and exists (
      select 1 from public.modules m where m.id = module_id and m.published
    ))
  );
drop policy if exists "lessons: admin" on public.lessons;
create policy "lessons: admin" on public.lessons
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- lesson_progress
drop policy if exists "progress: lecture" on public.lesson_progress;
create policy "progress: lecture" on public.lesson_progress
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "progress: insertion" on public.lesson_progress;
create policy "progress: insertion" on public.lesson_progress
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "progress: suppression" on public.lesson_progress;
create policy "progress: suppression" on public.lesson_progress
  for delete to authenticated using (user_id = auth.uid());

-- events
drop policy if exists "events: lecture" on public.events;
create policy "events: lecture" on public.events
  for select to authenticated
  using (published or public.is_admin());
drop policy if exists "events: admin" on public.events;
create policy "events: admin" on public.events
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- event_registrations : lecture de toutes les inscriptions (pour afficher
-- le nombre de places), insertion uniquement via register_for_event.
drop policy if exists "registrations: lecture" on public.event_registrations;
create policy "registrations: lecture" on public.event_registrations
  for select to authenticated using (true);
drop policy if exists "registrations: désinscription" on public.event_registrations;
create policy "registrations: désinscription" on public.event_registrations
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- resource_categories
drop policy if exists "categories: lecture" on public.resource_categories;
create policy "categories: lecture" on public.resource_categories
  for select to authenticated using (true);
drop policy if exists "categories: admin" on public.resource_categories;
create policy "categories: admin" on public.resource_categories
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- resources
drop policy if exists "resources: lecture" on public.resources;
create policy "resources: lecture" on public.resources
  for select to authenticated
  using (published or public.is_admin());
drop policy if exists "resources: admin" on public.resources;
create policy "resources: admin" on public.resources
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- -------------------------------------------------------------
-- Stockage des fichiers (bucket privé "fichiers")
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('fichiers', 'fichiers', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "fichiers: envoi admin" on storage.objects;
create policy "fichiers: envoi admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fichiers' and public.is_admin());
drop policy if exists "fichiers: modification admin" on storage.objects;
create policy "fichiers: modification admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'fichiers' and public.is_admin());
drop policy if exists "fichiers: suppression admin" on storage.objects;
create policy "fichiers: suppression admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fichiers' and public.is_admin());
drop policy if exists "fichiers: lecture" on storage.objects;
create policy "fichiers: lecture" on storage.objects
  for select to authenticated
  using (bucket_id = 'fichiers');
