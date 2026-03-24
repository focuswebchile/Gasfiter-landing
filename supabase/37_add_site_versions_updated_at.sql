-- 37_add_site_versions_updated_at
-- Agrega updated_at y trigger de touch para mejorar trazabilidad de drafts en site_versions.
-- Ejecutar en Supabase SQL Editor (staging / producción).

begin;

alter table public.site_versions
  add column if not exists updated_at timestamptz not null default now();

update public.site_versions
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

create or replace function public.touch_site_versions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_site_versions_touch on public.site_versions;
create trigger trg_site_versions_touch
before update on public.site_versions
for each row execute function public.touch_site_versions_updated_at();

create index if not exists idx_site_versions_site_status_updated_at
  on public.site_versions (site_id, status, updated_at desc);

commit;
