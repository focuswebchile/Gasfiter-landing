# Fase 1 - T3 - Contrato API que usa ABCIS

## Objetivo

Identificar las rutas y contratos que `ABCIS` consume hoy para poder migrarlos sin romper produccion.

## Consumo detectado desde `ABCIS`

### Settings CMS

Archivo base:

- `ABCIS/src/lib/cms-settings-client.ts`

Ruta consumida:

- `GET /api/sites/:slug/settings?mode=published|draft`

Base URL:

- `VITE_BACKEND_URL`
- fallback secundario: `NEXT_PUBLIC_BACKEND_URL`

Slug:

- `VITE_DEFAULT_SITE_SLUG`
- valor actual: `abcis`

## Shape esperado de respuesta

`ABCIS` espera una respuesta JSON con esta estructura general:

```json
{
  "site": {
    "slug": "abcis",
    "name": "string",
    "status": "published"
  },
  "settings": {
    "colors": {},
    "typography": {},
    "branding": {},
    "content": {
      "hero": {},
      "services": [],
      "faqs": [],
      "sections": []
    }
  },
  "draftUpdatedAt": "string|null"
}
```

## Backend actual que satisface el contrato

Proyecto:

- `Gasfiter`

Ruta:

- `src/app/api/sites/[slug]/settings/route.ts`

Caracteristicas relevantes:

- acceso admin a Supabase con `SUPABASE_SERVICE_ROLE_KEY`
- soporte de `mode=draft|published`
- CORS permitido para dominios de `ABCIS`
- normalizacion de `sections`, `services` y `faqs`
- fallback legacy derivado desde `sections`

## Otras piezas acopladas a `ABCIS` dentro del repo `Gasfiter`

- `middleware.ts`
  - redirige `cms.abcis.cl/` a `/staging?slug=abcis`
- `src/components/staging-workflow-panel.tsx`
  - contiene ramas especificas para `abcis`
- `src/app/api/forms/contact/route.ts`
  - fallback de `siteSlug` a `abcis`
- `src/app/api/forms/ethics/route.ts`
  - fallback de `siteSlug` a `abcis`

## Riesgo de migracion

Si se crea `cms-abcis`, hay que preservar:

1. la misma ruta
2. el mismo shape JSON
3. el mismo slug productivo (`abcis`)
4. la misma logica de CORS necesaria
5. la misma semantica de `mode=draft|published`

## Decision de Fase 1

El nuevo backend de `ABCIS` no debe reescribir este contrato desde cero. Debe clonarlo con compatibilidad estricta.
