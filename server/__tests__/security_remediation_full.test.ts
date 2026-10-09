import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { WebSocket } from 'ws';
import { createCampusServer, type ServerInstance } from '../index';
import { serverAuth } from '../auth/authService';
import { recoveryService } from '../auth/recoveryService';
import { googleAuth } from '../auth/googleAuth';
import { db } from '../db/database';
import { authService } from '../../src/services/authService';
import { persistenceService } from '../../src/services/persistenceService';

describe('Smart Campus Security & Functionality Remediation Full Suite', () => {
  let serverInstance: ServerInstance;
  let baseUrl: string;
  let wsUrl: string;

  before(async () => {
    serverInstance = await createCampusServer(0);
    const port = serverInstance.port;
    baseUrl = `http://127.0.0.1:${port}`;
    wsUrl = `ws://127.0.0.1:${port}/ws`;

    // Ensure test accounts are in unlocked state
    await serverAuth.clearLockout('student');
    await serverAuth.clearLockout('admin');
    await serverAuth.clearLockout('faculty');
    await serverAuth.clearLockout('security');
  });

  after(async () => {
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  // =========================================================================
  // 1. 3-ATTEMPT LOCKOUT & FAILED LOGIN COUNTERS (Phases 3, 4, 12, 14)
  // =========================================================================
  describe('1. 3-Attempt Server-Side Account Lockout & Isolation', () => {
    const targetUser = 'test_lockout_user';

    before(async () => {
      // Seed a temporary test user
      await db.createUser({
        id: 'usr-test-lockout',
        username: targetUser,
        name: 'Lockout Test Subject',
        email: 'lockout@campus.internal',
        role: 'faculty',
        department: 'Testing Dept',
        clearanceLevel: 'LEVEL_2_FACULTY',
        badgeNumber: 'BADGE-TST-001',
        passwordHash: serverAuth.hashPassword('correctPassword123'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        failedLoginAttempts: 0,
      });
    });

    it('increments failed counter on wrong password (attempts 1 and 2)', async () => {
      // Attempt 1
      const res1 = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUser, password: 'wrongPassword1' }),
      });
      assert.strictEqual(res1.status, 401);
      const data1 = await res1.json();
      assert.strictEqual(data1.success, false);
      assert.strictEqual(data1.attempts, 1);
      assert.strictEqual(data1.lockedOut, undefined);

      // Attempt 2
      const res2 = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUser, password: 'wrongPassword2' }),
      });
      assert.strictEqual(res2.status, 401);
      const data2 = await res2.json();
      assert.strictEqual(data2.attempts, 2);
    });

    it('locks account on 3rd consecutive failed attempt with HTTP 423 Locked', async () => {
      // Attempt 3
      const res3 = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUser, password: 'wrongPassword3' }),
      });
      assert.strictEqual(res3.status, 423, '3rd failed attempt must return HTTP 423 Locked');
      const data3 = await res3.json();
      assert.strictEqual(data3.success, false);
      assert.strictEqual(data3.lockedOut, true);
      assert.strictEqual(data3.attempts, 3);
      assert.ok(data3.retryAfterSeconds > 0);
      assert.ok(data3.lockedUntil);
    });

    it('rejects 4th attempt with HTTP 423 even if correct password is provided', async () => {
      const res4 = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUser, password: 'correctPassword123' }),
      });
      assert.strictEqual(res4.status, 423, 'Locked account must reject subsequent login attempts');
      const data4 = await res4.json();
      assert.strictEqual(data4.lockedOut, true);
      assert.ok(data4.retryAfterSeconds > 0);
    });

    it('confirms server-authoritative lockout via /api/auth/lockout-status', async () => {
      const res = await fetch(`${baseUrl}/api/auth/lockout-status?username=${targetUser}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.lockedOut, true);
      assert.ok(data.retryAfterSeconds > 0);
    });

    it('maintains account isolation — locking one user does not lock another', async () => {
      await serverAuth.clearLockout('admin');
      // Test admin login is still functional and not locked
      const resAdmin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      assert.strictEqual(resAdmin.status, 200, 'Admin account must remain functional');
    });

    it('resets failed attempt counter upon successful authentication', async () => {
      // Create user with 1 failed attempt
      const normalUser = 'test_reset_user';
      await db.createUser({
        id: 'usr-test-reset',
        username: normalUser,
        name: 'Reset Test Subject',
        email: 'reset@campus.internal',
        role: 'faculty',
        department: 'Testing Dept',
        clearanceLevel: 'LEVEL_2_FACULTY',
        badgeNumber: 'BADGE-TST-002',
        passwordHash: serverAuth.hashPassword('validPassword999'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        failedLoginAttempts: 0,
      });

      // 1 wrong attempt
      await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalUser, password: 'wrong' }),
      });

      // Then successful attempt
      const successRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalUser, password: 'validPassword999' }),
      });
      assert.strictEqual(successRes.status, 200);

      const dbUser = await db.getUserByUsername(normalUser);
      assert.strictEqual(dbUser?.failedLoginAttempts, 0, 'Failed attempts must be cleared on success');
    });
  });

  // =========================================================================
  // 2. AUDIT LOGGING & NOTIFICATIONS (Phases 4, 5)
  // =========================================================================
  describe('2. Security Notifications & RBAC-Scoped Recipient Filtering', () => {
    it('generates an auditable SECURITY_LOCKOUT record on account lockout', async () => {
      const audits = await db.getAuditRecords(50);
      const lockoutAudit = audits.find((a) => a.action === 'SECURITY_LOCKOUT');
      assert.ok(lockoutAudit, 'SECURITY_LOCKOUT audit record must exist');
      assert.strictEqual(lockoutAudit.result, 'ESCALATED');
      assert.ok(lockoutAudit.details.includes('consecutive failed attempts'));
    });

    it('creates an activity feed record for security notifications', async () => {
      const activities = await db.getActivityEvents(50);
      const lockoutActivity = activities.find((act) => act.event.includes('SECURITY LOCKOUT'));
      assert.ok(lockoutActivity, 'SECURITY_LOCKOUT activity record must exist');
      assert.strictEqual(lockoutActivity.severity, 'critical');
    });

    it('ensures student sessions do not receive privileged security alerts over WebSocket', async () => {
      await serverAuth.clearLockout('student');

      // Connect student WebSocket
      const studentLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'student', password: 'password123' }),
      });
      assert.strictEqual(studentLogin.status, 200);
      const studentSession = await studentLogin.json();
      const studentToken = studentSession.session.sessionToken;

      const ws = new WebSocket(`${wsUrl}?token=${studentToken}`);
      let receivedPrivilegedAlert = false;

      await new Promise<void>((resolve, reject) => {
        ws.on('open', () => resolve());
        ws.on('error', (err) => reject(err));
      });

      ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.event && parsed.event.type === 'SECURITY_LOCKOUT') {
            receivedPrivilegedAlert = true;
          }
        } catch {}
      });

      // Trigger another lockout event
      const isolatedUser = 'lockout_isolated_test';
      await db.createUser({
        id: 'usr-isolated-test',
        username: isolatedUser,
        name: 'Isolated Lockout',
        email: 'isolated@campus.internal',
        role: 'student',
        department: 'Eng',
        clearanceLevel: 'LEVEL_1_STUDENT',
        badgeNumber: 'BADGE-ISO-01',
        passwordHash: serverAuth.hashPassword('pass123'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        failedLoginAttempts: 2,
      });

      // 3rd failure locks it
      await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: isolatedUser, password: 'bad' }),
      });

      await new Promise((r) => setTimeout(r, 100));
      ws.close();

      assert.strictEqual(
        receivedPrivilegedAlert,
        false,
        'Students must not receive privileged SECURITY_LOCKOUT notifications'
      );
    });
  });

  // =========================================================================
  // 3. GOOGLE OAUTH SECURITY & CSRF PROTECTION (Phases 6, 7, 11)
  // =========================================================================
  describe('3. Google Authentication Security & State Verification', () => {
    it('generates secure OAuth URL with CSRF state parameter', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google/url`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      if (data.configured) {
        assert.ok(data.authUrl);
        assert.ok(data.authUrl.includes('state='));
        assert.ok(data.authUrl.includes('response_type=code'));
      } else {
        assert.strictEqual(data.configured, false);
      }
    });

    it('rejects callback with invalid or forged state parameter', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google/callback?code=mock_code&state=forged_state_123`, {
        redirect: 'manual',
      });
      // Should redirect to /login with error query parameter
      const location = res.headers.get('location') || '';
      assert.ok(location.includes('error=invalid_oauth_state') || res.status === 400);
    });

    it('prevents state replay attacks — consumes state on first validation', async () => {
      const { state } = googleAuth.generateAuthUrl();
      assert.ok(state, 'State must be generated');

      const firstValid = googleAuth.validateAndConsumeState(state);
      assert.strictEqual(firstValid, true, 'First state check must succeed');

      const secondValid = googleAuth.validateAndConsumeState(state);
      assert.strictEqual(secondValid, false, 'State cannot be replayed or reused');
    });

    it('rejects Google recovery verification for unlinked accounts (Phase 8)', async () => {
      // Mock Google user with arbitrary email
      const mockGoogleUser = {
        sub: 'google-sub-unlinked-999',
        email: 'attacker@gmail.com',
        email_verified: true,
        name: 'Attacker',
      };

      const result = await recoveryService.verifyGoogleForRecovery('admin', mockGoogleUser, '127.0.0.1');
      assert.strictEqual(result.success, false);
      assert.ok(result.error?.includes('not linked to this Smart Campus account'));
    });
  });

  // =========================================================================
  // 4. PASSWORD RECOVERY & RECOVERY CODES (Phases 8, 9, 10, 12)
  // =========================================================================
  describe('4. Password Recovery & One-Time Pre-Enrolled Recovery Codes', () => {
    it('safely handles recovery request for unlinked account (Phase 8 requirement)', async () => {
      // Create user without Google linking and without recovery codes
      const unlinkedUser = 'test_unlinked_account';
      await db.createUser({
        id: 'usr-unlinked-test',
        username: unlinkedUser,
        name: 'Unlinked Subject',
        email: 'unlinked@campus.internal',
        role: 'student',
        department: 'Eng',
        clearanceLevel: 'LEVEL_1_STUDENT',
        badgeNumber: 'BADGE-UNL-01',
        passwordHash: serverAuth.hashPassword('pass123'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        failedLoginAttempts: 0,
      });

      const res = await fetch(`${baseUrl}/api/auth/recovery/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: unlinkedUser }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.canRecover, false, 'Unlinked account with no recovery codes cannot recover');
    });

    it('identifies pre-enrolled recovery codes for admin account (Phase 9)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/recovery/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'admin' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.hasRecoveryCodes, true);
      assert.strictEqual(data.canRecover, true);
    });

    it('rejects invalid or forged recovery code with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/auth/recovery/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', code: 'RC-FORGED-CODE-999' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes('Invalid'));
    });

    it('accepts valid pre-enrolled recovery code and issues one-time recovery token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/recovery/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', code: 'RC-ADM-SAFE-2026' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.recoveryToken.startsWith('rec_'));
    });

    it('prevents reuse of consumed recovery code (single-use guarantee)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/recovery/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', code: 'RC-ADM-SAFE-2026' }),
      });
      assert.strictEqual(res.status, 400, 'Used recovery code must be rejected on second use');
    });

    it('completes password reset, clears lockout, and revokes active sessions (Phase 10)', async () => {
      await serverAuth.clearLockout('faculty');

      // 1. Establish an active session for faculty
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'faculty', password: 'password123' }),
      });
      assert.strictEqual(loginRes.status, 200);
      const activeSession = await loginRes.json();
      const priorToken = activeSession.session.sessionToken;

      // 2. Verify prior token is valid
      const meResBefore = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${priorToken}` },
      });
      assert.strictEqual(meResBefore.status, 200);

      // 3. Verify recovery code for faculty (RC-FAC-SAFE-2026)
      const codeRes = await fetch(`${baseUrl}/api/auth/recovery/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'faculty', code: 'RC-FAC-SAFE-2026' }),
      });
      assert.strictEqual(codeRes.status, 200);
      const { recoveryToken } = await codeRes.json();

      // 4. Reset password
      const resetRes = await fetch(`${baseUrl}/api/auth/recovery/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryToken, newPassword: 'NewFacultyPass2026!' }),
      });
      assert.strictEqual(resetRes.status, 200);
      const resetData = await resetRes.json();
      assert.strictEqual(resetData.success, true);

      // 5. Verify prior session is now revoked (HTTP 401)
      const meResAfter = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${priorToken}` },
      });
      assert.strictEqual(meResAfter.status, 401, 'All prior sessions must be revoked after password reset');

      // 6. Verify login with new password succeeds
      const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'faculty', password: 'NewFacultyPass2026!' }),
      });
      assert.strictEqual(newLoginRes.status, 200, 'Login with new passkey must succeed');

      // 7. Verify recovery token cannot be reused
      const replayResetRes = await fetch(`${baseUrl}/api/auth/recovery/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryToken, newPassword: 'AnotherPassword999!' }),
      });
      assert.strictEqual(replayResetRes.status, 400, 'Recovery token cannot be reused');
    });
  });

  // =========================================================================
  // 5. SURVEILLANCE DETERMINISTIC FEEDS & CONTROLS (Phases 2, 15)
  // =========================================================================
  describe('5. Surveillance System Telemetry & Control Integrity', () => {
    let adminToken: string;

    before(async () => {
      await serverAuth.clearLockout('admin');
      const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      const data = await adminLogin.json();
      adminToken = data.session.sessionToken;
    });

    it('verifies all 7 registered campus cameras have deterministic configurations', async () => {
      const res = await fetch(`${baseUrl}/api/cameras`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const cameras = await res.json();
      assert.ok(Array.isArray(cameras));
      assert.ok(cameras.length >= 7, 'Must register at least 7 primary cameras');

      const expectedCameraSubstrings = [
        'Gate Access',
        'Robotics Bay',
        'Library',
        'Science Wing',
        'Hallway',
        'Computer Lab',
        'Server Vault',
      ];

      for (const expected of expectedCameraSubstrings) {
        const found = cameras.find((c: any) => c.name.toLowerCase().includes(expected.toLowerCase()));
        assert.ok(found, `Camera feed matching '${expected}' must be present in camera registry`);
        assert.ok(found.id, `Camera '${expected}' must have an ID`);
        assert.ok(found.zone, `Camera '${expected}' must have an assigned spatial zone`);
        assert.ok(found.status, `Camera '${expected}' must report valid status`);
      }
    });

    it('requires appropriate role authorization to mark incidents on camera feeds', async () => {
      await serverAuth.clearLockout('student');

      // Login as student
      const studentLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'student', password: 'password123' }),
      });
      const studentSession = await studentLogin.json();

      // Attempt to mark incident as student
      const resStudent = await fetch(`${baseUrl}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentSession.session.sessionToken}`,
        },
        body: JSON.stringify({
          title: 'Unauthorized Student Marker',
          severity: 'critical',
          location: 'Innovation & Robotics Lab',
        }),
      });
      assert.strictEqual(resStudent.status, 403, 'Students must not have authority to create security incidents');

      // Login as security officer
      await serverAuth.clearLockout('security');
      const secLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'security', password: 'password123' }),
      });
      const secSession = await secLogin.json();

      // Mark incident as security officer
      const resSec = await fetch(`${baseUrl}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secSession.session.sessionToken}`,
        },
        body: JSON.stringify({
          title: 'Camera 02 Visual Anomaly Marker',
          severity: 'medium',
          location: 'Innovation & Robotics Lab',
        }),
      });
      assert.strictEqual(resSec.status, 201, 'Authorized staff must be able to log incidents');
    });
  });

  // =========================================================================
  // 6. SESSION VALIDATION FAIL-CLOSED & NEUTRAL IDENTITY (Phases 3, 5)
  // =========================================================================
  describe('6. Session Validation Fail-Closed & Neutral Identity', () => {
    it('valid server session verifies successfully and sets authenticated state', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      const data = await loginRes.json();
      const token = data.session.sessionToken;

      persistenceService.saveSessionToken(token);

      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          let url = typeof input === 'string' ? input : input.toString();
          if (url.startsWith('/api/')) {
            url = `${baseUrl}${url}`;
          }
          return originalFetch(url, init);
        };

        const result = await authService.validateServerSession();
        assert.strictEqual(result.authenticated, true);
        assert.strictEqual(result.user?.role, 'admin');
        assert.strictEqual(authService.isAuthenticated(), true);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('revoked server session fails closed and purges client session', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      const data = await loginRes.json();
      const token = data.session.sessionToken;

      persistenceService.saveSessionToken(token);

      // Revoke on server
      await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          let url = typeof input === 'string' ? input : input.toString();
          if (url.startsWith('/api/')) {
            url = `${baseUrl}${url}`;
          }
          return originalFetch(url, init);
        };

        const result = await authService.validateServerSession();
        assert.strictEqual(result.authenticated, false, 'Revoked session must fail closed');
        assert.strictEqual(persistenceService.loadSessionToken(), null, 'Revoked session must be purged from storage');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('invalid or forged token fails closed and purges client session', async () => {
      persistenceService.saveSessionToken('forged_invalid_token_9999');

      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          let url = typeof input === 'string' ? input : input.toString();
          if (url.startsWith('/api/')) {
            url = `${baseUrl}${url}`;
          }
          return originalFetch(url, init);
        };

        const result = await authService.validateServerSession();
        assert.strictEqual(result.authenticated, false);
        assert.strictEqual(persistenceService.loadSessionToken(), null);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('network failure / security gateway unavailable FAILS CLOSED without granting access', async () => {
      persistenceService.saveSessionToken('tok_cached_local_token_abc');

      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async () => {
          throw new Error('ECONNREFUSED: Security Gateway Unreachable');
        };

        const result = await authService.validateServerSession();
        assert.strictEqual(result.authenticated, false, 'Network failure must NEVER trust cached token');
        assert.strictEqual(result.gatewayUnavailable, true, 'Must report gatewayUnavailable');
        assert.strictEqual(persistenceService.loadSessionToken(), null, 'Session must be purged');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('clearLocalSession guarantees neutral unauthenticated identity with zero real user leakage', () => {
      authService.clearLocalSession();
      const user = authService.getCurrentUser();

      assert.strictEqual(user.id, 'usr-unauthenticated');
      assert.strictEqual(user.name, 'Unauthenticated User');
      assert.strictEqual(user.username, undefined, 'username must be undefined');
      assert.strictEqual(user.email, undefined, 'email must be undefined');
      assert.strictEqual(user.badgeNumber, 'NONE', 'badgeNumber must be NONE');
      assert.strictEqual(user.department, 'Unauthenticated Access');
      assert.strictEqual(persistenceService.loadSessionToken(), null);
    });

    it('client role manipulation in localStorage cannot escalate server authorization', async () => {
      // 1. Unauthenticated tampering
      persistenceService.saveUserRole('admin');
      persistenceService.clearSessionToken();

      const resUnauth = await fetch(`${baseUrl}/api/state`, {
        headers: { 'Content-Type': 'application/json' },
      });
      assert.strictEqual(resUnauth.status, 401, 'Tampered client role cannot bypass server authentication');

      // 2. Student authenticated session tampering
      await serverAuth.clearLockout('student');
      const studentLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'student', password: 'password123' }),
      });
      const studentData = await studentLogin.json();
      const studentToken = studentData.session.sessionToken;

      // Tamper client storage to 'admin'
      persistenceService.saveUserRole('admin');

      // Attempt privileged incident creation
      const resPrivileged = await fetch(`${baseUrl}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          title: 'Escalation Probe',
          severity: 'critical',
          location: 'Main Gate',
        }),
      });
      assert.strictEqual(resPrivileged.status, 403, 'Server-authoritative RBAC must block student token even if client role is tampered to admin');
    });
  });

  // =========================================================================
  // 7. LOCKOUT AUDITING & COMPREHENSIVE SECURITY RECORDS (Phase 8)
  // =========================================================================
  describe('7. Lockout Auditing & Comprehensive Security Records', () => {
    it('generates AUTH_FAILED audit record on failed login attempt', async () => {
      await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'audit_test_user', password: 'wrongPassword!' }),
      });

      const audits = await db.getAuditRecords(50);
      const failAudit = audits.find((a) => a.action === 'AUTH_FAILED' || a.action === 'LOGIN_FAILURE');
      assert.ok(failAudit, 'AUTH_FAILED / LOGIN_FAILURE record must exist');
      assert.strictEqual(failAudit.result, 'DENIED');
      assert.ok(!failAudit.details.includes('wrongPassword!'), 'Password must never be logged');
    });

    it('generates AUTH_LOCKOUT_TRIGGERED and AUTH_LOCKOUT_BLOCKED_ATTEMPT records', async () => {
      const lockUser = 'audit_lockout_subject';
      await db.createUser({
        id: 'usr-audit-lock',
        username: lockUser,
        name: 'Audit Lock Subject',
        email: 'auditlock@campus.internal',
        role: 'student',
        department: 'Eng',
        clearanceLevel: 'LEVEL_1_STUDENT',
        badgeNumber: 'BADGE-AUD-01',
        passwordHash: serverAuth.hashPassword('pass123'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        failedLoginAttempts: 0,
      });

      for (let i = 0; i < 3; i++) {
        await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: lockUser, password: 'bad' }),
        });
      }

      await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: lockUser, password: 'bad' }),
      });

      const audits = await db.getAuditRecords(50);
      const triggeredAudit = audits.find(
        (a) => (a.action === 'AUTH_LOCKOUT_TRIGGERED' || a.action === 'SECURITY_LOCKOUT') && a.actor === lockUser
      );
      assert.ok(triggeredAudit, 'AUTH_LOCKOUT_TRIGGERED audit must exist');

      const blockedAudit = audits.find(
        (a) => (a.action === 'AUTH_LOCKOUT_BLOCKED_ATTEMPT' || a.result === 'LOCKED') && a.actor === lockUser
      );
      assert.ok(blockedAudit, 'AUTH_LOCKOUT_BLOCKED_ATTEMPT audit must exist');
    });

    it('generates AUTH_SUCCESS record on valid authentication', async () => {
      await serverAuth.clearLockout('admin');
      await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });

      const audits = await db.getAuditRecords(50);
      const successAudit = audits.find((a) => a.action === 'AUTH_SUCCESS' || a.action === 'USER_LOGIN');
      assert.ok(successAudit, 'AUTH_SUCCESS / USER_LOGIN record must exist');
      assert.strictEqual(successAudit.result, 'SUCCESS');
    });
  });

  // =========================================================================
  // 8. LOCKOUT STATUS ANTI-ENUMERATION & RATE LIMITING (Phase 9)
  // =========================================================================
  describe('8. Lockout Status Anti-Enumeration & Rate Limiting', () => {
    it('returns identical normalized response for non-existent vs unlocked accounts (anti-enumeration)', async () => {
      const resNonExistent = await fetch(`${baseUrl}/api/auth/lockout-status?username=ghost_user_${Date.now()}`);
      assert.strictEqual(resNonExistent.status, 200);
      const dataNonExistent = await resNonExistent.json();

      const resExisting = await fetch(`${baseUrl}/api/auth/lockout-status?username=student`);
      assert.strictEqual(resExisting.status, 200);
      const dataExisting = await resExisting.json();

      assert.deepStrictEqual(dataNonExistent, dataExisting, 'Responses must be identical to prevent account enumeration');
      assert.strictEqual(dataNonExistent.lockedOut, false);
      assert.strictEqual(dataNonExistent.retryAfterSeconds, 0);
    });

    it('enforces rate limit on lockout-status endpoint', async () => {
      let rateLimited = false;
      for (let i = 0; i < 70; i++) {
        const res = await fetch(`${baseUrl}/api/auth/lockout-status?username=ratelimit_probe_${i}`);
        if (res.status === 429) {
          rateLimited = true;
          break;
        }
      }
      assert.strictEqual(rateLimited, true, 'Endpoint must enforce rate limiting with HTTP 429');
    });
  });
});
