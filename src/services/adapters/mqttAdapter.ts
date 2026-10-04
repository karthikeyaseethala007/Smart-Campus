import { eventBus } from '../eventBus';
import { healthService } from '../healthService';
import type {
  CampusNormalizedEvent,
  MQ2ReadingEvent,
  PirMotionEvent,
  AccessGrantedEvent,
  AccessDeniedEvent,
  EnergyDemandEvent,
  IoTDeviceStatusEvent
} from '../../types/events';

export interface MqttTopicParts {
  zone: string;
  subsystem: 'sensor' | 'access' | 'energy' | 'iot' | string;
  device: string;
}

export interface MqttMessage {
  topic: string;
  payload: string | Record<string, unknown>;
  qos?: 0 | 1 | 2;
  retain?: boolean;
}

export class MqttAdapter {
  private static instance: MqttAdapter;
  private isConnected = true;

  private constructor() {
    healthService.updateComponent('MQTT', {
      status: 'HEALTHY',
      details: 'MQTT Ingestion Bridge Ready (topics: campus/+/+/+)',
    });
  }

  public isReady(): boolean {
    return this.isConnected;
  }

  public static getInstance(): MqttAdapter {
    if (!MqttAdapter.instance) {
      MqttAdapter.instance = new MqttAdapter();
    }
    return MqttAdapter.instance;
  }

  /**
   * Parses standard campus topic: campus/{zone}/{subsystem}/{device}
   */
  public parseTopic(topic: string): MqttTopicParts | null {
    const parts = topic.split('/');
    if (parts.length < 4 || parts[0] !== 'campus') {
      return null;
    }
    return {
      zone: parts[1],
      subsystem: parts[2],
      device: parts[3],
    };
  }

  /**
   * Normalizes an incoming raw MQTT message into a canonical CampusNormalizedEvent and dispatches to eventBus.
   */
  public handleMessage(message: MqttMessage): CampusNormalizedEvent | null {
    const parsed = this.parseTopic(message.topic);
    if (!parsed) {
      console.warn('[MqttAdapter] Non-standard MQTT topic received:', message.topic);
      return null;
    }

    let payloadObj: Record<string, any> = {};
    if (typeof message.payload === 'string') {
      try {
        payloadObj = JSON.parse(message.payload);
      } catch {
        payloadObj = { raw: message.payload };
      }
    } else if (message.payload && typeof message.payload === 'object') {
      payloadObj = message.payload;
    }

    const { zone, subsystem, device } = parsed;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let event: CampusNormalizedEvent | null = null;

    switch (subsystem) {
      case 'sensor': {
        if (payloadObj.ppm !== undefined) {
          const ppm = Number(payloadObj.ppm);
          const status = ppm >= 750 ? 'CRITICAL' : ppm >= 500 ? 'ELEVATED' : 'NORMAL';
          const sev = ppm >= 750 ? 'critical' : ppm >= 500 ? 'warning' : 'info';
          event = {
            id: `EVT-MQ2-${device}-${Date.now()}`,
            timestamp: timeStr,
            category: 'MQ2',
            type: 'MQ2_READING',
            source: 'mqtt',
            zoneId: zone,
            deviceId: device,
            severity: sev,
            payload: {
              sensorId: device,
              ppm,
              threshold: 500,
              status,
              ventilationActive: ppm >= 500,
            },
          } as MQ2ReadingEvent;
        } else if (payloadObj.motion !== undefined) {
          const isMotion = Boolean(payloadObj.motion);
          event = {
            id: `EVT-PIR-${device}-${Date.now()}`,
            timestamp: timeStr,
            category: 'PIR',
            type: 'PIR_MOTION',
            source: 'mqtt',
            zoneId: zone,
            deviceId: device,
            severity: isMotion ? 'warning' : 'info',
            payload: {
              zoneId: zone,
              state: isMotion ? 'MOTION' : 'CLEAR',
              durationSec: payloadObj.durationSec ?? 0,
            },
          } as PirMotionEvent;
        }
        break;
      }

      case 'access': {
        const granted = Boolean(payloadObj.granted);
        if (granted) {
          event = {
            id: `EVT-ACC-${device}-${Date.now()}`,
            timestamp: timeStr,
            category: 'ACCESS',
            type: 'ACCESS_GRANTED',
            source: 'mqtt',
            zoneId: zone,
            deviceId: device,
            severity: 'info',
            payload: {
              doorId: device,
              cardholder: payloadObj.cardholder || 'Authorized Personnel',
              clearance: payloadObj.clearance || 'LEVEL_2',
            },
          } as AccessGrantedEvent;
        } else {
          event = {
            id: `EVT-ACC-${device}-${Date.now()}`,
            timestamp: timeStr,
            category: 'ACCESS',
            type: 'ACCESS_DENIED',
            source: 'mqtt',
            zoneId: zone,
            deviceId: device,
            severity: 'warning',
            payload: {
              doorId: device,
              reason: payloadObj.reason || 'Invalid credential',
              failedAttempts: payloadObj.failedAttempts || 1,
            },
          } as AccessDeniedEvent;
        }
        break;
      }

      case 'energy': {
        event = {
          id: `EVT-NRG-${device}-${Date.now()}`,
          timestamp: timeStr,
          category: 'ENERGY',
          type: 'ENERGY_DEMAND',
          source: 'mqtt',
          zoneId: zone,
          deviceId: device,
          severity: 'info',
          payload: {
            zoneId: zone,
            currentPowerKw: Number(payloadObj.powerKw || payloadObj.kw || 1.2),
            powerFactor: Number(payloadObj.powerFactor || 0.98),
          },
        } as EnergyDemandEvent;
        break;
      }

      case 'iot': {
        event = {
          id: `EVT-IOT-${device}-${Date.now()}`,
          timestamp: timeStr,
          category: 'IOT',
          type: 'IOT_DEVICE_STATUS',
          source: 'mqtt',
          zoneId: zone,
          deviceId: device,
          severity: payloadObj.status === 'critical' ? 'critical' : payloadObj.status === 'warning' ? 'warning' : 'info',
          payload: {
            deviceId: device,
            status: payloadObj.status || 'online',
            batteryPct: payloadObj.batteryPct,
            ipAddress: payloadObj.ipAddress,
          },
        } as IoTDeviceStatusEvent;
        break;
      }
    }

    if (event) {
      eventBus.dispatch(event);
      healthService.recordHeartbeat('MQTT');
    }

    return event;
  }
}

export const mqttAdapter = MqttAdapter.getInstance();
export default mqttAdapter;
