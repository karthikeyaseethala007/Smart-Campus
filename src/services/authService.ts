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

const ROLE_USER_NAMES: Record<UserRole, { name: string; badge: string }> = {
  admin: { name: 'K. S. Ramanujan (Chief Administrator)', badge: 'BADGE-ADM-001' },
  security_officer: { name: 'Officer D. Vance (Tactical Watch)', badge: 'BADGE-SEC-412' },
  faculty: { name: 'Dr. Eleanor Rigby (Physics Dept)', badge: 'BADGE-FAC-889' },
  student: { name: 'A. Chen (Engineering Undergraduate)', badge: 'BADGE-STU-992' },
};

export class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser;

  private constructor() {
    const savedRole = persistenceService.loadUserRole() || 'admin';
    this.currentUser = this.createSession(savedRole);
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private createSession(role: UserRole): AuthUser {
    const meta = ROLE_USER_NAMES[role];
    return {
      id: `usr-${role}-${Date.now().toString(36)}`,
      name: meta.name,
      badgeNumber: meta.badge,
      role,
      clearanceLevel: ROLE_CLEARANCES[role],
      sessionStartedAt: new Date().toISOString(),
    };
  }

  public getCurrentUser(): AuthUser {
    return { ...this.currentUser };
  }

  public setUserRole(newRole: UserRole): AuthUser {
    const prevRole = this.currentUser.role;
    if (prevRole === newRole) return this.currentUser;

    this.currentUser = this.createSession(newRole);
    persistenceService.saveUserRole(newRole);

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
  public syncWithServerSession(serverUser: { id: string; name: string; role: UserRole; clearanceLevel?: AuthUser['clearanceLevel'] }): AuthUser {
    this.currentUser = {
      id: serverUser.id,
      name: serverUser.name,
      badgeNumber: ROLE_USER_NAMES[serverUser.role]?.badge || 'BADGE-UNKNOWN',
      role: serverUser.role,
      clearanceLevel: serverUser.clearanceLevel || ROLE_CLEARANCES[serverUser.role],
      sessionStartedAt: new Date().toISOString(),
    };
    persistenceService.saveUserRole(serverUser.role);
    return this.currentUser;
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
