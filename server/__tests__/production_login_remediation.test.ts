import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createCampusServer, type ServerInstance } from '../index';
import { serverAuth } from '../auth/authService';
import { authService, setApiBaseUrl, resolveApiUrl } from '../../src/services/authService';
import { persistenceService } from '../../src/services/persistenceService';

describe('Production Login & Diagnostics Remediation Suite', () => {
  let serverInstance: ServerInstance;
  let baseUrl: string;

  before(async () => {
    serverInstance = await createCampusServer(0);
    const port = serverInstance.port;
    baseUrl = `http://127.0.0.1:${port}`;
    setApiBaseUrl(`${baseUrl}/api`);

    // Ensure unlocked state
    await serverAuth.clearLockout('admin');
  });

  after(async () => {
    setApiBaseUrl(null);
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  // =========================================================================
  // 1. EXACT FAILURE REPRODUCTION: VERCEL 404 PLAIN TEXT (SEC-PROD-DIAG-01)
  // =========================================================================
  describe('1. Exact Production Failure Reproduction (Vercel 404 Text Response)', () => {
    it('accurately identifies and reports 404 text response without masking as generic JSON error', async () => {
      const originalFetch = globalThis.fetch;
      try {
        // Simulate Vercel returning plain-text 404 NOT_FOUND
        globalThis.fetch = async () => {
          return new Response('The page could not be found\n\nNOT_FOUND\n\nbom1::test-id', {
            status: 404,
            statusText: 'Not Found',
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'server': 'Vercel',
              'x-vercel-error': 'NOT_FOUND',
            },
          });
        };

        const result = await authService.login('admin', 'password123');

        assert.strictEqual(result.success, false);
        assert.notStrictEqual(
          result.error,
          'Invalid response from server',
          'Must NEVER mask 404 routing failure as generic "Invalid response from server"'
        );
        assert.ok(
          result.error?.includes('404'),
          `Error message must clearly inform the user of HTTP 404: got "${result.error}"`
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // =========================================================================
  // 2. SUCCESSFUL LOGIN & SCHEMA INTEGRITY (SEC-PROD-AUTH-01)
  // =========================================================================
  describe('2. Successful Login & Schema Validation', () => {
    it('completes login, establishes session, and returns expected AuthUser schema', async () => {
      await serverAuth.clearLockout('admin');
      const result = await authService.login('admin', 'password123');

      assert.strictEqual(result.success, true);
      assert.ok(result.user, 'User object must be present');
      assert.strictEqual(result.user?.role, 'admin');
      assert.strictEqual(result.user?.clearanceLevel, 'LEVEL_4_CHIEF');
      assert.ok(result.user?.badgeNumber, 'Badge number must be populated');

      const savedToken = persistenceService.loadSessionToken();
      assert.ok(savedToken && savedToken.startsWith('tok_'), 'Session token must be persisted');
    });
  });

  // =========================================================================
  // 3. INCORRECT CREDENTIALS & SAFE STRUCTURED ERRORS (SEC-PROD-AUTH-02)
  // =========================================================================
  describe('3. Incorrect Credentials Handling', () => {
    it('returns safe structured JSON error without leaking internal state', async () => {
      await serverAuth.clearLockout('admin');
      const result = await authService.login('admin', 'wrong_passphrase_xyz');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Invalid credentials');
      assert.strictEqual(result.lockedOut, false);
      assert.strictEqual(result.attempts, 1);
    });
  });

  // =========================================================================
  // 4. MALFORMED & INFRASTRUCTURE SERVER RESPONSES (SEC-PROD-DIAG-02)
  // =========================================================================
  describe('4. Infrastructure & Malformed Server Responses', () => {
    it('accurately reports HTTP 502 Bad Gateway HTML from reverse proxy', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async () => {
          return new Response('<html><head><title>502 Bad Gateway</title></head><body>502 Bad Gateway</body></html>', {
            status: 502,
            statusText: 'Bad Gateway',
            headers: { 'Content-Type': 'text/html' },
          });
        };

        const result = await authService.login('admin', 'password123');
        assert.strictEqual(result.success, false);
        assert.ok(result.error?.includes('502'), `Error must mention 502: got "${result.error}"`);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('accurately reports HTTP 503 Render Suspended HTML response', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async () => {
          return new Response('<!DOCTYPE html><html><body>This service has been suspended by its owner.</body></html>', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'x-render-routing': 'suspend-by-user',
            },
          });
        };

        const result = await authService.login('admin', 'password123');
        assert.strictEqual(result.success, false);
        assert.ok(result.error?.includes('503'), `Error must mention 503: got "${result.error}"`);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('accurately reports HTTP 504 Gateway Timeout response', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async () => {
          return new Response('Gateway Timeout', {
            status: 504,
            statusText: 'Gateway Timeout',
            headers: { 'Content-Type': 'text/plain' },
          });
        };

        const result = await authService.login('admin', 'password123');
        assert.strictEqual(result.success, false);
        assert.ok(result.error?.includes('504'), `Error must mention 504: got "${result.error}"`);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('accurately reports broken/malformed JSON syntax with application/json header', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async () => {
          return new Response('{ "success": true, corrupted_json...', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        };

        const result = await authService.login('admin', 'password123');
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Malformed JSON payload returned by Security Gateway.');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('accurately rejects HTTP 200 JSON missing valid session payload', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async () => {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        };

        const result = await authService.login('admin', 'password123');
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, 'Malformed session returned from server');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // =========================================================================
  // 5. GOOGLE OAUTH UNAVAILABILITY & ROUTE INTEGRITY (SEC-PROD-OAUTH-01)
  // =========================================================================
  describe('5. Google OAuth Unavailability Handling', () => {
    it('returns clean unconfigured status when Google OAuth credentials are not set', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async () => {
          return new Response(
            JSON.stringify({
              configured: false,
              error: 'Google OAuth credentials are not configured on the security server.',
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        };

        const googleUrlResult = await authService.getGoogleAuthUrl();
        assert.strictEqual(googleUrlResult.configured, false);
        assert.strictEqual(googleUrlResult.error, 'Google OAuth credentials are not configured on the security server.');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('successfully queries /api/auth/google/url contract on running backend', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google/url`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok('configured' in data);
    });

    it('reports Google OAuth route 404 without crashing or masking', async () => {
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async () => {
          return new Response('Not Found', {
            status: 404,
            statusText: 'Not Found',
            headers: { 'Content-Type': 'text/plain' },
          });
        };

        const result = await authService.getGoogleAuthUrl();
        assert.strictEqual(result.configured, false);
        assert.ok(
          result.error?.includes('404') || result.error?.includes('not found'),
          `Must indicate route not found: got "${result.error}"`
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // =========================================================================
  // 6. RENDER CORS VERIFICATION FOR VERCEL ORIGIN (SEC-PROD-CORS-01)
  // =========================================================================
  describe('6. Production CORS Validation for Vercel Origin', () => {
    const vercelOrigin = 'https://smart-campus-ten-eta.vercel.app';

    it('authorizes preflight OPTIONS from Vercel production origin with credentials', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'OPTIONS',
        headers: {
          'Origin': vercelOrigin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });

      assert.strictEqual(res.status, 204, 'Preflight from Vercel must return 204 No Content');
      assert.strictEqual(res.headers.get('access-control-allow-origin'), vercelOrigin);
      assert.strictEqual(res.headers.get('access-control-allow-credentials'), 'true');
      assert.strictEqual(res.headers.get('vary'), 'Origin');
    });

    it('includes Access-Control-Allow-Origin on actual POST requests from Vercel', async () => {
      await serverAuth.clearLockout('admin');
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Origin': vercelOrigin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });

      assert.strictEqual(res.headers.get('access-control-allow-origin'), vercelOrigin);
      assert.strictEqual(res.headers.get('access-control-allow-credentials'), 'true');
    });

    it('rejects preflight OPTIONS from untrusted origin with HTTP 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://unauthorized-attacker-site.com',
          'Access-Control-Request-Method': 'POST',
        },
      });

      assert.strictEqual(res.status, 403, 'Preflight from untrusted origin must be rejected with 403');
      assert.strictEqual(res.headers.get('access-control-allow-origin'), null);
    });
  });

  // =========================================================================
  // 7. VERCEL REWRITES & ROUTING CONFIGURATION (SEC-PROD-VERCEL-01)
  // =========================================================================
  describe('7. Vercel Configuration & Proxy Destination Verification', () => {
    const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');

    it('verifies vercel.json exists and contains correct verified backend rewrite', () => {
      assert.ok(fs.existsSync(vercelConfigPath), 'vercel.json must exist in project root');
      const raw = fs.readFileSync(vercelConfigPath, 'utf8');
      const parsed = JSON.parse(raw);

      assert.ok(Array.isArray(parsed.rewrites), 'rewrites must be an array');
      const apiRewrite = parsed.rewrites.find((r: any) => r.source === '/api/:path*');
      assert.ok(apiRewrite, 'Rewrites must include /api/:path*');
      assert.strictEqual(
        apiRewrite.destination,
        'https://smart-campus-o8y3.onrender.com/api/:path*',
        'Rewrite destination must point to verified healthy Render backend'
      );

      assert.strictEqual(
        raw.includes('smart-campus-api.onrender.com'),
        false,
        'Must NOT use obsolete hostname smart-campus-api.onrender.com'
      );
    });

    it('verifies SPA fallback rewrite is configured for client-side routing', () => {
      const raw = fs.readFileSync(vercelConfigPath, 'utf8');
      const parsed = JSON.parse(raw);
      const spaRewrite = parsed.rewrites.find((r: any) => r.destination === '/index.html');
      assert.ok(spaRewrite, 'Must include SPA fallback rewrite to /index.html');
      assert.ok(
        spaRewrite.source.includes('assets/'),
        'SPA rewrite source must exclude static assets directory'
      );
    });
  });

  // =========================================================================
  // 8. FRONTEND API URL RESOLUTION & ENDPOINT NORMALIZATION (SEC-PROD-URL-01)
  // =========================================================================
  describe('8. Frontend API URL Resolution & Endpoint Normalization', () => {
    it('resolves relative /api paths correctly when baseUrl is /api', () => {
      setApiBaseUrl('/api');
      assert.strictEqual(resolveApiUrl('/api/auth/login'), '/api/auth/login');
      assert.strictEqual(resolveApiUrl('/api/auth/me'), '/api/auth/me');
      assert.strictEqual(
        resolveApiUrl('/api/auth/lockout-status?username=admin'),
        '/api/auth/lockout-status?username=admin'
      );
    });

    it('resolves absolute backend URLs ending with /api correctly', () => {
      setApiBaseUrl('https://smart-campus-o8y3.onrender.com/api');
      assert.strictEqual(
        resolveApiUrl('/api/auth/login'),
        'https://smart-campus-o8y3.onrender.com/api/auth/login'
      );
      assert.strictEqual(
        resolveApiUrl('/api/auth/google/url'),
        'https://smart-campus-o8y3.onrender.com/api/auth/google/url'
      );
    });

    it('resolves absolute backend URLs without trailing /api correctly', () => {
      setApiBaseUrl('https://smart-campus-o8y3.onrender.com');
      assert.strictEqual(
        resolveApiUrl('/api/auth/login'),
        'https://smart-campus-o8y3.onrender.com/api/auth/login'
      );
    });
  });
});
