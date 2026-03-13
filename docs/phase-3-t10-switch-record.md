# T10 — Registro del switch productivo de ABCIS

## Objetivo
Dejar trazabilidad clara de que `ABCIS` ya no depende productivamente de `gasfiter-landing`.

## Estado anterior
- Frontend `ABCIS` apuntaba a: `https://gasfiter-landing-lilac.vercel.app`
- Slug productivo: `abcis`
- El proyecto `Gasfiter` sostenia el flujo productivo del cliente

## Estado actual
- Frontend `ABCIS` apunta a: `https://cms-abcis.vercel.app`
- Slug productivo: `abcis`
- El backend/CMS productivo del cliente ahora es `cms-abcis`

## Validaciones realizadas
- `https://cms-abcis.vercel.app/api/sites/abcis/settings?mode=published` responde correctamente
- `https://cms-abcis.vercel.app/api/sites/abcis/settings?mode=draft` responde correctamente
- `https://cms-abcis.vercel.app/staging` carga correctamente
- Owner/editor cargan correctamente en CMS
- El frontend `abcis.cl` siguio estable tras el cambio
- Un cambio minimo realizado desde CMS fue reflejado correctamente en el frontend

## Conclusion
El switch productivo de `ABCIS` se considera completado y validado.

## Regla operativa desde ahora
No volver a tratar `gasfiter-landing` como backend productivo de `ABCIS`.

## Hito adicional validado
- El dominio `cms.abcis.cl` fue movido desde `gasfiter-landing` hacia `cms-abcis`
- `https://cms.abcis.cl/staging` carga correctamente
- `https://cms.abcis.cl/api/sites/abcis/settings?mode=published` responde correctamente
- `https://cms.abcis.cl/api/sites/abcis/settings?mode=draft` responde correctamente

## Estado actualizado
El desacople de `ABCIS` respecto de `gasfiter-landing` ya esta cerrado a nivel de:
- backend consumido por el frontend
- dominio CMS
- endpoints criticos de configuracion

## Validacion pendiente menor
Queda solo la revalidacion manual del login por magic link y un cambio minimo desde CMS, una vez que el rate limit del correo permita repetir el flujo.
