-- Seed base for Gasfiter site
-- Run this in Supabase SQL Editor

-- 1) Site
insert into public.sites (slug, name, status)
values ('gasfiter', 'Gasfiter Landing', 'published')
on conflict (slug) do update
set name = excluded.name,
    status = excluded.status;

-- 2) Global colors
insert into public.colors (site_id, "primary", secondary, background, text)
select s.id, '#1565c0', '#ff6f00', '#f2f4f7', '#1f2937'
from public.sites s
where s.slug = 'gasfiter'
on conflict (site_id) do update
set "primary" = excluded."primary",
    secondary = excluded.secondary,
    background = excluded.background,
    text = excluded.text;

-- 3) Global typography
insert into public.typography (site_id, font, font_family, base_size, line_height)
select s.id, 'Inter', 'Inter', '16px', '1.5'
from public.sites s
where s.slug = 'gasfiter'
on conflict (site_id) do update
set font = excluded.font,
    font_family = excluded.font_family,
    base_size = excluded.base_size,
    line_height = excluded.line_height;

-- 4) Sections
with site_ref as (
  select id as site_id
  from public.sites
  where slug = 'gasfiter'
)
insert into public.sections (site_id, section_id, enabled, "order", data)
select site_ref.site_id, t.section_id::public.section_id, t.enabled, t."order", t.data::jsonb
from site_ref
cross join (
  values
    ('hero', true, 10, '{"eyebrow":"SERVICIO 24/7 · SANTIAGO","title":"Gasfiter urgente en Santiago\nLlegamos en menos de 40 minutos","subtitle":"Fugas, destapes, calefont e instalaciones. Respuesta inmediata, diagnóstico claro y solución en terreno.","cta_primary":{"text":"LLAMAR AHORA +56 9 XXXX XXXX","url":"tel:+569XXXXXXX"},"cta_secondary":{"text":"WhatsApp","url":"https://wa.me/569XXXXXXX"},"image":"/images/heroseccion.webp"}'),
    ('audience', true, 20, '{"kicker":"¿Para quién es este servicio?","title":"Atención urgente para hogares y negocios en Santiago","description":"Atendemos dueños de casa, arrendatarios, pymes y administradores que necesitan solución hoy.","cta_primary":{"text":"+56 9 XXXX XXXX","url":"tel:+569XXXXXXX"},"cta_secondary":{"text":"Agendar visita","url":"#contacto"},"images":{"back":"/images/gasfiter-calefont.webp","front":"/images/gasfiter-emergencias.webp"},"bullets":[{"text":"Respuesta rápida 24/7 real","icon":"fa-circle-check","enabled":true,"order":1},{"text":"Diagnóstico claro antes de intervenir","icon":"fa-circle-check","enabled":true,"order":2},{"text":"Trabajo limpio y garantía por escrito","icon":"fa-circle-check","enabled":true,"order":3}]}'),
    ('services', true, 30, '{"title":"¿Qué problema tienes ahora?","subtitle":"Soluciones rápidas para hogar y negocio"}'),
    ('projects', true, 40, '{"title":"Trabajos realizados en Santiago","description":"Haz click y arrastra para deslizar las imágenes hacia la izquierda o derecha.","controls_enabled":true}'),
    ('urgency_banner', true, 50, '{"title":"¿Tienes una urgencia ahora?","description":"Te atendemos hoy, en tu comuna, con respuesta rápida y técnica.","cta_primary":{"text":"Llamar ahora","url":"tel:+569XXXXXXX"}}'),
    ('contact_banner', true, 60, '{"kicker":"CONTACTO","title":"¿Tienes preguntas?\nEscríbenos ahora.","background_image":"/images/contact.jpg","form_enabled":true,"fields":["nombre","telefono","comuna","email","problema"],"submit_text":"Enviar solicitud"}'),
    ('testimonials', true, 70, '{"kicker":"Testimonios","title":"Comentarios de nuestros clientes","autoplay_ms":0}'),
    ('faq', true, 80, '{"title":"Preguntas frecuentes"}')
) as t(section_id, enabled, "order", data)
on conflict (site_id, section_id) do update
set enabled = excluded.enabled,
    "order" = excluded."order",
    data = excluded.data;

-- 5) Items
-- Optional cleanup to avoid duplicates in repeated runs.
delete from public.items i
using public.sites s
where i.site_id = s.id
  and s.slug = 'gasfiter';

with site_ref as (
  select id as site_id
  from public.sites
  where slug = 'gasfiter'
),
section_map as (
  select sec.id as section_ref, sec.section_id, sec.site_id
  from public.sections sec
  join site_ref sr on sr.site_id = sec.site_id
)
insert into public.items (site_id, section_ref, section_id, enabled, "order", data)
select sm.site_id, sm.section_ref, sm.section_id, x.enabled, x."order", x.data::jsonb
from section_map sm
join (
  values
    ('services', true, 1, '{"title":"Filtraciones y fugas","description":"Detección rápida y reparación inmediata para evitar daños mayores.","icon":"fa-droplet","cta":{"text":"Llamar por esto","url":"tel:+569XXXXXXX"}}'),
    ('services', true, 2, '{"title":"Destapes urgentes","description":"Atendemos obstrucciones críticas en cocina, baño y desagües.","icon":"fa-toilet","cta":{"text":"Llamar por esto","url":"tel:+569XXXXXXX"}}'),
    ('services', true, 3, '{"title":"Instalaciones y reparaciones","description":"Grifería, lavamanos, calefont y artefactos sanitarios.","icon":"fa-screwdriver-wrench","cta":{"text":"Llamar por esto","url":"tel:+569XXXXXXX"}}'),

    ('projects', true, 1, '{"title":"Destape urgente","location":"Providencia","image":"/images/gasfiter-destape.webp","size":"square"}'),
    ('projects', true, 2, '{"title":"Instalación calefont","location":"Las Condes","image":"/images/gasfiter-calefont.webp","size":"wide"}'),
    ('projects', true, 3, '{"title":"Mantención preventiva","location":"Santiago Centro","image":"/images/gasfiter-mantencion.webp","size":"square"}'),
    ('projects', true, 4, '{"title":"Cambio de grifería","location":"La Florida","image":"/images/gasfiter-griferia.webp","size":"square"}'),

    ('testimonials', true, 1, '{"quote":"Llegaron rápido, explicaron todo con claridad y dejaron el trabajo impecable.","name":"Roland Berry","location":"Providencia, RM","avatar":"/images/gasfiter-testimonial.webp"}'),
    ('testimonials', true, 2, '{"quote":"Excelente atención, muy puntuales y transparentes con los costos.","name":"George Caldwell","location":"Las Condes, RM","avatar":"/images/gasfiter-testimonial-2.webp"}'),
    ('testimonials', true, 3, '{"quote":"Muy profesionales y ordenados, dejaron todo limpio.","name":"Camila Rojas","location":"Ñuñoa, RM","avatar":"/images/gasfiter-testimonial-3.webp"}'),

    ('faq', true, 1, '{"question":"¿Cobran visita?","answer":"Cobramos solo si hay diagnóstico en terreno y siempre se informa antes de iniciar."}'),
    ('faq', true, 2, '{"question":"¿Cuánto demoran en llegar?","answer":"En promedio 40 minutos en Santiago, según tráfico y comuna."}'),
    ('faq', true, 3, '{"question":"¿Atienden de noche y feriados?","answer":"Sí, tenemos atención 24/7 para urgencias reales en domicilio o negocio."}'),
    ('faq', true, 4, '{"question":"¿Los trabajos tienen garantía?","answer":"Sí, entregamos garantía de 30 días sobre la intervención realizada."}')
) as x(section_id, enabled, "order", data)
  on x.section_id::public.section_id = sm.section_id;
