# API reference

Base URL: `http://localhost:4000/api` (port from `PORT`, defaults to `4000`).

All request/response bodies are JSON. Send `Content-Type: application/json`.

## Auth flow

1. `POST /api/auth/register` or `POST /api/auth/login` — returns an `accessToken` in the JSON body and sets a `refreshToken` in an `httpOnly` cookie (scoped to `/api/auth`, so the browser only sends it back on refresh/logout).
2. Put the access token on every protected request:
   ```
   Authorization: Bearer <accessToken>
   ```
3. Access tokens expire (`JWT_ACCESS_EXPIRES`, default `15m`). When one expires, call `POST /api/auth/refresh` — the refresh cookie is read automatically — to get a new access/refresh pair. Refresh tokens rotate on every use (the old one is revoked).
4. `POST /api/auth/logout` revokes the current refresh token and clears the cookie.

New accounts are created with `role = 'customer'`. There's no self-service way to become a `seller` yet — for local testing, register normally, then update the row directly:

```sql
UPDATE users SET role = 'seller' WHERE email = 'you@example.com';
```

You'll need a fresh login (or refresh) after changing the role, since the role is baked into the access token payload at sign time.

---

## Auth — `/api/auth`

### `POST /api/auth/register`

No auth required.

Request body:

```json
{
  "email": "seller@example.com",
  "password": "correct-horse-battery-staple",
  "name": "Ada"
}
```

`name` is optional. `email`/`password` are required (400 if missing).

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@example.com","password":"correct-horse-battery-staple","name":"Ada"}'
```

Response `201`:

```json
{
  "user": {
    "id": "…",
    "email": "seller@example.com",
    "name": "Ada",
    "role": "customer",
    "emailVerified": false,
    "createdAt": "…",
    "updatedAt": "…"
  },
  "accessToken": "eyJhbGciOi…"
}
```

Errors: `400` missing email/password · `409` email already registered.

### `POST /api/auth/login`

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@example.com","password":"correct-horse-battery-staple"}'
```

Same response shape as register (`200` instead of `201`). Errors: `400` missing fields · `401` invalid email or password.

### `POST /api/auth/refresh`

Reads the refresh token from the `refreshToken` cookie (or `refreshToken` in the JSON body, for non-browser clients). No `Authorization` header needed.

```bash
curl -X POST http://localhost:4000/api/auth/refresh -b cookies.txt -c cookies.txt
```

Response `200`: same shape as login, with a new `accessToken` and a rotated refresh cookie. Errors: `401` missing/invalid/expired refresh token.

### `POST /api/auth/logout`

```bash
curl -X POST http://localhost:4000/api/auth/logout -b cookies.txt -c cookies.txt
```

Response: `204 No Content`. Always succeeds even if there's no refresh token to revoke.

---

## Users — `/api/users`

### `GET /api/users/me`

Auth: any authenticated user.

```bash
curl http://localhost:4000/api/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response `200`:

```json
{
  "user": {
    "id": "…",
    "email": "seller@example.com",
    "name": "Ada",
    "role": "seller",
    "emailVerified": false,
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

Errors: `401` missing/invalid token.

---

## Restaurants — `/api/restaurants`

### `GET /api/restaurants`

No auth. Lists restaurants with `status = 'active'`.

```bash
curl http://localhost:4000/api/restaurants
```

```json
{ "restaurants": [ { "id": "…", "name": "…", "status": "active", "...": "..." } ] }
```

### `GET /api/restaurants/:id`

No auth. `404` unless the restaurant exists **and** `status = 'active'` — a seller's own pending/suspended restaurant won't show up here.

```bash
curl http://localhost:4000/api/restaurants/<restaurantId>
```

```json
{ "restaurant": { "id": "…", "name": "…", "status": "active", "...": "..." } }
```

### `POST /api/restaurants`

Auth: `seller` role.

```json
{
  "name": "Ada's Kitchen",
  "addressLine": "12 Broad Street",
  "city": "Lagos",
  "latitude": 6.4531,
  "longitude": 3.3958,
  "phone": "+2348000000000",
  "description": "optional",
  "email": "optional@example.com",
  "deliveryRadiusKm": 5,
  "minOrderAmount": 0,
  "deliveryFee": 0,
  "estimatedDeliveryMinutes": 30
}
```

Only `name`, `addressLine`, `city`, `latitude`, `longitude`, `phone` are required — the rest have server-side defaults (shown above). The restaurant is created with `status = 'pending'` and owned by the calling seller (`sellerId` comes from the JWT, never the body).

```bash
curl -X POST http://localhost:4000/api/restaurants \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada'\''s Kitchen","addressLine":"12 Broad Street","city":"Lagos","latitude":6.4531,"longitude":3.3958,"phone":"+2348000000000"}'
```

Response `201`: `{ "restaurant": { ... } }`. Errors: `400` invalid body (with `zod` field errors) · `401`/`403` auth.

### `PATCH /api/restaurants/:id`

Auth: `seller`, and only the owner of `:id`. Body is any subset of the create fields — only the fields present are changed.

```bash
curl -X PATCH http://localhost:4000/api/restaurants/<restaurantId> \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deliveryFee": 500}'
```

Response `200`: `{ "restaurant": { ... } }`. Errors: `400` invalid body · `404` restaurant doesn't exist **or** belongs to a different seller (both cases return the same 404, so ownership can't be probed by id-guessing).

---

## Categories — `/api/restaurants/:restaurantId/categories`

### `GET /api/restaurants/:restaurantId/categories`

No auth. Restricted to active restaurants (same rule as `GET /api/restaurants/:id`) — `404` if the restaurant doesn't exist or isn't active.

```bash
curl http://localhost:4000/api/restaurants/<restaurantId>/categories
```

Response `200`:

```json
{
  "categories": [
    { "id": "…", "restaurantId": "…", "name": "Main Dishes", "displayOrder": 0, "createdAt": "…", "updatedAt": "…" },
    { "id": "…", "restaurantId": "…", "name": "Drinks", "displayOrder": 1, "createdAt": "…", "updatedAt": "…" }
  ]
}
```

Ordered by `displayOrder, name`.

### `POST /api/restaurants/:restaurantId/categories`

Auth: `seller`, and only the owner of `:restaurantId`.

```json
{ "name": "Main Dishes", "displayOrder": 0 }
```

`name` is required (1–120 chars, trimmed). `displayOrder` is optional, defaults to `0`.

```bash
curl -X POST http://localhost:4000/api/restaurants/<restaurantId>/categories \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Main Dishes","displayOrder":0}'
```

Response `201`: `{ "category": { ... } }`. Errors: `400` invalid body · `404` restaurant doesn't exist or isn't yours.

### `PATCH /api/restaurants/:restaurantId/categories/:categoryId`

Auth: `seller`, and only the owner of `:restaurantId`. Body is `name` and/or `displayOrder` — both optional, only what's present is changed.

```bash
curl -X PATCH http://localhost:4000/api/restaurants/<restaurantId>/categories/<categoryId> \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayOrder": 2}'
```

Response `200`: `{ "category": { ... } }`. Errors: `400` invalid body · `404` if the restaurant isn't yours, **or** if `:categoryId` doesn't belong to `:restaurantId` (e.g. it belongs to a different restaurant, even one you also own) — both collapse to the same 404.

### `DELETE /api/restaurants/:restaurantId/categories/:categoryId`

Auth: `seller`, and only the owner of `:restaurantId`. No request body.

```bash
curl -X DELETE http://localhost:4000/api/restaurants/<restaurantId>/categories/<categoryId> \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response: `204 No Content`. Errors: `404` same ownership/membership rule as `PATCH` above.

---

## Errors

Every error response is `{ "message": "..." }`, except `400` validation failures from `zod`-checked bodies, which also include `errors` (the output of `zodError.flatten()`):

```json
{
  "message": "Invalid request body",
  "errors": {
    "formErrors": [],
    "fieldErrors": { "name": ["String must contain at least 1 character(s)"] }
  }
}
```

Unhandled exceptions become a generic `500 { "message": "Internal server error" }`.
