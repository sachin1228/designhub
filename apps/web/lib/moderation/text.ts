import OpenAI from "openai";
import type { ModerationResult } from "./types";

// ── Custom business-rule patterns ────────────────────────────────────────────

const BLOCK_PATTERNS: RegExp[] = [
  // Referral spam / promo codes
  /\bref(erral)?\s*code\b/i,
  /\binvite\s+code\b/i,
  // Crypto promotions
  /\b(crypto|bitcoin|btc|eth|ethereum|nft|token|altcoin|defi|web3\s+income)\b.{0,40}\b(invest|earn|profit|gain|return)\b/i,
  /\b(presale|ico|ido|airdrop)\b/i,
  // Fake giveaways
  /\b(giveaway|give\s*away)\b.{0,60}\b(dm|message|click|enter)\b/i,
  /\bfree\s+(money|cash|usdt|btc|crypto|iphone|gift\s*card)\b/i,
  // Investment scams
  /\b(guaranteed|100%)\s*(profit|return|roi)\b/i,
  /\bdouble\s+your\s+(money|investment|bitcoin)\b/i,
  /\bpassive\s+income\b.{0,40}\b(telegram|whatsapp|dm)\b/i,
  // Casino / gambling spam
  /\b(casino|betting|gambl(e|ing)|sports\s*bet)\b.{0,60}\b(earn|win|profit|bonus)\b/i,
  // Phishing / malware signals
  /\b(click\s+here|visit\s+now|limited\s+time|act\s+now)\b.{0,60}(https?:\/\/)/i,
  // Adult advertisements
  /\b(onlyfans|adult\s+content|xxx|hot\s+girls|meet\s+singles)\b/i,
  // Excessive self-promotion (5+ identical links in one message)
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

let _openai: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function moderateText(text: string): Promise<ModerationResult> {
  const trimmed = (text ?? "").trim();
  if (!trimmed) {
    return { allowed: true, status: "approved", reason: "", provider: "none" };
  }

  const openai = getClient();

  // ── 1. OpenAI moderation ──────────────────────────────────────────────────
  if (openai) {
    try {
      const res = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: trimmed,
      });

      const result = res.results[0];
      if (result.flagged) {
        return {
          allowed: false,
          status: "rejected",
          reason: "This content violates our community guidelines.",
          provider: "openai",
          confidence: Math.max(...Object.values(result.category_scores as unknown as Record<string, number>)),
          rawResponse: result,
        };
      }
    } catch (err) {
      // Fail open — log and continue to custom rules
      console.error("[moderateText] OpenAI error:", err);
    }
  }

  // ── 2. Custom business rules ──────────────────────────────────────────────
  const custom = applyCustomRules(trimmed);
  if (custom.blocked) {
    return {
      allowed: false,
      status: "rejected",
      reason: custom.reason,
      provider: "custom_rules",
    };
  }

  return { allowed: true, status: "approved", reason: "", provider: "openai" };
}
