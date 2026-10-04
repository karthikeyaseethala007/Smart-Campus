import React, { 
  createContext, 
  useContext, 
  useState, 
  useMemo, 
  useEffect, 
  type ReactNode 
} from 'react';
import type { 
  UserRole, 
  NavigationTab, 
  IoTDevice, 
  CampusAlert, 
  CampusIncident, 
  CampusEvent, 
  ZoneAutomation, 
  SmartDoor, 
  CameraFeed, 
  CameraStreamState,
  EventSource,
  ToastMessage 
} from '../types';
import { 
  INITIAL_DEVICES, 
  INITIAL_ALERTS, 
  INITIAL_INCIDENTS, 
  INITIAL_EVENTS, 
  INITIAL_AUTOMATIONS, 
  INITIAL_DOORS, 
  INITIAL_CAMERAS 
} from './mockData';
import { alarmSoundService } from './alarmSoundService';
import { DeviceAdapter } from './deviceAdapter';
import { CameraTransport } from './cameraTransport';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

interface StateContextType {
  // Navigation & Role
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // System Status
  campusStatus: 'SECURE' | 'EMERGENCY' | 'WARNING';
  isSimulationActive: boolean;
  activeSimulations: { 
    fire: boolean; 
    smoke: boolean; 
    breach: boolean; 
    restrictedMotion: boolean; 
  };

  // Core Data Collections
  devices: IoTDevice[];
  alerts: CampusAlert[];
  incidents: CampusIncident[];
  events: CampusEvent[];
  automations: ZoneAutomation[];
  doors: SmartDoor[];
  cameras: CameraFeed[];

  // Selected Detail Modals
  selectedIncident: CampusIncident | null;
  setSelectedIncident: (incident: CampusIncident | null) => void;
  selectedDevice: IoTDevice | null;
  setSelectedDevice: (device: IoTDevice | null) => void;

  // Confirmation Modal
  confirmModal: ConfirmDialogState | null;
  closeConfirmModal: () => void;
  showConfirmModal: (dialog: Omit<ConfirmDialogState, 'isOpen'>) => void;

  // Notifications / Toasts
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;

  // Alarm Audio
  isAlarmRinging: boolean;
  isAlarmMuted: boolean;
  audioAutoplayBlocked: boolean;
  enableAlarmAudio: () => void;
  silenceAlarm: () => void;

  // Operational IoT Event Actions
  triggerFireAlert: (location?: string, source?: EventSource) => void;
  triggerSmokeAlert: (location?: string, source?: EventSource) => void;
  triggerRestrictedMotion: (zone?: string, source?: EventSource) => void;
  triggerZoneOccupancy: (zoneId: string, source?: EventSource) => void;
  triggerZoneVacancy: (zoneId: string, source?: EventSource) => void;
  submitKeypadPin: (doorId: string, pin: string, source?: EventSource) => Promise<{ success: boolean; message: string }>;
  toggleDeviceOnline: (deviceId: string) => void;
  updateCameraStream: (cameraId: string, streamUrl?: string) => Promise<void>;
  setCameraStatus: (cameraId: string, status: CameraStreamState) => void;

  // Simulation Triggers
  simulateFire: () => void;
  simulateSmoke: () => void;
  simulateBreach: () => void;
  simulateRestrictedMotion: () => void;
  resetSimulation: () => void;

  // Remote Door Controls
  requestUnlockDoor: (doorId: string) => void;
  lockDoor: (doorId: string) => void;

  // Incident & Alert Management
  acknowledgeAlert: (alertId: string) => void;
  acknowledgeIncident: (incidentId: string) => void;
  resolveIncident: (incidentId: string) => void;

  // Role Permissions
  canManageDoors: boolean;
  canManageIncidents: boolean;
  canRunSimulations: boolean;
  canManageDevices: boolean;
  canAccessSystemSettings: boolean;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    if (typeof window !== 'undefined') {
      const urlTab = new URLSearchParams(window.location.search).get('tab') as NavigationTab;
      if (urlTab) return urlTab;
      const pathname = window.location.pathname;
      if (pathname === '/app' || pathname.startsWith('/app/')) {
        const sub = pathname.replace(/^\/app\/?/, '').split('/')[0] as NavigationTab;
        return sub || 'overview';
      }
    }
    return 'landing';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const urlTab = new URLSearchParams(window.location.search).get('tab') as NavigationTab;
      if (urlTab) {
        setActiveTab(urlTab);
      } else if (window.location.pathname === '/app' || window.location.pathname.startsWith('/app/')) {
        const sub = window.location.pathname.replace(/^\/app\/?/, '').split('/')[0] as NavigationTab;
        setActiveTab(sub || 'overview');
      } else {
        setActiveTab('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');

  // Domain Collections
  const [devices, setDevices] = useState<IoTDevice[]>(INITIAL_DEVICES);
  const [alerts, setAlerts] = useState<CampusAlert[]>(INITIAL_ALERTS);
  const [incidents, setIncidents] = useState<CampusIncident[]>(INITIAL_INCIDENTS);
  const [events, setEvents] = useState<CampusEvent[]>(INITIAL_EVENTS);
  const [automations, setAutomations] = useState<ZoneAutomation[]>(INITIAL_AUTOMATIONS);
  const [doors, setDoors] = useState<SmartDoor[]>(INITIAL_DOORS);
  const [cameras, setCameras] = useState<CameraFeed[]>(INITIAL_CAMERAS);

  // Audio Alarm State
  const [alarmState, setAlarmState] = useState(alarmSoundService.getState());

  useEffect(() => {
    return alarmSoundService.subscribe((state) => {
      setAlarmState(state);
    });
  }, []);

  // Simulation Tracking
  const [activeSimulations, setActiveSimulations] = useState({ 
    fire: false, 
    smoke: false, 
    breach: false, 
    restrictedMotion: false 
  });

  // Dialogs & Modals
  const [selectedIncident, setSelectedIncident] = useState<CampusIncident | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmDialogState | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Computed Role Permissions
  const canManageDoors = userRole === 'admin' || userRole === 'security_officer';
  const canManageIncidents = userRole === 'admin' || userRole === 'security_officer';
  const canRunSimulations = userRole === 'admin' || userRole === 'security_officer';
  const canManageDevices = userRole === 'admin';
  const canAccessSystemSettings = userRole === 'admin';

  const isSimulationActive = 
    activeSimulations.fire || 
    activeSimulations.smoke || 
    activeSimulations.breach || 
    activeSimulations.restrictedMotion ||
    alerts.some(a => a.source === 'simulation');

  // Computed Campus Status
  const campusStatus = useMemo<'SECURE' | 'EMERGENCY' | 'WARNING'>(() => {
    if (activeSimulations.fire || activeSimulations.smoke) return 'EMERGENCY';
    const hasCritical = alerts.some(a => a.severity === 'critical' && !a.acknowledged);
    if (hasCritical) return 'EMERGENCY';
    if (
      activeSimulations.breach || 
      activeSimulations.restrictedMotion || 
      alerts.some(a => a.severity === 'warning' && !a.acknowledged)
    ) {
      return 'WARNING';
    }
    return 'SECURE';
  }, [activeSimulations, alerts]);

  // Toast Helpers
  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const newToast: ToastMessage = {
      id: 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setToasts(prev => [newToast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      dismissToast(newToast.id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Confirm Modal Helpers
  const showConfirmModal = (dialog: Omit<ConfirmDialogState, 'isOpen'>) => {
    setConfirmModal({ ...dialog, isOpen: true });
  };

  const closeConfirmModal = () => {
    setConfirmModal(null);
  };

  // Audio Actions
  const enableAlarmAudio = () => {
    alarmSoundService.enableAudioFromUserGesture();
  };

  const silenceAlarm = () => {
    alarmSoundService.silenceAlarm();
    addToast('Alarm Silenced', 'Audible alert muted. Emergency state remains active in safety log.', 'info');
  };

  // =========================================================================
  // 1. FIRE & SMOKE OPERATIONAL PIPELINE
  // =========================================================================
  const triggerSmokeAlert = (location = 'Science Block · Lab 204', source: EventSource = 'live') => {
    // 1. SENSE: Sensor abnormal obscuration
    setDevices(prev => prev.map(dev => {
      if (dev.location.includes('Lab 204') && (dev.category === 'smoke' || dev.category === 'fan')) {
        return { 
          ...dev, 
          status: dev.category === 'smoke' ? 'critical' : 'warning', 
          lastUpdated: 'Just now' 
        };
      }
      return dev;
    }));

    // 2. DECIDE & ACT: Automated ventilation dampers arrest corridor fans
    setAutomations(prev => prev.map(z => {
      if (z.id === 'ZONE-SCI-204') {
        return { ...z, fansState: 'off', currentPowerKw: 1.1 };
      }
      return z;
    }));

    // 3. NOTIFY: Website message + AnimatedList event feed
    const normEvt = DeviceAdapter.buildEvent(
      'Smoke detected',
      location,
      'DEV-SMK-204',
      'critical',
      source,
      {
        vesdaObscurationPctM: 4.8,
        thermalThresholdC: 56.4,
        hvacDamperState: 'CLOSED / ARRESTED',
        alarmAudibleState: 'ACTIVE'
      }
    );

    const campusEvt = DeviceAdapter.toCampusEvent(normEvt, 'Emergency alarm activated · Damper closed');
    const hvacEvt = DeviceAdapter.toCampusEvent(
      DeviceAdapter.buildEvent('HVAC Emergency Shutdown', location, 'DEV-FAN-204', 'warning', source),
      'Fans OFF to restrict smoke propagation'
    );
    setEvents(prev => [campusEvt, hvacEvt, ...prev]);

    const alert = DeviceAdapter.toCampusAlert(
      normEvt,
      `${source === 'simulation' ? 'SIMULATION: ' : ''}Optical smoke obscuration reached 4.8%/m in ${location}. Dampers closed.`,
      'INC-SMOKE-001'
    );
    setAlerts(prev => [alert, ...prev.filter(a => a.id !== alert.id)]);

    // 4. RECORD: Committed to incident ledger
    const incident = DeviceAdapter.toCampusIncident(
      normEvt,
      location.split('·')[0].trim(),
      `Dual-wavelength optical obscuration detector verified 4.8%/m in ${location}. Mechanical dampers engaged to prevent smoke spread.`,
      'Optical smoke alert verified; damper isolation active',
      'VESDA SAFETY CONTROLLER'
    );
    incident.id = 'INC-SMOKE-001';
    setIncidents(prev => [incident, ...prev.filter(i => i.id !== 'INC-SMOKE-001')]);

    if (source === 'simulation') {
      setActiveSimulations(prev => ({ ...prev, smoke: true }));
    }

    // 5. Sound attempt (Web Audio with autoplay fallback)
    alarmSoundService.startAlarm();
    addToast('CRITICAL EMERGENCY', `Smoke detected in ${location}. Emergency protocol initiated.`, 'error');
  };

  const triggerFireAlert = (location = 'Engineering Block · Floor 2', source: EventSource = 'live') => {
    // 1. SENSE: Thermal delta spike
    setDevices(prev => prev.map(dev => {
      if (dev.location.includes('Engineering') && dev.category === 'fire') {
        return { ...dev, status: 'critical', lastUpdated: 'Just now' };
      }
      return dev;
    }));

    // 2. NOTIFY & ACT
    const normEvt = DeviceAdapter.buildEvent(
      'Fire alarm activated',
      location,
      'DEV-FIR-ENG',
      'critical',
      source,
      {
        thermalReadingC: 72.4,
        heatRiseRate: 'CRITICAL SPIKE',
        suppressionSystem: 'ARMED',
        alarmAudibleState: 'ACTIVE'
      }
    );

    const campusEvt = DeviceAdapter.toCampusEvent(normEvt, 'Critical fire alarm · Evacuation protocol engaged');
    setEvents(prev => [campusEvt, ...prev]);

    const alert = DeviceAdapter.toCampusAlert(
      normEvt,
      `${source === 'simulation' ? 'SIMULATION: ' : ''}Thermal sensor reading exceeded 70°C in ${location}. Evacuation alarm broadcast.`,
      'INC-FIRE-002'
    );
    setAlerts(prev => [alert, ...prev.filter(a => a.id !== alert.id)]);

    // 3. RECORD: Incident ledger
    const incident = DeviceAdapter.toCampusIncident(
      normEvt,
      location.split('·')[0].trim(),
      `Thermal fire sensor verified heat spike >70°C in ${location}. Campus evacuation alarm triggered. Emergency protocols engaged.`,
      'Thermal fire threshold verified; evacuation siren active',
      'FIRE CONTROLLER'
    );
    incident.id = 'INC-FIRE-002';
    setIncidents(prev => [incident, ...prev.filter(i => i.id !== 'INC-FIRE-002')]);

    if (source === 'simulation') {
      setActiveSimulations(prev => ({ ...prev, fire: true }));
    }

    alarmSoundService.startAlarm();
    addToast('CRITICAL EMERGENCY', `FIRE DETECTED in ${location}. Campus evacuation protocol engaged.`, 'error');
  };

  // =========================================================================
  // 2. RESTRICTED ZONE MOTION PIPELINE (NO BIOMETRICS / NO FACIAL RECOGNITION)
  // =========================================================================
  const triggerRestrictedMotion = (zone = 'Engineering Block · Server Room', source: EventSource = 'live') => {
    // 1. SENSE: PIR Motion Pulse
    // 2. DECIDE: High Security Tier 1 zone evaluated
    const normEvt = DeviceAdapter.buildEvent(
      'Restricted area activity',
      zone,
      'DEV-MOT-SRV',
      'warning',
      source,
      {
        detectionType: 'PIR Motion Sensor (Passive Infrared)',
        biometricProfiling: 'EXCLUDED BY POLICY',
        identityMatching: 'DISABLED',
        facialRecognition: 'NOT SUPPORTED',
        securityRule: 'RULE-HIGH-SEC-RESTRICTED-01',
        accessSchedule: 'CLOSED / RESTRICTED HOURS'
      }
    );

    // 3. NOTIFY: Event feed & Warning alert
    const campusEvt = DeviceAdapter.toCampusEvent(
      normEvt,
      'PIR motion verified · Door held locked · Guard notified'
    );
    setEvents(prev => [campusEvt, ...prev]);

    const alert = DeviceAdapter.toCampusAlert(
      normEvt,
      `${source === 'simulation' ? 'SIMULATION: ' : ''}Motion detected in restricted zone (${zone}). Identity tracking excluded by privacy policy.`,
      'INC-RESTRICTED-01'
    );
    setAlerts(prev => [alert, ...prev.filter(a => a.id !== alert.id)]);

    // 4. RECORD: Security Warning Incident
    const incident = DeviceAdapter.toCampusIncident(
      normEvt,
      zone.split('·')[0].trim(),
      `PIR motion detected inside restricted high-security sector (${zone}). Security interlocks held locked. No biometric identification performed.`,
      'Restricted motion detected; automated warning alert logged to security ledger',
      'ACCESS CONTROLLER'
    );
    incident.id = 'INC-RESTRICTED-01';
    setIncidents(prev => [incident, ...prev.filter(i => i.id !== 'INC-RESTRICTED-01')]);

    if (source === 'simulation') {
      setActiveSimulations(prev => ({ ...prev, restrictedMotion: true }));
    }

    addToast('Security Warning', `Motion detected in restricted zone: ${zone}. Security officer dispatched.`, 'warning');
  };

  // =========================================================================
  // 3. OCCUPANCY & ENERGY AUTOMATION PIPELINE
  // =========================================================================
  const triggerZoneOccupancy = (zoneId: string, source: EventSource = 'live') => {
    const zone = automations.find(z => z.id === zoneId);
    if (!zone) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const activeLoadKw = 2.4;

    // SENSE & ACT
    setAutomations(prev => prev.map(z => {
      if (z.id === zoneId) {
        return {
          ...z,
          occupancy: 'occupied',
          lightsState: 'on',
          fansState: 'on',
          currentPowerKw: activeLoadKw,
          automationState: 'active',
          lastMotionTime: timeStr,
          occupantCount: z.occupantCount > 0 ? z.occupantCount : 12
        };
      }
      return z;
    }));

    // NOTIFY & RECORD
    const normEvt = DeviceAdapter.buildEvent(
      'Motion detected',
      `${zone.building} · ${zone.zoneName}`,
      zone.id,
      'info',
      source,
      { occupancy: 'occupied', lights: 'ON', fans: 'ON', loadKw: activeLoadKw }
    );

    const campusEvt = DeviceAdapter.toCampusEvent(
      normEvt,
      `Occupancy confirmed → Lights active (${activeLoadKw} kW)`
    );
    setEvents(prev => [campusEvt, ...prev]);

    addToast('Automation Executed', `Motion detected in ${zone.zoneName}. Lighting & HVAC energized.`, 'info');
  };

  const triggerZoneVacancy = (zoneId: string, source: EventSource = 'live') => {
    const zone = automations.find(z => z.id === zoneId);
    if (!zone) return;

    const baselineKw = 0.2;
    const deltaKw = Math.max(0, zone.currentPowerKw - baselineKw).toFixed(1);

    // SENSE Vacancy timeout & ACT load shedding
    setAutomations(prev => prev.map(z => {
      if (z.id === zoneId) {
        return {
          ...z,
          occupancy: 'vacant',
          lightsState: 'off',
          fansState: 'off',
          currentPowerKw: baselineKw,
          automationState: 'energy_saving',
          occupantCount: 0
        };
      }
      return z;
    }));

    // NOTIFY & RECORD
    const normEvt = DeviceAdapter.buildEvent(
      'Office unoccupied',
      `${zone.building} · ${zone.zoneName}`,
      zone.id,
      'info',
      source,
      { occupancy: 'vacant', lights: 'OFF', fans: 'OFF', loadKw: baselineKw, savedKw: deltaKw }
    );

    const campusEvt = DeviceAdapter.toCampusEvent(
      normEvt,
      `Lights OFF → Fans OFF · Load shed to ${baselineKw} kW`
    );
    setEvents(prev => [campusEvt, ...prev]);

    addToast(
      'Energy Automation',
      `${zone.zoneName} unoccupied. Lighting and ventilation switched off automatically (Load delta: -${deltaKw} kW).`,
      'info'
    );
  };

  // =========================================================================
  // 4. KEYPAD AUTHENTICATION & ACCESS CONTROL
  // =========================================================================
  const submitKeypadPin = async (
    doorId: string, 
    pin: string, 
    source: EventSource = 'live'
  ): Promise<{ success: boolean; message: string }> => {
    const door = doors.find(d => d.id === doorId);
    if (!door) return { success: false, message: 'Portal not found' };

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isCorrect = pin === '4821' || pin === '1234' || pin === '7789';

    if (isCorrect) {
      // ACCESS GRANTED (NO "person identified" claims)
      setDoors(prev => prev.map(d => {
        if (d.id === doorId) {
          return {
            ...d,
            lockStatus: 'unlocked',
            keypadStatus: 'normal',
            failedAttempts: 0,
            isSecurityAlert: false,
            lastEventTime: timeStr,
            lastEventText: 'Access granted · Authorized credential accepted'
          };
        }
        return d;
      }));

      // Clear alerts for this door
      setAlerts(prev => prev.filter(a => a.doorId !== doorId));

      const normEvt = DeviceAdapter.buildEvent(
        'Access granted',
        `${door.building} · ${door.name}`,
        door.id,
        'info',
        source,
        {
          authResult: 'GRANTED',
          credentialAccepted: true,
          identificationClaim: 'NO BIOMETRIC IDENTIFICATION'
        }
      );

      const campusEvt = DeviceAdapter.toCampusEvent(normEvt, 'Authorized credential accepted');
      setEvents(prev => [campusEvt, ...prev]);

      addToast('Access Granted', `Authorized credential accepted at ${door.name}.`, 'success');
      return { success: true, message: 'Authorized credential accepted' };
    } else {
      // ACCESS DENIED
      const nextFailures = door.failedAttempts + 1;
      const isLockout = nextFailures >= 3;

      setDoors(prev => prev.map(d => {
        if (d.id === doorId) {
          return {
            ...d,
            lockStatus: 'locked', // Door strictly remains locked
            keypadStatus: isLockout ? 'alert' : 'normal',
            failedAttempts: nextFailures,
            isSecurityAlert: isLockout,
            lastEventTime: timeStr,
            lastEventText: isLockout 
              ? `3 failed keypad attempts · Auto-lock held` 
              : `Access denied · Invalid PIN attempt (${nextFailures}/3)`
          };
        }
        return d;
      }));

      const actionText = isLockout 
        ? 'Repeated access failure (3/3) · Auto-lock held · Keypad locked out' 
        : `Door held locked · Keypad attempt rejected (${nextFailures}/3)`;

      const denyEvt = DeviceAdapter.buildEvent(
        isLockout ? 'Repeated access failure' : 'Access denied',
        `${door.building} · ${door.name}`,
        door.id,
        'warning',
        source,
        { attempts: nextFailures, lockoutEngaged: isLockout }
      );

      const campusEvt = DeviceAdapter.toCampusEvent(denyEvt, actionText);
      setEvents(prev => [campusEvt, ...prev]);

      if (isLockout) {
        const breachAlert = DeviceAdapter.toCampusAlert(
          denyEvt,
          `${source === 'simulation' ? 'SIMULATION: ' : ''}3 consecutive invalid keypad codes entered at ${door.name}. High-security lockout engaged.`,
          `INC-DOOR-${door.id}`
        );
        breachAlert.doorId = door.id;
        setAlerts(prev => [breachAlert, ...prev.filter(a => a.doorId !== door.id)]);

        const breachIncident = DeviceAdapter.toCampusIncident(
          denyEvt,
          door.building,
          `Keypad security violation at ${door.name}. Multiple failed credential attempts. Anti-tamper magnetic lock energized with 1200 lb holding force.`,
          'Keypad input suspended for 180s after 3 invalid attempts',
          'KEYPAD FIRMWARE'
        );
        breachIncident.id = `INC-DOOR-${door.id}`;
        setIncidents(prev => [breachIncident, ...prev.filter(i => i.id !== `INC-DOOR-${door.id}`)]);

        addToast('Security Alert', `Repeated access failure at ${door.name}. High-security lockout engaged.`, 'error');
      } else {
        addToast('Access Denied', `Invalid PIN entered at ${door.name}. Attempt ${nextFailures} of 3.`, 'warning');
      }

      return { 
        success: false, 
        message: isLockout ? 'Repeated access failure · Lockout active' : 'Invalid keypad credential' 
      };
    }
  };

  // =========================================================================
  // 5. IOT DEVICE FAILURE & RECOVERY
  // =========================================================================
  const toggleDeviceOnline = (deviceId: string) => {
    const dev = devices.find(d => d.id === deviceId);
    if (!dev) return;

    const isNowOffline = dev.status === 'online';
    const newStatus = isNowOffline ? 'offline' : 'online';

    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return {
          ...d,
          status: newStatus,
          lastUpdated: 'Just now',
          signalStrength: isNowOffline ? 0 : 96
        };
      }
      return d;
    }));

    const normEvt = DeviceAdapter.buildEvent(
      isNowOffline ? 'Device offline' : 'Device restored',
      dev.location,
      dev.id,
      isNowOffline ? (dev.category === 'smoke' || dev.category === 'fire' ? 'critical' : 'warning') : 'info',
      'live',
      { previousStatus: dev.status, currentStatus: newStatus }
    );

    const campusEvt = DeviceAdapter.toCampusEvent(
      normEvt,
      isNowOffline ? 'Sensor heartbeat unavailable' : 'Hardware heartbeat restored'
    );
    setEvents(prev => [campusEvt, ...prev]);

    if (isNowOffline) {
      addToast('Device Offline', `${dev.name} (${dev.location}) heartbeat lost.`, 'warning');
    } else {
      addToast('Device Restored', `${dev.name} is back online with normal telemetry.`, 'success');
    }
  };

  // =========================================================================
  // 6. ESP32-CAM STREAM MANAGEMENT
  // =========================================================================
  const updateCameraStream = async (cameraId: string, streamUrl?: string) => {
    const cam = cameras.find(c => c.id === cameraId);
    if (!cam) return;

    if (!streamUrl || streamUrl.trim() === '') {
      setCameras(prev => prev.map(c => {
        if (c.id === cameraId) {
          return {
            ...c,
            status: 'simulation',
            streamUrl: undefined,
            streamError: undefined,
            isESP32: false
          };
        }
        return c;
      }));
      addToast('Camera Set to Simulation', `${cam.name} set to simulated feed (no hardware connected).`, 'info');
      return;
    }

    addToast('Probing Stream', `Testing endpoint ${streamUrl}...`, 'info');
    const result = await CameraTransport.probeStream(streamUrl);

    setCameras(prev => prev.map(c => {
      if (c.id === cameraId) {
        return {
          ...c,
          streamUrl,
          status: result.status,
          streamError: result.error,
          isESP32: true
        };
      }
      return c;
    }));

    const normEvt = DeviceAdapter.buildEvent(
      result.status === 'live' ? 'Camera stream online' : 'Camera stream unavailable',
      cam.location,
      cam.id,
      result.status === 'live' ? 'info' : 'warning',
      result.status === 'live' ? 'live' : 'simulation',
      { streamUrl, error: result.error }
    );

    setEvents(prev => [
      DeviceAdapter.toCampusEvent(
        normEvt, 
        result.status === 'live' ? 'ESP32-CAM stream connected' : 'Camera stream probe failed'
      ), 
      ...prev
    ]);

    if (result.status === 'live') {
      addToast('ESP32-CAM Connected', `Live stream established for ${cam.name}.`, 'success');
    } else {
      addToast('Camera Offline', result.error || 'Failed to reach camera endpoint.', 'error');
    }
  };

  const setCameraStatus = (cameraId: string, status: CameraStreamState) => {
    setCameras(prev => prev.map(c => {
      if (c.id === cameraId) {
        return { ...c, status };
      }
      return c;
    }));
  };

  // =========================================================================
  // 7. SIMULATION METHODS (TEST SCENARIOS)
  // =========================================================================
  const simulateFire = () => {
    if (!canRunSimulations) {
      addToast('Permission Denied', 'Your role cannot trigger IoT simulations.', 'error');
      return;
    }
    triggerFireAlert('Engineering Block · Floor 2', 'simulation');
  };

  const simulateSmoke = () => {
    if (!canRunSimulations) {
      addToast('Permission Denied', 'Your role cannot trigger IoT simulations.', 'error');
      return;
    }
    triggerSmokeAlert('Science Block · Lab 204', 'simulation');
  };

  const simulateBreach = () => {
    if (!canRunSimulations) {
      addToast('Permission Denied', 'Your role cannot trigger IoT simulations.', 'error');
      return;
    }
    submitKeypadPin('DOOR-ENG-E04', '9999', 'simulation');
    submitKeypadPin('DOOR-ENG-E04', '8888', 'simulation');
    submitKeypadPin('DOOR-ENG-E04', '7777', 'simulation');
  };

  const simulateRestrictedMotion = () => {
    if (!canRunSimulations) {
      addToast('Permission Denied', 'Your role cannot trigger IoT simulations.', 'error');
      return;
    }
    triggerRestrictedMotion('Engineering Block · Server Room', 'simulation');
  };

  const resetSimulation = () => {
    if (!canRunSimulations) {
      addToast('Permission Denied', 'Your role cannot reset simulations.', 'error');
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Stop audible alarm
    alarmSoundService.stopAlarm();

    // Restore Devices
    setDevices(prev => prev.map(dev => {
      if (dev.status === 'critical' || dev.status === 'warning') {
        return { ...dev, status: 'online', lastUpdated: 'Just now' };
      }
      return dev;
    }));

    // Clear simulation active alerts
    setAlerts(prev => prev.filter(a => a.source !== 'simulation'));

    // Reset Door states
    setDoors(prev => prev.map(d => ({
      ...d,
      lockStatus: 'locked',
      keypadStatus: 'normal',
      failedAttempts: 0,
      isSecurityAlert: false,
      lastEventTime: timeStr,
      lastEventText: 'Baseline restored · Normal security standby'
    })));

    // Restore Automations
    setAutomations(prev => prev.map(z => ({
      ...z,
      lightsState: z.id === 'ZONE-SCI-204' ? 'on' : z.lightsState,
      fansState: z.id === 'ZONE-SCI-204' ? 'on' : z.fansState,
      currentPowerKw: z.id === 'ZONE-SCI-204' ? 2.4 : z.currentPowerKw
    })));

    // Mark simulation incidents resolved
    setIncidents(prev => prev.map(inc => {
      if (inc.source === 'simulation' && inc.status !== 'resolved') {
        return {
          ...inc,
          status: 'resolved',
          resolvedAt: timeStr,
          auditTimeline: [
            ...inc.auditTimeline,
            { 
              time: timeStr, 
              action: 'Simulation session reset by operator. Hardware baseline restored.', 
              actor: userRole.toUpperCase() 
            }
          ]
        };
      }
      return inc;
    }));

    // Record reset event in feed
    setEvents(prev => [
      {
        id: 'EVT-RESET-' + Date.now(),
        time: timeStr,
        eventType: 'Simulation Reset Executed',
        location: 'Operations Console',
        resultingAction: 'Sensors restored; audit trail preserved',
        severity: 'info',
        source: 'simulation'
      },
      ...prev
    ]);

    setActiveSimulations({ 
      fire: false, 
      smoke: false, 
      breach: false, 
      restrictedMotion: false 
    });
    addToast('Simulation Reset', 'Simulated emergency states cleared. Historical incident logs preserved.', 'success');
  };

  // Remote Door Unlock with Intentional Confirmation Flow
  const requestUnlockDoor = (doorId: string) => {
    if (!canManageDoors) {
      addToast('Unauthorized', 'Students and unauthorized roles cannot unlock security doors.', 'error');
      return;
    }

    const door = doors.find(d => d.id === doorId);
    if (!door) return;

    showConfirmModal({
      title: `Unlock ${door.name}?`,
      message: `This will remotely release the magnetic lock for ${door.building}. Ensure authorized personnel or monitoring is present at the location.`,
      confirmLabel: 'Confirm Remote Unlock',
      isDestructive: false,
      onConfirm: () => {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setDoors(prev => prev.map(d => {
          if (d.id === doorId) {
            return {
              ...d,
              lockStatus: 'unlocked',
              lastEventTime: timeStr,
              lastEventText: `Remote unlock authorized by ${userRole.toUpperCase()}`
            };
          }
          return d;
        }));

        setEvents(prev => [
          {
            id: 'EVT-DOOR-UNL-' + Date.now(),
            time: timeStr,
            eventType: 'Door Unlocked Remotely',
            location: `${door.building} · ${door.name}`,
            resultingAction: 'Magnetic lock released by operator',
            severity: 'info',
            source: 'live'
          },
          ...prev
        ]);

        closeConfirmModal();
        addToast('Door Unlocked', `${door.name} has been remotely unlocked.`, 'success');
      }
    });
  };

  const lockDoor = (doorId: string) => {
    if (!canManageDoors) {
      addToast('Unauthorized', 'You do not have permission to lock security doors.', 'error');
      return;
    }

    const door = doors.find(d => d.id === doorId);
    if (!door) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setDoors(prev => prev.map(d => {
      if (d.id === doorId) {
        return {
          ...d,
          lockStatus: 'locked',
          isSecurityAlert: false,
          keypadStatus: 'normal',
          lastEventTime: timeStr,
          lastEventText: `Locked and armed by ${userRole.toUpperCase()}`
        };
      }
      return d;
    }));

    setEvents(prev => [
      {
        id: 'EVT-DOOR-LCK-' + Date.now(),
        time: timeStr,
        eventType: 'Door Locked & Armed',
        location: `${door.building} · ${door.name}`,
        resultingAction: 'Magnetic lock fully engaged',
        severity: 'info',
        source: 'live'
      },
      ...prev
    ]);

    addToast('Door Locked', `${door.name} has been securely locked.`, 'info');
  };

  // Alert & Incident Handlers
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        return { ...a, acknowledged: true };
      }
      return a;
    }));
    addToast('Alert Acknowledged', 'Alert marked as acknowledged by operator.', 'info');
  };

  const acknowledgeIncident = (incidentId: string) => {
    if (!canManageIncidents) {
      addToast('Unauthorized', 'Your role cannot acknowledge incidents.', 'error');
      return;
    }
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        const updated: CampusIncident = {
          ...inc,
          status: 'acknowledged',
          assignedOfficer: userRole === 'security_officer' ? 'Security Officer On Duty' : 'Operations Admin',
          auditTimeline: [
            ...inc.auditTimeline,
            { time: timeStr, action: 'Incident acknowledged and under active response', actor: userRole.toUpperCase() }
          ]
        };
        if (selectedIncident?.id === incidentId) setSelectedIncident(updated);
        return updated;
      }
      return inc;
    }));
    addToast('Incident Acknowledged', `Incident ${incidentId} status updated to Acknowledged.`, 'info');
  };

  const resolveIncident = (incidentId: string) => {
    if (!canManageIncidents) {
      addToast('Unauthorized', 'Your role cannot resolve incidents.', 'error');
      return;
    }
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        const updated: CampusIncident = {
          ...inc,
          status: 'resolved',
          resolvedAt: timeStr,
          auditTimeline: [
            ...inc.auditTimeline,
            { time: timeStr, action: 'Incident verified and marked Resolved', actor: userRole.toUpperCase() }
          ]
        };
        if (selectedIncident?.id === incidentId) setSelectedIncident(updated);
        return updated;
      }
      return inc;
    }));
    addToast('Incident Resolved', `Incident ${incidentId} marked as Resolved.`, 'success');
  };

  return (
    <StateContext.Provider
      value={{
        userRole,
        setUserRole,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        campusStatus,
        isSimulationActive,
        activeSimulations,
        devices,
        alerts,
        incidents,
        events,
        automations,
        doors,
        cameras,
        selectedIncident,
        setSelectedIncident,
        selectedDevice,
        setSelectedDevice,
        confirmModal,
        closeConfirmModal,
        showConfirmModal,
        toasts,
        dismissToast,
        addToast,
        isAlarmRinging: alarmState.isRinging,
        isAlarmMuted: alarmState.isMuted,
        audioAutoplayBlocked: alarmState.autoplayBlocked,
        enableAlarmAudio,
        silenceAlarm,
        triggerFireAlert,
        triggerSmokeAlert,
        triggerRestrictedMotion,
        triggerZoneOccupancy,
        triggerZoneVacancy,
        submitKeypadPin,
        toggleDeviceOnline,
        updateCameraStream,
        setCameraStatus,
        simulateFire,
        simulateSmoke,
        simulateBreach,
        simulateRestrictedMotion,
        resetSimulation,
        requestUnlockDoor,
        lockDoor,
        acknowledgeAlert,
        acknowledgeIncident,
        resolveIncident,
        canManageDoors,
        canManageIncidents,
        canRunSimulations,
        canManageDevices,
        canAccessSystemSettings
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useAppState must be used within a StateProvider');
  }
  return context;
};

export default StateContext;
