# Gasfiter - Fase 2 - Contrato operativo para backend

## Objetivo

Dejar por escrito el contrato real que hoy usa la landing de Gasfiter para que la fase backend se implemente sin mezclar:

- estructura fija de plantilla
- contenido editable por CMS
- branding operativo del sitio
- legacy visual o validaciones heredadas

## Estado actual

La landing real de Gasfiter hidrata desde:

- `site_versions.snapshot`
- `settings.branding`
- `settings.content.sections`

La estructura visual principal sigue definida en:

- `src/components/dynamic-landing.tsx`

El panel editorial hoy vive en:

- `src/components/staging-workflow-panel.tsx`

Las rutas backend activas para contenido/versionado viven en:

- `src/app/api/sites/[slug]/settings/route.ts`
- `src/app/api/sites/[slug]/save-draft/route.ts`
- `src/app/api/sites/[slug]/publish/route.ts`
- `src/app/api/sites/[slug]/rollback/route.ts`
- `src/app/api/sites/[slug]/versions/route.ts`
- `src/app/api/sites/[slug]/asset-upload/route.ts`
- `src/app/api/sites/[slug]/branding-upload/route.ts`

## Contrato recomendado

### 1. `branding`

Debe contener solo datos operativos/globales del sitio:

- `logoNavUrl`
- `logoFooterUrl`
- `faviconUrl`
- `contact.whatsapp`
- `contact.email`
- `contact.address`

Uso actual confirmado:

- navbar / footer / favicon
- reemplazo masivo de links `wa.me`
- contacto básico del footer

No debe usarse `branding` para contenido editorial de secciones.

### 2. `content.sections`

Debe contener solo contenido editable por bloque.

#### `hero`

Campos activos hoy:

- `title`
- `subtitle`
- `eyebrow`
- `image`
- `cta_primary.text`
- `cta_primary.url`
- `cta_secondary.text`
- `cta_secondary.url`

Decisión:

- `title`, `subtitle`, `eyebrow`, `image` y URLs deben seguir viniendo desde CMS
- los textos visibles de los CTAs hoy están fijados en frontend para evitar saltos en carga
- si se quiere reactivar edición total del copy de CTA, primero hay que resolver hidratación sin layout shift

#### `audience`

Campos activos hoy:

- `kicker`
- `title`
- `description`
- `bullets[]`
- `cta_primary`
- `cta_secondary`
- `images.back`
- `images.front`

Decisión:

- sección 100% CMS-driven a nivel contenido
- estructura visual queda fija en frontend

#### `services`

Campos activos hoy:

- `title`
- `subtitle`
- `items[]`
  - `title`
  - `description`
  - `features[]`
  - `cta`

Decisión:

- contenido editable desde CMS
- layout/tipografía de cards sigue fija en frontend
- el título visual hoy se normaliza en frontend a 2 líneas

#### `projects`

Campos activos hoy:

- `title`
- `description`
- `items[]`
  - `title`
  - `location`
  - `image`
  - `alt`
  - `size`

Decisión:

- `projects.items` manda sobre el JSX base
- las imágenes finales deben vivir en snapshot o storage definitivo
- no conviene depender del fallback local del carrusel una vez cerrada fase backend

#### `urgency_banner`

Estado actual:

- el frontend ya no usa su copy antiguo
- visualmente fue reemplazado por la banda `Cobertura y confianza`
- hoy solo se usa para visibilidad/habilitación de la sección

Decisión:

- renombrar funcionalmente este bloque en la siguiente iteración
- opciones:
  - mantener `urgency_banner` como id legacy pero cambiar su semántica editorial en panel
  - o crear un nuevo `coverage_band` y migrar luego

Recomendación:

- no cambiar el id todavía en fase 2 inicial
- usarlo como bloque editorial de `Cobertura y confianza` y limpiar naming después

#### `contact_banner`

Campos activos hoy:

- `kicker`
- `title`
- `submit_text`
- `background_image`

Decisión:

- el contenido visual sí es CMS-driven
- la lógica real del formulario todavía no está conectada al backend del sitio

#### `testimonials`

Campos activos hoy:

- `title`
- `kicker`
- `items[]`
  - `quote`
  - `name`
  - `location`
  - `avatar`

Decisión:

- contenido editable por CMS
- estructura y comportamiento del carrusel quedan fijos en frontend

#### `faq`

Campos activos hoy:

- `title`
- `items[]`
  - `question`
  - `answer`

Decisión:

- 100% CMS-driven en contenido

### 3. Estructura fija del frontend

Estas piezas hoy deben seguir en frontend como estructura de plantilla:

- layout general de hero
- composición editorial de `Quiénes somos`
- layout de `Certificación y seguridad`
- timeline de `Proceso de trabajo`
- carrusel doble de `Proyectos`
- carrusel de `Testimonios`
- modal de mapa
- footer layout

El CMS edita contenido, no la estructura.

## Hallazgos importantes para backend

### A. El formulario de contacto no está integrado

La landing renderiza un formulario HTML estático en:

- `src/components/dynamic-landing.tsx`

Pero el endpoint real disponible espera JSON con otro contrato:

- `src/app/api/forms/contact/route.ts`

Problema actual:

- frontend usa `nombre`, `telefono`, `comuna`, `email`, `problema`
- API espera `firstName`, `lastName`, `phone`, `email`, `message`, `siteSlug`

Decisión:

- fase backend debe empezar conectando este formulario de punta a punta

### B. Hay validaciones legacy en `publish-requirements`

Actualmente existe esta validación heredada:

- targets válidos de servicios:
  - `consultoria`
  - `auditorias`
  - `certificacion`
  - `capacitacion`

Eso no representa Gasfiter.

Decisión:

- limpiar `publish-requirements.ts` antes o junto con la fase de integración editorial

### C. Branding ya está preparado para Supabase

El panel staging ya permite editar:

- logo navbar
- logo footer
- favicon
- WhatsApp
- email
- dirección

Entonces el problema de logo no es de arquitectura, sino de completar la configuración real del sitio.

## Orden recomendado de implementación

### Paso 1

Conectar formulario de contacto:

- definir payload final
- adaptar frontend
- enviar a `/api/forms/contact`
- estados de éxito/error
- usar `siteSlug`

### Paso 2

Limpiar validaciones y modelo editorial:

- revisar `publish-requirements.ts`
- revisar naming de `urgency_banner`
- revisar campos realmente obligatorios para publicar Gasfiter

### Paso 3

Cerrar branding operativo desde CMS:

- logo nav
- logo footer
- favicon
- WhatsApp
- email
- dirección

### Paso 4

Probar flujo editorial completo:

- save draft
- publish
- rollback
- asset upload

## Riesgo principal si no se ordena así

Si se conecta backend sin cerrar primero contrato + formulario + validaciones:

- se mezclan bugs de layout con bugs de contenido
- el CMS puede seguir pisando frontend de forma inesperada
- publicar puede fallar por reglas que no corresponden a Gasfiter

## Conclusión

Gasfiter ya no muestra residuos operativos importantes de `ABCIS` en código activo.

La siguiente fase no es una limpieza de herencia, sino una integración ordenada del backend real del sitio.

La prioridad correcta es:

1. formulario de contacto
2. limpieza del modelo/validaciones CMS
3. branding operativo
4. flujo editorial completo
