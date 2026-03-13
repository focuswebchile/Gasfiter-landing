# Plan tecnico de limpieza de `Gasfiter` posterior al desacople de `ABCIS`

## Objetivo
Eliminar el acoplamiento residual con `ABCIS` sin introducir regresiones sobre deploys existentes.

## Principio de ejecucion
Limpiar por capas, de menor a mayor riesgo. No tocar rutas o middleware hasta confirmar uso real del proyecto `gasfiter-landing` como landing de Gasfiter.

---

## Capa 1 — Bajo riesgo
### Alcance
- README
- docs internas
- textos de referencia legacy
- nombres o notas que ya no representan el proposito real del repo

### Acciones
- ajustar README para declarar estado transicional del repo
- marcar que `ABCIS` ya no depende de este proyecto
- quitar instrucciones ambiguas que lleven a usar slug `abcis` por defecto

### Riesgo
Bajo. No toca runtime.

---

## Capa 2 — Riesgo medio
### Alcance
- placeholders y textos UI especificos de `ABCIS`
- ramas visuales en `staging-workflow-panel.tsx`
- defaults de slug o tipografia ligados a `abcis`

### Acciones
- inventariar condicionales `normalizedSiteSlug === "abcis"`
- decidir si se reemplazan por comportamiento neutral o se eliminan
- validar visualmente el staging de Gasfiter despues de cada cambio

### Riesgo
Medio. Puede alterar UI o experiencia de edicion.

---

## Capa 3 — Riesgo alto
### Alcance
- `middleware.ts`
- `src/app/api/forms/contact/route.ts`
- `src/app/api/forms/ethics/route.ts`
- `src/app/api/sites/[slug]/settings/route.ts`
- `src/lib/publish-requirements.ts`

### Acciones
- quitar redirects a `cms.abcis.cl`
- quitar fallbacks de slug `abcis`
- revisar allowlist de origins de `abcis.cl`
- revisar excepciones de publicacion exclusivas del cliente

### Riesgo
Alto. Toca routing, API y comportamiento de publicacion.

---

## Orden recomendado
1. Documentacion y branding legacy
2. Condicionales UI de `abcis`
3. Middleware, forms, settings API y publish rules

## Precondicion para avanzar a capa 3
Confirmar si `gasfiter-landing` seguira vivo como landing publica de Gasfiter o si sera redefinido/archivado.

## Criterio de cierre
El repo `Gasfiter` deja de contener:
- dominio `cms.abcis.cl`
- slug por defecto `abcis`
- fallbacks de cliente
- comportamiento productivo especifico de `ABCIS`

## Nota operativa adicional
A la fecha de cierre de este bloque, el slug funcional vigente de Gasfiter en el proyecto Supabase staging es:
- `gasfiter-staging`

Esto implica:
- el frontend/deploy `gasfiter-landing` debe apuntar a `gasfiter-staging`
- no existe aun un slug productivo independiente llamado `gasfiter` en ese Supabase

## Trabajo futuro sugerido
Si mas adelante se quiere normalizar naming, se puede abrir una fase separada para:
1. crear o migrar el slug `gasfiter`
2. copiar settings/versiones necesarias
3. mover el deploy desde `gasfiter-staging` a `gasfiter`
4. retirar el slug transicional `gasfiter-staging`

Ese trabajo no forma parte del desacople actual con `ABCIS`.
