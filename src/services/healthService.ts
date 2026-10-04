import { eventBus } from './eventBus';
import type { SystemHealthEvent } from '../types/events';

export type SubsystemName = 'API' | 'WEBSOCKET' | 'MQTT' | 'CAMERA_GATEWAY' | 'DATABASE';
export type SubsystemStatus = 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN';

export interface ComponentHealth {
  component: SubsystemName;
  status: SubsystemStatus;
  latencyMs?: number;
  lastHeartbeat?: string;
  reconnectCount: number;
  lastError?: string;
  details?: string;
}

export type HealthListener = (health: Record<SubsystemName, ComponentHealth>) => void;

export class HealthService {
  private static instance: HealthService;
  private healthState: Record<SubsystemName, ComponentHealth> = {
    API: { component: 'API', status: 'HEALTHY', latencyMs: 12, reconnectCount: 0, details: 'Local REST Edge Service Active' },
    WEBSOCKET: { component: 'WEBSOCKET', status: 'HEALTHY', latencyMs: 8, reconnectCount: 0, details: 'Event Stream Active' },
    MQTT: { component: 'MQTT', status: 'HEALTHY', latencyMs: 15, reconnectCount: 0, details: 'Telemetry Broker Connected' },
    CAMERA_GATEWAY: { component: 'CAMERA_GATEWAY', status: 'HEALTHY', latencyMs: 24, reconnectCount: 0, details: '7/7 Channels Nominal' },
    DATABASE: { component: 'DATABASE', status: 'HEALTHY', latencyMs: 4, reconnectCount: 0, details: 'IndexedDB Persistence Ready' },
  };

  private listeners: Set<HealthListener> = new Set();

  private constructor() {}

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  public getSnapshot(): Record<SubsystemName, ComponentHealth> {
    return { ...this.healthState };
  }

  public getOverallStatus(): 'HEALTHY' | 'DEGRADED' | 'OFFLINE' {
    const statuses = Object.values(this.healthState).map(c => c.status);
    if (statuses.some(s => s === 'OFFLINE')) return 'DEGRADED';
    if (statuses.some(s => s === 'DEGRADED')) return 'DEGRADED';
    return 'HEALTHY';
  }

  public updateComponent(
    component: SubsystemName,
    update: Partial<Omit<ComponentHealth, 'component'>>
  ): void {
    const current = this.healthState[component];
    const updated: ComponentHealth = {
      ...current,
      ...update,
      lastHeartbeat: update.lastHeartbeat || new Date().toISOString(),
    };

    this.healthState[component] = updated;

    // Emit event on bus for system telemetry
    eventBus.emit<SystemHealthEvent>({
      category: 'SYSTEM',
      type: 'SYSTEM_HEALTH',
      source: 'system',
      severity: updated.status === 'OFFLINE' ? 'critical' : updated.status === 'DEGRADED' ? 'warning' : 'info',
      payload: {
        component,
        status: updated.status,
        latencyMs: updated.latencyMs,
        details: updated.details,
      },
    });

    this.notifyListeners();
  }

  public recordHeartbeat(component: SubsystemName, latencyMs?: number): void {
    this.updateComponent(component, {
      status: 'HEALTHY',
      latencyMs: latencyMs ?? this.healthState[component].latencyMs,
      lastHeartbeat: new Date().toISOString(),
    });
  }

  public recordError(component: SubsystemName, errorMsg: string, isFatal = false): void {
    const current = this.healthState[component];
    this.updateComponent(component, {
      status: isFatal ? 'OFFLINE' : 'DEGRADED',
      reconnectCount: current.reconnectCount + 1,
      lastError: errorMsg,
      details: errorMsg,
    });
  }

  public subscribe(listener: HealthListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach(l => {
      try {
        l(snap);
      } catch (err) {
        console.error('[HealthService] Listener error:', err);
      }
    });
  }
}

export const healthService = HealthService.getInstance();
export default healthService;
