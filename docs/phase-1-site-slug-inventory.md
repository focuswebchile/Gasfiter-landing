# Fase 1 - T4 - Inventario de slugs y clasificacion

## Objetivo

Determinar que slugs estan activos, cuales son demo y cuales parecen residuos.

## Slugs detectados

### En Focus Web

- `site-001`
- `gasfiter-demo`
- `gasfiter`

### En Gasfiter

- `gasfiter`
- `gasfiter-staging`
- `abcis`

### En ABCIS

- `abcis`

## Clasificacion actual

### `site-001`

- Proyecto: Focus Web
- Estado: activo
- Tiene settings: si
- Tiene membership: si
- Accion: conservar

### `gasfiter-demo`

- Proyecto: Supabase de Focus Web
- Estado: legado activo
- Tiene settings: si
- Tiene membership: si
- Accion: no tocar hasta confirmar que ningun deploy vivo lo usa

### `gasfiter`

- Proyecto: Supabase de Focus Web
- Estado: residuo probable
- Tiene settings: no
- Tiene membership: no
- Accion: candidato a borrar o archivar despues del desacople

### `gasfiter-staging`

- Proyecto: Gasfiter / template staging
- Estado: staging/template
- Evidencia: seeds y scripts de validacion
- Accion: revisar en fase de limpieza, no tocar ahora

### `abcis`

- Proyecto: ABCIS
- Estado: activo en produccion
- Backend actual: `gasfiter-landing-lilac.vercel.app`
- Accion: aislar en `cms-abcis`

## Interpretacion operativa

1. `gasfiter-demo` y `gasfiter` no son equivalentes.
2. El slug productivo real de `ABCIS` es `abcis`.
3. El slug `gasfiter` dentro del Supabase de Focus Web no sostiene nada util hoy.
4. El slug `gasfiter-staging` pertenece a la linea de staging/template, no al sitio productivo de Focus Web.

## Reglas para la siguiente fase

- No borrar `gasfiter-demo` todavia.
- No borrar `gasfiter` hasta terminar T5-T10.
- No cambiar `abcis` de slug.
- No reutilizar slugs legacy para nuevos proyectos.
