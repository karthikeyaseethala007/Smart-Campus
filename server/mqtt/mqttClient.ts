import mqtt, { type MqttClient } from 'mqtt';
import { serverEventBus } from '../events/serverEventBus';
import { db } from '../db/database';
import { config } from '../config';
import { Logger } from '../utils/logger';
import type {
  CampusNormalizedEvent,
  MQ2ReadingEvent,
  PirMotionEvent,
  AccessGrantedEvent,
  AccessDeniedEvent,
  EnergyDemandEvent
} from '../../src/types/events';

export interface MqttPacket {
  topic: string;
  payload: string | Record<string, unknown>;
}

export class ServerMqttClient {
  private static instance: ServerMqttClient;
  private client: MqttClient | null = null;
  private isConnected = false;
  private isPhysicalBroker = false;
  private reconnectAttempts = 0;

  private constructor() {
    this.init();
  }

  public static getInstance(): ServerMqttClient {
    if (!ServerMqttClient.instance) {
      ServerMqttClient.instance = new ServerMqttClient();
    }
    return ServerMqttClient.instance;
  }

  private init(): void {
    if (config.mqttUrl && (config.mqttUrl.startsWith('mqtt://') || config.mqttUrl.startsWith('mqtts://') || config.mqttUrl.startsWith('tcp://'))) {
      this.connectToPhysicalBroker(config.mqttUrl);
    } else {
      // Local Ingestion Bridge for development / test
      this.isConnected = true;
      this.isPhysicalBroker = false;
      const health = db.healthRecords.get('MQTT');
      if (health) {
        health.status = 'HEALTHY';
        health.details = 'Local Ingestion Bridge Active (Awaiting physical broker configuration)';
      }
      Logger.info('MQTT', 'Local Ingestion Bridge active');
    }
  }

  private connectToPhysicalBroker(brokerUrl: string): void {
    const sanitizedUrl = brokerUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
    Logger.info('MQTT', `Connecting to production MQTT broker at ${sanitizedUrl}`);

    const options: mqtt.IClientOptions = {
      username: config.mqttUsername,
      password: config.mqttPassword,
      rejectUnauthorized: config.mqttTlsRejectUnauthorized,
      reconnectPeriod: 2000,
      connectTimeout: 5000,
    };

    if (config.mqttCaCert) options.ca = [config.mqttCaCert];
    if (config.mqttClientCert) options.cert = config.mqttClientCert;
    if (config.mqttClientKey) options.key = config.mqttClientKey;

    try {
      this.client = mqtt.connect(brokerUrl, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        this.isPhysicalBroker = true;
        this.reconnectAttempts = 0;
        Logger.info('MQTT', 'Connected to production MQTT broker');

        // Subscribe to standard campus hierarchy
        this.client?.subscribe('campus/+/+/+', (err) => {
          if (err) {
            Logger.error('MQTT', 'Subscription registration failed', { details: { error: err.message } });
          } else {
            Logger.info('MQTT', 'Subscribed to campus/+/+/+ topics');
          }
        });

        const health = db.healthRecords.get('MQTT');
        if (health) {
          health.status = 'HEALTHY';
          health.details = `Connected to Broker at ${sanitizedUrl}`;
          health.lastHeartbeat = new Date().toISOString();
        }
      });

      this.client.on('message', (topic, payload) => {
        this.handleMessage({ topic, payload: payload.toString() });
      });

      this.client.on('reconnect', () => {
        this.reconnectAttempts++;
        Logger.warn('MQTT', `Attempting MQTT reconnect (attempt ${this.reconnectAttempts})`);
        const health = db.healthRecords.get('MQTT');
        if (health) {
          health.status = 'DEGRADED';
          health.reconnectCount = this.reconnectAttempts;
          health.details = `Reconnecting to ${sanitizedUrl}...`;
        }
      });

      this.client.on('error', (err) => {
        Logger.error('MQTT', 'MQTT broker error', {
          errorClassification: 'BROKER_ERROR',
          details: { message: err.message },
        });
        const health = db.healthRecords.get('MQTT');
        if (health) {
          health.status = 'DEGRADED';
          health.lastError = err.message;
        }
      });

      this.client.on('offline', () => {
        this.isConnected = false;
        Logger.warn('MQTT', 'MQTT client offline');
        const health = db.healthRecords.get('MQTT');
        if (health) {
          health.status = 'OFFLINE';
          health.details = 'MQTT Broker unreachable';
        }
      });
    } catch (err: any) {
      Logger.error('MQTT', 'Failed to initialize MQTT connection', {
        errorClassification: 'INITIALIZATION_FAILURE',
        details: { message: err.message },
      });
    }
  }

  public parseTopic(topic: string): { zone: string; subsystem: string; device: string } | null {
    if (!topic || typeof topic !== 'string') return null;
    const parts = topic.split('/');
    if (parts.length !== 4 || parts[0] !== 'campus') {
      return null;
    }
    const [, zone, subsystem, device] = parts;
    const validSubsystems = new Set(['sensor', 'access', 'energy']);
    if (!validSubsystems.has(subsystem)) {
      return null;
    }
    // Strict alphanumeric/hyphen/space topic structure
    if (!/^[A-Za-z0-9_ -]+$/.test(zone) || !/^[A-Za-z0-9_ -]+$/.test(device)) {
      return null;
    }
    return { zone, subsystem, device };
  }

  /**
   * Ingests, validates, and normalizes raw MQTT packets into typed domain events.
   */
  public handleMessage(packet: MqttPacket): CampusNormalizedEvent | null {
    const parsed = this.parseTopic(packet.topic);
    if (!parsed) {
      Logger.warn('MQTT', `Non-compliant topic dropped: ${packet.topic}`, {
        errorClassification: 'MALFORMED_TOPIC',
      });
      return null;
    }

    let payloadObj: Record<string, any> = {};
    if (typeof packet.payload === 'string') {
      try {
        payloadObj = JSON.parse(packet.payload);
      } catch {
        Logger.warn('MQTT', `Malformed non-JSON payload dropped from ${packet.topic}`, {
          errorClassification: 'MALFORMED_PAYLOAD',
        });
        return null;
      }
    } else if (packet.payload && typeof packet.payload === 'object') {
      payloadObj = packet.payload;
    } else {
      return null;
    }

    const { zone, subsystem, device } = parsed;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let event: CampusNormalizedEvent | null = null;

    switch (subsystem) {
      case 'sensor': {
        const sensor = db.sensors.get(device);
        if (!sensor && !db.devices.get(device)) {
          Logger.warn('MQTT', `Sensor telemetry dropped for unregistered device: ${device}`);
          return null;
        }

        if (payloadObj.ppm !== undefined) {
          const ppm = Number(payloadObj.ppm);
          if (isNaN(ppm) || !isFinite(ppm) || ppm < 0 || ppm > 10000) {
            Logger.warn('MQTT', `Invalid or unphysical ppm value in sensor packet: ${payloadObj.ppm}`);
            return null;
          }

          const status = ppm >= 750 ? 'CRITICAL' : ppm >= 500 ? 'ELEVATED' : 'NORMAL';
          const sev = ppm >= 750 ? 'critical' : ppm >= 500 ? 'warning' : 'info';
          event = {
            id: `EVT-MQ2-${device}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
            id: `EVT-PIR-${device}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
              durationSec: Number(payloadObj.durationSec || 0),
            },
          } as PirMotionEvent;
        }
        break;
      }

      case 'access': {
        const door = db.accessControllers.get(device);
        if (!door) {
          Logger.warn('MQTT', `Access event dropped for unregistered portal: ${device}`);
          return null;
        }

        // Verify device authentication proof
        const isDeviceAuth = payloadObj.deviceToken === config.deviceApiKey || payloadObj.deviceKey === config.deviceApiKey;

        if (payloadObj.granted) {
          // Untrusted or anonymous MQTT packets cannot unlock doors
          if (!isDeviceAuth) {
            Logger.warn('MQTT', `Unauthorized MQTT access grant attempt rejected on ${device}: missing device authentication proof`, {
              errorClassification: 'UNAUTHENTICATED_MQTT_DEVICE',
              details: { topic: packet.topic },
            });
            return null;
          }

          const cardholder = String(payloadObj.cardholder || '');
          if (!cardholder || cardholder === 'Rogue MQTT Injector') {
            Logger.warn('MQTT', `Access grant rejected on ${device}: invalid or untrusted cardholder`);
            return null;
          }

          // Verify user clearance if registered user
          const user = Array.from(db.users.values()).find(u => u.name === cardholder || u.username === cardholder);
          if (user && !door.authorizedRoles.includes(user.role)) {
            Logger.warn('MQTT', `Access grant rejected on ${device}: user lacks authorized role clearance`);
            return null;
          }

          event = {
            id: `EVT-ACC-GRANT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
            id: `EVT-ACC-DENY-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: timeStr,
            category: 'ACCESS',
            type: 'ACCESS_DENIED',
            source: 'mqtt',
            zoneId: zone,
            deviceId: device,
            severity: 'warning',
            payload: {
              doorId: device,
              reason: payloadObj.reason || 'Invalid credential presented',
              failedAttempts: Number(payloadObj.failedAttempts || 1),
            },
          } as AccessDeniedEvent;
        }
        break;
      }

      case 'energy': {
        const powerKw = Number(payloadObj.powerKw ?? payloadObj.kw);
        if (isNaN(powerKw) || powerKw < 0) {
          Logger.warn('MQTT', `Invalid energy power reading dropped: ${payloadObj.powerKw}`);
          return null;
        }

        event = {
          id: `EVT-NRG-${device}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: timeStr,
          category: 'ENERGY',
          type: 'ENERGY_DEMAND',
          source: 'mqtt',
          zoneId: zone,
          deviceId: device,
          severity: 'info',
          payload: {
            zoneId: zone,
            currentPowerKw: powerKw,
            powerFactor: Number(payloadObj.powerFactor || 0.98),
          },
        } as EnergyDemandEvent;
        break;
      }
    }

    if (event) {
      serverEventBus.processEvent(event);
    }

    return event;
  }

  public getStatus(): { isConnected: boolean; isPhysicalBroker: boolean; mode: string } {
    return {
      isConnected: this.isConnected,
      isPhysicalBroker: this.isPhysicalBroker,
      mode: this.isPhysicalBroker ? 'live_broker' : 'simulated_bridge',
    };
  }

  public async connectToBroker(brokerUrl: string): Promise<void> {
    if (this.client) {
      await this.close();
    }
    this.isConnected = false;
    this.isPhysicalBroker = false;
    return new Promise((resolve, reject) => {
      this.connectToPhysicalBroker(brokerUrl);
      if (!this.client) {
        return reject(new Error('Failed to create MQTT client'));
      }
      const onConnect = () => {
        cleanup();
        resolve();
      };
      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };
      const cleanup = () => {
        this.client?.off('connect', onConnect);
        this.client?.off('error', onError);
      };
      this.client.once('connect', onConnect);
      this.client.once('error', onError);
    });
  }

  public async close(): Promise<void> {
    if (this.client) {
      return new Promise((resolve) => {
        this.client?.end(true, {}, () => {
          this.isConnected = false;
          this.client = null;
          resolve();
        });
      });
    }
  }
}

export const serverMqtt = ServerMqttClient.getInstance();
export default serverMqtt;
