import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocket } from 'ws';
import { createCampusServer, type ServerInstance } from '../index';
import { serverAuth } from '../auth/authService';
import { config, validateProductionConfig, INSECURE_FALLBACK_SECRETS } from '../config';
import { authService } from '../../src/services/authService';

describe('Security Remediation Phase 2 — Remaining Audit Findings Regression Suite', () => {
  let serverInstance: ServerInstance;
  let baseUrl: string;
  let wsUrl: string;
  let adminToken: string;
  let studentToken: string;

  before(async () => {
    serverInstance = await createCampusServer(0);
    const port = serverInstance.port;
    baseUrl = `http://127.0.0.1:${port}`;
    wsUrl = `ws://127.0.0.1:${port}/ws`;

    // Setup valid sessions
    const adminLogin = await serverAuth.login('admin', 'password123');
    assert.strictEqual(adminLogin.success, true);
    adminToken = adminLogin.session!.sessionToken;

    const studentLogin = await serverAuth.login('student', 'password123');
    assert.strictEqual(studentLogin.success, true);
    studentToken = studentLogin.session!.sessionToken;
  });

  after(async () => {
    if (serverInstance) {
      await serverInstance.close();
    }
  });

  // =========================================================================
  // 1. SEC-MED-01: UNAUTHENTICATED TOPOLOGY & STATE INFORMATION DISCLOSURE
  // =========================================================================
  describe('SEC-MED-01: Information Disclosure Prevention across Topology Endpoints', () => {
    const protectedGetEndpoints = [
      { path: '/api/state', label: 'Global State Snapshot' },
      { path: '/api/zones', label: 'Campus Zones Topology' },
      { path: '/api/devices', label: 'Device Registry Catalog' },
      { path: '/api/devices/DEV-PIR-101', label: 'Specific Device Detail' },
      { path: '/api/cameras', label: 'CCTV Camera Stream Metadata' },
      { path: '/api/sensors', label: 'Sensor Network Catalog' },
      { path: '/api/access', label: 'Access Controller Portals' },
      { path: '/api/incidents', label: 'Incident Audit Trail' },
    ];

    for (const ep of protectedGetEndpoints) {
      it(`rejects unauthenticated ${ep.label} (${ep.path}) with HTTP 401`, async () => {
        const res = await fetch(`${baseUrl}${ep.path}`);
        assert.strictEqual(res.status, 401, `Unauthenticated ${ep.path} must return 401`);
        const body = await res.json();
        assert.strictEqual(body.success, false);
        assert.ok(body.error.includes('Unauthorized'));
      });
    }

    it('permits authenticated operator to retrieve full GET /api/state with verified user identity', async () => {
      const res = await fetch(`${baseUrl}/api/state`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.timestamp);
      assert.strictEqual(data.user.role, 'admin');
      assert.strictEqual(data.user.name, 'Chief Administrator Ramanujan');
      assert.ok(Array.isArray(data.zones));
      assert.ok(Array.isArray(data.devices));
      assert.ok(Array.isArray(data.cameras));
      assert.ok(Array.isArray(data.incidents));
    });

    it('permits authenticated hardware device (x-device-key) to query device inventory', async () => {
      const res = await fetch(`${baseUrl}/api/devices`, {
        headers: { 'x-device-key': config.deviceApiKey },
      });
      assert.strictEqual(res.status, 200);
      const devices = await res.json();
      assert.ok(Array.isArray(devices));
      assert.ok(devices.length >= 8);
    });
  });

  // =========================================================================
  // 2. SEC-MED-02: WILDCARD CORS & CROSS-ORIGIN ATTACK DEFENSE
  // =========================================================================
  describe('SEC-MED-02: Strict CORS Origin Validation & Credential Safety', () => {
    it('rejects preflight OPTIONS from untrusted cross-origin domain with HTTP 403', async () => {
      const untrustedOrigin = 'https://malicious-campus-attacker.org';
      const res = await fetch(`${baseUrl}/api/state`, {
        method: 'OPTIONS',
        headers: {
          'Origin': untrustedOrigin,
          'Access-Control-Request-Method': 'GET',
        },
      });
      assert.strictEqual(res.status, 403, 'Preflight from untrusted origin must receive 403 Forbidden');
      assert.strictEqual(res.headers.get('access-control-allow-origin'), null);
    });

    it('does NOT reflect untrusted Origin header on GET requests', async () => {
      const untrustedOrigin = 'https://rogue-script-injector.net';
      const res = await fetch(`${baseUrl}/api/state`, {
        headers: {
          'Origin': untrustedOrigin,
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      assert.strictEqual(res.headers.get('access-control-allow-origin'), null);
    });

    it('authorizes preflight OPTIONS from trusted local dashboard with credentials and Vary header', async () => {
      const trustedOrigin = 'http://localhost:5173';
      const res = await fetch(`${baseUrl}/api/state`, {
        method: 'OPTIONS',
        headers: {
          'Origin': trustedOrigin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Authorization, Content-Type',
        },
      });
      assert.strictEqual(res.status, 204);
      assert.strictEqual(res.headers.get('access-control-allow-origin'), trustedOrigin);
      assert.strictEqual(res.headers.get('access-control-allow-credentials'), 'true');
      assert.strictEqual(res.headers.get('vary'), 'Origin');
    });

    it('never outputs wildcard Access-Control-Allow-Origin: * when credentials or state are requested', async () => {
      const res = await fetch(`${baseUrl}/api/state`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Origin': 'http://localhost:5173',
        },
      });
      assert.notStrictEqual(res.headers.get('access-control-allow-origin'), '*');
      assert.strictEqual(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    });
  });

  // =========================================================================
  // 3. SEC-MED-03: DOCKER CONTAINER SECURITY & NETWORK EXPOSURE
  // =========================================================================
  describe('SEC-MED-03: Container Hardening & Port Exposure Verification', () => {
    it('verifies Dockerfile specifies unprivileged USER node in runner stage', () => {
      const dockerfilePath = path.resolve(process.cwd(), 'Dockerfile');
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');

      assert.ok(dockerfileContent.includes('USER node'), 'Dockerfile must define USER node for non-root execution');
      assert.ok(dockerfileContent.includes('--chown=node:node'), 'File copies must be owned by unprivileged node user');
      assert.ok(!dockerfileContent.includes('USER root\nCMD'), 'Container must not execute as root');
    });

    it('verifies docker-compose.yml runs backend as unprivileged user', () => {
      const composePath = path.resolve(process.cwd(), 'docker-compose.yml');
      const composeContent = fs.readFileSync(composePath, 'utf-8');

      assert.ok(composeContent.includes('user: "1000:1000"'), 'Backend service must declare unprivileged UID:GID');
    });

    it('verifies docker-compose.yml does NOT expose PostgreSQL to 0.0.0.0 on the host', () => {
      const composePath = path.resolve(process.cwd(), 'docker-compose.yml');
      const composeContent = fs.readFileSync(composePath, 'utf-8');

      assert.ok(!composeContent.includes('"5432:5432"'), 'PostgreSQL port must NOT be mapped to 0.0.0.0');
      assert.ok(composeContent.includes('"127.0.0.1:5432:5432"'), 'PostgreSQL port must be bound strictly to 127.0.0.1 loopback');
    });

    it('verifies docker-compose.yml restricts internal MQTT and media gateway ports', () => {
      const composePath = path.resolve(process.cwd(), 'docker-compose.yml');
      const composeContent = fs.readFileSync(composePath, 'utf-8');

      assert.ok(!composeContent.includes('"1883:1883"'), 'Unencrypted MQTT 1883 must not bind to 0.0.0.0');
      assert.ok(composeContent.includes('"127.0.0.1:1883:1883"'), 'MQTT 1883 must be restricted to 127.0.0.1');
      assert.ok(composeContent.includes('"127.0.0.1:8554:8554"'), 'RTSP 8554 must be restricted to 127.0.0.1');
    });
  });

  // =========================================================================
  // 4. SEC-MED-04: WEBSOCKET ANONYMOUS UPGRADE FALLBACK ISOLATION
  // =========================================================================
  describe('SEC-MED-04: Anonymous WebSocket Upgrade Fallback Neutralization', () => {
    it('rejects unauthenticated WebSocket upgrade in LIVE mode with HTTP 401', async () => {
      // Temporarily switch realtimeMode to live
      const originalMode = config.realtimeMode;
      config.realtimeMode = 'live';

      try {
        let upgradeRejected = false;
        await new Promise<void>((resolve) => {
          const ws = new WebSocket(wsUrl);
          ws.on('unexpected-response', (req, res) => {
            if (res.statusCode === 401) {
              upgradeRejected = true;
            }
            resolve();
          });
          ws.on('open', () => {
            ws.close();
            resolve();
          });
          ws.on('error', () => {
            resolve();
          });
        });

        assert.strictEqual(upgradeRejected, true, 'Unauthenticated WS upgrade in LIVE mode must be rejected with 401');
      } finally {
        config.realtimeMode = originalMode;
      }
    });

    it('rejects unauthenticated WebSocket upgrade in PRODUCTION mode with HTTP 401', async () => {
      const originalEnv = config.environment;
      config.environment = 'production';

      try {
        let upgradeRejected = false;
        await new Promise<void>((resolve) => {
          const ws = new WebSocket(wsUrl);
          ws.on('unexpected-response', (req, res) => {
            if (res.statusCode === 401) {
              upgradeRejected = true;
            }
            resolve();
          });
          ws.on('open', () => {
            ws.close();
            resolve();
          });
          ws.on('error', () => {
            resolve();
          });
        });

        assert.strictEqual(upgradeRejected, true, 'Unauthenticated WS upgrade in PRODUCTION mode must be rejected with 401');
      } finally {
        config.environment = originalEnv;
      }
    });

    it('permits authenticated WebSocket connection with valid session token in LIVE mode', async () => {
      const originalMode = config.realtimeMode;
      config.realtimeMode = 'live';

      try {
        let connectionEstablished = false;
        await new Promise<void>((resolve, reject) => {
          const ws = new WebSocket(`${wsUrl}?token=${adminToken}`);
          ws.on('open', () => {
            connectionEstablished = true;
            ws.close();
            resolve();
          });
          ws.on('error', reject);
        });

        assert.strictEqual(connectionEstablished, true, 'Authenticated token must establish WebSocket connection in LIVE mode');
      } finally {
        config.realtimeMode = originalMode;
      }
    });
  });

  // =========================================================================
  // 5. SEC-LOW-01: FALLBACK SECRETS FAIL-CLOSED VALIDATION
  // =========================================================================
  describe('SEC-LOW-01: Insecure Fallback Secrets Elimination & Fail-Closed Enforcement', () => {
    it('throws SECURITY_CONFIG_VIOLATION when starting in production with default SESSION_SECRET', () => {
      for (const badSecret of INSECURE_FALLBACK_SECRETS) {
        assert.throws(
          () => {
            validateProductionConfig({
              ...config,
              environment: 'production',
              sessionSecret: badSecret,
              deviceApiKey: 'secure-hardware-unique-key-xyz-991',
              corsOrigin: 'https://campus.internal',
            });
          },
          /SECURITY_CONFIG_VIOLATION.*SESSION_SECRET/
        );
      }
    });

    it('throws SECURITY_CONFIG_VIOLATION when starting in LIVE mode with default DEVICE_API_KEY', () => {
      assert.throws(
        () => {
          validateProductionConfig({
            ...config,
            realtimeMode: 'live',
            sessionSecret: 'super-cryptographic-strong-session-secret-2026',
            deviceApiKey: 'campus-sec-device-key-production-8821', // Insecure default
            corsOrigin: 'https://campus.internal',
          });
        },
        /SECURITY_CONFIG_VIOLATION.*DEVICE_API_KEY/
      );
    });

    it('throws SECURITY_CONFIG_VIOLATION when starting in production with wildcard corsOrigin (*)', () => {
      assert.throws(
        () => {
          validateProductionConfig({
            ...config,
            environment: 'production',
            sessionSecret: 'valid-high-entropy-secret-abc-12345',
            deviceApiKey: 'valid-high-entropy-device-key-xyz-67890',
            corsOrigin: '*',
          });
        },
        /SECURITY_CONFIG_VIOLATION.*CORS/i
      );
    });

    it('verifies docker-compose.yml enforces mandatory secret provision via :? expansion', () => {
      const composeContent = fs.readFileSync(path.resolve(process.cwd(), 'docker-compose.yml'), 'utf-8');

      assert.ok(composeContent.includes('${POSTGRES_PASSWORD:?'), 'POSTGRES_PASSWORD must use :? mandatory expansion');
      assert.ok(composeContent.includes('${SESSION_SECRET:?'), 'SESSION_SECRET must use :? mandatory expansion');
      assert.ok(composeContent.includes('${DEVICE_API_KEY:?'), 'DEVICE_API_KEY must use :? mandatory expansion');
    });
  });

  // =========================================================================
  // 6. SEC-LOW-02: LOCALSTORAGE ROLE TAMPERING ISOLATION
  // =========================================================================
  describe('SEC-LOW-02: Client-Side Role Tampering Resistance & Server Authority', () => {
    it('prevents privilege escalation when client modifies local presentation role to admin', async () => {
      // Attacker manipulates presentation role
      const tamperedSession = authService.setUserRole('admin');
      assert.strictEqual(tamperedSession.role, 'admin');

      // However, making backend request with student session token MUST BE FORBIDDEN
      const exploitRes = await fetch(`${baseUrl}/api/zones/ZONE-GATE-01/lockdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentToken}`, // Authenticated as student in backend
        },
        body: JSON.stringify({ action: 'LOCKDOWN' }),
      });

      assert.strictEqual(exploitRes.status, 403, 'Backend must evaluate verified session token role, NOT client presentation role');
      const errBody = await exploitRes.json();
      assert.ok(/clearance/i.test(errBody.error));
    });

    it('rejects unauthenticated request to privileged endpoint even if client claims admin role', async () => {
      const exploitRes = await fetch(`${baseUrl}/api/cameras/CAM-01/ptz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header, only presentation claims
        },
        body: JSON.stringify({ action: 'PAN_LEFT' }),
      });

      assert.strictEqual(exploitRes.status, 401, 'Unauthenticated request must receive 401 regardless of client role claim');
    });

    it('synchronizes presentation role from authoritative server session via syncWithServerSession', () => {
      const serverUser = {
        id: 'USR-FAC-001',
        name: 'Dr. Eleanor Rigby',
        role: 'faculty' as const,
        clearanceLevel: 'LEVEL_2_FACULTY' as const,
      };

      const syncd = authService.syncWithServerSession(serverUser);
      assert.strictEqual(syncd.role, 'faculty');
      assert.strictEqual(syncd.clearanceLevel, 'LEVEL_2_FACULTY');
      assert.strictEqual(authService.can('LOCKDOWN_ZONE'), false);
      assert.strictEqual(authService.can('VIEW_CAMERA'), true);
    });
  });
});
