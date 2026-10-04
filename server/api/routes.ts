import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { db, type DbUser } from '../db/database';
import { serverAuth } from '../auth/authService';
import { cctvGateway } from '../cameras/cctvGateway';
import { deviceRegistry } from '../devices/deviceRegistry';
import { serverEventBus } from '../events/serverEventBus';
import { WiegandParser } from '../devices/wiegandParser';
import { config } from '../config';
import { Logger } from '../utils/logger';
import type {
  IncidentAcknowledgedEvent,
  IncidentInvestigatingEvent,
  IncidentResolvedEvent,
  ZoneLockdownEvent
} from '../../src/types/events';

interface RateLimitTracker {
  count: number;
  resetAt: number;
}
const rateLimitMap: Map<string, RateLimitTracker> = new Map();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const tracker = rateLimitMap.get(key);

  if (!tracker || now > tracker.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (tracker.count >= limit) {
    return false;
  }

  tracker.count++;
  return true;
}

function resolveCorsOrigin(req: IncomingMessage): string | null {
  const origin = req.headers.origin;
  if (!origin) return null;

  // Exact match in configured trustedOrigins
  if (config.trustedOrigins && config.trustedOrigins.includes(origin)) {
    return origin;
  }

  // Exact match to config.corsOrigin
  if (config.corsOrigin && config.corsOrigin !== '*' && config.corsOrigin === origin) {
    return origin;
  }

  // In non-production only, if config.corsOrigin is explicitly '*'
  if (config.environment !== 'production' && config.corsOrigin === '*') {
    return '*';
  }

  return null;
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown, correlationId: string): void {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'x-request-id': correlationId,
    'x-correlation-id': correlationId,
  });
  res.end(payload);
}

function isTrustedDeviceRequest(req: IncomingMessage): boolean {
  const deviceKey = req.headers['x-device-key'] || req.headers['x-api-key'];
  if (typeof deviceKey === 'string' && deviceKey.trim()) {
    return deviceKey.trim() === config.deviceApiKey;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('DeviceKey ')) {
    return authHeader.substring(10).trim() === config.deviceApiKey;
  }
  return false;
}

function sendError(res: ServerResponse, statusCode: number, message: string, correlationId: string, details?: unknown): void {
  sendJson(res, statusCode, {
    success: false,
    error: message,
    statusCode,
    correlationId,
    timestamp: new Date().toISOString(),
    details,
  }, correlationId);
}

async function requireAuthOrDevice(req: IncomingMessage, res: ServerResponse, correlationId: string): Promise<boolean> {
  const isDevice = isTrustedDeviceRequest(req);
  if (isDevice) return true;
  const user = await serverAuth.authenticateRequest(req);
  if (user) return true;
  sendError(res, 401, 'Unauthorized: Valid session token or device key required', correlationId);
  return false;
}

async function requireUserAuth(req: IncomingMessage, res: ServerResponse, correlationId: string): Promise<DbUser | null> {
  const user = await serverAuth.authenticateRequest(req);
  if (!user) {
    sendError(res, 401, 'Unauthorized: Valid session token required', correlationId);
    return null;
  }
  return user;
}

async function parseBody(req: IncomingMessage, correlationId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1e6) { // 1MB limit
        reject(new Error('Payload Too Large: Maximum allowed size is 1MB'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        Logger.warn('API', 'JSON parse failure on incoming request body', { requestId: correlationId });
        reject(new Error('Invalid JSON format in request body'));
      }
    });
    req.on('error', reject);
  });
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method?.toUpperCase() || 'GET';
  const ip = req.socket.remoteAddress || '127.0.0.1';

  // Handle CORS
  const origin = req.headers.origin;
  const allowedOrigin = resolveCorsOrigin(req);

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    if (allowedOrigin !== '*') {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-token, x-device-key, x-correlation-id');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (method === 'OPTIONS') {
    if (origin && !allowedOrigin) {
      Logger.warn('CORS', `Untrusted cross-origin preflight rejected: ${origin}`, { requestId: correlationId });
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden: Untrusted cross-origin request rejected' }));
      return;
    }
    res.writeHead(204);
    res.end();
    return;
  }

  // Global API Rate Limit check
  const globalLimit = process.env.NODE_ENV === 'test' ? 10000 : config.rateLimitMax;
  if (!checkRateLimit(`global_${ip}`, globalLimit, config.rateLimitWindowMs)) {
    Logger.warn('API', `Global rate limit exceeded from ${ip}`, { requestId: correlationId });
    sendError(res, 429, 'Too Many Requests: Rate limit exceeded. Try again in 60s.', correlationId);
    return;
  }

  // 1. HEALTH CHECKS
  if (pathname === '/health' && method === 'GET') {
    const dbHealth = await db.checkHealth();
    const healthRecords = await db.getHealthRecords();
    const hasDegraded = healthRecords.some(h => h.status === 'DEGRADED') || !dbHealth.healthy;
    const hasOffline = healthRecords.some(h => h.status === 'OFFLINE');

    const overallStatus = hasOffline ? 'DEGRADED' : hasDegraded ? 'DEGRADED' : 'HEALTHY';
    sendJson(res, 200, {
      status: overallStatus,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      version: '1.0.0-phase4',
      environment: config.environment,
      realtimeMode: config.realtimeMode,
      database: dbHealth.healthy ? 'CONNECTED' : 'DISCONNECTED',
      correlationId,
    }, correlationId);
    return;
  }

  if (pathname === '/health/components' && method === 'GET') {
    const components = await db.getHealthRecords();
    sendJson(res, 200, {
      components,
      realtimeMode: config.realtimeMode,
      timestamp: new Date().toISOString(),
      correlationId,
    }, correlationId);
    return;
  }

  // 2. AUTHENTICATION ENDPOINTS
  if (pathname === '/api/auth/login' && method === 'POST') {
    const loginLimit = process.env.NODE_ENV === 'test' ? 1000 : 10;
    if (!checkRateLimit(`login_${ip}`, loginLimit, 60000)) {
      sendError(res, 429, 'Rate limit exceeded for authentication requests. Try again in 60s.', correlationId);
      return;
    }

    try {
      const body = await parseBody(req, correlationId);
      const { username, password } = body;
      if (!username || typeof username !== 'string') {
        sendError(res, 400, 'Bad Request: username string required', correlationId);
        return;
      }

      const loginResult = await serverAuth.login(username, password, ip);
      if (!loginResult.success) {
        if (loginResult.lockedOut) {
          sendError(res, 423, loginResult.error || 'Account Locked Out', correlationId);
          return;
        }
        sendError(res, 401, loginResult.error || 'Invalid credentials', correlationId);
        return;
      }

      sendJson(res, 200, { success: true, session: loginResult.session }, correlationId);
    } catch (err: any) {
      sendError(res, 400, err.message, correlationId);
    }
    return;
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    const authHeader = req.headers.authorization || (req.headers['x-session-token'] as string);
    const token = authHeader ? authHeader.replace('Bearer ', '').trim() : '';
    await serverAuth.logout(token);
    sendJson(res, 200, { success: true, message: 'Logged out successfully' }, correlationId);
    return;
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    const user = await serverAuth.authenticateRequest(req);
    if (!user) {
      sendError(res, 401, 'Unauthorized: Valid session token required', correlationId);
      return;
    }
    const { passwordHash: _, ...safeUser } = user;
    sendJson(res, 200, { user: safeUser }, correlationId);
    return;
  }

  // 3. DASHBOARD / STATE SNAPSHOT
  if (pathname === '/api/state' && method === 'GET') {
    const user = await requireUserAuth(req, res, correlationId);
    if (!user) return;

    const safeCameras = cctvGateway.getSafeCameraList();
    const allIncidents = await db.getAllIncidents();
    const activeIncidents = allIncidents.filter(i => i.status !== 'resolved');
    const health = await db.getHealthRecords();

    sendJson(res, 200, {
      timestamp: new Date().toISOString(),
      mode: config.realtimeMode,
      environment: config.environment,
      user: { id: user.id, name: user.name, role: user.role },
      zones: await db.getAllZones(),
      devices: deviceRegistry.getAllDevices(),
      cameras: safeCameras,
      incidents: allIncidents,
      activeIncidents,
      sensors: await db.getAllSensors(),
      accessControllers: await db.getAllAccessControllers(),
      activity: await db.getActivityEvents(25),
      health,
    }, correlationId);
    return;
  }

  // 4. ZONES & LOCKDOWN
  if (pathname === '/api/zones' && method === 'GET') {
    if (!await requireAuthOrDevice(req, res, correlationId)) return;
    sendJson(res, 200, await db.getAllZones(), correlationId);
    return;
  }

  const zoneLockdownMatch = pathname.match(/^\/api\/zones\/([^/]+)\/lockdown$/);
  if (zoneLockdownMatch && method === 'POST') {
    const zoneId = decodeURIComponent(zoneLockdownMatch[1]);
    const user = await serverAuth.authenticateRequest(req);
    if (!user) {
      sendError(res, 401, 'Authentication required', correlationId);
      return;
    }

    const authCheck = await serverAuth.authorize(user, 'LOCKDOWN_ZONE', `Zone ${zoneId}`);
    if (!authCheck.allowed) {
      sendError(res, 403, authCheck.reason || 'Forbidden', correlationId);
      return;
    }

    if (!checkRateLimit(`lockdown_${user.id}`, 5, 60000)) {
      sendError(res, 429, 'Rate limit exceeded for zone lockdown actions.', correlationId);
      return;
    }

    try {
      const body = await parseBody(req, correlationId);
      const action = body.action === 'RELEASE' ? 'RELEASE' : 'LOCKDOWN';
      const zone = await db.getZone(zoneId);
      const targetZoneName = zone ? zone.zoneName : zoneId;

      const event: ZoneLockdownEvent = {
        id: `EVT-LOCKDOWN-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        category: 'SYSTEM',
        type: 'ZONE_LOCKDOWN',
        source: 'system',
        zoneId: targetZoneName,
        severity: action === 'LOCKDOWN' ? 'critical' : 'info',
        payload: {
          zoneName: targetZoneName,
          action,
          actor: user.name,
        },
      };

      serverEventBus.processEvent(event);
      Logger.info('SECURITY', `Zone lockdown action issued: ${action} on ${targetZoneName} by ${user.name}`, {
        userId: user.id,
        zoneId: targetZoneName,
        requestId: correlationId,
      });

      sendJson(res, 200, { success: true, message: `Zone ${targetZoneName} commanded to ${action}`, action }, correlationId);
    } catch (err: any) {
      sendError(res, 400, err.message, correlationId);
    }
    return;
  }

  // 5. DEVICE REGISTRY
  if (pathname === '/api/devices' && method === 'GET') {
    if (!await requireAuthOrDevice(req, res, correlationId)) return;
    sendJson(res, 200, deviceRegistry.getAllDevices(), correlationId);
    return;
  }

  const deviceMatch = pathname.match(/^\/api\/devices\/([^/]+)$/);
  if (deviceMatch && method === 'GET') {
    if (!await requireAuthOrDevice(req, res, correlationId)) return;
    const deviceId = decodeURIComponent(deviceMatch[1]);
    const device = deviceRegistry.getDeviceById(deviceId);
    if (!device) {
      sendError(res, 404, `Device ${deviceId} not found`, correlationId);
      return;
    }
    sendJson(res, 200, device, correlationId);
    return;
  }

  // 6. CAMERAS & CCTV
  if (pathname === '/api/cameras' && method === 'GET') {
    if (!await requireAuthOrDevice(req, res, correlationId)) return;
    sendJson(res, 200, cctvGateway.getSafeCameraList(), correlationId);
    return;
  }

  const cameraPtzMatch = pathname.match(/^\/api\/cameras\/([^/]+)\/ptz$/);
  if (cameraPtzMatch && method === 'POST') {
    const cameraId = decodeURIComponent(cameraPtzMatch[1]);
    const user = await serverAuth.authenticateRequest(req);
    if (!user) {
      sendError(res, 401, 'Authentication required', correlationId);
      return;
    }

    const authCheck = await serverAuth.authorize(user, 'CONTROL_CAMERA', `Camera ${cameraId} PTZ`);
    if (!authCheck.allowed) {
      sendError(res, 403, authCheck.reason || 'Forbidden', correlationId);
      return;
    }

    if (!checkRateLimit(`ptz_${user.id}`, 30, 60000)) {
      sendError(res, 429, 'Rate limit exceeded for PTZ motor actions.', correlationId);
      return;
    }

    try {
      const body = await parseBody(req, correlationId);
      const action = body.action || 'PAN_LEFT';
      const result = cctvGateway.executePtzAction(cameraId, action, user.name);
      if (!result.success) {
        sendError(res, 400, result.message, correlationId);
        return;
      }
      sendJson(res, 200, result, correlationId);
    } catch (err: any) {
      sendError(res, 400, err.message, correlationId);
    }
    return;
  }

  const cameraSnapshotMatch = pathname.match(/^\/api\/cameras\/([^/]+)\/snapshot$/);
  if (cameraSnapshotMatch && method === 'POST') {
    const cameraId = decodeURIComponent(cameraSnapshotMatch[1]);
    const user = await serverAuth.authenticateRequest(req);
    if (!user) {
      sendError(res, 401, 'Authentication required', correlationId);
      return;
    }

    const authCheck = await serverAuth.authorize(user, 'VIEW_CAMERA', `Camera ${cameraId} Snapshot`);
    if (!authCheck.allowed) {
      sendError(res, 403, authCheck.reason || 'Forbidden', correlationId);
      return;
    }

    const result = cctvGateway.captureSnapshot(cameraId, user.name);
    sendJson(res, 200, result, correlationId);
    return;
  }

  // 7. SENSORS
  if (pathname === '/api/sensors' && method === 'GET') {
    if (!await requireAuthOrDevice(req, res, correlationId)) return;
    sendJson(res, 200, await db.getAllSensors(), correlationId);
    return;
  }

  const sensorReadingMatch = pathname.match(/^\/api\/sensors\/([^/]+)\/reading$/);
  if (sensorReadingMatch && method === 'POST') {
    const sensorId = decodeURIComponent(sensorReadingMatch[1]);
    try {
      // 1. Device Authentication: untrusted network requests must not create physical sensor events
      const isDevice = isTrustedDeviceRequest(req);
      const user = await serverAuth.authenticateRequest(req);
      if (!isDevice && !user) {
        sendError(res, 401, 'Device authentication required for telemetry ingestion', correlationId);
        return;
      }

      // 2. Device Identity Validation
      const sensor = await db.getSensor(sensorId);
      if (!sensor) {
        sendError(res, 404, `Sensor ${sensorId} not registered in campus catalog`, correlationId);
        return;
      }

      const body = await parseBody(req, correlationId);
      const rawVal = body.ppm ?? body.value;
      if (rawVal === undefined || rawVal === null || rawVal === '') {
        sendError(res, 400, 'Missing sensor reading value', correlationId);
        return;
      }

      const ppm = Number(rawVal);
      // 3. Defensive Physical Bounds Validation
      if (isNaN(ppm) || !isFinite(ppm) || ppm < 0 || ppm > 10000) {
        sendError(res, 400, 'Invalid ppm value: must be a physically plausible number (0-10000)', correlationId);
        return;
      }

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const warningThresh = sensor.thresholdWarning || 500;
      const criticalThresh = sensor.thresholdCritical || 750;
      const status = ppm >= criticalThresh ? 'CRITICAL' : ppm >= warningThresh ? 'ELEVATED' : 'NORMAL';
      const sev = ppm >= criticalThresh ? 'critical' : ppm >= warningThresh ? 'warning' : 'info';

      serverEventBus.processEvent({
        id: `EVT-MQ2-${sensorId}-${Date.now()}`,
        timestamp: timeStr,
        category: 'MQ2',
        type: 'MQ2_READING',
        source: 'device_adapter',
        deviceId: sensorId,
        zoneId: sensor.zoneId || 'ZONE-SCI-204',
        severity: sev,
        payload: {
          sensorId,
          ppm,
          threshold: warningThresh,
          status,
          ventilationActive: ppm >= warningThresh,
        },
      });

      sendJson(res, 200, { success: true, sensorId, ppm, status }, correlationId);
    } catch (err: any) {
      sendError(res, 400, err.message, correlationId);
    }
    return;
  }

  // 8. ACCESS CONTROL & WIEGAND
  if (pathname === '/api/access' && method === 'GET') {
    if (!await requireAuthOrDevice(req, res, correlationId)) return;
    sendJson(res, 200, await db.getAllAccessControllers(), correlationId);
    return;
  }

  // Wiegand 26-bit Frame Ingestion endpoint
  const accessWiegandMatch = pathname.match(/^\/api\/access\/([^/]+)\/wiegand$/);
  if (accessWiegandMatch && method === 'POST') {
    const doorId = decodeURIComponent(accessWiegandMatch[1]);
    try {
      // 1. Device Authentication: Physical Wiegand readers must authenticate
      const isDevice = isTrustedDeviceRequest(req);
      const user = await serverAuth.authenticateRequest(req);
      if (!isDevice && !user) {
        sendError(res, 401, 'Device authentication required for physical reader ingestion', correlationId);
        return;
      }

      const body = await parseBody(req, correlationId);
      const rawFrame = body.frame || body.binary || '';
      const parsed = WiegandParser.parse26Bit(rawFrame);

      // 2. Strict 26-bit parity and structure validation
      if (!parsed.valid) {
        Logger.warn('ACCESS', `Invalid Wiegand 26-bit frame rejected on ${doorId}: ${parsed.error}`);
        sendError(res, 400, `Wiegand Parity Error: ${parsed.error}`, correlationId);
        return;
      }

      const door = await db.getAccessController(doorId);
      if (!door) {
        sendError(res, 404, `Door ${doorId} not found`, correlationId);
        return;
      }

      // 3. Database Authoritative Authorization (NO hardcoded credentials)
      const badge = await db.getAuthorizedBadge(parsed.facilityCode!, parsed.cardNumber!);
      const isAuthorized = Boolean(badge && badge.isActive && door.authorizedRoles.includes(badge.role));
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (isAuthorized && badge) {
        serverEventBus.processEvent({
          id: `EVT-ACC-WIEGAND-${Date.now()}`,
          timestamp: timeStr,
          category: 'ACCESS',
          type: 'ACCESS_GRANTED',
          source: 'device_adapter',
          zoneId: door?.zone || 'Main Gate',
          deviceId: doorId,
          severity: 'info',
          payload: {
            doorId,
            cardholder: badge.cardholder,
            clearance: badge.clearanceLevel,
          },
        });
        sendJson(res, 200, { success: true, status: 'GRANTED', cardInfo: parsed, cardholder: badge.cardholder }, correlationId);
      } else {
        serverEventBus.processEvent({
          id: `EVT-ACC-WIEGAND-DENY-${Date.now()}`,
          timestamp: timeStr,
          category: 'ACCESS',
          type: 'ACCESS_DENIED',
          source: 'device_adapter',
          zoneId: door?.zone || 'Main Gate',
          deviceId: doorId,
          severity: 'warning',
          payload: {
            doorId,
            reason: `Unrecognized badge credentials: FC ${parsed.facilityCode}, Card ${parsed.cardNumber}`,
            failedAttempts: 1,
          },
        });
        sendJson(res, 401, { success: false, status: 'DENIED', cardInfo: parsed }, correlationId);
      }
    } catch (err: any) {
      sendError(res, 400, err.message, correlationId);
    }
    return;
  }

  const accessPinMatch = pathname.match(/^\/api\/access\/([^/]+)\/pin$/);
  if (accessPinMatch && method === 'POST') {
    const doorId = decodeURIComponent(accessPinMatch[1]);
    try {
      // 1. Device or Operator Authentication: Unauthenticated network callers CANNOT unlock doors
      const isDevice = isTrustedDeviceRequest(req);
      const user = await serverAuth.authenticateRequest(req);
      if (!isDevice && !user) {
        sendError(res, 401, 'Device or operator authentication required', correlationId);
        return;
      }
      if (user && !isDevice) {
        const authCheck = await serverAuth.authorize(user, 'ACCESS_OVERRIDE', `Door ${doorId} Keypad Entry`);
        if (!authCheck.allowed) {
          sendError(res, 403, authCheck.reason || 'Forbidden: Insufficient operator clearance for keypad action', correlationId);
          return;
        }
      }

      const body = await parseBody(req, correlationId);
      const pin = String(body.pin || '');
      const door = await db.getAccessController(doorId);
      if (!door) {
        sendError(res, 404, `Door ${doorId} not found`, correlationId);
        return;
      }

      // 2. Cryptographic Salted Hash Verification (NO hardcoded production PIN)
      const isPinValid = Boolean(door.pinHash && serverAuth.verifyPassword(pin, door.pinHash));

      if (isPinValid) {
        door.failedAttempts = 0;
        door.isSecurityAlert = false;
        await db.updateAccessController(door);

        serverEventBus.processEvent({
          id: `EVT-ACC-GRANT-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          category: 'ACCESS',
          type: 'ACCESS_GRANTED',
          source: 'device_adapter',
          zoneId: door.zone,
          deviceId: door.id,
          severity: 'info',
          payload: {
            doorId: door.id,
            cardholder: body.cardholder || (user ? user.name : 'Authorized Keypad Operator'),
            clearance: user ? user.clearanceLevel : 'LEVEL_3',
          },
        });
        sendJson(res, 200, { success: true, message: 'Access Granted: Relays disengaged' }, correlationId);
      } else {
        const nextFailures = (door.failedAttempts || 0) + 1;
        door.failedAttempts = nextFailures;
        await db.updateAccessController(door);

        if (nextFailures >= 3) {
          serverEventBus.processEvent({
            id: `EVT-ACC-LOCKOUT-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            category: 'ACCESS',
            type: 'ACCESS_LOCKOUT',
            source: 'device_adapter',
            zoneId: door.zone,
            deviceId: door.id,
            severity: 'critical',
            payload: {
              doorId: door.id,
              consecutiveFailures: nextFailures,
              durationSeconds: 30,
            },
          });
          sendJson(res, 403, { success: false, lockedOut: true, message: 'Access Denied: Portal Locked Out for 30s' }, correlationId);
        } else {
          serverEventBus.processEvent({
            id: `EVT-ACC-DENY-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            category: 'ACCESS',
            type: 'ACCESS_DENIED',
            source: 'device_adapter',
            zoneId: door.zone,
            deviceId: door.id,
            severity: 'warning',
            payload: {
              doorId: door.id,
              reason: 'Invalid PIN entered',
              failedAttempts: nextFailures,
            },
          });
          sendJson(res, 401, { success: false, failedAttempts: nextFailures, message: 'Invalid PIN code' }, correlationId);
        }
      }
    } catch (err: any) {
      sendError(res, 400, err.message, correlationId);
    }
    return;
  }

  const accessOverrideMatch = pathname.match(/^\/api\/access\/([^/]+)\/override$/);
  if (accessOverrideMatch && method === 'POST') {
    const doorId = decodeURIComponent(accessOverrideMatch[1]);
    const user = await serverAuth.authenticateRequest(req);
    if (!user) {
      sendError(res, 401, 'Authentication required', correlationId);
      return;
    }

    const authCheck = await serverAuth.authorize(user, 'ACCESS_OVERRIDE', `Door ${doorId} Emergency Override`);
    if (!authCheck.allowed) {
      sendError(res, 403, authCheck.reason || 'Forbidden', correlationId);
      return;
    }

    const door = await db.getAccessController(doorId);
    if (!door) {
      sendError(res, 404, `Door ${doorId} not found`, correlationId);
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    serverEventBus.processEvent({
      id: `EVT-ACC-OVERRIDE-${Date.now()}`,
      timestamp: timeStr,
      category: 'ACCESS',
      type: 'ACCESS_GRANTED',
      source: 'live',
      zoneId: door.zone,
      deviceId: door.id,
      severity: 'info',
      payload: {
        doorId: door.id,
        cardholder: `EMERGENCY OVERRIDE: ${user.name}`,
        clearance: user.clearanceLevel,
      },
    });

    sendJson(res, 200, { success: true, message: `Emergency unlock issued by ${user.name}` }, correlationId);
    return;
  }

  // 9. INCIDENTS
  if (pathname === '/api/incidents' && method === 'GET') {
    if (!await requireAuthOrDevice(req, res, correlationId)) return;
    sendJson(res, 200, await db.getAllIncidents(), correlationId);
    return;
  }

  if (pathname === '/api/incidents' && method === 'POST') {
    const user = await serverAuth.authenticateRequest(req);
    if (!user) {
      sendError(res, 401, 'Authentication required', correlationId);
      return;
    }
    const authCheck = await serverAuth.authorize(user, 'ACKNOWLEDGE_INCIDENT', 'Create Incident');
    if (!authCheck.allowed) {
      sendError(res, 403, authCheck.reason || 'Forbidden', correlationId);
      return;
    }
    try {
      const body = await parseBody(req, correlationId);
      const incident: CampusIncident = {
        id: body.id || `INC-${Date.now()}`,
        event: body.event || 'Security Incident',
        location: body.location || 'Campus Wide',
        zone: body.zone || 'General',
        severity: body.severity || 'warning',
        source: 'live',
        status: 'open',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        description: body.description || '',
        auditTimeline: [
          { time: new Date().toISOString(), action: 'Incident reported via API', actor: user.name }
        ],
      };
      await db.createIncident(incident);
      serverEventBus.processEvent({
        id: `EVT-INC-CREATE-${Date.now()}`,
        timestamp: incident.timestamp,
        category: 'INCIDENT',
        type: 'INCIDENT_DETECTED',
        source: 'live',
        zoneId: incident.zone,
        severity: incident.severity,
        payload: {
          incidentId: incident.id,
          title: incident.event,
          zone: incident.zone,
          severity: incident.severity,
          details: incident.description,
        },
      });
      sendJson(res, 201, { success: true, incident }, correlationId);
    } catch (err: any) {
      sendError(res, 400, err.message, correlationId);
    }
    return;
  }

  const incidentAckMatch = pathname.match(/^\/api\/incidents\/([^/]+)\/acknowledge$/);
  if (incidentAckMatch && method === 'POST') {
    const incidentId = decodeURIComponent(incidentAckMatch[1]);
    const user = await serverAuth.authenticateRequest(req);
    if (!user) {
      sendError(res, 401, 'Authentication required', correlationId);
      return;
    }

    const authCheck = await serverAuth.authorize(user, 'ACKNOWLEDGE_INCIDENT', `Incident ${incidentId}`);
    if (!authCheck.allowed) {
      sendError(res, 403, authCheck.reason || 'Forbidden', correlationId);
      return;
    }

    const event: IncidentAcknowledgedEvent = {
      id: `EVT-INC-ACK-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      category: 'INCIDENT',
      type: 'INCIDENT_ACKNOWLEDGED',
      source: 'system',
      severity: 'info',
      payload: {
        incidentId,
        actor: user.name,
      },
    };

    serverEventBus.processEvent(event);
    sendJson(res, 200, { success: true, incidentId, status: 'acknowledged' }, correlationId);
    return;
  }

  const incidentInvestigateMatch = pathname.match(/^\/api\/incidents\/([^/]+)\/investigate$/);
  if (incidentInvestigateMatch && method === 'POST') {
    const incidentId = decodeURIComponent(incidentInvestigateMatch[1]);
    const user = await serverAuth.authenticateRequest(req);
    if (!user) {
      sendError(res, 401, 'Authentication required', correlationId);
      return;
    }

    const authCheck = await serverAuth.authorize(user, 'INVESTIGATE_INCIDENT', `Incident ${incidentId}`);
    if (!authCheck.allowed) {
      sendError(res, 403, authCheck.reason || 'Forbidden', correlationId);
      return;
    }

    const event: IncidentInvestigatingEvent = {
      id: `EVT-INC-INV-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      category: 'INCIDENT',
      type: 'INCIDENT_INVESTIGATING',
      source: 'system',
      severity: 'info',
      payload: {
        incidentId,
        actor: user.name,
      },
    };

    serverEventBus.processEvent(event);
    sendJson(res, 200, { success: true, incidentId, status: 'investigating', assignedOfficer: user.name }, correlationId);
    return;
  }

  const incidentResolveMatch = pathname.match(/^\/api\/incidents\/([^/]+)\/resolve$/);
  if (incidentResolveMatch && method === 'POST') {
    const incidentId = decodeURIComponent(incidentResolveMatch[1]);
    const user = await serverAuth.authenticateRequest(req);
    if (!user) {
      sendError(res, 401, 'Authentication required', correlationId);
      return;
    }

    const authCheck = await serverAuth.authorize(user, 'RESOLVE_INCIDENT', `Incident ${incidentId}`);
    if (!authCheck.allowed) {
      sendError(res, 403, authCheck.reason || 'Forbidden', correlationId);
      return;
    }

    let notes = 'Manual resolution signed off by responder';
    try {
      const body = await parseBody(req, correlationId);
      if (body.notes) notes = body.notes;
    } catch {}

    const event: IncidentResolvedEvent = {
      id: `EVT-INC-RES-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      category: 'INCIDENT',
      type: 'INCIDENT_RESOLVED',
      source: 'system',
      severity: 'info',
      payload: {
        incidentId,
        actor: user.name,
        resolutionNotes: notes,
      },
    };

    serverEventBus.processEvent(event);
    sendJson(res, 200, { success: true, incidentId, status: 'resolved' }, correlationId);
    return;
  }

  // 10. AUDIT TRAIL QUERY & FILTER
  if (pathname === '/api/audit' && method === 'GET') {
    const user = await serverAuth.authenticateRequest(req);
    if (!user) {
      sendError(res, 401, 'Authentication required', correlationId);
      return;
    }

    const authCheck = await serverAuth.authorize(user, 'VIEW_AUDIT', 'Audit Log');
    if (!authCheck.allowed) {
      sendError(res, 403, authCheck.reason || 'Forbidden', correlationId);
      return;
    }

    const limit = Number(parsedUrl.searchParams.get('limit') || 100);
    const role = parsedUrl.searchParams.get('role') as any;
    const records = await db.getAuditRecords(limit, role);

    sendJson(res, 200, {
      total: records.length,
      records,
    }, correlationId);
    return;
  }

  // Endpoint not found
  sendError(res, 404, `Endpoint ${method} ${pathname} not found on Smart Campus API`, correlationId);
}

export default handleApiRequest;
