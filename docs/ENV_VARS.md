# Environment variables

## Frontend (Vite)

Create a local file named `.env.local` (do not commit it) and set:

```ini
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_APP_ENV=local
```

## Vercel

Set these in the Vercel dashboard:

- **Preview** environment: use **staging** Supabase values
- **Production** environment: use **production** Supabase values

Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_ENV` (optional; suggested values: `staging` / `prod`)

## GitHub Actions (Supabase deploy workflows)

If you enable the included Supabase deploy workflows, add these GitHub repo secrets:

- `SUPABASE_ACCESS_TOKEN`: a Supabase personal access token
- `SUPABASE_STAGING_PROJECT_REF`: staging project ref (e.g. `abcd1234...`)
- `SUPABASE_STAGING_DB_PASSWORD`: staging database password
- `SUPABASE_PROD_PROJECT_REF`: production project ref
- `SUPABASE_PROD_DB_PASSWORD`: production database password

If these secrets aren’t set, the deploy jobs will be skipped (so CI still works).


