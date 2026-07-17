-- Run this in your Supabase project's SQL editor once it's created.
-- Starter schema only — extend as the product grows.

create type designer_role as enum ('ui_ux', 'product', 'social_media', 'other');

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role designer_role not null default 'other',
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);
