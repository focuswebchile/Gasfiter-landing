# Gasfiter Backend Editor UX

> Referencia vigente para refactor visual ABCIS: `docs/t8.0-guardrails-baseline.md` y `docs/t8.0-baseline-checklist.md`.

## Objetivo
Editar contenido de landing sin romper layout/CSS, con vista previa y publicación controlada.

## Layout recomendado
- Izquierda: sidebar de secciones.
- Centro: formulario dinámico de la sección seleccionada.
- Derecha: preview live (iframe o render del mismo JSON).

## Sidebar
- Lista fija por ID:
  - `hero`
  - `audience`
  - `services`
  - `projects`
  - `urgency_banner`
  - `contact_banner`
  - `testimonials`
  - `faq`
- Controles por sección:
  - Toggle `enabled`
  - Drag and drop para `order`
  - Indicador de errores de validación

## Panel central (formularios)
- Sección activa muestra campos según `id`.
- Campos comunes:
  - `title`, `subtitle`, `description`
  - CTA (`text`, `url`)
  - imágenes/iconos
- Para arrays (`items`, `badges`, `stats`):
  - Agregar item
  - Duplicar item
  - Eliminar item
  - Toggle item `enabled`
  - Reordenar item (drag and drop)

## Validación en tiempo real
- CTA URL válida: `tel:`, `http(s)://`, `#`.
- Reglas:
  - `services/projects/testimonials/faq` requieren `items.length >= 1` si `enabled=true`.
  - `urgency_banner` requiere `title` y CTA.
  - `contact_banner` requiere `title`.
- Mostrar errores en línea y badge de error en sidebar.

## Preview live
- Actualización instantánea con debounce (150-300ms).
- Toggle:
  - `Solo activas`
  - `Mostrar estructura`
  - `Modo mobile/desktop`

## Publicación
- Estado de documento:
  - `Draft`
  - `Published`
- Acciones:
  - Guardar borrador
  - Publicar
  - Historial de versiones
  - Rollback 1 click

## Compatibilidad frontend
- El frontend consume `content.sections[]`.
- Fallback legacy obligatorio:
  - `content.hero`
  - `content.services`
  - `content.faqs`
- No tocar estructura HTML ni clases CSS: solo contenido y visibilidad.
