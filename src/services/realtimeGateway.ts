import { eventBus } from './eventBus';
import { healthService } from './healthService';
import type { CampusNormalizedEvent, SystemConnectionEvent } from '../types/events';

export type RealtimeConnectionState =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'RECONNECTING'
  | 'ERROR';

export type RealtimeMode = 'simulated' | 'live' | 'hybrid';

export interface RealtimeGatewayOptions {
  url?: string;
  mode?: RealtimeMode;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number;
  initialReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
}

export type ConnectionStateListener = (
  state: RealtimeConnectionState,
  meta: { attempts: number; latencyMs?: number; mode: RealtimeMode }
) => void;

export class RealtimeGateway {
  private static instance: RealtimeGateway;
  private ws: WebSocket | null = null;
  private connectionState: RealtimeConnectionState = 'DISCONNECTED';
  private mode: RealtimeMode;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private initialReconnectDelayMs: number;
  private maxReconnectDelayMs: number;
  private heartbeatIntervalMs: number;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingStartTime = 0;
  private latencyMs?: number;
  private listeners: Set<ConnectionStateListener> = new Set();
  private intentionalDisconnect = false;

  private constructor(options: RealtimeGatewayOptions = {}) {
    const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_REALTIME_URL;
    const envMode = typeof import.meta !== 'undefined' && import.meta.env?.VITE_REALTIME_MODE;

    this.url = options.url || envUrl || 'ws://localhost:8080/campus-events';
    this.mode = (options.mode || envMode || 'simulated') as RealtimeMode;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 8;
    this.initialReconnectDelayMs = options.initialReconnectDelayMs ?? 1000;
    this.maxReconnectDelayMs = options.maxReconnectDelayMs ?? 15000;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 10000;
  }

  public static getInstance(options?: RealtimeGatewayOptions): RealtimeGateway {
    if (!RealtimeGateway.instance) {
      RealtimeGateway.instance = new RealtimeGateway(options);
    }
    return RealtimeGateway.instance;
  }

  public getConnectionState(): RealtimeConnectionState {
    return this.connectionState;
  }

  public getMode(): RealtimeMode {
    return this.mode;
  }

  public setMode(mode: RealtimeMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    if (mode === 'live' && this.connectionState !== 'CONNECTED' && this.connectionState !== 'CONNECTING') {
      this.connect();
    }
    this.notifyState();
  }

  public connect(): void {
    this.intentionalDisconnect = false;

    if (this.mode === 'simulated') {
      this.setConnectionState('CONNECTED');
      healthService.updateComponent('WEBSOCKET', {
        status: 'HEALTHY',
        details: 'Simulated Realtime Engine Active',
        latencyMs: 1,
      });
      return;
    }

    if (typeof window === 'undefined' && typeof WebSocket === 'undefined') return;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setConnectionState(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setConnectionState('CONNECTED');
        this.startHeartbeat();
        healthService.updateComponent('WEBSOCKET', {
          status: 'HEALTHY',
          details: `Connected to ${this.url}`,
          latencyMs: this.latencyMs || 10,
        });
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleIncomingRaw(event.data);
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (!this.intentionalDisconnect) {
          this.handleDisconnect();
        } else {
          this.setConnectionState('DISCONNECTED');
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[RealtimeGateway] WebSocket error event encountered:', err);
        healthService.recordError('WEBSOCKET', 'WebSocket transport connection failed');
        // Do not crash - onclose will handle reconnect or fallback
      };
    } catch (err) {
      console.warn('[RealtimeGateway] Connection establishment error:', err);
      this.handleDisconnect();
    }
  }

  public disconnect(): void {
    this.intentionalDisconnect = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.setConnectionState('DISCONNECTED');
    healthService.updateComponent('WEBSOCKET', {
      status: 'OFFLINE',
      details: 'User initiated disconnect',
    });
  }

  public send(data: unknown): boolean {
    if (this.mode === 'simulated') {
      // In simulated mode, local dispatch
      return true;
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        this.ws.send(payload);
        return true;
      } catch (err) {
        console.error('[RealtimeGateway] Send failure:', err);
        return false;
      }
    }
    return false;
  }

  public subscribe(listener: ConnectionStateListener): () => void {
    this.listeners.add(listener);
    listener(this.connectionState, {
      attempts: this.reconnectAttempts,
      latencyMs: this.latencyMs,
      mode: this.mode,
    });
    return () => this.listeners.delete(listener);
  }

  private handleIncomingRaw(rawData: unknown): void {
    if (typeof rawData !== 'string') return;

    // Handle heartbeat pong
    if (rawData === 'pong' || rawData === '{"type":"PONG"}') {
      if (this.pingStartTime > 0) {
        this.latencyMs = Math.round(performance.now() - this.pingStartTime);
        healthService.recordHeartbeat('WEBSOCKET', this.latencyMs);
      }
      return;
    }

    try {
      const parsed = JSON.parse(rawData);
      // Validate schema
      if (eventBus.isValidEvent(parsed)) {
        eventBus.dispatch(parsed as CampusNormalizedEvent);
      } else {
        console.warn('[RealtimeGateway] Received payload with invalid schema:', parsed);
      }
    } catch {
      console.warn('[RealtimeGateway] Non-JSON payload received:', rawData);
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.initialReconnectDelayMs * Math.pow(1.5, this.reconnectAttempts - 1),
        this.maxReconnectDelayMs
      );
      this.setConnectionState('RECONNECTING');
      healthService.updateComponent('WEBSOCKET', {
        status: 'DEGRADED',
        details: `Reconnecting (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${Math.round(delay)}ms)`,
        reconnectCount: this.reconnectAttempts,
      });

      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      // Reconnect limit reached -> degrade gracefully to simulated/offline
      this.setConnectionState('DEGRADED');
      healthService.updateComponent('WEBSOCKET', {
        status: 'DEGRADED',
        details: 'Live socket unreachable. Running local operational fallback.',
      });
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.pingStartTime = performance.now();
        this.ws.send(JSON.stringify({ type: 'PING', timestamp: new Date().toISOString() }));
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private setConnectionState(nextState: RealtimeConnectionState): void {
    if (this.connectionState === nextState) return;
    this.connectionState = nextState;

    // Emit connection event on eventBus
    eventBus.emit<SystemConnectionEvent>({
      category: 'SYSTEM',
      type: 'SYSTEM_CONNECTION',
      source: 'system',
      severity: nextState === 'ERROR' || nextState === 'DISCONNECTED' ? 'warning' : 'info',
      payload: {
        state: nextState,
        reconnectAttempts: this.reconnectAttempts,
        url: this.url,
      },
    });

    this.notifyState();
  }

  private notifyState(): void {
    const meta = {
      attempts: this.reconnectAttempts,
      latencyMs: this.latencyMs,
      mode: this.mode,
    };
    this.listeners.forEach(l => {
      try {
        l(this.connectionState, meta);
      } catch (err) {
        console.error('[RealtimeGateway] Listener notification error:', err);
      }
    });
  }
}

export const realtimeGateway = RealtimeGateway.getInstance();
export default realtimeGateway;
