# Vercel setup (Preview + Production)

## 1) Connect the GitHub repo
- In Vercel: **Add New → Project**
- Import this GitHub repo

## 2) Build settings
- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Output directory**: `dist`

## 3) Node version
This repo pins Node 20 via:
- `.nvmrc`
- `package.json` `engines.node`

In Vercel, also set **Node.js Version = 20** (Project Settings → General).

## 4) SPA routing (React Router)
This repo includes `vercel.json` with a rewrite to `index.html` so deep links work.

## 5) Environment variables
See [`docs/ENV_VARS.md`](docs/ENV_VARS.md).

Recommended mapping:
- **Preview**: staging Supabase (`VITE_APP_ENV=staging`)
- **Production**: prod Supabase (`VITE_APP_ENV=prod`)

## 6) What you’ll see
- Every PR → **Preview Deployment URL** (shareable)
- Every merge to `main` → **Production Deployment**


