/**
 * Next.js instrumentation hook — runs once when the server starts.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run in the Node.js runtime (not edge), and not during build.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateModerationSetup } = await import("@/lib/moderation/model-probe");
    await validateModerationSetup();
  }
}
