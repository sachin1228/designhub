/**
 * Concurrent chat load test — thousands of distinct users all chatting
 * in the same community at the same time.
 *
 * Each VU logs in as a *different* pre-seeded user (loaded from
 * k6/data/test-users.json), so rate limits apply per-user rather than
 * blocking all VUs on a single account.
 *
 * Prerequisites:
 *   1. Run the seeder to create users and generate the credentials file:
 *        node k6/scripts/seed-users.js
 *   2. Then run this scenario.
 *
 * Usage:
 *   # 500 users, 3-minute ramp, 5-minute hold
 *   k6 run k6/scenarios/chat_concurrent.js \
 *     -e BASE_URL=https://drafthub-web.vercel.app \
 *     -e TEST_COMMUNITY_ID=<uuid>
 *
 *   # Override number of concurrent VUs (must be ≤ users in test-users.json)
 *   k6 run k6/scenarios/chat_concurrent.js \
 *     -e BASE_URL=https://drafthub-web.vercel.app \
 *     -e TEST_COMMUNITY_ID=<uuid> \
 *     -e CONCURRENT_VUS=1000
 *
 * Scenarios included:
 *   warm_up     —  10 VUs for 1 min  (confirm everything works)
 *   ramp        —  ramp from 10 → MAX VUs over 3 min
 *   hold        —  hold MAX VUs for 5 min (peak stress)
 *   cool_down   —  ramp back to 0 over 1 min
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Rate, Trend } from 'k6/metrics';
import { BASE_URL, JSON_HEADERS } from '../config.js';

// ── Load pre-seeded user credentials ─────────────────────────────────────
// SharedArray is read once and shared across all VUs (memory-efficient).
const users = new SharedArray('test-users', function () {
  return JSON.parse(open('../data/test-users.json'));
});

// ── Config ────────────────────────────────────────────────────────────────
const COMMUNITY_ID  = __ENV.TEST_COMMUNITY_ID || 'test-community-id';
const MAX_VUS       = parseInt(__ENV.CONCURRENT_VUS || String(Math.min(users.length, 500)), 10);
const BASE_MSG_URL  = `${BASE_URL}/api/communities/${COMMUNITY_ID}/messages`;

// ── Custom metrics ────────────────────────────────────────────────────────
const messagesSent     = new Counter('chat_messages_sent');
const messagesRejected = new Counter('chat_messages_rejected');
const reactionsSent    = new Counter('chat_reactions_sent');
const rateLimitHits    = new Counter('chat_rate_limit_hits');
const messageSendTime  = new Trend('chat_message_send_ms', true);
const pollTime         = new Trend('chat_poll_ms', true);

// ── Scenarios ─────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    concurrent_chat: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m',  target: 10       }, // warm-up
        { duration: '3m',  target: MAX_VUS  }, // ramp to peak
        { duration: '5m',  target: MAX_VUS  }, // hold at peak
        { duration: '1m',  target: 0        }, // cool-down
      ],
    },
  },
  thresholds: {
    // p(95) of message sends must be under 3s
    chat_message_send_ms: ['p(95)<3000'],
    // p(95) of polls must be under 2s
    chat_poll_ms: ['p(95)<2000'],
    // Overall HTTP error rate under 20% (rate-limited 429s are expected)
    http_req_failed: ['rate<0.20'],
    // Check pass rate > 90%
    checks: ['rate>0.90'],
  },
};

// ── VU session ───────────────────────────────────────────────────────────
export default function () {
  // Each VU picks a unique user by its index (wraps if VUs > users)
  const user = users[(__VU - 1) % users.length];

  // ── 1. Login ─────────────────────────────────────────────────────────
  let loginOk = false;

  group('login', () => {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      { headers: JSON_HEADERS, tags: { name: 'chat/login' } },
    );
    loginOk = res.status === 200;
    check(res, {
      'login: 200 or 429': (r) => r.status === 200 || r.status === 429,
    });
    if (res.status === 429) rateLimitHits.add(1);
    sleep(0.2);
  });

  if (!loginOk) {
    // Rate-limited on login — back off and let other VUs go
    sleep(2);
    return;
  }

  // ── 2. Poll latest messages ───────────────────────────────────────────
  let latestMsgId   = null;
  let oldestMsgTime = null;

  group('poll messages', () => {
    const start = Date.now();
    const res   = http.get(BASE_MSG_URL, { tags: { name: 'chat/poll' } });
    pollTime.add(Date.now() - start);

    check(res, {
      'poll: status 200': (r) => r.status === 200,
      'poll: messages array': (r) => {
        try { return Array.isArray(JSON.parse(r.body).messages); } catch { return false; }
      },
    });
    if (res.status === 200) {
      try {
        const msgs = JSON.parse(res.body).messages;
        if (msgs && msgs.length > 0) {
          latestMsgId   = msgs[0].id;
          oldestMsgTime = msgs[msgs.length - 1].created_at;
        }
      } catch { /* ignore */ }
    }
    sleep(0.5);
  });

  // ── 3. Send a message ─────────────────────────────────────────────────
  let sentMsgId = null;

  group('send message', () => {
    const start = Date.now();
    const res   = http.post(
      BASE_MSG_URL,
      JSON.stringify({
        content: `[${user.name}] Hello from k6! VU=${__VU} iter=${__ITER}`,
      }),
      { headers: JSON_HEADERS, tags: { name: 'chat/send' } },
    );
    messageSendTime.add(Date.now() - start);

    const ok = check(res, {
      'send: 201 or 429': (r) => r.status === 201 || r.status === 429,
      'send: message id (when 201)': (r) => {
        if (r.status !== 201) return true;
        try { return !!JSON.parse(r.body).message.id; } catch { return false; }
      },
    });

    if (res.status === 201) {
      messagesSent.add(1);
      try { sentMsgId = JSON.parse(res.body).message.id; } catch { /* ignore */ }
    } else if (res.status === 429) {
      rateLimitHits.add(1);
      messagesRejected.add(1);
    }

    // Think time: ~2s between messages respects the 5/10s rate limit
    sleep(2 + Math.random());
  });

  // ── 4. Send a reply (if we have a message to reply to) ────────────────
  const replyTarget = latestMsgId || sentMsgId;

  if (replyTarget && Math.random() < 0.4) {
    // Only 40% of users send a reply each iteration (realistic ratio)
    group('send reply', () => {
      const res = http.post(
        BASE_MSG_URL,
        JSON.stringify({
          content:     `Replying from ${user.name} — k6 VU ${__VU}`,
          reply_to_id: replyTarget,
        }),
        { headers: JSON_HEADERS, tags: { name: 'chat/reply' } },
      );
      check(res, {
        'reply: 201 or 429': (r) => r.status === 201 || r.status === 429,
      });
      if (res.status === 201) messagesSent.add(1);
      if (res.status === 429) rateLimitHits.add(1);
      sleep(1);
    });
  }

  // ── 5. React to a message ─────────────────────────────────────────────
  const reactTarget = sentMsgId || latestMsgId;
  const EMOJIS = ['👍', '❤️', '🔥', '😂', '👀', '🎉', '💯', '🙌', '😍', '🤩'];

  if (reactTarget) {
    group('react', () => {
      const emoji = EMOJIS[__VU % EMOJIS.length];
      const res   = http.post(
        `${BASE_MSG_URL}/${reactTarget}/reactions`,
        JSON.stringify({ emoji }),
        { headers: JSON_HEADERS, tags: { name: 'chat/react' } },
      );
      check(res, {
        'react: status 200': (r) => r.status === 200,
        'react: reactions array': (r) => {
          try { return Array.isArray(JSON.parse(r.body).reactions); } catch { return false; }
        },
      });
      if (res.status === 200) reactionsSent.add(1);
      sleep(0.2);
    });
  }

  // ── 6. Poll new messages (after cursor) ──────────────────────────────
  if (oldestMsgTime) {
    group('poll new messages (after cursor)', () => {
      const res = http.get(
        `${BASE_MSG_URL}?after=${encodeURIComponent(oldestMsgTime)}`,
        { tags: { name: 'chat/poll-after' } },
      );
      check(res, {
        'poll-after: status 200': (r) => r.status === 200,
      });
      sleep(0.3);
    });
  }

  // ── 7. Mark community as read ─────────────────────────────────────────
  group('mark read', () => {
    const res = http.patch(
      `${BASE_URL}/api/communities/${COMMUNITY_ID}/read`,
      null,
      { tags: { name: 'chat/read' } },
    );
    check(res, {
      'read: status 200': (r) => r.status === 200,
      'read: ok true': (r) => {
        try { return JSON.parse(r.body).ok === true; } catch { return false; }
      },
    });
    sleep(0.1);
  });

  // ── 8. Clean up own message ───────────────────────────────────────────
  if (sentMsgId) {
    group('delete own message', () => {
      const res = http.del(
        `${BASE_MSG_URL}/${sentMsgId}`,
        null,
        { tags: { name: 'chat/delete' } },
      );
      check(res, {
        'delete: status 200': (r) => r.status === 200,
      });
      sleep(0.1);
    });
  }

  // ── 9. Logout ─────────────────────────────────────────────────────────
  http.post(`${BASE_URL}/api/auth/logout`, null, {
    headers: JSON_HEADERS,
    tags: { name: 'chat/logout' },
  });

  // Think time between iterations — simulates reading before typing again
  sleep(1 + Math.random() * 2);
}
