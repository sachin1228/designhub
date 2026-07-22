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

// ── NudeNet ───────────────────────────────────────────────────────────────────
// Throws on any failure so the caller can fail closed.
async function callNudeNet(
  _buffer: Buffer,
): Promise<{ explicit: boolean; confidence: number; detections: unknown[] }> {
  const nudeNetUrl = process.env.NUDENET_URL;
  if (!nudeNetUrl) {
    // NudeNet is required. No URL = service unavailable = fail closed.
    throw new Error("NUDENET_URL is not configured — image moderation service unavailable");
  }
  console.log("[moderateImage] NudeNet request started:", nudeNetUrl);
  const form = new FormData();
  form.append("file", new Blob([_buffer.buffer as ArrayBuffer]), "image.webp");
  const res = await fetch(`${nudeNetUrl}/moderate-image`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`NudeNet HTTP ${res.status}`);
  const json = await res.json();
  console.log("[moderateImage] NudeNet response:", JSON.stringify(json));
  return json;
}

// ── Main image moderator ──────────────────────────────────────────────────────
export async function moderateImage(buffer: Buffer): Promise<ModerationResult> {
  const openai = getClient();

  // ── 1. OpenAI image moderation ────────────────────────────────────────────
  if (openai) {
    console.log("[moderateImage] OpenAI request started");
    try {
      // Detect actual MIME type from magic bytes so the data URL is accurate.
      let mimeType = "image/jpeg";
      if (buffer[0] === 0x89 && buffer[1] === 0x50) mimeType = "image/png";
      else if (buffer[0] === 0x47 && buffer[1] === 0x49) mimeType = "image/gif";
      else if (buffer[0] === 0x52 && buffer[1] === 0x49) mimeType = "image/webp";

      const b64 = buffer.toString("base64");
      const res = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: [{ type: "image_url", image_url: { url: `data:${mimeType};base64,${b64}` } }],
      });

      const result = res.results[0];
      console.log("[moderateImage] OpenAI response — flagged:", result.flagged, "categories:", JSON.stringify(result.categories));

      if (result.flagged) {
        const scores = result.category_scores as unknown as Record<string, number>;
        const maxScore = Math.max(...Object.values(scores));
        const flaggedCats = Object.entries(result.categories as unknown as Record<string, boolean>)
          .filter(([, v]) => v)
          .map(([k]) => k);

        const isHardReject = flaggedCats.some((c) => REJECT_LABELS.has(c)) || maxScore >= AUTO_REJECT_THRESHOLD;

        if (isHardReject) {
          console.log("[moderateImage] Decision: REJECTED by OpenAI — categories:", flaggedCats, "maxScore:", maxScore);
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
          console.log("[moderateImage] Decision: REVIEW by OpenAI — categories:", flaggedCats, "maxScore:", maxScore);
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
    } catch (err: any) {
      if (err?.status === 403) {
        // 403 = this key/project can't use omni-moderation-latest for images.
        // Fall through to NudeNet which is purpose-built for image content.
        console.warn("[moderateImage] OpenAI 403 — omni-moderation-latest unavailable for images, falling through to NudeNet");
      } else {
        // Any other OpenAI error — FAIL CLOSED.
        console.error("[moderateImage] OpenAI error (fail-closed):", err);
        return {
          allowed: false,
          status: "rejected",
          reason: "Image moderation service error. Please try again.",
          provider: "openai",
        };
      }
    }
  }

  // ── 2. NudeNet check ──────────────────────────────────────────────────────
  let nudeNet: { explicit: boolean; confidence: number; detections: unknown[] };
  try {
    nudeNet = await callNudeNet(buffer);
  } catch (err) {
    // NudeNet failed or not configured — FAIL CLOSED. Do not upload.
    console.error("[moderateImage] NudeNet error (fail-closed):", err);
    return {
      allowed: false,
      status: "rejected",
      reason: "Image moderation service error. Please try again.",
      provider: "nudenet",
    };
  }

  if (nudeNet.explicit) {
    if (nudeNet.confidence >= AUTO_REJECT_THRESHOLD) {
      console.log("[moderateImage] Decision: REJECTED by NudeNet — confidence:", nudeNet.confidence);
      return {
        allowed: false,
        status: "rejected",
        reason: "This image violates our community guidelines.",
        provider: "nudenet",
        confidence: nudeNet.confidence,
        rawResponse: nudeNet,
      };
    }
    // Any explicit detection (even below AUTO_REJECT_THRESHOLD) goes to review,
    // not silently approved.
    console.log("[moderateImage] Decision: REVIEW by NudeNet — confidence:", nudeNet.confidence);
    return {
      allowed: true,
      status: "review",
      reason: "Image flagged for manual review.",
      provider: "nudenet",
      confidence: nudeNet.confidence,
      rawResponse: nudeNet,
    };
  }

  console.log("[moderateImage] Decision: APPROVED");
  return { allowed: true, status: "approved", reason: "", provider: "nudenet" };
}
