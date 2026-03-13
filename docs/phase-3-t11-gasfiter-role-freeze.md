# T11 — Congelamiento del rol de `gasfiter-landing`

## Objetivo
Congelar el rol del repo `Gasfiter` para evitar que vuelva a operar como backend productivo de `ABCIS` por confusion historica.

## Hallazgo
El repo `Gasfiter` contiene logica que nacio para Gasfiter, pero termino soportando tambien el CMS/API de `ABCIS`.

Referencias detectadas:
- `middleware.ts`
  - `cms.abcis.cl`
  - redirect a `/staging?slug=abcis`
- `src/app/api/forms/contact/route.ts`
  - fallback de `siteSlug` a `abcis`
- `src/app/api/forms/ethics/route.ts`
  - fallback de `siteSlug` a `abcis`
- `src/app/api/sites/[slug]/settings/route.ts`
  - origins explicitos para `abcis.cl`
- `src/components/staging-workflow-panel.tsx`
  - multiples ramas `normalizedSiteSlug === "abcis"`
- `src/lib/publish-requirements.ts`
  - comportamiento especial para `abcis`

## Estado productivo actual
`ABCIS` ya no depende de este repo para su backend productivo. El flujo productivo ahora vive en `cms-abcis`.

## Decision de arquitectura
A partir de este punto:
- `cms-abcis` es el backend/CMS del cliente `ABCIS`
- `Gasfiter` vuelve a tratarse como repo propio de Gasfiter o repo legacy transicional
- toda limpieza de logica `abcis` en este repo debe hacerse con prudencia, pero ya no esta bloqueada por una dependencia productiva del cliente

## Alcance de limpieza posterior
La limpieza debe enfocarse en:
- referencias explicitas a `abcis`
- redirects a `cms.abcis.cl`
- defaults de slug `abcis`
- formularios y workflows con comportamiento exclusivo del cliente

## Regla de seguridad
Antes de eliminar cualquier rama o comportamiento, validar que no exista otro deploy vivo de `Gasfiter` consumiendo esa logica.
