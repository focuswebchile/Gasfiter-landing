# Gasfiter Landing

Landing page de Gasfiter en Next.js (App Router) con hidratacion de contenido desde backend.

## Estado actual del repo

Este repo ya no es backend productivo de `ABCIS`. Ese rol fue migrado a `cms-abcis`.

Hoy este proyecto debe tratarse como:
- landing/app propia de Gasfiter
- repo en limpieza controlada de legado
- codigo que aun puede contener referencias historicas a `ABCIS`, pero que ya no sostienen al cliente en produccion

## Requisitos

- Node.js 18+

## Configuracion local

1. Instala dependencias y levanta el entorno:

```bash
npm install
npm run dev
```

2. Configura `.env.local` con un slug de Gasfiter, no de `ABCIS`:

```bash
NEXT_PUBLIC_BACKEND_URL=https://tu-backend.com
NEXT_PUBLIC_SITE_SLUG=gasfiter
```

Visita `http://localhost:3000`.

## Como funciona

- El layout se renderiza en `/` con componentes Next.js.
- El frontend hidrata en runtime desde:
  - `${NEXT_PUBLIC_BACKEND_URL}/api/sites/${NEXT_PUBLIC_SITE_SLUG}/settings`
- Se usa `cache: "no-store"` para evitar cachear settings.

## Regla operativa

- No volver a usar este repo como backend productivo de `ABCIS`.
- Todo trabajo funcional nuevo para el cliente debe hacerse en:
  - `cms-abcis`
  - `ABCIS`

## Deploy

Despliega en Vercel importando este repositorio solo para el proyecto Gasfiter.
