import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer, IncomingMessage } from 'node:http';
import { serverEventBus } from '../events/serverEventBus';
import { db } from '../db/database';
import { config } from '../config';
import { Logger } from '../utils/logger';
import type { CampusNormalizedEvent } from '../../src/types/events';

export interface ClientConnectionMeta {
  id: string;
  userId?: string;
  username?: string;
  role?: string;
  connectedAt: string;
  lastHeartbeat: string;
  ipAddress?: string;
  isAlive: boolean;
  messageCount: number;
  lastMessageTime: number;
}

export class CampusWebSocketServer {
  private static instance: CampusWebSocketServer;
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientConnectionMeta> = new Map();
  private busUnsubscribe: (() => void) | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

  public static getInstance(): CampusWebSocketServer {
    if (!CampusWebSocketServer.instance) {
      CampusWebSocketServer.instance = new CampusWebSocketServer();
    }
    return CampusWebSocketServer.instance;
  }

  public init(server: HttpServer): void {
    if (this.wss) return;

    this.wss = new WebSocketServer({
      noServer: true,
      maxPayload: config.wsMaxPayloadBytes,
    });

    server.on('upgrade', async (request: IncomingMessage, socket, head) => {
      const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
      const pathname = url.pathname;

      if (pathname !== '/ws' && pathname !== '/campus-events') {
        socket.destroy();
        return;
      }

      // Authentication Token extraction
      const token = url.searchParams.get('token') ||
                    request.headers['x-session-token'] ||
                    (request.headers.authorization ? request.headers.authorization.replace('Bearer ', '').trim() : '');

      let authenticatedUser: any = null;
      if (typeof token === 'string' && token.length > 0) {
        const session = await db.getSession(token);
        if (session && !session.revokedAt && new Date(session.expiresAt).getTime() > Date.now()) {
          authenticatedUser = await db.getUserById(session.userId);
        }
      }

      // SEC-MED-04: LIVE or production MUST require authentication.
      // Anonymous upgrade fallback is strictly isolated to simulated test or explicit dev configuration.
      const isLiveOrProd = config.realtimeMode === 'live' || config.environment === 'production';
      const isSimulatedDevAllowed = config.realtimeMode === 'simulated' &&
        (config.environment === 'test' || (config.environment === 'development' && config.allowAnonymousWsUpgrade));

      if (!authenticatedUser && (isLiveOrProd || !isSimulatedDevAllowed)) {
        Logger.warn('WEBSOCKET', 'Unauthorized WebSocket upgrade rejected: authentication required', {
          errorClassification: 'UNAUTHORIZED_WEBSOCKET',
          details: { environment: config.environment, realtimeMode: config.realtimeMode },
        });
        socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }

      this.wss?.handleUpgrade(request, socket, head, (ws) => {
        (ws as any).authenticatedUser = authenticatedUser;
        this.wss?.emit('connection', ws, request);
      });
    });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const user = (ws as any).authenticatedUser;
      const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const meta: ClientConnectionMeta = {
        id: clientId,
        userId: user ? user.id : 'anonymous_guest',
        username: user ? user.username : 'guest',
        role: user ? user.role : 'guest',
        connectedAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        ipAddress: req.socket.remoteAddress,
        isAlive: true,
        messageCount: 0,
        lastMessageTime: Date.now(),
      };

      this.clients.set(ws, meta);
      Logger.info('WEBSOCKET', `Client connected: ${clientId} (${meta.role})`, {
        userId: meta.userId,
        details: { ip: meta.ipAddress },
      });

      // Send initial connection welcome with server timestamp and clearance info
      this.sendSafe(ws, {
        type: 'SYSTEM_CONNECTION',
        category: 'SYSTEM',
        id: `EVT-CONN-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'system',
        severity: 'info',
        payload: {
          state: 'CONNECTED',
          reconnectAttempts: 0,
          clientId,
          role: meta.role,
          realtimeMode: config.realtimeMode,
          details: 'Connected to Smart Campus Production WebSocket Gateway',
        },
      });

      ws.on('pong', () => {
        const clientMeta = this.clients.get(ws);
        if (clientMeta) {
          clientMeta.isAlive = true;
          clientMeta.lastHeartbeat = new Date().toISOString();
        }
      });

      ws.on('message', (data: WebSocket.RawData) => {
        this.handleClientMessage(ws, data);
      });

      ws.on('close', (code, reason) => {
        Logger.info('WEBSOCKET', `Client disconnected: ${meta.id} (code: ${code})`, {
          userId: meta.userId,
          details: { reason: reason.toString() },
        });
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        Logger.warn('WEBSOCKET', `Client socket error: ${meta.id}`, {
          userId: meta.userId,
          errorClassification: 'SOCKET_ERROR',
          details: { message: err.message },
        });
        this.clients.delete(ws);
      });
    });

    // Subscribe to server event bus for outgoing broadcasts
    this.busUnsubscribe = serverEventBus.subscribe((event: CampusNormalizedEvent) => {
      this.broadcast(event);
    });

    // Start Heartbeat Monitor (detect and terminate dead sockets)
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((meta, ws) => {
        if (!meta.isAlive) {
          Logger.warn('WEBSOCKET', `Terminating unresponsive client: ${meta.id}`, { userId: meta.userId });
          this.clients.delete(ws);
          ws.terminate();
          return;
        }
        meta.isAlive = false;
        try {
          ws.ping();
        } catch {
          this.clients.delete(ws);
        }
      });
    }, config.wsHeartbeatIntervalMs);
    this.heartbeatInterval.unref();

    const health = db.healthRecords.get('WEBSOCKET');
    if (health) {
      health.status = 'HEALTHY';
      health.lastHeartbeat = new Date().toISOString();
      health.details = `Server WebSocket Gateway Active on /ws (maxPayload: ${config.wsMaxPayloadBytes}B)`;
    }
  }

  public broadcast(event: CampusNormalizedEvent): void {
    if (!this.wss) return;

    const payload = JSON.stringify(event);
    this.clients.forEach((meta, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Enforce channel permissions if event is sensitive
        if (event.category === 'SYSTEM' && event.type === 'AUDIT_RECORD' && meta.role === 'student') {
          return; // Student cannot receive raw security audit events
        }

        try {
          ws.send(payload);
        } catch (err: any) {
          Logger.error('WEBSOCKET', 'Broadcast transmission failure', {
            userId: meta.userId,
            errorClassification: 'BROADCAST_FAILURE',
            details: { message: err.message },
          });
        }
      }
    });
  }

  public getConnectedClientCount(): number {
    return this.clients.size;
  }

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.busUnsubscribe) {
      this.busUnsubscribe();
      this.busUnsubscribe = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.clients.clear();
  }

  private handleClientMessage(ws: WebSocket, raw: WebSocket.RawData): void {
    const meta = this.clients.get(ws);
    if (!meta) return;

    const now = Date.now();
    // Rate limit: Max 20 messages per second per client
    if (now - meta.lastMessageTime < 1000) {
      meta.messageCount++;
      if (meta.messageCount > 20) {
        Logger.warn('WEBSOCKET', `Rate limit exceeded for client: ${meta.id}`, { userId: meta.userId });
        ws.send(JSON.stringify({ type: 'ERROR', error: 'Rate limit exceeded on WebSocket connection' }));
        return;
      }
    } else {
      meta.messageCount = 1;
      meta.lastMessageTime = now;
    }

    try {
      const text = raw.toString();
      if (text === 'ping' || text === '{"type":"PING"}') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        meta.isAlive = true;
        meta.lastHeartbeat = new Date().toISOString();
        return;
      }

      const parsed = JSON.parse(text);

      // Explicit Allowlist for Client -> Server WebSocket messages
      // Browser WebSocket clients are STRICTLY READ-ONLY subscribers.
      // All authoritative state mutation must go through authenticated REST endpoints.
      const ALLOWED_CLIENT_MESSAGE_TYPES = new Set([
        'PING',
        'PONG',
        'SUBSCRIBE',
        'UNSUBSCRIBE',
        'CHANNEL_FILTER',
      ]);

      const msgType = String(parsed.type || '').toUpperCase();

      if (!ALLOWED_CLIENT_MESSAGE_TYPES.has(msgType)) {
        Logger.warn('WEBSOCKET', `Rejected unauthorized client message/mutation attempt: ${parsed.type || 'UNKNOWN'}`, {
          userId: meta.userId,
          errorClassification: 'CLIENT_MUTATION_REJECTED',
          details: { messageType: parsed.type, clientRole: meta.role },
        });
        ws.send(JSON.stringify({
          type: 'ERROR',
          error: 'Forbidden: Browser WebSocket clients are read-only. State-mutating commands must be submitted via authenticated REST API endpoints.',
        }));
        return;
      }

      // Handle allowed read-only client messages
      if (msgType === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        meta.isAlive = true;
        meta.lastHeartbeat = new Date().toISOString();
        return;
      }

      if (msgType === 'SUBSCRIBE' || msgType === 'UNSUBSCRIBE' || msgType === 'CHANNEL_FILTER') {
        ws.send(JSON.stringify({
          type: 'ACK',
          action: msgType,
          status: 'OK',
          timestamp: new Date().toISOString(),
        }));
        return;
      }
    } catch {
      // Safely ignore non-JSON messages without crashing
    }
  }

  private sendSafe(ws: WebSocket, data: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch {}
    }
  }
}

export const wsGateway = CampusWebSocketServer.getInstance();
export default wsGateway;
