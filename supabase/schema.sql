-- Gasfiter dynamic settings schema
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'section_id') then
    create type public.section_id as enum (
      'hero',
      'audience',
      'services',
      'projects',
      'urgency_banner',
      'contact_banner',
      'testimonials',
      'faq'
    );
  end if;
end $$;

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.colors (
  site_id uuid primary key references public.sites(id) on delete cascade,
  "primary" text,
  secondary text,
  background text,
  text text,
  updated_at timestamptz not null default now()
);

create table if not exists public.typography (
  site_id uuid primary key references public.sites(id) on delete cascade,
  font text,
  font_family text,
  base_size text,
  line_height text,
  updated_at timestamptz not null default now()
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  section_id public.section_id not null,
  enabled boolean not null default true,
  "order" integer not null default 100,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, section_id)
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  section_ref uuid not null references public.sections(id) on delete cascade,
  section_id public.section_id not null,
  enabled boolean not null default true,
  "order" integer not null default 100,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sections_site_order on public.sections(site_id, "order");
create index if not exists idx_items_site_section_order on public.items(site_id, section_id, "order");

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sites_touch on public.sites;
create trigger trg_sites_touch before update on public.sites
for each row execute function public.touch_updated_at();

drop trigger if exists trg_colors_touch on public.colors;
create trigger trg_colors_touch before update on public.colors
for each row execute function public.touch_updated_at();

drop trigger if exists trg_typography_touch on public.typography;
create trigger trg_typography_touch before update on public.typography
for each row execute function public.touch_updated_at();

drop trigger if exists trg_sections_touch on public.sections;
create trigger trg_sections_touch before update on public.sections
for each row execute function public.touch_updated_at();

drop trigger if exists trg_items_touch on public.items;
create trigger trg_items_touch before update on public.items
for each row execute function public.touch_updated_at();
