// Fill in your values in apps/mobile/.env or as EXPO_PUBLIC_ env vars.
// See .env.example for the full list.

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
