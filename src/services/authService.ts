import type { UserRole } from '../types';
import type { UserRoleEvent } from '../types/events';
import { eventBus } from './eventBus';
import { persistenceService } from './persistenceService';

export type CampusPermission =
  | 'VIEW_CAMERA'
  | 'CONTROL_CAMERA'
  | 'VIEW_SENSOR'
  | 'ACKNOWLEDGE_INCIDENT'
  | 'INVESTIGATE_INCIDENT'
  | 'RESOLVE_INCIDENT'
  | 'LOCKDOWN_ZONE'
  | 'ACCESS_OVERRIDE'
  | 'VIEW_AUDIT'
  | 'MANAGE_USERS'
  | 'MANAGE_DEVICES'
  | 'RUN_SIMULATION';

export interface AuthUser {
  id: string;
  name: string;
  badgeNumber: string;
  role: UserRole;
  clearanceLevel: 'LEVEL_4_CHIEF' | 'LEVEL_3_SECURITY' | 'LEVEL_2_FACULTY' | 'LEVEL_1_STUDENT';
  sessionStartedAt: string;
  username?: string;
  email?: string;
  department?: string;
}

export function getHumanReadableRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'security_officer':
      return 'Security Officer';
    case 'faculty':
      return 'Faculty Member';
    case 'student':
      return 'Student';
    default:
      return role;
  }
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: string;
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

const ROLE_CLEARANCES: Record<UserRole, AuthUser['clearanceLevel']> = {
  admin: 'LEVEL_4_CHIEF',
  security_officer: 'LEVEL_3_SECURITY',
  faculty: 'LEVEL_2_FACULTY',
  student: 'LEVEL_1_STUDENT',
};

export const CANONICAL_ACCOUNTS: Record<UserRole, {
  name: string;
  badge: string;
  username: string;
  email: string;
  clearanceLevel: AuthUser['clearanceLevel'];
  department: string;
}> = {
  admin: {
    name: 'Chief Administrator Ramanujan',
    badge: 'BADGE-ADM-001',
    username: 'admin',
    email: 'admin@campus.defense.internal',
    clearanceLevel: 'LEVEL_4_CHIEF',
    department: 'Campus Central Command',
  },
  security_officer: {
    name: 'Officer D. Vance (Tactical Watch)',
    badge: 'BADGE-SEC-412',
    username: 'security',
    email: 'security.vance@campus.defense.internal',
    clearanceLevel: 'LEVEL_3_SECURITY',
    department: 'Campus Security Patrol',
  },
  faculty: {
    name: 'Dr. Eleanor Rigby (Physics Dept)',
    badge: 'BADGE-FAC-889',
    username: 'faculty',
    email: 'rigby.eleanor@campus.internal',
    clearanceLevel: 'LEVEL_2_FACULTY',
    department: 'Science & Physics Faculty',
  },
  student: {
    name: 'A. Chen (Engineering Undergraduate)',
    badge: 'BADGE-STU-992',
    username: 'student',
    email: 'chen.a@student.campus.internal',
    clearanceLevel: 'LEVEL_1_STUDENT',
    department: 'Undergraduate Engineering',
  },
};

let customApiBaseUrl: string | null = null;

export function setApiBaseUrl(url: string | null): void {
  customApiBaseUrl = url;
}

export function getApiBaseUrl(): string {
  if (customApiBaseUrl) {
    return customApiBaseUrl.replace(/\/+$/, '');
  }
  const envApi = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : undefined;
  if (envApi && typeof envApi === 'string' && envApi.trim()) {
    return envApi.trim().replace(/\/+$/, '');
  }
  const envBackend = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_BACKEND_URL : undefined;
  if (envBackend && typeof envBackend === 'string' && envBackend.trim()) {
    const clean = envBackend.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return '/api';
}

export function resolveApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/api/') || cleanPath === '/api') {
    if (base.endsWith('/api')) {
      const suffix = cleanPath.slice(4);
      return `${base}${suffix}`;
    }
    return `${base}${cleanPath}`;
  }
  return `${base}${cleanPath}`;
}

export interface ParsedApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  isJson: boolean;
}

export async function parseApiResponse<T = any>(response: Response): Promise<ParsedApiResponse<T>> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (isJson) {
    try {
      const data = await response.json();
      return {
        ok: response.ok,
        status: response.status,
        data,
        error: data?.error,
        isJson: true,
      };
    } catch {
      return {
        ok: false,
        status: response.status,
        data: null,
        error: 'Malformed JSON payload returned by Security Gateway.',
        isJson: false,
      };
    }
  }

  // Non-JSON response (e.g. text/html, text/plain 404/502/503 from reverse proxy or hosting provider)
  let descriptiveError = '';
  if (response.status === 404) {
    descriptiveError = 'Security Gateway endpoint not found (HTTP 404). Backend service may be unrouted or unavailable.';
  } else if (response.status === 502) {
    descriptiveError = 'Security Gateway bad gateway (HTTP 502). Backend service may be unreachable or restarting.';
  } else if (response.status === 503) {
    descriptiveError = 'Security Gateway unavailable (HTTP 503). Backend service may be waking up or suspended.';
  } else if (response.status === 504) {
    descriptiveError = 'Security Gateway timeout (HTTP 504). Backend service timed out responding.';
  } else {
    descriptiveError = `Unexpected server response (HTTP ${response.status} ${response.statusText || 'Error'}). Non-JSON content received.`;
  }

  return {
    ok: false,
    status: response.status,
    data: null,
    error: descriptiveError,
    isJson: false,
  };
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser;

  private constructor() {
    const hasToken = this.isAuthenticated();
    const cachedUser = persistenceService.loadSessionUser();
    if (hasToken && cachedUser) {
      this.currentUser = {
        ...cachedUser,
        role: cachedUser.role || 'student',
        clearanceLevel: cachedUser.clearanceLevel || ROLE_CLEARANCES[cachedUser.role as UserRole] || 'LEVEL_1_STUDENT',
      };
    } else {
      this.currentUser = {
        id: 'usr-unauthenticated',
        name: 'Unauthenticated User',
        username: undefined,
        email: undefined,
        badgeNumber: 'NONE',
        role: 'student',
        clearanceLevel: 'LEVEL_1_STUDENT',
        department: 'Unauthenticated Access',
        sessionStartedAt: new Date().toISOString(),
      };
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private createSession(role: UserRole): AuthUser {
    const meta = CANONICAL_ACCOUNTS[role] || CANONICAL_ACCOUNTS['admin'];
    return {
      id: `usr-${role}-${Date.now().toString(36)}`,
      name: meta.name,
      username: meta.username,
      email: meta.email,
      badgeNumber: meta.badge,
      role,
      clearanceLevel: ROLE_CLEARANCES[role],
      department: meta.department,
      sessionStartedAt: new Date().toISOString(),
    };
  }

  public getCurrentUser(): AuthUser {
    return { ...this.currentUser };
  }

  /**
   * Internal test/simulation only helper. Real role switching in production UI is forbidden (SEC-ROLE-01).
   * Does NOT alter authoritative server session, grants NO elevated backend permissions, and is isolated for tests.
   */
  public setUserRole(newRole: UserRole): AuthUser {
    const isProd = Boolean(import.meta.env?.PROD || (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV === 'production'));
    if (isProd) {
      console.warn('[AuthService] Client-side role mutation blocked in production environment.');
      return this.currentUser;
    }
    const prevRole = this.currentUser.role;
    if (prevRole === newRole) return this.currentUser;

    this.currentUser = this.createSession(newRole);
    persistenceService.saveUserRole(newRole);
    persistenceService.saveSessionUser(this.currentUser);

    // Emit event on bus
    eventBus.emit<UserRoleEvent>({
      category: 'USER',
      type: 'USER_ROLE_CHANGED',
      source: 'system',
      severity: 'info',
      payload: {
        previousRole: prevRole,
        newRole,
        actor: this.currentUser.name,
      },
    });

    return this.currentUser;
  }

  /**
   * Derives and synchronizes user session from authoritative server verification (SEC-LOW-02).
   * Overrides local storage presentation role with authoritative credentials returned by backend.
   */
  public syncWithServerSession(serverUser: {
    id: string;
    name: string;
    username?: string;
    role: UserRole;
    badgeNumber?: string;
    clearanceLevel?: string;
    department?: string;
    email?: string;
  }): AuthUser {
    const canonical = CANONICAL_ACCOUNTS[serverUser.role] || CANONICAL_ACCOUNTS['admin'];
    this.currentUser = {
      id: serverUser.id,
      name: serverUser.name || canonical.name,
      username: serverUser.username || canonical.username,
      email: serverUser.email || canonical.email,
      badgeNumber: serverUser.badgeNumber || canonical.badge,
      role: serverUser.role,
      clearanceLevel: (serverUser.clearanceLevel as AuthUser['clearanceLevel']) || canonical.clearanceLevel,
      department: serverUser.department || canonical.department,
      sessionStartedAt: this.currentUser?.sessionStartedAt || new Date().toISOString(),
    };
    persistenceService.saveSessionUser(this.currentUser);
    persistenceService.saveUserRole(serverUser.role);
    return { ...this.currentUser };
  }

  public getSessionToken(): string | null {
    return persistenceService.loadSessionToken();
  }

  public isAuthenticated(): boolean {
    const token = persistenceService.loadSessionToken();
    const expiry = persistenceService.loadSessionExpiry();
    if (!token) return false;
    if (expiry) {
      const expTime = new Date(expiry).getTime();
      if (!isNaN(expTime) && expTime <= Date.now()) {
        this.clearLocalSession();
        return false;
      }
    }
    return true;
  }

  /**
   * Validates current session against authoritative backend /api/auth/me endpoint.
   * If token is invalid, revoked, or expired, fails closed and purges client session.
   * Phase 3: Network errors must FAIL CLOSED — never silently grant access based on local storage cache!
   */
  public async validateServerSession(): Promise<{ authenticated: boolean; user?: AuthUser; gatewayUnavailable?: boolean }> {
    const token = this.getSessionToken();
    if (!token) {
      this.clearLocalSession();
      return { authenticated: false };
    }

    try {
      const response = await fetch(resolveApiUrl('/api/auth/me'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        this.clearLocalSession();
        return { authenticated: false };
      }

      const parsed = await parseApiResponse<{ user?: any }>(response);
      if (parsed.data && parsed.data.user) {
        const syncedUser = this.syncWithServerSession(parsed.data.user);
        return { authenticated: true, user: syncedUser };
      }

      this.clearLocalSession();
      return { authenticated: false };
    } catch {
      // Phase 3: Fail Closed! Gateway or network error must never treat client cache as authoritative.
      this.clearLocalSession();
      return { authenticated: false, gatewayUnavailable: true };
    }
  }

  /**
   * Authenticates against the backend /api/auth/login endpoint and establishes
   * an authoritative session token and synchronized RBAC profile.
   */
  public async login(
    username: string,
    password?: string
  ): Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
    lockedOut?: boolean;
    retryAfterSeconds?: number;
    lockedUntil?: string;
    attempts?: number;
  }> {
    try {
      const response = await fetch(resolveApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password || '',
        }),
      });

      const parsed = await parseApiResponse<{
        success: boolean;
        session?: {
          sessionToken: string;
          user: any;
          expiresAt: string;
        };
        error?: string;
        lockedOut?: boolean;
        retryAfterSeconds?: number;
        lockedUntil?: string;
        attempts?: number;
      }>(response);

      if (!parsed.ok || !parsed.data?.success) {
        const errorMsg = parsed.error || (response.status === 401 ? 'Invalid credentials' : 'Authentication failed');
        return {
          success: false,
          error: errorMsg,
          lockedOut: response.status === 423 || Boolean(parsed.data?.lockedOut),
          retryAfterSeconds: parsed.data?.retryAfterSeconds,
          lockedUntil: parsed.data?.lockedUntil,
          attempts: parsed.data?.attempts,
        };
      }

      const data = parsed.data;
      if (data.session && data.session.sessionToken && data.session.user) {
        persistenceService.saveSessionToken(data.session.sessionToken, data.session.expiresAt);
        const syncedUser = this.syncWithServerSession(data.session.user);
        return {
          success: true,
          user: syncedUser,
        };
      }

      return {
        success: false,
        error: 'Malformed session returned from server',
      };
    } catch (err: any) {
      console.warn('[AuthService] Login network error:', err);
      return {
        success: false,
        error: 'Security Gateway unreachable. Verify server connection.',
      };
    }
  }

  /**
   * Queries authoritative lockout status for a username (SEC-AUTH-LOCKOUT).
   */
  public async getLockoutStatus(username: string): Promise<{
    lockedOut: boolean;
    retryAfterSeconds?: number;
    lockedUntil?: string;
  }> {
    if (!username || !username.trim()) return { lockedOut: false };
    try {
      const response = await fetch(resolveApiUrl(`/api/auth/lockout-status?username=${encodeURIComponent(username.trim())}`));
      if (response.ok) {
        const parsed = await parseApiResponse<{ lockedOut?: boolean; retryAfterSeconds?: number; lockedUntil?: string }>(response);
        if (parsed.data) {
          return {
            lockedOut: Boolean(parsed.data.lockedOut),
            retryAfterSeconds: parsed.data.retryAfterSeconds,
            lockedUntil: parsed.data.lockedUntil,
          };
        }
      }
      return { lockedOut: false };
    } catch {
      return { lockedOut: false };
    }
  }

  /**
   * Initiates password recovery request for identifier.
   */
  public async requestPasswordRecovery(identifier: string): Promise<{
    success: boolean;
    hasGoogleLinked?: boolean;
    hasRecoveryCodes?: boolean;
    canRecover?: boolean;
    googleEmailMasked?: string;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(resolveApiUrl('/api/auth/recovery/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const parsed = await parseApiResponse<any>(response);
      return parsed.data || { success: false, error: parsed.error || 'Recovery request failed' };
    } catch {
      return { success: false, error: 'Network error contacting recovery gateway' };
    }
  }

  /**
   * Verifies one-time pre-enrolled recovery code.
   */
  public async verifyRecoveryCode(username: string, code: string): Promise<{
    success: boolean;
    recoveryToken?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(resolveApiUrl('/api/auth/recovery/verify-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), code: code.trim() }),
      });
      const parsed = await parseApiResponse<any>(response);
      return parsed.data || { success: false, error: parsed.error || 'Failed to verify recovery code' };
    } catch {
      return { success: false, error: 'Network error verifying recovery code' };
    }
  }

  /**
   * Completes password reset with validated one-time recovery token.
   */
  public async resetPassword(recoveryToken: string, newPassword: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(resolveApiUrl('/api/auth/recovery/reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryToken, newPassword }),
      });
      const parsed = await parseApiResponse<any>(response);
      return parsed.data || { success: false, error: parsed.error || 'Password reset failed' };
    } catch {
      return { success: false, error: 'Network error resetting password' };
    }
  }

  /**
   * Requests Google OAuth authorization URL from backend server.
   */
  public async getGoogleAuthUrl(): Promise<{ configured: boolean; authUrl?: string; error?: string }> {
    try {
      const response = await fetch(resolveApiUrl('/api/auth/google/url'));
      const parsed = await parseApiResponse<{ configured: boolean; authUrl?: string; error?: string }>(response);
      if (!response.ok || !parsed.data) {
        return {
          configured: false,
          error: parsed.error || (response.status === 404
            ? 'Google OAuth route not found on Security Gateway.'
            : 'Security Gateway rejected Google authorization request.'),
        };
      }
      return parsed.data;
    } catch {
      return {
        configured: false,
        error: 'Security Gateway unreachable. Verify server connection.',
      };
    }
  }

  /**
   * Completes Google session establishment with session token and validates authoritative user profile.
   */
  public async completeGoogleSession(
    sessionToken: string,
    expiresAt?: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    persistenceService.saveSessionToken(sessionToken, expiresAt);
    const result = await this.validateServerSession();
    if (result.authenticated && result.user) {
      return {
        success: true,
        user: result.user,
      };
    }
    return {
      success: false,
      error: 'Failed to establish verified session from Google authentication.',
    };
  }

  /**
   * Explicit session revocation across backend database and local storage.
   */
  public async logout(): Promise<void> {
    const token = persistenceService.loadSessionToken();
    if (token) {
      try {
        await fetch(resolveApiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch {}
    }
    this.clearLocalSession();
  }

  public clearLocalSession(): void {
    persistenceService.clearSessionToken();
    this.currentUser = {
      id: 'usr-unauthenticated',
      name: 'Unauthenticated User',
      username: undefined,
      email: undefined,
      badgeNumber: 'NONE',
      role: 'student',
      clearanceLevel: 'LEVEL_1_STUDENT',
      department: 'Unauthenticated Access',
      sessionStartedAt: new Date().toISOString(),
    };
  }

  /**
   * Client-side UI visibility check (SEC-LOW-02).
   * NOTE: Governs visual presentation only; all domain mutations and physical actions
   * require independent, authoritative verification by backend REST/WS security gateways.
   */
  public checkPermission(
    permission: CampusPermission,
    customRole?: UserRole
  ): PermissionCheckResult {
    const role = customRole || this.currentUser.role;
    const permissions = ROLE_PERMISSIONS[role];

    if (!permissions || !permissions.has(permission)) {
      const requiredRole =
        permission === 'MANAGE_USERS' || permission === 'MANAGE_DEVICES'
          ? 'Administrator'
          : 'Security Officer or Administrator';

      return {
        allowed: false,
        reason: `Access Denied: Current clearance (${this.currentUser.clearanceLevel}) lacks permission [${permission}].`,
        requiredRole,
      };
    }

    return { allowed: true };
  }

  public can(permission: CampusPermission): boolean {
    return this.checkPermission(permission).allowed;
  }
}

export const authService = AuthService.getInstance();
export default authService;
