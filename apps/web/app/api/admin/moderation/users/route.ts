import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try { await requireSession("admin"); } catch (e) { return e as Response; }

  const db = createServiceClient();
  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const search = (searchParams.get("search") ?? "").trim();
  const filter = searchParams.get("filter") ?? "all"; // all | warned | banned

  const from = (page - 1) * PAGE_SIZE;

  // Get users with their punishment counts
  let q = db
    .from("users")
    .select("id, name, email, is_blocked, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (search) q = q.ilike("name", `%${search}%`);
  if (filter === "banned") q = q.eq("is_blocked", true);

  const { data: users, count, error } = await q;

  if (error) {
    console.error("[moderation users]", error);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }

  const userIds = (users ?? []).map((u) => u.id);

  type Punishment = {
    user_id: string;
    type: string;
    created_at: string;
    expires_at: string | null;
    reason: string;
    revoked_at: string | null;
  };

  // Fetch punishments for these users
  const { data: punishments } = userIds.length
    ? await db
        .from("user_punishments")
        .select("user_id, type, created_at, expires_at, reason, revoked_at")
        .in("user_id", userIds)
        .order("created_at", { ascending: false })
    : { data: [] as Punishment[] };

  const punishmentMap: Record<string, Punishment[]> = {};
  for (const p of (punishments ?? []) as Punishment[]) {
    if (!punishmentMap[p.user_id]) punishmentMap[p.user_id] = [];
    punishmentMap[p.user_id]!.push(p);
  }

  const result = (users ?? []).map((u) => ({
    ...u,
    punishments: punishmentMap[u.id] ?? [],
    warning_count: (punishmentMap[u.id] ?? []).filter((p) => p.type === "warning").length,
    active_ban: (punishmentMap[u.id] ?? []).find(
      (p) => (p.type === "temp_ban" || p.type === "perm_ban") && !p.revoked_at
    ) ?? null,
  }));

  // Apply warned filter in memory (can't easily do it via a join in one query)
  const filtered = filter === "warned"
    ? result.filter((u) => u.warning_count > 0)
    : result;

  return NextResponse.json({ users: filtered, total: count ?? 0, page, page_size: PAGE_SIZE });
}
