import { eventBus } from '../eventBus';
import { authService } from '../authService';
import type {
  AccessGrantedEvent,
  AccessDeniedEvent,
  AccessLockoutEvent,
  AccessOverrideEvent,
  EventSourceType
} from '../../types/events';

export interface PinValidationResult {
  success: boolean;
  status: 'GRANTED' | 'DENIED' | 'LOCKOUT';
  message: string;
  failedAttempts: number;
}

export class AccessWiegandAdapter {
  private static instance: AccessWiegandAdapter;
  private failedAttemptsMap: Map<string, number> = new Map();
  private lockoutTimers: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): AccessWiegandAdapter {
    if (!AccessWiegandAdapter.instance) {
      AccessWiegandAdapter.instance = new AccessWiegandAdapter();
    }
    return AccessWiegandAdapter.instance;
  }

  public getFailedAttempts(doorId: string): number {
    return this.failedAttemptsMap.get(doorId) || 0;
  }

  public isLockedOut(doorId: string): boolean {
    const until = this.lockoutTimers.get(doorId);
    if (!until) return false;
    if (Date.now() > until) {
      this.lockoutTimers.delete(doorId);
      this.failedAttemptsMap.set(doorId, 0);
      return false;
    }
    return true;
  }

  /**
   * Processes a keypad or Wiegand PIN entry.
   * Standard valid code: 4821
   * Simulated test invalid: 9999
   */
  public async processPinEntry(
    doorId: string,
    pin: string,
    source: EventSourceType = 'live'
  ): Promise<PinValidationResult> {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Check lockout first
    if (this.isLockedOut(doorId)) {
      const remainingSec = Math.ceil(((this.lockoutTimers.get(doorId) || 0) - Date.now()) / 1000);
      return {
        success: false,
        status: 'LOCKOUT',
        message: `Security Lockout Active: Door is disabled for ${remainingSec}s due to consecutive violations.`,
        failedAttempts: this.getFailedAttempts(doorId),
      };
    }

    const isValid = pin.trim() === '4821';

    if (isValid) {
      this.failedAttemptsMap.set(doorId, 0);

      const grantedEvent: AccessGrantedEvent = {
        id: `EVT-ACC-GRANT-${Date.now()}`,
        timestamp: timeStr,
        category: 'ACCESS',
        type: 'ACCESS_GRANTED',
        source,
        deviceId: doorId,
        severity: 'info',
        payload: {
          doorId,
          cardholder: 'Authorized Faculty / Staff Member',
          clearance: 'LEVEL_2_FACULTY',
        },
      };

      eventBus.dispatch(grantedEvent);

      return {
        success: true,
        status: 'GRANTED',
        message: 'Credentials Authenticated: Electronic Solenoid Unlatched (08s pulse)',
        failedAttempts: 0,
      };
    } else {
      const prevFailures = this.failedAttemptsMap.get(doorId) || 0;
      const currentFailures = prevFailures + 1;
      this.failedAttemptsMap.set(doorId, currentFailures);

      if (currentFailures >= 3) {
        // Trigger 60s lockout
        const lockoutDuration = 60;
        this.lockoutTimers.set(doorId, Date.now() + lockoutDuration * 1000);

        const lockoutEvent: AccessLockoutEvent = {
          id: `EVT-ACC-LOCKOUT-${Date.now()}`,
          timestamp: timeStr,
          category: 'ACCESS',
          type: 'ACCESS_LOCKOUT',
          source,
          deviceId: doorId,
          severity: 'critical',
          payload: {
            doorId,
            consecutiveFailures: currentFailures,
            durationSeconds: lockoutDuration,
          },
        };

        eventBus.dispatch(lockoutEvent);

        return {
          success: false,
          status: 'LOCKOUT',
          message: `TAMPER LOCKOUT ENGAGED: 3 consecutive failed attempts on ${doorId}. Security alerted.`,
          failedAttempts: currentFailures,
        };
      }

      const deniedEvent: AccessDeniedEvent = {
        id: `EVT-ACC-DENY-${Date.now()}`,
        timestamp: timeStr,
        category: 'ACCESS',
        type: 'ACCESS_DENIED',
        source,
        deviceId: doorId,
        severity: 'warning',
        payload: {
          doorId,
          reason: 'Invalid PIN credentials provided',
          failedAttempts: currentFailures,
        },
      };

      eventBus.dispatch(deniedEvent);

      return {
        success: false,
        status: 'DENIED',
        message: `Security Denied: Invalid PIN sequence (${currentFailures}/3 attempts before lockout)`,
        failedAttempts: currentFailures,
      };
    }
  }

  /**
   * Emergency solenoid override request.
   * Enforces server/service RBAC boundary.
   */
  public executeSolenoidOverride(
    doorId: string,
    state: 'locked' | 'unlocked',
    reason = 'Manual Override'
  ): { success: boolean; message: string } {
    const authCheck = authService.checkPermission('ACCESS_OVERRIDE');
    if (!authCheck.allowed) {
      return {
        success: false,
        message: authCheck.reason || 'Unauthorized: Insufficient clearance for emergency door override.',
      };
    }

    const currentUser = authService.getCurrentUser();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Reset lockout if forced unlock
    if (state === 'unlocked') {
      this.lockoutTimers.delete(doorId);
      this.failedAttemptsMap.set(doorId, 0);
    }

    const overrideEvent: AccessOverrideEvent = {
      id: `EVT-ACC-OVR-${Date.now()}`,
      timestamp: timeStr,
      category: 'ACCESS',
      type: 'ACCESS_OVERRIDE',
      source: 'live',
      deviceId: doorId,
      severity: 'warning',
      payload: {
        doorId,
        actor: currentUser.name,
        reason,
        state,
      },
    };

    eventBus.dispatch(overrideEvent);

    return {
      success: true,
      message: `Emergency Solenoid Override Executed: ${doorId} is now ${state.toUpperCase()}`,
    };
  }
}

export const accessWiegandAdapter = AccessWiegandAdapter.getInstance();
export default accessWiegandAdapter;
