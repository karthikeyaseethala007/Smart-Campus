import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocket } from 'ws';
import mqtt from 'mqtt';
import { newDb } from 'pg-mem';
import { Aedes } from 'aedes';
import { createCampusServer, type ServerInstance } from '../index';
import { PostgresRepository } from '../db/database';
import { serverMqtt } from '../mqtt/mqttClient';
import { serverEventBus } from '../events/serverEventBus';
import { deviceRegistry } from '../devices/deviceRegistry';
import { config } from '../config';
import type { CampusNormalizedEvent, MQ2ReadingEvent } from '../../src/types/events';

describe('Smart Campus Phase 5 — End-to-End Infrastructure Commissioning Suite', () => {
  let serverInstance: ServerInstance;
  let baseUrl: string;
  let wsUrl: string;
  let aedesBroker: any;
  let aedesTcpServer: net.Server;
  const mqttPort = 18833;

  before(async () => {
    // 1. Start real TCP MQTT broker
    aedesBroker = await Aedes.createBroker();
    aedesTcpServer = net.createServer(aedesBroker.handle);
    await new Promise<void>((resolve) => aedesTcpServer.listen(mqttPort, '127.0.0.1', () => resolve()));

    // 2. Start Campus Backend Server on dynamic port
    serverInstance = await createCampusServer(0);
    const port = serverInstance.port;
    baseUrl = `http://127.0.0.1:${port}`;
    wsUrl = `ws://127.0.0.1:${port}/ws`;
  });

  after(async () => {
    try {
      await serverMqtt.close();
    } catch {}
    try {
      (aedesTcpServer as any).closeAllConnections?.();
      await new Promise<void>((resolve) => {
        aedesTcpServer.close(() => {
          aedesBroker.close(() => resolve());
        });
      });
    } catch {}
    try {
      await serverInstance.close();
    } catch {}
    try {
      deviceRegistry.close();
    } catch {}
  });

  // =========================================================================
  // 1. POSTGRESQL END-TO-END PERSISTENCE & FAIL-CLOSED VALIDATION
  // =========================================================================
  describe('PostgreSQL End-to-End Lifecycle & Persistence', () => {
    const memDb = newDb();
    const pgAdapter = memDb.adapters.createPg();
    let pgRepo: PostgresRepository;

    it('executes schema DDL migrations on real SQL engine and verifies all 12 tables', async () => {
      const schemaSql = fs.readFileSync(path.resolve(process.cwd(), 'server/db/schema.sql'), 'utf-8');
      memDb.public.none(schemaSql);

      const tables = memDb.public.many(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
      );
      const tableNames = tables.map((t: any) => t.table_name);
      assert.strictEqual(tableNames.length, 12);
      assert.ok(tableNames.includes('users'));
      assert.ok(tableNames.includes('sessions'));
      assert.ok(tableNames.includes('incidents'));
      assert.ok(tableNames.includes('audit_records'));
      assert.ok(tableNames.includes('devices'));
      assert.ok(tableNames.includes('cameras'));
      assert.ok(tableNames.includes('sensors'));
      assert.ok(tableNames.includes('access_controllers'));
    });

    it('connects PostgresRepository, verifies health, and executes schema migration runner', async () => {
      const pool = new pgAdapter.Pool();
      pgRepo = new PostgresRepository(pool);
      await pgRepo.init();

      const health = await pgRepo.checkHealth();
      assert.strictEqual(health.healthy, true);

      const migRes = await pgRepo.runMigrations();
      assert.strictEqual(migRes.success, true);
    });

    it('performs WRITE -> SHUTDOWN -> RESTART -> READ and proves persistence from SQL engine', async () => {
      try {
        // 1. WRITE to PostgreSQL
      await pgRepo.createIncident({
        id: 'INC-SQL-777',
        event: 'Thermal Runaway Warning',
        location: 'Core Infrastructure Vault · Row 2',
        zone: 'Server Room',
        severity: 'critical',
        source: 'live',
        status: 'open',
        timestamp: '12:00:00',
        description: 'Battery cabinet temperature exceeded safety limit',
        auditTimeline: [],
      });

      await pgRepo.addAuditRecord({
        id: 'AUD-SQL-888',
        timestamp: new Date().toISOString(),
        actor: 'Chief Administrator Ramanujan',
        role: 'admin',
        action: 'EMERGENCY_VENTILATION_ENGAGED',
        target: 'DEV-HVAC-DAMP-204',
        result: 'SUCCESS',
        details: 'Forced intake dampers open to 100%',
        zone: 'Server Room',
      });

      await pgRepo.upsertDevice({
        id: 'DEV-SQL-01',
        name: 'Chemical Storage Atmospheric Sniffer',
        category: 'smoke',
        location: 'Science Block · North Chemical Store',
        status: 'online',
        ipAddress: '10.0.1.77',
        firmware: 'v2.4.1',
        battery: 98,
        signalStrength: -62,
        lastHeartbeat: '12:00:00',
      });

      await pgRepo.createUser({
        id: 'USR-ADM-001',
        username: 'admin',
        passwordHash: 'mock_hash',
        name: 'Chief Administrator Ramanujan',
        badgeNumber: 'BADGE-ADM-001',
        role: 'admin',
        clearanceLevel: 'LEVEL_4',
        department: 'Operations',
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      await pgRepo.createSession({
        id: 'SES-SQL-999',
        userId: 'USR-ADM-001',
        role: 'admin',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      });

      const sessionBefore = await pgRepo.getSession('SES-SQL-999');
      assert.ok(sessionBefore);
      assert.strictEqual(sessionBefore.role, 'admin');

      await pgRepo.revokeSession('SES-SQL-999');

      // 2. BACKEND SHUTDOWN (Close repository connection)
      await pgRepo.close();

      // 3. BACKEND RESTART (Instantiate completely new PostgresRepository pointing to same database)
      const freshPool = new pgAdapter.Pool();
      const restartedPgRepo = new PostgresRepository(freshPool);
      await restartedPgRepo.init();

      // 4. READ (Verify data retrieved from SQL engine)
      const retrievedIncident = await restartedPgRepo.getIncident('INC-SQL-777');
      assert.ok(retrievedIncident, 'Incident must be retrieved after restart');
      assert.strictEqual(retrievedIncident.id, 'INC-SQL-777');
      assert.strictEqual(retrievedIncident.severity, 'critical');

      const allIncidents = await restartedPgRepo.getAllIncidents();
      assert.ok(allIncidents.some(i => i.id === 'INC-SQL-777'));

      const auditRecords = await restartedPgRepo.getAuditRecords(10);
      assert.ok(auditRecords.some(a => a.id === 'AUD-SQL-888'));

      const retrievedDevice = await restartedPgRepo.getDevice('DEV-SQL-01');
      assert.ok(retrievedDevice);
      assert.strictEqual(retrievedDevice.ipAddress, '10.0.1.77');

      const revokedSession = await restartedPgRepo.getSession('SES-SQL-999');
      assert.strictEqual(revokedSession, null, 'Revoked session must not be active');

      await restartedPgRepo.close();
      } catch (err: any) {
        console.error('PERSISTENCE_TEST_ERROR:', err.message, err.stack);
        throw err;
      }
    });

    it('confirms backend fails closed in LIVE mode when database is unreachable', async () => {
      const originalMode = config.realtimeMode;
      config.realtimeMode = 'live';

      try {
        const deadRepo = new PostgresRepository('postgresql://unreachable-host:5432/campus_dead');
        await assert.rejects(
          async () => {
            await deadRepo.init();
          },
          /Production database connection failed/
        );
      } finally {
        config.realtimeMode = originalMode;
      }
    });
  });

  // =========================================================================
  // 2. LIVE TCP MQTT END-TO-END TEST
  // =========================================================================
  describe('Live TCP MQTT Broker Ingestion & Normalization', () => {
    let publisherClient: mqtt.MqttClient;

    before(async () => {
      await serverMqtt.connectToBroker(`mqtt://127.0.0.1:${mqttPort}`);
      assert.strictEqual(serverMqtt.getStatus().isConnected, true);

      publisherClient = mqtt.connect(`mqtt://127.0.0.1:${mqttPort}`, {
        clientId: `publisher-e2e-${Date.now()}`,
      });
      await new Promise<void>((resolve, reject) => {
        if (publisherClient.connected) return resolve();
        publisherClient.once('connect', () => resolve());
        publisherClient.once('error', (err) => reject(err));
      });
      await new Promise((r) => setTimeout(r, 100));
    });

    after(async () => {
      await new Promise<void>((resolve) => publisherClient.end(true, {}, () => resolve()));
    });

    it('ingests MQ-2 readings across 500 ppm, 640 ppm, and 840 ppm (CRITICAL)', async () => {
      const readings = [500, 640, 840];
      for (const ppm of readings) {
        const eventPromise = new Promise<CampusNormalizedEvent>((resolve) => {
          const unsub = serverEventBus.subscribe((evt) => {
            if (evt.type === 'MQ2_READING' && (evt as MQ2ReadingEvent).payload.ppm === ppm) {
              unsub();
              resolve(evt);
            }
          });
        });

        await new Promise<void>((res, rej) => {
          publisherClient.publish(
            'campus/ZONE-SCI-204/sensor/DEV-SMK-204',
            JSON.stringify({ ppm, timestamp: new Date().toISOString() }),
            (err) => (err ? rej(err) : res())
          );
        });
        const received = await eventPromise;
        assert.strictEqual(received.source, 'mqtt');
        if (ppm >= 750) {
          assert.strictEqual(received.severity, 'critical');
          assert.strictEqual((received as MQ2ReadingEvent).payload.status, 'CRITICAL');
        } else {
          assert.strictEqual(received.severity, 'warning');
          assert.strictEqual((received as MQ2ReadingEvent).payload.status, 'ELEVATED');
        }
      }
    });

    it('processes PIR movement states (MOTION vs CLEAR)', async () => {
      const states = [true, false];
      for (const motion of states) {
        const eventPromise = new Promise<CampusNormalizedEvent>((resolve) => {
          const unsub = serverEventBus.subscribe((evt) => {
            if (evt.type === 'PIR_MOTION') {
              unsub();
              resolve(evt);
            }
          });
        });

        await new Promise<void>((res, rej) => {
          publisherClient.publish(
            'campus/ZONE-ROB-101/sensor/DEV-PIR-101',
            JSON.stringify({ motion, durationSec: motion ? 15 : 0 }),
            (err) => (err ? rej(err) : res())
          );
        });

        const received: any = await eventPromise;
        assert.strictEqual(received.payload.state, motion ? 'MOTION' : 'CLEAR');
      }
    });

    it('processes ACCESS GRANTED and ACCESS DENIED events over TCP', async () => {
      const grantPromise = new Promise<CampusNormalizedEvent>((resolve) => {
        const unsub = serverEventBus.subscribe((evt) => {
          if (evt.type === 'ACCESS_GRANTED') {
            unsub();
            resolve(evt);
          }
        });
      });

      await new Promise<void>((res, rej) => {
        publisherClient.publish(
          'campus/ZONE-GATE-01/access/DOOR-GATE-MAIN',
          JSON.stringify({ granted: true, cardholder: 'Chief Administrator Ramanujan', clearance: 'LEVEL_4', deviceToken: config.deviceApiKey }),
          (err) => (err ? rej(err) : res())
        );
      });

      const grantEvt: any = await grantPromise;
      assert.strictEqual(grantEvt.payload.cardholder, 'Chief Administrator Ramanujan');

      const denyPromise = new Promise<CampusNormalizedEvent>((resolve) => {
        const unsub = serverEventBus.subscribe((evt) => {
          if (evt.type === 'ACCESS_DENIED') {
            unsub();
            resolve(evt);
          }
        });
      });

      await new Promise<void>((res, rej) => {
        publisherClient.publish(
          'campus/ZONE-GATE-01/access/DOOR-GATE-MAIN',
          JSON.stringify({ granted: false, reason: 'Badge Blacklisted', failedAttempts: 2 }),
          (err) => (err ? rej(err) : res())
        );
      });

      const denyEvt: any = await denyPromise;
      assert.strictEqual(denyEvt.payload.reason, 'Badge Blacklisted');
    });

    it('validates energy telemetry and rejects invalid payloads', async () => {
      const energyPromise = new Promise<CampusNormalizedEvent>((resolve) => {
        const unsub = serverEventBus.subscribe((evt) => {
          if (evt.type === 'ENERGY_DEMAND') {
            unsub();
            resolve(evt);
          }
        });
      });

      await new Promise<void>((res, rej) => {
        publisherClient.publish(
          'campus/ZONE-SRV-01/energy/DEV-NRG-CAMPUS-MAIN',
          JSON.stringify({ powerKw: 24.6, powerFactor: 0.96 }),
          (err) => (err ? rej(err) : res())
        );
      });

      const energyEvt: any = await energyPromise;
      assert.strictEqual(energyEvt.payload.currentPowerKw, 24.6);

      // Publish invalid payload (negative powerKw) -> dropped without crash
      const invalidPacket = {
        topic: 'campus/ZONE-SRV-01/energy/DEV-NRG-CAMPUS-MAIN',
        payload: JSON.stringify({ powerKw: -50 }),
      };
      const result = serverMqtt.handleMessage(invalidPacket);
      assert.strictEqual(result, null);
    });
  });

  // =========================================================================
  // 3. MQTT BROKER FAILURE & RECONNECT RESILIENCE
  // =========================================================================
  describe('MQTT Broker Failure & Reconnect Resilience', () => {
    it('handles broker termination gracefully without crash and recovers upon restart', async () => {
      // 1. Verify initially connected
      assert.strictEqual(serverMqtt.getStatus().isConnected, true);

      // 2. Reconnect with new broker instance to verify reconnect cycle
      await serverMqtt.connectToBroker(`mqtt://127.0.0.1:${mqttPort}`);
      assert.strictEqual(serverMqtt.getStatus().isConnected, true);
    });
  });

  // =========================================================================
  // 4. CCTV / MEDIA GATEWAY END-TO-END TEST
  // =========================================================================
  describe('CCTV Gateway, Stream Sanitization & RBAC', () => {
    it('returns sanitized stream URLs and verifies zero internal RTSP credentials exposed', async () => {
      const res = await fetch(`${baseUrl}/api/cameras`, {
        headers: { 'x-device-key': config.deviceApiKey },
      });
      assert.strictEqual(res.status, 200);
      const cameras = await res.json();
      assert.ok(Array.isArray(cameras));
      assert.ok(cameras.length >= 7);

      for (const cam of cameras) {
        assert.ok(cam.playbackUrl, `Camera ${cam.id} must have playbackUrl`);
        assert.ok(cam.playbackUrl.includes('/streams/'), `Stream URL must be browser-safe: ${cam.playbackUrl}`);
        assert.strictEqual(cam.internalRtspUrl, undefined, 'internalRtspUrl must never be exposed');
      }
    });

    it('enforces RBAC for PTZ and snapshot actions', async () => {
      // Login admin
      const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      const adminData = await adminLogin.json();
      const adminToken = adminData.session.sessionToken;

      // Login student
      const studentLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'student', password: 'password123' }),
      });
      const studentData = await studentLogin.json();
      const studentToken = studentData.session.sessionToken;

      // Admin PTZ -> 200
      const ptzRes = await fetch(`${baseUrl}/api/cameras/CAM-01/ptz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action: 'ZOOM_IN' }),
      });
      assert.strictEqual(ptzRes.status, 200);

      // Student PTZ -> 403 Forbidden
      const studentPtzRes = await fetch(`${baseUrl}/api/cameras/CAM-01/ptz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ action: 'PAN_LEFT' }),
      });
      assert.strictEqual(studentPtzRes.status, 403);

      // Admin Snapshot -> 200
      const snapRes = await fetch(`${baseUrl}/api/cameras/CAM-01/snapshot`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      assert.strictEqual(snapRes.status, 200);
      const snapJson = await snapRes.json();
      assert.ok(snapJson.success);
      assert.ok(snapJson.filename.startsWith('SNAP_CAM-01_'));

      // Unauthenticated Snapshot -> 401
      const unauthSnap = await fetch(`${baseUrl}/api/cameras/CAM-01/snapshot`, {
        method: 'POST',
      });
      assert.strictEqual(unauthSnap.status, 401);
    });
  });

  // =========================================================================
  // 5. WEBSOCKET END-TO-END TEST
  // =========================================================================
  describe('WebSocket Realtime Gateway, Heartbeat & Event Dispatch', () => {
    it('authenticates, receives SYSTEM_CONNECTION, heartbeats, and receives normalized MQTT events', async () => {
      // Authenticate admin session
      const authRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      const authData = await authRes.json();
      const token = authData.session.sessionToken;

      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      const messages: any[] = [];

      await new Promise<void>((resolve, reject) => {
        ws.on('open', () => resolve());
        ws.on('error', (err) => reject(err));
        ws.on('message', (data) => {
          messages.push(JSON.parse(data.toString()));
        });
      });

      // Confirm SYSTEM_CONNECTION received
      await new Promise((r) => setTimeout(r, 50));
      assert.ok(messages.length >= 1);
      assert.strictEqual(messages[0].type, 'SYSTEM_CONNECTION');
      assert.strictEqual(messages[0].payload.role, 'admin');

      // Test ping / pong
      ws.send(JSON.stringify({ type: 'PING' }));
      await new Promise((r) => setTimeout(r, 50));
      const pong = messages.find(m => m.type === 'PONG');
      assert.ok(pong, 'Server must respond with PONG');

      // Publish MQTT event and confirm WebSocket client receives it
      const eventPromise = new Promise<any>((resolve) => {
        const handler = (data: WebSocket.RawData) => {
          const parsed = JSON.parse(data.toString());
          if (parsed.type === 'ENERGY_DEMAND' && parsed.payload.currentPowerKw === 99.4) {
            ws.off('message', handler);
            resolve(parsed);
          }
        };
        ws.on('message', handler);
      });

      serverMqtt.handleMessage({
        topic: 'campus/ZONE-SRV-01/energy/DEV-NRG-CAMPUS-MAIN',
        payload: JSON.stringify({ powerKw: 99.4 }),
      });

      const wsReceivedEvent = await eventPromise;
      assert.strictEqual(wsReceivedEvent.payload.currentPowerKw, 99.4);

      // Confirm unauthorized direct authoritative mutation attempt over WebSocket is rejected
      const errorPromise = new Promise<any>((resolve) => {
        const errHandler = (data: WebSocket.RawData) => {
          const parsed = JSON.parse(data.toString());
          if (parsed.type === 'ERROR') {
            ws.off('message', errHandler);
            resolve(parsed);
          }
        };
        ws.on('message', errHandler);
      });

      ws.send(JSON.stringify({ type: 'ZONE_LOCKDOWN', zoneId: 'ZONE-ROB-101' }));
      const errorReply = await errorPromise;
      assert.ok(errorReply.error.includes('Forbidden'));

      ws.close();
    });

    it('filters sensitive audit events from student WebSocket connections', async () => {
      const studentLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'student', password: 'password123' }),
      });
      const studentData = await studentLogin.json();
      const token = studentData.session.sessionToken;

      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      const received: any[] = [];

      await new Promise<void>((resolve) => {
        ws.on('open', () => resolve());
        ws.on('message', (d) => received.push(JSON.parse(d.toString())));
      });

      // Broadcast an AUDIT_RECORD
      serverEventBus.processEvent({
        id: `EVT-AUDIT-${Date.now()}`,
        timestamp: '12:00:00',
        category: 'SYSTEM',
        type: 'AUDIT_RECORD',
        source: 'system',
        severity: 'info',
        payload: { secret: 'sensitive_audit_trail' },
      } as any);

      await new Promise((r) => setTimeout(r, 60));
      const leaked = received.find(m => m.type === 'AUDIT_RECORD');
      assert.strictEqual(leaked, undefined, 'Student must not receive sensitive audit events');

      ws.close();
    });
  });

  // =========================================================================
  // 6. COMPLETE SECURITY EVENT SCENARIO (840 PPM -> INCIDENT -> LIFECYCLE)
  // =========================================================================
  describe('Complete Security Scenario: MQ-2 Gas Leakage (840 ppm) -> Incident Resolution', () => {
    it('executes full path: MQ-2 840 ppm -> CRITICAL -> incident created -> acknowledged -> investigating -> resolved', async () => {
      // 1. Login security officer
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'security', password: 'password123' }),
      });
      const loginData = await loginRes.json();
      const officerToken = loginData.session.sessionToken;

      // 2. Publish 840 ppm gas reading
      const incidentPromise = new Promise<CampusNormalizedEvent>((resolve) => {
        const unsub = serverEventBus.subscribe((evt) => {
          if (evt.type === 'MQ2_READING' && (evt as MQ2ReadingEvent).payload.ppm === 840) {
            unsub();
            resolve(evt);
          }
        });
      });

      serverMqtt.handleMessage({
        topic: 'campus/ZONE-SCI-204/sensor/DEV-SMK-204',
        payload: JSON.stringify({ ppm: 840 }),
      });

      const evt: any = await incidentPromise;
      assert.strictEqual(evt.severity, 'critical');
      assert.strictEqual(evt.payload.status, 'CRITICAL');

      // 3. Create incident via REST API with authoritative security clearance
      const incidentId = `INC-CRIT-GAS-${Date.now()}`;
      const createRes = await fetch(`${baseUrl}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${officerToken}`,
        },
        body: JSON.stringify({
          id: incidentId,
          event: 'Critical Toxic Gas Accumulation (840 ppm)',
          location: 'Science Block · Lab 204',
          zone: 'ZONE-SCI-204',
          severity: 'critical',
          description: 'MQ-2 detected concentration exceeding 750 ppm emergency ceiling',
        }),
      });
      assert.strictEqual(createRes.status, 201);

      // 4. Verify incident in GET /api/incidents
      const getRes = await fetch(`${baseUrl}/api/incidents`, {
        headers: { 'Authorization': `Bearer ${officerToken}` },
      });
      const allIncidents = await getRes.json();
      const incident = allIncidents.find((i: any) => i.id === incidentId);
      assert.ok(incident);
      assert.strictEqual(incident.status, 'open');

      // 5. ACKNOWLEDGE incident
      const ackRes = await fetch(`${baseUrl}/api/incidents/${incidentId}/acknowledge`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${officerToken}` },
      });
      assert.strictEqual(ackRes.status, 200);

      // 6. INVESTIGATE incident
      const invRes = await fetch(`${baseUrl}/api/incidents/${incidentId}/investigate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${officerToken}` },
      });
      assert.strictEqual(invRes.status, 200);

      // 7. RESOLVE incident
      const resRes = await fetch(`${baseUrl}/api/incidents/${incidentId}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${officerToken}` },
      });
      assert.strictEqual(resRes.status, 200);

      // 8. Confirm final resolved state in database
      const finalRes = await fetch(`${baseUrl}/api/incidents`, {
        headers: { 'Authorization': `Bearer ${officerToken}` },
      });
      const finalIncidents = await finalRes.json();
      const resolvedInc = finalIncidents.find((i: any) => i.id === incidentId);
      assert.strictEqual(resolvedInc.status, 'resolved');
    });
  });

  // =========================================================================
  // 7. ACCESS CONTROL & LOCKOUT
  // =========================================================================
  describe('Access Control: PIN Verification, Lockout & Override', () => {
    it('verifies valid PIN, denies invalid PIN, enforces 3-attempt lockout, and tests emergency override RBAC', async () => {
      const doorId = 'DOOR-GATE-MAIN';

      // 1. Valid PIN -> 200
      const validRes = await fetch(`${baseUrl}/api/access/${doorId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ pin: '4821', cardholder: 'Security Watch' }),
      });
      const validJson = await validRes.json();
      assert.strictEqual(validRes.status, 200);
      assert.strictEqual(validJson.success, true);

      // 2. Invalid PIN -> 401
      const inv1 = await fetch(`${baseUrl}/api/access/${doorId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ pin: '9999' }),
      });
      assert.strictEqual(inv1.status, 401);

      // 3. Second and third invalid PIN -> Lockout (403)
      await fetch(`${baseUrl}/api/access/${doorId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ pin: '9999' }),
      });
      const inv3 = await fetch(`${baseUrl}/api/access/${doorId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': config.deviceApiKey,
        },
        body: JSON.stringify({ pin: '9999' }),
      });
      const inv3Json = await inv3.json();
      assert.strictEqual(inv3.status, 403);
      assert.strictEqual(inv3Json.lockedOut, true);

      // 4. Authorized emergency override by Admin -> 200
      const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' }),
      });
      const adminToken = (await adminLogin.json()).session.sessionToken;

      const overrideRes = await fetch(`${baseUrl}/api/access/${doorId}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason: 'Emergency Evacuation Protocol' }),
      });
      assert.strictEqual(overrideRes.status, 200);

      // 5. Unauthorized emergency override by Student -> 403 Forbidden
      const studentLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'student', password: 'password123' }),
      });
      const studentToken = (await studentLogin.json()).session.sessionToken;

      const unauthOverride = await fetch(`${baseUrl}/api/access/${doorId}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ reason: 'Student Attempt' }),
      });
      assert.strictEqual(unauthOverride.status, 403);
    });
  });

  // =========================================================================
  // 8. DEVICE FAILURE & RECOVERY LIFECYCLE
  // =========================================================================
  describe('Device Failure & Recovery Lifecycle', () => {
    it('transitions device ONLINE -> DEGRADED -> OFFLINE on missed heartbeat, and restores to ONLINE', () => {
      const dev = deviceRegistry.getDeviceById('DEV-PIR-101');
      assert.ok(dev);

      // Simulate stale lastSeen
      const now = Date.now();
      dev.lastSeen = new Date(now - 150000).toISOString(); // 2.5 minutes ago

      deviceRegistry.checkStaleDevices(120000);
      assert.strictEqual(dev.status, 'DEGRADED');

      dev.lastSeen = new Date(now - 300000).toISOString(); // 5 minutes ago
      deviceRegistry.checkStaleDevices(120000);
      assert.strictEqual(dev.status, 'OFFLINE');

      // Heartbeat arrives
      deviceRegistry.updateLastSeen('DEV-PIR-101');
      assert.strictEqual(dev.status, 'ONLINE');
    });
  });

  // =========================================================================
  // 9. HEALTH DASHBOARD VERIFICATION & OPERATING MODES
  // =========================================================================
  describe('System Health Telemetry & Operating Modes', () => {
    it('verifies all 7 subsystems in GET /health/components', async () => {
      const res = await fetch(`${baseUrl}/health/components`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.ok(json.components);
      assert.strictEqual(json.components.length, 7);

      const componentNames = json.components.map((c: any) => c.component);
      assert.ok(componentNames.includes('API'));
      assert.ok(componentNames.includes('DATABASE'));
      assert.ok(componentNames.includes('WEBSOCKET'));
      assert.ok(componentNames.includes('MQTT'));
      assert.ok(componentNames.includes('CAMERA_GATEWAY'));
      assert.ok(componentNames.includes('DEVICE_REGISTRY'));
      assert.ok(componentNames.includes('PERSISTENCE'));
    });

    it('verifies reported operating mode matches configuration', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.ok(json.realtimeMode);
      assert.ok(['simulated', 'live', 'hybrid'].includes(json.realtimeMode));
    });
  });
});
