# Fase 4 — Backlog funcional para `cms-abcis` / `ABCIS`

## Objetivo
Extender el CMS del cliente `ABCIS` para que pueda editar contenido hoy no expuesto, sin mezclar este trabajo con la limpieza de desacople y legacy.

## Alcance inicial solicitado por cliente
1. Editar los 4 servicios principales
   - titulo
   - descripcion
2. Editar datos de contacto
   - numero(s) de contacto
   - cualquier texto relacionado visible en frontend si aplica

## Criterio de planificacion
Este trabajo no entra en Fase 3.

Se ejecutara despues de:
- cerrar limpieza de desacople entre `Gasfiter` y `ABCIS`
- estabilizar naming, ownership y slugs
- confirmar que `cms-abcis` y `ABCIS` ya son el ecosistema definitivo del cliente

## Principio tecnico
Implementar solo dentro del ecosistema:
- `cms-abcis`
- `ABCIS`

No tocar `Gasfiter` para esta mejora.

## Tickets propuestos

### T15 — Auditoria de contenido actual
- identificar donde viven hoy los 4 servicios
- identificar donde vive hoy el numero de contacto
- confirmar si estan hardcodeados o ya existen parcialmente en settings

### T16 — Diseno de schema CMS
- definir estructura en settings para:
  - servicios
  - contacto
- decidir si el cambio es aditivo o si requiere migracion de datos

### T17 — UI CMS para servicios
- exponer en `cms-abcis` los campos editables de los 4 servicios
- agregar validaciones basicas
- preservar orden y contenido actual como estado inicial

### T18 — UI CMS para contacto
- exponer campos editables para numero(s) de contacto
- validar formato de entrada

### T19 — Integracion frontend `ABCIS`
- hacer que `ABCIS` consuma esos nuevos campos desde settings
- mantener fallback seguro si falta algun dato

### T20 — Validacion funcional final
- validar desde CMS que cambios impactan el frontend
- revisar con cliente
- confirmar que no se rompe layout ni contenido actual

## Riesgo estimado
- Bajo a medio
- Bajo si los datos ya viven en settings o si el cambio es aditivo
- Medio si hay que migrar contenido hardcodeado en varios componentes

## Regla operativa
No arrancar Fase 4 hasta cerrar Fase 3.
