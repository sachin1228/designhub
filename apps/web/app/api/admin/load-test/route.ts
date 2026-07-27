import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { spawn } from "child_process";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Repo root relative to apps/web (process.cwd() during Next.js dev)
const REPO_ROOT = path.resolve(process.cwd(), "../../");
const K6_DIR    = path.join(REPO_ROOT, "k6");

const SCENARIO_FILES: Record<string, string> = {
  smoke:            "scenarios/smoke.js",
  load:             "scenarios/load.js",
  stress:           "scenarios/stress.js",
  soak:             "scenarios/soak.js",
  chat_load:        "scenarios/chat_load.js",
  chat_concurrent:  "scenarios/chat_concurrent.js",
};

export async function POST(req: NextRequest) {
  try {
    await requireSession("admin");
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { type } = body as { type: "test" | "seed" };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      function send(line: string) {
        controller.enqueue(encoder.encode(line + "\n"));
      }

      let cmd: string;
      let args: string[];
      let env: NodeJS.ProcessEnv;

      if (type === "seed") {
        const { supabaseUrl, userCount } = body as {
          supabaseUrl: string;
          userCount: number;
        };

        if (!supabaseUrl) {
          send("ERROR: supabaseUrl is required");
          controller.close();
          return;
        }

        const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const sessionSecret = process.env.SESSION_SECRET;
        const communityId  = body.communityId || process.env.TEST_COMMUNITY_ID;

        if (!serviceKey || !sessionSecret || !communityId) {
          send("ERROR: Missing server-side env vars:");
          if (!serviceKey)    send("  ✗ SUPABASE_SERVICE_ROLE_KEY not set");
          if (!sessionSecret) send("  ✗ SESSION_SECRET not set");
          if (!communityId)   send("  ✗ TEST_COMMUNITY_ID not set (or pass communityId in form)");
          controller.close();
          return;
        }

        cmd  = "node";
        args = [path.join(K6_DIR, "scripts/seed-users.js")];
        env  = {
          ...process.env,
          SUPABASE_URL:              supabaseUrl,
          SUPABASE_SERVICE_ROLE_KEY: serviceKey,
          TEST_COMMUNITY_ID:         communityId,
          SESSION_SECRET:            sessionSecret,
          K6_USER_COUNT:             String(userCount || 200),
        };

        send(`▶ node k6/scripts/seed-users.js  (users: ${userCount || 200})`);
        send(`  SUPABASE_URL=${supabaseUrl}`);
        send(`  TEST_COMMUNITY_ID=${communityId}`);
        send("");

      } else {
        // type === "test"
        const { scenario, baseUrl, communityId, concurrentVus } = body as {
          scenario:      string;
          baseUrl:       string;
          communityId:   string;
          concurrentVus: number;
        };

        const scenarioFile = SCENARIO_FILES[scenario];
        if (!scenarioFile) {
          send(`ERROR: Unknown scenario "${scenario}"`);
          controller.close();
          return;
        }
        if (!baseUrl || !communityId) {
          send("ERROR: baseUrl and communityId are required");
          controller.close();
          return;
        }

        cmd  = "k6";
        args = [
          "run",
          path.join(K6_DIR, scenarioFile),
          "-e", `BASE_URL=${baseUrl}`,
          "-e", `TEST_COMMUNITY_ID=${communityId}`,
          ...(concurrentVus ? ["-e", `CONCURRENT_VUS=${concurrentVus}`] : []),
        ];
        env = { ...process.env };

        send(`▶ k6 run ${scenarioFile}`);
        send(`  BASE_URL=${baseUrl}`);
        send(`  TEST_COMMUNITY_ID=${communityId}`);
        if (concurrentVus) send(`  CONCURRENT_VUS=${concurrentVus}`);
        send("");
      }

      const child = spawn(cmd, args, {
        cwd: REPO_ROOT,
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      child.stdout.on("data", (chunk: Buffer) => {
        const lines = chunk.toString().split("\n");
        for (const line of lines) {
          if (line) send(line);
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        const lines = chunk.toString().split("\n");
        for (const line of lines) {
          if (line) send(line);
        }
      });

      child.on("close", (code) => {
        send("");
        send(code === 0
          ? "✅ Completed successfully (exit 0)"
          : `❌ Exited with code ${code}`
        );
        controller.close();
      });

      child.on("error", (err) => {
        send(`ERROR spawning process: ${err.message}`);
        if (err.message.includes("ENOENT")) {
          send(`  Make sure "${cmd}" is installed and on PATH.`);
          if (cmd === "k6") send("  Install: https://k6.io/docs/get-started/installation/");
        }
        controller.close();
      });

      // Abort if the client disconnects
      req.signal.addEventListener("abort", () => {
        child.kill("SIGTERM");
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
      "Cache-Control": "no-cache",
    },
  });
}
