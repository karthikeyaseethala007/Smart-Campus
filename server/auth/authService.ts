import crypto from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { db, type DbUser, type DbSession } from '../db/database';
import { Logger } from '../utils/logger';
import { config } from '../config';
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
  ): Promise<{ success: boolean; session?: AuthSessionPayload; error?: string; lockedOut?: boolean }> {
    const rateKey = `${username.toLowerCase()}_${ip}`;
    const now = Date.now();
    const tracker = loginFailures.get(rateKey);

    if (tracker && tracker.lockedUntil && tracker.lockedUntil > now) {
      const waitSec = Math.ceil((tracker.lockedUntil - now) / 1000);
      Logger.warn('AUTH', `Brute-force lockout active for ${username}`, {
        userId: username,
        errorClassification: 'BRUTE_FORCE_LOCKOUT',
      });
      return {
        success: false,
        lockedOut: true,
        error: `Account temporarily locked due to excessive failed attempts. Try again in ${waitSec}s.`,
      };
    }

    const user = await db.getUserByUsername(username);

    if (!user) {
      this.recordFailedAttempt(rateKey, username, ip, 'User not found');
      return { success: false, error: 'Invalid credentials' };
    }

    // Fail-closed password verification: missing or empty password MUST fail
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      this.recordFailedAttempt(rateKey, username, ip, 'Missing or empty password');
      return { success: false, error: 'Invalid credentials' };
    }

    if (!this.verifyPassword(password, user.passwordHash)) {
      this.recordFailedAttempt(rateKey, username, ip, 'Invalid password');
      return { success: false, error: 'Invalid credentials' };
    }

    // Reset failed attempts on success
    loginFailures.delete(rateKey);

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

    // Record login audit
    await db.addAuditRecord({
      id: `AUD-AUTH-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actor: user.name,
      role: user.role,
      action: 'USER_LOGIN',
      target: 'Command Center API',
      result: 'SUCCESS',
      details: `Session established (valid for ${config.sessionLifetimeHours}h)`,
      zone: 'Operations Console',
    });

    Logger.info('AUTH', `User logged in: ${user.username}`, { userId: user.id, zoneId: 'Operations Console' });

    const { passwordHash: _, ...safeUser } = user;
    return {
      success: true,
      session: {
        sessionToken: token,
        user: safeUser,
        expiresAt,
      },
    };
  }

  private recordFailedAttempt(rateKey: string, username: string, _ip: string, reason: string): void {
    const tracker = loginFailures.get(rateKey) || { count: 0 };
    tracker.count++;

    if (tracker.count >= 5) {
      tracker.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 mins
      db.addAuditRecord({
        id: `AUD-LOCK-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        actor: username,
        role: 'student',
        action: 'AUTHENTICATION_LOCKOUT',
        target: 'Login Endpoint',
        result: 'ESCALATED',
        details: `Brute-force protection engaged after 5 failed attempts (${reason})`,
        zone: 'Security Gateway',
      });
    } else {
      db.addAuditRecord({
        id: `AUD-FAIL-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        actor: username,
        role: 'student',
        action: 'LOGIN_FAILURE',
        target: 'Login Endpoint',
        result: 'DENIED',
        details: reason,
        zone: 'Security Gateway',
      });
    }

    loginFailures.set(rateKey, tracker);
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
