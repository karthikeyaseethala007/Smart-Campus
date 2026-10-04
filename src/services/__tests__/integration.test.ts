import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import { eventBus } from '../eventBus';
import { realtimeGateway } from '../realtimeGateway';
import { healthService } from '../healthService';
import { authService } from '../authService';
import { sensorAdapter } from '../adapters/sensorAdapter';
import { accessWiegandAdapter } from '../adapters/accessWiegandAdapter';
import { cctvMediaAdapter } from '../adapters/cctvMediaAdapter';
import { mqttAdapter } from '../adapters/mqttAdapter';
import { persistenceService } from '../persistenceService';
import type { CampusNormalizedEvent, IncidentDetectedEvent, IncidentAcknowledgedEvent, IncidentInvestigatingEvent, IncidentResolvedEvent } from '../../types/events';

describe('Smart Campus Realtime Architecture Test Suite', () => {

  beforeEach(() => {
    eventBus.clearDeduplicationCache();
  });

  // =========================================================================
  // 1. EVENT BUS & IDEMPOTENCY
  // =========================================================================
  describe('EventBus & Idempotency', () => {
    it('should validate and dispatch a well-formed normalized event', () => {
      let received: CampusNormalizedEvent | null = null;
      const unsub = eventBus.subscribe('SYSTEM', (e) => {
        received = e;
      });

      const validEvent: CampusNormalizedEvent = {
        id: `EVT-TEST-${Date.now()}-1`,
        timestamp: '12:00:00',
        category: 'SYSTEM',
        type: 'SYSTEM_HEALTH',
        source: 'system',
        severity: 'info',
        payload: {
          component: 'API',
          status: 'HEALTHY',
        },
      };

      const dispatched = eventBus.dispatch(validEvent);
      assert.strictEqual(dispatched, true);
      assert.ok(received);
      assert.strictEqual(received?.id, validEvent.id);
      unsub();
    });

    it('should drop malformed events missing required properties', () => {
      const malformed = {
        id: '', // Empty ID
        type: 'UNKNOWN',
      };

      const dispatched = eventBus.dispatch(malformed as any);
      assert.strictEqual(dispatched, false);
      const stats = eventBus.getStats();
      assert.ok(stats.invalidCount > 0);
    });

    it('should deduplicate identical events (idempotency)', () => {
      let dispatchCount = 0;
      const unsub = eventBus.subscribe('SYSTEM', () => {
        dispatchCount++;
      });

      const event: CampusNormalizedEvent = {
        id: `EVT-DEDUP-UNIQUE-${Date.now()}`,
        timestamp: '12:00:00',
        category: 'SYSTEM',
        type: 'SYSTEM_HEALTH',
        source: 'system',
        severity: 'info',
        payload: { component: 'API', status: 'HEALTHY' },
      };

      const first = eventBus.dispatch(event);
      const second = eventBus.dispatch(event); // duplicate

      assert.strictEqual(first, true);
      assert.strictEqual(second, false);
      assert.strictEqual(dispatchCount, 1);

      unsub();
    });

    it('should support wildcard listener subscriptions (*)', () => {
      const receivedEvents: string[] = [];
      const unsub = eventBus.subscribe('*', (e) => {
        receivedEvents.push(e.type);
      });

      eventBus.emit({
        category: 'PIR',
        type: 'PIR_MOTION',
        source: 'live',
        severity: 'info',
        payload: { zoneId: 'Main Gate', state: 'CLEAR' },
      });

      eventBus.emit({
        category: 'CAMERA',
        type: 'CAMERA_STREAM_STATE',
        source: 'live',
        severity: 'info',
        payload: { cameraId: 'CAM-01', status: 'online' },
      });

      assert.strictEqual(receivedEvents.length, 2);
      assert.ok(receivedEvents.includes('PIR_MOTION'));
      assert.ok(receivedEvents.includes('CAMERA_STREAM_STATE'));

      unsub();
    });
  });

  // =========================================================================
  // 2. WEBSOCKET & REALTIME GATEWAY
  // =========================================================================
  describe('WebSocket & Realtime Gateway', () => {
    it('should transition to CONNECTED in simulated realtime mode', () => {
      realtimeGateway.setMode('simulated');
      realtimeGateway.connect();
      assert.strictEqual(realtimeGateway.getConnectionState(), 'CONNECTED');
    });

    it('should report correct connection state on disconnect', () => {
      realtimeGateway.disconnect();
      assert.strictEqual(realtimeGateway.getConnectionState(), 'DISCONNECTED');
    });
  });

  // =========================================================================
  // 3. MQ-2 GAS SENSOR ADAPTER
  // =========================================================================
  describe('MQ-2 Sensor Adapter (Solid-State Electrochemical)', () => {
    it('should classify nominal 312 ppm reading as NORMAL', () => {
      const event = sensorAdapter.processMQ2Reading('DEV-SMK-204', 312, 'live');
      assert.strictEqual(event.payload.status, 'NORMAL');
      assert.strictEqual(event.severity, 'info');
      assert.strictEqual(event.payload.ventilationActive, false);
    });

    it('should classify elevated 640 ppm reading as ELEVATED with active damper', () => {
      const event = sensorAdapter.processMQ2Reading('DEV-SMK-204', 640, 'live');
      assert.strictEqual(event.payload.status, 'ELEVATED');
      assert.strictEqual(event.severity, 'warning');
      assert.strictEqual(event.payload.ventilationActive, true);
    });

    it('should classify critical 840 ppm reading as CRITICAL', () => {
      const event = sensorAdapter.processMQ2Reading('DEV-SMK-204', 840, 'live');
      assert.strictEqual(event.payload.status, 'CRITICAL');
      assert.strictEqual(event.severity, 'critical');
      assert.strictEqual(event.payload.ventilationActive, true);
    });

    it('should allow recalibration recovery to baseline', () => {
      const recovery = sensorAdapter.processMQ2Reading('DEV-SMK-204', 312, 'live');
      assert.strictEqual(recovery.payload.status, 'NORMAL');
      assert.strictEqual(recovery.payload.ppm, 312);
    });
  });

  // =========================================================================
  // 4. PIR PASSIVE INFRARED SENSOR ADAPTER
  // =========================================================================
  describe('PIR Sensor Adapter', () => {
    it('should emit warning PIR_MOTION event on movement detection', () => {
      const motion = sensorAdapter.processPirReading('DEV-PIR-101', 'MOTION', 'Innovation & Robotics Lab');
      assert.strictEqual(motion.type, 'PIR_MOTION');
      assert.strictEqual(motion.payload.state, 'MOTION');
      assert.strictEqual(motion.severity, 'warning');
    });

    it('should emit info PIR_MOTION event when cleared', () => {
      const clear = sensorAdapter.processPirReading('DEV-PIR-101', 'CLEAR', 'Innovation & Robotics Lab');
      assert.strictEqual(clear.payload.state, 'CLEAR');
      assert.strictEqual(clear.severity, 'info');
    });
  });

  // =========================================================================
  // 5. ACCESS CONTROL & WIEGAND ADAPTER
  // =========================================================================
  describe('Access Control & Wiegand Adapter', () => {
    const doorId = 'DOOR-GATE-MAIN';

    it('should grant access and unlatch solenoid for valid PIN 4821', async () => {
      const res = await accessWiegandAdapter.processPinEntry(doorId, '4821');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.status, 'GRANTED');
      assert.strictEqual(res.failedAttempts, 0);
    });

    it('should deny access and track violations for invalid PIN 9999', async () => {
      const res1 = await accessWiegandAdapter.processPinEntry(doorId, '9999');
      assert.strictEqual(res1.success, false);
      assert.strictEqual(res1.status, 'DENIED');
      assert.strictEqual(res1.failedAttempts, 1);

      const res2 = await accessWiegandAdapter.processPinEntry(doorId, '9999');
      assert.strictEqual(res2.status, 'DENIED');
      assert.strictEqual(res2.failedAttempts, 2);
    });

    it('should trigger SECURITY LOCKOUT after 3 consecutive failures', async () => {
      const res3 = await accessWiegandAdapter.processPinEntry(doorId, '9999');
      assert.strictEqual(res3.success, false);
      assert.strictEqual(res3.status, 'LOCKOUT');
      assert.strictEqual(accessWiegandAdapter.isLockedOut(doorId), true);
    });

    it('should enforce RBAC authorization for emergency solenoid override', () => {
      // Set to student clearance -> must fail
      authService.setUserRole('student');
      const deniedOverride = accessWiegandAdapter.executeSolenoidOverride(doorId, 'unlocked');
      assert.strictEqual(deniedOverride.success, false);

      // Set to administrator -> must succeed
      authService.setUserRole('admin');
      const grantedOverride = accessWiegandAdapter.executeSolenoidOverride(doorId, 'unlocked');
      assert.strictEqual(grantedOverride.success, true);
    });
  });

  // =========================================================================
  // 6. INCIDENT LIFECYCLE ENGINE
  // =========================================================================
  describe('Incident Lifecycle Engine (Detected -> Acknowledged -> Investigating -> Resolved)', () => {
    const incidentId = 'INC-TEST-001';

    it('should record DETECTED state', () => {
      let detected: IncidentDetectedEvent | null = null;
      const unsub = eventBus.subscribe('INCIDENT', (e) => {
        if (e.type === 'INCIDENT_DETECTED') detected = e as IncidentDetectedEvent;
      });

      eventBus.emit<IncidentDetectedEvent>({
        category: 'INCIDENT',
        type: 'INCIDENT_DETECTED',
        source: 'live',
        severity: 'critical',
        payload: {
          incidentId,
          title: 'Power Bus Line Anomaly',
          zone: 'Innovation & Robotics Lab',
          severity: 'critical',
          details: 'Overcurrent spike recorded on circuit breaker A4',
        },
      });

      assert.ok(detected);
      assert.strictEqual((detected as IncidentDetectedEvent).payload.incidentId, incidentId);
      unsub();
    });

    it('should record ACKNOWLEDGED state', () => {
      let acknowledged: IncidentAcknowledgedEvent | null = null;
      const unsub = eventBus.subscribe('INCIDENT', (e) => {
        if (e.type === 'INCIDENT_ACKNOWLEDGED') acknowledged = e as IncidentAcknowledgedEvent;
      });

      eventBus.emit<IncidentAcknowledgedEvent>({
        category: 'INCIDENT',
        type: 'INCIDENT_ACKNOWLEDGED',
        source: 'live',
        severity: 'info',
        payload: {
          incidentId,
          actor: 'SECURITY WATCH',
          timestamp: '12:05:00',
        },
      });

      assert.ok(acknowledged);
      assert.strictEqual((acknowledged as IncidentAcknowledgedEvent).payload.incidentId, incidentId);
      unsub();
    });

    it('should record INVESTIGATING state', () => {
      let investigating: IncidentInvestigatingEvent | null = null;
      const unsub = eventBus.subscribe('INCIDENT', (e) => {
        if (e.type === 'INCIDENT_INVESTIGATING') investigating = e as IncidentInvestigatingEvent;
      });

      eventBus.emit<IncidentInvestigatingEvent>({
        category: 'INCIDENT',
        type: 'INCIDENT_INVESTIGATING',
        source: 'live',
        severity: 'info',
        payload: {
          incidentId,
          actor: 'Officer Vance',
          timestamp: '12:07:00',
        },
      });

      assert.ok(investigating);
      assert.strictEqual((investigating as IncidentInvestigatingEvent).payload.actor, 'Officer Vance');
      unsub();
    });

    it('should record RESOLVED state', () => {
      let resolved: IncidentResolvedEvent | null = null;
      const unsub = eventBus.subscribe('INCIDENT', (e) => {
        if (e.type === 'INCIDENT_RESOLVED') resolved = e as IncidentResolvedEvent;
      });

      eventBus.emit<IncidentResolvedEvent>({
        category: 'INCIDENT',
        type: 'INCIDENT_RESOLVED',
        source: 'live',
        severity: 'info',
        payload: {
          incidentId,
          actor: 'Chief Ramanujan',
          timestamp: '12:12:00',
          resolutionNotes: 'Breaker A4 inspected and reset. Telemetry nominal.',
        },
      });

      assert.ok(resolved);
      assert.strictEqual((resolved as IncidentResolvedEvent).payload.incidentId, incidentId);
      unsub();
    });
  });

  // =========================================================================
  // 7. CENTRALIZED RBAC & AUTHORIZATION
  // =========================================================================
  describe('Centralized RBAC & Authorization Boundary', () => {
    it('Administrator has full operational and administrative clearance', () => {
      authService.setUserRole('admin');
      assert.strictEqual(authService.can('VIEW_CAMERA'), true);
      assert.strictEqual(authService.can('CONTROL_CAMERA'), true);
      assert.strictEqual(authService.can('LOCKDOWN_ZONE'), true);
      assert.strictEqual(authService.can('ACCESS_OVERRIDE'), true);
      assert.strictEqual(authService.can('MANAGE_USERS'), true);
      assert.strictEqual(authService.can('MANAGE_DEVICES'), true);
    });

    it('Security Officer has tactical clearance but no user/device management', () => {
      authService.setUserRole('security_officer');
      assert.strictEqual(authService.can('VIEW_CAMERA'), true);
      assert.strictEqual(authService.can('CONTROL_CAMERA'), true);
      assert.strictEqual(authService.can('LOCKDOWN_ZONE'), true);
      assert.strictEqual(authService.can('ACCESS_OVERRIDE'), true);
      assert.strictEqual(authService.can('MANAGE_USERS'), false);
      assert.strictEqual(authService.can('MANAGE_DEVICES'), false);
    });

    it('Faculty Member has monitor-only clearance', () => {
      authService.setUserRole('faculty');
      assert.strictEqual(authService.can('VIEW_CAMERA'), true);
      assert.strictEqual(authService.can('VIEW_SENSOR'), true);
      assert.strictEqual(authService.can('LOCKDOWN_ZONE'), false);
      assert.strictEqual(authService.can('ACCESS_OVERRIDE'), false);
    });

    it('Student has strict read-only clearance', () => {
      authService.setUserRole('student');
      assert.strictEqual(authService.can('VIEW_CAMERA'), true);
      assert.strictEqual(authService.can('CONTROL_CAMERA'), false);
      assert.strictEqual(authService.can('ACKNOWLEDGE_INCIDENT'), false);
      assert.strictEqual(authService.can('LOCKDOWN_ZONE'), false);
    });
  });

  // =========================================================================
  // 8. CCTV / RTSP MEDIA ADAPTER
  // =========================================================================
  describe('CCTV & Media Adapter', () => {
    it('should register all 7 campus cameras with proper metadata', () => {
      const cameras = cctvMediaAdapter.getAllCameras();
      assert.strictEqual(cameras.length, 7);
      const cam1 = cctvMediaAdapter.getCamera('CAM-01');
      assert.ok(cam1);
      assert.strictEqual(cam1?.capabilities.ptz, true);
    });

    it('should update camera status and degrade gateway health when offline', () => {
      cctvMediaAdapter.setCameraStatus('CAM-02', 'offline', 'RTSP link disconnected');
      const cam2 = cctvMediaAdapter.getCamera('CAM-02');
      assert.strictEqual(cam2?.status, 'offline');

      const health = healthService.getSnapshot();
      assert.strictEqual(health.CAMERA_GATEWAY.status, 'DEGRADED');

      // Recover camera
      cctvMediaAdapter.setCameraStatus('CAM-02', 'online');
      assert.strictEqual(cctvMediaAdapter.getCamera('CAM-02')?.status, 'online');
    });

    it('should sanitize credentials from RTSP URLs', () => {
      const sanitized = cctvMediaAdapter.sanitizeStreamUrl('rtsp://admin:SecretPass123@192.168.1.50:554/live');
      assert.ok(!sanitized?.includes('SecretPass123'));
      assert.ok(sanitized?.includes('***'));
    });

    it('should enforce camera PTZ control authorization', () => {
      authService.setUserRole('student');
      const studentPtz = cctvMediaAdapter.executePtzAction('CAM-01', 'PAN_LEFT');
      assert.strictEqual(studentPtz.success, false);

      authService.setUserRole('admin');
      const adminPtz = cctvMediaAdapter.executePtzAction('CAM-01', 'PAN_LEFT');
      assert.strictEqual(adminPtz.success, true);
    });
  });

  // =========================================================================
  // 9. MQTT INGESTION BRIDGE
  // =========================================================================
  describe('MQTT Adapter & Topic Mapping', () => {
    it('should parse standard campus MQTT topic schema', () => {
      const topic = 'campus/Main Gate/sensor/DEV-SMK-204';
      const parsed = mqttAdapter.parseTopic(topic);
      assert.ok(parsed);
      assert.strictEqual(parsed?.zone, 'Main Gate');
      assert.strictEqual(parsed?.subsystem, 'sensor');
      assert.strictEqual(parsed?.device, 'DEV-SMK-204');
    });

    it('should normalize incoming MQTT sensor telemetry into CampusNormalizedEvent', () => {
      const message = {
        topic: 'campus/Science & Physics Lab/sensor/DEV-SMK-204',
        payload: JSON.stringify({ ppm: 780 }),
      };
      const event = mqttAdapter.handleMessage(message);
      assert.ok(event);
      assert.strictEqual(event?.category, 'MQ2');
      assert.strictEqual(event?.severity, 'critical');
    });
  });

  // =========================================================================
  // 10. SYSTEM HEALTH & PERSISTENCE
  // =========================================================================
  describe('System Health & Persistence', () => {
    it('should track and update subsystem health', () => {
      healthService.recordHeartbeat('API', 8);
      const snap = healthService.getSnapshot();
      assert.strictEqual(snap.API.status, 'HEALTHY');
      assert.strictEqual(snap.API.latencyMs, 8);
    });

    it('should persist and load audit records', () => {
      const testRecord = {
        id: 'AUD-TEST-99',
        timestamp: '12:00:00',
        actor: 'ADMIN',
        role: 'admin' as const,
        action: 'POLICY_UPDATE',
        target: 'Security System',
        result: 'SUCCESS' as const,
        details: 'Threshold verified',
      };
      persistenceService.saveAuditLog([testRecord]);
      const loaded = persistenceService.loadAuditLog();
      assert.ok(loaded);
      assert.strictEqual(loaded[0].id, 'AUD-TEST-99');
    });
  });
});
