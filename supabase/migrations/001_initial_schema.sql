-- UpNext — Schema inițial
-- Rulează acest fișier în Supabase Dashboard > SQL Editor

-- =============================================
-- PROFILES
-- Extinde auth.users cu preferințele utilizatorului
-- =============================================
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  preferred_genres  integer[] default '{}',   -- TMDB genre IDs
  onboarding_done   boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Creat automat la primul login
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at automat
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- =============================================
-- WATCHLIST
-- Filme pe care vrei să le vezi
-- =============================================
create table public.watchlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  movie_id    integer not null,           -- TMDB movie ID
  tmdb_data   jsonb not null,             -- { title, poster_path, release_year, genres[] }
  added_at    timestamptz default now(),
  unique (user_id, movie_id)
);

create index watchlist_user_id_idx on public.watchlist (user_id);

-- =============================================
-- WATCHED
-- Filme văzute cu rating opțional
-- =============================================
create table public.watched (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  movie_id    integer not null,           -- TMDB movie ID
  tmdb_data   jsonb not null,             -- { title, poster_path, release_year, genres[] }
  rating      smallint check (rating >= 1 and rating <= 5),
  watched_at  timestamptz default now(),
  unique (user_id, movie_id)
);

create index watched_user_id_idx on public.watched (user_id);
create index watched_rating_idx  on public.watched (user_id, rating) where rating is not null;

-- =============================================
-- ROW LEVEL SECURITY
-- Fiecare user vede și modifică doar datele lui
-- =============================================
alter table public.profiles  enable row level security;
alter table public.watchlist enable row level security;
alter table public.watched   enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Watchlist
create policy "Users can view own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);

create policy "Users can insert to own watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from own watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);

-- Watched
create policy "Users can view own watched"
  on public.watched for select
  using (auth.uid() = user_id);

create policy "Users can insert to own watched"
  on public.watched for insert
  with check (auth.uid() = user_id);

create policy "Users can update own watched"
  on public.watched for update
  using (auth.uid() = user_id);

create policy "Users can delete from own watched"
  on public.watched for delete
  using (auth.uid() = user_id);
