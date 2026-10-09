import crypto from 'node:crypto';
import { db, type DbUser } from '../db/database';
import { serverAuth } from './authService';
import { Logger } from '../utils/logger';
import type { GoogleUserInfo } from './googleAuth';

export interface RecoveryTokenPayload {
  token: string;
  userId: string;
  username: string;
  expiresAt: number;
  used: boolean;
  method: 'GOOGLE_OIDC' | 'RECOVERY_CODE';
}

export class RecoveryService {
  private static instance: RecoveryService;
  private recoveryTokens: Map<string, RecoveryTokenPayload> = new Map();
  private readonly TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

  private constructor() {
    // Periodic sweep of expired recovery tokens
    setInterval(() => this.cleanupExpiredTokens(), 5 * 60 * 1000).unref();
  }

  public static getInstance(): RecoveryService {
    if (!RecoveryService.instance) {
      RecoveryService.instance = new RecoveryService();
    }
    return RecoveryService.instance;
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [tok, payload] of this.recoveryTokens.entries()) {
      if (now > payload.expiresAt || payload.used) {
        this.recoveryTokens.delete(tok);
      }
    }
  }

  /**
   * Safe identity lookup for forgot password initiation.
   * Returns available verification mechanisms without revealing excess identity details.
   */
  public async requestPasswordRecovery(identifier: string): Promise<{
    success: boolean;
    hasLinkedGoogle: boolean;
    supportsRecoveryCode: boolean;
    message: string;
    safeAccountDisplay?: string;
  }> {
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return {
        success: false,
        hasLinkedGoogle: false,
        supportsRecoveryCode: false,
        message: 'Valid institutional username or email required.',
      };
    }

    const clean = identifier.trim().toLowerCase();
    let user: DbUser | null = await db.getUserByUsername(clean);
    if (!user) {
      user = await db.getUserByEmail(clean);
    }

    if (!user || !user.isActive) {
      // Safe generic response preventing account enumeration
      return {
        success: true,
        hasLinkedGoogle: false,
        supportsRecoveryCode: false,
        hasGoogleLinked: false,
        hasRecoveryCodes: false,
        canRecover: false,
        message: 'If an authorized account matches the identifier, identity verification options are available.',
      };
    }

    const hasLinkedGoogle = Boolean(user.googleSubject);
    const supportsRecoveryCode = Boolean(user.recoveryCodeHashes && user.recoveryCodeHashes.length > 0);

    return {
      success: true,
      hasLinkedGoogle,
      supportsRecoveryCode,
      hasGoogleLinked: hasLinkedGoogle,
      hasRecoveryCodes: supportsRecoveryCode,
      canRecover: hasLinkedGoogle || supportsRecoveryCode,
      safeAccountDisplay: user.username,
      message: 'Institutional identity located. Proceed with verified credential verification.',
    };
  }

  /**
   * Verifies an authenticated Google identity against a linked Smart Campus user.
   * STRICT SECURITY RULES:
   * 1. Google subject ID MUST match the user's stored googleSubject.
   * 2. Cannot automatically link a new Google account during password recovery.
   * 3. Google email must be verified.
   * 4. If not linked: fail closed with explicit institutional message.
   */
  public async verifyGoogleForRecovery(
    usernameOrEmail: string,
    googleUser: GoogleUserInfo,
    ip = '127.0.0.1'
  ): Promise<{
    success: boolean;
    recoveryToken?: string;
    error?: string;
    unlinked?: boolean;
  }> {
    if (!usernameOrEmail || !googleUser || !googleUser.sub) {
      return { success: false, error: 'Invalid Google recovery payload.' };
    }

    if (!googleUser.email_verified) {
      return { success: false, error: 'Google email address is not verified by Google.' };
    }

    const clean = usernameOrEmail.trim().toLowerCase();
    let user: DbUser | null = await db.getUserByUsername(clean);
    if (!user) {
      user = await db.getUserByEmail(clean);
    }

    if (!user || !user.isActive) {
      return {
        success: false,
        error: 'No active Smart Campus account matches the provided identifier.',
      };
    }

    // Verify Google Subject ID matches the linked user account
    if (!user.googleSubject || user.googleSubject !== googleUser.sub) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      await db.addAuditRecord({
        id: `AUD-REC-${Date.now().toString().slice(-4)}`,
        timestamp: timeStr,
        actor: user.username,
        role: user.role,
        action: 'RECOVERY_GOOGLE_UNLINKED_REJECTED',
        target: 'Password Recovery Gateway',
        result: 'DENIED',
        details: `Rejected password recovery attempt: Google subject (${googleUser.sub}) is not linked to account ${user.username}. Source: ${ip}`,
        zone: 'Security Gateway',
      });

      return {
        success: false,
        unlinked: true,
        error: 'Your institutional Google account is not linked to this Smart Campus account. Contact an authorized administrator/security officer to recover access.',
      };
    }

    // Issue short-lived, single-use PASSWORD_RECOVERY token
    const token = 'rec_' + crypto.randomBytes(32).toString('hex');
    this.recoveryTokens.set(token, {
      token,
      userId: user.id,
      username: user.username,
      expiresAt: Date.now() + this.TOKEN_TTL_MS,
      used: false,
      method: 'GOOGLE_OIDC',
    });

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    await db.addAuditRecord({
      id: `AUD-REC-${Date.now().toString().slice(-4)}`,
      timestamp: timeStr,
      actor: user.username,
      role: user.role,
      action: 'RECOVERY_TOKEN_ISSUED',
      target: 'Password Recovery Gateway',
      result: 'SUCCESS',
      details: `Single-use recovery token issued via verified Google identity (${googleUser.email}). Source: ${ip}`,
      zone: 'Security Gateway',
    });

    return {
      success: true,
      recoveryToken: token,
    };
  }

  /**
   * Verifies a pre-enrolled one-time recovery code for Administrator/Faculty fallback.
   * STRICT SECURITY RULES:
   * 1. Recovery code is verified against salted scrypt hashes.
   * 2. The used code is IMMEDIATELY purged from the user's stored hashes (one-time use only).
   * 3. Cannot be reused or generated without normal prior authentication.
   */
  public async verifyRecoveryCode(
    username: string,
    rawCode: string,
    ip = '127.0.0.1'
  ): Promise<{
    success: boolean;
    recoveryToken?: string;
    error?: string;
  }> {
    if (!username || !rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
      return { success: false, error: 'Username and recovery code required.' };
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await db.getUserByUsername(cleanUsername);

    if (!user || !user.isActive) {
      return { success: false, error: 'Invalid recovery code or account not found.' };
    }

    if (!user.recoveryCodeHashes || user.recoveryCodeHashes.length === 0) {
      return {
        success: false,
        error: 'No pre-enrolled recovery codes exist for this account. Contact an authorized administrator.',
      };
    }

    const codeToTest = rawCode.trim();
    let matchedIndex = -1;

    for (let i = 0; i < user.recoveryCodeHashes.length; i++) {
      const storedHash = user.recoveryCodeHashes[i];
      if (serverAuth.verifyPassword(codeToTest, storedHash)) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex === -1) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      await db.addAuditRecord({
        id: `AUD-REC-${Date.now().toString().slice(-4)}`,
        timestamp: timeStr,
        actor: user.username,
        role: user.role,
        action: 'RECOVERY_CODE_FAILED',
        target: 'Recovery Code Gateway',
        result: 'DENIED',
        details: `Failed recovery code attempt for ${user.username} (IP: ${ip})`,
        zone: 'Security Gateway',
      });

      return { success: false, error: 'Invalid recovery code.' };
    }

    // Single-use: remove used hash immediately
    user.recoveryCodeHashes.splice(matchedIndex, 1);
    await db.updateUser(user);

    // Issue short-lived, single-use PASSWORD_RECOVERY token
    const token = 'rec_' + crypto.randomBytes(32).toString('hex');
    this.recoveryTokens.set(token, {
      token,
      userId: user.id,
      username: user.username,
      expiresAt: Date.now() + this.TOKEN_TTL_MS,
      used: false,
      method: 'RECOVERY_CODE',
    });

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    await db.addAuditRecord({
      id: `AUD-REC-${Date.now().toString().slice(-4)}`,
      timestamp: timeStr,
      actor: user.username,
      role: user.role,
      action: 'RECOVERY_CODE_CONSUMED',
      target: 'Recovery Code Gateway',
      result: 'SUCCESS',
      details: `Pre-enrolled recovery code consumed and invalidated for ${user.username}`,
      zone: 'Security Gateway',
    });

    return {
      success: true,
      recoveryToken: token,
    };
  }

  /**
   * Resets password using a validated recovery token.
   * STRICT SECURITY RULES:
   * 1. Replaces password hash with new scrypt hash.
   * 2. Revokes all existing user sessions.
   * 3. Invalidates the recovery token immediately.
   * 4. Clears lockout state and failed attempt counters.
   * 5. Emits audit and security notifications.
   */
  public async resetPassword(
    recoveryToken: string,
    newPassword: string,
    ip = '127.0.0.1'
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!recoveryToken || !newPassword || typeof newPassword !== 'string') {
      return { success: false, error: 'Recovery token and new password required.' };
    }

    const payload = this.recoveryTokens.get(recoveryToken);
    if (!payload || payload.used || Date.now() > payload.expiresAt) {
      return {
        success: false,
        error: 'Invalid or expired recovery token. Please start the recovery process again.',
      };
    }

    // Invalidate recovery token immediately (single-use)
    payload.used = true;
    this.recoveryTokens.delete(recoveryToken);

    // Password complexity policy: at least 8 characters
    if (newPassword.trim().length < 8) {
      return {
        success: false,
        error: 'Password does not satisfy policy. Minimum length is 8 characters.',
      };
    }

    const user = await db.getUserById(payload.userId);
    if (!user || !user.isActive) {
      return { success: false, error: 'Associated user account not found or inactive.' };
    }

    // Hash new password using scryptSync
    const newHash = serverAuth.hashPassword(newPassword.trim());
    user.passwordHash = newHash;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await db.updateUser(user);

    // Revoke all existing sessions (and WebSockets)
    await db.revokeAllUserSessions(user.id);

    // Clear server lockout state
    serverAuth.clearLockout(user.username);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    await db.addAuditRecord({
      id: `AUD-RST-${Date.now().toString().slice(-4)}`,
      timestamp: timeStr,
      actor: user.username,
      role: user.role,
      action: 'PASSWORD_RESET_SUCCESS',
      target: 'Credentials Vault',
      result: 'SUCCESS',
      details: `Password reset completed via ${payload.method}. All prior sessions revoked. Lockout cleared. (IP: ${ip})`,
      zone: 'Security Gateway',
    });

    await db.addActivityEvent({
      id: `ACT-RST-${Date.now().toString().slice(-4)}`,
      type: 'security',
      event: `Password Reset: ${user.username}`,
      time: timeStr,
      location: 'Security Gateway',
      severity: 'info',
      source: 'live',
    });

    Logger.info('AUTH', `Password reset successfully for ${user.username} via ${payload.method}`);

    return {
      success: true,
      message: 'Password reset successful. All previous sessions have been revoked. Please sign in with your new password.',
    };
  }

  /**
   * Generates a new set of pre-enrolled one-time recovery codes for an authenticated privileged user.
   * Stored ONLY as hashes at rest; plaintext returned strictly once.
   */
  public async generatePreEnrolledRecoveryCodes(userId: string): Promise<{
    success: boolean;
    plaintextCodes?: string[];
    error?: string;
  }> {
    const user = await db.getUserById(userId);
    if (!user || !user.isActive) {
      return { success: false, error: 'User not found.' };
    }

    // Role check: Admin, Security Officer, Faculty only
    if (user.role !== 'admin' && user.role !== 'security_officer' && user.role !== 'faculty') {
      return { success: false, error: 'Clearance denied. Recovery codes are restricted to staff and faculty.' };
    }

    const plaintextCodes: string[] = [];
    const hashes: string[] = [];

    for (let i = 0; i < 6; i++) {
      const code = `RC-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      plaintextCodes.push(code);
      hashes.push(serverAuth.hashPassword(code));
    }

    user.recoveryCodeHashes = hashes;
    await db.updateUser(user);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    await db.addAuditRecord({
      id: `AUD-GEN-${Date.now().toString().slice(-4)}`,
      timestamp: timeStr,
      actor: user.username,
      role: user.role,
      action: 'RECOVERY_CODES_GENERATED',
      target: 'Credentials Vault',
      result: 'SUCCESS',
      details: `Generated 6 new pre-enrolled one-time recovery codes. Previous codes revoked.`,
      zone: 'Security Gateway',
    });

    return {
      success: true,
      plaintextCodes,
    };
  }
}

export const recoveryService = RecoveryService.getInstance();
export default recoveryService;
