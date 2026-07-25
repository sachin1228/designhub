# Drafthub

A full-stack platform for UI/UX, product, and social media designers. Designers apply to join, admins review applications, approved members complete their profile and get access to a real-time community chat.

## Project structure

```
apps/
  web/        Next.js 14 web app (main product)
  mobile/     React Native / Expo companion app
packages/
  shared/     Shared TypeScript types & constants
  design-system/  Design tokens (colors, typography)
supabase/
  migrations/ SQL migration files — apply in order via Supabase SQL editor
```

## Running the web app

```bash
npm install          # install all workspace deps from repo root
npm run dev          # starts Next.js on port 3000
```

The Dev workflow runs `npm run dev --workspace=apps/web`.

## Running the mobile app

```bash
cd apps/mobile
cp .env.example .env   # fill in API_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY
npm run start          # starts Expo dev server — scan QR with Expo Go
```

To build an APK: see `apps/mobile/README.md`.

## Environment variables

Web app variables live in `apps/web/.env.local` (create from `.env.example`).
Mobile variables are `EXPO_PUBLIC_` prefixed — see `apps/mobile/.env.example`.

Key web variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

## Stack

- **Web:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Mobile:** Expo SDK 57 + React Native 0.86 + React Navigation 7
- **Database:** Supabase (PostgreSQL + Realtime)
- **Auth:** Custom JWT sessions (jose + bcryptjs) — httpOnly cookie on web, SecureStore Bearer token on mobile
- **Rate limiting:** Upstash Redis
- **Email:** Resend
- **Image processing:** sharp

## User preferences

- Keep existing project structure — do not restructure or migrate.
