import OpenAI from "openai";
import type { ModerationResult } from "./types";

// Labels that trigger immediate rejection
const REJECT_LABELS = new Set([
  "sexual",
  "sexual/minors",
  "violence/graphic",
  "hate",
  "harassment/threatening",
  "illicit/violent",
]);

// Labels that flag for manual review
const REVIEW_LABELS = new Set([
  "violence",
  "harassment",
  "illicit",
  "self-harm",
  "self-harm/intent",
  "self-harm/instructions",
]);

// Thresholds (can be overridden by DB settings later)
const AUTO_REJECT_THRESHOLD = 0.85;
const REVIEW_THRESHOLD = 0.60;

let _openai: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// ── NudeNet stub ─────────────────────────────────────────────────────────────
// Wire up the Python FastAPI service by setting NUDENET_URL env var.
// Until then the stub always passes (fails open).
async function callNudeNet(
  _buffer: Buffer,
): Promise<{ explicit: boolean; confidence: number; detections: unknown[] }> {
  const nudeNetUrl = process.env.NUDENET_URL;
  if (!nudeNetUrl) {
    return { explicit: false, confidence: 0, detections: [] };
  }
  try {
    const form = new FormData();
    form.append("file", new Blob([_buffer.buffer as ArrayBuffer]), "image.webp");
    const res = await fetch(`${nudeNetUrl}/moderate-image`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`NudeNet HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("[moderateImage] NudeNet error (fail-open):", err);
    return { explicit: false, confidence: 0, detections: [] };
  }
}

// ── Main image moderator ──────────────────────────────────────────────────────
export async function moderateImage(buffer: Buffer): Promise<ModerationResult> {
  const openai = getClient();

  // ── 1. OpenAI image moderation ────────────────────────────────────────────
  if (openai) {
    try {
      const b64 = buffer.toString("base64");
      const res = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: [{ type: "image_url", image_url: { url: `data:image/webp;base64,${b64}` } }],
      });

      const result = res.results[0];

      if (result.flagged) {
        const scores = result.category_scores as unknown as Record<string, number>;
        const maxScore = Math.max(...Object.values(scores));
        const flaggedCats = Object.entries(result.categories as unknown as Record<string, boolean>)
          .filter(([, v]) => v)
          .map(([k]) => k);

        const isHardReject = flaggedCats.some((c) => REJECT_LABELS.has(c)) || maxScore >= AUTO_REJECT_THRESHOLD;

        if (isHardReject) {
          return {
            allowed: false,
            status: "rejected",
            reason: "This image violates our community guidelines.",
            provider: "openai",
            confidence: maxScore,
            rawResponse: result,
          };
        }

        const isReview = flaggedCats.some((c) => REVIEW_LABELS.has(c)) || maxScore >= REVIEW_THRESHOLD;
        if (isReview) {
          return {
            allowed: true,
            status: "review",
            reason: "Image flagged for manual review.",
            provider: "openai",
            confidence: maxScore,
            rawResponse: result,
          };
        }
      }
    } catch (err) {
      console.error("[moderateImage] OpenAI error (fail-open):", err);
    }
  }

  // ── 2. NudeNet check ─────────────────────────────────────────────────────
  const nudeNet = await callNudeNet(buffer);
  if (nudeNet.explicit) {
    if (nudeNet.confidence >= AUTO_REJECT_THRESHOLD) {
      return {
        allowed: false,
        status: "rejected",
        reason: "This image violates our community guidelines.",
        provider: "nudenet",
        confidence: nudeNet.confidence,
        rawResponse: nudeNet,
      };
    }
    if (nudeNet.confidence >= REVIEW_THRESHOLD) {
      return {
        allowed: true,
        status: "review",
        reason: "Image flagged for manual review.",
        provider: "nudenet",
        confidence: nudeNet.confidence,
        rawResponse: nudeNet,
      };
    }
  }

  return { allowed: true, status: "approved", reason: "", provider: "openai" };
}
