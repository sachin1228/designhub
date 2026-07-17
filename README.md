# draft/ — a home for designers

A web platform for UI/UX, product, and social media designers. This is the
initial project setup: a monorepo ready to grow into web + mobile, with a
static (non-functional) login page as the first screen.

## Stack

- **Web app:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database / Auth:** Supabase
- **Shared code:** a `packages/shared` workspace for types & constants that
  the web app uses now, and a future mobile app (React Native / Expo) can
  import too, so both talk to the same Supabase project the same way.

## Project structure

```
draft/
├── apps/
│   └── web/               Next.js web app
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx           placeholder home page
│       │   └── login/page.tsx     the static login page
│       ├── lib/supabase/          Supabase client + server helpers (ready, unwired)
│       └── .env.example
├── packages/
│   └── shared/             Shared TS types & constants (used by web, and later mobile)
├── supabase/
│   └── schema.sql          Starter table for designer profiles (run when ready)
└── package.json             npm workspaces root
```

## 1. Prerequisites

- **Node.js 18.18+** (20 LTS recommended)
- **npm 9+** (comes with Node)

## 2. Install dependencies

From the project root:

```bash
npm install
```

This installs everything for both `apps/web` and `packages/shared` in one go
(npm workspaces).

## 3. Set up Supabase (optional for now)

The login page is static right now — no network calls happen when you click
"Log in," so you can skip this step and still run the app. When you're ready
to wire up real auth:

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy your **Project URL** and **anon public
   key**.
3. Copy the env file and fill it in:

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

4. Paste your URL and anon key into `apps/web/.env.local`.
5. When you're ready to add real tables, run `supabase/schema.sql` in your
   project's SQL editor (Supabase dashboard → SQL Editor). It creates a
   starter `profiles` table matching the `DesignerProfile` type in
   `packages/shared`.

## 4. Run it locally

From the project root:

```bash
npm run dev
```

Then open:

- **http://localhost:3000** — placeholder home page
- **http://localhost:3000/login** — the login page

## What's wired vs. what's static

- The **login page** is UI only. The form doesn't submit anywhere and the
  buttons don't do anything yet — that was intentional for this first pass.
- `lib/supabase/client.ts` and `lib/supabase/server.ts` are ready to use
  (standard Supabase + Next.js App Router setup) whenever you want to
  connect the form to real sign-up/login.

## Planning ahead for mobile

`packages/shared` is the reuse point. It currently exports:

- `APP_NAME`, `APP_TAGLINE` — brand constants
- `DesignerRole`, `DesignerProfile` — types matching the Supabase schema

When you start the mobile app (e.g. `apps/mobile` with Expo), it can install
`@supabase/supabase-js` directly and import the same types and constants
from `@draft/shared`, so both apps stay in sync against one Supabase
project and one data model.

## Next steps

- Wire the login form up to Supabase Auth (email/password + OAuth)
- Build the sign-up flow and a real profile table
- Add the designer feed / portfolio pages
- Add `apps/mobile` when you're ready to start the mobile app
