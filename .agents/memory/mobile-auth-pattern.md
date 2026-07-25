---
name: Mobile Bearer Token Auth
description: How the React Native app authenticates against the Next.js API without cookies.
---

# Mobile Bearer Token Auth

## Rule
The mobile app sends `Authorization: Bearer <jwt>` on every request. The Next.js middleware (`middleware.ts`) intercepts `/api/*` routes and injects the token as the `draft_session` cookie before passing the request to route handlers — so no route handler changes were needed.

**Why:** Next.js API routes use `cookies()` from `next/headers` to read the session. Modifying every route to also check headers would be fragile. Middleware injection means zero changes to route logic.

**How to apply:** Any new API route that calls `requireSession()` gets mobile support for free. The only place to maintain this is the Bearer → cookie injection block at the top of `middleware.ts`, inside the `/api/` path guard.

## Login returns token in body
`POST /api/auth/login` now returns `{ token }` in the JSON body (in addition to setting the httpOnly cookie). The mobile app stores this via `expo-secure-store`.

## Mobile app location
`apps/mobile/` — Expo SDK 57, React Native 0.86, React 19. Config via `EXPO_PUBLIC_` env vars in `apps/mobile/.env`.
