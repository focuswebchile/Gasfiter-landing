# Fase 1 - T1 - Arquitectura actual

> Nota: este documento es un snapshot previo al desacople de `ABCIS`. El estado vigente posterior al switch se documenta en Fase 3.


## Objetivo

Documentar el estado real de la arquitectura antes de desacoplar `ABCIS` de `gasfiter-landing`.

## Repos auditados

- `/Users/felipeibar/Desktop/FocusWeb/focusweb-chile`
- `/Users/felipeibar/Desktop/FocusWeb/focusweb-backend`
- `/Users/felipeibar/Desktop/FocusWeb/ABCIS`
- `/Users/felipeibar/Desktop/Gasfiter`

## Mapa actual

### Focus Web

- Frontend: `focusweb-chile`
- Backend: `focusweb-backend`
- Backend URL: `https://focusweb-backend-production.up.railway.app`
- Supabase project: `focuswebchile's Project`
- Site slug: `site-001`

### ABCIS

- Frontend: `ABCIS`
- Backend URL inicial: `https://gasfiter-landing-lilac.vercel.app`
- Site slug: `abcis`
- No depende de `focusweb-backend`
- No aparece dentro del proyecto Supabase de Focus Web

### Gasfiter

- Repo actual: `Gasfiter`
- Proyecto Vercel: `gasfiter-landing`
- Estado real: no es solo una landing; hoy contiene frontend, rutas API, CMS/staging y acceso admin a Supabase
- Slugs detectados en codigo o seeds:
  - `gasfiter`
  - `gasfiter-staging`
  - `abcis`

## Supabase de Focus Web (`focuswebchile's Project`)

### Sites existentes

- `site-001` -> `Focus Web - Demo`
- `gasfiter-demo` -> `Gasfiter Demo`
- `gasfiter` -> `Gasfiter Landing`

### Estado de sites

- `site-001`
  - tiene settings
  - tiene membership
  - esta activo
- `gasfiter-demo`
  - tiene settings
  - tiene membership
  - es legado activo dentro del proyecto de Focus Web
- `gasfiter`
  - no tiene settings
  - no tiene membership
  - es residuo probable

## Hallazgos clave

1. `Focus Web` y `ABCIS` no comparten backend.
2. `ABCIS` depende del deploy `gasfiter-landing-lilac.vercel.app`.
3. `Gasfiter` evoluciono a una app hibrida con responsabilidad de CMS para `ABCIS`.
4. El proyecto Supabase de Focus Web conserva residuos legacy de Gasfiter.
5. El principal problema actual no es una caida ni un bug, sino el desorden de naming y ownership.

## Riesgo principal

El riesgo operativo hoy es tocar `gasfiter-landing` pensando que es solo Gasfiter, cuando en la practica sostiene flujos de `ABCIS`.

## Decision de Fase 1

- No tocar produccion de `ABCIS`
- No limpiar `Gasfiter` todavia
- No borrar slugs legacy todavia
- Primero documentar, luego desacoplar
