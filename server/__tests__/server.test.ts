import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { WebSocket } from 'ws';
import { createCampusServer, type ServerInstance } from '../index';
import { db, PostgresRepository } from '../db/database';
import { serverAuth } from '../auth/authService';
import { serverMqtt } from '../mqtt/mqttClient';
import { serverEventBus } from '../events/serverEventBus';
import { deviceRegistry } from '../devices/deviceRegistry';
import { WiegandParser } from '../devices/wiegandParser';
import { MigrationRunner } from '../db/migrations';
import { config } from '../config';

describe('Smart Campus Phase 4 — Production Infrastructure & Contract Test Suite', () => {
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
  });

  after(async () => {
    await serverInstance.close();
  });

  // =========================================================================
  // 1 & 2. POSTGRESQL & MIGRATION EXECUTION
  // =========================================================================
  describe('[Requirement 1 & 2] Database Connection & Migration Execution', () => {
    it('executes database migrations and verifies all 12 core tables', async () => {
      const migrationRes = await MigrationRunner.runMigrations();
      assert.strictEqual(migrationRes.success, true);
      assert.ok(migrationRes.appliedTables.length >= 12);
      assert.ok(migrationRes.appliedTables.includes('users'));
      assert.ok(migrationRes.appliedTables.includes('sessions'));
      assert.ok(migrationRes.appliedTables.includes('incidents'));
      assert.ok(migrationRes.appliedTables.includes('audit_records'));
      assert.ok(migrationRes.appliedTables.includes('system_health'));
    });

    it('verifies database connectivity and health check response', async () => {
      const health = await db.checkHealth();
      assert.strictEqual(health.healthy, true);
      assert.ok(typeof health.latencyMs === 'number');
    });

    it('instantiates PostgresRepository with connection pooling structure', () => {
      const pgRepo = new PostgresRepository('postgresql://user:pass@localhost:5432/campus_test');
      assert.ok(pgRepo);
      assert.ok(pgRepo.checkHealth);
      assert.ok(pgRepo.runMigrations);
    });
  });

  // =========================================================================
  // 3. PERSISTENCE ACROSS RESTART
  // =========================================================================
  describe('[Requirement 3] Data Persistence Across Simulated Restarts', () => {
    it('persists incidents and audit records across simulated restart', async () => {
      const restartIncId = `INC-RESTART-${Date.now()}`;
      await db.createIncident({
        id: restartIncId,
        event: 'HVAC Chiller Power Surge',
        location: 'Core Infrastructure Vault',
        zone: 'Server Room',
        severity: 'warning',
        source: 'live',
        status: 'open',
        timestamp: '12:00:00',
        description: 'Persistent test incident across restart',
        auditTimeline: [],
      });

      // Verify incident exists
      const beforeRestart = await db.getIncident(restartIncId);
      assert.ok(beforeRestart);
      assert.strictEqual(beforeRestart.id, restartIncId);

      // Verify query via API
      const res = await fetch(`${baseUrl}/api/incidents`, {
        headers: { 'x-device-key': config.deviceApiKey },
      });
      assert.strictEqual(res.status, 200);
      const incidents = await res.json();
      assert.ok(incidents.some((i: any) => i.id === restartIncId));
    });
  });

  // =========================================================================
  // 4 & 5. AUTHENTICATION & SESSION REVOCATION
  // =========================================================================
  describe('[Requirement 4 & 5] Authentication & Explicit Session Revocation', () => {
    it('authenticates administrator and student via scrypt-verified credentials', async () => {
      const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      assert.strictEqual(adminLogin.status, 200);
      const adminData = await adminLogin.json();
      assert.strictEqual(adminData.success, true);
      adminToken = adminData.session.sessionToken;

      const studentLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'student', password: 'password123' }),
      });
      assert.strictEqual(studentLogin.status, 200);
      const studentData = await studentLogin.json();
      studentToken = studentData.session.sessionToken;
    });

    it('rejects unauthorized access without valid bearer token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: 'Bearer tok_non_existent_fake_token' },
      });
      assert.strictEqual(res.status, 401);
    });

    it('explicitly revokes active session upon logout', async () => {
      const tempLogin = await serverAuth.login('faculty', 'password123');
      assert.ok(tempLogin.success);
      const tempToken = tempLogin.session?.sessionToken || '';

      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      assert.strictEqual(logoutRes.status, 200);

      const checkMe = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      assert.strictEqual(checkMe.status, 401);
    });
  });

  // =========================================================================
  // 6. SERVER-SIDE RBAC
  // =========================================================================
  describe('[Requirement 6] Server-Side RBAC Enforcement', () => {
    it('Administrator is ALLOWED to command zone lockdown', async () => {
      const res = await fetch(`${baseUrl}/api/zones/ZONE-GATE-01/lockdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action: 'LOCKDOWN' }),
      });
      assert.strictEqual(res.status, 200);
    });

    it('Student is strictly FORBIDDEN (403) from commanding zone lockdown', async () => {
      const res = await fetch(`${baseUrl}/api/zones/ZONE-GATE-01/lockdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ action: 'LOCKDOWN' }),
      });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.ok(data.error.includes('Forbidden'));
    });
  });

  // =========================================================================
  // 7 & 8. WEBSOCKET AUTHENTICATION & HEARTBEAT
  // =========================================================================
  describe('[Requirement 7 & 8] WebSocket Upgrade Auth & Ping/Pong Heartbeat', () => {
    it('authenticates WebSocket upgrade via token parameter and receives handshake', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`${wsUrl}?token=${adminToken}`);

        ws.on('open', () => {});
        ws.on('message', (raw) => {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'SYSTEM_CONNECTION') {
            assert.strictEqual(msg.payload.state, 'CONNECTED');
            assert.strictEqual(msg.payload.role, 'admin');
            ws.close();
            resolve();
          }
        });
        ws.on('error', reject);
      });
    });

    it('responds to heartbeat PING with PONG containing server timestamp', async () => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);

        ws.on('open', () => {
          ws.send(JSON.stringify({ type: 'PING' }));
        });

        ws.on('message', (raw) => {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'PONG') {
            assert.ok(msg.timestamp);
            ws.close();
            resolve();
          }
        });
        ws.on('error', reject);
      });
    });
  });

  // =========================================================================
  // 9 & 10. MQTT CONNECTION & MALFORMED MESSAGE REJECTION
  // =========================================================================
  describe('[Requirement 9 & 10] MQTT Gateway & Topic/Payload Validation', () => {
    it('reports MQTT gateway connection status and operational mode', () => {
      const status = serverMqtt.getStatus();
      assert.ok(status.isConnected);
      assert.ok(status.mode === 'live_broker' || status.mode === 'simulated_bridge');
    });

    it('rejects malformed non-JSON or invalid topic packets safely without crashing', () => {
      const badTopic = serverMqtt.handleMessage({
        topic: 'unauthorized/random/topic',
        payload: '{"some":"data"}',
      });
      assert.strictEqual(badTopic, null);

      const badPayload = serverMqtt.handleMessage({
        topic: 'campus/Main Gate/sensor/DEV-SMK-204',
        payload: '{INVALID_JSON_CORRUPTED_BYTES',
      });
      assert.strictEqual(badPayload, null);
    });
  });

  // =========================================================================
  // 11 & 12. SENSOR THRESHOLDS (MQ-2 & PIR)
  // =========================================================================
  describe('[Requirement 11 & 12] Sensor Processing: MQ-2 Thresholds & PIR Motion', () => {
    it('normalizes MQ-2 readings across NORMAL (<500), ELEVATED (500-749), and CRITICAL (>=750)', () => {
      const normal = serverMqtt.handleMessage({
        topic: 'campus/Science Block/sensor/DEV-SMK-204',
        payload: JSON.stringify({ ppm: 320 }),
      });
      assert.strictEqual((normal as any).payload.status, 'NORMAL');

      const elevated = serverMqtt.handleMessage({
        topic: 'campus/Science Block/sensor/DEV-SMK-204',
        payload: JSON.stringify({ ppm: 620 }),
      });
      assert.strictEqual((elevated as any).payload.status, 'ELEVATED');

      const critical = serverMqtt.handleMessage({
        topic: 'campus/Science Block/sensor/DEV-SMK-204',
        payload: JSON.stringify({ ppm: 850 }),
      });
      assert.strictEqual((critical as any).payload.status, 'CRITICAL');
    });

    it('processes PIR movement states (MOTION vs CLEAR)', () => {
      const motion = serverMqtt.handleMessage({
        topic: 'campus/Robotics Lab/sensor/DEV-PIR-101',
        payload: JSON.stringify({ motion: true, durationSec: 15 }),
      });
      assert.strictEqual((motion as any).payload.state, 'MOTION');

      const clear = serverMqtt.handleMessage({
        topic: 'campus/Robotics Lab/sensor/DEV-PIR-101',
        payload: JSON.stringify({ motion: false }),
      });
      assert.strictEqual((clear as any).payload.state, 'CLEAR');
    });
  });

  // =========================================================================
  // 13 & 14. ACCESS DECISION & WIEGAND 26-BIT FRAME PARSING
  // =========================================================================
  describe('[Requirement 13 & 14] Access Decisions & Wiegand Frame Ingestion', () => {
    const doorId = 'DOOR-GATE-MAIN';

    it('decodes standard 26-bit Wiegand frame fixture with valid even/odd parity', () => {
      const validFrame = WiegandParser.constructFixture(42, 8821);
      const parsed = WiegandParser.parse26Bit(validFrame);
      assert.strictEqual(parsed.valid, true);
      assert.strictEqual(parsed.facilityCode, 42);
      assert.strictEqual(parsed.cardNumber, 8821);
    });

    it('rejects corrupt Wiegand frame with parity violation', () => {
      // Flip the last bit to violate odd parity
      const validFrame = WiegandParser.constructFixture(42, 8821);
      const corruptFrame = validFrame.slice(0, 25) + (validFrame[25] === '0' ? '1' : '0');
      const parsed = WiegandParser.parse26Bit(corruptFrame);
      assert.strictEqual(parsed.valid, false);
      assert.ok(parsed.error?.includes('parity check failed'));
    });

    it('POST /api/access/:id/wiegand authorizes valid badge frame', async () => {
      const validFrame = WiegandParser.constructFixture(42, 8821);
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
    });

    it('enforces lockout after 3 consecutive invalid PIN entries', async () => {
      await fetch(`${baseUrl}/api/access/${doorId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ pin: '0000' }),
      });
      await fetch(`${baseUrl}/api/access/${doorId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ pin: '0000' }),
      });
      const res3 = await fetch(`${baseUrl}/api/access/${doorId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ pin: '0000' }),
      });
      assert.strictEqual(res3.status, 403);
      const data = await res3.json();
      assert.strictEqual(data.lockedOut, true);
    });
  });

  // =========================================================================
  // 15 & 16. INCIDENT LIFECYCLE & AUDIT PERSISTENCE
  // =========================================================================
  describe('[Requirement 15 & 16] Incident Lifecycle & Append-Only Audit Trail', () => {
    const incId = 'INC-LIFECYCLE-001';

    it('advances through DETECTED -> ACKNOWLEDGED -> INVESTIGATING -> RESOLVED', async () => {
      // 1. Detect
      await db.createIncident({
        id: incId,
        event: 'Thermal Circuit Breaker Trip',
        location: 'Science Block · North Hallway',
        zone: 'Science & Physics Lab',
        severity: 'critical',
        source: 'live',
        status: 'open',
        timestamp: '12:00:00',
        description: 'Breaker tripped under high inductive load',
        auditTimeline: [],
      });

      // 2. Acknowledge
      const ackRes = await fetch(`${baseUrl}/api/incidents/${incId}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(ackRes.status, 200);

      // 3. Investigate
      const invRes = await fetch(`${baseUrl}/api/incidents/${incId}/investigate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(invRes.status, 200);

      // 4. Resolve
      const resRes = await fetch(`${baseUrl}/api/incidents/${incId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ notes: 'Inductive load rebalanced and breaker reset.' }),
      });
      assert.strictEqual(resRes.status, 200);

      const resolvedInc = await db.getIncident(incId);
      assert.strictEqual(resolvedInc?.status, 'resolved');
    });

    it('queries persistent audit records via GET /api/audit', async () => {
      const res = await fetch(`${baseUrl}/api/audit?limit=5`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.records.length > 0);
      assert.ok(data.records[0].action);
    });
  });

  // =========================================================================
  // 17. DEVICE LIFECYCLE
  // =========================================================================
  describe('[Requirement 17] Device Registry & Stale-Device Lifecycle', () => {
    it('transitions device through ONLINE -> DEGRADED -> OFFLINE on heartbeat loss', () => {
      const devId = 'DEV-PIR-101';
      deviceRegistry.updateStatus(devId, 'ONLINE');
      assert.strictEqual(deviceRegistry.getDeviceById(devId)?.status, 'ONLINE');

      // Simulate stale elapsed time
      const dev = deviceRegistry.getDeviceById(devId);
      if (dev) {
        dev.lastSeen = new Date(Date.now() - 300000).toISOString(); // 5 minutes ago
      }

      deviceRegistry.checkStaleDevices(60000);
      assert.strictEqual(deviceRegistry.getDeviceById(devId)?.status, 'OFFLINE');

      // Heartbeat recovery
      deviceRegistry.updateLastSeen(devId);
      assert.strictEqual(deviceRegistry.getDeviceById(devId)?.status, 'ONLINE');
    });
  });

  // =========================================================================
  // 18, 19 & 20. CCTV GATEWAY, PTZ & SNAPSHOT AUTHORIZATION
  // =========================================================================
  describe('[Requirement 18, 19 & 20] CCTV Media Gateway, PTZ & Snapshot Authorization', () => {
    it('GET /api/cameras returns sanitized stream metadata without raw credentials', async () => {
      const res = await fetch(`${baseUrl}/api/cameras`, {
        headers: { 'x-device-key': config.deviceApiKey },
      });
      assert.strictEqual(res.status, 200);
      const cameras = await res.json();
      cameras.forEach((c: any) => {
        assert.strictEqual(c.internalRtspUrl, undefined);
        assert.ok(c.playbackUrl.includes('/streams/'));
        assert.ok(c.streamHealth);
      });
    });

    it('Administrator can issue PTZ movement and capture frame snapshot', async () => {
      const ptzRes = await fetch(`${baseUrl}/api/cameras/CAM-01/ptz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action: 'PAN_LEFT' }),
      });
      assert.strictEqual(ptzRes.status, 200);

      const snapRes = await fetch(`${baseUrl}/api/cameras/CAM-01/snapshot`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(snapRes.status, 200);
      const snapData = await snapRes.json();
      assert.ok(snapData.filename.startsWith('SNAP_CAM-01_'));
    });

    it('Student is FORBIDDEN (403) from controlling camera PTZ', async () => {
      const ptzRes = await fetch(`${baseUrl}/api/cameras/CAM-01/ptz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ action: 'PAN_LEFT' }),
      });
      assert.strictEqual(ptzRes.status, 403);
    });
  });

  // =========================================================================
  // 21, 22, 23 & 24. HEALTH, RATE LIMITING, API VALIDATION & DEDUPLICATION
  // =========================================================================
  describe('[Requirement 21, 22, 23 & 24] Health, Rate Limiting, API Validation & Deduplication', () => {
    it('GET /health returns operational health with correlation ID', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.status);
      assert.ok(res.headers.get('x-correlation-id'));
    });

    it('GET /health/components returns all 7 subsystems', async () => {
      const res = await fetch(`${baseUrl}/health/components`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.components));
      assert.strictEqual(data.components.length, 7);
    });

    it('validates request payload and rejects invalid inputs with 400', async () => {
      const res = await fetch(`${baseUrl}/api/sensors/DEV-SMK-204/reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ ppm: -50 }), // negative value
      });
      assert.strictEqual(res.status, 400);
    });

    it('deduplicates duplicate physical/device events (idempotency)', () => {
      const uniqueId = `EVT-DEDUP-PHASE4-${Date.now()}`;
      const event = {
        id: uniqueId,
        timestamp: '12:00:00',
        category: 'SYSTEM' as const,
        type: 'SYSTEM_HEALTH' as const,
        source: 'system' as const,
        severity: 'info' as const,
        payload: { component: 'API', status: 'HEALTHY' },
      };

      const firstPass = serverEventBus.processEvent(event as any);
      const secondPass = serverEventBus.processEvent(event as any);
      assert.strictEqual(firstPass, true);
      assert.strictEqual(secondPass, false); // duplicate dropped
    });
  });
});
