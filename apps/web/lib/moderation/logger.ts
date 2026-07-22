/**
 * Persist a moderation decision to `moderation_logs`.
 * Never stores raw image bytes — only metadata.
 */
import { createServiceClient } from "@/lib/supabase/service";
import type { ModerationResult, ContentType } from "./types";

interface LogModerationOptions {
  result: ModerationResult;
  contentType: ContentType;
  contentPreview?: string;       // text excerpt OR image key (not bytes)
  userId?: string;
  communityId?: string;
  contentId?: string;            // set after a row is saved
}

export async function logModeration({
  result,
  contentType,
  contentPreview,
  userId,
  communityId,
  contentId,
}: LogModerationOptions): Promise<string | null> {
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("moderation_logs")
      .insert({
        content_type:    contentType,
        content_id:      contentId ?? null,
        content_preview: contentPreview ? contentPreview.slice(0, 300) : null,
        user_id:         userId ?? null,
        community_id:    communityId ?? null,
        provider:        result.provider,
        status:          result.status,
        confidence:      result.confidence ?? null,
        reason:          result.reason || null,
        raw_response:    result.rawResponse ? (result.rawResponse as object) : null,
      })
      .select("id")
      .single();

    return data?.id ?? null;
  } catch (err) {
    // Log failures must never break the main flow
    console.error("[logModeration] failed to write log:", err);
    return null;
  }
}

export async function writeAuditLog(opts: {
  moderatorEmail: string;
  action: string;
  targetUserId?: string;
  targetContentType?: string;
  targetContentId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const db = createServiceClient();
    await db.from("moderation_audit_log").insert({
      moderator_email:     opts.moderatorEmail,
      action:              opts.action,
      target_user_id:      opts.targetUserId ?? null,
      target_content_type: opts.targetContentType ?? null,
      target_content_id:   opts.targetContentId ?? null,
      reason:              opts.reason ?? null,
      metadata:            opts.metadata ?? null,
    });
  } catch (err) {
    console.error("[writeAuditLog] failed:", err);
  }
}
