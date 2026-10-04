import type { AuditRecord } from './index';

export type CampusEventCategory =
  | 'CAMERA'
  | 'ACCESS'
  | 'PIR'
  | 'MQ2'
  | 'ENERGY'
  | 'IOT'
  | 'INCIDENT'
  | 'ZONE'
  | 'SYSTEM'
  | 'USER'
  | 'AUDIT';

export type EventSourceType =
  | 'live'
  | 'simulation'
  | 'mqtt'
  | 'wiegand'
  | 'rtsp_analytics'
  | 'modbus'
  | 'system';

export type EventSeverity = 'info' | 'warning' | 'critical';

export interface BaseCampusEvent<TCat extends CampusEventCategory, TType extends string, TPayload = unknown> {
  id: string;
  timestamp: string; // ISO 8601 or formatted operational time string
  category: TCat;
  type: TType;
  source: EventSourceType;
  zoneId?: string;
  deviceId?: string;
  severity: EventSeverity;
  payload: TPayload;
  correlationId?: string;
}

// Concrete Event Definitions
export type CameraStreamStateEvent = BaseCampusEvent<
  'CAMERA',
  'CAMERA_STREAM_STATE',
  { cameraId: string; status: 'online' | 'degraded' | 'offline'; fps?: number; resolution?: string; reason?: string }
>;

export type CameraMotionEvent = BaseCampusEvent<
  'CAMERA',
  'CAMERA_MOTION_DETECTED',
  { cameraId: string; boundingBox?: [number, number, number, number]; confidence?: number }
>;

export type CameraPtzEvent = BaseCampusEvent<
  'CAMERA',
  'CAMERA_PTZ_ACTION',
  { cameraId: string; action: 'PAN_LEFT' | 'PAN_RIGHT' | 'TILT_UP' | 'TILT_DOWN' | 'ZOOM_IN' | 'ZOOM_OUT' | 'RESET' }
>;

export type CameraSnapshotEvent = BaseCampusEvent<
  'CAMERA',
  'CAMERA_SNAPSHOT_CAPTURED',
  { cameraId: string; snapshotUrl?: string; filename: string }
>;

export type AccessRequestEvent = BaseCampusEvent<
  'ACCESS',
  'ACCESS_REQUEST',
  { doorId: string; pinMasked: string; method: 'keypad' | 'wiegand' | 'card' }
>;

export type AccessGrantedEvent = BaseCampusEvent<
  'ACCESS',
  'ACCESS_GRANTED',
  { doorId: string; cardholder?: string; clearance: string }
>;

export type AccessDeniedEvent = BaseCampusEvent<
  'ACCESS',
  'ACCESS_DENIED',
  { doorId: string; reason: string; failedAttempts: number }
>;

export type AccessLockoutEvent = BaseCampusEvent<
  'ACCESS',
  'ACCESS_LOCKOUT',
  { doorId: string; consecutiveFailures: number; durationSeconds: number }
>;

export type AccessOverrideEvent = BaseCampusEvent<
  'ACCESS',
  'ACCESS_OVERRIDE',
  { doorId: string; actor: string; reason: string; state: 'locked' | 'unlocked' }
>;

export type PirMotionEvent = BaseCampusEvent<
  'PIR',
  'PIR_MOTION',
  { zoneId: string; state: 'MOTION' | 'CLEAR'; durationSec?: number }
>;

export type MQ2ReadingEvent = BaseCampusEvent<
  'MQ2',
  'MQ2_READING',
  { sensorId: string; ppm: number; threshold: number; status: 'NORMAL' | 'ELEVATED' | 'CRITICAL'; ventilationActive: boolean; location?: string }
>;

export type EnergyDemandEvent = BaseCampusEvent<
  'ENERGY',
  'ENERGY_DEMAND',
  { zoneId: string; currentPowerKw: number; powerFactor?: number }
>;

export type IoTDeviceStatusEvent = BaseCampusEvent<
  'IOT',
  'IOT_DEVICE_STATUS',
  { deviceId: string; status: 'online' | 'offline' | 'warning' | 'critical'; batteryPct?: number; ipAddress?: string }
>;

export type IncidentDetectedEvent = BaseCampusEvent<
  'INCIDENT',
  'INCIDENT_DETECTED',
  { incidentId: string; title: string; zone: string; severity: EventSeverity; details: string; telemetry?: Record<string, string | number | boolean> }
>;

export type IncidentAcknowledgedEvent = BaseCampusEvent<
  'INCIDENT',
  'INCIDENT_ACKNOWLEDGED',
  { incidentId: string; actor: string; timestamp: string }
>;

export type IncidentInvestigatingEvent = BaseCampusEvent<
  'INCIDENT',
  'INCIDENT_INVESTIGATING',
  { incidentId: string; actor: string; timestamp: string }
>;

export type IncidentResolvedEvent = BaseCampusEvent<
  'INCIDENT',
  'INCIDENT_RESOLVED',
  { incidentId: string; actor: string; timestamp: string; resolutionNotes?: string }
>;

export type ZoneLockdownEvent = BaseCampusEvent<
  'ZONE',
  'ZONE_LOCKDOWN',
  { zoneName: string; action: 'LOCKDOWN' | 'RELEASE'; actor: string; doorsAffected: string[] }
>;

export type ZoneOccupancyEvent = BaseCampusEvent<
  'ZONE',
  'ZONE_OCCUPANCY',
  { zoneId: string; state: 'occupied' | 'vacant'; occupantCount: number }
>;

export type SystemHealthEvent = BaseCampusEvent<
  'SYSTEM',
  'SYSTEM_HEALTH',
  { component: 'API' | 'WEBSOCKET' | 'MQTT' | 'CAMERA_GATEWAY' | 'DATABASE'; status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN'; latencyMs?: number; details?: string }
>;

export type SystemConnectionEvent = BaseCampusEvent<
  'SYSTEM',
  'SYSTEM_CONNECTION',
  { state: 'CONNECTING' | 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'RECONNECTING' | 'ERROR'; reconnectAttempts: number; url?: string }
>;

export type UserRoleEvent = BaseCampusEvent<
  'USER',
  'USER_ROLE_CHANGED',
  { previousRole: string; newRole: string; actor: string }
>;

export type AuditSecurityEvent = BaseCampusEvent<
  'AUDIT',
  'AUDIT_RECORD',
  { record: AuditRecord }
>;

// Discriminated Union of all valid normalized events
export type CampusNormalizedEvent =
  | CameraStreamStateEvent
  | CameraMotionEvent
  | CameraPtzEvent
  | CameraSnapshotEvent
  | AccessRequestEvent
  | AccessGrantedEvent
  | AccessDeniedEvent
  | AccessLockoutEvent
  | AccessOverrideEvent
  | PirMotionEvent
  | MQ2ReadingEvent
  | EnergyDemandEvent
  | IoTDeviceStatusEvent
  | IncidentDetectedEvent
  | IncidentAcknowledgedEvent
  | IncidentInvestigatingEvent
  | IncidentResolvedEvent
  | ZoneLockdownEvent
  | ZoneOccupancyEvent
  | SystemHealthEvent
  | SystemConnectionEvent
  | UserRoleEvent
  | AuditSecurityEvent;

export type EventCallback<T extends CampusNormalizedEvent = CampusNormalizedEvent> = (event: T) => void;
