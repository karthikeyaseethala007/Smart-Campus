import type { 
  NormalizedDeviceEvent, 
  CampusEvent, 
  CampusAlert, 
  CampusIncident, 
  EventSource, 
  IncidentSeverity 
} from '../types';

export class DeviceAdapter {
  /**
   * Translates an incoming normalized device event into the application's CampusEvent feed representation.
   */
  public static toCampusEvent(event: NormalizedDeviceEvent, resultingAction: string): CampusEvent {
    return {
      id: event.id,
      time: event.timestamp,
      eventType: event.type,
      location: event.location,
      resultingAction,
      severity: event.severity,
      source: event.source,
    };
  }

  /**
   * Translates a warning/critical normalized device event into a CampusAlert.
   */
  public static toCampusAlert(
    event: NormalizedDeviceEvent, 
    details: string, 
    incidentId?: string
  ): CampusAlert {
    return {
      id: 'ALT-' + event.id.replace('EVT-', ''),
      title: event.type,
      location: event.location,
      timestamp: event.timestamp,
      severity: event.severity,
      source: event.source,
      details,
      deviceId: event.deviceId,
      incidentId,
      acknowledged: false,
    };
  }

  /**
   * Translates a critical or warning event into a full CampusIncident record.
   */
  public static toCampusIncident(
    event: NormalizedDeviceEvent,
    zone: string,
    description: string,
    auditAction: string,
    actor = 'AUTOMATED CONTROLLER'
  ): CampusIncident {
    const incId = 'INC-' + event.id.replace('EVT-', '');
    return {
      id: incId,
      event: event.type,
      location: event.location,
      zone,
      severity: event.severity,
      source: event.source,
      status: 'open',
      timestamp: event.timestamp,
      description,
      telemetry: event.payload
        ? Object.fromEntries(
            Object.entries(event.payload).filter(
              (entry): entry is [string, string | number | boolean] =>
                entry[1] !== null && entry[1] !== undefined
            )
          )
        : undefined,
      auditTimeline: [
        {
          time: event.timestamp,
          action: auditAction,
          actor,
        },
      ],
    };
  }

  /**
   * Helper factory to build a NormalizedDeviceEvent.
   */
  public static buildEvent(
    type: string,
    location: string,
    deviceId: string,
    severity: IncidentSeverity,
    source: EventSource,
    payload?: Record<string, string | number | boolean | null | undefined>
  ): NormalizedDeviceEvent {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const prefix = source === 'simulation' ? 'EVT-SIM-' : 'EVT-LIVE-';
    const id = prefix + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    return {
      id,
      type,
      location,
      deviceId,
      severity,
      source,
      timestamp: timeStr,
      payload,
    };
  }
}

export default DeviceAdapter;
