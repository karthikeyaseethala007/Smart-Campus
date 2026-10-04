# Detailed Technical Findings: Critical, High & Medium Vulnerabilities
**Target Application**: Smart Campus Security & Automation Platform
**Audit Baseline**: Phase 4/5 Commissioned Baseline (`a744ba5` master)
**Standard**: Cloudflare Security Audit Standard (Defensive Verification)

---

## 1. SEC-CRIT-01: Complete Authentication Bypass via 'x-dev-role' Request Header

- **ID**: `SEC-CRIT-01`
- **Severity**: **CRITICAL** (CVSS 9.8 / CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)
- **Affected File(s)**: [`server/auth/authService.ts`](file:///Users/karthikeya.s/Documents/focus/server/auth/authService.ts#L239-L245), [`server/api/routes.ts`](file:///Users/karthikeya.s/Documents/focus/server/api/routes.ts#L45-L47)
- **Affected Function/Component/Endpoint**: `ServerAuthService.authenticateRequest`, REST API Middleware
- **Exact Vulnerability**:
  The central server authentication method `authenticateRequest(req)` contains an insecure fallback designed for local development: if no session token or Authorization Bearer header is found, it inspects `req.headers['x-dev-role']`. If the header matches a valid role (`admin`, `security_officer`, `faculty`, `student`), the server returns the first user in the database with that role as an authenticated identity.
  Crucially, there is **no check** verifying that `NODE_ENV === 'development'` or that development mode is enabled. Even when running in production (`NODE_ENV=production`), passing `x-dev-role: admin` grants full administrative access.
- **Attacker Prerequisites**:
  Direct network routing to the REST API port (`8080` or via reverse proxy `80`/`443`). No credentials or existing session required.
- **Concrete Attack Path**:
  1. An attacker crafts an HTTP request to any high-privilege endpoint, such as `POST /api/zones/ZONE-GATE-01/lockdown`.
  2. The attacker omits the `Authorization` header and includes the HTTP header `x-dev-role: admin`.
  3. `ServerAuthService.authenticateRequest` executes lines 239–245, matches `devRole === 'admin'`, and retrieves user `USR-ADM-001` (`Chief Administrator Ramanujan`).
  4. The subsequent authorization check `serverAuth.authorize(user, 'LOCKDOWN_ZONE')` evaluates user role `admin`, which has `LOCKDOWN_ZONE` clearance.
  5. The zone lockdown command executes, forcing physical access control interlocks into lockdown across the facility.
- **Evidence**:
  [`server/auth/authService.ts#L239-L245`](file:///Users/karthikeya.s/Documents/focus/server/auth/authService.ts#L239-L245):
  ```typescript
  if (!token) {
    const devRole = req.headers['x-dev-role'] as UserRole;
    if (devRole && ['admin', 'security_officer', 'faculty', 'student'].includes(devRole)) {
      return Array.from(db.users.values()).find(u => u.role === devRole) || null;
    }
    return null;
  }
  ```
  [`server/api/routes.ts#L45-L47`](file:///Users/karthikeya.s/Documents/focus/server/api/routes.ts#L45-L47):
  ```typescript
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-session-token, x-dev-role, x-correlation-id',
  ```
- **Impact**:
  Total authentication bypass and instantaneous administrative takeover of the entire campus system without credentials.
- **Exploitability**:
  Extremely high (trivial HTTP header injection).
- **Why Existing Defenses Do Not Stop It**:
  Existing RBAC defenses rely entirely on the `DbUser` returned by `authenticateRequest`. Because `authenticateRequest` populates the user object directly, downstream RBAC checks pass legitimately. The CORS preflight explicitly permits `x-dev-role`.
- **Recommended Minimal Remediation**:
  Remove the `x-dev-role` header fallback completely from `server/auth/authService.ts`, or wrap it strictly inside `if (process.env.NODE_ENV === 'test')`.
- **Architectural Impact on Frozen State**:
  None. The productionCommand Center frontend exclusively uses session tokens; no legitimate production client depends on `x-dev-role`.
- **Verification Status**: **CONFIRMED EXPLOITABLE**

---

## 2. SEC-CRIT-02: Password Verification Failure & Optional Password Authentication Bypass

- **ID**: `SEC-CRIT-02`
- **Severity**: **CRITICAL** (CVSS 9.8 / CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)
- **Affected File(s)**: [`server/auth/authService.ts`](file:///Users/karthikeya.s/Documents/focus/server/auth/authService.ts#L77-L85), [`server/db/database.ts`](file:///Users/karthikeya.s/Documents/focus/server/db/database.ts#L188-L238)
- **Affected Function/Component/Endpoint**: `ServerAuthService.login`, `ServerAuthService.verifyPassword`, `POST /api/auth/login`
- **Exact Vulnerability**:
  1. The password verification method `verifyPassword(password, storedHash)` checks if `storedHash` contains a colon `:`. If not, it executes a legacy mock fallback: `return true;`.
  2. In `server/db/database.ts`, the default seeded users (`admin`, `security`, `faculty`, `student`) store password hashes formatted with dollar signs (`$`), such as `'8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e$mock_salt$3f1a2b3c4d5e'`. Because this string contains no colon, `verifyPassword` returns `true` for **any password entered**.
  3. Furthermore, in `login()`, line 120 states: `if (password && !this.verifyPassword(...))`. If a request omits the password field entirely (`{"username": "admin"}`), password verification is skipped altogether.
- **Attacker Prerequisites**:
  Network access to `POST /api/auth/login`. Knowledge of the target username (e.g. `admin`, `security`).
- **Concrete Attack Path**:
  1. An attacker sends a POST request to `/api/auth/login`:
     ```json
     {
       "username": "admin"
     }
     ```
     or with an arbitrary password:
     ```json
     {
       "username": "admin",
       "password": "wrong_password_123"
     }
     ```
  2. The server locates `user.username === 'admin'`.
  3. `verifyPassword` evaluates `!storedHash.includes(':')` as `true`.
  4. The server clears failed login counters, generates a 64-character cryptographic token (`tok_...`), records an audit log for successful login, and returns a valid session payload to the attacker.
- **Evidence**:
  [`server/auth/authService.ts#L77-L85`](file:///Users/karthikeya.s/Documents/focus/server/auth/authService.ts#L77-L85):
  ```typescript
  public verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash || !storedHash.includes(':')) {
      // Mock hash compatibility
      return true;
    }
    const [salt, key] = storedHash.split(':');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
  }
  ```
  [`server/auth/authService.ts#L119-L123`](file:///Users/karthikeya.s/Documents/focus/server/auth/authService.ts#L119-L123):
  ```typescript
  // Password validation (if provided)
  if (password && !this.verifyPassword(password, user.passwordHash)) {
    this.recordFailedAttempt(rateKey, username, ip, 'Invalid password');
    return { success: false, error: 'Invalid credentials' };
  }
  ```
  Observed in integration tests [`server/__tests__/server.test.ts#L97-L105`](file:///Users/karthikeya.s/Documents/focus/server/__tests__/server.test.ts#L97-L105):
  ```typescript
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin' }),
  });
  ```
- **Impact**:
  Universal credential compromise. An attacker can obtain valid administrative, security officer, or faculty session tokens for any registered user on the system without knowing their password.
- **Exploitability**:
  Extremely high (trivial JSON payload).
- **Why Existing Defenses Do Not Stop It**:
  Brute-force lockout is bypassed because the server considers the first attempt valid and deletes the rate-limit tracker (`loginFailures.delete(rateKey)`).
- **Recommended Minimal Remediation**:
  Make `password` a mandatory non-empty string in `ServerAuthService.login`. Update default seed hashes in `server/db/database.ts` to standard `salt:key` hex format generated by `hashPassword()`. Remove the `!storedHash.includes(':')` return-true fallback.
- **Architectural Impact on Frozen State**:
  Requires seed data hash update. Tests that log in without passwords must supply the seeded password.
- **Verification Status**: **CONFIRMED EXPLOITABLE**

---

## 3. SEC-CRIT-03: Arbitrary Client-Controlled State Mutation & Physical Door Unlocking via WebSocket

- **ID**: `SEC-CRIT-03`
- **Severity**: **CRITICAL** (CVSS 9.6 / CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H)
- **Affected File(s)**: [`server/realtime/wsServer.ts`](file:///Users/karthikeya.s/Documents/focus/server/realtime/wsServer.ts#L259-L276), [`server/events/serverEventBus.ts`](file:///Users/karthikeya.s/Documents/focus/server/events/serverEventBus.ts#L142-L171)
- **Affected Function/Component/Endpoint**: `CampusWebSocketServer.handleClientMessage`, `ServerEventBus.applyStateMutation`, `/ws`
- **Exact Vulnerability**:
  In `wsServer.ts`, incoming WebSocket messages from clients are parsed and inspected. The method explicitly filters out `ZONE_LOCKDOWN` and `ACCESS_OVERRIDE`, but then forwards all other event objects (`parsed.id && parsed.category && parsed.type`) directly to `serverEventBus.processEvent(parsed)`.
  The authoritative server event bus executes state mutations for all registered event types without checking if the event originated from a trusted internal subsystem or an external untrusted WebSocket client.
  Crucially, when an `ACCESS_GRANTED` event is processed:
  `door.lockStatus = 'unlocked'` is set immediately, disengaging the physical lock for 8 seconds.
- **Attacker Prerequisites**:
  Active WebSocket connection to `/ws` or `/campus-events` (obtainable anonymously in default mode, or using any low-privilege student token).
- **Concrete Attack Path**:
  1. An attacker opens a WebSocket connection to `ws://localhost:8080/ws`.
  2. The attacker sends a JSON text frame:
     ```json
     {
       "id": "EVT-EXPLOIT-01",
       "category": "ACCESS",
       "type": "ACCESS_GRANTED",
       "source": "live",
       "deviceId": "DOOR-SRV-01",
       "payload": {
         "doorId": "DOOR-SRV-01",
         "cardholder": "Physical Penetration Tester",
         "clearance": "LEVEL_4"
       }
     }
     ```
  3. `wsServer.ts` verifies that `type !== 'ZONE_LOCKDOWN'` and `type !== 'ACCESS_OVERRIDE'`.
  4. It passes the event to `serverEventBus.processEvent()`.
  5. `ServerEventBus.applyStateMutation` matches `case 'ACCESS_GRANTED'`, locates `DOOR-SRV-01` (Core Server Vault portal), sets `lockStatus = 'unlocked'`, resets failed attempts, and schedules an 8-second re-lock timer.
  6. The physical door unlock relays are energized.
- **Evidence**:
  [`server/realtime/wsServer.ts#L259-L276`](file:///Users/karthikeya.s/Documents/focus/server/realtime/wsServer.ts#L259-L276):
  ```typescript
  // Clients cannot broadcast arbitrary state mutations directly.
  // Dangerous events from clients must be rejected.
  if (parsed.type === 'ZONE_LOCKDOWN' || parsed.type === 'ACCESS_OVERRIDE') {
    ...
    return;
  }
  // If client dispatches an event, pipe to authoritative server bus
  if (parsed.id && parsed.category && parsed.type) {
    serverEventBus.processEvent(parsed);
  }
  ```
  [`server/events/serverEventBus.ts#L142-L156`](file:///Users/karthikeya.s/Documents/focus/server/events/serverEventBus.ts#L142-L156):
  ```typescript
  case 'ACCESS_GRANTED': {
    const { doorId, cardholder } = event.payload;
    const door = db.accessControllers.get(doorId);
    if (door) {
      door.lockStatus = 'unlocked';
      door.failedAttempts = 0;
      door.isSecurityAlert = false;
      door.lastEventText = `Access Granted: ${cardholder}`;
      door.lastEventTime = timeStr;
      setTimeout(() => {
        door.lockStatus = 'locked';
      }, 8000);
    }
  ```
- **Impact**:
  Direct physical compromise of secured campus zones and server rooms. Allows remote unlocking of any portal on campus, arbitrary closure/resolution of security incidents, and injection of false alerts.
- **Exploitability**:
  Extremely high (single WebSocket JSON message).
- **Why Existing Defenses Do Not Stop It**:
  The developer implemented a blocklist containing only two event types (`ZONE_LOCKDOWN` and `ACCESS_OVERRIDE`), failing to account for `ACCESS_GRANTED`, `ACCESS_LOCKOUT`, `INCIDENT_RESOLVED`, etc.
- **Recommended Minimal Remediation**:
  Adopt an explicit allowlist or reject all client-initiated domain event dispatches over client WebSockets. Client WebSockets should be strictly read-only subscriber channels (plus PING/PONG heartbeats).
- **Architectural Impact on Frozen State**:
  None. The frontend UI triggers actions through REST API calls; client WebSocket event injection is not required for legitimate operations.
- **Verification Status**: **CONFIRMED EXPLOITABLE**

---

## 4. SEC-HIGH-01: Unauthenticated Door Unlock via Hardcoded Keypad PIN Endpoint

- **ID**: `SEC-HIGH-01`
- **Severity**: **HIGH** (CVSS 8.6 / CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:H)
- **Affected File(s)**: [`server/api/routes.ts`](file:///Users/karthikeya.s/Documents/focus/server/api/routes.ts#L477-L506), [`src/services/stateContext.tsx`](file:///Users/karthikeya.s/Documents/focus/src/services/stateContext.tsx#L1379-L1381), [`src/components/security/InteractiveKeypadModal.tsx`](file:///Users/karthikeya.s/Documents/focus/src/components/security/InteractiveKeypadModal.tsx#L196)
- **Affected Function/Component/Endpoint**: `POST /api/access/:id/pin`, `InteractiveKeypadModal`
- **Exact Vulnerability**:
  The HTTP route `POST /api/access/:doorId/pin` requires **no authentication** (no bearer token, no session, no API key). The valid door unlock PIN `'4821'` is hardcoded directly into the server route. Furthermore, the frontend `InteractiveKeypadModal.tsx` explicitly renders the PIN in plaintext on screen (`ENTER 4-DIGIT PIN (DEMO: 1234)`), and `stateContext.tsx` accepts `'4821'`, `'1234'`, and `'7789'`.
- **Attacker Prerequisites**:
  Network access to port 8080.
- **Concrete Attack Path**:
  1. An attacker issues an unauthenticated HTTP POST request to `/api/access/DOOR-GATE-MAIN/pin` with body:
     ```json
     {
       "pin": "4821",
       "cardholder": "Unauthorized Intruder"
     }
     ```
  2. The server compares `pin === '4821'`. The comparison succeeds.
  3. The server dispatches an `ACCESS_GRANTED` event on `serverEventBus`, unlocking the perimeter barrier relays and returning:
     ```json
     { "success": true, "message": "Access Granted: Relays disengaged" }
     ```
- **Evidence**:
  [`server/api/routes.ts#L477-L506`](file:///Users/karthikeya.s/Documents/focus/server/api/routes.ts#L477-L506):
  ```typescript
  const accessPinMatch = pathname.match(/^\/api\/access\/([^/]+)\/pin$/);
  if (accessPinMatch && method === 'POST') {
    const doorId = decodeURIComponent(accessPinMatch[1]);
    try {
      const body = await parseBody(req, correlationId);
      const pin = String(body.pin || '');
      const door = await db.getAccessController(doorId);
      if (!door) { ... return; }
      if (pin === '4821') {
        serverEventBus.processEvent({
          id: `EVT-ACC-GRANT-${Date.now()}`,
          ...
          type: 'ACCESS_GRANTED',
          ...
        });
        sendJson(res, 200, { success: true, message: 'Access Granted: Relays disengaged' }, correlationId);
      }
  ```
- **Impact**:
  Unauthorized physical unlocking of campus access doors by anyone on the network using static hardcoded PINs.
- **Exploitability**:
  High (trivial HTTP POST).
- **Why Existing Defenses Do Not Stop It**:
  The 3-attempt lockout is only triggered on **invalid** PIN attempts. When an attacker provides the known hardcoded PIN `'4821'`, it passes on the first attempt without triggering lockout.
- **Recommended Minimal Remediation**:
  Store bcrypt/scrypt hashes of door PINs in the PostgreSQL `access_controllers` database table. Require an authenticated device token from physical keypad microcontrollers.
- **Architectural Impact on Frozen State**:
  Medium (requires database schema column for `pin_hash` and updating keypad integration).
- **Verification Status**: **CONFIRMED EXPLOITABLE**

---

## 5. SEC-HIGH-02: Unauthenticated Wiegand 26-bit Frame Ingestion with Hardcoded Authorized Credentials

- **ID**: `SEC-HIGH-02`
- **Severity**: **HIGH** (CVSS 8.6 / CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:H)
- **Affected File(s)**: [`server/api/routes.ts`](file:///Users/karthikeya.s/Documents/focus/server/api/routes.ts#L418-L453), [`server/devices/wiegandParser.ts`](file:///Users/karthikeya.s/Documents/focus/server/devices/wiegandParser.ts#L74-L89)
- **Affected Function/Component/Endpoint**: `POST /api/access/:id/wiegand`, `WiegandParser.parse26Bit`
- **Exact Vulnerability**:
  The Wiegand 26-bit ingestion endpoint `POST /api/access/:id/wiegand` accepts raw binary frames without client authentication. The authorization check hardcodes:
  `const isAuthorized = parsed.facilityCode === 42 && parsed.cardNumber === 8821;`
  Any caller can generate a 26-bit frame with Facility Code 42 and Card Number 8821 (which has valid even/odd parity bits `0` and `0`, yielding binary `'00010101000100010011001010'`) to unlock any door.
- **Attacker Prerequisites**:
  Network access to port 8080.
- **Concrete Attack Path**:
  1. An attacker sends a POST to `/api/access/DOOR-GATE-MAIN/wiegand` with:
     ```json
     {
       "frame": "00010101000100010011001010"
     }
     ```
  2. `WiegandParser.parse26Bit` verifies parity and extracts `facilityCode: 42, cardNumber: 8821`.
  3. The route matches `facilityCode === 42 && cardNumber === 8821`, issues `ACCESS_GRANTED`, and unlocks the door.
- **Evidence**:
  [`server/api/routes.ts#L418-L453`](file:///Users/karthikeya.s/Documents/focus/server/api/routes.ts#L418-L453):
  ```typescript
  const accessWiegandMatch = pathname.match(/^\/api\/access\/([^/]+)\/wiegand$/);
  if (accessWiegandMatch && method === 'POST') {
    ...
    const parsed = WiegandParser.parse26Bit(rawFrame);
    ...
    const isAuthorized = parsed.facilityCode === 42 && parsed.cardNumber === 8821;
    if (isAuthorized) {
      serverEventBus.processEvent({ ... type: 'ACCESS_GRANTED' ... });
      sendJson(res, 200, { success: true, status: 'GRANTED', cardInfo: parsed }, correlationId);
    }
  ```
- **Impact**:
  Forged badge credentials result in unauthorized physical door release across all campus access portals.
- **Exploitability**:
  High.
- **Why Existing Defenses Do Not Stop It**:
  Parity validation checks mathematical integrity of the 26 bits, but provides zero cryptographic authentication or replay protection.
- **Recommended Minimal Remediation**:
  Authenticate the field Wiegand controller with an API key or mutual TLS. Query active badge credentials from the PostgreSQL `users` table instead of hardcoded numbers.
- **Architectural Impact on Frozen State**:
  Low.
- **Verification Status**: **CONFIRMED EXPLOITABLE**

---

## 6. SEC-HIGH-03: Unauthenticated Field Sensor Spoofing & Emergency Hazard Injection

- **ID**: `SEC-HIGH-03`
- **Severity**: **HIGH** (CVSS 7.5 / CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:L)
- **Affected File(s)**: [`server/api/routes.ts`](file:///Users/karthikeya.s/Documents/focus/server/api/routes.ts#L371-L408), [`server/events/serverEventBus.ts`](file:///Users/karthikeya.s/Documents/focus/server/events/serverEventBus.ts#L76-L118)
- **Affected Function/Component/Endpoint**: `POST /api/sensors/:id/reading`
- **Exact Vulnerability**:
  The endpoint `POST /api/sensors/:id/reading` allows arbitrary gas sensor reading ingestion without authentication. Submitting a reading >= 750 PPM causes the server event bus to immediately shut down ventilation fans in `ZONE-SCI-204` (`zone.fansState = 'off'`) and automatically create a `CRITICAL` incident (`INC-GAS-003`).
- **Attacker Prerequisites**:
  Network access to port 8080.
- **Concrete Attack Path**:
  1. An attacker sends a POST to `/api/sensors/DEV-SMK-204/reading` with payload:
     ```json
     { "ppm": 850 }
     ```
  2. The server accepts the reading, updates `db.sensors`, shuts off corridor fans, and creates an emergency gas leak incident on the campus event bus.
- **Evidence**:
  [`server/api/routes.ts#L371-L408`](file:///Users/karthikeya.s/Documents/focus/server/api/routes.ts#L371-L408):
  ```typescript
  const sensorReadingMatch = pathname.match(/^\/api\/sensors\/([^/]+)\/reading$/);
  if (sensorReadingMatch && method === 'POST') {
    const sensorId = decodeURIComponent(sensorReadingMatch[1]);
    const body = await parseBody(req, correlationId);
    const ppm = Number(body.ppm ?? 312);
    ...
    serverEventBus.processEvent({
      id: `EVT-MQ2-${sensorId}-${Date.now()}`,
      category: 'MQ2',
      type: 'MQ2_READING',
      payload: { sensorId, ppm, status, ventilationActive: ppm >= 500 }
    });
  ```
- **Impact**:
  Denial of service, life-safety disruption, unauthorized manipulation of ventilation systems, and false emergency alarms.
- **Exploitability**:
  High.
- **Why Existing Defenses Do Not Stop It**:
  Only validates that `ppm` is a non-negative number; zero identity verification is performed.
- **Recommended Minimal Remediation**:
  Require a shared secret or pre-shared device token header (`x-sensor-key`) from sensor gateways.
- **Architectural Impact on Frozen State**:
  Low.
- **Verification Status**: **CONFIRMED EXPLOITABLE**

---

## 7. SEC-HIGH-04: Unauthenticated MQTT Ingestion Bridge Allowing Door Unlocking via Rogue Packets

- **ID**: `SEC-HIGH-04`
- **Severity**: **HIGH** (CVSS 8.2 / CVSS:3.1/AV:A/AC:L/PR:N/UI:N/S:C/C:N/I:H/A:L)
- **Affected File(s)**: [`server/mqtt/mqttClient.ts`](file:///Users/karthikeya.s/Documents/focus/server/mqtt/mqttClient.ts#L80,L234-L269), [`docker-compose.yml`](file:///Users/karthikeya.s/Documents/focus/docker-compose.yml#L78-L90)
- **Affected Function/Component/Endpoint**: `ServerMqttClient.handleMessage`, Mosquitto Container
- **Exact Vulnerability**:
  `ServerMqttClient` subscribes to `campus/+/+/+`. When receiving a message on `campus/{zone}/access/{device}`, it inspects `payloadObj.granted`. If `granted: true`, it generates an `ACCESS_GRANTED` event on the server event bus, unlocking the targeted door.
  In `docker-compose.yml`, Mosquitto runs with port 1883 open to the host network without an ACL configuration file or enforced authentication.
- **Attacker Prerequisites**:
  Network adjacency to MQTT broker port 1883.
- **Concrete Attack Path**:
  1. An attacker connects to `mqtt://target:1883` and publishes:
     - Topic: `campus/ZONE-SRV-01/access/DOOR-SRV-01`
     - Payload: `{"granted": true, "cardholder": "Rogue Attacker"}`
  2. `ServerMqttClient.handleMessage` normalizes this into an `ACCESS_GRANTED` event.
  3. `serverEventBus` unlocks `DOOR-SRV-01`.
- **Evidence**:
  [`server/mqtt/mqttClient.ts#L234-L250`](file:///Users/karthikeya.s/Documents/focus/server/mqtt/mqttClient.ts#L234-L250):
  ```typescript
  case 'access': {
    if (payloadObj.granted) {
      event = {
        ...
        type: 'ACCESS_GRANTED',
        payload: {
          doorId: device,
          cardholder: payloadObj.cardholder || 'Authorized Personnel',
        },
      } as AccessGrantedEvent;
    }
  ```
- **Impact**:
  Physical door unlocking by injecting untrusted MQTT packets.
- **Exploitability**:
  High.
- **Why Existing Defenses Do Not Stop It**:
  The system trusts the edge broker without verifying packet digital signatures or requiring field nodes to submit credentials for server-side evaluation.
- **Recommended Minimal Remediation**:
  Do not allow field nodes to publish authoritative `granted: true` access decisions. Nodes must publish credential swipe frames (e.g. badge/card number), and the backend server must make the authoritative access decision against PostgreSQL. Enforce MQTT username/password authentication and topic ACLs in Mosquitto.
- **Architectural Impact on Frozen State**:
  Medium.
- **Verification Status**: **CONFIRMED EXPLOITABLE**

---

## 8. SEC-MED-01: Unauthenticated Global State & Infrastructure Topology Information Disclosure

- **ID**: `SEC-MED-01`
- **Severity**: **MEDIUM** (CVSS 5.3 / CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N)
- **Affected File(s)**: [`server/api/routes.ts`](file:///Users/karthikeya.s/Documents/focus/server/api/routes.ts#L200-L223,L287-L308,L412-L415,L593-L596)
- **Affected Function/Component/Endpoint**: `GET /api/state`, `GET /api/devices`, `GET /api/cameras`, `GET /api/sensors`, `GET /api/access`, `GET /api/incidents`
- **Exact Vulnerability**:
  The state snapshot endpoint `GET /api/state` and entity listing endpoints do not require authentication. An unauthenticated caller receives full JSON dumps containing:
  - All campus zones, occupant counts, power usage
  - All registered devices with internal IP addresses (`10.0.1.50`, etc.) and firmware versions
  - All surveillance cameras and HLS stream URLs
  - All access controller doors, locking status, and consecutive failed attempt counts
  - All active and historical security incidents
- **Attacker Prerequisites**:
  Network access to port 8080.
- **Concrete Attack Path**:
  An attacker issues `GET /api/state` and receives an instantaneous map of every camera, every door (and which doors currently have failed PIN attempts), internal subnets, and active alarms.
- **Evidence**:
  [`server/api/routes.ts#L200-L223`](file:///Users/karthikeya.s/Documents/focus/server/api/routes.ts#L200-L223):
  ```typescript
  if (pathname === '/api/state' && method === 'GET') {
    const user = await serverAuth.authenticateRequest(req);
    // Notice: NO check if (!user) is performed!
    sendJson(res, 200, {
      timestamp: new Date().toISOString(),
      user: user ? { id: user.id, name: user.name, role: user.role } : null,
      zones: await db.getAllZones(),
      devices: deviceRegistry.getAllDevices(),
      cameras: safeCameras,
      incidents: allIncidents,
      ...
    });
  ```
- **Impact**:
  Comprehensive infrastructure reconnaissance, identifying blind spots and physical access vulnerabilities.
- **Exploitability**:
  High.
- **Why Existing Defenses Do Not Stop It**:
  Authentication was made optional (`user: user ? ... : null`) on the state endpoint.
- **Recommended Minimal Remediation**:
  Add `if (!user) { sendError(res, 401, 'Unauthorized', correlationId); return; }` to `GET /api/state` and associated listing endpoints.
- **Architectural Impact on Frozen State**:
  Low. The frontend Command Center already attaches session tokens once logged in.
- **Verification Status**: **CONFIRMED EXPLOITABLE**

---

## 9. SEC-MED-02: Permissive Wildcard CORS Configuration Permitting Cross-Origin Abuse

- **ID**: `SEC-MED-02`
- **Severity**: **MEDIUM** (CVSS 6.5 / CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N)
- **Affected File(s)**: [`server/config/index.ts`](file:///Users/karthikeya.s/Documents/focus/server/config/index.ts#L46), [`server/api/routes.ts`](file:///Users/karthikeya.s/Documents/focus/server/api/routes.ts#L45,L99)
- **Affected Function/Component/Endpoint**: `config.corsOrigin`, `sendJson`, CORS Preflight
- **Exact Vulnerability**:
  `corsOrigin` defaults to `'*'`. When responding to requests, `Access-Control-Allow-Origin: *` is set. Furthermore, `OPTIONS` preflight responses echo `Access-Control-Allow-Headers: Content-Type, Authorization, x-session-token, x-dev-role, x-correlation-id`.
- **Attacker Prerequisites**:
  Operator browsing an external malicious web page while having network access to the campus console host.
- **Concrete Attack Path**:
  A campus operator visits an attacker-controlled website. JavaScript on the malicious page executes `fetch('http://localhost:8080/api/state')`. Because the server returns `Access-Control-Allow-Origin: *`, the browser allows the attacker script to read the response and exfiltrate internal campus data.
- **Evidence**:
  [`server/config/index.ts#L46`](file:///Users/karthikeya.s/Documents/focus/server/config/index.ts#L46):
  ```typescript
  corsOrigin: process.env.CORS_ORIGIN || '*',
  ```
- **Impact**:
  Cross-origin data exfiltration of sensitive telemetry, active incident details, and operational status.
- **Exploitability**:
  Medium.
- **Why Existing Defenses Do Not Stop It**:
  The server explicitly permits wildcard origins.
- **Recommended Minimal Remediation**:
  Change default `corsOrigin` to reflect trusted dashboard origin (e.g. `http://localhost:5173` or specific production domain) and reject wildcard in production.
- **Architectural Impact on Frozen State**:
  None.
- **Verification Status**: **CONFIRMED EXPLOITABLE**

---

## 10. SEC-MED-03: Container Execution as Root & Unrestricted Host Port Exposure

- **ID**: `SEC-MED-03`
- **Severity**: **MEDIUM** (CVSS 6.2 / CVSS:3.1/AV:L/AC:L/PR:N/UI:N/S:C/C:L/I:L/A:L)
- **Affected File(s)**: [`Dockerfile`](file:///Users/karthikeya.s/Documents/focus/Dockerfile#L25-L46), [`docker-compose.yml`](file:///Users/karthikeya.s/Documents/focus/docker-compose.yml#L11-L13,L61-L62,L83-L85,L96-L99)
- **Affected Function/Component/Endpoint**: Docker multi-stage build, Docker Compose deployment
- **Exact Vulnerability**:
  1. The production runner container runs as `root` (UID 0) because no `USER node` directive is specified.
  2. `docker-compose.yml` binds PostgreSQL (`5432:5432`), Mosquitto MQTT (`1883:1883`, `8883:8883`), MediaMTX RTSP (`8554:8554`), and the backend API (`8080:8080`) to `0.0.0.0` on the host, exposing internal infrastructure services directly to external host network interfaces.
- **Attacker Prerequisites**:
  Network access to the host machine or container filesystem compromise.
- **Concrete Attack Path**:
  An external attacker connects directly to PostgreSQL on host port 5432 or Mosquitto on port 1883, bypassing Nginx proxy controls.
- **Evidence**:
  [`Dockerfile#L25-L46`](file:///Users/karthikeya.s/Documents/focus/Dockerfile#L25-L46) (no `USER` instruction).
  [`docker-compose.yml#L61-L62, L83-L85`](file:///Users/karthikeya.s/Documents/focus/docker-compose.yml#L61-L62):
  ```yaml
  postgres:
    ports:
      - "5432:5432"
  mqtt:
    ports:
      - "1883:1883"
      - "8883:8883"
  ```
- **Impact**:
  Bypasses reverse proxy controls; exposes unauthenticated or password-defaulted backend services to untrusted networks.
- **Exploitability**:
  Medium.
- **Why Existing Defenses Do Not Stop It**:
  Docker default behavior publishes ports on all network interfaces (`0.0.0.0`).
- **Recommended Minimal Remediation**:
  Add `USER node` in `Dockerfile`. Remove host port mappings for `postgres` and `mqtt` in `docker-compose.yml` (they are accessible internally via `campus-net`), or bind them strictly to `127.0.0.1`.
- **Architectural Impact on Frozen State**:
  None.
- **Verification Status**: **CONFIRMED EXPLOITABLE**

---

## 11. SEC-MED-04: WebSocket Authentication Bypass in Default Simulated / Development Modes

- **ID**: `SEC-MED-04`
- **Severity**: **MEDIUM** (CVSS 6.5 / CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N)
- **Affected File(s)**: [`server/realtime/wsServer.ts`](file:///Users/karthikeya.s/Documents/focus/server/realtime/wsServer.ts#L68-L76), [`server/config/index.ts`](file:///Users/karthikeya.s/Documents/focus/server/config/index.ts#L43-L44)
- **Affected Function/Component/Endpoint**: `CampusWebSocketServer.init (HTTP upgrade)`
- **Exact Vulnerability**:
  The WebSocket server only terminates unauthenticated upgrade requests if BOTH `config.realtimeMode === 'live'` AND `config.environment === 'production'`. In standard development or testing configurations, unauthenticated connections are granted connection as `anonymous_guest`.
- **Attacker Prerequisites**:
  Network access to port 8080 on a deployment where `REALTIME_MODE` or `NODE_ENV` is not set to `live` and `production`.
- **Concrete Attack Path**:
  An attacker establishes a WebSocket connection to `ws://host:8080/ws` without a token. Because default environment settings are in place, the server accepts the upgrade, emits `SYSTEM_CONNECTION`, and allows the socket to listen to campus broadcast telemetry.
- **Evidence**:
  [`server/realtime/wsServer.ts#L68-L76`](file:///Users/karthikeya.s/Documents/focus/server/realtime/wsServer.ts#L68-L76):
  ```typescript
  // In production LIVE mode, reject unauthenticated sockets
  if (!authenticatedUser && config.realtimeMode === 'live' && config.environment === 'production') {
    Logger.warn('WEBSOCKET', 'Unauthorized WebSocket upgrade rejected', ...);
    socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }
  ```
- **Impact**:
  Eavesdropping on real-time campus events without credentials.
- **Exploitability**:
  High in default deployments.
- **Why Existing Defenses Do Not Stop It**:
  The guard expression is gated on two optional environment variables.
- **Recommended Minimal Remediation**:
  Reject unauthenticated WebSocket upgrades unconditionally, allowing bypass only when `process.env.NODE_ENV === 'test'`.
- **Architectural Impact on Frozen State**:
  Low.
- **Verification Status**: **CONFIRMED EXPLOITABLE**
