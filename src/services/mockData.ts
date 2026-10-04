import type { 
  IoTDevice, 
  CampusAlert, 
  CampusIncident, 
  CampusEvent, 
  ZoneAutomation, 
  SmartDoor, 
  CameraFeed 
} from '../types';

export const INITIAL_DEVICES: IoTDevice[] = [
  // Science Block
  {
    id: 'DEV-SMK-204',
    name: 'Smoke Sensor 204',
    category: 'smoke',
    location: 'Science Block · Lab 204',
    zone: 'Science Block',
    status: 'online',
    lastUpdated: 'Just now',
    batteryPct: 98,
    signalStrength: 94,
    ipAddress: '10.24.12.14',
    firmware: 'v2.4.1'
  },
  {
    id: 'DEV-FIR-204',
    name: 'Thermal Fire Sensor 204',
    category: 'fire',
    location: 'Science Block · Lab 204',
    zone: 'Science Block',
    status: 'online',
    lastUpdated: '1 min ago',
    batteryPct: 95,
    signalStrength: 92,
    ipAddress: '10.24.12.15',
    firmware: 'v2.4.1'
  },
  {
    id: 'DEV-MOT-204',
    name: 'PIR Motion Sensor 204',
    category: 'motion',
    location: 'Science Block · Lab 204',
    zone: 'Science Block',
    status: 'online',
    lastUpdated: 'Just now',
    batteryPct: 86,
    signalStrength: 96,
    ipAddress: '10.24.12.16',
    firmware: 'v3.1.0'
  },
  {
    id: 'DEV-LGT-204',
    name: 'Smart Relay Lighting 204',
    category: 'light',
    location: 'Science Block · Lab 204',
    zone: 'Science Block',
    status: 'online',
    lastUpdated: '2 mins ago',
    signalStrength: 99,
    ipAddress: '10.24.12.20',
    firmware: 'v1.8.4'
  },
  {
    id: 'DEV-FAN-204',
    name: 'HVAC Fan Controller 204',
    category: 'fan',
    location: 'Science Block · Lab 204',
    zone: 'Science Block',
    status: 'online',
    lastUpdated: '2 mins ago',
    signalStrength: 97,
    ipAddress: '10.24.12.21',
    firmware: 'v1.8.4'
  },
  {
    id: 'DEV-PWR-204',
    name: 'Sub-meter Power Monitor',
    category: 'power_meter',
    location: 'Science Block · Lab 204',
    zone: 'Science Block',
    status: 'online',
    lastUpdated: '30s ago',
    signalStrength: 95,
    ipAddress: '10.24.12.25',
    firmware: 'v4.0.2'
  },
  {
    id: 'DEV-MOT-214',
    name: 'Motion Sensor 214',
    category: 'motion',
    location: 'Science Block · Room 214',
    zone: 'Science Block',
    status: 'offline',
    lastUpdated: '05:58 AM',
    batteryPct: 12,
    signalStrength: 0,
    ipAddress: '10.24.12.30',
    firmware: 'v2.1.0'
  },

  // Engineering Block
  {
    id: 'DEV-LCK-E04',
    name: 'Heavy Duty Maglock E-04',
    category: 'door_lock',
    location: 'Engineering Block · Door E-04',
    zone: 'Engineering Block',
    status: 'online',
    lastUpdated: 'Just now',
    signalStrength: 98,
    ipAddress: '10.24.14.44',
    firmware: 'v3.2.0'
  },
  {
    id: 'DEV-KPD-E04',
    name: 'Armored Keypad E-04',
    category: 'keypad',
    location: 'Engineering Block · Door E-04',
    zone: 'Engineering Block',
    status: 'online',
    lastUpdated: 'Just now',
    signalStrength: 97,
    ipAddress: '10.24.14.45',
    firmware: 'v3.2.0'
  },
  {
    id: 'DEV-MOT-112',
    name: 'PIR Motion Sensor 112',
    category: 'motion',
    location: 'Engineering Block · Room 112',
    zone: 'Engineering Block',
    status: 'online',
    lastUpdated: '12 mins ago',
    batteryPct: 91,
    signalStrength: 90,
    ipAddress: '10.24.14.12',
    firmware: 'v3.1.0'
  },
  {
    id: 'DEV-LGT-112',
    name: 'Eco-Relay Lighting 112',
    category: 'light',
    location: 'Engineering Block · Room 112',
    zone: 'Engineering Block',
    status: 'online',
    lastUpdated: '15 mins ago',
    signalStrength: 95,
    ipAddress: '10.24.14.13',
    firmware: 'v1.8.4'
  },

  // Perimeter & Administrative
  {
    id: 'DEV-LCK-GATE1',
    name: 'Hydraulic Barrier Lock',
    category: 'door_lock',
    location: 'Main Perimeter · Main Gate',
    zone: 'Main Perimeter',
    status: 'online',
    lastUpdated: '06:06 AM',
    signalStrength: 99,
    ipAddress: '10.24.10.1',
    firmware: 'v4.1.0'
  },
  {
    id: 'DEV-KPD-GATE1',
    name: 'Access Reader Station 01',
    category: 'keypad',
    location: 'Main Perimeter · Main Gate',
    zone: 'Main Perimeter',
    status: 'online',
    lastUpdated: '06:06 AM',
    signalStrength: 99,
    ipAddress: '10.24.10.2',
    firmware: 'v4.1.0'
  },
  {
    id: 'DEV-CAM-01',
    name: 'Fixed Dome Camera 01',
    category: 'camera',
    location: 'Main Perimeter · Main Gate',
    zone: 'Main Perimeter',
    status: 'online',
    lastUpdated: 'Just now',
    signalStrength: 100,
    ipAddress: '10.24.10.10',
    firmware: 'v5.0.1'
  },
  {
    id: 'DEV-LCK-SRV101',
    name: 'Biometric Interlock Door',
    category: 'door_lock',
    location: 'Administration · Server Room 101',
    zone: 'Administrative Wing',
    status: 'warning',
    lastUpdated: '05:30 AM',
    signalStrength: 82,
    ipAddress: '10.24.16.5',
    firmware: 'v2.8.2'
  },
  {
    id: 'DEV-SMK-SRV101',
    name: 'VESDA Laser Smoke Sensor',
    category: 'smoke',
    location: 'Administration · Server Room 101',
    zone: 'Administrative Wing',
    status: 'online',
    lastUpdated: 'Just now',
    batteryPct: 100,
    signalStrength: 99,
    ipAddress: '10.24.16.6',
    firmware: 'v3.0.0'
  }
];

export const INITIAL_ALERTS: CampusAlert[] = [
  {
    id: 'ALT-DEV-214',
    title: 'Device offline',
    location: 'Science Block · Room 214',
    timestamp: '05:58 AM',
    severity: 'warning',
    source: 'live',
    details: 'Motion Sensor 214 heartbeat lost. Battery was at 12%.',
    deviceId: 'DEV-MOT-214',
    acknowledged: false
  },
  {
    id: 'ALT-SRV-101',
    title: 'Biometric reader failover',
    location: 'Administration · Server Room 101',
    timestamp: '05:30 AM',
    severity: 'warning',
    source: 'live',
    details: 'Door controller switched to backup PIN authorization mode.',
    deviceId: 'DEV-LCK-SRV101',
    acknowledged: true
  }
];

export const INITIAL_INCIDENTS: CampusIncident[] = [
  {
    id: 'INC-001',
    event: 'Gas concentration elevated',
    location: 'Science & Physics Lab',
    zone: 'Science Block',
    severity: 'critical',
    source: 'live',
    status: 'open',
    timestamp: '06:14 AM',
    assignedOfficer: 'HazMat / Safety Lead',
    description: 'Optical MQ-2 array reports methane/LPG concentration at 840 ppm (threshold 600 ppm). Automated ventilation damper deployed.',
    telemetry: {
      sensorId: 'DEV-MQ2-SCI204',
      concentrationPpm: 840,
      ventilationDamper: '100% Extract'
    },
    auditTimeline: [
      { time: '06:14 AM', action: 'Sensor threshold exceeded (840 ppm)', actor: 'MQ-2 Telemetry Sensor' },
      { time: '06:14 AM', action: 'Automated exhaust fans triggered', actor: 'Building Automation Relay' },
      { time: '06:15 AM', action: 'Dispatch alert sent to safety lead', actor: 'Incident Engine' }
    ]
  },
  {
    id: 'INC-002',
    event: 'Unauthorized access attempt',
    location: 'Main Gate',
    zone: 'Main Perimeter',
    severity: 'warning',
    source: 'live',
    status: 'open',
    timestamp: '06:06 AM',
    assignedOfficer: 'Officer J. Vance',
    description: 'Multiple unauthorized PIN entries on perimeter vehicle barrier reader.',
    telemetry: {
      keypadId: 'DEV-KPD-GATE1',
      attemptCount: 3,
      lockEngagement: '100% Locked'
    },
    auditTimeline: [
      { time: '06:06 AM', action: 'Incident generated by keypad trigger', actor: 'Automated Event Engine' },
      { time: '06:07 AM', action: 'Camera CAM-01 reticle targeted gate', actor: 'Automated PTZ Rule' }
    ]
  },
  {
    id: 'INC-004',
    event: 'Motion anomaly',
    location: 'Computer Lab',
    zone: 'Computer Lab',
    severity: 'info',
    source: 'live',
    status: 'resolved',
    timestamp: '05:42 AM',
    resolvedAt: '05:46 AM',
    assignedOfficer: 'Automated Supervisor',
    description: 'PIR node 32 triggered during scheduled custodial cleaning cycle. Verified nominal.',
    telemetry: {
      sensorId: 'DEV-PIR-CMP01',
      ambientTemp: '20.8°C'
    },
    auditTimeline: [
      { time: '05:42 AM', action: 'PIR trigger during off-hours', actor: 'PIR-CMP01' },
      { time: '05:46 AM', action: 'Badge swipe confirmed custodial staff', actor: 'Door Access Subsystem' },
      { time: '05:46 AM', action: 'Incident resolved automatically', actor: 'System' }
    ]
  },
  {
    id: 'INC-003',
    event: 'Device offline',
    location: 'Science Block · Room 214',
    zone: 'Science Block',
    severity: 'warning',
    source: 'live',
    status: 'open',
    timestamp: '05:58 AM',
    assignedOfficer: 'IoT Field Tech team',
    description: 'Motion sensor node ceased responding to supervisory heartbeat. Scheduled for battery maintenance.',
    telemetry: {
      deviceId: 'DEV-MOT-214',
      lastVoltage: '2.1V',
      rssi: '-89 dBm'
    },
    auditTimeline: [
      { time: '05:58 AM', action: 'Heartbeat timeout threshold reached (180s)', actor: 'IoT Telemetry Daemon' },
      { time: '06:00 AM', action: 'Created maintenance ticket MT-882', actor: 'System' }
    ]
  }
];

export const INITIAL_EVENTS: CampusEvent[] = [
  {
    id: 'EVT-098',
    time: '08:42 AM',
    eventType: 'Access granted',
    location: 'Main Gate',
    resultingAction: 'Hydraulic barrier opened for staff badge #4491',
    severity: 'info',
    source: 'live'
  },
  {
    id: 'EVT-099',
    time: '08:39 AM',
    eventType: 'Motion detected',
    location: 'Innovation & Robotics Lab',
    resultingAction: 'Triggered occupied lighting preset',
    severity: 'info',
    source: 'live'
  },
  {
    id: 'EVT-100',
    time: '08:34 AM',
    eventType: 'Energy state changed',
    location: 'Academic Hallway',
    resultingAction: 'Optimized lighting ramped to 65% luminosity',
    severity: 'info',
    source: 'live'
  },
  {
    id: 'EVT-101A',
    time: '08:31 AM',
    eventType: 'Gas level normal',
    location: 'Science & Physics Lab',
    resultingAction: 'Purge cycle complete · Sensor stabilized at 412 ppm',
    severity: 'info',
    source: 'live'
  },
  {
    id: 'EVT-101',
    time: '06:08 AM',
    eventType: 'Motion detected',
    location: 'Science Block · Lab 204',
    resultingAction: 'Triggered room occupancy state',
    severity: 'info',
    source: 'live'
  },
  {
    id: 'EVT-102',
    time: '06:07 AM',
    eventType: 'Lights turned ON',
    location: 'Science Block · Lab 204',
    resultingAction: 'Automated relay activated (2.4 kW)',
    severity: 'info',
    source: 'live'
  },
  {
    id: 'EVT-103',
    time: '06:07 AM',
    eventType: 'Fan turned ON',
    location: 'Science Block · Lab 204',
    resultingAction: 'Ventilation damper opened to 60%',
    severity: 'info',
    source: 'live'
  },
  {
    id: 'EVT-104',
    time: '06:06 AM',
    eventType: 'Access granted',
    location: 'Main Perimeter · Main Gate',
    resultingAction: 'Barrier gate opened for authorized staff',
    severity: 'info',
    source: 'live'
  },
  {
    id: 'EVT-105',
    time: '06:02 AM',
    eventType: 'Access denied',
    location: 'Engineering Block · Door E-04',
    resultingAction: 'Keypad lock held; alert logged',
    severity: 'warning',
    source: 'live'
  },
  {
    id: 'EVT-106',
    time: '05:58 AM',
    eventType: 'Sensor ping lost',
    location: 'Science Block · Room 214',
    resultingAction: 'System marked node offline',
    severity: 'warning',
    source: 'live'
  }
];

export const INITIAL_AUTOMATIONS: ZoneAutomation[] = [
  {
    id: 'ZONE-SCI-204',
    zoneName: 'LAB 204',
    building: 'Science Block',
    occupancy: 'occupied',
    lightsState: 'on',
    fansState: 'on',
    currentPowerKw: 2.4,
    automationState: 'active',
    lastMotionTime: '06:08 AM',
    occupantCount: 14
  },
  {
    id: 'ZONE-ENG-112',
    zoneName: 'ROOM 112',
    building: 'Engineering Block',
    occupancy: 'vacant',
    lightsState: 'off',
    fansState: 'off',
    currentPowerKw: 0.2,
    automationState: 'energy_saving',
    lastMotionTime: '05:42 AM',
    occupantCount: 0
  },
  {
    id: 'ZONE-LIB-READ',
    zoneName: 'READING ROOM B',
    building: 'Central Library',
    occupancy: 'occupied',
    lightsState: 'on',
    fansState: 'on',
    currentPowerKw: 1.8,
    automationState: 'active',
    lastMotionTime: '06:04 AM',
    occupantCount: 6
  },
  {
    id: 'ZONE-ENG-201',
    zoneName: 'LECTURE HALL E-1',
    building: 'Engineering Block',
    occupancy: 'vacant',
    lightsState: 'off',
    fansState: 'off',
    currentPowerKw: 0.3,
    automationState: 'energy_saving',
    lastMotionTime: 'Yesterday 21:30',
    occupantCount: 0
  },
  {
    id: 'ZONE-ADM-CONF',
    zoneName: 'CONFERENCE RM A',
    building: 'Administrative Wing',
    occupancy: 'vacant',
    lightsState: 'off',
    fansState: 'off',
    currentPowerKw: 0.1,
    automationState: 'energy_saving',
    lastMotionTime: 'Yesterday 18:15',
    occupantCount: 0
  }
];

export const INITIAL_DOORS: SmartDoor[] = [
  {
    id: 'DOOR-GATE-MAIN',
    name: 'Main Gate Access Portal',
    building: 'Perimeter Security',
    zone: 'Main Perimeter',
    lockStatus: 'locked',
    keypadStatus: 'normal',
    failedAttempts: 0,
    lastEventTime: '06:06 AM',
    lastEventText: 'Access granted · Authorized Staff ID',
    isSecurityAlert: false,
    authorizedRoles: ['admin', 'security_officer']
  },
  {
    id: 'DOOR-ENG-E04',
    name: 'Engineering E-04 Laboratory',
    building: 'Engineering Block',
    zone: 'Engineering Block',
    lockStatus: 'locked',
    keypadStatus: 'normal',
    failedAttempts: 0,
    lastEventTime: '06:02 AM',
    lastEventText: 'Secured · Keypad idle',
    isSecurityAlert: false,
    authorizedRoles: ['admin', 'security_officer']
  },
  {
    id: 'DOOR-SCI-204',
    name: 'Science Block Lab 204 Door',
    building: 'Science Block',
    zone: 'Science Block',
    lockStatus: 'unlocked',
    keypadStatus: 'normal',
    failedAttempts: 0,
    lastEventTime: '06:07 AM',
    lastEventText: 'Unlocked for scheduled practical class',
    isSecurityAlert: false,
    authorizedRoles: ['admin', 'security_officer', 'faculty']
  },
  {
    id: 'DOOR-LIB-SOUTH',
    name: 'Library South Entrance',
    building: 'Central Library',
    zone: 'Central Library',
    lockStatus: 'locked',
    keypadStatus: 'normal',
    failedAttempts: 0,
    lastEventTime: '05:50 AM',
    lastEventText: 'Auto-timed schedule active',
    isSecurityAlert: false,
    authorizedRoles: ['admin', 'security_officer']
  },
  {
    id: 'DOOR-ADM-SRV101',
    name: 'Server Room 101 High Security',
    building: 'Administrative Wing',
    zone: 'Administrative Wing',
    lockStatus: 'locked',
    keypadStatus: 'normal',
    failedAttempts: 0,
    lastEventTime: '05:30 AM',
    lastEventText: 'PIN override mode active',
    isSecurityAlert: false,
    authorizedRoles: ['admin']
  }
];

export const INITIAL_CAMERAS: CameraFeed[] = [
  {
    id: 'CAM-01',
    name: 'Main Gate & Entry Barrier',
    location: 'Perimeter North Post',
    status: 'live',
    resolution: '1920x1080',
    fps: 30,
    ptzCapable: true,
    zone: 'Main Perimeter',
    lastMaintenance: '2026-08-15',
    streamUrl: '/assets/cctv_main_gate.jpg',
    isESP32: false
  },
  {
    id: 'CAM-02',
    name: 'Engineering Quadrangle Courtyard',
    location: 'Engineering Block South',
    status: 'simulation',
    resolution: '1920x1080',
    fps: 25,
    ptzCapable: false,
    zone: 'Engineering Block',
    lastMaintenance: '2026-07-28',
    isESP32: false
  },
  {
    id: 'CAM-03',
    name: 'Science Complex West Corridor',
    location: 'Science Block 2nd Floor',
    status: 'simulation',
    resolution: '1920x1080',
    fps: 30,
    ptzCapable: false,
    zone: 'Science Block',
    lastMaintenance: '2026-08-01',
    isESP32: false
  },
  {
    id: 'CAM-04',
    name: 'Central Library Entry Atrium',
    location: 'Library Main Ground',
    status: 'simulation',
    resolution: '1920x1080',
    fps: 25,
    ptzCapable: false,
    zone: 'Central Library',
    lastMaintenance: '2026-08-12',
    isESP32: false
  },
  {
    id: 'CAM-05',
    name: 'Perimeter East Walkway & Parking',
    location: 'East Perimeter Pole 12',
    status: 'offline',
    resolution: '1920x1080',
    fps: 0,
    ptzCapable: true,
    zone: 'Main Perimeter',
    lastMaintenance: '2026-07-14',
    isESP32: false,
    streamError: 'No physical camera endpoint configured'
  },
  {
    id: 'CAM-06',
    name: 'Administrative Wing Foyer',
    location: 'Admin Building Level 1',
    status: 'simulation',
    resolution: '1920x1080',
    fps: 25,
    ptzCapable: false,
    zone: 'Administrative Wing',
    lastMaintenance: '2026-08-20',
    isESP32: false
  }
];

export const HOURLY_ENERGY_DATA = [
  { hour: '00:00', kw: 14.2, baseline: 18.0 },
  { hour: '02:00', kw: 12.8, baseline: 17.5 },
  { hour: '04:00', kw: 12.1, baseline: 17.0 },
  { hour: '06:00', kw: 22.4, baseline: 26.5 },
  { hour: '08:00', kw: 42.8, baseline: 49.0 },
  { hour: '10:00', kw: 54.6, baseline: 62.1 },
  { hour: '12:00', kw: 52.0, baseline: 60.5 },
  { hour: '14:00', kw: 58.4, baseline: 67.2 },
  { hour: '16:00', kw: 46.1, baseline: 55.0 },
  { hour: '18:00', kw: 31.5, baseline: 39.8 },
  { hour: '20:00', kw: 24.2, baseline: 30.2 },
  { hour: '22:00', kw: 17.6, baseline: 22.0 }
];
