-- 35_add_publish_request_fields
-- Agrega campos para flujo "Solicitud de publicación" sobre drafts de site_versions.
-- Ejecutar en Supabase SQL Editor (staging).

begin;

alter table public.site_versions
  add column if not exists publish_requested_at timestamptz null,
  add column if not exists publish_requested_by uuid null references auth.users(id),
  add column if not exists publish_request_note text null,
  add column if not exists publish_notified_at timestamptz null;

-- Índice para localizar solicitudes pendientes rápidamente por sitio.
create index if not exists idx_site_versions_request_pending
  on public.site_versions (site_id, status, publish_requested_at desc);

commit;

