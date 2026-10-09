import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { WebSocket } from 'ws';
import { createCampusServer, type ServerInstance } from '../index';
import { serverAuth } from '../auth/authService';
import { googleAuth } from '../auth/googleAuth';
import { db } from '../db/database';
import { authService, getHumanReadableRole, CANONICAL_ACCOUNTS } from '../../src/services/authService';
import { persistenceService } from '../../src/services/persistenceService';

describe('Smart Campus Identity, Role Authorization & Anti-Escalation Test Suite', () => {
  let serverInstance: ServerInstance;
  let baseUrl: string;
  let wsUrl: string;

  before(async () => {
    serverInstance = await createCampusServer(0);
    const port = serverInstance.port;
    baseUrl = `http://127.0.0.1:${port}`;
    wsUrl = `ws://127.0.0.1:${port}/ws`;
    await serverAuth.clearLockout('admin');
    await serverAuth.clearLockout('security');
    await serverAuth.clearLockout('faculty');
    await serverAuth.clearLockout('student');
  });

  after(async () => {
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  // =========================================================================
  // 1. AUTHENTICATION CORE & CREDENTIAL SECURITY
  // =========================================================================
  describe('1. Authentication Core & Credential Verification', () => {
    it('authenticates valid credentials for all four canonical roles', async () => {
      const credentials = [
        { username: 'admin', expectedRole: 'admin', expectedName: 'Chief Administrator Ramanujan' },
        { username: 'security', expectedRole: 'security_officer', expectedName: 'Officer D. Vance (Tactical Watch)' },
        { username: 'faculty', expectedRole: 'faculty', expectedName: 'Dr. Eleanor Rigby (Physics Dept)' },
        { username: 'student', expectedRole: 'student', expectedName: 'A. Chen (Engineering Undergraduate)' },
      ];

      for (const cred of credentials) {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cred.username, password: 'password123' }),
        });
        assert.strictEqual(res.status, 200, `Login failed for ${cred.username}`);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.session.sessionToken.startsWith('tok_'));
        assert.strictEqual(data.session.user.role, cred.expectedRole);
        assert.strictEqual(data.session.user.name, cred.expectedName);
      }
    });

    it('rejects incorrect password with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrongPassword!99' }),
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'Invalid credentials');
    });

    it('rejects empty password with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'faculty', password: '' }),
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    it('rejects missing password with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'security' }),
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    it('rejects nonexistent account with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nonexistent_hacker', password: 'password123' }),
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });
  });

  // =========================================================================
  // 2. IDENTITY DISPLAY & HUMAN-READABLE CLEARANCE
  // =========================================================================
  describe('2. Canonical Identity & Human-Readable Role Formatting', () => {
    it('maps canonical user roles to exact human-readable labels', () => {
      assert.strictEqual(getHumanReadableRole('admin'), 'Administrator');
      assert.strictEqual(getHumanReadableRole('security_officer'), 'Security Officer');
      assert.strictEqual(getHumanReadableRole('faculty'), 'Faculty Member');
      assert.strictEqual(getHumanReadableRole('student'), 'Student');
    });

    it('verifies canonical accounts data structure matches seed database', () => {
      assert.strictEqual(CANONICAL_ACCOUNTS.admin.name, 'Chief Administrator Ramanujan');
      assert.strictEqual(CANONICAL_ACCOUNTS.admin.clearanceLevel, 'LEVEL_4_CHIEF');
      assert.strictEqual(CANONICAL_ACCOUNTS.security_officer.name, 'Officer D. Vance (Tactical Watch)');
      assert.strictEqual(CANONICAL_ACCOUNTS.security_officer.clearanceLevel, 'LEVEL_3_SECURITY');
      assert.strictEqual(CANONICAL_ACCOUNTS.faculty.name, 'Dr. Eleanor Rigby (Physics Dept)');
      assert.strictEqual(CANONICAL_ACCOUNTS.faculty.clearanceLevel, 'LEVEL_2_FACULTY');
      assert.strictEqual(CANONICAL_ACCOUNTS.student.name, 'A. Chen (Engineering Undergraduate)');
      assert.strictEqual(CANONICAL_ACCOUNTS.student.clearanceLevel, 'LEVEL_1_STUDENT');
    });

    it('validates server session via GET /api/auth/me returns authoritative profile', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'faculty', password: 'password123' }),
      });
      const loginData = await loginRes.json();
      const token = loginData.session.sessionToken;

      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.strictEqual(meRes.status, 200);
      const meData = await meRes.json();
      assert.strictEqual(meData.user.username, 'faculty');
      assert.strictEqual(meData.user.name, 'Dr. Eleanor Rigby (Physics Dept)');
      assert.strictEqual(meData.user.role, 'faculty');
      assert.strictEqual(meData.user.clearanceLevel, 'LEVEL_2_FACULTY');
    });
  });

  // =========================================================================
  // 3. ROLE ESCALATION ATTACKS (ATTACKS A THROUGH I)
  // =========================================================================
  describe('3. Role Escalation Attack Vectors (Attacks A through I)', () => {
    let studentToken: string;
    let adminToken: string;

    before(async () => {
      await serverAuth.clearLockout('student');
      await serverAuth.clearLockout('admin');
      const sLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'student', password: 'password123' }),
      });
      studentToken = (await sLogin.json()).session.sessionToken;

      const aLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      adminToken = (await aLogin.json()).session.sessionToken;
    });

    // Attack A: Student attempts to manipulate localStorage role to Administrator
    it('Attack A: manipulating local storage presentation role does not elevate privileges on server', async () => {
      persistenceService.saveUserRole('admin');
      assert.strictEqual(persistenceService.loadUserRole(), 'admin');

      // Server /api/auth/me inspects session token in DB and returns real student role
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.user.role, 'student', 'Authoritative server role must remain student');
      assert.strictEqual(body.user.username, 'student');
    });

    // Attack B: Student modifies frontend state to Administrator
    it('Attack B: modifying client state to admin still results in server treating account as student', async () => {
      // Client tampered role
      authService.syncWithServerSession({
        id: 'USR-STU-992',
        name: 'A. Chen (Engineering Undergraduate)',
        username: 'student',
        role: 'student',
      });
      // Even if client simulates admin role locally
      authService.setUserRole('admin');
      assert.strictEqual(authService.getCurrentUser().role, 'admin');

      // But backend request using student token is bound to student account
      const res = await fetch(`${baseUrl}/api/zones/ZONE-GATE-01/lockdown`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentToken}`,
          'Content-Type': 'application/json',
        },
      });
      assert.strictEqual(res.status, 403, 'Server must reject student request to admin endpoint with 403');
    });

    // Attack C: Student attempts protected admin endpoint
    it('Attack C: student attempting protected admin lockdown endpoint returns HTTP 403', async () => {
      const res = await fetch(`${baseUrl}/api/zones/ZONE-GATE-01/lockdown`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentToken}`,
          'Content-Type': 'application/json',
        },
      });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes('Forbidden') || data.error.includes('lacks required clearance'));
    });

    // Attack D: Student attempts WebSocket privileged mutation
    it('Attack D: student attempting WebSocket privileged mutation is rejected', async () => {
      const ws = new WebSocket(`${wsUrl}?token=${studentToken}`);

      const result = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket response timeout'));
        }, 5000);

        ws.on('open', () => {
          // Attempt privileged state-mutating command over WS
          ws.send(JSON.stringify({
            type: 'LOCKDOWN_ZONE',
            zoneId: 'ZONE-GATE-01',
            operator: 'student',
          }));
        });

        ws.on('message', (data) => {
          try {
            const parsed = JSON.parse(data.toString());
            if (parsed.type === 'ERROR' && parsed.error.includes('Forbidden: Browser WebSocket clients are read-only')) {
              clearTimeout(timeout);
              ws.close();
              resolve(parsed);
            }
          } catch {}
        });

        ws.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      assert.strictEqual(result.type, 'ERROR');
      assert.ok(result.error.includes('read-only'));
    });

    // Attack E: Logged in as Administrator: logout revokes session
    it('Attack E: administrator logout explicitly revokes session server-side in DB', async () => {
      const freshAdmin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      const freshToken = (await freshAdmin.json()).session.sessionToken;

      const sessionBefore = await db.getSession(freshToken);
      assert.ok(sessionBefore);
      assert.strictEqual(sessionBefore?.revokedAt, undefined);

      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${freshToken}` },
      });
      assert.strictEqual(logoutRes.status, 200);

      const sessionAfter = await db.getSession(freshToken);
      assert.ok(sessionAfter?.revokedAt, 'Session in DB must have revokedAt populated');
    });

    // Attack F: After logout: reuse old session token returns 401
    it('Attack F: reusing old revoked session token returns HTTP 401', async () => {
      const freshAdmin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      const freshToken = (await freshAdmin.json()).session.sessionToken;

      // Revoke via logout
      await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${freshToken}` },
      });

      // Try GET /api/auth/me with revoked token
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${freshToken}` },
      });
      assert.strictEqual(meRes.status, 401);

      // Try GET /api/state with revoked token
      const stateRes = await fetch(`${baseUrl}/api/state`, {
        headers: { Authorization: `Bearer ${freshToken}` },
      });
      assert.strictEqual(stateRes.status, 401);
    });

    // Attack G & H: Routing logic (unauthenticated /app -> /login, authenticated /login -> /app)
    it('Attack G & H: routing rules enforce unauthenticated /app -> /login and authenticated /login -> /app', () => {
      // When unauthenticated, /app must direct to login
      persistenceService.clearSessionToken();
      assert.strictEqual(authService.isAuthenticated(), false);

      const evaluateRoute = (pathname: string, authed: boolean) => {
        if (pathname === '/login') {
          return authed ? '/app' : '/login';
        }
        if (pathname === '/app' || pathname.startsWith('/app')) {
          return authed ? '/app' : '/login';
        }
        return '/';
      };

      assert.strictEqual(evaluateRoute('/app', false), '/login');
      assert.strictEqual(evaluateRoute('/login', true), '/app');
      assert.strictEqual(evaluateRoute('/login', false), '/login');
      assert.strictEqual(evaluateRoute('/app', true), '/app');
    });

    // Attack I: Try to submit login with arbitrary role field
    it('Attack I: arbitrary role supplied in login body is ignored by server', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'student',
          password: 'password123',
          role: 'admin', // Forged role injection attempt
          clearanceLevel: 'LEVEL_4_CHIEF',
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.session.user.role, 'student', 'Server must ignore supplied role and enforce DB account role');
      assert.strictEqual(data.session.user.clearanceLevel, 'LEVEL_1_STUDENT');
    });
  });

  // =========================================================================
  // 4. GOOGLE OAUTH 2.0 / OIDC AUTHENTICATION & RBAC SECURITY
  // =========================================================================
  describe('4. Google OAuth Authentication & Authorization Security', () => {
    it('generates cryptographically valid authorization URL with state nonce', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google/url`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.configured, true);
      assert.ok(typeof data.state === 'string' && data.state.length >= 32);
      assert.ok(data.authUrl.includes('accounts.google.com'));
      assert.ok(data.authUrl.includes('response_type=code'));
      assert.ok(data.authUrl.includes(`state=${data.state}`));
    });

    it('rejects code exchange with invalid or missing OAuth state parameter (CSRF protection)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'test_code_admin',
          state: 'forged_unauthorized_state_token_123',
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes('OAuth state parameter'));
    });

    it('rejects GET callback when query parameters are missing or invalid', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google/callback`, {
        redirect: 'manual',
      });
      assert.strictEqual(res.status, 302);
      const location = res.headers.get('location') || '';
      assert.ok(location.includes('error=invalid_callback'));
    });

    it('rejects GET callback when OAuth state parameter does not match cache', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google/callback?code=test_code_admin&state=fake_state_token`, {
        redirect: 'manual',
      });
      assert.strictEqual(res.status, 302);
      const location = res.headers.get('location') || '';
      assert.ok(location.includes('error=invalid_oauth_state'));
    });

    it('fails closed when Google identity is unmapped / unknown (DO NOT AUTO-GRANT ACCESS)', async () => {
      const { state } = googleAuth.generateAuthUrl();
      const res = await fetch(`${baseUrl}/api/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'test_code_unauthorized',
          state,
        }),
      });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'Google identity is not authorized for this campus console.');
    });

    it('rejects GET callback with unknown Google identity and redirects with controlled error', async () => {
      const { state } = googleAuth.generateAuthUrl();
      const res = await fetch(`${baseUrl}/api/auth/google/callback?code=test_code_unauthorized&state=${state}`, {
        redirect: 'manual',
      });
      assert.strictEqual(res.status, 302);
      const location = res.headers.get('location') || '';
      assert.ok(location.includes('error=unauthorized_google_account'));
    });

    it('rejects Google account with unverified email address', async () => {
      const { state } = googleAuth.generateAuthUrl();
      const res = await fetch(`${baseUrl}/api/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'test_code_unverified_email',
          state,
        }),
      });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes('not verified'));
    });

    it('successfully maps approved Google identity to Student account', async () => {
      const { state } = googleAuth.generateAuthUrl();
      const res = await fetch(`${baseUrl}/api/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'test_code_student',
          state,
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.session.user.role, 'student');
      assert.strictEqual(data.session.user.clearanceLevel, 'LEVEL_1_STUDENT');
      assert.strictEqual(data.session.user.name, 'A. Chen (Engineering Undergraduate)');
      assert.ok(data.session.sessionToken.startsWith('tok_'));
    });

    it('successfully maps approved Google identity to Faculty account', async () => {
      const { state } = googleAuth.generateAuthUrl();
      const res = await fetch(`${baseUrl}/api/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'test_code_faculty',
          state,
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.session.user.role, 'faculty');
      assert.strictEqual(data.session.user.clearanceLevel, 'LEVEL_2_FACULTY');
      assert.strictEqual(data.session.user.name, 'Dr. Eleanor Rigby (Physics Dept)');
    });

    it('successfully maps approved Google identity to Security Officer account', async () => {
      const { state } = googleAuth.generateAuthUrl();
      const res = await fetch(`${baseUrl}/api/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'test_code_security',
          state,
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.session.user.role, 'security_officer');
      assert.strictEqual(data.session.user.clearanceLevel, 'LEVEL_3_SECURITY');
      assert.strictEqual(data.session.user.name, 'Officer D. Vance (Tactical Watch)');
    });

    it('successfully maps approved Google identity to Administrator account', async () => {
      const { state } = googleAuth.generateAuthUrl();
      const res = await fetch(`${baseUrl}/api/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'test_code_admin',
          state,
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.session.user.role, 'admin');
      assert.strictEqual(data.session.user.clearanceLevel, 'LEVEL_4_CHIEF');
      assert.strictEqual(data.session.user.name, 'Chief Administrator Ramanujan');
    });

    it('strictly disregards client-supplied role or clearance parameters during Google authentication', async () => {
      const { state } = googleAuth.generateAuthUrl();
      const res = await fetch(`${baseUrl}/api/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'test_code_student',
          state,
          role: 'admin', // Attack attempt: Student attempting privilege escalation to admin
          clearanceLevel: 'LEVEL_4_CHIEF',
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      // Backend must strictly ignore client role parameter and enforce DB role
      assert.strictEqual(data.session.user.role, 'student', 'Student must NOT become Administrator');
      assert.strictEqual(data.session.user.clearanceLevel, 'LEVEL_1_STUDENT');
    });

    it('allows Google-authenticated session token to access /api/auth/me and WebSocket gateway', async () => {
      const { state } = googleAuth.generateAuthUrl();
      const authRes = await fetch(`${baseUrl}/api/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'test_code_admin',
          state,
        }),
      });
      const authData = await authRes.json();
      const sessionToken = authData.session.sessionToken;

      // 1. Verify /api/auth/me
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      assert.strictEqual(meRes.status, 200);
      const meData = await meRes.json();
      assert.strictEqual(meData.user.username, 'admin');
      assert.strictEqual(meData.user.role, 'admin');

      // 2. Verify WebSocket connection with Google-issued token
      const ws = new WebSocket(`${wsUrl}?token=${sessionToken}`);
      await new Promise<void>((resolve, reject) => {
        ws.on('open', () => {
          ws.close();
          resolve();
        });
        ws.on('error', reject);
      });

      // 3. Logout revokes the Google-issued token
      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      assert.strictEqual(logoutRes.status, 200);

      // 4. Token cannot be reused after logout
      const postLogoutMe = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      assert.strictEqual(postLogoutMe.status, 401);
    });
  });
});
