# Portfolio Backend API

Cloudflare Workers backend for `sumit.codes`, built with Hono, D1 and Drizzle.

## Overview

This service exposes REST APIs for:

- Profile info (`/api/me`)
- Work experience (`/api/experiences`)
- Projects/works (`/api/works`)
- Skills (`/api/skills`)
- Certifications (`/api/certifications`)
- Education (`/api/educations`)
- Stats (`/api/stats`)
- Contact email (`/api/contact`)
- App store lookup (`/api/apps/app-store/:id`, `/api/apps/play-store/:id`)
- Utility helpers (`/api/utils/format-date/:date`)

## Tech Stack

- Runtime: Cloudflare Workers
- Framework: Hono
- Language: TypeScript
- Database: Cloudflare D1 (SQLite) via Drizzle, seeded by migration
- Mail: Cloudflare Email Service (`send_email` binding)
- Validation: Zod
- Deployment: Wrangler

## Requirements

- Node.js 20+
- npm (or bun)
- Cloudflare account
- Email Routing enabled on the zone, with the inbox as a verified destination address (for contact endpoint)

## Environment Variables

Create `.env.local` (or `.env`) in `portfolio-backend/`:

```env
FRONTEND_URL=
```

Notes:

- There are no database secrets. Content lives in D1 (`PORTFOLIO_DB` binding in `wrangler.jsonc`), seeded from `migrations/9999_seed_portfolio.sql`. Run `bun run db:local` once before `bun run dev`.
- `POST /api/contact` needs no secrets: the `EMAIL` binding, `CONTACT_FROM` and `CONTACT_TO` are configured in `wrangler.jsonc`. The binding is locked to one verified destination address, which keeps sending free on the Workers Free plan.
- Allowed CORS origins are defined in code (`src/constants/index.ts`) and include:
  - Production: `https://sumit.codes`
  - Local dev: `http://localhost:3000`, `http://localhost:3001`, `127.0.0.1` variants

## Scripts

```bash
npm install
npm run dev         # wrangler dev (local API at http://localhost:8787)
npm run cf-typegen  # generate Cloudflare bindings types
npm run deploy      # deploy worker (minified)
```

## API Base URL

- Local: `http://localhost:8787`
- Production: your deployed Cloudflare Worker URL

All primary routes are mounted under `/api/*`.

## Route Map

### Health

- `GET /api/health`
- Legacy: `GET /health`

### Experiences

- `GET /api/experiences`
- `GET /api/experiences/:id`

### Works

- `GET /api/works`
- `GET /api/works?ids=id1,id2,id3`
- `GET /api/works/:id`
- Legacy: `GET /works` (mounted)

### Skills

- `GET /api/skills`
- `GET /api/skills/category/:category`
- `GET /api/skills/:id`

### Certifications

- `GET /api/certifications`
- `GET /api/certifications/:id`

### Educations

- `GET /api/educations`
- `GET /api/educations/:id`

### Stats

- `GET /api/stats`

### Profile

- `GET /api/me`

### Apps

- `GET /api/apps/app-store/:id`
- `GET /api/apps/play-store/:id?lang=en&country=us`

### Contact

- `POST /api/contact`

Body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "message": "Hello there, I would like to connect."
}
```

Validation:

- `name`: min 2 chars
- `email`: valid email
- `message`: min 10 chars

### Utils

- `GET /api/utils/format-date/:date`
  - Example: `/api/utils/format-date/2024-01-15`
  - Example: `/api/utils/format-date/null` -> Present

## Response Shape

Most success responses use:

```json
{
  "success": true,
  "data": {},
  "count": 0
}
```

Error responses use:

```json
{
  "success": false,
  "error": "Error title",
  "message": "Human readable details"
}
```

Global unhandled errors are caught by `app.onError` and returned as HTTP 500.

## Rate Limits

Configured in `src/constants/index.ts` and applied per route via middleware.

- Contact: 1 req/min/IP
- App store: 100 req/min/IP
- Experiences: 1000 req/min/IP
- Works: 1000 req/min/IP
- Educations: 1000 req/min/IP
- Certifications: 1000 req/min/IP
- Skills: 1000 req/min/IP
- Stats: 500 req/min/IP
- Default: 100 req/min/IP

Rate-limit headers are returned on both success and throttled responses.

## Architecture Notes

- Hono app composition in `src/app.ts`
- Route handlers in `src/routes/*`
- Business logic in `src/services/*`
- Drizzle schema + client in `src/db/*`; migrations in `migrations/`
- CORS + rate limit middleware in `src/middleware/*`

Data:

- Content is read-only and shipped as a seed migration. Edit `scripts/portfolio-data.json`, run `bun run build:seed`, commit the regenerated `migrations/9999_seed_portfolio.sql`. See `.claude/rules/migrations.md`.
- Health route runs `SELECT 1` against D1 and always returns HTTP 200 with status detail (`ok` or `degraded`).

## Deployment

1. Configure Cloudflare secrets/vars for required env values.
2. Run:

```bash
npm run deploy
```

3. Smoke test:

```bash
curl https://<worker-url>/api/health
```

## Troubleshooting

- Data endpoints 500 with `no such table`
  - Migrations not applied: `bun run db:local` (or `db:remote` for production).
- Contact endpoint returns 500 / `E_RECIPIENT_NOT_ALLOWED`
  - `CONTACT_TO` must match the binding's `destination_address` in `wrangler.jsonc`, and that address must be a verified destination in the Cloudflare account.
- CORS blocked in browser
  - Ensure request origin is in allowed origins list/constants.
- Health reports `degraded`
  - API is up, but the D1 query failed. Check the binding in `wrangler.jsonc` and that migrations ran.

## License

Private project. All rights reserved.
