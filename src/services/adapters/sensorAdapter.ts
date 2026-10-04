import { eventBus } from '../eventBus';
import type {
  MQ2ReadingEvent,
  PirMotionEvent,
  EventSourceType
} from '../../types/events';

export interface SensorThresholds {
  mq2ElevatedThresholdPpm: number;
  mq2CriticalThresholdPpm: number;
}

export class SensorAdapter {
  private static instance: SensorAdapter;
  private thresholds: SensorThresholds = {
    mq2ElevatedThresholdPpm: 500,
    mq2CriticalThresholdPpm: 750,
  };

  private constructor() {}

  public static getInstance(): SensorAdapter {
    if (!SensorAdapter.instance) {
      SensorAdapter.instance = new SensorAdapter();
    }
    return SensorAdapter.instance;
  }

  public setThresholds(thresholds: Partial<SensorThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  public getThresholds(): SensorThresholds {
    return { ...this.thresholds };
  }

  /**
   * Evaluates MQ-2 reading and dispatches normalized event.
   */
  public processMQ2Reading(
    sensorId: string,
    ppm: number,
    source: EventSourceType = 'live',
    location = 'Science Block · Lab 204'
  ): MQ2ReadingEvent {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let status: 'NORMAL' | 'ELEVATED' | 'CRITICAL' = 'NORMAL';
    let severity: 'info' | 'warning' | 'critical' = 'info';

    if (ppm >= this.thresholds.mq2CriticalThresholdPpm) {
      status = 'CRITICAL';
      severity = 'critical';
    } else if (ppm >= this.thresholds.mq2ElevatedThresholdPpm) {
      status = 'ELEVATED';
      severity = 'warning';
    }

    const event: MQ2ReadingEvent = {
      id: `EVT-MQ2-${sensorId}-${Date.now()}`,
      timestamp: timeStr,
      category: 'MQ2',
      type: 'MQ2_READING',
      source,
      deviceId: sensorId,
      zoneId: 'Science & Physics Lab',
      severity,
      payload: {
        sensorId,
        ppm,
        threshold: this.thresholds.mq2ElevatedThresholdPpm,
        status,
        ventilationActive: status !== 'NORMAL',
        location,
      },
    };

    eventBus.dispatch(event);
    return event;
  }

  /**
   * Evaluates PIR sensor state transition and dispatches normalized event.
   */
  public processPirReading(
    sensorId: string,
    state: 'MOTION' | 'CLEAR',
    zone = 'Innovation & Robotics Lab',
    source: EventSourceType = 'live'
  ): PirMotionEvent {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const event: PirMotionEvent = {
      id: `EVT-PIR-${sensorId}-${Date.now()}`,
      timestamp: timeStr,
      category: 'PIR',
      type: 'PIR_MOTION',
      source,
      deviceId: sensorId,
      zoneId: zone,
      severity: state === 'MOTION' ? 'warning' : 'info',
      payload: {
        zoneId: zone,
        state,
        durationSec: state === 'MOTION' ? 12 : 0,
      },
    };

    eventBus.dispatch(event);
    return event;
  }
}

export const sensorAdapter = SensorAdapter.getInstance();
export default sensorAdapter;
