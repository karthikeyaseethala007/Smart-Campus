import { eventBus } from './eventBus';
import type {
  IncidentDetectedEvent,
  IncidentResolvedEvent,
  PirMotionEvent,
  MQ2ReadingEvent,
  AccessDeniedEvent,
  EnergyDemandEvent
} from '../types/events';

export interface ActiveSimulationsState {
  fire: boolean;
  smoke: boolean;
  breach: boolean;
  restrictedMotion: boolean;
}

export type SimulatorStateListener = (state: ActiveSimulationsState) => void;

export class CampusSimulator {
  private static instance: CampusSimulator;
  private energyTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  private activeSimulations: ActiveSimulationsState = {
    fire: false,
    smoke: false,
    breach: false,
    restrictedMotion: false,
  };

  private listeners: Set<SimulatorStateListener> = new Set();

  private constructor() {}

  public static getInstance(): CampusSimulator {
    if (!CampusSimulator.instance) {
      CampusSimulator.instance = new CampusSimulator();
    }
    return CampusSimulator.instance;
  }

  public getActiveSimulations(): ActiveSimulationsState {
    return { ...this.activeSimulations };
  }

  public subscribe(listener: SimulatorStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getActiveSimulations());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const snap = this.getActiveSimulations();
    this.listeners.forEach(l => {
      try {
        l(snap);
      } catch (err) {
        console.error('[CampusSimulator] Listener error:', err);
      }
    });
  }

  public startBackgroundSimulation(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Pulse 1: Micro-fluctuations in occupied zone power demand (every 10s)
    this.energyTimer = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const jitter = (Math.random() - 0.5) * 0.08;
      const reading = Math.max(0.4, Number((1.8 + jitter).toFixed(2)));

      const energyEvent: EnergyDemandEvent = {
        id: `EVT-SIM-NRG-${Date.now()}`,
        timestamp: timeStr,
        category: 'ENERGY',
        type: 'ENERGY_DEMAND',
        source: 'simulation',
        zoneId: 'Innovation & Robotics Lab',
        deviceId: 'MET-ROB-01',
        severity: 'info',
        payload: {
          zoneId: 'Innovation & Robotics Lab',
          currentPowerKw: reading,
          powerFactor: 0.98,
        },
      };

      eventBus.dispatch(energyEvent);
    }, 10000);

    // Pulse 2: Controlled heartbeat telemetry verification (every 30s)
    this.heartbeatTimer = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      eventBus.emit({
        category: 'SYSTEM',
        type: 'SYSTEM_HEALTH',
        source: 'simulation',
        severity: 'info',
        timestamp: timeStr,
        payload: {
          component: 'API',
          status: 'HEALTHY',
          latencyMs: 12,
          details: 'Nominal 24/24 sensor integrity confirmed',
        },
      });
    }, 30000);
  }

  public stopBackgroundSimulation(): void {
    this.isRunning = false;
    if (this.energyTimer) {
      clearInterval(this.energyTimer);
      this.energyTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Controllable Drill / Scenario Triggers (behind EventBus)

  public simulateFireDrill(): void {
    this.activeSimulations.fire = true;
    this.notifyListeners();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const location = 'Science Block · Chemistry Prep Room 204';
    const zone = 'Science & Physics Lab';

    const fireEvent: IncidentDetectedEvent = {
      id: `EVT-SIM-FIRE-${Date.now()}`,
      timestamp: timeStr,
      category: 'INCIDENT',
      type: 'INCIDENT_DETECTED',
      source: 'simulation',
      zoneId: zone,
      deviceId: 'DEV-SMK-204',
      severity: 'critical',
      payload: {
        incidentId: 'INC-SIM-FIRE-001',
        title: 'Thermal Runway / Fire Ignition Detected',
        zone,
        severity: 'critical',
        details: `Simulated fire threshold breach in ${location}. Solenoids unlatched for egress; HVAC damper isolation engaged.`,
        telemetry: {
          'Temperature': '94.2 °C',
          'Flame Optical Signal': 'CONFIRMED SATURATION',
          'Emergency Protocol': 'EVACUATION PHASE 1',
        },
      },
    };

    eventBus.dispatch(fireEvent);
  }

  public simulateSmokeDrill(): void {
    this.activeSimulations.smoke = true;
    this.notifyListeners();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const location = 'Science Block · Lab 204';
    const zone = 'Science & Physics Lab';

    const mq2Event: MQ2ReadingEvent = {
      id: `EVT-SIM-MQ2-${Date.now()}`,
      timestamp: timeStr,
      category: 'MQ2',
      type: 'MQ2_READING',
      source: 'simulation',
      zoneId: zone,
      deviceId: 'DEV-SMK-204',
      severity: 'critical',
      payload: {
        sensorId: 'DEV-SMK-204',
        ppm: 840,
        threshold: 500,
        status: 'CRITICAL',
        ventilationActive: true,
        location,
      },
    };

    eventBus.dispatch(mq2Event);
  }

  public simulateBreachDrill(): void {
    this.activeSimulations.breach = true;
    this.notifyListeners();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const doorId = 'DOOR-ROB-01';

    const breachEvent: AccessDeniedEvent = {
      id: `EVT-SIM-BREACH-${Date.now()}`,
      timestamp: timeStr,
      category: 'ACCESS',
      type: 'ACCESS_DENIED',
      source: 'simulation',
      deviceId: doorId,
      zoneId: 'Innovation & Robotics Lab',
      severity: 'critical',
      payload: {
        doorId,
        reason: 'Physical door forced open while locked (tamper switch tripped)',
        failedAttempts: 3,
      },
    };

    eventBus.dispatch(breachEvent);
  }

  public simulateRestrictedMotionDrill(): void {
    this.activeSimulations.restrictedMotion = true;
    this.notifyListeners();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const zone = 'Innovation & Robotics Lab';

    const pirEvent: PirMotionEvent = {
      id: `EVT-SIM-PIR-${Date.now()}`,
      timestamp: timeStr,
      category: 'PIR',
      type: 'PIR_MOTION',
      source: 'simulation',
      zoneId: zone,
      deviceId: 'DEV-PIR-101',
      severity: 'warning',
      payload: {
        zoneId: zone,
        state: 'MOTION',
        durationSec: 15,
      },
    };

    eventBus.dispatch(pirEvent);
  }

  public resetSimulation(): void {
    this.activeSimulations = {
      fire: false,
      smoke: false,
      breach: false,
      restrictedMotion: false,
    };
    this.notifyListeners();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Emit resolution event
    const resolveEvent: IncidentResolvedEvent = {
      id: `EVT-SIM-RESET-${Date.now()}`,
      timestamp: timeStr,
      category: 'INCIDENT',
      type: 'INCIDENT_RESOLVED',
      source: 'simulation',
      severity: 'info',
      payload: {
        incidentId: 'ALL-SIMULATIONS',
        actor: 'OPERATIONAL DRILL CONTROLLER',
        timestamp: timeStr,
        resolutionNotes: 'All simulation drills cleared. Hardware telemetry reset to nominal baselines.',
      },
    };

    eventBus.dispatch(resolveEvent);
  }
}

export const campusSimulator = CampusSimulator.getInstance();
export default campusSimulator;
