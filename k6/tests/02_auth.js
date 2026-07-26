/**
 * Auth endpoints stress tests.
 *
 * Endpoints covered:
 *   POST /api/auth/login        (valid + invalid credentials)
 *   GET  /api/auth/me           (with + without session)
 *   POST /api/auth/logout
 *   POST /api/auth/reset-request
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, JSON_HEADERS } from '../config.js';
import { loginUser, logout } from '../utils/auth.js';

const USER_EMAIL    = __ENV.TEST_USER_EMAIL    || 'testuser@example.com';
const USER_PASSWORD = __ENV.TEST_USER_PASSWORD || 'password123';

export function authTests() {
  group('auth — login with valid credentials', () => {
    loginUser(USER_EMAIL, USER_PASSWORD);
    sleep(0.2);
  });

  group('auth — me (authenticated)', () => {
    const res = http.get(`${BASE_URL}/api/auth/me`, {
      tags: { name: 'auth/me-authed' },
    });
    check(res, {
      'auth/me authed: status 200': (r) => r.status === 200,
      'auth/me authed: user present': (r) => {
        try { return !!JSON.parse(r.body).user; } catch { return false; }
      },
    });
    sleep(0.1);
  });

  group('auth — logout', () => {
    logout();
    sleep(0.1);
  });

  group('auth — me (unauthenticated)', () => {
    const res = http.get(`${BASE_URL}/api/auth/me`, {
      tags: { name: 'auth/me-unauthed' },
    });
    check(res, {
      'auth/me unauthed: status 200': (r) => r.status === 200,
      'auth/me unauthed: user null': (r) => {
        try { return JSON.parse(r.body).user === null; } catch { return false; }
      },
    });
    sleep(0.1);
  });

  group('auth — login with invalid credentials', () => {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: 'nobody@example.com', password: 'wrongpass' }),
      { headers: JSON_HEADERS, tags: { name: 'auth/login-invalid' } },
    );
    check(res, {
      'auth/login invalid: status 401 or 400': (r) =>
        r.status === 401 || r.status === 400,
    });
    sleep(0.2);
  });

  group('auth — reset password request', () => {
    // Uses a non-existent email — should still respond 200 (no user enumeration)
    const res = http.post(
      `${BASE_URL}/api/auth/reset-request`,
      JSON.stringify({ email: 'nobody@example.com' }),
      { headers: JSON_HEADERS, tags: { name: 'auth/reset-request' } },
    );
    check(res, {
      'auth/reset-request: status 200 or 429': (r) =>
        r.status === 200 || r.status === 429,
    });
    sleep(0.3);
  });
}
