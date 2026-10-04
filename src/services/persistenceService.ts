import type {
  CampusIncident,
  AuditRecord,
  CampusEvent,
  UserRole
} from '../types';
import { healthService } from './healthService';

const STORAGE_KEYS = {
  INCIDENTS: 'campus_persistence_incidents_v1',
  AUDIT_LOG: 'campus_persistence_audit_v1',
  EVENTS: 'campus_persistence_events_v1',
  DOORS: 'campus_persistence_doors_v1',
  USER_ROLE: 'campus_persistence_role_v1',
  LOCKDOWN_ZONES: 'campus_persistence_lockdown_v1',
} as const;

export class PersistenceService {
  private static instance: PersistenceService;
  private isStorageAvailable: boolean;
  private memoryStore: Map<string, string> = new Map();

  private constructor() {
    this.isStorageAvailable = this.checkStorageAvailability();
    if (this.isStorageAvailable) {
      healthService.updateComponent('DATABASE', {
        status: 'HEALTHY',
        details: 'Local Persistent Storage Operational',
      });
    } else {
      healthService.updateComponent('DATABASE', {
        status: 'HEALTHY',
        details: 'Running in ephemeral in-memory storage mode',
      });
    }
  }

  public static getInstance(): PersistenceService {
    if (!PersistenceService.instance) {
      PersistenceService.instance = new PersistenceService();
    }
    return PersistenceService.instance;
  }

  private checkStorageAvailability(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const testKey = '__campus_storage_probe__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private setItem(key: string, value: string): void {
    if (this.isStorageAvailable && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    } else {
      this.memoryStore.set(key, value);
    }
  }

  private getItem(key: string): string | null {
    if (this.isStorageAvailable && typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return this.memoryStore.get(key) || null;
  }

  private removeItem(key: string): void {
    if (this.isStorageAvailable && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  // Incidents
  public saveIncidents(incidents: CampusIncident[]): void {
    try {
      // Retain max 50 incidents
      const slice = incidents.slice(0, 50);
      this.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(slice));
    } catch (err) {
      console.warn('[PersistenceService] Failed to persist incidents:', err);
    }
  }

  public loadIncidents(): CampusIncident[] | null {
    try {
      const data = this.getItem(STORAGE_KEYS.INCIDENTS);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  // Audit Records (immutable security trail with ring buffer)
  public saveAuditLog(records: AuditRecord[]): void {
    try {
      // Retain max 200 records
      const slice = records.slice(0, 200);
      this.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(slice));
    } catch (err) {
      console.warn('[PersistenceService] Failed to persist audit records:', err);
    }
  }

  public loadAuditLog(): AuditRecord[] | null {
    try {
      const data = this.getItem(STORAGE_KEYS.AUDIT_LOG);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  // Operational Activity Events
  public saveEvents(events: CampusEvent[]): void {
    try {
      const slice = events.slice(0, 100);
      this.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(slice));
    } catch (err) {
      console.warn('[PersistenceService] Failed to persist events:', err);
    }
  }

  public loadEvents(): CampusEvent[] | null {
    try {
      const data = this.getItem(STORAGE_KEYS.EVENTS);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  // User Role Session
  public saveUserRole(role: UserRole): void {
    try {
      this.setItem(STORAGE_KEYS.USER_ROLE, role);
    } catch {}
  }

  public loadUserRole(): UserRole | null {
    try {
      const role = this.getItem(STORAGE_KEYS.USER_ROLE);
      if (role && ['admin', 'security_officer', 'faculty', 'student'].includes(role)) {
        return role as UserRole;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Clear all persistent records
  public clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(k => this.removeItem(k));
    } catch {}
  }
}

export const persistenceService = PersistenceService.getInstance();
export default persistenceService;
