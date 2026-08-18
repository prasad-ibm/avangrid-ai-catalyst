# Deploy to GitHub + Railway

This repo is a **full-stack** app: one Node/Express server serves the static
frontend **and** the REST API. The "front end" you see on Railway is served by
this same service, so deploying it also deploys the backend. It **requires a
PostgreSQL database** to function.

## 1. Push to GitHub

This zip already contains an initialized git repo with one commit on `main`.
After unzipping:

```bash
cd avangrid-ai-catalyst
git remote add origin https://github.com/<you>/avangrid-ai-catalyst.git
git push -u origin main
```

(If you prefer a fresh history, delete the `.git` folder and run
`git init` yourself before the commands above.)

> The CI badge in `README.md` points at `github.com/prasad-ibm/avangrid-ai-catalyst`.
> Update that URL to your own repo path once pushed.

## 2. Deploy on Railway

1. **New Project → Deploy from GitHub repo**, pick this repo.
   Railway auto-detects Node via `nixpacks.toml` / `railway.json`
   (build: `npm ci --omit=dev`, start: `npm start`, healthcheck: `/api/health`).
2. **Add a database:** in the project, **New → Database → PostgreSQL**.
   Railway injects `DATABASE_URL` automatically — the app reads it directly.
3. **Set variables** (project → Variables):
   - `SESSION_SECRET` — any long random string (required).
   - `DATABASE_URL` — provided by the Postgres plugin (auto-linked).
   - *(optional AI)* `AI_PROVIDER=azure`, `AZURE_OPENAI_ENDPOINT`,
     `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT` (default `gpt-4o-mini`),
     `AZURE_OPENAI_API_VERSION` (default `2024-06-01`).
     Leave `AI_PROVIDER=scripted` (or unset) to run without Azure.

## 3. Initialize the database (one time)

The app boots even without a DB (reports `db:false` on `/api/health`), but you
must create the schema and seed data before it's usable. From the Railway service
shell, or locally against the same `DATABASE_URL`:

```bash
npm run migrate            # apply schema.sql (idempotent)
node scripts/seed-avangrid.js   # seed the Avangrid workspace + 5 use cases
```

## 4. Verify

- Open the Railway URL → login page loads.
- `GET /api/health` returns `{ ok: true, db: true }` once Postgres is linked.
- Demo login seeded by the seed script: **AvangridUser1!** (see README).

## Local run

```bash
cp .env.example .env        # fill DATABASE_URL + SESSION_SECRET
npm install
npm run migrate
node scripts/seed-avangrid.js
npm start                   # http://localhost:3000
```
