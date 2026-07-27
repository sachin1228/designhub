import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Filenames stored WITHOUT the .js extension so Turbopack never sees a complete
// ".js" path string at module scope that it could try to resolve as a module import.
const SCENARIO_FILES: Record<string, string> = {
  smoke:           "scenarios/smoke",
  load:            "scenarios/load",
  stress:          "scenarios/stress",
  soak:            "scenarios/soak",
  chat_load:       "scenarios/chat_load",
  chat_concurrent: "scenarios/chat_concurrent",
  chat_flood:      "scenarios/chat_flood",
};

export async function POST(req: NextRequest) {
  try {
    await requireSession("admin");
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  // Import child_process and path with turbopackIgnore so Turbopack treats them
  // as fully external. It will NOT trace arguments passed to spawn() as module
  // import paths — which is the root cause of the build errors on this branch.
  const { spawn } = await import(/* turbopackIgnore: true */ "child_process") as typeof import("child_process");
  const nodePath   = await import(/* turbopackIgnore: true */ "path")         as typeof import("path");

  // All path resolution happens at runtime after the opaque imports above.
  const repoRoot = nodePath.resolve(process.cwd(), "../..");
  const k6Dir    = nodePath.join(repoRoot, "k6");
  const ext      = ".js";

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

        const serviceKey    = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const sessionSecret = process.env.SESSION_SECRET;
        const communityId   = body.communityId || process.env.TEST_COMMUNITY_ID;

        if (!serviceKey || !sessionSecret || !communityId) {
          send("ERROR: Missing server-side env vars:");
          if (!serviceKey)    send("  ✗ SUPABASE_SERVICE_ROLE_KEY not set");
          if (!sessionSecret) send("  ✗ SESSION_SECRET not set");
          if (!communityId)   send("  ✗ TEST_COMMUNITY_ID not set (or pass communityId in form)");
          controller.close();
          return;
        }

        cmd  = "node";
        args = [nodePath.join(k6Dir, "scripts", "seed-users" + ext)];
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
        const {
          scenario, baseUrl, communityId, concurrentVus,
          floodVus, floodDuration,
          testUserEmail, testUserPass, adminEmail, adminPass,
        } = body as {
          scenario:      string;
          baseUrl:       string;
          communityId:   string;
          concurrentVus: number;
          floodVus:      number;
          floodDuration: string;
          testUserEmail: string;
          testUserPass:  string;
          adminEmail:    string;
          adminPass:     string;
        };

        const scenarioStem = SCENARIO_FILES[scenario];
        if (!scenarioStem) {
          send(`ERROR: Unknown scenario "${scenario}"`);
          controller.close();
          return;
        }
        if (!baseUrl || !communityId) {
          send("ERROR: baseUrl and communityId are required");
          controller.close();
          return;
        }

        const scenarioPath = nodePath.join(k6Dir, scenarioStem + ext);

        cmd  = "k6";
        args = [
          "run",
          scenarioPath,
          "-e", `BASE_URL=${baseUrl}`,
          "-e", `TEST_COMMUNITY_ID=${communityId}`,
          ...(concurrentVus ? ["-e", `CONCURRENT_VUS=${concurrentVus}`]     : []),
          ...(floodVus      ? ["-e", `FLOOD_VUS=${floodVus}`]               : []),
          ...(floodDuration ? ["-e", `FLOOD_DURATION=${floodDuration}`]     : []),
          ...(testUserEmail ? ["-e", `TEST_USER_EMAIL=${testUserEmail}`]     : []),
          ...(testUserPass  ? ["-e", `TEST_USER_PASSWORD=${testUserPass}`]   : []),
          ...(adminEmail    ? ["-e", `ADMIN_EMAIL=${adminEmail}`]            : []),
          ...(adminPass     ? ["-e", `ADMIN_PASSWORD=${adminPass}`]          : []),
        ];
        env = { ...process.env };

        send(`▶ k6 run ${scenarioStem}${ext}`);
        send(`  BASE_URL=${baseUrl}`);
        send(`  TEST_COMMUNITY_ID=${communityId}`);
        if (concurrentVus) send(`  CONCURRENT_VUS=${concurrentVus}`);
        if (testUserEmail) send(`  TEST_USER_EMAIL=${testUserEmail}`);
        if (adminEmail)    send(`  ADMIN_EMAIL=${adminEmail}`);
        send("");
      }

      const child = spawn(cmd, args, {
        cwd: repoRoot,
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
      "Content-Type":      "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
      "Cache-Control":     "no-cache",
    },
  });
}
