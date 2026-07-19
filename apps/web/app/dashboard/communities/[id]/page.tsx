import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { fetchCommunitySSRData } from "@/lib/communities/server";
import { CommunityChat } from "@/components/communities/CommunityChat";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CommunityPage({ params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "user") redirect("/login");

  const { id } = await params;
  const userId = (session as { userId: string }).userId;

  /**
   * Detect whether this is a hard browser refresh or a client-side navigation.
   *
   * On client-side navigation, Next.js fetches the RSC payload and includes
   * the `Next-Router-State-Tree` header.  A hard refresh is a plain HTTP GET
   * with no such header.
   *
   * - Hard refresh  → fetch SSR data server-side and pass as props so the
   *   client cache is seeded instantly on hydration (zero API calls after JS
   *   loads).
   * - Client navigation → skip the server fetch; the client-side module-level
   *   cache and prefetch architecture handles it instantly as before.
   */
  const headerStore = await headers();
  const isClientNav = headerStore.has("Next-Router-State-Tree");

  const ssrData = isClientNav
    ? null
    : await fetchCommunitySSRData(id, userId).catch(() => null);

  return (
    <CommunityChat
      communityId={id}
      currentUserId={userId}
      initialMeta={ssrData?.meta}
      initialMessages={ssrData?.messages}
    />
  );
}
