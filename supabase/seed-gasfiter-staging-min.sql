-- Gasfiter staging minimal seed (safe upsert)
-- Target slug: gasfiter-staging
-- Run in Supabase SQL Editor (staging project only)
-- This script does not delete data and only touches rows for the staging slug.

begin;

-- 1) Ensure staging site exists
insert into public.sites (slug, name)
values ('gasfiter-staging', 'Gasfiter Staging')
on conflict (slug) do update
set name = excluded.name;

-- 2) Upsert colors (supports both legacy and renamed columns)
do $$
declare
  v_site_id uuid;
  v_sql text;
begin
  select id into v_site_id from public.sites where slug = 'gasfiter-staging' limit 1;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'colors' and column_name = 'primary_color'
  ) then
    v_sql := $q$
      insert into public.colors (site_id, primary_color, secondary, background, text)
      values ($1, '#1565c0', '#ff6f00', '#f2f4f7', '#1f2937')
      on conflict (site_id) do update
      set primary_color = excluded.primary_color,
          secondary = excluded.secondary,
          background = excluded.background,
          text = excluded.text
    $q$;
  else
    v_sql := $q$
      insert into public.colors (site_id, "primary", secondary, background, text)
      values ($1, '#1565c0', '#ff6f00', '#f2f4f7', '#1f2937')
      on conflict (site_id) do update
      set "primary" = excluded."primary",
          secondary = excluded.secondary,
          background = excluded.background,
          text = excluded.text
    $q$;
  end if;

  execute v_sql using v_site_id;
end $$;

-- 3) Upsert typography
insert into public.typography (site_id, font, font_family, base_size, line_height)
select s.id, 'Inter', 'Inter', '16px', '1.5'
from public.sites s
where s.slug = 'gasfiter-staging'
on conflict (site_id) do update
set font = excluded.font,
    font_family = excluded.font_family,
    base_size = excluded.base_size,
    line_height = excluded.line_height;

-- 4) Upsert hero section (enabled=true, sort_order/order=10)
do $$
declare
  v_site_id uuid;
  v_sql text;
  v_data jsonb := jsonb_build_object(
    'eyebrow', 'STAGING · GASFITER',
    'title', 'Gasfiter urgente en Santiago\\nStaging',
    'subtitle', 'Entorno de prueba seguro para validar contenido y UX sin tocar producción.',
    'cta_primary', jsonb_build_object('text', 'Llamar staging', 'url', 'tel:+56900000000'),
    'cta_secondary', jsonb_build_object('text', 'WhatsApp', 'url', 'https://wa.me/56900000000'),
    'image', '/images/heroseccion.webp'
  );
begin
  select id into v_site_id from public.sites where slug = 'gasfiter-staging' limit 1;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sections' and column_name = 'sort_order'
  ) then
    v_sql := $q$
      insert into public.sections (site_id, section_id, enabled, sort_order, data)
      values ($1, 'hero'::public.section_id, true, 10, $2)
      on conflict (site_id, section_id) do update
      set enabled = excluded.enabled,
          sort_order = excluded.sort_order,
          data = excluded.data
    $q$;
  else
    v_sql := $q$
      insert into public.sections (site_id, section_id, enabled, "order", data)
      values ($1, 'hero'::public.section_id, true, 10, $2)
      on conflict (site_id, section_id) do update
      set enabled = excluded.enabled,
          "order" = excluded."order",
          data = excluded.data
    $q$;
  end if;

  execute v_sql using v_site_id, v_data;
end $$;

-- 5) Upsert one base hero item (title/subtitle/cta_primary/image)
-- Note: hero usually reads from section data, but this base item is included per staging checklist.
do $$
declare
  v_site_id uuid;
  v_section_ref uuid;
  v_item_id uuid;
  v_sql text;
  v_data jsonb := jsonb_build_object(
    'title', 'Gasfiter urgente en Santiago (item base)',
    'subtitle', 'Contenido mínimo para validar render dinámico en staging.',
    'cta_primary', jsonb_build_object('text', 'Llamar staging', 'url', 'tel:+56900000000'),
    'image', '/images/heroseccion.webp'
  );
begin
  select id into v_site_id from public.sites where slug = 'gasfiter-staging' limit 1;

  select id into v_section_ref
  from public.sections
  where site_id = v_site_id and section_id = 'hero'::public.section_id
  limit 1;

  select i.id into v_item_id
  from public.items i
  where i.site_id = v_site_id and i.section_id = 'hero'::public.section_id
  order by i.created_at asc
  limit 1;

  if v_item_id is null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'items' and column_name = 'sort_order'
    ) then
      v_sql := $q$
        insert into public.items (site_id, section_ref, section_id, enabled, sort_order, data)
        values ($1, $2, 'hero'::public.section_id, true, 1, $3)
      $q$;
    else
      v_sql := $q$
        insert into public.items (site_id, section_ref, section_id, enabled, "order", data)
        values ($1, $2, 'hero'::public.section_id, true, 1, $3)
      $q$;
    end if;

    execute v_sql using v_site_id, v_section_ref, v_data;
  else
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'items' and column_name = 'sort_order'
    ) then
      v_sql := $q$
        update public.items
        set enabled = true,
            sort_order = 1,
            data = $2
        where id = $1
      $q$;
    else
      v_sql := $q$
        update public.items
        set enabled = true,
            "order" = 1,
            data = $2
        where id = $1
      $q$;
    end if;

    execute v_sql using v_item_id, v_data;
  end if;
end $$;

commit;
