# Drafthub Mobile

React Native (Expo) companion app for [drafthub](../web).

## Screens

| Screen | Description |
|---|---|
| **Login** | Email + password sign-in |
| **Communities** | List of your communities with last message preview |
| **Chat** | Real-time community chat (Supabase Realtime) |
| **Profile** | View / edit your name, bio and interests |

## Setup

### 1. Configure environment variables

```bash
cp .env.example .env
```

Fill in these three values in `.env`:

| Variable | Where to find it |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Your deployed Next.js URL (e.g. `https://drafthub.replit.dev`) — no trailing slash |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API → `anon` public key |

### 2. Install dependencies

Run from the **monorepo root**:

```bash
npm install
```

### 3. Start the dev server

```bash
cd apps/mobile
npm run start
```

Scan the QR code with **Expo Go** on your phone to test instantly — no build needed.

### 4. Build an APK (Android)

Install EAS CLI:

```bash
npm install -g eas-cli
eas login
eas build:configure   # first time only
```

Build a preview APK (no store submission):

```bash
eas build --platform android --profile preview
```

EAS builds in the cloud and gives you a download link for the `.apk`.

## How auth works

The mobile app calls `POST /api/auth/login` which now returns both a session
cookie **and** the JWT token in the response body (`token` field). The app
stores the token in **Expo SecureStore** and sends it as
`Authorization: Bearer <token>` on every request. The Next.js middleware
converts that header into the `draft_session` cookie before the request reaches
the route handler, so no API routes needed to change.
