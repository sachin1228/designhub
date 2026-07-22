import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getMasterImageMap } from "@/lib/master-data-cache";
import type { CachedMeta, CachedMessage, MessageReaction } from "./cache";

export interface SSRCommunityData {
  meta: CachedMeta;
  messages: CachedMessage[];
  /**
   * The user's last_read_at timestamp for this community at the time of the
   * hard refresh.  CommunityChat uses this to find the first unread message by
   * timestamp comparison, which is more reliable than counting from the end.
   * null means the user has never opened this community before.
   */
  lastReadAt: string | null;
}

/**
 * Fetches community metadata AND latest messages (with reactions) in parallel,
 * server-side.
 *
 * Called only during hard browser refresh (not on client-side navigation).
 * Eliminates the client-side loading waterfall: instead of the browser
 * downloading JS → hydrating → making 2 API calls, the data is embedded
 * in the SSR props and the cache is seeded immediately on hydration.
 */
export async function fetchCommunitySSRData(
  communityId: string,
  userId: string,
): Promise<SSRCommunityData | null> {
  const db = createServiceClient();

  // ─── Round 1: membership + community + messages (parallel) ───────────────
  const [
    { data: membership },
    { data: community },
    { data: msgRows },
  ] = await Promise.all([
    db
      .from("community_members")
      .select("joined_at, last_read_at")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .maybeSingle(),
    db
      .from("communities")
      .select("id, name, type, image_url, reference_id, created_at")
      .eq("id", communityId)
      .maybeSingle(),
    db
      .from("community_messages")
      .select("id, content, created_at, user_id")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (!membership || !community) return null;

  const msgs = (msgRows ?? []) as {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
  }[];
  const uniqueMsgUserIds = [...new Set(msgs.map((m) => m.user_id))];
  const messageIds       = msgs.map((m) => m.id);

  // ─── Round 2: image + member rows + count + msg sender info + reactions (parallel) ─
  const [
    masterImgMap,
    { data: memberRows },
    { count: memberCount },
    { data: msgUsers },
    { data: msgProfiles },
    { data: reactionRows },
  ] = await Promise.all([
    getMasterImageMap(community.type as string),
    db
      .from("community_members")
      .select("user_id, joined_at")
      .eq("community_id", communityId)
      .order("joined_at", { ascending: false })
      .limit(10),
    db
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityId),
    uniqueMsgUserIds.length
      ? db.from("users").select("id, name").in("id", uniqueMsgUserIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    uniqueMsgUserIds.length
      ? db
          .from("designer_profiles")
          .select("user_id, avatar_url")
          .in("user_id", uniqueMsgUserIds)
      : Promise.resolve({ data: [] as { user_id: string; avatar_url: string | null }[] }),
    messageIds.length
      ? db
          .from("message_reactions")
          .select("message_id, user_id, emoji")
          .in("message_id", messageIds)
      : Promise.resolve({ data: [] as { message_id: string; user_id: string; emoji: string }[] }),
  ]);

  const resolvedImageUrl: string | null =
    (community.reference_id ? masterImgMap[community.reference_id] : undefined) ??
    (community as any).image_url ??
    null;

  // ─── Round 3: member user info (sequential after round 2) ────────────────
  const memberUserIds = (memberRows ?? []).map((m) => m.user_id);
  const [{ data: memberUsers }, { data: memberProfiles }] = memberUserIds.length
    ? await Promise.all([
        db.from("users").select("id, name").in("id", memberUserIds),
        db
          .from("designer_profiles")
          .select("user_id, avatar_url")
          .in("user_id", memberUserIds),
      ])
    : [
        { data: [] as { id: string; name: string }[] },
        { data: [] as { user_id: string; avatar_url: string | null }[] },
      ];

  // ─── Assemble members ─────────────────────────────────────────────────────
  const memberUserMap = Object.fromEntries(
    (memberUsers ?? []).map((u) => [u.id, u.name])
  );
  const memberAvatarMap = Object.fromEntries(
    (memberProfiles ?? []).map((p) => [p.user_id, p.avatar_url ?? null])
  );
  const members: CachedMeta["members"] = (memberRows ?? []).map((m) => ({
    user_id: m.user_id,
    users: memberUserMap[m.user_id]
      ? { name: memberUserMap[m.user_id], avatar_url: memberAvatarMap[m.user_id] ?? null }
      : null,
  }));

  // ─── Assemble reactions map ───────────────────────────────────────────────
  const reactionsMap: Record<string, MessageReaction[]> = {};
  for (const r of reactionRows ?? []) {
    if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = [];
    const group = reactionsMap[r.message_id].find((g) => g.emoji === r.emoji);
    if (group) {
      group.user_ids.push(r.user_id);
    } else {
      reactionsMap[r.message_id].push({ emoji: r.emoji, user_ids: [r.user_id] });
    }
  }

  // ─── Assemble messages ────────────────────────────────────────────────────
  const msgUserMap: Record<string, { name: string; avatar_url: string | null }> = {};
  const msgAvatarMap = Object.fromEntries(
    (msgProfiles ?? []).map((p) => [p.user_id, p.avatar_url ?? null])
  );
  for (const u of msgUsers ?? []) {
    msgUserMap[u.id] = { name: u.name, avatar_url: msgAvatarMap[u.id] ?? null };
  }
  const messages: CachedMessage[] = msgs
    .slice()
    .reverse()
    .map((m) => ({
      ...m,
      users: msgUserMap[m.user_id] ?? null,
      reactions: reactionsMap[m.id] ?? [],
    }));

  const meta: CachedMeta = {
    community: {
      id: community.id,
      name: community.name,
      type: community.type,
      member_count: memberCount ?? 0,
      image_url: resolvedImageUrl,
    },
    members,
    fetchedAt: Date.now(),
  };

  const lastReadAt: string | null =
    (membership as unknown as { last_read_at: string | null }).last_read_at ?? null;

  return { meta, messages, lastReadAt };
}
