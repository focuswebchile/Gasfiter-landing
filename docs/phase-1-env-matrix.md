# Fase 1 - T2 - Matriz de variables productivas

## Objetivo

Documentar las variables productivas relevantes para entender que deploy alimenta a cada sitio.

## Regla

- Para URLs y slugs se guarda el valor exacto.
- Para secretos se registra solo `existe` o `no existe`.

## Focus Web - frontend (`focusweb-chile`)

- `NEXT_PUBLIC_BACKEND_URL=https://focusweb-backend-production.up.railway.app`
- `NEXT_PUBLIC_SITE_SLUG=site-001` (fallback en codigo)

## Focus Web - backend (`focusweb-backend` / Railway)

- `SUPABASE_URL=existe`
- `SUPABASE_SERVICE_ROLE_KEY=existe`
- `SUPABASE_JWT_SECRET=existe`
- `CORS_ORIGIN=existe`
- `MAGIC_LINK_REDIRECT=existe`

## Gasfiter - Vercel (`gasfiter-landing`)

- `NEXT_PUBLIC_BACKEND_URL=https://gasfiter-landing-lilac.vercel.app`
- `NEXT_PUBLIC_SITE_SLUG=abcis`
- `NEXT_PUBLIC_SUPABASE_URL=existe`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=existe`
- `SUPABASE_URL=existe`
- `SUPABASE_SERVICE_ROLE_KEY=existe`
- `NEXT_PUBLIC_CMS_AUTH_REDIRECT_BASE_URL=https://cms.abcis.cl`
- `NEXT_PUBLIC_CMS_DEFAULT_USER_ID=existe`
- `RECAPTCHA_SECRET_KEY=existe`
- `RESEND_API_KEY=existe`

## ABCIS - Vercel

- `VITE_BACKEND_URL=https://gasfiter-landing-lilac.vercel.app`
- `VITE_DEFAULT_SITE_SLUG=abcis`
- `VITE_RECAPTCHA_SITE_KEY=existe`

## Conclusiones

1. `ABCIS` apunta en produccion al backend del proyecto `gasfiter-landing`.
2. `gasfiter-landing` tiene credenciales de Supabase tanto publicas como server-side.
3. `Focus Web` esta separado y usa su propio backend.
4. El naming del proyecto `gasfiter-landing` ya no representa su responsabilidad real.
