# Lab Laptop Setup

Steps to get this project running on another machine (e.g. the lab laptop), plus
how to build an APK and make the backend reachable to testers.

## 1. Prereqs (install manually first)

- [Node.js LTS](https://nodejs.org) + Git
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — gives you Postgres
  and Redis locally with zero native install hassle (Redis doesn't officially support
  Windows outside Docker/WSL anyway, so this is the easiest path)

## 2. Get the code

Download the GitHub zip and extract it to somewhere **not** inside OneDrive/Dropbox —
e.g. `C:\dev\connect`. OneDrive continuously syncing `node_modules` (tens of thousands
of small files) chokes Metro's file watcher and any npm install, which is the likely
cause of the slowness on the original laptop.

## 3. Setup prompt for Claude Code

Open the extracted folder in Claude Code and paste this:

```
Set up this repo for local development on Windows:

1. Check Node.js and Git are installed (`node -v`, `git -v`). If not, tell me to install
   them first (Node 20+ from nodejs.org).
2. Run `npm install` in the root folder, then `npm install` in `server/`.
3. I'm installing Postgres and Redis locally via Docker. Check if `server/docker-compose.yml`
   exists, then run `docker-compose up -d` from `server/` and confirm both containers are
   healthy (postgres on 5432, redis on 6379).
4. Copy `server/.env.example` to `server/.env`. For DATABASE_URL and DIRECT_URL, use
   postgresql://postgres:postgres@localhost:5432/campus_connect?schema=public
   (matches the docker-compose credentials). For REDIS_URL use redis://localhost:6379.
5. Generate real random values for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
   (32+ chars each) and fill them in.
6. Leave CLOUDINARY_* and BREVO_SMTP_* blank for now — I'll fill those in myself.
7. Run `npx prisma migrate dev` in `server/` to create the database schema.
8. Copy the root `.env.example` (if present) or create `.env` with
   EXPO_PUBLIC_API_URL=http://localhost:4000/api
9. Start the backend with `npm run dev` in `server/`, confirm http://localhost:4000/health
   returns ok.
10. Start the app with `npx expo start` in the root folder.
11. Run `npx tsc --noEmit` and `npx expo lint` and tell me if anything fails.
```

## 4. Cloudinary (image hosting — cloud service, nothing to install)

1. Sign up free at cloudinary.com
2. Dashboard → copy **Cloud name**, **API Key**, **API Secret**
3. Paste into `server/.env` as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET`

   You can reuse your existing account's keys instead of making a new one — just
   copy the three values from your current `server/.env` on this laptop.

## 5. Build the Android APK

```
bunx eas-cli build --profile preview --platform android
```

Uses the `preview` profile already in `eas.json` → gives you a shareable install link
when the build finishes.

## 6. Make the backend reachable (Tailscale)

1. Install Tailscale on the laptop that runs the backend, sign in
2. Start it: `tailscale up`
3. Expose the backend publicly: `tailscale funnel 4000`
4. Tailscale gives you a stable HTTPS URL (like the one already in `eas.json`'s
   `preview` profile) — that's what `EXPO_PUBLIC_API_URL` should point to for the
   APK build
5. Keep that laptop on, backend running (`npm run dev` in `server/`), and Tailscale
   running the whole time testers are using the app — if any of those three stop,
   the app breaks for everyone using that build
