import http from 'node:http';
import { config, validateProductionConfig } from './config';
import { handleApiRequest } from './api/routes';
import { wsGateway } from './realtime/wsServer';
import { MigrationRunner } from './db/migrations';
import { db } from './db/database';

export interface ServerInstance {
  httpServer: http.Server;
  port: number;
  close: () => Promise<void>;
}

export async function createCampusServer(portOverride?: number): Promise<ServerInstance> {
  // 0. Fail-Closed Validation for Production / LIVE Configuration
  validateProductionConfig(config);

  // 1. Run Migrations & Ensure Schema/Data Baseline
  const migrationResult = await MigrationRunner.runMigrations();
  if (migrationResult.success) {
    console.log(`[CampusServer] Migrations verified: ${migrationResult.appliedTables.length} tables active (${migrationResult.durationMs}ms)`);
  }

  // 2. Instantiate HTTP Server
  const httpServer = http.createServer((req, res) => {
    handleApiRequest(req, res).catch(err => {
      console.error('[CampusServer] Unhandled request error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
  });

  // 3. Attach Production WebSocket Gateway on /ws
  wsGateway.init(httpServer);

  // 4. Update Database Health Status for API
  const apiHealth = db.healthRecords.get('API');
  if (apiHealth) {
    apiHealth.status = 'HEALTHY';
    apiHealth.lastHeartbeat = new Date().toISOString();
    apiHealth.details = 'REST API Gateway Online';
  }

  const port = portOverride !== undefined ? portOverride : config.port;

  return new Promise((resolve) => {
    httpServer.listen(port, config.host, () => {
      const addr = httpServer.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : port;
      console.log(`[CampusServer] Production Backend listening on http://${config.host}:${actualPort}`);
      console.log(`[CampusServer] Realtime WebSocket active at ws://${config.host}:${actualPort}/ws`);
      console.log(`[CampusServer] Environment: ${config.environment} | Realtime Mode: ${config.realtimeMode}`);

      resolve({
        httpServer,
        port: actualPort,
        close: async () => {
          return new Promise<void>((resClose) => {
            wsGateway.close();
            httpServer.closeAllConnections?.();
            httpServer.close(() => {
              resClose();
            });
          });
        },
      });
    });
  });
}

// Auto-start when executed directly
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  createCampusServer().catch(err => {
    console.error('[CampusServer] Fatal startup failure:', err);
    process.exit(1);
  });
}

export default createCampusServer;
