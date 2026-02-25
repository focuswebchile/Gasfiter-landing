# Gasfiter Landing (Next.js dinámico)

Landing page de gasfitería en Next.js (App Router) con hidratación de contenido desde backend.

## Requisitos

- Node.js 18+

## Configuración

1) Instala dependencias y levanta el entorno:

```bash
npm install
npm run dev
```

Visita `http://localhost:3000`.

## Variables de entorno

Configura `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=https://tu-backend.com
NEXT_PUBLIC_SITE_SLUG=gasfiter
```

## Cómo funciona

- El layout se renderiza en `/` con componentes Next.js.
- El frontend hidrata en runtime desde:
  - `${NEXT_PUBLIC_BACKEND_URL}/api/sites/${NEXT_PUBLIC_SITE_SLUG}/settings`
- Se usa `cache: "no-store"` para evitar cachear settings.

## Deploy

Despliega en Vercel importando este repositorio.
