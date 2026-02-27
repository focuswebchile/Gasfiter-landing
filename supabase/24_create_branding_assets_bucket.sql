-- 24_create_branding_assets_bucket
-- Crea bucket para logo/favicon del branding global.
-- Ejecutar en Supabase SQL Editor del entorno STAGING.

begin;

-- 1) Crear bucket si no existe
insert into storage.buckets (id, name, public)
values ('branding-assets', 'branding-assets', true)
on conflict (id) do update
set public = excluded.public;

-- 2) Políticas de acceso (idempotentes)
-- Nota: Postgres no soporta CREATE POLICY IF NOT EXISTS.
drop policy if exists "branding_assets_public_read" on storage.objects;
drop policy if exists "branding_assets_auth_insert" on storage.objects;
drop policy if exists "branding_assets_auth_update" on storage.objects;
drop policy if exists "branding_assets_auth_delete" on storage.objects;

-- Lectura pública de archivos del bucket
create policy "branding_assets_public_read"
on storage.objects
for select
to public
using (bucket_id = 'branding-assets');

-- Escritura para usuarios autenticados
create policy "branding_assets_auth_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'branding-assets');

-- Update para usuarios autenticados
create policy "branding_assets_auth_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'branding-assets')
with check (bucket_id = 'branding-assets');

-- Delete para usuarios autenticados
create policy "branding_assets_auth_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'branding-assets');

commit;
