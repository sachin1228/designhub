import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/auth/session";

const TABLE_LOOKUP: Record<string, { table: string; idCol: string; label: string }> = {
  city:             { table: "cities",            idCol: "id", label: "City"             },
  sector:           { table: "design_sectors",    idCol: "id", label: "Industry"         },
  interest:         { table: "design_interests",  idCol: "id", label: "Interest"         },
  company:          { table: "companies",         idCol: "id", label: "Company"          },
  experience_level: { table: "experience_levels", idCol: "id", label: "Experience Level" },
};

/** Admin-only: returns all communities with member/message counts */
export async function GET() {
  try { await requireSession("admin"); } catch (e) { return e as Response; }

  const db = createServiceClient();

  const { data: communities, error } = await db
    .from("communities")
    .select("id, name, type, image_url, reference_id, created_at")
    .order("type")
    .order("name");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch communities." }, { status: 500 });
  }
  if (!communities?.length) return NextResponse.json({ communities: [] });

  // Member counts
  const memberCounts = await Promise.all(
    communities.map((c) =>
      db
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_id", c.id)
        .then(({ count }) => ({ id: c.id, count: count ?? 0 }))
    )
  );
  const memberCountMap = Object.fromEntries(memberCounts.map((r) => [r.id, r.count]));

  // Message counts
  const messageCounts = await Promise.all(
    communities.map((c) =>
      db
        .from("community_messages")
        .select("*", { count: "exact", head: true })
        .eq("community_id", c.id)
        .then(({ count }) => ({ id: c.id, count: count ?? 0 }))
    )
  );
  const messageCountMap = Object.fromEntries(messageCounts.map((r) => [r.id, r.count]));

  const result = communities.map((c) => ({
    id:            c.id,
    name:          c.name,
    type:          c.type,
    image_url:     c.image_url,
    reference_id:  c.reference_id,
    created_at:    c.created_at,
    member_count:  memberCountMap[c.id] ?? 0,
    message_count: messageCountMap[c.id] ?? 0,
  }));

  return NextResponse.json({ communities: result });
}
