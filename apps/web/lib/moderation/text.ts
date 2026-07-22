import OpenAI from "openai";
import type { ModerationResult } from "./types";
import { getAvailableModel } from "./model-probe";

// ── Custom business-rule patterns ────────────────────────────────────────────

const BLOCK_PATTERNS: RegExp[] = [
  // ── Explicit sexual content ───────────────────────────────────────────────
  /\b(fuck|fucking|fucked|fucker|fucks)\b/i,
  /\b(shit|bullshit|horseshit)\b/i,
  /\b(cunt|pussy|cock|dick|penis|vagina|asshole|ass\s*hole)\b/i,
  /\b(bitch|bastard|whore|slut|hoe)\b/i,
  /\b(nude|nudity|naked|nudes|nsfw)\b/i,
  /\bi\s+want\s+to\s+(fuck|have\s+sex|sleep\s+with)\b/i,
  /\b(rape|raped|raping)\b/i,
  /\b(masturbat(e|ing|ion)|orgasm|horny)\b/i,
  /\bsex\b/i,
  // ── Hate speech ──────────────────────────────────────────────────────────
  /\b(nigger|nigga|faggot|fag|retard|kike|chink|spic|wetback)\b/i,
  // ── Referral spam / promo codes ──────────────────────────────────────────
  /\bref(erral)?\s*code\b/i,
  /\binvite\s+code\b/i,
  // ── Crypto promotions ────────────────────────────────────────────────────
  /\b(crypto|bitcoin|btc|eth|ethereum|nft|token|altcoin|defi|web3\s+income)\b.{0,40}\b(invest|earn|profit|gain|return)\b/i,
  /\b(presale|ico|ido|airdrop)\b/i,
  // ── Fake giveaways ───────────────────────────────────────────────────────
  /\b(giveaway|give\s*away)\b.{0,60}\b(dm|message|click|enter)\b/i,
  /\bfree\s+(money|cash|usdt|btc|crypto|iphone|gift\s*card)\b/i,
  // ── Investment scams ─────────────────────────────────────────────────────
  /\b(guaranteed|100\s*%)\s*.{0,20}\b(profit|return|roi)\b/i,
  /\bdouble\s+your\s+(money|investment|bitcoin)\b/i,
  /\bpassive\s+income\b.{0,40}\b(telegram|whatsapp|dm)\b/i,
  // ── Casino / gambling spam ───────────────────────────────────────────────
  /\b(casino|betting|gambl(e|ing)|sports\s*bet)\b.{0,60}\b(earn|win|profit|bonus)\b/i,
  // ── Phishing / malware signals ───────────────────────────────────────────
  /\b(click\s+here|visit\s+now|limited\s+time|act\s+now)\b.{0,60}(https?:\/\/)/i,
  // ── Adult advertisements ─────────────────────────────────────────────────
  /\b(onlyfans|adult\s+content|xxx|hot\s+girls|meet\s+singles)\b/i,
];

const LINK_SPAM_RE = /(https?:\/\/\S+)/gi;

// Legit design domains we explicitly allow
const ALLOW_DOMAINS = [
  "figma.com",
  "behance.net",
  "dribbble.com",
  "github.com",
  "github.io",
  "gitlab.com",
  "notion.so",
  "framer.com",
  "webflow.io",
  "read.cv",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "loom.com",
  "medium.com",
  "substack.com",
];

function isAllowedDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return ALLOW_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

function applyCustomRules(text: string): { blocked: boolean; reason: string } {
  for (const pattern of BLOCK_PATTERNS) {
    if (pattern.test(text)) {
      return { blocked: true, reason: "This content violates our community guidelines." };
    }
  }

  // Link-spam check: more than 3 links AND none are allow-listed
  const links = text.match(LINK_SPAM_RE) ?? [];
  if (links.length > 3) {
    const allAllowed = links.every(isAllowedDomain);
    if (!allAllowed) {
      return { blocked: true, reason: "Too many promotional links detected." };
    }
  }

  return { blocked: false, reason: "" };
}

// ── OpenAI moderation ────────────────────────────────────────────────────────

function buildClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function moderateText(text: string): Promise<ModerationResult> {
  const trimmed = (text ?? "").trim();
  if (!trimmed) {
    return { allowed: true, status: "approved", reason: "", provider: "none" };
  }

  // ── 1. OpenAI moderation ──────────────────────────────────────────────────
  const modelInfo = await getAvailableModel();

  if (modelInfo) {
    const openai = buildClient()!;
    console.log(`[moderateText] OpenAI request started — model: ${modelInfo.model}`);
    try {
      const res = await openai.moderations.create({
        model: modelInfo.model,
        input: trimmed,
      });

      const result = res.results[0];
      console.log(
        `[moderateText] OpenAI response — flagged: ${result.flagged}`,
        "categories:", JSON.stringify(result.categories),
      );

      if (result.flagged) {
        const maxScore = Math.max(
          ...Object.values(result.category_scores as unknown as Record<string, number>),
        );
        console.log("[moderateText] Decision: REJECTED by OpenAI — maxScore:", maxScore);
        return {
          allowed: false,
          status: "rejected",
          reason: "This content violates our community guidelines.",
          provider: "openai",
          confidence: maxScore,
          rawResponse: result,
        };
      }

      console.log("[moderateText] OpenAI: not flagged — continuing to custom rules");
    } catch (err: any) {
      // The probe already confirmed this model works; a runtime error here is
      // transient (network, rate-limit, etc.) — FAIL CLOSED.
      console.error(
        `[moderateText] OpenAI runtime error (fail-closed) — model: ${modelInfo.model}`,
        `HTTP ${err?.status ?? "?"}:`,
        err?.error?.message ?? err?.message ?? err,
      );
      return {
        allowed: false,
        status: "rejected",
        reason: "Message moderation service error. Please try again.",
        provider: "openai",
      };
    }
  } else {
    // No model available — fail closed.
    console.error("[moderateText] No OpenAI moderation model available (fail-closed).");
    return {
      allowed: false,
      status: "rejected",
      reason: "Message moderation service is unavailable. Please try again later.",
      provider: "openai",
    };
  }

  // ── 2. Custom business rules ──────────────────────────────────────────────
  const custom = applyCustomRules(trimmed);
  if (custom.blocked) {
    console.log("[moderateText] Decision: REJECTED by custom rules");
    return {
      allowed: false,
      status: "rejected",
      reason: custom.reason,
      provider: "custom_rules",
    };
  }

  console.log("[moderateText] Decision: APPROVED");
  return { allowed: true, status: "approved", reason: "", provider: "openai" };
}
