-- =========================================================================
-- SMART CAMPUS SECURITY & AUTOMATION — PRODUCTION DATABASE SCHEMA
-- PostgreSQL Compatible Schema (UTC Timestamps, Append-Only Auditing)
-- =========================================================================

-- 1. USERS & IDENTITY
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    badge_number VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'security_officer', 'faculty', 'student')),
    clearance_level VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_badge ON users(badge_number);

-- 2. AUTHENTICATED SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 3. SPATIAL ZONES
CREATE TABLE IF NOT EXISTS zones (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor VARCHAR(50),
    is_lockdown_active BOOLEAN NOT NULL DEFAULT FALSE,
    occupancy_state VARCHAR(50) NOT NULL DEFAULT 'vacant',
    occupant_count INT NOT NULL DEFAULT 0,
    current_power_kw NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_zones_building ON zones(building);

-- 4. DEVICE REGISTRY
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('motion', 'smoke', 'fire', 'keypad', 'door_lock', 'light', 'fan', 'power_meter', 'camera')),
    zone_id VARCHAR(64) REFERENCES zones(id) ON DELETE SET NULL,
    location VARCHAR(200) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'warning', 'critical', 'disabled')),
    ip_address VARCHAR(45),
    firmware_version VARCHAR(50),
    battery_pct INT,
    signal_strength INT,
    metadata JSONB DEFAULT '{}'::jsonb,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devices_category ON devices(category);
CREATE INDEX IF NOT EXISTS idx_devices_zone_id ON devices(zone_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- 5. SURVEILLANCE CAMERAS
CREATE TABLE IF NOT EXISTS cameras (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    zone_id VARCHAR(64) REFERENCES zones(id) ON DELETE SET NULL,
    location VARCHAR(200) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'degraded', 'offline')),
    protocol VARCHAR(50) NOT NULL DEFAULT 'hls' CHECK (protocol IN ('rtsp', 'hls', 'webrtc', 'simulated')),
    stream_url TEXT,
    internal_rtsp_url TEXT, -- Server-side only; never exposed to browser
    resolution VARCHAR(50) NOT NULL DEFAULT '1080p 30Hz',
    fps INT NOT NULL DEFAULT 30,
    ptz_capable BOOLEAN NOT NULL DEFAULT FALSE,
    capabilities JSONB NOT NULL DEFAULT '{"ptz": false, "snapshot": true, "nightVision": false, "aiAnalytics": false}'::jsonb,
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cameras_zone_id ON cameras(zone_id);

-- 6. SENSORS (PIR, MQ-2, Environmental)
CREATE TABLE IF NOT EXISTS sensors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('MQ2', 'PIR', 'THERMAL', 'ENERGY')),
    zone_id VARCHAR(64) REFERENCES zones(id) ON DELETE SET NULL,
    location VARCHAR(200) NOT NULL,
    current_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) NOT NULL DEFAULT 'ppm',
    threshold_warning NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    threshold_critical NUMERIC(10, 2) NOT NULL DEFAULT 750.00,
    status VARCHAR(50) NOT NULL DEFAULT 'NORMAL' CHECK (status IN ('NORMAL', 'ELEVATED', 'CRITICAL', 'FAULT')),
    last_reading TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensors_type ON sensors(type);
CREATE INDEX IF NOT EXISTS idx_sensors_zone_id ON sensors(zone_id);

-- 7. ACCESS CONTROLLERS & SMART DOORS
CREATE TABLE IF NOT EXISTS access_controllers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    zone_id VARCHAR(64) REFERENCES zones(id) ON DELETE SET NULL,
    building VARCHAR(100) NOT NULL,
    lock_status VARCHAR(50) NOT NULL DEFAULT 'locked' CHECK (lock_status IN ('locked', 'unlocked')),
    keypad_status VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (keypad_status IN ('normal', 'alert', 'lockout')),
    failed_attempts INT NOT NULL DEFAULT 0,
    is_security_alert BOOLEAN NOT NULL DEFAULT FALSE,
    lockout_until TIMESTAMPTZ,
    last_event_text VARCHAR(255),
    last_event_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_access_controllers_zone_id ON access_controllers(zone_id);

-- 8. INCIDENTS (State Machine: DETECTED -> ACKNOWLEDGED -> INVESTIGATING -> RESOLVED)
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    zone_id VARCHAR(64),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    source VARCHAR(50) NOT NULL DEFAULT 'live' CHECK (source IN ('live', 'simulation', 'mqtt', 'wiegand', 'system')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'investigating', 'resolved')),
    assigned_officer VARCHAR(150),
    description TEXT NOT NULL,
    telemetry JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMPTZ,
    investigating_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);

-- 9. INCIDENT EVENTS TIMELINE (Append-Only)
CREATE TABLE IF NOT EXISTS incident_events (
    id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor VARCHAR(150) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incident_events_incident_id ON incident_events(incident_id);

-- 10. AUDIT RECORDS (Strictly Append-Only Security Trail)
CREATE TABLE IF NOT EXISTS audit_records (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(200) NOT NULL,
    result VARCHAR(50) NOT NULL CHECK (result IN ('SUCCESS', 'DENIED', 'FAILED', 'ESCALATED')),
    details TEXT NOT NULL,
    zone VARCHAR(150) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_records_timestamp ON audit_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_records_role ON audit_records(role);
CREATE INDEX IF NOT EXISTS idx_audit_records_result ON audit_records(result);

-- 11. OPERATIONAL ACTIVITY EVENTS (Operational Ring Buffer)
CREATE TABLE IF NOT EXISTS activity_events (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    resulting_action TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    source VARCHAR(50) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_events_timestamp ON activity_events(timestamp DESC);

-- 12. SYSTEM HEALTH TELEMETRY
CREATE TABLE IF NOT EXISTS system_health (
    component VARCHAR(50) PRIMARY KEY CHECK (component IN ('API', 'WEBSOCKET', 'MQTT', 'CAMERA_GATEWAY', 'DATABASE')),
    status VARCHAR(50) NOT NULL DEFAULT 'HEALTHY' CHECK (status IN ('HEALTHY', 'DEGRADED', 'OFFLINE', 'UNKNOWN')),
    latency_ms INT NOT NULL DEFAULT 0,
    reconnect_count INT NOT NULL DEFAULT 0,
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_error TEXT,
    details TEXT
);
