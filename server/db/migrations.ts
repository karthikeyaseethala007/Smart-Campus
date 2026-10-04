import { db, type MigrationResult } from './database';
import { Logger } from '../utils/logger';

export { MigrationResult };

export class MigrationRunner {
  public static async runMigrations(): Promise<MigrationResult> {
    try {
      const result = await db.runMigrations();
      Logger.info('DATABASE', `Migrations completed: ${result.appliedTables.length} tables verified`, {
        details: { version: result.version, durationMs: result.durationMs },
      });
      return result;
    } catch (err: any) {
      Logger.error('DATABASE', `Migration execution failure: ${err.message}`, {
        errorClassification: 'MIGRATION_ERROR',
        details: { message: err.message },
      });
      return {
        success: false,
        version: 'error',
        appliedTables: [],
        durationMs: 0,
      };
    }
  }
}

export default MigrationRunner;
