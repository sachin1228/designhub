/**
 * Smoke test — 1 VU, 1 iteration.
 *
 * Runs every endpoint group once to confirm the app is alive and all routes
 * respond with expected status codes. Run this before every load/stress test.
 *
 * Usage:
 *   k6 run k6/scenarios/smoke.js \
 *     -e BASE_URL=https://drafthub-web.vercel.app \
 *     -e ADMIN_EMAIL=admin@drafthub.com \
 *     -e ADMIN_PASSWORD=your-admin-password \
 *     -e TEST_USER_EMAIL=member@example.com \
 *     -e TEST_USER_PASSWORD=your-user-password \
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
  // ── 1. Public endpoints — no auth needed ──────────────────────────────────
  publicDataTests();

  // ── 2. Application submission — no auth needed ────────────────────────────
  applicationTests();

  // ── 3. Guard check — admin routes must reject unauthenticated requests ─────
  adminAuthGuardTests();

  // ── 4. Member session ─────────────────────────────────────────────────────
  // Log in once here; authTests() does NOT call login/logout itself.
  loginUser(USER_EMAIL, USER_PASSWORD);

  authTests();       // /me, invalid login, reset-request (session stays active)
  communityTests();  // communities, messages, reactions
  threadTests();     // threads, votes, comments
  eventTests();      // events, rsvp, event comments
  profileTests();    // profile get/patch, interests, lottie-settings

  logout();

  // ── 5. Admin session ──────────────────────────────────────────────────────
  loginAdmin(ADMIN_EMAIL, ADMIN_PASSWORD);

  adminReadTests();  // all admin GET endpoints
  adminWriteSmoke(); // create city + interest (smoke only — not in load/stress)

  logout();

  sleep(1);
}
