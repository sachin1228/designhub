export type ModerationStatus = "approved" | "rejected" | "review";

export interface ModerationResult {
  allowed: boolean;       // true = approved or review; false = rejected
  status: ModerationStatus;
  reason: string;
  provider: string;
  confidence?: number;
  rawResponse?: unknown;
}

export type ContentType =
  | "message"
  | "image"
  | "bio"
  | "username"
  | "community_name";
