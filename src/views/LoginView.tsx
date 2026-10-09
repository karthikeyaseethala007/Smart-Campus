import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  Shield,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Radio,
  Fingerprint
} from 'lucide-react';
import { useAppState } from '../services/stateContext';
import { usePageTransition } from '../components/layout/PageTransition';
import { useTheme } from '../services/themeContext';
import { authService } from '../services/authService';
import { PasswordRecoveryModal } from '../components/security/PasswordRecoveryModal';

const GoogleIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill={color}
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill={color}
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill={color}
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill={color}
    />
  </svg>
);

export const LoginView: React.FC<{ gatewayUnavailable?: boolean }> = ({ gatewayUnavailable: propGatewayUnavailable }) => {
  const { login, syncSession, isAuthenticated, gatewayUnavailable: contextGatewayUnavailable } = useAppState();
  const gatewayUnavailable = propGatewayUnavailable ?? contextGatewayUnavailable;
  const { startOperationsTransition } = usePageTransition();
  const { isDark } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const [googleState, setGoogleState] = useState<'default' | 'loading' | 'error' | 'success'>('default');
  const [googleErrorMessage, setGoogleErrorMessage] = useState('');
  const [recoveryNotice, setRecoveryNotice] = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);

  // Check server-side lockout status for username
  const checkLockout = async (targetUsername: string) => {
    if (!targetUsername.trim()) {
      setIsLockedOut(false);
      setRetryAfterSeconds(null);
      return;
    }
    try {
      const statusRes = await authService.getLockoutStatus(targetUsername.trim());
      if (statusRes.lockedOut) {
        setIsLockedOut(true);
        if (statusRes.retryAfterSeconds) {
          setRetryAfterSeconds(statusRes.retryAfterSeconds);
        }
      } else {
        setIsLockedOut(false);
        setRetryAfterSeconds(null);
      }
    } catch {}
  };

  // Lockout countdown timer
  useEffect(() => {
    if (!retryAfterSeconds || retryAfterSeconds <= 0) return;
    const interval = setInterval(() => {
      setRetryAfterSeconds((prev) => {
        if (!prev || prev <= 1) {
          if (username.trim()) {
            checkLockout(username.trim());
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [retryAfterSeconds, username]);

  // Handle incoming OAuth redirect parameters or existing authenticated session
  useEffect(() => {
    // 1. Check for incoming OAuth redirect query parameters
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const incomingToken = searchParams.get('token');
      const incomingExpiresAt = searchParams.get('expiresAt') || undefined;
      const incomingError = searchParams.get('error');

      if (incomingToken) {
        // Clean URL immediately to prevent token exposure in history or copy-pasting
        window.history.replaceState(null, '', '/login');
        setStatus('loading');
        setGoogleState('loading');

        authService.completeGoogleSession(incomingToken, incomingExpiresAt).then((res) => {
          if (res.success && res.user) {
            setGoogleState('success');
            syncSession(res.user);
            setStatus('success');
            setTimeout(() => {
              startOperationsTransition('overview');
            }, 850);
          } else {
            setGoogleState('error');
            setGoogleErrorMessage('Google authentication unavailable. Please try again or use institutional recovery.');
            setStatus('error');
            setErrorMessage(res.error || 'Failed to authenticate Google session with campus server.');
          }
        }).catch(() => {
          setGoogleState('error');
          setGoogleErrorMessage('Google authentication unavailable. Please try again or use institutional recovery.');
          setStatus('error');
          setErrorMessage('Failed to connect to Security Gateway.');
        });
        return;
      }

      if (incomingError) {
        window.history.replaceState(null, '', '/login');
        setStatus('error');
        setGoogleState('error');
        setGoogleErrorMessage('Google authentication unavailable. Please try again or use institutional recovery.');
        if (incomingError === 'unauthorized_google_account') {
          setErrorMessage('Google identity is not authorized for this campus console.');
        } else if (incomingError === 'invalid_oauth_state') {
          setErrorMessage('Security token expired or invalid (CSRF protection). Please try again.');
        } else if (incomingError === 'google_access_denied') {
          setErrorMessage('Google authentication request was denied.');
        } else {
          setErrorMessage('Google authentication failed. Please verify credentials and try again.');
        }
        return;
      }
    }

    // 2. If already authenticated when visiting /login, transition to /app
    if (isAuthenticated) {
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      if (searchParams?.get('reauth') !== 'true' && searchParams?.get('switch') !== 'true') {
        startOperationsTransition('overview');
      }
    }
  }, [isAuthenticated, startOperationsTransition, syncSession]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLockedOut) return;

    if (!username.trim()) {
      setStatus('error');
      setErrorMessage('Please enter an operator identifier or username.');
      return;
    }

    if (!password) {
      setStatus('error');
      setErrorMessage('Please enter a security passkey.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');
    setRecoveryNotice('');

    try {
      const res = await login(username.trim(), password);

      if (res.success) {
        setStatus('success');
        setIsLockedOut(false);
        setRetryAfterSeconds(null);
        // Brief cinematic pause for "ACCESS GRANTED" status before transitioning to /app
        setTimeout(() => {
          startOperationsTransition('overview');
        }, 850);
      } else {
        setStatus('error');
        if (res.lockedOut) {
          setIsLockedOut(true);
          if (res.retryAfterSeconds) {
            setRetryAfterSeconds(res.retryAfterSeconds);
          }
          setErrorMessage(
            'Too many failed authentication attempts. Authentication is temporarily locked. Please wait until the lockout expires or use verified account recovery.'
          );
        } else {
          setErrorMessage(res.error || 'Authentication failed: Invalid operator credentials.');
        }
      }
    } catch {
      setStatus('error');
      setErrorMessage('Connection failed: Security Gateway is unreachable.');
    }
  };

  const handleGoogleLogin = async () => {
    if (status === 'loading' || status === 'success' || googleState === 'loading') return;

    setGoogleState('loading');
    setGoogleErrorMessage('');

    try {
      const data = await authService.getGoogleAuthUrl();
      if (!data.configured || !data.authUrl) {
        setGoogleState('error');
        setGoogleErrorMessage('Google authentication unavailable. Please try again or use institutional recovery.');
        return;
      }

      setGoogleState('success');
      // Restrained cinematic redirection to Google OAuth gateway
      window.location.href = data.authUrl;
    } catch {
      setGoogleState('error');
      setGoogleErrorMessage('Google authentication unavailable. Please try again or use institutional recovery.');
    }
  };

  const handleBrandClick = () => {
    startOperationsTransition('landing');
  };

  const handleDemoFill = (user: string) => {
    setUsername(user);
    setPassword('password123');
    setStatus('idle');
    setErrorMessage('');
  };

  // Editorial motion variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  const panelVariants: Variants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.98, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1] as const,
        delay: shouldReduceMotion ? 0 : 0.2,
      },
    },
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: isDark ? '#031819' : '#FAFAFC',
        color: isDark ? '#FEFFFF' : '#101820',
        fontFamily: "var(--font-display, 'Outfit', 'Plus Jakarta Sans', sans-serif)",
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* =========================================================================
          ATMOSPHERIC LIGHTING & STUDIO HORIZON (REUSING LANDING ASSETS)
          ========================================================================= */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {/* Studio Cyclorama image backdrop */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/assets/atmosphere/studio-cyclorama.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: isDark ? 0.25 : 0.45,
            mixBlendMode: isDark ? 'screen' : 'multiply',
          }}
        />

        {/* Optical Center Glow */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.05, 1],
                  opacity: [0.35, 0.45, 0.35],
                }
          }
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            top: '40%',
            left: '60%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(600px, 60vw, 1000px)',
            height: 'clamp(600px, 60vw, 1000px)',
            pointerEvents: 'none',
          }}
        >
          <img
            src="/assets/atmosphere/hero-center-ell.avif"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: isDark ? 0.35 : 0.7,
            }}
          />
        </motion.div>

        {/* Contact/Lateral Lightmap Glow */}
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-5%',
            width: 'clamp(500px, 50vw, 850px)',
            height: 'clamp(500px, 50vw, 850px)',
            pointerEvents: 'none',
            opacity: isDark ? 0.2 : 0.6,
          }}
        >
          <img
            src="/assets/atmosphere/contact-ell.avif"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Subtle Ambient Brand Warmth Drift */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  x: [0, 20, 0],
                  y: [0, -15, 0],
                }
          }
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            top: '15%',
            right: '15%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 130, 0, 0.08) 0%, rgba(255, 161, 61, 0.02) 50%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />

        {/* Architectural Fine Hairline Grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(16,24,32,0.03)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(16,24,32,0.03)'} 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            opacity: 0.7,
          }}
        />
      </div>

      {/* =========================================================================
          PERSISTENT TOP COMMAND BAR
          ========================================================================= */}
      <header
        style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'clamp(18px, 3vh, 28px) clamp(24px, 5vw, 64px)',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {/* Left: Brand Identity Mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={handleBrandClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'inherit',
              textDecoration: 'none',
            }}
            title="Smart Campus Gateway"
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9999px',
                backgroundColor: isDark ? '#16202C' : '#101820',
                color: isDark ? '#FF8200' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              }}
            >
              <Shield size={18} strokeWidth={2.2} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isDark ? '#FFFFFF' : '#101820',
                }}
              >
                SMART CAMPUS
              </span>
              <span
                style={{
                  fontSize: '0.688rem',
                  letterSpacing: '0.04em',
                  color: isDark ? '#8A8F8D' : '#5B6871',
                  fontWeight: 500,
                }}
              >
                Security &amp; Automation
              </span>
            </div>
          </button>
        </div>

        {/* Right: Operational Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Live Security Indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.09)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              fontSize: '0.688rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#22C55E',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#22C55E',
                boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
              }}
            />
            GATEWAY ONLINE · TLS 1.3
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN EDITORIAL RUNWAY: 2-COLUMN BALANCED COMPOSITION
          ========================================================================= */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(24px, 4vh, 48px) clamp(24px, 5vw, 64px)',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
            gap: 'clamp(40px, 6vw, 96px)',
            alignItems: 'center',
            boxSizing: 'border-box',
          }}
        >
          {/* =======================================================================
              LEFT EDITORIAL COLUMN: NARRATIVE & SYSTEM TELEMETRY
              ======================================================================= */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(20px, 3vh, 32px)',
              maxWidth: '560px',
            }}
          >
            {/* System Category Tag */}
            <motion.div
              variants={itemVariants}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: '#FF8200',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#FF8200',
                  boxShadow: '0 0 10px rgba(255, 130, 0, 0.4)',
                }}
              />
              COMMAND LAYER ACCESS // NODE 01
            </motion.div>

            {/* Main Editorial Headline */}
            <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(2.4rem, 4.2vw, 3.8rem)',
                  fontWeight: 700,
                  lineHeight: 1.08,
                  letterSpacing: '-0.035em',
                  color: isDark ? '#FFFFFF' : '#101820',
                }}
              >
                Enter the{' '}
                <span
                  style={{
                    fontFamily: "var(--font-signifier, 'Source Serif 4', Georgia, serif)",
                    fontStyle: 'italic',
                    fontWeight: 400,
                    color: '#FF8200',
                  }}
                >
                  command layer.
                </span>
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 'clamp(0.95rem, 1.2vw, 1.125rem)',
                  lineHeight: 1.55,
                  color: isDark ? '#ADC2D6' : '#5B6871',
                  maxWidth: '480px',
                  fontFamily: "var(--font-sohne, 'Outfit', 'Plus Jakarta Sans', sans-serif)",
                }}
              >
                Secure access to Smart Campus Security &amp; Automation. Authoritative perimeter monitoring,
                subsystem control, and hardware credentials.
              </p>
            </motion.div>

            {/* Security Pillars Cards */}
            <motion.div
              variants={itemVariants}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginTop: '4px',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  backgroundColor: isDark ? 'rgba(16, 24, 32, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(16, 24, 32, 0.06)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(255, 130, 0, 0.12)' : 'rgba(255, 130, 0, 0.08)',
                    color: '#FF8200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound size={15} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#FFFFFF' : '#101820' }}>
                    Scrypt Key Derivation
                  </span>
                  <span style={{ fontSize: '0.688rem', color: isDark ? '#8A8F8D' : '#5B6871' }}>
                    Cryptographic Hash Protection
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  backgroundColor: isDark ? 'rgba(16, 24, 32, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(16, 24, 32, 0.06)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.08)',
                    color: '#22C55E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Radio size={15} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#FFFFFF' : '#101820' }}>
                    Realtime Telemetry
                  </span>
                  <span style={{ fontSize: '0.688rem', color: isDark ? '#8A8F8D' : '#5B6871' }}>
                    Zero-Trust Gateway Enforcement
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Quick Demo Credentials Pill Bar */}
            <motion.div
              variants={itemVariants}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.75rem',
                color: isDark ? '#8A8F8D' : '#5B6871',
              }}
            >
              <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pre-authorized roles:
              </span>
              {(['admin', 'security', 'faculty', 'student'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleDemoFill(role)}
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(16, 24, 32, 0.05)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(16, 24, 32, 0.08)',
                    borderRadius: '9999px',
                    padding: '3px 10px',
                    fontSize: '0.688rem',
                    fontFamily: 'monospace',
                    color: isDark ? '#D1DBE6' : '#101820',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#FF8200';
                    e.currentTarget.style.color = '#FF8200';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 24, 32, 0.08)';
                    e.currentTarget.style.color = isDark ? '#D1DBE6' : '#101820';
                  }}
                  title={`Click to fill ${role} credentials`}
                >
                  {role}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* =======================================================================
              RIGHT COLUMN: ENGINEERED LUXURY LOGIN CONSOLE
              ======================================================================= */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '460px',
              margin: '0 auto',
            }}
          >
            {/* Outer Subtle Ambient Border Glow */}
            <div
              style={{
                position: 'absolute',
                inset: '-1px',
                borderRadius: '26px',
                background: 'linear-gradient(145deg, rgba(255, 130, 0, 0.3) 0%, rgba(255, 255, 255, 0.1) 40%, rgba(16, 24, 32, 0.05) 100%)',
                zIndex: -1,
                opacity: 0.8,
                filter: 'blur(2px)',
              }}
            />

            {/* The Console Surface Panel */}
            <div
              style={{
                position: 'relative',
                backgroundColor: isDark ? 'rgba(16, 24, 32, 0.86)' : 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                borderRadius: '24px',
                padding: 'clamp(28px, 4vw, 44px)',
                boxShadow: isDark
                  ? '0 24px 64px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08) inset'
                  : '0 24px 70px -16px rgba(16, 24, 32, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.09)' : '1px solid rgba(16, 24, 32, 0.08)',
                boxSizing: 'border-box',
              }}
            >
              {/* Corner Registration Crosshair Accents */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '14px',
                  fontSize: '9px',
                  color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(16, 24, 32, 0.2)',
                  fontFamily: 'monospace',
                  userSelect: 'none',
                }}
              >
                +
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '14px',
                  fontSize: '9px',
                  color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(16, 24, 32, 0.2)',
                  fontFamily: 'monospace',
                  userSelect: 'none',
                }}
              >
                +
              </div>

              {/* Console Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '20px',
                  borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(16, 24, 32, 0.06)',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Fingerprint size={16} color="#FF8200" />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: isDark ? '#FFFFFF' : '#101820',
                    }}
                  >
                    Console Clearance
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.04em',
                    color: isDark ? '#7C9EC0' : '#5B6871',
                  }}
                >
                  AUTH_NODE_01
                </span>
              </div>

              {/* Real Authentication Form */}
              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Identity / Username Field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label
                    htmlFor="operator-identity"
                    style={{
                      fontSize: '0.688rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: isDark ? '#ADC2D6' : '#5B6871',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Operator Identifier</span>
                    <span style={{ fontSize: '0.625rem', fontFamily: 'monospace', color: isDark ? '#5B6871' : '#8A8F8D' }}>
                      ID / USERNAME
                    </span>
                  </label>
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: '14px',
                        color: focusedField === 'username' ? '#FF8200' : isDark ? '#5B6871' : '#8A8F8D',
                        pointerEvents: 'none',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      <User size={17} />
                    </div>
                    <input
                      id="operator-identity"
                      name="username"
                      type="text"
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      required
                      value={username}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUsername(val);
                        if (status === 'error') setStatus('idle');
                        if (val.trim()) {
                          checkLockout(val);
                        } else {
                          setIsLockedOut(false);
                          setRetryAfterSeconds(null);
                        }
                      }}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => {
                        setFocusedField(null);
                        if (username.trim()) {
                          checkLockout(username);
                        }
                      }}
                      placeholder="e.g. admin or security"
                      style={{
                        width: '100%',
                        padding: '13px 14px 13px 42px',
                        backgroundColor: isDark ? 'rgba(3, 24, 25, 0.6)' : 'rgba(245, 247, 250, 0.75)',
                        border: focusedField === 'username'
                          ? '1px solid #FF8200'
                          : isDark
                          ? '1px solid rgba(255, 255, 255, 0.12)'
                          : '1px solid rgba(16, 24, 32, 0.12)',
                        borderRadius: '12px',
                        fontSize: '0.938rem',
                        color: isDark ? '#FFFFFF' : '#101820',
                        fontFamily: "var(--font-sohne, 'Outfit', 'Plus Jakarta Sans', sans-serif)",
                        outline: 'none',
                        boxShadow: focusedField === 'username' ? '0 0 0 3px rgba(255, 130, 0, 0.15)' : 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* 2. Password Field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label
                      htmlFor="operator-passkey"
                      style={{
                        fontSize: '0.688rem',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: isDark ? '#ADC2D6' : '#5B6871',
                      }}
                    >
                      Security Passkey
                    </label>
                    {capsLockActive && (
                      <span
                        style={{
                          fontSize: '0.625rem',
                          color: '#FF8200',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: 600,
                        }}
                      >
                        <AlertTriangle size={10} /> CAPS LOCK ON
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: '14px',
                        color: focusedField === 'password' ? '#FF8200' : isDark ? '#5B6871' : '#8A8F8D',
                        pointerEvents: 'none',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      <Lock size={17} />
                    </div>
                    <input
                      id="operator-passkey"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      disabled={isLockedOut}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (status === 'error') setStatus('idle');
                      }}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyDown}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••••••"
                      style={{
                        width: '100%',
                        padding: '13px 44px 13px 42px',
                        backgroundColor: isLockedOut
                          ? isDark ? 'rgba(255, 255, 255, 0.04)' : '#ECEFF1'
                          : isDark ? 'rgba(3, 24, 25, 0.6)' : 'rgba(245, 247, 250, 0.75)',
                        border: focusedField === 'password'
                          ? '1px solid #FF8200'
                          : isDark
                          ? '1px solid rgba(255, 255, 255, 0.12)'
                          : '1px solid rgba(16, 24, 32, 0.12)',
                        borderRadius: '12px',
                        fontSize: '0.938rem',
                        color: isDark ? '#FFFFFF' : '#101820',
                        fontFamily: "var(--font-sohne, 'Outfit', 'Plus Jakarta Sans', sans-serif)",
                        outline: 'none',
                        opacity: isLockedOut ? 0.65 : 1,
                        cursor: isLockedOut ? 'not-allowed' : 'text',
                        boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(255, 130, 0, 0.15)' : 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      disabled={isLockedOut}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        padding: '6px',
                        color: isDark ? '#8A8F8D' : '#5B6871',
                        cursor: isLockedOut ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isLockedOut) e.currentTarget.style.color = '#FF8200';
                      }}
                      onMouseLeave={(e) => {
                        if (!isLockedOut) e.currentTarget.style.color = isDark ? '#8A8F8D' : '#5B6871';
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* 2.0 Security Lockout Active Banner (Phase 3 Requirement) */}
                {isLockedOut && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    role="alert"
                    aria-live="assertive"
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.45)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#EF4444',
                        fontWeight: 700,
                        fontSize: '0.813rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <AlertTriangle size={16} />
                      <span>SECURITY LOCKOUT ACTIVE</span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.813rem',
                        lineHeight: 1.45,
                        color: isDark ? '#FFA0A0' : '#B71C1C',
                      }}
                    >
                      Too many failed authentication attempts. Authentication is temporarily locked.
                      Please wait until the lockout expires or use verified account recovery.
                    </p>
                    {retryAfterSeconds && retryAfterSeconds > 0 && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: isDark ? '#ADC2D6' : '#5B6871',
                          fontFamily: 'monospace',
                        }}
                      >
                        Lockout active: {Math.floor(retryAfterSeconds / 60)}m {retryAfterSeconds % 60}s remaining
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowRecoveryModal(true)}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#FF8200',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                    >
                      Use Verified Account Recovery →
                    </button>
                  </motion.div>
                )}

                {/* 2.1 Recovery Success Banner */}
                {recoveryNotice && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    role="status"
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(34, 197, 94, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.813rem',
                      color: '#22C55E',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{recoveryNotice}</span>
                  </motion.div>
                )}

                {/* Gateway Unavailable Fail-Closed Banner (Phase 3) */}
                {gatewayUnavailable && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    role="alert"
                    aria-live="assertive"
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(220, 38, 38, 0.08)',
                      border: isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(220, 38, 38, 0.25)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      fontSize: '0.813rem',
                      lineHeight: 1.4,
                      color: isDark ? '#FFA0A0' : '#D32F2F',
                    }}
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#EF4444' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
                      <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.75rem', color: '#EF4444' }}>
                        AUTHENTICATION VERIFICATION · SECURITY GATEWAY UNAVAILABLE
                      </span>
                      <span style={{ fontWeight: 600 }}>REAUTHENTICATION REQUIRED</span>
                      <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>
                        Institutional authority could not be verified by the Security Gateway. Cached credentials cannot be trusted. Please re-authenticate.
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* 3. Integrated Dynamic Alert / Feedback */}
                {status === 'error' && Boolean(errorMessage) && !isLockedOut && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    role="alert"
                    aria-live="polite"
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(220, 38, 38, 0.08)',
                      border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(220, 38, 38, 0.25)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '0.813rem',
                      lineHeight: 1.4,
                      color: isDark ? '#FFA0A0' : '#D32F2F',
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
                      <span style={{ fontWeight: 600 }}>Authentication Denied</span>
                      <span>{errorMessage}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setStatus('idle');
                          setErrorMessage('');
                        }}
                        style={{
                          alignSelf: 'flex-start',
                          marginTop: '4px',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: isDark ? '#FFB2B2' : '#B71C1C',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textDecoration: 'underline',
                          cursor: 'pointer',
                        }}
                      >
                        Return to authentication
                      </button>
                    </div>
                  </motion.div>
                )}

                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    role="status"
                    aria-live="polite"
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(34, 197, 94, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.813rem',
                      color: '#22C55E',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>ACCESS GRANTED · LAUNCHING COMMAND CENTER...</span>
                  </motion.div>
                )}

                {/* 4. Primary Authentication Action Button */}
                <motion.button
                  type="submit"
                  disabled={isLockedOut || status === 'loading' || status === 'success'}
                  whileHover={status === 'idle' && !isLockedOut ? { scale: 1.01 } : {}}
                  whileTap={status === 'idle' && !isLockedOut ? { scale: 0.985 } : {}}
                  style={{
                    position: 'relative',
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    backgroundColor: isLockedOut
                      ? isDark ? '#232D38' : '#A0AAB2'
                      : status === 'success'
                      ? '#22C55E'
                      : '#101820',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: isLockedOut || status === 'loading' || status === 'success' ? 'not-allowed' : 'pointer',
                    opacity: isLockedOut ? 0.65 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 16px rgba(16, 24, 32, 0.18)',
                    transition: 'background-color 0.25s ease, box-shadow 0.25s ease',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (status === 'idle' && !isLockedOut) {
                      e.currentTarget.style.backgroundColor = '#FF8200';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 130, 0, 0.35)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (status === 'idle' && !isLockedOut) {
                      e.currentTarget.style.backgroundColor = '#101820';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 24, 32, 0.18)';
                    }
                  }}
                >
                  {status === 'loading' && googleState !== 'loading' ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderTopColor: '#FFFFFF',
                          borderRadius: '50%',
                        }}
                      />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : status === 'success' ? (
                    <>
                      <CheckCircle2 size={17} />
                      <span>Access Granted</span>
                    </>
                  ) : isLockedOut ? (
                    <>
                      <Lock size={16} />
                      <span>Authentication Locked</span>
                    </>
                  ) : (
                    <>
                      <span>Authenticate Console</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>

                {/* Refined Divider */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    margin: '18px 0',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: '1px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 24, 32, 0.08)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.688rem',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: isDark ? '#7C9EC0' : '#8A8F8D',
                      fontFamily: 'monospace',
                    }}
                  >
                    OR
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: '1px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 24, 32, 0.08)',
                    }}
                  />
                </div>

                {/* Secondary Action: Continue with Google (Phase 11 Compliance) */}
                <motion.button
                  type="button"
                  id="google-authenticate-button"
                  disabled={status === 'loading' || status === 'success' || googleState === 'loading'}
                  onClick={handleGoogleLogin}
                  whileHover={status === 'idle' && googleState !== 'loading' ? { scale: shouldReduceMotion ? 1 : 1.01 } : {}}
                  whileTap={status === 'idle' && googleState !== 'loading' ? { scale: shouldReduceMotion ? 1 : 0.99 } : {}}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    backgroundColor: '#FFFFFF',
                    color: '#101820',
                    border: '1px solid rgba(16, 24, 32, 0.14)',
                    borderRadius: '12px',
                    fontSize: '0.813rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    cursor: status === 'loading' || status === 'success' || googleState === 'loading' ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 2px 8px rgba(16, 24, 32, 0.06)',
                    transition: 'all 0.2s ease',
                    opacity: googleState === 'loading' ? 0.85 : 1,
                    marginBottom: googleState === 'error' ? '8px' : '16px',
                  }}
                  onMouseEnter={(e) => {
                    if (googleState !== 'loading' && status === 'idle') {
                      e.currentTarget.style.backgroundColor = '#F7F8FA';
                      e.currentTarget.style.borderColor = 'rgba(16, 24, 32, 0.28)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 24, 32, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (googleState !== 'loading' && status === 'idle') {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.borderColor = 'rgba(16, 24, 32, 0.14)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 24, 32, 0.06)';
                    }
                  }}
                >
                  {googleState === 'loading' ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid rgba(16, 24, 32, 0.25)',
                          borderTopColor: '#101820',
                          borderRadius: '50%',
                        }}
                      />
                      <span>Connecting to Google…</span>
                    </>
                  ) : googleState === 'success' ? (
                    <>
                      <CheckCircle2 size={16} color="#22C55E" />
                      <span>Identity verified…</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon size={16} color="#101820" />
                      <span>Continue with Google</span>
                    </>
                  )}
                </motion.button>

                {googleState === 'error' && (
                  <div
                    role="alert"
                    style={{
                      marginBottom: '16px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      fontSize: '0.75rem',
                      color: isDark ? '#FFA0A0' : '#B71C1C',
                      lineHeight: 1.4,
                      textAlign: 'center',
                    }}
                  >
                    {googleErrorMessage || 'Google authentication unavailable. Please try again or use institutional recovery.'}
                  </div>
                )}

                {/* 5. Secondary Action: Help & Recovery */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '6px',
                    fontSize: '0.75rem',
                    color: isDark ? '#7C9EC0' : '#5B6871',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'inherit',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                      fontSize: 'inherit',
                    }}
                  >
                    Forgot password? / Verify identity
                  </button>

                  <span
                    style={{
                      fontSize: '0.688rem',
                      fontFamily: 'monospace',
                      color: isDark ? '#5B6871' : '#8A8F8D',
                    }}
                  >
                    RBAC LEVEL-4
                  </span>
                </div>
              </form>

              {/* Console Footnote Trust Indicator */}
              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '16px',
                  borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(16, 24, 32, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.688rem',
                  color: isDark ? '#5B6871' : '#8A8F8D',
                  textAlign: 'center',
                  letterSpacing: '0.02em',
                }}
              >
                <Shield size={12} color="#22C55E" />
                <span>Zero-Trust Verification · Session Enforced via Scrypt</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* =========================================================================
          RECOVERY & IDENTITY VERIFICATION MODAL (Phases 8, 9, 10, 12)
          ========================================================================= */}
      <PasswordRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        initialIdentifier={username}
        onRecoveryComplete={() => {
          setIsLockedOut(false);
          setRetryAfterSeconds(null);
          setStatus('idle');
          setRecoveryNotice('Password successfully reset. Lockout cleared. All prior sessions revoked.');
          setPassword('');
        }}
      />
    </div>
  );
};

export default LoginView;
