import { Logger } from '../utils/logger';

export type DeviceType = 'CAMERA' | 'MQ2' | 'PIR' | 'ENERGY' | 'ACCESS_CONTROLLER' | 'IOT';
export type DeviceLifecycleStatus = 'REGISTERED' | 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'DISABLED';

export interface RegistryDevice {
  id: string;
  type: DeviceType;
  name: string;
  zoneId: string;
  status: DeviceLifecycleStatus;
  lastSeen: string;
  protocol: 'MQTT' | 'RTSP' | 'WIEGAND' | 'MODBUS' | 'HTTP' | 'VIRTUAL';
  capabilities: Record<string, boolean | string | number>;
  metadata: Record<string, any>;
}

export class DeviceRegistry {
  private static instance: DeviceRegistry;
  private registry: Map<string, RegistryDevice> = new Map();
  private staleCheckInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.seedDefaultRegistry();
    this.startStaleDeviceDetector();
  }

  public static getInstance(): DeviceRegistry {
    if (!DeviceRegistry.instance) {
      DeviceRegistry.instance = new DeviceRegistry();
    }
    return DeviceRegistry.instance;
  }

  private seedDefaultRegistry(): void {
    const initialDevices: RegistryDevice[] = [
      {
        id: 'DEV-CAM-01',
        type: 'CAMERA',
        name: 'Gate Access PTZ · Primary',
        zoneId: 'ZONE-GATE-01',
        status: 'ONLINE',
        lastSeen: new Date().toISOString(),
        protocol: 'RTSP',
        capabilities: { ptz: true, snapshot: true, nightVision: true, fps: 30 },
        metadata: { resolution: '1920x1080', optics: '12x Optical Zoom', ip: '10.0.1.50' },
      },
      {
        id: 'DEV-CAM-02',
        type: 'CAMERA',
        name: 'Robotics Bay West Overlook',
        zoneId: 'ZONE-ROB-101',
        status: 'ONLINE',
        lastSeen: new Date().toISOString(),
        protocol: 'RTSP',
        capabilities: { ptz: false, snapshot: true, nightVision: false, fps: 30 },
        metadata: { resolution: '1920x1080', ip: '10.0.1.51' },
      },
      {
        id: 'DEV-CAM-03',
        type: 'CAMERA',
        name: 'Library Atrium Wide Angle',
        zoneId: 'ZONE-LIB-001',
        status: 'ONLINE',
        lastSeen: new Date().toISOString(),
        protocol: 'RTSP',
        capabilities: { ptz: false, snapshot: true, nightVision: false, fps: 24 },
        metadata: { resolution: '1920x1080', ip: '10.0.1.52' },
      },
      {
        id: 'DEV-CAM-04',
        type: 'CAMERA',
        name: 'Science Wing · Lab 204 Corridor',
        zoneId: 'ZONE-SCI-204',
        status: 'ONLINE',
        lastSeen: new Date().toISOString(),
        protocol: 'RTSP',
        capabilities: { ptz: true, snapshot: true, nightVision: true, fps: 30 },
        metadata: { resolution: '1920x1080', ip: '10.0.1.53' },
      },
      {
        id: 'DEV-CAM-07',
        type: 'CAMERA',
        name: 'Core Server Vault · Restricted',
        zoneId: 'ZONE-SRV-01',
        status: 'ONLINE',
        lastSeen: new Date().toISOString(),
        protocol: 'RTSP',
        capabilities: { ptz: true, snapshot: true, nightVision: true, fps: 60 },
        metadata: { resolution: '3840x2160', opticalZoom: '4K Varifocal', ip: '10.0.1.56' },
      },
      {
        id: 'DEV-SMK-204',
        type: 'MQ2',
        name: 'MQ-2 Electrochemical Gas Sensor',
        zoneId: 'ZONE-SCI-204',
        status: 'ONLINE',
        lastSeen: new Date().toISOString(),
        protocol: 'MQTT',
        capabilities: { thresholdWarning: 500, thresholdCritical: 750, analogRead: true },
        metadata: { unit: 'ppm', targetGases: ['LPG', 'Smoke', 'CO'], bus: 'I2C/ADC' },
      },
      {
        id: 'DEV-PIR-101',
        type: 'PIR',
        name: 'PIR Motion Sensor Alpha',
        zoneId: 'ZONE-ROB-101',
        status: 'ONLINE',
        lastSeen: new Date().toISOString(),
        protocol: 'MQTT',
        capabilities: { sensitivity: 'high', pulseDurationSec: 5 },
        metadata: { fieldOfViewDeg: 120, rangeMeters: 8 },
      },
      {
        id: 'DEV-DOOR-GATE-MAIN',
        type: 'ACCESS_CONTROLLER',
        name: 'North Perimeter Barrier Wiegand Controller',
        zoneId: 'ZONE-GATE-01',
        status: 'ONLINE',
        lastSeen: new Date().toISOString(),
        protocol: 'WIEGAND',
        capabilities: { wiegand26: true, keypadPIN: true, biometric: true, emergencyOverride: true },
        metadata: { relayChannel: 1, lockTimeoutSec: 8 },
      },
      {
        id: 'DEV-DOOR-ROB-01',
        type: 'ACCESS_CONTROLLER',
        name: 'High-Torque Testing Enclosure Interlock',
        zoneId: 'ZONE-ROB-101',
        status: 'ONLINE',
        lastSeen: new Date().toISOString(),
        protocol: 'WIEGAND',
        capabilities: { wiegand26: true, keypadPIN: true, emergencyOverride: true },
        metadata: { relayChannel: 2, lockTimeoutSec: 5 },
      },
      {
        id: 'DEV-NRG-CAMPUS-MAIN',
        type: 'ENERGY',
        name: 'Substation Modbus 3-Phase Meter',
        zoneId: 'ZONE-SRV-01',
        status: 'ONLINE',
        lastSeen: new Date().toISOString(),
        protocol: 'MODBUS',
        capabilities: { powerKw: true, powerFactor: true, voltage: true, harmonicDistortion: true },
        metadata: { modbusAddress: 10, baudRate: 9600 },
      },
      {
        id: 'DEV-HVAC-DAMP-204',
        type: 'IOT',
        name: 'Science Lab 204 Smoke Damper Actuator',
        zoneId: 'ZONE-SCI-204',
        status: 'ONLINE',
        lastSeen: new Date().toISOString(),
        protocol: 'MQTT',
        capabilities: { servoControl: true, autoIsolation: true },
        metadata: { failSafe: 'spring_closed', actuatorTorqueNm: 15 },
      },
    ];

    initialDevices.forEach(d => this.registry.set(d.id, d));
  }

  public getAllDevices(): RegistryDevice[] {
    return Array.from(this.registry.values());
  }

  public getDeviceById(id: string): RegistryDevice | null {
    return this.registry.get(id) || null;
  }

  public updateStatus(id: string, status: DeviceLifecycleStatus): boolean {
    const dev = this.registry.get(id);
    if (!dev) return false;
    dev.status = status;
    dev.lastSeen = new Date().toISOString();
    return true;
  }

  public updateLastSeen(id: string): void {
    const dev = this.registry.get(id);
    if (dev) {
      dev.lastSeen = new Date().toISOString();
      if (dev.status === 'OFFLINE' || dev.status === 'DEGRADED') {
        dev.status = 'ONLINE';
      }
    }
  }

  public registerDevice(device: RegistryDevice): void {
    this.registry.set(device.id, device);
  }

  /**
   * Scans for devices whose lastSeen timestamp exceeds the threshold and marks them DEGRADED or OFFLINE.
   */
  public checkStaleDevices(staleThresholdMs = 120000): { offlineCount: number; degradedCount: number } {
    const now = Date.now();
    let offlineCount = 0;
    let degradedCount = 0;

    this.registry.forEach((dev) => {
      if (dev.status === 'DISABLED') return;

      const lastSeenTime = new Date(dev.lastSeen).getTime();
      const elapsed = now - lastSeenTime;

      if (elapsed > staleThresholdMs * 2 && dev.status !== 'OFFLINE') {
        dev.status = 'OFFLINE';
        offlineCount++;
        Logger.warn('DEVICE_REGISTRY', `Device marked OFFLINE due to heartbeat timeout: ${dev.id}`, {
          deviceId: dev.id,
          details: { elapsedMs: elapsed },
        });
      } else if (elapsed > staleThresholdMs && dev.status === 'ONLINE') {
        dev.status = 'DEGRADED';
        degradedCount++;
        Logger.warn('DEVICE_REGISTRY', `Device marked DEGRADED: ${dev.id}`, {
          deviceId: dev.id,
          details: { elapsedMs: elapsed },
        });
      }
    });

    return { offlineCount, degradedCount };
  }

  private startStaleDeviceDetector(): void {
    this.staleCheckInterval = setInterval(() => {
      this.checkStaleDevices();
    }, 60000);
    this.staleCheckInterval.unref();
  }

  public close(): void {
    if (this.staleCheckInterval) {
      clearInterval(this.staleCheckInterval);
      this.staleCheckInterval = null;
    }
  }
}

export const deviceRegistry = DeviceRegistry.getInstance();
export default deviceRegistry;
