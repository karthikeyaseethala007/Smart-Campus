export type UserRole = 'admin' | 'security_officer' | 'faculty' | 'student';

export type DeviceStatus = 'online' | 'offline' | 'warning' | 'critical';

export type DeviceCategory = 
  | 'motion' 
  | 'smoke' 
  | 'fire' 
  | 'keypad' 
  | 'door_lock' 
  | 'light' 
  | 'fan' 
  | 'power_meter' 
  | 'camera';

export type IncidentSeverity = 'info' | 'warning' | 'critical';

export type IncidentStatus = 'open' | 'acknowledged' | 'resolved';

export type EventSource = 'live' | 'simulation';

export interface CampusAlert {
  id: string;
  title: string;
  location: string;
  timestamp: string;
  severity: IncidentSeverity;
  source: EventSource;
  details: string;
  incidentId?: string;
  doorId?: string;
  deviceId?: string;
  acknowledged: boolean;
}

export interface IncidentAuditItem {
  time: string;
  action: string;
  actor: string;
  notes?: string;
}

export interface CampusIncident {
  id: string;
  event: string;
  location: string;
  zone: string;
  severity: IncidentSeverity;
  source: EventSource;
  status: IncidentStatus;
  timestamp: string;
  resolvedAt?: string;
  assignedOfficer?: string;
  description: string;
  telemetry?: Record<string, string | number | boolean>;
  auditTimeline: IncidentAuditItem[];
}

export interface CampusEvent {
  id: string;
  time: string;
  eventType: string;
  location: string;
  resultingAction: string;
  severity: IncidentSeverity;
  source: EventSource;
}

export interface ZoneAutomation {
  id: string;
  zoneName: string;
  building: string;
  occupancy: 'occupied' | 'vacant';
  lightsState: 'on' | 'off';
  fansState: 'on' | 'off';
  currentPowerKw: number;
  automationState: 'active' | 'energy_saving' | 'standby';
  lastMotionTime: string;
  occupantCount: number;
}

export interface SmartDoor {
  id: string;
  name: string;
  building: string;
  zone: string;
  lockStatus: 'locked' | 'unlocked';
  keypadStatus: 'normal' | 'alert';
  failedAttempts: number;
  lastEventTime: string;
  lastEventText: string;
  isSecurityAlert: boolean;
  authorizedRoles: UserRole[];
}

export interface IoTDevice {
  id: string;
  name: string;
  category: DeviceCategory;
  location: string;
  zone: string;
  status: DeviceStatus;
  lastUpdated: string;
  batteryPct?: number;
  signalStrength: number;
  ipAddress: string;
  firmware: string;
}

export type CameraStreamState = 'live' | 'offline' | 'simulation';

export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: CameraStreamState;
  resolution: string;
  fps: number;
  ptzCapable: boolean;
  zone: string;
  lastMaintenance: string;
  streamUrl?: string;
  streamError?: string;
  isESP32?: boolean;
}

export type NavigationTab = 
  | 'landing'
  | 'overview' 
  | 'monitoring' 
  | 'security' 
  | 'safety' 
  | 'energy' 
  | 'devices' 
  | 'incidents' 
  | 'automation' 
  | 'users' 
  | 'settings';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

export interface NormalizedDeviceEvent {
  id: string;
  type: string;
  source: EventSource;
  deviceId: string;
  location: string;
  timestamp: string;
  severity: IncidentSeverity;
  payload?: Record<string, string | number | boolean | null | undefined>;
}

export interface AlarmAudioState {
  isRinging: boolean;
  isMuted: boolean;
  autoplayBlocked: boolean;
}

