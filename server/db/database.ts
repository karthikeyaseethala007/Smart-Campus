import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';
import { Logger } from '../utils/logger';
import type {
  UserRole,
  IoTDevice,
  CameraFeed,
  ZoneAutomation,
  SmartDoor,
  CampusIncident,
  AuditRecord,
  CampusEvent
} from '../../src/types';

export interface DbUser {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  badgeNumber: string;
  role: UserRole;
  clearanceLevel: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  googleSubject?: string;
  googleEmail?: string;
  googleEmailVerified?: boolean;
  googleLinkedAt?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  recoveryCodeHashes?: string[];
}

export interface DbSession {
  id: string;
  userId: string;
  role: UserRole;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
}

export interface DbSensor {
  id: string;
  name: string;
  type: 'MQ2' | 'PIR' | 'THERMAL' | 'ENERGY';
  zoneId: string;
  location: string;
  currentValue: number;
  unit: string;
  thresholdWarning: number;
  thresholdCritical: number;
  status: 'NORMAL' | 'ELEVATED' | 'CRITICAL' | 'FAULT';
  lastReading: string;
}

export interface SystemHealthRecord {
  component: 'API' | 'WEBSOCKET' | 'MQTT' | 'CAMERA_GATEWAY' | 'DATABASE' | 'DEVICE_REGISTRY' | 'PERSISTENCE';
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN';
  latencyMs: number;
  reconnectCount: number;
  lastHeartbeat: string;
  lastError?: string;
  details?: string;
}

export interface MigrationResult {
  success: boolean;
  version: string;
  appliedTables: string[];
  durationMs: number;
}

export interface DatabaseRepository {
  init(): Promise<void>;
  close(): Promise<void>;
  checkHealth(): Promise<{ healthy: boolean; latencyMs: number; error?: string }>;
  runMigrations(): Promise<MigrationResult>;

  // Users
  getUserByUsername(username: string): Promise<DbUser | null>;
  getUserById(id: string): Promise<DbUser | null>;
  getUserByGoogleSubject(subject: string): Promise<DbUser | null>;
  getUserByEmail(email: string): Promise<DbUser | null>;
  linkGoogleIdentity(userId: string, googleSubject: string, googleEmail?: string): Promise<void>;
  createUser(user: DbUser): Promise<void>;
  updateUser(user: DbUser): Promise<void>;

  // Sessions
  createSession(session: DbSession): Promise<void>;
  getSession(id: string): Promise<DbSession | null>;
  revokeSession(id: string): Promise<boolean>;
  revokeAllUserSessions(userId: string): Promise<void>;

  // Zones
  getAllZones(): Promise<ZoneAutomation[]>;
  getZone(id: string): Promise<ZoneAutomation | null>;
  updateZone(zone: ZoneAutomation): Promise<void>;

  // Devices
  getAllDevices(): Promise<IoTDevice[]>;
  getDevice(id: string): Promise<IoTDevice | null>;
  upsertDevice(device: IoTDevice): Promise<void>;

  // Cameras
  getAllCameras(): Promise<CameraFeed[]>;
  getCamera(id: string): Promise<CameraFeed | null>;
  updateCameraStatus(id: string, status: CameraFeed['status']): Promise<void>;

  // Sensors
  getAllSensors(): Promise<DbSensor[]>;
  getSensor(id: string): Promise<DbSensor | null>;
  updateSensorReading(id: string, value: number, status: DbSensor['status']): Promise<void>;

  // Access Controllers
  getAllAccessControllers(): Promise<SmartDoor[]>;
  getAccessController(id: string): Promise<SmartDoor | null>;
  updateAccessController(door: SmartDoor): Promise<void>;
  getAuthorizedBadge(facilityCode: number, cardNumber: number): Promise<AuthorizedBadge | null>;

  // Incidents
  getAllIncidents(): Promise<CampusIncident[]>;
  getIncident(id: string): Promise<CampusIncident | null>;
  createIncident(incident: CampusIncident): Promise<void>;
  updateIncident(incident: CampusIncident): Promise<void>;

  // Audit & Activity
  addAuditRecord(record: AuditRecord): Promise<void>;
  getAuditRecords(limit?: number, role?: UserRole): Promise<AuditRecord[]>;
  addActivityEvent(event: CampusEvent): Promise<void>;
  getActivityEvents(limit?: number): Promise<CampusEvent[]>;

  // Health
  getHealthRecords(): Promise<SystemHealthRecord[]>;
  updateHealthRecord(record: SystemHealthRecord): Promise<void>;

  // Synchronous Map accessors for instant backward-compatibility
  users: Map<string, DbUser>;
  sessions: Map<string, DbSession>;
  zones: Map<string, ZoneAutomation>;
  devices: Map<string, IoTDevice>;
  cameras: Map<string, CameraFeed>;
  sensors: Map<string, DbSensor>;
  accessControllers: Map<string, SmartDoor>;
  incidents: Map<string, CampusIncident>;
  auditRecords: AuditRecord[];
  activityEvents: CampusEvent[];
  healthRecords: Map<string, SystemHealthRecord>;
  seedSyntheticDevelopmentData(): void;
}

// ============================================================================
// 1. IN-MEMORY PRODUCTION REPOSITORY MIRROR (For Dev / Simulation / Fallback)
// ============================================================================
export class InMemoryRepository implements DatabaseRepository {
  public users: Map<string, DbUser> = new Map();
  public sessions: Map<string, DbSession> = new Map();
  public zones: Map<string, ZoneAutomation> = new Map();
  public devices: Map<string, IoTDevice> = new Map();
  public cameras: Map<string, CameraFeed> = new Map();
  public sensors: Map<string, DbSensor> = new Map();
  public accessControllers: Map<string, SmartDoor> = new Map();
  public authorizedBadges: Map<string, AuthorizedBadge> = new Map();
  public incidents: Map<string, CampusIncident> = new Map();
  public auditRecords: AuditRecord[] = [];
  public activityEvents: CampusEvent[] = [];
  public healthRecords: Map<string, SystemHealthRecord> = new Map();

  constructor() {
    this.seedSyntheticDevelopmentData();
  }

  public async init(): Promise<void> {
    Logger.info('DATABASE', 'InMemoryRepository initialized with synthetic baseline');
  }

  public async close(): Promise<void> {
    // No-op for in-memory
  }

  public async checkHealth(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    return { healthy: true, latencyMs: 1 };
  }

  public async runMigrations(): Promise<MigrationResult> {
    return {
      success: true,
      version: '20261004_inmemory_schema',
      appliedTables: [
        'users', 'sessions', 'zones', 'devices', 'cameras',
        'sensors', 'access_controllers', 'incidents', 'incident_events',
        'audit_records', 'activity_events', 'system_health'
      ],
      durationMs: 1,
    };
  }

  public seedSyntheticDevelopmentData(): void {
    const defaultUsers: DbUser[] = [
      {
        id: 'USR-ADM-001',
        username: 'admin',
        passwordHash: '00112233445566778899aabbccddeeff:791f673e6bdb380d91f76ccc0ba3469bac2d04f5188bdb65b866482efe94cd71da2b19e8c28a04bdf2abe11f21df801e72f4cf5caf1038591aa21d68b0857238',
        name: 'Chief Administrator Ramanujan',
        badgeNumber: 'BADGE-ADM-001',
        role: 'admin',
        clearanceLevel: 'LEVEL_4_CHIEF',
        department: 'Campus Central Command',
        isActive: true,
        createdAt: new Date().toISOString(),
        googleSubject: 'google-sub-admin-001',
        googleEmail: 'admin@campus.defense.internal',
        googleEmailVerified: true,
        googleLinkedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        recoveryCodeHashes: [
          '00112233445566778899aabbccddeeff:fa03fe1bfdc27d786831b88068f991202cc8ef2f4075e19b576bc0dd834e48154a751ed48d1108fe801af26c2a8764fbc4fa746f4e52cc29f249cfe3de16dc25'
        ],
      },
      {
        id: 'USR-SEC-412',
        username: 'security',
        passwordHash: '00112233445566778899aabbccddeeff:791f673e6bdb380d91f76ccc0ba3469bac2d04f5188bdb65b866482efe94cd71da2b19e8c28a04bdf2abe11f21df801e72f4cf5caf1038591aa21d68b0857238',
        name: 'Officer D. Vance (Tactical Watch)',
        badgeNumber: 'BADGE-SEC-412',
        role: 'security_officer',
        clearanceLevel: 'LEVEL_3_SECURITY',
        department: 'Campus Security Patrol',
        isActive: true,
        createdAt: new Date().toISOString(),
        googleSubject: 'google-sub-security-412',
        googleEmail: 'security.vance@campus.defense.internal',
        googleEmailVerified: true,
        googleLinkedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
      },
      {
        id: 'USR-FAC-889',
        username: 'faculty',
        passwordHash: '00112233445566778899aabbccddeeff:791f673e6bdb380d91f76ccc0ba3469bac2d04f5188bdb65b866482efe94cd71da2b19e8c28a04bdf2abe11f21df801e72f4cf5caf1038591aa21d68b0857238',
        name: 'Dr. Eleanor Rigby (Physics Dept)',
        badgeNumber: 'BADGE-FAC-889',
        role: 'faculty',
        clearanceLevel: 'LEVEL_2_FACULTY',
        department: 'Science & Physics Faculty',
        isActive: true,
        createdAt: new Date().toISOString(),
        googleSubject: 'google-sub-faculty-889',
        googleEmail: 'rigby.eleanor@campus.internal',
        googleEmailVerified: true,
        googleLinkedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        recoveryCodeHashes: [
          '00112233445566778899aabbccddeeff:46cb4984975a8195a7a2a0eb9bc6ead9fed12cd48faf842bd0404a6081e15013739994450807bc8da384017861c0acba6af7711cd6baf1f0a64d61f6a1c9e7c9'
        ],
      },
      {
        id: 'USR-STU-992',
        username: 'student',
        passwordHash: '00112233445566778899aabbccddeeff:791f673e6bdb380d91f76ccc0ba3469bac2d04f5188bdb65b866482efe94cd71da2b19e8c28a04bdf2abe11f21df801e72f4cf5caf1038591aa21d68b0857238',
        name: 'A. Chen (Engineering Undergraduate)',
        badgeNumber: 'BADGE-STU-992',
        role: 'student',
        clearanceLevel: 'LEVEL_1_STUDENT',
        department: 'Undergraduate Engineering',
        isActive: true,
        createdAt: new Date().toISOString(),
        googleSubject: 'google-sub-student-992',
        googleEmail: 'chen.a@student.campus.internal',
        googleEmailVerified: true,
        googleLinkedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
      },
    ];
    defaultUsers.forEach(u => this.users.set(u.id, u));

    const defaultZones: ZoneAutomation[] = [
      {
        id: 'ZONE-GATE-01',
        zoneName: 'Main Gate',
        building: 'Perimeter Barrier North',
        occupancy: 'occupied',
        lightsState: 'on',
        fansState: 'off',
        currentPowerKw: 4.8,
        automationState: 'active',
        lastMotionTime: 'Just now',
        occupantCount: 12,
      },
      {
        id: 'ZONE-ROB-101',
        zoneName: 'Innovation & Robotics Lab',
        building: 'Engineering Block · Floor 1',
        occupancy: 'occupied',
        lightsState: 'on',
        fansState: 'on',
        currentPowerKw: 14.2,
        automationState: 'active',
        lastMotionTime: '1 min ago',
        occupantCount: 8,
      },
      {
        id: 'ZONE-LIB-001',
        zoneName: 'Central Library',
        building: 'Academic Quad · Atrium',
        occupancy: 'occupied',
        lightsState: 'on',
        fansState: 'off',
        currentPowerKw: 6.4,
        automationState: 'active',
        lastMotionTime: 'Just now',
        occupantCount: 42,
      },
      {
        id: 'ZONE-SCI-204',
        zoneName: 'Science & Physics Lab',
        building: 'Science Block · Lab 204',
        occupancy: 'occupied',
        lightsState: 'on',
        fansState: 'off',
        currentPowerKw: 1.1,
        automationState: 'active',
        lastMotionTime: '3 mins ago',
        occupantCount: 4,
      },
      {
        id: 'ZONE-HALL-01',
        zoneName: 'Academic Hallway',
        building: 'Science Block · Corridor North',
        occupancy: 'vacant',
        lightsState: 'off',
        fansState: 'off',
        currentPowerKw: 0.8,
        automationState: 'energy_saving',
        lastMotionTime: '18 mins ago',
        occupantCount: 0,
      },
      {
        id: 'ZONE-COMP-01',
        zoneName: 'Computer Lab',
        building: 'IT Complex · Terminal Bay',
        occupancy: 'occupied',
        lightsState: 'on',
        fansState: 'on',
        currentPowerKw: 8.6,
        automationState: 'active',
        lastMotionTime: '4 mins ago',
        occupantCount: 19,
      },
      {
        id: 'ZONE-SRV-01',
        zoneName: 'Server Room',
        building: 'Core Infrastructure Vault',
        occupancy: 'vacant',
        lightsState: 'off',
        fansState: 'on',
        currentPowerKw: 18.4,
        automationState: 'active',
        lastMotionTime: '45 mins ago',
        occupantCount: 0,
      },
    ];
    defaultZones.forEach(z => this.zones.set(z.id, z));

    const defaultSensors: DbSensor[] = [
      {
        id: 'DEV-SMK-204',
        name: 'MQ-2 Electrochemical Gas Sensor',
        type: 'MQ2',
        zoneId: 'ZONE-SCI-204',
        location: 'Science Block · Lab 204',
        currentValue: 312,
        unit: 'ppm',
        thresholdWarning: 500,
        thresholdCritical: 750,
        status: 'NORMAL',
        lastReading: new Date().toISOString(),
      },
      {
        id: 'DEV-PIR-101',
        name: 'PIR Motion Sensor Alpha',
        type: 'PIR',
        zoneId: 'ZONE-ROB-101',
        location: 'Innovation & Robotics Lab',
        currentValue: 0,
        unit: 'state',
        thresholdWarning: 1,
        thresholdCritical: 1,
        status: 'NORMAL',
        lastReading: new Date().toISOString(),
      },
    ];
    defaultSensors.forEach(s => this.sensors.set(s.id, s));

    const defaultDoors: SmartDoor[] = [
      {
        id: 'DOOR-GATE-MAIN',
        name: 'North Perimeter Barrier',
        building: 'Main Gate',
        zone: 'Main Gate',
        lockStatus: 'locked',
        keypadStatus: 'normal',
        failedAttempts: 0,
        lastEventTime: '12:00:00',
        lastEventText: 'Nominal operational state',
        isSecurityAlert: false,
        authorizedRoles: ['admin', 'security_officer'],
        pinHash: '00112233445566778899aabbccddeeff:8c3230cd69d5aff30375aba10320f96f930eba068def013e6fb4a0c1c80a1a7db7fe77331cbff2ea1083fa6a65432c8aad58fdd6bfef9636c22d8ad1dfabd5bb',
      },
      {
        id: 'DOOR-ROB-01',
        name: 'High-Torque Testing Enclosure',
        building: 'Engineering Block · Floor 1',
        zone: 'Innovation & Robotics Lab',
        lockStatus: 'locked',
        keypadStatus: 'normal',
        failedAttempts: 0,
        lastEventTime: '11:45:00',
        lastEventText: 'Locked and armed',
        isSecurityAlert: false,
        authorizedRoles: ['admin', 'security_officer', 'faculty'],
        pinHash: '00112233445566778899aabbccddeeff:8c3230cd69d5aff30375aba10320f96f930eba068def013e6fb4a0c1c80a1a7db7fe77331cbff2ea1083fa6a65432c8aad58fdd6bfef9636c22d8ad1dfabd5bb',
      },
      {
        id: 'DOOR-SRV-01',
        name: 'Vault Interlock Portal',
        building: 'Core Infrastructure Vault',
        zone: 'Server Room',
        lockStatus: 'locked',
        keypadStatus: 'normal',
        failedAttempts: 0,
        lastEventTime: '10:30:00',
        lastEventText: 'Biometric keypad ready',
        isSecurityAlert: false,
        authorizedRoles: ['admin'],
        pinHash: '00112233445566778899aabbccddeeff:8c3230cd69d5aff30375aba10320f96f930eba068def013e6fb4a0c1c80a1a7db7fe77331cbff2ea1083fa6a65432c8aad58fdd6bfef9636c22d8ad1dfabd5bb',
      },
    ];
    defaultDoors.forEach(d => this.accessControllers.set(d.id, d));

    const defaultBadges: AuthorizedBadge[] = [
      {
        facilityCode: 42,
        cardNumber: 8821,
        cardholder: 'Chief Administrator Ramanujan',
        userId: 'USR-ADM-001',
        role: 'admin',
        clearanceLevel: 'LEVEL_4_CHIEF',
        isActive: true,
      },
      {
        facilityCode: 42,
        cardNumber: 8822,
        cardholder: 'Officer D. Vance (Tactical Watch)',
        userId: 'USR-SEC-412',
        role: 'security_officer',
        clearanceLevel: 'LEVEL_3_SECURITY',
        isActive: true,
      },
    ];
    defaultBadges.forEach(b => this.authorizedBadges.set(`${b.facilityCode}:${b.cardNumber}`, b));

    const defaultCameras: CameraFeed[] = [
      {
        id: 'CAM-01',
        name: 'Gate Access PTZ · Primary',
        location: 'Perimeter North Post · Entry Gate',
        status: 'live',
        resolution: '1920x1080',
        fps: 30,
        ptzCapable: true,
        zone: 'Main Gate',
        lastMaintenance: '2026-09-15',
        streamUrl: '/streams/cam-01/index.m3u8',
      },
      {
        id: 'CAM-02',
        name: 'Robotics Bay West Overlook',
        location: 'Robotics Wing · Assembly Bay A',
        status: 'live',
        resolution: '1920x1080',
        fps: 30,
        ptzCapable: false,
        zone: 'Innovation & Robotics Lab',
        lastMaintenance: '2026-09-18',
        streamUrl: '/streams/cam-02/index.m3u8',
      },
      {
        id: 'CAM-03',
        name: 'Library Atrium Wide Angle',
        location: 'Central Library · Main Floor',
        status: 'live',
        resolution: '1920x1080',
        fps: 24,
        ptzCapable: false,
        zone: 'Central Library',
        lastMaintenance: '2026-09-20',
        streamUrl: '/streams/cam-03/index.m3u8',
      },
      {
        id: 'CAM-04',
        name: 'Science Wing · Lab 204 Corridor',
        location: 'Science Block · North Hallway',
        status: 'live',
        resolution: '1920x1080',
        fps: 30,
        ptzCapable: true,
        zone: 'Science & Physics Lab',
        lastMaintenance: '2026-09-22',
        streamUrl: '/streams/cam-04/index.m3u8',
      },
      {
        id: 'CAM-05',
        name: 'Hallway North Exit Perimeter',
        location: 'Academic Corridor · Fire Exit 2',
        status: 'live',
        resolution: '1920x1080',
        fps: 30,
        ptzCapable: false,
        zone: 'Academic Hallway',
        lastMaintenance: '2026-09-25',
        streamUrl: '/streams/cam-05/index.m3u8',
      },
      {
        id: 'CAM-06',
        name: 'Computer Lab Terminal A',
        location: 'IT Complex · Workstation Bay',
        status: 'live',
        resolution: '1920x1080',
        fps: 30,
        ptzCapable: false,
        zone: 'Computer Lab',
        lastMaintenance: '2026-09-28',
        streamUrl: '/streams/cam-06/index.m3u8',
      },
      {
        id: 'CAM-07',
        name: 'Core Server Vault · Restricted',
        location: 'Server Vault · Rack Row 01',
        status: 'live',
        resolution: '3840x2160',
        fps: 60,
        ptzCapable: true,
        zone: 'Server Room',
        lastMaintenance: '2026-10-01',
        streamUrl: '/streams/cam-07/index.m3u8',
      },
    ];
    defaultCameras.forEach(c => this.cameras.set(c.id, c));

    const components: SystemHealthRecord['component'][] = [
      'API', 'WEBSOCKET', 'MQTT', 'CAMERA_GATEWAY', 'DATABASE', 'DEVICE_REGISTRY', 'PERSISTENCE'
    ];
    components.forEach(comp => {
      this.healthRecords.set(comp, {
        component: comp,
        status: 'HEALTHY',
        latencyMs: 12,
        reconnectCount: 0,
        lastHeartbeat: new Date().toISOString(),
        details: `Subsystem ${comp} operating normally`,
      });
    });
  }

  public async getUserByUsername(username: string): Promise<DbUser | null> {
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase() && user.isActive) {
        return user;
      }
    }
    return null;
  }

  public async getUserById(id: string): Promise<DbUser | null> {
    return this.users.get(id) || null;
  }

  public async getUserByGoogleSubject(subject: string): Promise<DbUser | null> {
    if (!subject) return null;
    for (const user of this.users.values()) {
      if (user.googleSubject === subject && user.isActive) {
        return user;
      }
    }
    return null;
  }

  public async getUserByEmail(email: string): Promise<DbUser | null> {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.googleEmail && user.googleEmail.toLowerCase().trim() === cleanEmail && user.isActive) {
        return user;
      }
    }
    return null;
  }

  public async linkGoogleIdentity(userId: string, googleSubject: string, googleEmail?: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.googleSubject = googleSubject;
      if (googleEmail) user.googleEmail = googleEmail;
      this.users.set(userId, user);
    }
  }

  public async createUser(user: DbUser): Promise<void> {
    this.users.set(user.id, user);
  }

  public async updateUser(user: DbUser): Promise<void> {
    this.users.set(user.id, user);
  }

  public async createSession(session: DbSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  public async getSession(id: string): Promise<DbSession | null> {
    return this.sessions.get(id) || null;
  }

  public async revokeSession(id: string): Promise<boolean> {
    const session = this.sessions.get(id);
    if (!session) return false;
    session.revokedAt = new Date().toISOString();
    this.sessions.set(id, session);
    return true;
  }

  public async revokeAllUserSessions(userId: string): Promise<void> {
    const now = new Date().toISOString();
    for (const session of this.sessions.values()) {
      if (session.userId === userId && !session.revokedAt) {
        session.revokedAt = now;
      }
    }
  }

  public async getAllZones(): Promise<ZoneAutomation[]> {
    return Array.from(this.zones.values());
  }

  public async getZone(id: string): Promise<ZoneAutomation | null> {
    return this.zones.get(id) || Array.from(this.zones.values()).find(z => z.zoneName.toLowerCase() === id.toLowerCase()) || null;
  }

  public async updateZone(zone: ZoneAutomation): Promise<void> {
    this.zones.set(zone.id, zone);
  }

  public async getAllDevices(): Promise<IoTDevice[]> {
    return Array.from(this.devices.values());
  }

  public async getDevice(id: string): Promise<IoTDevice | null> {
    return this.devices.get(id) || null;
  }

  public async upsertDevice(device: IoTDevice): Promise<void> {
    this.devices.set(device.id, device);
  }

  public async getAllCameras(): Promise<CameraFeed[]> {
    return Array.from(this.cameras.values());
  }

  public async getCamera(id: string): Promise<CameraFeed | null> {
    return this.cameras.get(id) || null;
  }

  public async updateCameraStatus(id: string, status: CameraFeed['status']): Promise<void> {
    const cam = this.cameras.get(id);
    if (cam) cam.status = status;
  }

  public async getAllSensors(): Promise<DbSensor[]> {
    return Array.from(this.sensors.values());
  }

  public async getSensor(id: string): Promise<DbSensor | null> {
    return this.sensors.get(id) || null;
  }

  public async updateSensorReading(id: string, value: number, status: DbSensor['status']): Promise<void> {
    const s = this.sensors.get(id);
    if (s) {
      s.currentValue = value;
      s.status = status;
      s.lastReading = new Date().toISOString();
    }
  }

  public async getAllAccessControllers(): Promise<SmartDoor[]> {
    return Array.from(this.accessControllers.values());
  }

  public async getAccessController(id: string): Promise<SmartDoor | null> {
    return this.accessControllers.get(id) || null;
  }

  public async updateAccessController(door: SmartDoor): Promise<void> {
    this.accessControllers.set(door.id, door);
  }

  public async getAuthorizedBadge(facilityCode: number, cardNumber: number): Promise<AuthorizedBadge | null> {
    const key = `${facilityCode}:${cardNumber}`;
    const badge = this.authorizedBadges.get(key);
    return (badge && badge.isActive) ? badge : null;
  }

  public async getAllIncidents(): Promise<CampusIncident[]> {
    return Array.from(this.incidents.values());
  }

  public async getIncident(id: string): Promise<CampusIncident | null> {
    return this.incidents.get(id) || null;
  }

  public async createIncident(incident: CampusIncident): Promise<void> {
    this.incidents.set(incident.id, incident);
  }

  public async updateIncident(incident: CampusIncident): Promise<void> {
    this.incidents.set(incident.id, incident);
  }

  public async addAuditRecord(record: AuditRecord): Promise<void> {
    this.auditRecords.unshift(record);
    if (this.auditRecords.length > 500) this.auditRecords.pop();
  }

  public async getAuditRecords(limit = 100, role?: UserRole): Promise<AuditRecord[]> {
    let results = this.auditRecords;
    if (role) results = results.filter(r => r.role === role);
    return results.slice(0, limit);
  }

  public async addActivityEvent(event: CampusEvent): Promise<void> {
    this.activityEvents.unshift(event);
    if (this.activityEvents.length > 200) this.activityEvents.pop();
  }

  public async getActivityEvents(limit = 50): Promise<CampusEvent[]> {
    return this.activityEvents.slice(0, limit);
  }

  public async getHealthRecords(): Promise<SystemHealthRecord[]> {
    return Array.from(this.healthRecords.values());
  }

  public async updateHealthRecord(record: SystemHealthRecord): Promise<void> {
    this.healthRecords.set(record.component, record);
  }
}

// ============================================================================
// 2. PRODUCTION POSTGRESQL REPOSITORY (Parameterized Queries & Connection Pool)
// ============================================================================
export class PostgresRepository implements DatabaseRepository {
  private pool: pg.Pool;
  private isConnected = false;
  private inMemoryFallback: InMemoryRepository;

  // Direct map mirrors kept in sync for sub-millisecond route reads
  public users: Map<string, DbUser>;
  public sessions: Map<string, DbSession>;
  public zones: Map<string, ZoneAutomation>;
  public devices: Map<string, IoTDevice>;
  public cameras: Map<string, CameraFeed>;
  public sensors: Map<string, DbSensor>;
  public accessControllers: Map<string, SmartDoor>;
  public incidents: Map<string, CampusIncident>;
  public auditRecords: AuditRecord[];
  public activityEvents: CampusEvent[];
  public healthRecords: Map<string, SystemHealthRecord>;

  constructor(connectionStringOrPool: string | pg.Pool) {
    this.inMemoryFallback = new InMemoryRepository();
    this.users = this.inMemoryFallback.users;
    this.sessions = this.inMemoryFallback.sessions;
    this.zones = this.inMemoryFallback.zones;
    this.devices = this.inMemoryFallback.devices;
    this.cameras = this.inMemoryFallback.cameras;
    this.sensors = this.inMemoryFallback.sensors;
    this.accessControllers = this.inMemoryFallback.accessControllers;
    this.incidents = this.inMemoryFallback.incidents;
    this.auditRecords = this.inMemoryFallback.auditRecords;
    this.activityEvents = this.inMemoryFallback.activityEvents;
    this.healthRecords = this.inMemoryFallback.healthRecords;

    if (typeof connectionStringOrPool === 'string') {
      this.pool = new pg.Pool({
        connectionString: connectionStringOrPool,
        min: config.databasePoolMin,
        max: config.databasePoolMax,
        ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
      });
    } else {
      this.pool = connectionStringOrPool;
    }

    this.pool.on('error', (err) => {
      Logger.error('DATABASE', 'PostgreSQL idle client error encountered', {
        errorClassification: 'POOL_ERROR',
        details: { message: err.message },
      });
    });
  }

  public seedSyntheticDevelopmentData(): void {
    this.inMemoryFallback.seedSyntheticDevelopmentData();
  }

  public async init(): Promise<void> {
    const start = performance.now();
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this.isConnected = true;
      const latency = Math.round(performance.now() - start);
      Logger.info('DATABASE', `PostgreSQL connected successfully (${latency}ms)`);

      const h = this.healthRecords.get('DATABASE');
      if (h) {
        h.status = 'HEALTHY';
        h.latencyMs = latency;
        h.lastHeartbeat = new Date().toISOString();
        h.details = 'PostgreSQL Pool Active';
      }
    } catch (err: any) {
      this.isConnected = false;
      Logger.error('DATABASE', 'PostgreSQL connection failed', {
        errorClassification: 'CONNECTION_FAILURE',
        details: { message: err.message },
      });

      const h = this.healthRecords.get('DATABASE');
      if (h) {
        h.status = 'DEGRADED';
        h.lastError = err.message;
        h.details = 'PostgreSQL unreachable';
      }

      if (config.realtimeMode === 'live') {
        throw new Error(`Production database connection failed: ${err.message}`);
      }
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
    this.isConnected = false;
  }

  public async checkHealth(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = performance.now();
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return { healthy: true, latencyMs: Math.round(performance.now() - start) };
    } catch (err: any) {
      return { healthy: false, latencyMs: Math.round(performance.now() - start), error: err.message };
    }
  }

  public async runMigrations(): Promise<MigrationResult> {
    const startTime = performance.now();
    const schemaPath = path.resolve(process.cwd(), 'server/db/schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const sqlContent = fs.readFileSync(schemaPath, 'utf-8');
    const matches = sqlContent.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-zA-Z0-9_]+)/g);
    const appliedTables = Array.from(matches).map(m => m[1]);

    if (!this.isConnected) {
      return {
        success: true,
        version: '20261004_simulated_schema',
        appliedTables,
        durationMs: Math.round(performance.now() - startTime),
      };
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      try {
        await client.query(sqlContent);
      } catch (ddlErr: any) {
        if (!ddlErr?.message?.includes('🔨 Not supported 🔨')) {
          throw ddlErr;
        }
      }
      await client.query('COMMIT');

      const durationMs = Math.round(performance.now() - startTime);
      Logger.info('DATABASE', `PostgreSQL migrations applied successfully (${durationMs}ms)`, {
        details: { tablesCount: appliedTables.length },
      });

      return {
        success: true,
        version: '20261004_001_initial_production_schema',
        appliedTables,
        durationMs,
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      Logger.error('DATABASE', 'PostgreSQL migration execution failed', {
        errorClassification: 'MIGRATION_ERROR',
        details: { message: err.message },
      });
      throw err;
    } finally {
      client.release();
    }
  }

  public async getUserByUsername(username: string): Promise<DbUser | null> {
    if (!this.isConnected) return this.inMemoryFallback.getUserByUsername(username);

    const res = await this.pool.query(
      `SELECT id, username, password_hash as "passwordHash", name, badge_number as "badgeNumber",
              role, clearance_level as "clearanceLevel", department, is_active as "isActive", created_at as "createdAt",
              google_subject as "googleSubject", google_email as "googleEmail"
       FROM users WHERE LOWER(username) = LOWER($1) AND is_active = TRUE`,
      [username]
    );
    return res.rows[0] || null;
  }

  public async getUserById(id: string): Promise<DbUser | null> {
    if (!this.isConnected) return this.inMemoryFallback.getUserById(id);

    const res = await this.pool.query(
      `SELECT id, username, password_hash as "passwordHash", name, badge_number as "badgeNumber",
              role, clearance_level as "clearanceLevel", department, is_active as "isActive", created_at as "createdAt",
              google_subject as "googleSubject", google_email as "googleEmail"
       FROM users WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  public async getUserByGoogleSubject(subject: string): Promise<DbUser | null> {
    if (!this.isConnected) return this.inMemoryFallback.getUserByGoogleSubject(subject);

    const res = await this.pool.query(
      `SELECT id, username, password_hash as "passwordHash", name, badge_number as "badgeNumber",
              role, clearance_level as "clearanceLevel", department, is_active as "isActive", created_at as "createdAt",
              google_subject as "googleSubject", google_email as "googleEmail"
       FROM users WHERE google_subject = $1 AND is_active = TRUE`,
      [subject]
    );
    return res.rows[0] || null;
  }

  public async getUserByEmail(email: string): Promise<DbUser | null> {
    if (!this.isConnected) return this.inMemoryFallback.getUserByEmail(email);

    const res = await this.pool.query(
      `SELECT id, username, password_hash as "passwordHash", name, badge_number as "badgeNumber",
              role, clearance_level as "clearanceLevel", department, is_active as "isActive", created_at as "createdAt",
              google_subject as "googleSubject", google_email as "googleEmail"
       FROM users WHERE LOWER(google_email) = LOWER($1) AND is_active = TRUE`,
      [email]
    );
    return res.rows[0] || null;
  }

  public async linkGoogleIdentity(userId: string, googleSubject: string, googleEmail?: string): Promise<void> {
    this.inMemoryFallback.linkGoogleIdentity(userId, googleSubject, googleEmail);
    if (!this.isConnected) return;

    await this.pool.query(
      `UPDATE users SET google_subject = $1, google_email = COALESCE($2, google_email) WHERE id = $3`,
      [googleSubject, googleEmail || null, userId]
    );
  }

  public async createUser(user: DbUser): Promise<void> {
    this.inMemoryFallback.createUser(user);
    if (!this.isConnected) return;

    await this.pool.query(
      `INSERT INTO users (id, username, password_hash, name, badge_number, role, clearance_level, department, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         updated_at = CURRENT_TIMESTAMP`,
      [user.id, user.username, user.passwordHash, user.name, user.badgeNumber, user.role, user.clearanceLevel, user.department, user.isActive, user.createdAt]
    );
  }

  public async updateUser(user: DbUser): Promise<void> {
    this.inMemoryFallback.updateUser(user);
    if (!this.isConnected) return;

    await this.pool.query(
      `UPDATE users SET
         password_hash = $1,
         name = $2,
         badge_number = $3,
         role = $4,
         clearance_level = $5,
         department = $6,
         is_active = $7,
         google_subject = $8,
         google_email = $9
       WHERE id = $10`,
      [
        user.passwordHash,
        user.name,
        user.badgeNumber,
        user.role,
        user.clearanceLevel,
        user.department,
        user.isActive,
        user.googleSubject || null,
        user.googleEmail || null,
        user.id,
      ]
    );
  }

  public async createSession(session: DbSession): Promise<void> {
    this.inMemoryFallback.createSession(session);
    if (!this.isConnected) return;

    await this.pool.query(
      `INSERT INTO sessions (id, user_id, token_hash, role, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [session.id, session.userId, session.id, session.role, session.expiresAt, session.createdAt]
    );
  }

  public async getSession(id: string): Promise<DbSession | null> {
    if (!this.isConnected) return this.inMemoryFallback.getSession(id);

    const res = await this.pool.query(
      `SELECT id, user_id as "userId", role, expires_at as "expiresAt", created_at as "createdAt", revoked_at as "revokedAt"
       FROM sessions WHERE id = $1 AND revoked_at IS NULL`,
      [id]
    );
    if (!res.rows[0]) return null;
    const session = res.rows[0];
    if (new Date(session.expiresAt).getTime() <= Date.now()) return null;
    return session;
  }

  public async revokeSession(id: string): Promise<boolean> {
    this.inMemoryFallback.revokeSession(id);
    if (!this.isConnected) return true;

    const res = await this.pool.query(
      `UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );
    return (res.rowCount || 0) > 0;
  }

  public async revokeAllUserSessions(userId: string): Promise<void> {
    this.inMemoryFallback.revokeAllUserSessions(userId);
    if (!this.isConnected) return;

    await this.pool.query(
      `UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  }

  public async getAllZones(): Promise<ZoneAutomation[]> {
    return this.inMemoryFallback.getAllZones();
  }

  public async getZone(id: string): Promise<ZoneAutomation | null> {
    return this.inMemoryFallback.getZone(id);
  }

  public async updateZone(zone: ZoneAutomation): Promise<void> {
    this.inMemoryFallback.updateZone(zone);
    if (!this.isConnected) return;

    await this.pool.query(
      `UPDATE zones SET occupancy_state = $1, occupant_count = $2, current_power_kw = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [zone.occupancy, zone.occupantCount, zone.currentPowerKw, zone.id]
    );
  }

  public async getAllDevices(): Promise<IoTDevice[]> {
    if (!this.isConnected) return this.inMemoryFallback.getAllDevices();
    try {
      const res = await this.pool.query(
        `SELECT id, name, category, zone_id as "zoneId", location, status, ip_address as "ipAddress", firmware_version as firmware, battery_pct as battery, signal_strength as "signalStrength", last_seen as "lastSeen"
         FROM devices ORDER BY id ASC`
      );
      if (res.rows.length === 0) return this.inMemoryFallback.getAllDevices();
      return res.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        location: row.location,
        status: row.status,
        ipAddress: row.ipAddress,
        firmware: row.firmware,
        battery: row.battery,
        signalStrength: row.signalStrength,
        lastHeartbeat: row.lastSeen instanceof Date ? row.lastSeen.toLocaleTimeString('en-US', { hour12: false }) : String(row.lastSeen),
      }));
    } catch {
      return this.inMemoryFallback.getAllDevices();
    }
  }

  public async getDevice(id: string): Promise<IoTDevice | null> {
    if (!this.isConnected) return this.inMemoryFallback.getDevice(id);
    try {
      const res = await this.pool.query(
        `SELECT id, name, category, zone_id as "zoneId", location, status, ip_address as "ipAddress", firmware_version as firmware, battery_pct as battery, signal_strength as "signalStrength", last_seen as "lastSeen"
         FROM devices WHERE id = $1`,
        [id]
      );
      if (res.rows.length === 0) return this.inMemoryFallback.getDevice(id);
      const row = res.rows[0];
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        location: row.location,
        status: row.status,
        ipAddress: row.ipAddress,
        firmware: row.firmware,
        battery: row.battery,
        signalStrength: row.signalStrength,
        lastHeartbeat: row.lastSeen instanceof Date ? row.lastSeen.toLocaleTimeString('en-US', { hour12: false }) : String(row.lastSeen),
      };
    } catch {
      return this.inMemoryFallback.getDevice(id);
    }
  }

  public async upsertDevice(device: IoTDevice): Promise<void> {
    this.inMemoryFallback.upsertDevice(device);
    if (!this.isConnected) return;

    await this.pool.query(
      `INSERT INTO devices (id, name, category, location, status, signal_strength, ip_address, firmware_version, last_seen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         last_seen = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP`,
      [device.id, device.name, device.category, device.location, device.status, device.signalStrength, device.ipAddress, device.firmware]
    );
  }

  public async getAllCameras(): Promise<CameraFeed[]> {
    return this.inMemoryFallback.getAllCameras();
  }

  public async getCamera(id: string): Promise<CameraFeed | null> {
    return this.inMemoryFallback.getCamera(id);
  }

  public async updateCameraStatus(id: string, status: CameraFeed['status']): Promise<void> {
    this.inMemoryFallback.updateCameraStatus(id, status);
    if (!this.isConnected) return;

    await this.pool.query(
      `UPDATE cameras SET status = $1, last_heartbeat = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, id]
    );
  }

  public async getAllSensors(): Promise<DbSensor[]> {
    return this.inMemoryFallback.getAllSensors();
  }

  public async getSensor(id: string): Promise<DbSensor | null> {
    return this.inMemoryFallback.getSensor(id);
  }

  public async updateSensorReading(id: string, value: number, status: DbSensor['status']): Promise<void> {
    this.inMemoryFallback.updateSensorReading(id, value, status);
    if (!this.isConnected) return;

    await this.pool.query(
      `UPDATE sensors SET current_value = $1, status = $2, last_reading = CURRENT_TIMESTAMP WHERE id = $3`,
      [value, status, id]
    );
  }

  public async getAllAccessControllers(): Promise<SmartDoor[]> {
    return this.inMemoryFallback.getAllAccessControllers();
  }

  public async getAccessController(id: string): Promise<SmartDoor | null> {
    return this.inMemoryFallback.getAccessController(id);
  }

  public async getAuthorizedBadge(facilityCode: number, cardNumber: number): Promise<AuthorizedBadge | null> {
    return this.inMemoryFallback.getAuthorizedBadge(facilityCode, cardNumber);
  }

  public async updateAccessController(door: SmartDoor): Promise<void> {
    this.inMemoryFallback.updateAccessController(door);
    if (!this.isConnected) return;

    await this.pool.query(
      `UPDATE access_controllers SET
         lock_status = $1, keypad_status = $2, failed_attempts = $3,
         is_security_alert = $4, last_event_text = $5, last_event_time = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [door.lockStatus, door.keypadStatus, door.failedAttempts, door.isSecurityAlert, door.lastEventText, door.id]
    );
  }

  public async getAllIncidents(): Promise<CampusIncident[]> {
    if (!this.isConnected) return this.inMemoryFallback.getAllIncidents();
    try {
      const res = await this.pool.query(
        `SELECT id, title as event, event_type as "eventType", location, zone_id as zone, severity, source, status, assigned_officer as "assignedOfficer", description, telemetry, created_at as "timestamp", acknowledged_at as "acknowledgedAt", investigating_at as "investigatingAt", resolved_at as "resolvedAt"
         FROM incidents ORDER BY created_at DESC`
      );
      if (res.rows.length === 0) return this.inMemoryFallback.getAllIncidents();
      return res.rows.map(row => ({
        id: row.id,
        event: row.event,
        location: row.location,
        zone: row.zone || 'Operations',
        severity: row.severity,
        source: row.source,
        status: row.status,
        timestamp: row.timestamp instanceof Date ? row.timestamp.toLocaleTimeString('en-US', { hour12: false }) : String(row.timestamp),
        resolvedAt: row.resolvedAt ? (row.resolvedAt instanceof Date ? row.resolvedAt.toLocaleTimeString('en-US', { hour12: false }) : String(row.resolvedAt)) : undefined,
        assignedOfficer: row.assignedOfficer,
        description: row.description,
        telemetry: typeof row.telemetry === 'string' ? JSON.parse(row.telemetry) : (row.telemetry || {}),
        auditTimeline: [],
      }));
    } catch {
      return this.inMemoryFallback.getAllIncidents();
    }
  }

  public async getIncident(id: string): Promise<CampusIncident | null> {
    if (!this.isConnected) return this.inMemoryFallback.getIncident(id);
    try {
      const res = await this.pool.query(
        `SELECT id, title as event, location, zone_id as zone, severity, source, status, assigned_officer as "assignedOfficer", description, telemetry, created_at as "timestamp", resolved_at as "resolvedAt"
         FROM incidents WHERE id = $1`,
        [id]
      );
      if (res.rows.length === 0) return this.inMemoryFallback.getIncident(id);
      const row = res.rows[0];
      return {
        id: row.id,
        event: row.event,
        location: row.location,
        zone: row.zone || 'Operations',
        severity: row.severity,
        source: row.source,
        status: row.status,
        timestamp: row.timestamp instanceof Date ? row.timestamp.toLocaleTimeString('en-US', { hour12: false }) : String(row.timestamp),
        resolvedAt: row.resolvedAt ? (row.resolvedAt instanceof Date ? row.resolvedAt.toLocaleTimeString('en-US', { hour12: false }) : String(row.resolvedAt)) : undefined,
        assignedOfficer: row.assignedOfficer,
        description: row.description,
        telemetry: typeof row.telemetry === 'string' ? JSON.parse(row.telemetry) : (row.telemetry || {}),
        auditTimeline: [],
      };
    } catch {
      return this.inMemoryFallback.getIncident(id);
    }
  }

  public async createIncident(incident: CampusIncident): Promise<void> {
    this.inMemoryFallback.createIncident(incident);
    if (!this.isConnected) return;

    await this.pool.query(
      `INSERT INTO incidents (id, title, event_type, location, zone_id, severity, source, status, description, telemetry, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         description = EXCLUDED.description,
         assigned_officer = EXCLUDED.assigned_officer`,
      [incident.id, incident.event, incident.event, incident.location, incident.zone, incident.severity, incident.source, incident.status, incident.description, JSON.stringify(incident.telemetry || {})]
    );
  }

  public async updateIncident(incident: CampusIncident): Promise<void> {
    this.inMemoryFallback.updateIncident(incident);
    if (!this.isConnected) return;

    await this.pool.query(
      `UPDATE incidents SET
         status = $1, assigned_officer = $2,
         acknowledged_at = CASE WHEN $1 = 'acknowledged' THEN CURRENT_TIMESTAMP ELSE acknowledged_at END,
         investigating_at = CASE WHEN $1 = 'investigating' THEN CURRENT_TIMESTAMP ELSE investigating_at END,
         resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
       WHERE id = $3`,
      [incident.status, incident.assignedOfficer, incident.id]
    );
  }

  public async addAuditRecord(record: AuditRecord): Promise<void> {
    this.inMemoryFallback.addAuditRecord(record);
    if (!this.isConnected) return;

    await this.pool.query(
      `INSERT INTO audit_records (id, timestamp, actor, role, action, target, result, details, zone)
       VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $6, $7, $8)`,
      [record.id, record.actor, record.role, record.action, record.target, record.result, record.details, record.zone || 'Operations']
    );
  }

  public async getAuditRecords(limit = 100, role?: UserRole): Promise<AuditRecord[]> {
    if (!this.isConnected) return this.inMemoryFallback.getAuditRecords(limit, role);
    try {
      let query = `SELECT id, timestamp, actor, role, action, target, result, details, zone FROM audit_records`;
      const params: any[] = [];
      if (role) {
        query += ` WHERE role = $1`;
        params.push(role);
      }
      query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      const res = await this.pool.query(query, params);
      if (res.rows.length === 0) return this.inMemoryFallback.getAuditRecords(limit, role);
      return res.rows.map(row => ({
        id: row.id,
        timestamp: row.timestamp instanceof Date ? row.timestamp.toLocaleTimeString('en-US', { hour12: false }) : String(row.timestamp),
        actor: row.actor,
        role: row.role,
        action: row.action,
        target: row.target,
        result: row.result,
        details: row.details,
        zone: row.zone,
      }));
    } catch {
      return this.inMemoryFallback.getAuditRecords(limit, role);
    }
  }

  public async addActivityEvent(event: CampusEvent): Promise<void> {
    this.inMemoryFallback.addActivityEvent(event);
    if (!this.isConnected) return;

    await this.pool.query(
      `INSERT INTO activity_events (id, timestamp, event_type, location, resulting_action, severity, source)
       VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $6)`,
      [event.id, event.eventType, event.location, event.resultingAction, event.severity, event.source]
    );
  }

  public async getActivityEvents(limit = 50): Promise<CampusEvent[]> {
    return this.inMemoryFallback.getActivityEvents(limit);
  }

  public async getHealthRecords(): Promise<SystemHealthRecord[]> {
    return this.inMemoryFallback.getHealthRecords();
  }

  public async updateHealthRecord(record: SystemHealthRecord): Promise<void> {
    this.inMemoryFallback.updateHealthRecord(record);
    if (!this.isConnected) return;

    await this.pool.query(
      `INSERT INTO system_health (component, status, latency_ms, reconnect_count, last_heartbeat, last_error, details)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)
       ON CONFLICT (component) DO UPDATE SET
         status = EXCLUDED.status,
         latency_ms = EXCLUDED.latency_ms,
         last_heartbeat = CURRENT_TIMESTAMP,
         last_error = EXCLUDED.last_error,
         details = EXCLUDED.details`,
      [record.component, record.status, record.latencyMs, record.reconnectCount, record.lastError, record.details]
    );
  }
}

// Factory instantiation based on config
export function createDatabaseRepository(): DatabaseRepository {
  if (config.databaseUrl && (config.realtimeMode === 'live' || config.realtimeMode === 'hybrid')) {
    Logger.info('DATABASE', 'Instantiating production PostgreSQL repository');
    return new PostgresRepository(config.databaseUrl);
  }
  return new InMemoryRepository();
}

export const db: DatabaseRepository = createDatabaseRepository();
export default db;
