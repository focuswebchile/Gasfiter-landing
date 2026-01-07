# Gasfiter Landing (Next.js + Builder)

Landing page de gasfitería con fallback estático y soporte de edición vía Builder.io.

## Requisitos

- Node.js 18+
- Cuenta de Builder.io

## Configuración

1) Crea un archivo `.env.local` con tu API key:

```bash
NEXT_PUBLIC_BUILDER_API_KEY=TU_API_KEY
```

2) Instala dependencias y levanta el entorno:

```bash
npm install
npm run dev
```

Visita `http://localhost:3000`.

## Cómo funciona

- Si existe contenido publicado en Builder para el modelo **page**, se renderiza en el sitio.
- Si no hay contenido o no hay API key, se muestra la landing de fallback.

## Deploy

Despliega en Vercel importando este repositorio. Agrega la variable `NEXT_PUBLIC_BUILDER_API_KEY` en el dashboard de Vercel.
