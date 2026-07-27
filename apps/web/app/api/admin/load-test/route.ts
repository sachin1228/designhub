import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Thin entry point. All k6 spawn logic lives in ./impl.ts.
 *
 * Loading impl.ts with turbopackIgnore prevents Turbopack from adding it to
 * its module graph. It will never see the spawn() call or the path.join()
 * arguments inside impl.ts, so it won't try to resolve them as module imports.
 *
 * This is the correct workaround for the Turbopack bug where arguments passed
 * to child_process.spawn() are incorrectly treated as module require() paths.
 */
export async function POST(req: NextRequest): Promise<Response> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = (await import(/* turbopackIgnore: true */ "./impl")) as any;
  return mod.handlePost(req);
}
