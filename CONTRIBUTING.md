# Contributing / Dev Workflow (Ziggy)

## Branching + PR flow
- Create a branch from `main`:
  - `feat/<short-description>`
  - `fix/<short-description>`
  - `chore/<short-description>`
- Open a PR early (draft is fine).
- Every PR should be reviewable + small. If it’s big, split it.
- Merge to `main` only when required checks are green.

## Required checks (local + CI)
Run these before you open/merge a PR:

```sh
npm run lint
npm test -- --run
npm run build
npm run typecheck
```

CI runs the same checks on PRs and on pushes to `main`.

## Deployment model
- PRs: **Vercel Preview** deployments
- `main`: **Vercel Production** deployment

## Supabase rules (important)
This repo contains Supabase migrations and edge functions under `supabase/`.

- Do not test destructive changes against production.
- PR previews should use **staging Supabase** credentials.
- If you add a migration, include a brief rollback note in the PR description.

## Vibecoder prompts (useful before you commit)
- What is the acceptance criteria for this change?
- What could break (auth/payments/data/perf)?
- What’s the smallest PR that gets us there?
- Did I run `lint`, `test`, `build`, `typecheck`?


