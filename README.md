# Plately

A restaurant ordering backend. npm workspaces monorepo with a single Express + PostgreSQL service under `apps/app`.

## Stack

- Express 4 + TypeScript
- PostgreSQL via `pg`, plain SQL migrations (no ORM)
- JWT access/refresh auth (`jsonwebtoken`, `bcryptjs`)
- Request validation with `zod`

## Project layout

```
apps/app/
  server.ts              entry point
  src/app.ts              express app, route mounting, error handler
  src/config/              env loading, db pool
  src/routes/               route definitions
  src/controllers/          request parsing/validation, calls services or models
  src/services/              business logic that spans multiple model calls
  src/models/                SQL queries + row <-> domain object mapping
  src/middleware/            auth guards
  src/utils/                 shared helpers (HttpError, hashing, tokens)
  migrations/                 numbered SQL migration files
  scripts/migrate.ts          runs pending migrations
```

Request flow: `routes -> controller -> (service ->) model -> PostgreSQL`, back out as JSON.

## Setup

```
npm install
```

Create `apps/app/.env` with:

```
DATABASE_URL=postgres://user:pass@localhost:5432/zomato
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
PORT=4000                # optional, defaults to 4000
CORS_ORIGIN=*            # optional
JWT_ACCESS_EXPIRES=15m   # optional
JWT_REFRESH_EXPIRES=7d   # optional
```

Run migrations, then start the dev server:

```
npm run migrate
npm run dev
```

## Scripts (from repo root, proxied to `apps/app`)

- `npm run dev` — start with hot reload (`tsx watch`)
- `npm run build` — compile TypeScript to `dist/`
- `npm run start` — run the compiled server
- `npm run migrate` — apply SQL migrations in `apps/app/migrations`

## API

All routes are mounted under `/api`.

### Auth — `/api/auth`
Register, login, refresh, logout. Issues JWT access/refresh tokens.

### Users — `/api/users`
Authenticated user profile endpoints.

### Restaurants — `/api/restaurants`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/restaurants` | none | List restaurants with `status = 'active'` — public browsing before login |
| POST | `/api/restaurants` | seller | Create a restaurant |
| PATCH | `/api/restaurants/:id` | seller (owner only) | Partial update; only the fields present in the body are changed |

`PATCH` verifies the restaurant belongs to the authenticated seller before updating, and both "doesn't exist" and "belongs to someone else" return 404 so ownership can't be probed.

### Categories — `/api/restaurants/:restaurantId/categories`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/restaurants/:restaurantId/categories` | none | List a restaurant's categories, ordered by `display_order, name` — public, restricted to active restaurants |
| POST | `/api/restaurants/:restaurantId/categories` | seller (owner only) | Create a category under the restaurant |
| PATCH | `/api/restaurants/:restaurantId/categories/:categoryId` | seller (owner only) | Partial update; only the fields present in the body are changed |

`POST`/`PATCH` verify the restaurant belongs to the authenticated seller; `PATCH` additionally verifies the category belongs to that restaurant before updating. As with restaurants, all of "doesn't exist", "belongs to someone else's restaurant", and "belongs to a different restaurant" collapse to 404 so ownership can't be probed.

### Health

`GET /health` — liveness check, returns `{ status: 'ok' }`.

## Data model notes

- `restaurants.min_order_amount` and `delivery_fee` are `NUMERIC` columns; `pg` returns these as strings, so `Restaurant.ts` converts them to `Number` when mapping rows to avoid float-rounding surprises at the driver level.
- Errors thrown as `HttpError(status, message)` are caught by the error-handling middleware in `app.ts` and returned as `{ message }` with the given status; anything else becomes a generic 500.
