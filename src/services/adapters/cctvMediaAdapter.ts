import { eventBus } from '../eventBus';
import { authService } from '../authService';
import { healthService } from '../healthService';
import type {
  CameraStreamStateEvent,
  CameraPtzEvent,
  CameraSnapshotEvent
} from '../../types/events';

export type CameraProtocol = 'rtsp' | 'hls' | 'webrtc' | 'simulated';
export type CameraOperationalStatus = 'online' | 'degraded' | 'offline';

export interface CameraMetadata {
  id: string;
  name: string;
  zoneId: string;
  status: CameraOperationalStatus;
  protocol: CameraProtocol;
  streamUrl?: string;
  capabilities: {
    ptz: boolean;
    snapshot: boolean;
    nightVision: boolean;
    aiAnalytics: boolean;
  };
  lastSeen: string;
  lastHeartbeat: string;
  fps: number;
  resolution: string;
}

export class CctvMediaAdapter {
  private static instance: CctvMediaAdapter;
  private cameraRegistry: Map<string, CameraMetadata> = new Map();

  private constructor() {
    this.initializeRegistry();
  }

  public static getInstance(): CctvMediaAdapter {
    if (!CctvMediaAdapter.instance) {
      CctvMediaAdapter.instance = new CctvMediaAdapter();
    }
    return CctvMediaAdapter.instance;
  }

  private initializeRegistry(): void {
    const defaultCameras: CameraMetadata[] = [
      {
        id: 'CAM-01',
        name: 'Gate Access PTZ · Primary',
        zoneId: 'Main Gate',
        status: 'online',
        protocol: 'simulated',
        capabilities: { ptz: true, snapshot: true, nightVision: true, aiAnalytics: true },
        lastSeen: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        fps: 30,
        resolution: '1080p 60Hz',
      },
      {
        id: 'CAM-02',
        name: 'Robotics Bay West Overlook',
        zoneId: 'Innovation & Robotics Lab',
        status: 'online',
        protocol: 'simulated',
        capabilities: { ptz: false, snapshot: true, nightVision: false, aiAnalytics: true },
        lastSeen: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        fps: 30,
        resolution: '1080p 30Hz',
      },
      {
        id: 'CAM-03',
        name: 'Library Atrium Wide Angle',
        zoneId: 'Central Library',
        status: 'online',
        protocol: 'simulated',
        capabilities: { ptz: false, snapshot: true, nightVision: false, aiAnalytics: false },
        lastSeen: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        fps: 24,
        resolution: '1080p 24Hz',
      },
      {
        id: 'CAM-04',
        name: 'Science Wing · Lab 204 Corridor',
        zoneId: 'Science & Physics Lab',
        status: 'online',
        protocol: 'simulated',
        capabilities: { ptz: true, snapshot: true, nightVision: true, aiAnalytics: true },
        lastSeen: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        fps: 30,
        resolution: '1080p 30Hz',
      },
      {
        id: 'CAM-05',
        name: 'Hallway North Exit Perimeter',
        zoneId: 'Academic Hallway',
        status: 'online',
        protocol: 'simulated',
        capabilities: { ptz: false, snapshot: true, nightVision: false, aiAnalytics: false },
        lastSeen: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        fps: 30,
        resolution: '1080p 30Hz',
      },
      {
        id: 'CAM-06',
        name: 'Computer Lab Terminal A',
        zoneId: 'Computer Lab',
        status: 'online',
        protocol: 'simulated',
        capabilities: { ptz: false, snapshot: true, nightVision: false, aiAnalytics: true },
        lastSeen: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        fps: 30,
        resolution: '1080p 30Hz',
      },
      {
        id: 'CAM-07',
        name: 'Core Server Vault · Restricted',
        zoneId: 'Server Room',
        status: 'online',
        protocol: 'simulated',
        capabilities: { ptz: true, snapshot: true, nightVision: true, aiAnalytics: true },
        lastSeen: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        fps: 60,
        resolution: '4K UltraHD',
      },
    ];

    defaultCameras.forEach(cam => this.cameraRegistry.set(cam.id, cam));
  }

  public getCamera(cameraId: string): CameraMetadata | undefined {
    return this.cameraRegistry.get(cameraId);
  }

  public getAllCameras(): CameraMetadata[] {
    return Array.from(this.cameraRegistry.values());
  }

  /**
   * Sanitizes stream URLs so raw RTSP passwords or credentials are never leaked.
   */
  public sanitizeStreamUrl(url?: string): string | undefined {
    if (!url) return undefined;
    try {
      const parsed = new URL(url);
      if (parsed.password) {
        parsed.password = '***';
      }
      return parsed.toString();
    } catch {
      return url.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
    }
  }

  /**
   * Sets camera status and dispatches event.
   */
  public setCameraStatus(
    cameraId: string,
    status: CameraOperationalStatus,
    reason?: string
  ): void {
    const cam = this.cameraRegistry.get(cameraId);
    if (!cam) return;

    cam.status = status;
    cam.lastHeartbeat = new Date().toISOString();
    if (status !== 'offline') {
      cam.lastSeen = new Date().toISOString();
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const event: CameraStreamStateEvent = {
      id: `EVT-CAM-STATUS-${cameraId}-${Date.now()}`,
      timestamp: timeStr,
      category: 'CAMERA',
      type: 'CAMERA_STREAM_STATE',
      source: 'live',
      deviceId: cameraId,
      zoneId: cam.zoneId,
      severity: status === 'offline' ? 'critical' : status === 'degraded' ? 'warning' : 'info',
      payload: {
        cameraId,
        status,
        fps: status === 'offline' ? 0 : cam.fps,
        resolution: cam.resolution,
        reason,
      },
    };

    eventBus.dispatch(event);

    // Update camera gateway health
    const all = this.getAllCameras();
    const offlineCount = all.filter(c => c.status === 'offline').length;
    if (offlineCount > 0) {
      healthService.updateComponent('CAMERA_GATEWAY', {
        status: 'DEGRADED',
        details: `${all.length - offlineCount}/${all.length} Channels Active (${offlineCount} Offline)`,
      });
    } else {
      healthService.updateComponent('CAMERA_GATEWAY', {
        status: 'HEALTHY',
        details: `${all.length}/${all.length} Channels Active`,
      });
    }
  }

  /**
   * Dispatches PTZ action if user is authorized.
   */
  public executePtzAction(
    cameraId: string,
    action: CameraPtzEvent['payload']['action']
  ): { success: boolean; message: string } {
    const auth = authService.checkPermission('CONTROL_CAMERA');
    if (!auth.allowed) {
      return {
        success: false,
        message: auth.reason || 'Insufficient clearance to operate PTZ actuators.',
      };
    }

    const cam = this.cameraRegistry.get(cameraId);
    if (!cam) {
      return { success: false, message: `Camera ${cameraId} not found.` };
    }

    if (!cam.capabilities.ptz) {
      return { success: false, message: `Camera ${cam.name} is a fixed-mount unit without PTZ servo capabilities.` };
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const event: CameraPtzEvent = {
      id: `EVT-CAM-PTZ-${cameraId}-${Date.now()}`,
      timestamp: timeStr,
      category: 'CAMERA',
      type: 'CAMERA_PTZ_ACTION',
      source: 'live',
      deviceId: cameraId,
      zoneId: cam.zoneId,
      severity: 'info',
      payload: {
        cameraId,
        action,
      },
    };

    eventBus.dispatch(event);
    return { success: true, message: `PTZ servo command ${action} issued to ${cameraId}.` };
  }

  /**
   * Captures camera snapshot and dispatches audit / event.
   */
  public captureSnapshot(cameraId: string): CameraSnapshotEvent {
    const cam = this.cameraRegistry.get(cameraId);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const filename = `SNAP_${cameraId}_${Date.now()}.png`;

    const event: CameraSnapshotEvent = {
      id: `EVT-CAM-SNAP-${cameraId}-${Date.now()}`,
      timestamp: timeStr,
      category: 'CAMERA',
      type: 'CAMERA_SNAPSHOT_CAPTURED',
      source: 'live',
      deviceId: cameraId,
      zoneId: cam?.zoneId,
      severity: 'info',
      payload: {
        cameraId,
        filename,
      },
    };

    eventBus.dispatch(event);
    return event;
  }
}

export const cctvMediaAdapter = CctvMediaAdapter.getInstance();
export default cctvMediaAdapter;
