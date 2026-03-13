# T12 — Auditoria inicial de limpieza de logica `ABCIS` en `Gasfiter`

## Objetivo
Identificar los puntos concretos que deben limpiarse del repo `Gasfiter` ahora que `ABCIS` ya fue desacoplado.

## Referencias encontradas

### Middleware y routing
- `middleware.ts`
  - `CMS_HOST = "cms.abcis.cl"`
  - `CMS_STAGING_PATH = "/staging?slug=abcis"`
  - redirect implicito de `cms.abcis.cl` a staging de `abcis`

### Formularios
- `src/app/api/forms/contact/route.ts`
  - fallback de `siteSlug` a `abcis`
- `src/app/api/forms/ethics/route.ts`
  - fallback de `siteSlug` a `abcis`

### Settings API
- `src/app/api/sites/[slug]/settings/route.ts`
  - allowlist de origins para `abcis.cl` y `www.abcis.cl`

### UI de staging
- `src/components/staging-workflow-panel.tsx`
  - ramas condicionales para `normalizedSiteSlug === "abcis"`
  - ajustes de FAQ/testimonials
  - tipografia especial
  - placeholders y comportamiento de contacto especifico del cliente

### Reglas de publicacion
- `src/lib/publish-requirements.ts`
  - excepcion directa para `abcis`

### Scripts y seeds
- `supabase/seed-gasfiter-staging-min.sql`
  - slug `gasfiter-staging`
- `README.md`
  - aun describe defaults heredados de Gasfiter

## Clasificacion de riesgo

### Bajo riesgo de limpiar
- documentacion legacy
- README
- comentarios o textos no ejecutables

### Riesgo medio
- defaults de slug
- textos de placeholder
- ramas de UI exclusivas para `abcis`

### Riesgo alto
- middleware
- allowlist de origins
- rutas API de formularios
- publish requirements

## Recomendacion de ejecucion
1. auditar deploys vivos que dependan de este repo
2. confirmar si `gasfiter-landing` seguira existiendo como app publica de Gasfiter
3. limpiar primero documentacion y branding
4. luego limpiar ramas `abcis` de UI
5. dejar middleware/API/forms/origins para una limpieza posterior controlada, con validacion de runtime
