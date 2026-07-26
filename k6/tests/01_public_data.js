/**
 * Public data endpoints — no authentication required.
 *
 * Endpoints covered:
 *   GET /api/data/cities
 *   GET /api/data/companies
 *   GET /api/data/sectors
 *   GET /api/data/interests
 *   GET /api/data/experience-levels
 *   GET /api/giphy?type=trending&limit=10
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL } from '../config.js';
import { arrayResponse } from '../utils/checks.js';

const ENDPOINTS = [
  { name: 'cities',            path: '/api/data/cities' },
  { name: 'companies',         path: '/api/data/companies' },
  { name: 'sectors',           path: '/api/data/sectors' },
  { name: 'interests',         path: '/api/data/interests' },
  { name: 'experience-levels', path: '/api/data/experience-levels' },
];

export function publicDataTests() {
  group('public data — reference lists', () => {
    for (const ep of ENDPOINTS) {
      group(ep.name, () => {
        const res = http.get(`${BASE_URL}${ep.path}`, {
          tags: { name: `data/${ep.name}` },
        });
        check(res, arrayResponse(`data/${ep.name}`));
        sleep(0.1);
      });
    }
  });

  group('giphy — trending', () => {
    const res = http.get(`${BASE_URL}/api/giphy?type=trending&limit=10`, {
      tags: { name: 'giphy/trending' },
    });
    check(res, {
      'giphy/trending: status 200 or 429': (r) =>
        r.status === 200 || r.status === 429,
    });
    sleep(0.1);
  });

  group('giphy — search', () => {
    const res = http.get(`${BASE_URL}/api/giphy?type=search&q=design&limit=10`, {
      tags: { name: 'giphy/search' },
    });
    check(res, {
      'giphy/search: status 200 or 429': (r) =>
        r.status === 200 || r.status === 429,
    });
    sleep(0.1);
  });
}
