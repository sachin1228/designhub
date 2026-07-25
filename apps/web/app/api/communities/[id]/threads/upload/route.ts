import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { uploadToR2 } from "@/lib/r2";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireSession("user");
  } catch (error) {
    return error as Response;
  }

  const { id: communityId } = await params;
  const db = createServiceClient();
  const { data: membership } = await db
    .from("community_members")
    .select("joined_at")
    .eq("community_id", communityId)
    .eq("user_id", session.userId!)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "Not a member of this community." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 422 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "This file type is not supported." }, { status: 422 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Files must be 10 MB or smaller." }, { status: 422 });
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const key = `threads/${communityId}/${session.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  try {
    const url = await uploadToR2(key, Buffer.from(await file.arrayBuffer()), file.type);
    return NextResponse.json(
      { attachment: { name: file.name, url, type: file.type, size: file.size } },
      { status: 201 },
    );
  } catch (error) {
    console.error("[thread upload]", error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}