export interface ServerConfig {
  port: number;
  host: string;
  databaseUrl?: string;
  databasePoolMin: number;
  databasePoolMax: number;
  databaseSsl: boolean;
  mqttUrl?: string;
  mqttUsername?: string;
  mqttPassword?: string;
  mqttCaCert?: string;
  mqttClientCert?: string;
  mqttClientKey?: string;
  mqttTlsRejectUnauthorized: boolean;
  sessionSecret: string;
  sessionLifetimeHours: number;
  realtimeMode: 'simulated' | 'live' | 'hybrid';
  environment: 'development' | 'staging' | 'production' | 'test';
  rtspProxyUrl: string;
  corsOrigin: string;
  trustedOrigins: string[];
  rateLimitMax: number;
  rateLimitWindowMs: number;
  wsHeartbeatIntervalMs: number;
  wsMaxPayloadBytes: number;
  deviceApiKey: string;
  allowAnonymousWsUpgrade: boolean;
  googleClientId: string;
  googleClientSecret: string;
  googleOAuthRedirectUri: string;
  frontendUrl: string;
  authMaxFailedAttempts: number;
  authLockoutMinutes: number;
}

import crypto from 'crypto';

// In production or live mode, no fallback is permitted; an explicit SESSION_SECRET is strictly required.
// In development/test mode, an ephemeral high-entropy random secret is generated if SESSION_SECRET is unset.
const isExplicitSecretRequired = process.env.NODE_ENV === 'production' || process.env.REALTIME_MODE === 'live';
const ephemeralDevSessionSecret = isExplicitSecretRequired ? '' : crypto.randomBytes(32).toString('hex');
const DEFAULT_DEV_DEVICE_API_KEY = 'campus-sec-device-key-production-8821';

const rawCors = process.env.CORS_ORIGIN;
const defaultOrigin = process.env.NODE_ENV === 'production'
  ? 'https://campus.internal'
  : 'http://localhost:5173';

const activeCorsOrigin = rawCors || defaultOrigin;
const parsedTrustedOrigins = activeCorsOrigin === '*'
  ? []
  : activeCorsOrigin.split(',').map(o => o.trim()).filter(Boolean);

// Always ensure localhost:5173 and 127.0.0.1:5173 are trusted for development
if (process.env.NODE_ENV !== 'production') {
  if (!parsedTrustedOrigins.includes('http://localhost:5173')) parsedTrustedOrigins.push('http://localhost:5173');
  if (!parsedTrustedOrigins.includes('http://127.0.0.1:5173')) parsedTrustedOrigins.push('http://127.0.0.1:5173');
}

// In production and all environments, also ensure the deployed Vercel frontend origin is trusted
const VERCEL_PRODUCTION_ORIGIN = 'https://smart-campus-ten-eta.vercel.app';
if (activeCorsOrigin !== '*' && !parsedTrustedOrigins.includes(VERCEL_PRODUCTION_ORIGIN)) {
  parsedTrustedOrigins.push(VERCEL_PRODUCTION_ORIGIN);
}

export const config: ServerConfig = {
  port: Number(process.env.PORT || 8080),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL,
  databasePoolMin: Number(process.env.DATABASE_POOL_MIN || 2),
  databasePoolMax: Number(process.env.DATABASE_POOL_MAX || 20),
  databaseSsl: process.env.DATABASE_SSL === 'true',
  mqttUrl: process.env.MQTT_URL,
  mqttUsername: process.env.MQTT_USERNAME,
  mqttPassword: process.env.MQTT_PASSWORD,
  mqttCaCert: process.env.MQTT_CA_CERT,
  mqttClientCert: process.env.MQTT_CLIENT_CERT,
  mqttClientKey: process.env.MQTT_CLIENT_KEY,
  mqttTlsRejectUnauthorized: process.env.MQTT_TLS_REJECT_UNAUTHORIZED !== 'false',
  sessionSecret: process.env.SESSION_SECRET || ephemeralDevSessionSecret,
  sessionLifetimeHours: Number(process.env.SESSION_LIFETIME_HOURS || 24),
  realtimeMode: (process.env.REALTIME_MODE as ServerConfig['realtimeMode']) || 'simulated',
  environment: (process.env.NODE_ENV as ServerConfig['environment']) || 'development',
  rtspProxyUrl: process.env.RTSP_PROXY_URL || 'http://localhost:8554',
  corsOrigin: activeCorsOrigin,
  trustedOrigins: parsedTrustedOrigins,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 120),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  wsHeartbeatIntervalMs: Number(process.env.WS_HEARTBEAT_INTERVAL_MS || 15000),
  wsMaxPayloadBytes: Number(process.env.WS_MAX_PAYLOAD_BYTES || 65536),
  deviceApiKey: process.env.DEVICE_API_KEY || DEFAULT_DEV_DEVICE_API_KEY,
  allowAnonymousWsUpgrade: process.env.ALLOW_ANONYMOUS_WS_UPGRADE === 'true',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleOAuthRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || (
    process.env.NODE_ENV === 'production'
      ? 'https://smart-campus-o8y3.onrender.com/api/auth/google/callback'
      : 'http://localhost:8080/api/auth/google/callback'
  ),
  frontendUrl: process.env.FRONTEND_URL || (
    process.env.NODE_ENV === 'production'
      ? 'https://smart-campus-ten-eta.vercel.app'
      : 'http://localhost:5173'
  ),
  authMaxFailedAttempts: Number(process.env.AUTH_MAX_FAILED_ATTEMPTS || 3),
  authLockoutMinutes: Number(process.env.AUTH_LOCKOUT_MINUTES || 15),
};

export const INSECURE_FALLBACK_SECRETS: string[] & { sessionSecret: string; deviceApiKey: string } = Object.assign(
  [
    'campus_ops_session_super_secret_key_2026',
    'password123',
    'change_me_in_production_secret_fixture',
    DEFAULT_DEV_DEVICE_API_KEY,
  ],
  {
    sessionSecret: 'campus_ops_session_super_secret_key_2026',
    deviceApiKey: DEFAULT_DEV_DEVICE_API_KEY,
  }
);

/**
 * Validates configuration for LIVE or production modes (SEC-LOW-01 & SEC-MED-02).
 * Fails closed if production security invariants are violated.
 */
export function validateProductionConfig(cfg: ServerConfig = config): void {
  const isProd = cfg.environment === 'production';
  const isLive = cfg.realtimeMode === 'live';

  if (isProd || isLive) {
    if (!cfg.sessionSecret || INSECURE_FALLBACK_SECRETS.includes(cfg.sessionSecret)) {
      throw new Error(
        'SECURITY_CONFIG_VIOLATION: Production and LIVE operations cannot run with missing or default SESSION_SECRET. Provide an explicit cryptographic secret via environment variable.'
      );
    }

    if (!cfg.deviceApiKey || INSECURE_FALLBACK_SECRETS.includes(cfg.deviceApiKey)) {
      throw new Error(
        'SECURITY_CONFIG_VIOLATION: Production and LIVE operations cannot run with missing or default DEVICE_API_KEY. Provide a dedicated hardware secret via environment variable.'
      );
    }

    if (cfg.corsOrigin === '*') {
      throw new Error(
        'SECURITY_CONFIG_VIOLATION: Production and LIVE operations cannot permit wildcard CORS (*). Specify explicit trusted origin(s).'
      );
    }
  }
}

export default config;
