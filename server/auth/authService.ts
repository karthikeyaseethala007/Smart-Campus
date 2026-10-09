import crypto from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { db, type DbUser, type DbSession } from '../db/database';
import { Logger } from '../utils/logger';
import { config } from '../config';
import { serverEventBus } from '../events/serverEventBus';
import type { UserRole } from '../../src/types';
import type { CampusPermission } from '../../src/services/authService';

export interface AuthSessionPayload {
  sessionToken: string;
  user: Omit<DbUser, 'passwordHash'>;
  expiresAt: string;
}

const ROLE_PERMISSIONS: Record<UserRole, Set<CampusPermission>> = {
  admin: new Set([
    'VIEW_CAMERA',
    'CONTROL_CAMERA',
    'VIEW_SENSOR',
    'ACKNOWLEDGE_INCIDENT',
    'INVESTIGATE_INCIDENT',
    'RESOLVE_INCIDENT',
    'LOCKDOWN_ZONE',
    'ACCESS_OVERRIDE',
    'VIEW_AUDIT',
    'MANAGE_USERS',
    'MANAGE_DEVICES',
    'RUN_SIMULATION',
  ]),
  security_officer: new Set([
    'VIEW_CAMERA',
    'CONTROL_CAMERA',
    'VIEW_SENSOR',
    'ACKNOWLEDGE_INCIDENT',
    'INVESTIGATE_INCIDENT',
    'RESOLVE_INCIDENT',
    'LOCKDOWN_ZONE',
    'ACCESS_OVERRIDE',
    'VIEW_AUDIT',
    'RUN_SIMULATION',
  ]),
  faculty: new Set([
    'VIEW_CAMERA',
    'VIEW_SENSOR',
  ]),
  student: new Set([
    'VIEW_CAMERA',
    'VIEW_SENSOR',
  ]),
};

// Brute-force protection tracking
interface LoginFailureTracker {
  count: number;
  lockedUntil?: number;
  lastAttemptAt: number;
  sourceIp: string;
}
const loginFailures: Map<string, LoginFailureTracker> = new Map();

export class ServerAuthService {
  private static instance: ServerAuthService;

  private constructor() {}

  public static getInstance(): ServerAuthService {
    if (!ServerAuthService.instance) {
      ServerAuthService.instance = new ServerAuthService();
    }
    return ServerAuthService.instance;
  }

  public hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  public verifyPassword(password: string, storedHash: string): boolean {
    if (!password || typeof password !== 'string' || password.length === 0) {
      return false;
    }
    if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
      return false;
    }
    const parts = storedHash.split(':');
    if (parts.length !== 2) {
      return false;
    }
    const [salt, key] = parts;
    if (!salt || !key || salt.length !== 32 || key.length !== 128) {
      return false;
    }
    try {
      const derived = crypto.scryptSync(password, salt, 64);
      const keyBuf = Buffer.from(key, 'hex');
      if (keyBuf.length !== derived.length) {
        return false;
      }
      return crypto.timingSafeEqual(keyBuf, derived);
    } catch {
      return false;
    }
  }

  /**
   * Authenticates a user with brute-force prevention and session issuance.
   */
  public async login(
    username: string,
    password?: string,
    ip = '127.0.0.1'
  ): Promise<{
    success: boolean;
    session?: AuthSessionPayload;
    error?: string;
    lockedOut?: boolean;
    retryAfterSeconds?: number;
    lockedUntil?: string;
    attempts?: number;
  }> {
    const userKey = username.toLowerCase().trim();
    const now = Date.now();
    const tracker = loginFailures.get(userKey);

    if (tracker && tracker.lockedUntil && tracker.lockedUntil > now) {
      const waitSec = Math.ceil((tracker.lockedUntil - now) / 1000);
      Logger.warn('AUTH', `Security lockout active for ${username}`, {
        userId: username,
        errorClassification: 'SECURITY_LOCKOUT_ACTIVE',
      });
      // Audit record for blocked attempt during active lockout (Phase 8)
      await db.addAuditRecord({
        id: `AUD-BLK-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        actor: username,
        role: (await db.getUserByUsername(username))?.role || 'student',
        action: 'AUTH_LOCKOUT_BLOCKED_ATTEMPT',
        target: 'Login Endpoint',
        result: 'LOCKED',
        details: `Login attempt blocked: account is locked out until ${new Date(tracker.lockedUntil).toISOString()}. Source: ${ip}`,
        zone: 'Security Gateway',
      });
      return {
        success: false,
        lockedOut: true,
        retryAfterSeconds: waitSec,
        lockedUntil: new Date(tracker.lockedUntil).toISOString(),
        attempts: tracker.count,
        error: 'SECURITY LOCKOUT ACTIVE: Too many failed authentication attempts. Authentication is temporarily locked. Please wait until the lockout expires or use verified account recovery.',
      };
    }

    const user = await db.getUserByUsername(username);

    if (!user) {
      const failRes = await this.recordFailedAttempt(userKey, username, ip, 'User not found');
      if (failRes.lockedOut) {
        return {
          success: false,
          lockedOut: true,
          retryAfterSeconds: failRes.retryAfterSeconds,
          lockedUntil: failRes.lockedUntil,
          attempts: failRes.attempts,
          error: 'SECURITY LOCKOUT ACTIVE: Too many failed authentication attempts. Authentication is temporarily locked. Please wait until the lockout expires or use verified account recovery.',
        };
      }
      return { success: false, error: 'Invalid credentials', attempts: failRes.attempts };
    }

    // Fail-closed password verification: missing or empty password MUST fail
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      const failRes = await this.recordFailedAttempt(userKey, username, ip, 'Missing or empty password');
      if (failRes.lockedOut) {
        return {
          success: false,
          lockedOut: true,
          retryAfterSeconds: failRes.retryAfterSeconds,
          lockedUntil: failRes.lockedUntil,
          attempts: failRes.attempts,
          error: 'SECURITY LOCKOUT ACTIVE: Too many failed authentication attempts. Authentication is temporarily locked. Please wait until the lockout expires or use verified account recovery.',
        };
      }
      return { success: false, error: 'Invalid credentials', attempts: failRes.attempts };
    }

    if (!this.verifyPassword(password, user.passwordHash)) {
      const failRes = await this.recordFailedAttempt(userKey, username, ip, 'Invalid password');
      if (failRes.lockedOut) {
        return {
          success: false,
          lockedOut: true,
          retryAfterSeconds: failRes.retryAfterSeconds,
          lockedUntil: failRes.lockedUntil,
          attempts: failRes.attempts,
          error: 'SECURITY LOCKOUT ACTIVE: Too many failed authentication attempts. Authentication is temporarily locked. Please wait until the lockout expires or use verified account recovery.',
        };
      }
      return { success: false, error: 'Invalid credentials', attempts: failRes.attempts };
    }

    // Reset failed attempts on success
    this.clearLockout(username);

    const sessionPayload = await this.createSessionForUser(user, 'PASSWORD');

    return {
      success: true,
      session: sessionPayload,
    };
  }

  public async createSessionForUser(
    user: DbUser,
    method: 'PASSWORD' | 'GOOGLE' = 'PASSWORD'
  ): Promise<AuthSessionPayload> {
    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + config.sessionLifetimeHours * 60 * 60 * 1000).toISOString();

    const session: DbSession = {
      id: token,
      userId: user.id,
      role: user.role,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    await db.createSession(session);

    // Record login audit (Phase 8: AUTH_SUCCESS)
    const auditTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    await db.addAuditRecord({
      id: `AUD-AUTH-${Date.now().toString().slice(-4)}`,
      timestamp: auditTimeStr,
      actor: user.name,
      role: user.role,
      action: 'AUTH_SUCCESS',
      target: 'Command Center API',
      result: 'SUCCESS',
      details: `Session established via ${method} (valid for ${config.sessionLifetimeHours}h)`,
      zone: 'Operations Console',
    });
    await db.addAuditRecord({
      id: `AUD-LOGIN-${Date.now().toString().slice(-4)}`,
      timestamp: auditTimeStr,
      actor: user.name,
      role: user.role,
      action: method === 'GOOGLE' ? 'GOOGLE_OAUTH_LOGIN' : 'USER_LOGIN',
      target: 'Command Center API',
      result: 'SUCCESS',
      details: `Session established via ${method} (valid for ${config.sessionLifetimeHours}h)`,
      zone: 'Operations Console',
    });

    Logger.info('AUTH', `Session established via ${method}: ${user.username}`, {
      userId: user.id,
      zoneId: 'Operations Console',
    });

    const { passwordHash: _, ...safeUser } = user;
    return {
      sessionToken: token,
      user: safeUser,
      expiresAt,
    };
  }

  private async recordFailedAttempt(
    userKey: string,
    username: string,
    ip: string,
    reason: string
  ): Promise<{ lockedOut: boolean; retryAfterSeconds?: number; lockedUntil?: string; attempts: number }> {
    const tracker = loginFailures.get(userKey) || { count: 0, lastAttemptAt: Date.now(), sourceIp: ip };
    tracker.count++;
    tracker.lastAttemptAt = Date.now();
    tracker.sourceIp = ip;

    const user = await db.getUserByUsername(username);
    const userRole = user?.role || 'student';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (tracker.count >= config.authMaxFailedAttempts) {
      tracker.lockedUntil = Date.now() + config.authLockoutMinutes * 60 * 1000;
      loginFailures.set(userKey, tracker);

      if (user) {
        user.failedLoginAttempts = tracker.count;
        user.lockedUntil = new Date(tracker.lockedUntil).toISOString();
        await db.updateUser(user);
      }

      const auditId = `AUD-LOCK-${Date.now().toString().slice(-4)}`;
      // 1. Audit Records (Phase 8: AUTH_LOCKOUT_TRIGGERED and SECURITY_LOCKOUT)
      await db.addAuditRecord({
        id: auditId,
        timestamp: timeStr,
        actor: username,
        role: userRole,
        action: 'AUTH_LOCKOUT_TRIGGERED',
        target: 'Login Endpoint',
        result: 'ESCALATED',
        details: `Account locked after ${tracker.count} consecutive failed attempts (${reason}). Source: ${ip}`,
        zone: 'Security Gateway',
      });
      await db.addAuditRecord({
        id: `AUD-SECLOCK-${Date.now().toString().slice(-4)}`,
        timestamp: timeStr,
        actor: username,
        role: userRole,
        action: 'SECURITY_LOCKOUT',
        target: 'Login Endpoint',
        result: 'ESCALATED',
        details: `Account locked after ${tracker.count} consecutive failed attempts (${reason}). Source: ${ip}`,
        zone: 'Security Gateway',
      });

      // 2. Notification Center Activity Event
      await db.addActivityEvent({
        id: `ACT-LOCK-${Date.now().toString().slice(-4)}`,
        type: 'security',
        event: `SECURITY LOCKOUT: Account authentication locked for ${username} after ${tracker.count} failed attempts. Source: ${ip}`,
        time: timeStr,
        location: 'Security Gateway',
        severity: 'critical',
        source: 'live',
      });

      // 3. Broadcast Realtime Security Lockout Event with complete audit metadata (Phase 8)
      const eventId = `EVT-LOCK-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      serverEventBus.processEvent({
        id: eventId,
        type: 'SECURITY_LOCKOUT',
        category: 'SYSTEM',
        source: 'system',
        timestamp: timeStr,
        payload: {
          accountId: username,
          username,
          role: userRole,
          timestamp: timeStr,
          source: 'Security Gateway',
          context: 'Authentication Lockout',
          thresholdReached: tracker.count,
          lockoutDurationMinutes: config.authLockoutMinutes,
          ip,
          severity: 'critical',
          auditId,
          count: tracker.count,
          lockedUntil: new Date(tracker.lockedUntil).toISOString(),
          details: `Account authentication locked after ${tracker.count} consecutive failed attempts. Source: ${ip}`,
        },
      });

      const waitSec = Math.ceil((tracker.lockedUntil - Date.now()) / 1000);
      return {
        lockedOut: true,
        retryAfterSeconds: waitSec,
        lockedUntil: new Date(tracker.lockedUntil).toISOString(),
        attempts: tracker.count,
      };
    } else {
      loginFailures.set(userKey, tracker);

      if (user) {
        user.failedLoginAttempts = tracker.count;
        await db.updateUser(user);
      }

      // Phase 8: AUTH_FAILED and LOGIN_FAILURE audit records
      await db.addAuditRecord({
        id: `AUD-FAIL-${Date.now().toString().slice(-4)}`,
        timestamp: timeStr,
        actor: username,
        role: userRole,
        action: 'AUTH_FAILED',
        target: 'Login Endpoint',
        result: 'DENIED',
        details: `${reason} (Attempt ${tracker.count} of ${config.authMaxFailedAttempts}). Source: ${ip}`,
        zone: 'Security Gateway',
      });
      await db.addAuditRecord({
        id: `AUD-LFAIL-${Date.now().toString().slice(-4)}`,
        timestamp: timeStr,
        actor: username,
        role: userRole,
        action: 'LOGIN_FAILURE',
        target: 'Login Endpoint',
        result: 'DENIED',
        details: `${reason} (Attempt ${tracker.count} of ${config.authMaxFailedAttempts})`,
        zone: 'Security Gateway',
      });

      return {
        lockedOut: false,
        attempts: tracker.count,
      };
    }
  }

  public async clearLockout(username: string): Promise<void> {
    const userKey = username.toLowerCase().trim();
    loginFailures.delete(userKey);
    const user = await db.getUserByUsername(userKey);
    if (user) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      await db.updateUser(user);
    }
  }

  public getLockoutStatus(username: string): {
    locked: boolean;
    remainingSeconds: number;
    lockedUntil: string | null;
    attempts: number;
  } {
    if (!username || typeof username !== 'string') {
      return { locked: false, lockedOut: false, remainingSeconds: 0, retryAfterSeconds: 0, lockedUntil: null, attempts: 0 };
    }
    const userKey = username.toLowerCase().trim();
    const tracker = loginFailures.get(userKey);
    if (!tracker) {
      return { locked: false, lockedOut: false, remainingSeconds: 0, retryAfterSeconds: 0, lockedUntil: null, attempts: 0 };
    }
    const now = Date.now();
    if (tracker.lockedUntil && tracker.lockedUntil > now) {
      const waitSec = Math.ceil((tracker.lockedUntil - now) / 1000);
      return {
        locked: true,
        lockedOut: true,
        remainingSeconds: waitSec,
        retryAfterSeconds: waitSec,
        lockedUntil: new Date(tracker.lockedUntil).toISOString(),
        attempts: tracker.count,
      };
    }
    return {
      locked: false,
      lockedOut: false,
      remainingSeconds: 0,
      retryAfterSeconds: 0,
      lockedUntil: null,
      attempts: 0,
    };
  }

  public async logout(sessionToken: string): Promise<boolean> {
    const session = await db.getSession(sessionToken);
    if (!session) return false;

    await db.revokeSession(sessionToken);
    const user = await db.getUserById(session.userId);

    if (user) {
      await db.addAuditRecord({
        id: `AUD-AUTH-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        actor: user.name,
        role: user.role,
        action: 'USER_LOGOUT',
        target: 'Command Center API',
        result: 'SUCCESS',
        details: 'Session revoked and closed',
        zone: 'Operations Console',
      });
      Logger.info('AUTH', `User logged out: ${user.username}`, { userId: user.id });
    }

    return true;
  }

  public async authenticateRequest(req: IncomingMessage): Promise<DbUser | null> {
    let token = '';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      const customHeader = req.headers['x-session-token'];
      if (typeof customHeader === 'string') {
        token = customHeader.trim();
      }
    }

    if (!token) {
      return null;
    }

    const session = await db.getSession(token);
    if (!session || session.revokedAt) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await db.revokeSession(token);
      return null;
    }

    return (await db.getUserById(session.userId)) || null;
  }

  public async authorize(
    user: DbUser,
    permission: CampusPermission,
    resource = 'System Action'
  ): Promise<{ allowed: boolean; reason?: string }> {
    const rolePermissions = ROLE_PERMISSIONS[user.role];

    if (!rolePermissions || !rolePermissions.has(permission)) {
      const reason = `Forbidden: Role [${user.role.toUpperCase()}] lacks required clearance [${permission}] for ${resource}.`;

      await db.addAuditRecord({
        id: `AUD-DENY-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        actor: user.name,
        role: user.role,
        action: `${permission}_REJECTED`,
        target: resource,
        result: 'DENIED',
        details: reason,
        zone: 'Security Boundary',
      });

      Logger.warn('RBAC', `Clearance denied for ${user.username}: ${permission}`, {
        userId: user.id,
        errorClassification: 'INSUFFICIENT_CLEARANCE',
      });

      return { allowed: false, reason };
    }

    return { allowed: true };
  }
}

export const serverAuth = ServerAuthService.getInstance();
export default serverAuth;
