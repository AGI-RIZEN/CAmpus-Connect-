# Campus Connect — API Server

Express + TypeScript API for the Campus Connect app. Prisma/PostgreSQL for data, Redis for
tokens/OTP/caching + the Socket.io adapter, Cloudinary for images and files, Brevo (SMTP relay)
for transactional email.

This is the **Phase 0 scaffold** — see "What's not implemented yet" below before assuming any
endpoint actually does something.

## Prerequisites

- Node.js 20+
- (Optional, recommended) Docker Desktop — for one-command local Postgres + Redis

## Setup

```bash
cd server
npm install
cp .env.example .env
```

**Option A — Docker (recommended):**

```bash
docker compose up -d
```

Leaves `DATABASE_URL` / `REDIS_URL` in `.env` as their defaults — no further editing needed for
those two. Fill in `CLOUDINARY_*` (free tier at cloudinary.com) and `BREVO_*` / `MAIL_FROM`
(free tier at brevo.com) in `.env`.

**Option B — your own Postgres/Redis:**

Point `DATABASE_URL` and `REDIS_URL` in `.env` at your own instances instead.

## Database

```bash
npx prisma generate       # generate the typed client from prisma/schema.prisma
npx prisma migrate dev --name init   # creates the schema in your database
```

## Run

```bash
npm run dev
```

Expected output:

```
[redis] connected
Campus Connect API listening on http://localhost:4000 [development]
```

## Verify

```bash
curl http://localhost:4000/health
# {"status":"ok","env":"development"}

curl http://localhost:4000/api/auth/login
# 501 {"message":"auth module not implemented yet (Phase 1)"}
```

Every `/api/*` route 501s right now — that's expected, see below.

## Scripts

| Script                    | What it does                              |
| -------------------------- | ------------------------------------------ |
| `npm run dev`              | Start the dev server with hot reload (tsx) |
| `npm run build`            | Compile TypeScript to `dist/`              |
| `npm run start`            | Run the compiled `dist/server.js`          |
| `npm run typecheck`        | `tsc --noEmit`                             |
| `npm run prisma:generate`  | Regenerate the Prisma client               |
| `npm run prisma:migrate`   | Create/apply a migration                   |
| `npm run prisma:studio`    | Open Prisma Studio (visual DB browser)     |

## Project structure

```
src/
  config/        env, Prisma client, Redis client, Cloudinary, Brevo mailer
  middleware/    auth (JWT verify), roleGuard, error handler
  modules/       auth, users, notices, notifications, posts, chat,
                 quizzes, uploads, admin, teacher — one router per domain
  sockets/       Socket.io connection handling
  emails/        transactional email templates (Phase 1)
  types/         Express Request augmentation
prisma/
  schema.prisma  full data model
```

## What's NOT implemented yet (Phase 0 scope)

- No real signup / OTP / login / approve / reject / ban logic — every `/api/*` route returns
  `501 Not Implemented`.
- No emails actually send — `sendMail()` throws if called (nothing calls it yet).
- No Cloudinary uploads happen yet — the client is configured but there's no upload route.
- `requireAuth` / `requireRole` middleware exist and work, but no route uses them yet, and
  nothing issues real JWTs yet.
- Placeholder `CLOUDINARY_*` / `BREVO_*` values in `.env` are fine for the server to boot —
  they're only validated for *presence*, not checked against the real services until Phase 1
  code actually calls them.

## Roadmap

Phase 1 (next): real auth — signup, OTP verification, login, forgot/reset password, and the
admin approve / reject-with-reason / ban flows (including the Brevo emails). See the published
backend architecture doc for the full phased roadmap (0 → 7, ending with swapping the mobile
app's `lib/mock-data.ts` reads for real API calls, screen by screen).
