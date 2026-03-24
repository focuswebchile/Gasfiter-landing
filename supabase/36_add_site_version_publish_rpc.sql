-- 36_add_site_version_publish_rpc
-- Agrega funciones transaccionales para publicar y hacer rollback de site_versions.
-- Ejecutar en Supabase SQL Editor (staging / producción).

begin;

create or replace function public.publish_site_version(
  p_site_id uuid,
  p_snapshot jsonb,
  p_user_id uuid,
  p_notes text default null
)
returns table (
  id uuid,
  version_number integer,
  snapshot jsonb
)
language plpgsql
as $$
declare
  inserted_row public.site_versions%rowtype;
begin
  update public.site_versions
  set
    status = 'archived',
    published_at = null
  where site_id = p_site_id
    and status = 'published';

  insert into public.site_versions (
    site_id,
    version_number,
    status,
    snapshot,
    created_by,
    published_at,
    notes
  )
  values (
    p_site_id,
    null,
    'published',
    p_snapshot,
    p_user_id,
    now(),
    p_notes
  )
  returning * into inserted_row;

  return query
  select inserted_row.id, inserted_row.version_number, inserted_row.snapshot;
end;
$$;

create or replace function public.rollback_site_version(
  p_site_id uuid,
  p_snapshot jsonb,
  p_user_id uuid,
  p_notes text default null
)
returns table (
  id uuid,
  version_number integer,
  snapshot jsonb
)
language plpgsql
as $$
declare
  inserted_row public.site_versions%rowtype;
begin
  update public.site_versions
  set
    status = 'archived',
    published_at = null
  where site_id = p_site_id
    and status = 'published';

  insert into public.site_versions (
    site_id,
    version_number,
    status,
    snapshot,
    created_by,
    published_at,
    notes
  )
  values (
    p_site_id,
    null,
    'published',
    p_snapshot,
    p_user_id,
    now(),
    p_notes
  )
  returning * into inserted_row;

  return query
  select inserted_row.id, inserted_row.version_number, inserted_row.snapshot;
end;
$$;

commit;
