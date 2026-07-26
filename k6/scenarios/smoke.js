/**
 * Smoke test — 1 VU, 1 iteration.
 *
 * Runs every endpoint group once to confirm the app is alive and all routes
 * respond with expected status codes. Run this before every load/stress test.
 *
 * Usage:
 *   k6 run k6/scenarios/smoke.js \
 *     -e BASE_URL=http://localhost:3000 \
 *     -e ADMIN_EMAIL=admin@example.com \
 *     -e ADMIN_PASSWORD=secret \
 *     -e TEST_USER_EMAIL=member@example.com \
 *     -e TEST_USER_PASSWORD=secret \
 *     -e TEST_COMMUNITY_ID=<uuid>
 */

import { sleep } from 'k6';
import { SMOKE_OPTIONS } from '../config.js';
import { loginUser, loginAdmin, logout } from '../utils/auth.js';
import { publicDataTests } from '../tests/01_public_data.js';
import { authTests } from '../tests/02_auth.js';
import { applicationTests } from '../tests/03_applications.js';
import { communityTests } from '../tests/04_communities.js';
import { threadTests } from '../tests/05_threads.js';
import { eventTests } from '../tests/06_events.js';
import { profileTests } from '../tests/07_profile.js';
import { adminReadTests, adminWriteSmoke, adminAuthGuardTests } from '../tests/08_admin.js';

export const options = SMOKE_OPTIONS;

const USER_EMAIL     = __ENV.TEST_USER_EMAIL    || 'testuser@example.com';
const USER_PASSWORD  = __ENV.TEST_USER_PASSWORD || 'password123';
const ADMIN_EMAIL    = __ENV.ADMIN_EMAIL         || 'admin@example.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD      || 'adminpassword';

export default function () {
  // ── 1. Public endpoints (no auth) ─────────────────────────────────────────
  publicDataTests();

  // ── 2. Application submission (no auth) ───────────────────────────────────
  applicationTests();

  // ── 3. Auth guard: admin routes must reject unauthenticated requests ───────
  adminAuthGuardTests();

  // ── 4. Member session ─────────────────────────────────────────────────────
  loginUser(USER_EMAIL, USER_PASSWORD);

  authTests();
  communityTests();
  threadTests();
  eventTests();
  profileTests();

  logout();

  // ── 5. Admin session ──────────────────────────────────────────────────────
  loginAdmin(ADMIN_EMAIL, ADMIN_PASSWORD);

  adminReadTests();
  adminWriteSmoke(); // write smoke only — not run during load/stress

  logout();

  sleep(1);
}
