import { db } from '../db/database';
import type {
  CampusNormalizedEvent,
  CampusEvent,
  AuditRecord
} from '../../src/types/events';

export type ServerEventCallback = (event: CampusNormalizedEvent) => void;

export class ServerEventBus {
  private static instance: ServerEventBus;
  private subscribers: Set<ServerEventCallback> = new Set();
  private processedIds: Set<string> = new Set();
  private idQueue: string[] = [];
  private maxCacheSize = 1000;

  private constructor() {}

  public static getInstance(): ServerEventBus {
    if (!ServerEventBus.instance) {
      ServerEventBus.instance = new ServerEventBus();
    }
    return ServerEventBus.instance;
  }

  public subscribe(callback: ServerEventCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Authoritative server-side event pipeline:
   * 1. Validate
   * 2. Deduplicate
   * 3. Mutate Domain State in Database
   * 4. Auto-generate Incidents / Alerts / Activity / Audit records if required
   * 5. Broadcast to connected WebSocket clients
   */
  public processEvent(event: CampusNormalizedEvent): boolean {
    if (!event || !event.id || !event.type || !event.category) {
      console.warn('[ServerEventBus] Rejected invalid event schema:', event);
      return false;
    }

    // Validate trusted event source: reject untrusted client/browser injections
    const UNTRUSTED_SOURCES = new Set(['client', 'browser', 'websocket', 'untrusted']);
    if (event.source && UNTRUSTED_SOURCES.has(event.source)) {
      console.warn(`[ServerEventBus] Rejected event from untrusted source: ${event.source}`);
      return false;
    }

    // Idempotency check
    if (this.processedIds.has(event.id)) {
      return false; // Duplicate safely dropped
    }

    this.processedIds.add(event.id);
    this.idQueue.push(event.id);
    if (this.idQueue.length > this.maxCacheSize) {
      const evicted = this.idQueue.shift();
      if (evicted) this.processedIds.delete(evicted);
    }

    // Authoritative State Mutation
    this.applyStateMutation(event);

    // Broadcast to WebSocket clients
    this.subscribers.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error('[ServerEventBus] Error in event listener:', err);
      }
    });

    return true;
  }

  private applyStateMutation(event: CampusNormalizedEvent): void {
    const timeStr = event.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    switch (event.type) {
      case 'MQ2_READING': {
        const { sensorId, ppm, status, ventilationActive } = event.payload;
        const sensor = db.sensors.get(sensorId);
        if (sensor) {
          sensor.currentValue = ppm;
          sensor.status = status;
          sensor.lastReading = new Date().toISOString();
        }

        // Update zone fans and power
        const zone = db.zones.get('ZONE-SCI-204');
        if (zone) {
          zone.fansState = status === 'NORMAL' ? 'on' : 'off';
          zone.currentPowerKw = status === 'NORMAL' ? 1.8 : 1.1;
        }

        // If elevated/critical, ensure incident exists
        if (status !== 'NORMAL') {
          const incId = 'INC-GAS-003';
          const existing = db.incidents.get(incId);
          if (!existing) {
            db.createIncident({
              id: incId,
              event: 'MQ-2 Gas Sensor Elevated',
              location: 'Science Block · Lab 204',
              zone: 'Science & Physics Lab',
              severity: status === 'CRITICAL' ? 'critical' : 'warning',
              source: event.source === 'simulation' ? 'simulation' : 'live',
              status: 'open',
              timestamp: timeStr,
              description: `Electrochemical MQ-2 sensor detected ${ppm} ppm. Damper isolation engaged.`,
              telemetry: {
                ppm,
                threshold: 500,
                ventilationActive,
              },
              auditTimeline: [
                { time: timeStr, action: `Threshold violation registered on backend (${ppm} ppm).`, actor: 'SAFETY GATEWAY' }
              ]
            }).catch(err => console.error('[ServerEventBus] Failed to persist gas incident:', err));
          }
        }
        break;
      }

      case 'PIR_MOTION': {
        const { zoneId, state } = event.payload;
        const zone = Array.from(db.zones.values()).find(z => z.zoneName === zoneId || z.id === zoneId);
        if (zone) {
          zone.occupancy = state === 'MOTION' ? 'occupied' : 'vacant';
          zone.lastMotionTime = state === 'MOTION' ? 'Just now' : zone.lastMotionTime;
        }

        const actEvent: CampusEvent = {
          id: `EVT-ACT-${Date.now()}`,
          time: timeStr,
          eventType: state === 'MOTION' ? 'Motion Detected' : 'Motion Cleared',
          location: zoneId,
          resultingAction: state === 'MOTION' ? 'Zone occupancy updated to active' : 'Zone occupancy idle',
          severity: state === 'MOTION' ? 'warning' : 'info',
          source: event.source === 'simulation' ? 'simulation' : 'live',
        };
        db.addActivityEvent(actEvent);
        break;
      }

      case 'ACCESS_GRANTED': {
        const { doorId, cardholder } = event.payload;
        const door = db.accessControllers.get(doorId);
        if (door) {
          door.lockStatus = 'unlocked';
          door.failedAttempts = 0;
          door.isSecurityAlert = false;
          door.lastEventText = `Access Granted: ${cardholder}`;
          door.lastEventTime = timeStr;

          // Pulse lock back to secured after 8s
          setTimeout(() => {
            door.lockStatus = 'locked';
          }, 8000);
        }

        const audit: AuditRecord = {
          id: `AUD-ACC-${Date.now().toString().slice(-4)}`,
          timestamp: timeStr,
          actor: cardholder || 'Authorized Personnel',
          role: 'security_officer',
          action: 'ACCESS_GRANTED',
          target: doorId,
          result: 'SUCCESS',
          details: 'Credential accepted at access portal',
          zone: door?.zone || 'Access Control Post',
        };
        db.addAuditRecord(audit);
        break;
      }

      case 'ACCESS_DENIED': {
        const { doorId, reason, failedAttempts } = event.payload;
        const door = db.accessControllers.get(doorId);
        if (door) {
          door.failedAttempts = failedAttempts;
          door.lastEventText = `Access Denied: ${reason}`;
          door.lastEventTime = timeStr;
        }

        const audit: AuditRecord = {
          id: `AUD-DENY-${Date.now().toString().slice(-4)}`,
          timestamp: timeStr,
          actor: 'Unknown Person',
          role: 'student',
          action: 'ACCESS_DENIED',
          target: doorId,
          result: 'DENIED',
          details: reason,
          zone: door?.zone || 'Access Control Post',
        };
        db.addAuditRecord(audit);
        break;
      }

      case 'ACCESS_LOCKOUT': {
        const { doorId, consecutiveFailures, durationSeconds } = event.payload;
        const door = db.accessControllers.get(doorId);
        if (door) {
          door.lockStatus = 'locked';
          door.keypadStatus = 'alert';
          door.isSecurityAlert = true;
          door.failedAttempts = consecutiveFailures;
          door.lastEventText = `SECURITY LOCKOUT: ${consecutiveFailures} consecutive violations`;
          door.lastEventTime = timeStr;
        }

        const audit: AuditRecord = {
          id: `AUD-LOCKOUT-${Date.now().toString().slice(-4)}`,
          timestamp: timeStr,
          actor: 'SECURITY SYSTEM',
          role: 'admin',
          action: 'PORTAL_LOCKOUT_ENGAGED',
          target: doorId,
          result: 'ESCALATED',
          details: `Portal locked out for ${durationSeconds}s following ${consecutiveFailures} violations`,
          zone: door?.zone || 'Access Control Post',
        };
        db.addAuditRecord(audit);
        break;
      }

      case 'ZONE_LOCKDOWN': {
        const { zoneName, action, actor } = event.payload;
        Array.from(db.accessControllers.values()).forEach(door => {
          if (door.zone.toLowerCase().includes(zoneName.toLowerCase()) || door.building.toLowerCase().includes(zoneName.toLowerCase())) {
            door.lockStatus = action === 'LOCKDOWN' ? 'locked' : 'unlocked';
            door.keypadStatus = action === 'LOCKDOWN' ? 'alert' : 'normal';
            door.isSecurityAlert = action === 'LOCKDOWN';
            door.lastEventText = `Zone ${action} by ${actor}`;
            door.lastEventTime = timeStr;
          }
        });

        const audit: AuditRecord = {
          id: `AUD-LOCKDOWN-${Date.now().toString().slice(-4)}`,
          timestamp: timeStr,
          actor,
          role: 'admin',
          action: `ZONE_${action}`,
          target: zoneName,
          result: 'SUCCESS',
          details: `Perimeter interlocks commanded to ${action} state`,
          zone: zoneName,
        };
        db.addAuditRecord(audit);
        break;
      }

      case 'INCIDENT_DETECTED': {
        const { incidentId, title, zone, severity, details, telemetry } = event.payload;
        const incidentObj = {
          id: incidentId,
          event: title,
          location: zone,
          zone,
          severity,
          source: event.source === 'simulation' ? 'simulation' : 'live',
          status: 'open',
          timestamp: timeStr,
          description: details,
          telemetry,
          auditTimeline: [
            { time: timeStr, action: `Incident created by backend event processor: ${title}`, actor: 'SYSTEM' }
          ]
        };
        db.createIncident(incidentObj as any).catch(err => console.error('[ServerEventBus] createIncident failed:', err));
        break;
      }

      case 'INCIDENT_ACKNOWLEDGED': {
        const { incidentId, actor } = event.payload;
        const inc = db.incidents.get(incidentId);
        if (inc) {
          inc.status = 'acknowledged';
          inc.auditTimeline.push({ time: timeStr, action: 'Acknowledged by responder', actor });
          db.updateIncident(inc).catch(err => console.error('[ServerEventBus] updateIncident failed:', err));
        }
        break;
      }

      case 'INCIDENT_INVESTIGATING': {
        const { incidentId, actor } = event.payload;
        const inc = db.incidents.get(incidentId);
        if (inc) {
          inc.status = 'investigating';
          inc.assignedOfficer = actor;
          inc.auditTimeline.push({ time: timeStr, action: `Tactical investigation dispatched by ${actor}`, actor });
          db.updateIncident(inc).catch(err => console.error('[ServerEventBus] updateIncident failed:', err));
        }
        break;
      }

      case 'INCIDENT_RESOLVED': {
        const { incidentId, actor, resolutionNotes } = event.payload;
        if (incidentId === 'ALL-SIMULATIONS') {
          Array.from(db.incidents.values()).forEach(inc => {
            if (inc.source === 'simulation') {
              inc.status = 'resolved';
              inc.resolvedAt = timeStr;
              inc.auditTimeline.push({ time: timeStr, action: 'Simulation reset completed', actor });
              db.updateIncident(inc).catch(err => console.error('[ServerEventBus] updateIncident failed:', err));
            }
          });
        } else {
          const inc = db.incidents.get(incidentId);
          if (inc) {
            inc.status = 'resolved';
            inc.resolvedAt = timeStr;
            inc.auditTimeline.push({ time: timeStr, action: resolutionNotes || `Resolved by ${actor}`, actor });
            db.updateIncident(inc).catch(err => console.error('[ServerEventBus] updateIncident failed:', err));
          }
        }
        break;
      }

      case 'CAMERA_STREAM_STATE': {
        const { cameraId, status } = event.payload;
        const cam = db.cameras.get(cameraId);
        if (cam) {
          cam.status = status === 'offline' ? 'offline' : status === 'degraded' ? 'simulation' : 'live';
        }
        break;
      }
    }
  }
}

export const serverEventBus = ServerEventBus.getInstance();
export default serverEventBus;
