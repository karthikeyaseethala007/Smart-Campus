import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  Lock,
  User,
  ArrowLeft,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { useTheme } from '../../services/themeContext';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  onRecoveryComplete: () => void;
}

type RecoveryStep = 'identifier' | 'method_select' | 'recovery_code' | 'set_new_password' | 'success';

const GoogleIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  isOpen,
  onClose,
  initialIdentifier = '',
  onRecoveryComplete,
}) => {
  const { isDark } = useTheme();

  const [step, setStep] = useState<RecoveryStep>('identifier');
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');

  const [recoveryInfo, setRecoveryInfo] = useState<{
    hasGoogleLinked?: boolean;
    hasRecoveryCodes?: boolean;
    canRecover?: boolean;
    googleEmailMasked?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please provide your operator identifier or campus email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.requestPasswordRecovery(identifier.trim());
      setLoading(false);

      if (!res.success) {
        setError(res.error || 'Unable to process recovery request.');
        return;
      }

      setRecoveryInfo({
        hasGoogleLinked: res.hasGoogleLinked,
        hasRecoveryCodes: res.hasRecoveryCodes,
        canRecover: res.canRecover,
        googleEmailMasked: res.googleEmailMasked,
      });

      if (!res.canRecover) {
        // Exact Phase 8 unlinked requirement
        setError(
          'Your institutional Google account is not linked to this Smart Campus account. Contact an authorized administrator/security officer to recover access.'
        );
        return;
      }

      // If both or recovery code is available, proceed to method selection
      if (res.hasRecoveryCodes && res.hasGoogleLinked) {
        setStep('method_select');
      } else if (res.hasRecoveryCodes) {
        setStep('recovery_code');
      } else if (res.hasGoogleLinked) {
        setStep('method_select');
      } else {
        setError(
          'Your institutional Google account is not linked to this Smart Campus account. Contact an authorized administrator/security officer to recover access.'
        );
      }
    } catch {
      setLoading(false);
      setError('Network communication error with Security Gateway.');
    }
  };

  const handleGoogleRecovery = async () => {
    setLoading(true);
    setError('');
    try {
      const urlRes = await authService.getGoogleAuthUrl();
      if (!urlRes.configured || !urlRes.authUrl) {
        setLoading(false);
        setError('Google OAuth is not configured on this security server.');
        return;
      }
      // Redirect to Google authorization
      window.location.href = urlRes.authUrl;
    } catch {
      setLoading(false);
      setError('Failed to initiate Google verification flow.');
    }
  };

  const handleVerifyRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim()) {
      setError('Please enter a pre-enrolled one-time recovery code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.verifyRecoveryCode(identifier.trim(), recoveryCode.trim());
      setLoading(false);

      if (!res.success || !res.recoveryToken) {
        setError(res.error || 'Invalid or already consumed recovery code.');
        return;
      }

      setRecoveryToken(res.recoveryToken);
      setStep('set_new_password');
    } catch {
      setLoading(false);
      setError('Network communication error during code verification.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.resetPassword(recoveryToken, newPassword);
      setLoading(false);

      if (!res.success) {
        setError(res.error || 'Password reset failed. Recovery token may be expired or already consumed.');
        return;
      }

      setStep('success');
      onRecoveryComplete();
    } catch {
      setLoading(false);
      setError('Network communication error during password reset.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: isDark ? '#0D141C' : '#FFFFFF',
          borderRadius: '20px',
          padding: '28px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(16, 24, 32, 0.12)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          color: isDark ? '#FEFFFF' : '#101820',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close recovery dialog"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: isDark ? '#7C9EC0' : '#8A8F8D',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 130, 0, 0.12)',
              color: '#FF8200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 id="recovery-dialog-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
              Account Security Recovery
            </h2>
            <span style={{ fontSize: '0.75rem', color: isDark ? '#7C9EC0' : '#5B6871', fontFamily: 'monospace' }}>
              SEC-AUTH-RECOVERY · ZERO-TRUST
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: isDark ? '#FFA0A0' : '#B71C1C',
              fontSize: '0.813rem',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              lineHeight: 1.4,
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {/* Step 1: Request Identifier */}
        {step === 'identifier' && (
          <form onSubmit={handleRequestRecovery} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: isDark ? '#ADC2D6' : '#5B6871' }}>
              Enter your registered operator identifier or institutional email to initiate identity verification.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                htmlFor="recovery-identifier-input"
                style={{
                  fontSize: '0.688rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isDark ? '#ADC2D6' : '#5B6871',
                }}
              >
                Operator Identifier / Email
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    color: isDark ? '#5B6871' : '#8A8F8D',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="recovery-identifier-input"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. admin or faculty"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 38px',
                    backgroundColor: isDark ? 'rgba(3, 24, 25, 0.6)' : '#F5F7FA',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(16, 24, 32, 0.12)',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    color: isDark ? '#FEFFFF' : '#101820',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#FF8200',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: loading ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Verifying Identity Vault…' : 'Continue to Verification'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Step 2: Choose Verification Method */}
        {step === 'method_select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: isDark ? '#ADC2D6' : '#5B6871' }}>
              Identity options available for <strong>{identifier}</strong>:
            </p>

            {recoveryInfo.hasGoogleLinked && (
              <button
                type="button"
                onClick={handleGoogleRecovery}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                  color: isDark ? '#FEFFFF' : '#101820',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid rgba(16, 24, 32, 0.16)',
                  borderRadius: '12px',
                  fontSize: '0.813rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              >
                <GoogleIcon size={18} />
                <span>Verify with Linked Google Account ({recoveryInfo.googleEmailMasked || 'institutional'})</span>
              </button>
            )}

            {recoveryInfo.hasRecoveryCodes && (
              <button
                type="button"
                onClick={() => setStep('recovery_code')}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F5F7FA',
                  color: isDark ? '#FEFFFF' : '#101820',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(16, 24, 32, 0.12)',
                  borderRadius: '12px',
                  fontSize: '0.813rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                <KeyRound size={16} color="#FF8200" />
                <span>Use Pre-Enrolled One-Time Recovery Code</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setStep('identifier')}
              style={{
                background: 'none',
                border: 'none',
                color: isDark ? '#7C9EC0' : '#5B6871',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '6px',
              }}
            >
              <ArrowLeft size={14} /> Back to identifier entry
            </button>
          </div>
        )}

        {/* Step 3: Enter Recovery Code */}
        {step === 'recovery_code' && (
          <form onSubmit={handleVerifyRecoveryCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: isDark ? '#ADC2D6' : '#5B6871' }}>
              Enter an unused pre-enrolled cryptographic recovery code associated with your clearance level.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                htmlFor="recovery-code-input"
                style={{
                  fontSize: '0.688rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isDark ? '#ADC2D6' : '#5B6871',
                }}
              >
                Pre-Enrolled Recovery Code
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <KeyRound
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    color: '#FF8200',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="recovery-code-input"
                  type="text"
                  required
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  placeholder="RC-ADM-SAFE-2026"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 38px',
                    backgroundColor: isDark ? 'rgba(3, 24, 25, 0.6)' : '#F5F7FA',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(16, 24, 32, 0.12)',
                    borderRadius: '10px',
                    fontSize: '0.938rem',
                    fontFamily: 'monospace',
                    color: isDark ? '#FEFFFF' : '#101820',
                    outline: 'none',
                    letterSpacing: '0.05em',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.688rem', color: isDark ? '#7C9EC0' : '#8A8F8D' }}>
                Single-use only. Validated server-side via salted cryptographic hash.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#FF8200',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: loading ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Validating Token Vault…' : 'Validate Recovery Code'}
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => setStep('identifier')}
              style={{
                background: 'none',
                border: 'none',
                color: isDark ? '#7C9EC0' : '#5B6871',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>
          </form>
        )}

        {/* Step 4: Set New Password */}
        {step === 'set_new_password' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#22C55E',
                fontSize: '0.813rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Identity Verified. Set a new operational passkey.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                htmlFor="new-passkey-input"
                style={{
                  fontSize: '0.688rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isDark ? '#ADC2D6' : '#5B6871',
                }}
              >
                New Passkey (min. 8 characters)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    color: isDark ? '#5B6871' : '#8A8F8D',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="new-passkey-input"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 38px',
                    backgroundColor: isDark ? 'rgba(3, 24, 25, 0.6)' : '#F5F7FA',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(16, 24, 32, 0.12)',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    color: isDark ? '#FEFFFF' : '#101820',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                htmlFor="confirm-passkey-input"
                style={{
                  fontSize: '0.688rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isDark ? '#ADC2D6' : '#5B6871',
                }}
              >
                Confirm Passkey
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    color: isDark ? '#5B6871' : '#8A8F8D',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="confirm-passkey-input"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 38px',
                    backgroundColor: isDark ? 'rgba(3, 24, 25, 0.6)' : '#F5F7FA',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(16, 24, 32, 0.12)',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    color: isDark ? '#FEFFFF' : '#101820',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#22C55E',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: loading ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Updating Passkey Vault…' : 'Update Passkey & Revoke Prior Sessions'}
            </button>
          </form>
        )}

        {/* Step 5: Success */}
        {step === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', alignItems: 'center' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#22C55E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.125rem', fontWeight: 600 }}>Passkey Updated</h3>
              <p style={{ margin: 0, fontSize: '0.813rem', color: isDark ? '#ADC2D6' : '#5B6871', lineHeight: 1.5 }}>
                Account lockout cleared. All prior active sessions and WebSocket connections have been revoked.
                You can now log in with your updated passkey.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: isDark ? 'var(--palette-orange, #FF8200)' : '#101820',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              Return to Login Gateway
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PasswordRecoveryModal;
