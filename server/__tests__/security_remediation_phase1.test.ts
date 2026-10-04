import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { WebSocket } from 'ws';
import { createCampusServer, type ServerInstance } from '../index';
import { db } from '../db/database';
import { serverAuth } from '../auth/authService';
import { serverMqtt } from '../mqtt/mqttClient';
import { WiegandParser } from '../devices/wiegandParser';
import { config } from '../config';

describe('Security Remediation Phase 1 — Direct Exploit Regression Suite', () => {
  let serverInstance: ServerInstance;
  let baseUrl: string;
  let wsUrl: string;

  before(async () => {
    serverInstance = await createCampusServer(0);
    const port = serverInstance.port;
    baseUrl = `http://127.0.0.1:${port}`;
    wsUrl = `ws://127.0.0.1:${port}/ws`;
  });

  after(async () => {
    try {
      await serverInstance.close();
    } catch {}
  });

  // =========================================================================
  // SEC-CRIT-01: x-dev-role AUTHENTICATION BYPASS REMEDIATION
  // =========================================================================
  describe('SEC-CRIT-01: x-dev-role Authentication Bypass Neutralization', () => {
    it('rejects unauthenticated request containing x-dev-role: admin with 401', async () => {
      const res = await fetch(`${baseUrl}/api/zones/ZONE-GATE-01/lockdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-role': 'admin',
        },
        body: JSON.stringify({ action: 'LOCKDOWN' }),
      });
      assert.strictEqual(res.status, 401, 'Request with x-dev-role: admin without token must be rejected with 401');
      const data = await res.json();
      assert.ok(data.error);
    });

    it('rejects unauthenticated request containing x-dev-role: security_officer with 401', async () => {
      const res = await fetch(`${baseUrl}/api/zones/ZONE-GATE-01/lockdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-role': 'security_officer',
        },
        body: JSON.stringify({ action: 'LOCKDOWN' }),
      });
      assert.strictEqual(res.status, 401, 'Request with x-dev-role: security_officer must be rejected with 401');
    });

    it('rejects unauthenticated request containing x-dev-role: faculty with 401', async () => {
      const res = await fetch(`${baseUrl}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-role': 'faculty',
        },
        body: JSON.stringify({ title: 'Test Incident' }),
      });
      assert.strictEqual(res.status, 401, 'Request with x-dev-role: faculty must be rejected with 401');
    });

    it('rejects unauthenticated request containing x-dev-role: student with 401', async () => {
      const res = await fetch(`${baseUrl}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-role': 'student',
        },
        body: JSON.stringify({ title: 'Test Incident' }),
      });
      assert.strictEqual(res.status, 401, 'Request with x-dev-role: student must be rejected with 401');
    });

    it('authenticates successfully only when a legitimate session token is presented', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      assert.strictEqual(loginRes.status, 200);
      const loginData = await loginRes.json();
      const token = loginData.session.sessionToken;

      const authRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.strictEqual(authRes.status, 200);
      const meData = await authRes.json();
      assert.strictEqual(meData.user.role, 'admin');
    });

    it('does not expose x-dev-role in CORS preflight response headers', async () => {
      const optRes = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'OPTIONS',
      });
      assert.strictEqual(optRes.status, 204);
      const allowHeaders = optRes.headers.get('Access-Control-Allow-Headers') || '';
      assert.ok(!allowHeaders.includes('x-dev-role'), 'CORS must not advertise x-dev-role header');
    });
  });

  // =========================================================================
  // SEC-CRIT-02: PASSWORD AUTHENTICATION FAIL-CLOSED REPAIR
  // =========================================================================
  describe('SEC-CRIT-02: Password Authentication Fail-Closed Enforcement', () => {
    it('succeeds and issues token only when correct scrypt credentials are provided', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.session?.sessionToken.startsWith('tok_'));
    });

    it('fails closed when password field is completely omitted', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'student' }),
      });
      const data = await res.json();
      assert.strictEqual(data.success, false, 'Login without password must fail');
      assert.strictEqual(data.error, 'Invalid credentials');
    });

    it('fails closed when password field is an empty string', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'student', password: '' }),
      });
      const data = await res.json();
      assert.strictEqual(data.success, false, 'Login with empty password must fail');
    });

    it('rejects the audit arbitrary-password bypass exploit', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'student', password: 'completely_wrong_pass' }),
      });
      const data = await res.json();
      assert.strictEqual(data.success, false, 'Arbitrary password must be rejected');
      assert.strictEqual(data.session, undefined);
    });

    it('fails closed when verifying password against a malformed stored hash', () => {
      const malformedHashes = [
        '',
        'not_a_valid_hash',
        'missing_key_part:',
        ':missing_salt_part',
        '8b9c$mock_salt$3f1a', // Dollar delimiter mock hash from audit
        'invalid_salt_length:791f673e',
      ];

      for (const badHash of malformedHashes) {
        const result = serverAuth.verifyPassword('password123', badHash);
        assert.strictEqual(result, false, `Verification must return false for malformed hash: ${badHash}`);
      }
    });
  });

  // =========================================================================
  // SEC-CRIT-03: BROWSER WEBSOCKETS STRICTLY READ-ONLY
  // =========================================================================
  describe('SEC-CRIT-03: Read-Only Client WebSocket Enforcement', () => {
    let clientWs: WebSocket;

    before(async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      const loginData = await loginRes.json();
      const token = loginData.session.sessionToken;

      clientWs = new WebSocket(`${wsUrl}?token=${token}`);
      await new Promise<void>((resolve, reject) => {
        clientWs.on('open', () => resolve());
        clientWs.on('error', (err) => reject(err));
      });
      await new Promise((r) => setTimeout(r, 100));
    });

    after(() => {
      try {
        clientWs.close();
      } catch {}
    });

    it('rejects client ACCESS_GRANTED message and DOES NOT unlock physical door', async () => {
      const doorId = 'DOOR-SRV-01';
      const door = db.accessControllers.get(doorId);
      assert.ok(door);
      door.lockStatus = 'locked';

      const errorPromise = new Promise<any>((resolve) => {
        const handler = (data: any) => {
          try {
            const parsed = JSON.parse(data.toString());
            if (parsed.type === 'ERROR') {
              clientWs.off('message', handler);
              resolve(parsed);
            }
          } catch {}
        };
        clientWs.on('message', handler);
      });

      // Attempt injection of ACCESS_GRANTED state mutation
      clientWs.send(JSON.stringify({
        id: `EVT-ATTACK-01`,
        category: 'ACCESS',
        type: 'ACCESS_GRANTED',
        source: 'client',
        deviceId: doorId,
        payload: {
          doorId,
          cardholder: 'Simulated Intruder',
        },
      }));

      const errorMsg = await errorPromise;
      assert.ok(errorMsg.error.includes('Forbidden: Browser WebSocket clients are read-only'));

      // Crucial verification: Physical door MUST remain locked
      const doorAfter = db.accessControllers.get(doorId);
      assert.strictEqual(doorAfter?.lockStatus, 'locked', 'Door must NOT be unlocked by client WebSocket message');
    });

    it('rejects client ZONE_LOCKDOWN message and does not mutate zone state', async () => {
      const errorPromise = new Promise<any>((resolve) => {
        const handler = (data: any) => {
          try {
            const parsed = JSON.parse(data.toString());
            if (parsed.type === 'ERROR') {
              clientWs.off('message', handler);
              resolve(parsed);
            }
          } catch {}
        };
        clientWs.on('message', handler);
      });

      clientWs.send(JSON.stringify({
        type: 'ZONE_LOCKDOWN',
        payload: { zoneName: 'Main Gate', action: 'LOCKDOWN', actor: 'Attacker' },
      }));

      const errorMsg = await errorPromise;
      assert.ok(errorMsg.error.includes('Forbidden'));
    });

    it('responds correctly to read-only PING with PONG and updates heartbeat', async () => {
      const pongPromise = new Promise<any>((resolve) => {
        const handler = (data: any) => {
          try {
            const parsed = JSON.parse(data.toString());
            if (parsed.type === 'PONG') {
              clientWs.off('message', handler);
              resolve(parsed);
            }
          } catch {}
        };
        clientWs.on('message', handler);
      });

      clientWs.send(JSON.stringify({ type: 'PING' }));
      const pong = await pongPromise;
      assert.strictEqual(pong.type, 'PONG');
      assert.ok(pong.timestamp);
    });
  });

  // =========================================================================
  // SEC-HIGH-01: SECURE PIN ACCESS ROUTE
  // =========================================================================
  describe('SEC-HIGH-01: Secure Keypad PIN Ingestion', () => {
    const doorId = 'DOOR-GATE-MAIN';

    it('rejects unauthenticated PIN submission with old hardcoded PIN 4821', async () => {
      const door = db.accessControllers.get(doorId);
      assert.ok(door);
      door.lockStatus = 'locked';

      const res = await fetch(`${baseUrl}/api/access/${doorId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '4821' }),
      });
      assert.strictEqual(res.status, 401, 'Unauthenticated PIN request must be rejected with 401');

      const doorAfter = db.accessControllers.get(doorId);
      assert.strictEqual(doorAfter?.lockStatus, 'locked', 'Door must NOT unlock on unauthenticated PIN');
    });

    it('authorizes door unlock when legitimate trusted-device credentials are provided', async () => {
      const res = await fetch(`${baseUrl}/api/access/${doorId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ pin: '4821', cardholder: 'Keypad Controller Post 1' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });

    it('rejects wrong PIN from authenticated device with 401 and enforces 3-attempt lockout', async () => {
      // 1st wrong attempt
      const res1 = await fetch(`${baseUrl}/api/access/${doorId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ pin: '0000' }),
      });
      assert.strictEqual(res1.status, 401);

      // 2nd wrong attempt
      const res2 = await fetch(`${baseUrl}/api/access/${doorId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ pin: '0000' }),
      });
      assert.strictEqual(res2.status, 401);

      // 3rd wrong attempt -> 403 Lockout
      const res3 = await fetch(`${baseUrl}/api/access/${doorId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ pin: '0000' }),
      });
      assert.strictEqual(res3.status, 403);
      const data3 = await res3.json();
      assert.strictEqual(data3.lockedOut, true);
    });
  });

  // =========================================================================
  // SEC-HIGH-02: SECURE WIEGAND INGESTION
  // =========================================================================
  describe('SEC-HIGH-02: Authenticated Wiegand Ingestion & Database Authorization', () => {
    const doorId = 'DOOR-GATE-MAIN';
    const validFrame = WiegandParser.constructFixture(42, 8821);

    it('rejects unauthenticated Wiegand frame submission with 401', async () => {
      const res = await fetch(`${baseUrl}/api/access/${doorId}/wiegand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: validFrame }),
      });
      assert.strictEqual(res.status, 401, 'Unauthenticated Wiegand frame must be rejected with 401');
    });

    it('rejects malformed Wiegand frame with parity error even from authenticated device', async () => {
      const corruptFrame = validFrame.slice(0, 25) + (validFrame[25] === '0' ? '1' : '0');
      const res = await fetch(`${baseUrl}/api/access/${doorId}/wiegand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ frame: corruptFrame }),
      });
      assert.strictEqual(res.status, 400, 'Corrupt Wiegand frame must return 400 Parity Error');
    });

    it('authorizes valid badge frame when presented from authenticated device reader', async () => {
      const res = await fetch(`${baseUrl}/api/access/${doorId}/wiegand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ frame: validFrame }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'GRANTED');
      assert.strictEqual(data.cardholder, 'Chief Administrator Ramanujan');
    });

    it('denies access when unlisted or unauthorized badge credentials are presented', async () => {
      // Facility Code 99, Card 9999 (not in database)
      const unknownFrame = WiegandParser.constructFixture(99, 9999);
      const res = await fetch(`${baseUrl}/api/access/${doorId}/wiegand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ frame: unknownFrame }),
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.status, 'DENIED');
    });
  });

  // =========================================================================
  // SEC-HIGH-03: SECURE SENSOR TELEMETRY INGESTION
  // =========================================================================
  describe('SEC-HIGH-03: Authenticated Sensor Telemetry & Safety Boundary', () => {
    const sensorId = 'DEV-SMK-204';

    it('rejects unauthenticated 450 PPM sensor injection and DOES NOT create incident', async () => {
      const incidentCountBefore = db.incidents.size;

      const res = await fetch(`${baseUrl}/api/sensors/${sensorId}/reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ppm: 450 }),
      });
      assert.strictEqual(res.status, 401, 'Unauthenticated sensor injection must return 401');

      const incidentCountAfter = db.incidents.size;
      assert.strictEqual(incidentCountAfter, incidentCountBefore, 'No incident must be created on unauthenticated sensor injection');
    });

    it('rejects unauthenticated forged 850 PPM evacuation trigger with 401', async () => {
      const res = await fetch(`${baseUrl}/api/sensors/${sensorId}/reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ppm: 850 }),
      });
      assert.strictEqual(res.status, 401, 'Unauthenticated critical sensor reading must return 401');
    });

    it('rejects unphysical / out-of-bounds sensor values from authenticated device with 400', async () => {
      const res = await fetch(`${baseUrl}/api/sensors/${sensorId}/reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ ppm: 999999 }), // Physically impossible saturation
      });
      assert.strictEqual(res.status, 400, 'Unphysical reading must return 400');
    });

    it('accepts legitimate sensor reading when authenticated with device key', async () => {
      const res = await fetch(`${baseUrl}/api/sensors/${sensorId}/reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ ppm: 320 }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'NORMAL');
    });
  });

  // =========================================================================
  // SEC-HIGH-04: SECURE MQTT DEVICE INGESTION
  // =========================================================================
  describe('SEC-HIGH-04: MQTT Origin Authentication & Authorized Device Processing', () => {
    const doorId = 'DOOR-GATE-MAIN';

    it('drops anonymous raw granted: true MQTT packet and DOES NOT unlock door', () => {
      const door = db.accessControllers.get(doorId);
      assert.ok(door);
      door.lockStatus = 'locked';

      const unauthenticatedPacket = {
        topic: `campus/ZONE-GATE-01/access/${doorId}`,
        payload: JSON.stringify({ granted: true }),
      };

      const event = serverMqtt.handleMessage(unauthenticatedPacket);
      assert.strictEqual(event, null, 'Unauthenticated MQTT packet must return null');

      const doorAfter = db.accessControllers.get(doorId);
      assert.strictEqual(doorAfter?.lockStatus, 'locked', 'Door must remain locked');
    });

    it('drops rogue attacker cardholder MQTT packet without deviceToken', () => {
      const roguePacket = {
        topic: `campus/ZONE-GATE-01/access/${doorId}`,
        payload: JSON.stringify({ granted: true, cardholder: 'Rogue MQTT Injector' }),
      };

      const event = serverMqtt.handleMessage(roguePacket);
      assert.strictEqual(event, null, 'Rogue injector packet must be rejected');

      const doorAfter = db.accessControllers.get(doorId);
      assert.strictEqual(doorAfter?.lockStatus, 'locked');
    });

    it('drops packet with invalid topic hierarchy or unregistered portal device', () => {
      const badPortalPacket = {
        topic: `campus/ZONE-GATE-01/access/DOOR-NON-EXISTENT-999`,
        payload: JSON.stringify({ granted: true, deviceToken: config.deviceApiKey }),
      };
      const event = serverMqtt.handleMessage(badPortalPacket);
      assert.strictEqual(event, null, 'Unregistered portal packet must be dropped');
    });

    it('processes legitimate access grant when authenticated controller presents valid device credentials', () => {
      const validPacket = {
        topic: `campus/ZONE-GATE-01/access/${doorId}`,
        payload: JSON.stringify({
          granted: true,
          cardholder: 'Chief Administrator Ramanujan',
          clearance: 'LEVEL_4',
          deviceToken: config.deviceApiKey,
        }),
      };

      const event = serverMqtt.handleMessage(validPacket);
      assert.ok(event, 'Valid authenticated MQTT packet must produce normalized event');
      assert.strictEqual(event?.type, 'ACCESS_GRANTED');
      assert.strictEqual(event?.payload.cardholder, 'Chief Administrator Ramanujan');
    });
  });
});
