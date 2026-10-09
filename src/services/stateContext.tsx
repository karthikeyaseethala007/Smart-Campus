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
  ToastMessage,
  AuditRecord
} from '../types';
import {
  INITIAL_DEVICES,
  INITIAL_ALERTS,
  INITIAL_INCIDENTS,
  INITIAL_EVENTS,
  INITIAL_AUTOMATIONS,
  INITIAL_DOORS,
  INITIAL_CAMERAS,
  INITIAL_AUDIT_LOG
} from './mockData';
import { alarmSoundService } from './alarmSoundService';
import { DeviceAdapter } from './deviceAdapter';
import { CameraTransport } from './cameraTransport';
import { eventBus } from './eventBus';
import { realtimeGateway, type RealtimeConnectionState, type RealtimeMode } from './realtimeGateway';
import { healthService, type SubsystemName, type ComponentHealth } from './healthService';
import { persistenceService } from './persistenceService';
import { authService, type AuthUser } from './authService';
import { sensorAdapter } from './adapters/sensorAdapter';
import { accessWiegandAdapter } from './adapters/accessWiegandAdapter';
import { cctvMediaAdapter } from './adapters/cctvMediaAdapter';
import { campusSimulator } from './campusSimulator';
import type { CampusNormalizedEvent } from '../types/events';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

export type AuthBootstrapState =
  | 'AUTHENTICATION_UNKNOWN'
  | 'AUTHENTICATION_VERIFYING'
  | 'AUTHENTICATED'
  | 'UNAUTHENTICATED';

interface StateContextType {
  // Realtime Gateway & Infrastructure Health
  connectionState: RealtimeConnectionState;
  realtimeMode: RealtimeMode;
  systemHealth: Record<SubsystemName, ComponentHealth>;
  authSession: AuthUser;
  isAuthenticated: boolean;
  authBootstrapState: AuthBootstrapState;
  gatewayUnavailable: boolean;
  login: (username: string, password?: string) => Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
    lockedOut?: boolean;
    retryAfterSeconds?: number;
    lockedUntil?: string;
    attempts?: number;
  }>;
  logout: () => Promise<void>;
  syncSession: (user: AuthUser) => void;

  // Navigation & Role
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Spatial Zone Context
  selectedZone: string;
  setSelectedZone: (zone: string) => void;

  // Surveillance Focus
  selectedCameraId: string;
  setSelectedCameraId: (cameraId: string) => void;

  // System Status
  campusStatus: 'SECURE' | 'EMERGENCY' | 'WARNING';
  isSimulationActive: boolean;
  isSystemDegraded: boolean;
  setIsSystemDegraded: (degraded: boolean) => void;
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
  setIncidents: React.Dispatch<React.SetStateAction<CampusIncident[]>>;
  events: CampusEvent[];
  automations: ZoneAutomation[];
  doors: SmartDoor[];
  cameras: CameraFeed[];
  auditLog: AuditRecord[];

  // Selected Detail Modals
  selectedIncident: CampusIncident | null;
  setSelectedIncident: (incident: CampusIncident | null) => void;
  selectedDevice: IoTDevice | null;
  setSelectedDevice: (device: IoTDevice | null) => void;

  // Confirmation Modal
  confirmModal: ConfirmDialogState | null;
  closeConfirmModal: () => void;
  showConfirmModal: (dialog: Omit<ConfirmDialogState, 'isOpen'>) => void;

  // Command Palette
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;

  // Notifications / Toasts
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;

  // Audit Logging
  addAuditRecord: (
    action: string,
    target: string,
    result: 'SUCCESS' | 'DENIED' | 'FAILED' | 'ESCALATED',
    details: string,
    zone?: string
  ) => void;

  // Alarm Audio
  isAlarmRinging: boolean;
  isAlarmMuted: boolean;
  audioAutoplayBlocked: boolean;
  enableAlarmAudio: () => void;
  silenceAlarm: () => void;

  // Operational IoT Event Actions
  triggerFireAlert: (location?: string, source?: EventSource) => void;
  triggerSmokeAlert: (location?: string, source?: EventSource) => void;
  triggerMQ2Elevation: (ppm?: number) => void;
  resetMQ2Calibration: () => void;
  triggerRestrictedMotion: (zone?: string, source?: EventSource) => void;
  triggerZoneOccupancy: (zoneId: string, source?: EventSource) => void;
  triggerZoneVacancy: (zoneId: string, source?: EventSource) => void;
  submitKeypadPin: (doorId: string, pin: string, source?: EventSource) => Promise<{ success: boolean; message: string }>;
  toggleDeviceOnline: (deviceId: string) => void;
  updateCameraStream: (cameraId: string, streamUrl?: string) => Promise<void>;
  setCameraStatus: (cameraId: string, status: CameraStreamState) => void;
  captureCameraSnapshot: (cameraId: string) => void;
  ptzCameraAction: (cameraId: string, action: string) => void;

  // High-Security Zone Lockdown
  lockdownZone: (zoneName: string) => void;

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
  investigateIncident: (incidentId: string) => void;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());

  const [authBootstrapState, setAuthBootstrapState] = useState<AuthBootstrapState>(() => {
    if (typeof window !== 'undefined') {
      const rawPath = window.location.pathname || '/';
      const pathname = rawPath.toLowerCase().replace(/\/+$/, '') || '/';
      if (pathname === '/' || pathname === '') return 'UNAUTHENTICATED';
      if (pathname === '/login') return 'UNAUTHENTICATED';
      if (pathname === '/app' || pathname.startsWith('/app')) {
        return 'AUTHENTICATION_VERIFYING';
      }
    }
    return 'AUTHENTICATION_UNKNOWN';
  });

  const [gatewayUnavailable, setGatewayUnavailable] = useState<boolean>(false);

  const [activeTab, setActiveTabState] = useState<NavigationTab>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      // Explicit logout or reauth query parameters
      if (searchParams.get('logout') === 'true' || searchParams.get('logout') === '1') {
        authService.logout();
        window.history.replaceState(null, '', '/login');
        return 'login';
      }

      const urlTab = searchParams.get('tab') as NavigationTab;
      if (urlTab && urlTab !== 'landing') return urlTab;

      const rawPath = window.location.pathname || '/';
      const pathname = rawPath.toLowerCase().replace(/\/+$/, '') || '/';

      if (pathname === '/login') {
        if (authService.isAuthenticated()) {
          if (searchParams.get('reauth') === 'true' || searchParams.get('switch') === 'true') {
            return 'login';
          }
          window.history.replaceState(null, '', '/app');
          return 'overview';
        }
        return 'login';
      }

      if (pathname === '/' || pathname === '') return 'landing';

      // Unauthenticated access to /app redirects to /login
      if (pathname === '/app' || pathname.startsWith('/app')) {
        if (!authService.isAuthenticated()) {
          window.history.replaceState(null, '', '/login');
          return 'login';
        }
        if (pathname.startsWith('/app/cameras')) return 'monitoring';
        if (pathname.startsWith('/app/access')) return 'security';
        if (pathname.startsWith('/app/sensors')) return 'safety';
        if (pathname.startsWith('/app/incidents') || pathname.startsWith('/app/audit')) return 'incidents';
        if (pathname.startsWith('/app/energy')) return 'energy';
        const sub = pathname.replace(/^\/app\/?/, '').split('/')[0] as NavigationTab;
        return sub || 'overview';
      }
    }
    return 'landing';
  });

  const setActiveTab = (tab: NavigationTab) => {
    let targetTab = tab;
    // Auth route guards
    if (tab !== 'landing' && tab !== 'login' && !authService.isAuthenticated()) {
      targetTab = 'login';
    } else if (tab === 'login' && authService.isAuthenticated()) {
      targetTab = 'overview';
    }

    setActiveTabState(targetTab);
    if (typeof window !== 'undefined') {
      let targetPath = '/app';
      if (targetTab === 'landing') targetPath = '/';
      else if (targetTab === 'login') targetPath = '/login';
      else if (targetTab === 'overview') targetPath = '/app';
      else if (targetTab === 'monitoring') targetPath = '/app/cameras';
      else if (targetTab === 'security') targetPath = '/app/access';
      else if (targetTab === 'safety') targetPath = '/app/sensors';
      else if (targetTab === 'incidents') targetPath = '/app/incidents';
      else if (targetTab === 'energy') targetPath = '/app/energy';
      else targetPath = `/app?tab=${targetTab}`;

      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('logout') === 'true' || searchParams.get('logout') === '1') {
        authService.logout();
        setIsAuthenticated(false);
        setActiveTabState('login');
        return;
      }

      const urlTab = searchParams.get('tab') as NavigationTab;
      if (urlTab && urlTab !== 'landing') {
        setActiveTabState(urlTab);
      } else {
        const rawPath = window.location.pathname || '/';
        const pathname = rawPath.toLowerCase().replace(/\/+$/, '') || '/';

        if (pathname === '/login') {
          if (authService.isAuthenticated()) {
            if (searchParams.get('reauth') === 'true' || searchParams.get('switch') === 'true') {
              setActiveTabState('login');
              return;
            }
            window.history.replaceState(null, '', '/app');
            setActiveTabState('overview');
          } else {
            setActiveTabState('login');
          }
        } else if (pathname === '/' || pathname === '') {
          setActiveTabState('landing');
        } else if (pathname === '/app' || pathname.startsWith('/app')) {
          if (!authService.isAuthenticated()) {
            window.history.replaceState(null, '', '/login');
            setActiveTabState('login');
          } else {
            if (pathname.startsWith('/app/cameras')) setActiveTabState('monitoring');
            else if (pathname.startsWith('/app/access')) setActiveTabState('security');
            else if (pathname.startsWith('/app/sensors')) setActiveTabState('safety');
            else if (pathname.startsWith('/app/incidents') || pathname.startsWith('/app/audit')) setActiveTabState('incidents');
            else if (pathname.startsWith('/app/energy')) setActiveTabState('energy');
            else setActiveTabState('overview');
          }
        } else {
          setActiveTabState('landing');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Authoritative Server Session Verification on Mount (Phase 3 & Phase 4)
  useEffect(() => {
    let isMounted = true;
    const verifyAuthoritativeSession = async () => {
      const rawPath = typeof window !== 'undefined' ? window.location.pathname || '/' : '/';
      const pathname = rawPath.toLowerCase().replace(/\/+$/, '') || '/';
      const isAppRoute = pathname === '/app' || pathname.startsWith('/app');

      if (!authService.getSessionToken()) {
        if (!isMounted) return;
        setIsAuthenticated(false);
        setAuthBootstrapState('UNAUTHENTICATED');
        if (isAppRoute) {
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/login');
          }
          setActiveTabState('login');
        }
        return;
      }

      setAuthBootstrapState('AUTHENTICATION_VERIFYING');
      const result = await authService.validateServerSession();
      if (!isMounted) return;

      if (result.authenticated && result.user) {
        setIsAuthenticated(true);
        setAuthBootstrapState('AUTHENTICATED');
        setUserRoleState(result.user.role);
        setAuthSession(result.user);
        setGatewayUnavailable(false);
      } else {
        setIsAuthenticated(false);
        setAuthBootstrapState('UNAUTHENTICATED');
        if (result.gatewayUnavailable) {
          setGatewayUnavailable(true);
        }
        if (isAppRoute) {
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/login');
          }
          setActiveTabState('login');
        }
      }
    };
    verifyAuthoritativeSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');

  // Spatial Zone & Camera Focus
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedCameraId, setSelectedCameraId] = useState<string>('CAM-01');

  // Command Palette & System Health States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSystemDegraded, setIsSystemDegraded] = useState(false);

  // Global Structured Audit Trail & Session
  const [userRole, setUserRoleState] = useState<UserRole>(() => persistenceService.loadUserRole() || 'admin');
  const [authSession, setAuthSession] = useState<AuthUser>(() => authService.getCurrentUser());
  const [auditLog, setAuditLog] = useState<AuditRecord[]>(() => persistenceService.loadAuditLog() || INITIAL_AUDIT_LOG);

  // Realtime Gateway & Subsystems Health
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>(realtimeGateway.getConnectionState());
  const [realtimeMode, setRealtimeMode] = useState<RealtimeMode>(realtimeGateway.getMode());
  const [systemHealth, setSystemHealth] = useState<Record<SubsystemName, ComponentHealth>>(() => healthService.getSnapshot());

  // Domain Collections with Persistence Fallback
  const [devices, setDevices] = useState<IoTDevice[]>(INITIAL_DEVICES);
  const [alerts, setAlerts] = useState<CampusAlert[]>(INITIAL_ALERTS);
  const [incidents, setIncidents] = useState<CampusIncident[]>(() => persistenceService.loadIncidents() || INITIAL_INCIDENTS);
  const [events, setEvents] = useState<CampusEvent[]>(() => persistenceService.loadEvents() || INITIAL_EVENTS);
  const [automations, setAutomations] = useState<ZoneAutomation[]>(INITIAL_AUTOMATIONS);
  const [doors, setDoors] = useState<SmartDoor[]>(INITIAL_DOORS);
  const [cameras, setCameras] = useState<CameraFeed[]>(INITIAL_CAMERAS);

  // Keyboard shortcut for ⌘K / Ctrl+K Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync to Persistence Layer
  useEffect(() => {
    persistenceService.saveIncidents(incidents);
  }, [incidents]);

  useEffect(() => {
    persistenceService.saveAuditLog(auditLog);
  }, [auditLog]);

  useEffect(() => {
    persistenceService.saveEvents(events);
  }, [events]);

  // Connect to Realtime Gateway & Health Observability
  useEffect(() => {
    realtimeGateway.connect();
    const unsubGateway = realtimeGateway.subscribe((state, meta) => {
      setConnectionState(state);
      setRealtimeMode(meta.mode);
      if (state === 'DEGRADED') {
        setIsSystemDegraded(true);
      } else if (state === 'CONNECTED') {
        setIsSystemDegraded(false);
      }
    });

    const unsubHealth = healthService.subscribe((snap) => {
      setSystemHealth(snap);
    });

    return () => {
      unsubGateway();
      unsubHealth();
    };
  }, []);

  // Manage Simulator Lifecycle Behind Central Event Bus
  useEffect(() => {
    if (isSystemDegraded) {
      campusSimulator.stopBackgroundSimulation();
      return;
    }
    campusSimulator.startBackgroundSimulation();
    const unsubSim = campusSimulator.subscribe((active) => {
      setActiveSimulations(active);
    });
    return () => {
      campusSimulator.stopBackgroundSimulation();
      unsubSim();
    };
  }, [isSystemDegraded]);

  // Central Event Bus Subscription: Handles all normalized campus events
  useEffect(() => {
    const unsubBus = eventBus.subscribe('*', (event: CampusNormalizedEvent) => {
      switch (event.type) {
        case 'MQ2_READING': {
          const { ppm, status, sensorId } = event.payload;
          setDevices((prev) =>
            prev.map((dev) => {
              if (
                dev.id === sensorId ||
                (dev.location.includes('Lab 204') && (dev.category === 'smoke' || dev.category === 'fan'))
              ) {
                return {
                  ...dev,
                  status: status === 'CRITICAL' ? 'critical' : status === 'ELEVATED' ? 'warning' : 'online',
                  lastUpdated: 'Just now',
                };
              }
              return dev;
            })
          );

          setAutomations((prev) =>
            prev.map((z) => {
              if (z.id === 'ZONE-SCI-204') {
                return {
                  ...z,
                  fansState: status === 'NORMAL' ? 'on' : 'off',
                  currentPowerKw: status === 'NORMAL' ? 1.8 : 1.1,
                };
              }
              return z;
            })
          );

          if (status !== 'NORMAL') {
            const incId = 'INC-GAS-003';
            const location = 'Science Block · Lab 204';
            const zoneName = 'Science & Physics Lab';
            const incident: CampusIncident = {
              id: incId,
              event: 'MQ-2 Gas Sensor Elevated',
              location,
              zone: zoneName,
              severity: status === 'CRITICAL' ? 'critical' : 'warning',
              source: event.source === 'simulation' ? 'simulation' : 'live',
              status: 'open',
              timestamp: event.timestamp,
              description: `Electrochemical MQ-2 sensor detected ${ppm} ppm (safety limit: 500 ppm). Automated dampers sealed to isolate corridor ventilation.`,
              telemetry: {
                'Sensor Type': 'MQ-2 Solid-State Chemiresistor',
                'Concentration': `${ppm} ppm`,
                'Safety Limit': '500 ppm',
                'Damper State': 'ISOLATED',
              },
              auditTimeline: [
                {
                  time: event.timestamp,
                  action: `Sensor threshold violation detected (${ppm} ppm). Isolation relay energized.`,
                  actor: 'SAFETY CONTROLLER',
                },
              ],
            };
            setIncidents((prev) => [incident, ...prev.filter((i) => i.id !== incId)]);

            const alert: CampusAlert = {
              id: 'ALT-GAS-003',
              title: 'MQ-2 Gas Concentration Elevated',
              location,
              timestamp: event.timestamp,
              severity: status === 'CRITICAL' ? 'critical' : 'warning',
              source: event.source === 'simulation' ? 'simulation' : 'live',
              details: `MQ-2 electrochemical sensor verified ${ppm} ppm in ${location}. Hazard protocol engaged.`,
              incidentId: incId,
              acknowledged: false,
            };
            setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
          } else {
            setIncidents((prev) =>
              prev.map((inc) => {
                if (inc.id === 'INC-GAS-003' && inc.status !== 'resolved') {
                  return {
                    ...inc,
                    status: 'resolved',
                    resolvedAt: event.timestamp,
                    auditTimeline: [
                      ...inc.auditTimeline,
                      {
                        time: event.timestamp,
                        action: `MQ-2 stabilized at ${ppm} ppm. Baseline restored.`,
                        actor: 'ENVIRONMENTAL CONTROLLER',
                      },
                    ],
                  };
                }
                return inc;
              })
            );
            setAlerts((prev) => prev.filter((a) => a.id !== 'ALT-GAS-003' && !a.title.includes('MQ-2')));
          }
          break;
        }

        case 'ENERGY_DEMAND': {
          const { zoneId, currentPowerKw } = event.payload;
          setAutomations((prev) =>
            prev.map((z) => {
              if (z.zoneName === zoneId || z.id === zoneId) {
                return { ...z, currentPowerKw };
              }
              return z;
            })
          );
          break;
        }

        case 'ACCESS_GRANTED': {
          const { doorId, cardholder } = event.payload;
          setDoors((prev) =>
            prev.map((d) => {
              if (d.id === doorId) {
                return {
                  ...d,
                  lockStatus: 'unlocked',
                  lastEventTime: event.timestamp,
                  lastEventText: `Access Granted: ${cardholder}`,
                  failedAttempts: 0,
                  isSecurityAlert: false,
                };
              }
              return d;
            })
          );
          setTimeout(() => {
            setDoors((prev) => (prev.map((d) => (d.id === doorId ? { ...d, lockStatus: 'locked' } : d))));
          }, 8000);
          break;
        }

        case 'ACCESS_DENIED': {
          const { doorId, reason, failedAttempts } = event.payload;
          setDoors((prev) =>
            prev.map((d) => {
              if (d.id === doorId) {
                return {
                  ...d,
                  failedAttempts,
                  lastEventTime: event.timestamp,
                  lastEventText: `Access Denied: ${reason}`,
                };
              }
              return d;
            })
          );
          break;
        }

        case 'ACCESS_LOCKOUT': {
          const { doorId, consecutiveFailures, durationSeconds } = event.payload;
          setDoors((prev) =>
            prev.map((d) => {
              if (d.id === doorId) {
                return {
                  ...d,
                  lockStatus: 'locked',
                  keypadStatus: 'alert',
                  isSecurityAlert: true,
                  failedAttempts: consecutiveFailures,
                  lastEventTime: event.timestamp,
                  lastEventText: `LOCKOUT: ${consecutiveFailures} violations (${durationSeconds}s)`,
                };
              }
              return d;
            })
          );

          const alert: CampusAlert = {
            id: `ALT-LOCKOUT-${doorId}`,
            title: 'Keypad Tamper Lockout Active',
            location: doorId,
            timestamp: event.timestamp,
            severity: 'critical',
            source: event.source === 'simulation' ? 'simulation' : 'live',
            details: `3 consecutive failed PIN attempts on ${doorId}. Electronic portal locked down.`,
            doorId,
            acknowledged: false,
          };
          setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
          break;
        }

        case 'ACCESS_OVERRIDE': {
          const { doorId, state, actor } = event.payload;
          setDoors((prev) =>
            prev.map((d) => {
              if (d.id === doorId) {
                return {
                  ...d,
                  lockStatus: state,
                  lastEventTime: event.timestamp,
                  lastEventText: `Manual Override to ${state.toUpperCase()} by ${actor}`,
                  isSecurityAlert: false,
                };
              }
              return d;
            })
          );
          break;
        }

        case 'CAMERA_STREAM_STATE': {
          const { cameraId, status } = event.payload;
          setCameras((prev) =>
            prev.map((c) => {
              if (c.id === cameraId) {
                return {
                  ...c,
                  status: status === 'offline' ? 'offline' : status === 'degraded' ? 'simulation' : 'live',
                };
              }
              return c;
            })
          );
          break;
        }

        case 'INCIDENT_DETECTED': {
          const { incidentId, title, zone, severity, details, telemetry } = event.payload;
          const newInc: CampusIncident = {
            id: incidentId,
            event: title,
            location: zone,
            zone,
            severity,
            source: event.source === 'simulation' ? 'simulation' : 'live',
            status: 'open',
            timestamp: event.timestamp,
            description: details,
            telemetry,
            auditTimeline: [
              {
                time: event.timestamp,
                action: `Incident registered on campus event bus: ${title}`,
                actor: 'AUTOMATED BUS',
              },
            ],
          };
          setIncidents((prev) => [newInc, ...prev.filter((i) => i.id !== incidentId)]);

          const alert: CampusAlert = {
            id: `ALT-${incidentId}`,
            title,
            location: zone,
            timestamp: event.timestamp,
            severity,
            source: event.source === 'simulation' ? 'simulation' : 'live',
            details,
            incidentId,
            acknowledged: false,
          };
          setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
          break;
        }

        case 'INCIDENT_ACKNOWLEDGED': {
          const { incidentId, actor } = event.payload;
          setIncidents((prev) =>
            prev.map((inc) => {
              if (inc.id === incidentId) {
                return {
                  ...inc,
                  status: 'acknowledged',
                  auditTimeline: [
                    ...inc.auditTimeline,
                    { time: event.timestamp, action: 'Acknowledged and queued for dispatch', actor },
                  ],
                };
              }
              return inc;
            })
          );
          setAlerts((prev) => prev.map((a) => (a.incidentId === incidentId ? { ...a, acknowledged: true } : a)));
          break;
        }

        case 'INCIDENT_INVESTIGATING': {
          const { incidentId, actor } = event.payload;
          setIncidents((prev) =>
            prev.map((inc) => {
              if (inc.id === incidentId) {
                return {
                  ...inc,
                  status: 'investigating',
                  assignedOfficer: actor,
                  auditTimeline: [
                    ...inc.auditTimeline,
                    { time: event.timestamp, action: `Field investigation dispatched by ${actor}`, actor },
                  ],
                };
              }
              return inc;
            })
          );
          break;
        }

        case 'INCIDENT_RESOLVED': {
          const { incidentId, actor, resolutionNotes } = event.payload;
          setIncidents((prev) =>
            prev.map((inc) => {
              if (incidentId === 'ALL-SIMULATIONS' || inc.id === incidentId) {
                return {
                  ...inc,
                  status: 'resolved',
                  resolvedAt: event.timestamp,
                  auditTimeline: [
                    ...inc.auditTimeline,
                    {
                      time: event.timestamp,
                      action: resolutionNotes || `Hazard mitigated and sealed by ${actor}`,
                      actor,
                    },
                  ],
                };
              }
              return inc;
            })
          );
          if (incidentId === 'ALL-SIMULATIONS') {
            setAlerts((prev) => prev.filter((a) => a.source !== 'simulation'));
          } else {
            setAlerts((prev) => prev.filter((a) => a.incidentId !== incidentId));
          }
          break;
        }

        case 'ZONE_LOCKDOWN': {
          const { zoneName, action, actor } = event.payload;
          setDoors((prev) =>
            prev.map((d) => {
              if (
                d.zone.toLowerCase().includes(zoneName.toLowerCase()) ||
                d.building.toLowerCase().includes(zoneName.toLowerCase())
              ) {
                return {
                  ...d,
                  lockStatus: action === 'LOCKDOWN' ? 'locked' : 'unlocked',
                  keypadStatus: action === 'LOCKDOWN' ? 'alert' : 'normal',
                  isSecurityAlert: action === 'LOCKDOWN',
                  lastEventTime: event.timestamp,
                  lastEventText: `Zone ${action} by ${actor}`,
                };
              }
              return d;
            })
          );
          break;
        }

        case 'AUDIT_RECORD': {
          const { record } = event.payload;
          setAuditLog((prev) => [record, ...prev.slice(0, 199)]);
          break;
        }
      }
    });

    return () => {
      unsubBus();
    };
  }, []);

  const addAuditRecord = (
    action: string,
    target: string,
    result: 'SUCCESS' | 'DENIED' | 'FAILED' | 'ESCALATED',
    details: string,
    zone?: string
  ) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const record: AuditRecord = {
      id: 'AUD-' + Date.now().toString().slice(-4) + Math.random().toString(36).slice(2, 4).toUpperCase(),
      timestamp: timeStr,
      actor: userRole === 'admin' ? 'CHIEF OPERATOR (ADMIN)' : userRole === 'security_officer' ? 'SECURITY OFFICER ON DUTY' : userRole.toUpperCase(),
      role: userRole,
      action,
      target,
      result,
      details,
      zone: zone || (selectedZone !== 'all' ? selectedZone : 'Operations Console')
    };
    setAuditLog(prev => [record, ...prev.slice(0, 199)]);
  };

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    const session = authService.setUserRole(role);
    setAuthSession(session);
    addAuditRecord('ROLE_CLEARANCE_CHANGED', 'Console Session', 'SUCCESS', `Clearance updated to ${role.toUpperCase()} (${session.clearanceLevel})`);
  };

  const loginAction = async (username: string, password?: string) => {
    const res = await authService.login(username, password);
    if (res.success && res.user) {
      setIsAuthenticated(true);
      setAuthBootstrapState('AUTHENTICATED');
      setGatewayUnavailable(false);
      setUserRoleState(res.user.role);
      setAuthSession(res.user);
      addAuditRecord('USER_LOGIN', 'Operator Console', 'SUCCESS', `Authenticated operator ${res.user.name} (${res.user.role.toUpperCase()})`);
    }
    return res;
  };

  const syncSessionAction = (user: AuthUser) => {
    setIsAuthenticated(true);
    setAuthBootstrapState('AUTHENTICATED');
    setGatewayUnavailable(false);
    setUserRoleState(user.role);
    setAuthSession(user);
    addAuditRecord('USER_LOGIN', 'Operator Console', 'SUCCESS', `Authenticated operator ${user.name} (${user.role.toUpperCase()})`);
  };

  const logoutAction = async () => {
    try {
      await authService.logout();
    } finally {
      realtimeGateway.disconnect();
      setIsAuthenticated(false);
      setAuthBootstrapState('UNAUTHENTICATED');
      setGatewayUnavailable(false);
      setUserRoleState('student');
      setAuthSession(authService.getCurrentUser());
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/login');
      }
      setActiveTabState('login');
    }
  };

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

  // Computed Role Permissions via Centralized AuthService
  const canManageDoors = authService.can('ACCESS_OVERRIDE') || userRole === 'admin' || userRole === 'security_officer';
  const canManageIncidents = authService.can('ACKNOWLEDGE_INCIDENT');
  const canRunSimulations = authService.can('RUN_SIMULATION');
  const canManageDevices = authService.can('MANAGE_DEVICES');
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

  // Operational Action: Trigger MQ-2 Gas Elevation
  const triggerMQ2Elevation = (ppm = 640) => {
    sensorAdapter.processMQ2Reading('DEV-SMK-204', ppm, 'live');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const location = 'Science Block · Lab 204';
    const zoneName = 'Science & Physics Lab';

    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.location.includes('Lab 204') && (dev.category === 'smoke' || dev.category === 'fan')) {
          return {
            ...dev,
            status: ppm >= 750 ? 'critical' : 'warning',
            lastUpdated: 'Just now',
          };
        }
        return dev;
      })
    );

    setAutomations((prev) =>
      prev.map((z) => {
        if (z.id === 'ZONE-SCI-204') {
          return { ...z, fansState: 'off', currentPowerKw: 1.1 };
        }
        return z;
      })
    );

    const normEvt = DeviceAdapter.buildEvent(
      'MQ-2 Gas Concentration Elevated',
      location,
      'DEV-SMK-204',
      ppm >= 750 ? 'critical' : 'warning',
      'live',
      {
        mq2ReadingPpm: ppm,
        thresholdPpm: 500,
        trend: '+28% spike',
        ventilationStatus: 'AUTOMATED DAMPER ISOLATION',
      }
    );

    const campusEvt = DeviceAdapter.toCampusEvent(
      normEvt,
      `MQ-2 reached ${ppm} ppm · Automated damper closed · Extraction active`
    );
    setEvents((prev) => [campusEvt, ...prev]);

    const alert = DeviceAdapter.toCampusAlert(
      normEvt,
      `MQ-2 electrochemical sensor verified ${ppm} ppm in ${location}. Hazard protocol engaged.`,
      'INC-GAS-003'
    );
    setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);

    const incident: CampusIncident = {
      id: 'INC-GAS-003',
      event: 'MQ-2 Gas Sensor Elevated',
      location,
      zone: zoneName,
      severity: ppm >= 750 ? 'critical' : 'warning',
      source: 'live',
      status: 'open',
      timestamp: timeStr,
      description: `Electrochemical MQ-2 sensor detected ${ppm} ppm (safety limit: 500 ppm). Automated dampers sealed to isolate corridor ventilation.`,
      telemetry: {
        'Sensor Type': 'MQ-2 Solid-State Chemiresistor',
        'Concentration': `${ppm} ppm`,
        'Safety Limit': '500 ppm',
        'Damper State': 'ISOLATED',
      },
      auditTimeline: [
        {
          time: timeStr,
          action: `Sensor threshold violation detected (${ppm} ppm). Isolation relay energized.`,
          actor: 'SAFETY CONTROLLER',
        },
      ],
    };
    setIncidents((prev) => [incident, ...prev.filter((i) => i.id !== 'INC-GAS-003')]);

    addAuditRecord(
      'SENSOR_ELEVATION_DETECTED',
      'DEV-SMK-204 (Science Lab 204)',
      'ESCALATED',
      `MQ-2 reading exceeded safe threshold (${ppm} ppm vs 500 ppm). Damper isolation initiated.`,
      zoneName
    );

    addToast(
      'Hazard Alert: Gas Elevated',
      `MQ-2 sensor reached ${ppm} ppm in ${location}. Automated containment active.`,
      ppm >= 750 ? 'error' : 'warning'
    );
  };

  // Operational Action: Reset MQ-2 Calibration to Baseline
  const resetMQ2Calibration = () => {
    sensorAdapter.processMQ2Reading('DEV-SMK-204', 312, 'live');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const location = 'Science Block · Lab 204';
    const zoneName = 'Science & Physics Lab';

    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.location.includes('Lab 204') && (dev.category === 'smoke' || dev.category === 'fan')) {
          return {
            ...dev,
            status: 'online',
            lastUpdated: 'Just now',
          };
        }
        return dev;
      })
    );

    setAutomations((prev) =>
      prev.map((z) => {
        if (z.id === 'ZONE-SCI-204') {
          return { ...z, fansState: 'on', currentPowerKw: 1.8 };
        }
        return z;
      })
    );

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === 'INC-GAS-003'
          ? {
              ...inc,
              status: 'resolved',
              resolvedAt: timeStr,
              auditTimeline: [
                ...inc.auditTimeline,
                { time: timeStr, action: 'MQ-2 concentration dropped below threshold (312 ppm). Baseline restored.', actor: 'ENVIRONMENTAL SUPERVISOR' },
              ],
            }
          : inc
      )
    );

    setAlerts((prev) => prev.filter((a) => a.id !== 'INC-GAS-003' && !a.title.includes('MQ-2')));

    addAuditRecord(
      'SENSOR_CALIBRATION_RESET',
      `DEV-SMK-204 (${location})`,
      'SUCCESS',
      'MQ-2 solid-state sensor recalibrated to baseline 312 ppm. Isolation damper reset to open.',
      zoneName
    );

    addToast('MQ-2 Normalized', 'Science Lab 204 gas reading stabilized at 312 ppm.', 'info');
  };

  // Operational Action: High-Security Zone Lockdown
  const lockdownZone = (zoneName: string) => {
    if (!canManageDoors) {
      addToast('Permission Denied', 'Your current role does not have authorization to trigger zone lockdowns.', 'error');
      addAuditRecord('ZONE_LOCKDOWN_REJECTED', zoneName, 'DENIED', 'Clearance level insufficient for lockdown dispatch', zoneName);
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setDoors((prev) =>
      prev.map((d) => {
        if (d.zone.toLowerCase().includes(zoneName.toLowerCase()) || d.building.toLowerCase().includes(zoneName.toLowerCase())) {
          return {
            ...d,
            lockStatus: 'locked',
            keypadStatus: 'alert',
            isSecurityAlert: true,
            lastEventTime: timeStr,
            lastEventText: `Emergency lockdown initiated by ${userRole.toUpperCase()}`,
          };
        }
        return d;
      })
    );

    const lockEvt = DeviceAdapter.buildEvent(
      'Zone Lockdown Engaged',
      zoneName,
      'SYS-LOCKDOWN',
      'critical',
      'live',
      {
        operatorRole: userRole,
        protocol: 'HIGH_SECURITY_INTERLOCK',
        holdingForce: '1200 lb',
      }
    );

    const campusEvt = DeviceAdapter.toCampusEvent(lockEvt, `Perimeter locked down by ${userRole.toUpperCase()} · Keypads locked out`);
    setEvents((prev) => [campusEvt, ...prev]);

    const alert = DeviceAdapter.toCampusAlert(
      lockEvt,
      `Emergency lockdown active for ${zoneName}. Access suspended.`,
      `INC-LOCK-${Date.now().toString().slice(-4)}`
    );
    setAlerts((prev) => [alert, ...prev]);

    addAuditRecord(
      'ZONE_LOCKDOWN_ENGAGED',
      zoneName,
      'SUCCESS',
      `Perimeter magnetic interlocks energized (1200 lb holding force). Credential readers set to lockdown by ${userRole.toUpperCase()}.`,
      zoneName
    );

    addToast('ZONE LOCKDOWN ACTIVE', `High-security lockdown engaged for ${zoneName}. All portals locked.`, 'error');
  };

  // Operational Action: Optical Camera Snapshot
  const captureCameraSnapshot = (cameraId: string) => {
    cctvMediaAdapter.captureSnapshot(cameraId);
    const cam = cameras.find((c) => c.id === cameraId) || cameras[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setEvents((prev) => [
      {
        id: 'EVT-SNAP-' + Date.now(),
        time: timeStr,
        eventType: 'CCTV Frame Captured',
        location: cam.location,
        resultingAction: 'High-res security snapshot archived to evidence vault',
        severity: 'info',
        source: 'live',
      },
      ...prev,
    ]);

    addAuditRecord(
      'CCTV_FRAME_ARCHIVE',
      `${cam.id} (${cam.name})`,
      'SUCCESS',
      `Optical frame at 1080p captured by ${userRole.toUpperCase()} and cryptographic hash signed.`,
      cam.zone
    );

    addToast('Snapshot Archived', `Cryptographically signed frame from ${cam.name} saved to audit ledger.`, 'success');
  };

  // Operational Action: PTZ Camera Control
  const ptzCameraAction = (cameraId: string, action: string) => {
    cctvMediaAdapter.executePtzAction(cameraId, action as any);
    const cam = cameras.find((c) => c.id === cameraId);
    if (!cam) return;
    if (!cam.ptzCapable) {
      addToast('PTZ Unsupported', `${cam.name} is a fixed wide-angle dome and does not support optical pan/tilt.`, 'warning');
      return;
    }

    addAuditRecord(
      `PTZ_${action}`,
      `${cam.id} (${cam.name})`,
      'SUCCESS',
      `Servo command ${action} executed by ${userRole.toUpperCase()}.`,
      cam.zone
    );

    addToast('PTZ Command Transmitted', `${action.replace('_', ' ')} command sent to ${cam.name}.`, 'info');
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
    void accessWiegandAdapter.processPinEntry(doorId, pin, source);
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

      addAuditRecord(
        'PIN_AUTH_SUCCESS',
        `${door.id} (${door.name})`,
        'SUCCESS',
        'Authorized PIN credential accepted. Solenoid released for 8s.',
        door.zone
      );

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

      addAuditRecord(
        'PIN_AUTH_FAILURE',
        `${door.id} (${door.name})`,
        isLockout ? 'ESCALATED' : 'DENIED',
        isLockout ? '3 consecutive PIN failures. High-security anti-tamper magnetic lockout engaged.' : `Invalid PIN attempt (${nextFailures}/3).`,
        door.zone
      );

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
        addAuditRecord(
          'REMOTE_DOOR_UNLOCK',
          `${door.id} (${door.name})`,
          'SUCCESS',
          `Remote magnetic lock release authorized by ${userRole.toUpperCase()}`,
          door.zone
        );
        addToast('Door Unlocked', `${door.name} has been remotely unlocked.`, 'success');
      }
    });
  };

  const lockDoor = (doorId: string) => {
    if (!canManageDoors) {
      addToast('Unauthorized', 'You do not have permission to lock security doors.', 'error');
      addAuditRecord(
        'REMOTE_DOOR_LOCK_REJECTED',
        doorId,
        'DENIED',
        `Clearance ${userRole.toUpperCase()} insufficient to lock portal`
      );
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

    addAuditRecord(
      'REMOTE_DOOR_LOCK',
      `${door.id} (${door.name})`,
      'SUCCESS',
      `Door locked and armed by ${userRole.toUpperCase()}`,
      door.zone
    );

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

    addAuditRecord(
      'INCIDENT_ACKNOWLEDGED',
      incidentId,
      'SUCCESS',
      `Incident acknowledged and responder dispatched by ${userRole.toUpperCase()}`
    );

    addToast('Incident Acknowledged', `Incident ${incidentId} status updated to Acknowledged.`, 'info');
  };

  const investigateIncident = (incidentId: string) => {
    if (!canManageIncidents) {
      addToast('Unauthorized', 'Your role cannot dispatch field investigations.', 'error');
      return;
    }
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        const updated: CampusIncident = {
          ...inc,
          status: 'investigating',
          auditTimeline: [
            ...inc.auditTimeline,
            { time: timeStr, action: 'Field investigation unit dispatched to physical location', actor: userRole.toUpperCase() }
          ]
        };
        if (selectedIncident?.id === incidentId) setSelectedIncident(updated);
        return updated;
      }
      return inc;
    }));

    addAuditRecord(
      'INCIDENT_INVESTIGATING',
      incidentId,
      'SUCCESS',
      `Field investigation dispatched to location by ${userRole.toUpperCase()}`
    );

    addToast('Investigation Dispatched', `Field unit investigating ${incidentId}.`, 'info');
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

    addAuditRecord(
      'INCIDENT_RESOLVED',
      incidentId,
      'SUCCESS',
      `Incident verified and marked Resolved by ${userRole.toUpperCase()}`
    );

    addToast('Incident Resolved', `Incident ${incidentId} marked as Resolved.`, 'success');
  };

  return (
    <StateContext.Provider
      value={{
        connectionState,
        realtimeMode,
        systemHealth,
        authSession,
        isAuthenticated,
        authBootstrapState,
        gatewayUnavailable,
        login: loginAction,
        logout: logoutAction,
        syncSession: syncSessionAction,
        userRole,
        setUserRole,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        selectedZone,
        setSelectedZone,
        selectedCameraId,
        setSelectedCameraId,
        campusStatus,
        isSimulationActive,
        isSystemDegraded,
        setIsSystemDegraded,
        activeSimulations,
        devices,
        alerts,
        incidents,
        setIncidents,
        events,
        automations,
        doors,
        cameras,
        auditLog,
        selectedIncident,
        setSelectedIncident,
        selectedDevice,
        setSelectedDevice,
        confirmModal,
        closeConfirmModal,
        showConfirmModal,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        toasts,
        dismissToast,
        addToast,
        addAuditRecord,
        isAlarmRinging: alarmState.isRinging,
        isAlarmMuted: alarmState.isMuted,
        audioAutoplayBlocked: alarmState.autoplayBlocked,
        enableAlarmAudio,
        silenceAlarm,
        triggerFireAlert,
        triggerSmokeAlert,
        triggerMQ2Elevation,
        resetMQ2Calibration,
        triggerRestrictedMotion,
        triggerZoneOccupancy,
        triggerZoneVacancy,
        submitKeypadPin,
        toggleDeviceOnline,
        updateCameraStream,
        setCameraStatus,
        captureCameraSnapshot,
        ptzCameraAction,
        lockdownZone,
        simulateFire,
        simulateSmoke,
        simulateBreach,
        simulateRestrictedMotion,
        resetSimulation,
        requestUnlockDoor,
        lockDoor,
        acknowledgeAlert,
        acknowledgeIncident,
        investigateIncident,
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
