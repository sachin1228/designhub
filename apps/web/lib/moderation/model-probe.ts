/**
 * model-probe.ts
 *
 * Detects which OpenAI moderation model is actually accessible for the
 * configured API key and caches the result for the lifetime of the process.
 *
 * Models tried in priority order:
 *   1. omni-moderation-latest  — text + images
 *   2. text-moderation-latest  — text only
 *
 * If neither is accessible, `getAvailableModel()` returns null and callers
 * must fail closed.
 */

import OpenAI from "openai";

export type ModelCapability = {
  model: string;
  supportsImages: boolean;
};

// Priority-ordered list of candidates.
const CANDIDATES: ModelCapability[] = [
  { model: "omni-moderation-latest", supportsImages: true },
  { model: "text-moderation-latest", supportsImages: false },
];

// Module-level cache: undefined = not yet probed, null = none available.
let _cached: ModelCapability | null | undefined = undefined;
let _probePromise: Promise<ModelCapability | null> | null = null;

function buildClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Probe each candidate model with a benign input and return the first one
 * that responds successfully. Results are cached for the process lifetime.
 */
export async function getAvailableModel(): Promise<ModelCapability | null> {
  // Already resolved.
  if (_cached !== undefined) return _cached;

  // Coalesce concurrent callers onto a single probe.
  if (_probePromise) return _probePromise;

  _probePromise = (async (): Promise<ModelCapability | null> => {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[moderation] OPENAI_API_KEY is not set — moderation is unavailable.");
      _cached = null;
      return null;
    }

    const client = buildClient()!;

    for (const candidate of CANDIDATES) {
      try {
        await client.moderations.create({
          model: candidate.model,
          input: "hello",
        });
        console.log(
          `[moderation] ✓ Using OpenAI model: ${candidate.model}` +
          (candidate.supportsImages ? " (text + images)" : " (text only)")
        );
        _cached = candidate;
        return candidate;
      } catch (err: any) {
        const status: number | undefined = err?.status;
        const message: string = err?.error?.message ?? err?.message ?? String(err);
        if (status === 403 || status === 404 || status === 400) {
          // Model not accessible for this key/project — try the next one.
          console.warn(
            `[moderation] ✗ Model ${candidate.model} unavailable` +
            ` (HTTP ${status ?? "?"}): ${message}`
          );
        } else {
          // Transient / unexpected error — don't try further, fail closed.
          console.error(
            `[moderation] ✗ Unexpected error probing ${candidate.model}` +
            ` (HTTP ${status ?? "?"}): ${message}`,
            err
          );
          _cached = null;
          return null;
        }
      }
    }

    console.error("[moderation] No OpenAI moderation model is accessible for this API key.");
    _cached = null;
    return null;
  })();

  return _probePromise;
}

/**
 * Startup validation — call this once during server boot (instrumentation.ts).
 * Logs clearly what is and isn't available.
 */
export async function validateModerationSetup(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("[moderation:startup] ✗ OPENAI_API_KEY is missing. All moderation will fail closed.");
    return;
  }

  console.log("[moderation:startup] Probing available OpenAI moderation models…");
  const model = await getAvailableModel();

  if (!model) {
    console.error("[moderation:startup] ✗ No OpenAI moderation model is accessible. Text and image moderation will reject all content.");
    return;
  }

  if (!model.supportsImages) {
    const nudeNetConfigured = !!process.env.NUDENET_URL;
    console.warn(
      `[moderation:startup] ⚠ ${model.model} does not support image moderation.` +
      (nudeNetConfigured
        ? " NudeNet will handle image checks."
        : " NUDENET_URL is also not set — image uploads will be blocked.")
    );
  }
}
