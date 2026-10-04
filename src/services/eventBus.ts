import type {
  CampusNormalizedEvent,
  CampusEventCategory,
  EventCallback
} from '../types/events';

export interface EventBusStats {
  totalProcessed: number;
  duplicateCount: number;
  invalidCount: number;
  lastEventTime?: string;
  activeSubscriptions: number;
}

export class CampusEventBus {
  private static instance: CampusEventBus;
  private subscribers: Map<string, Set<EventCallback<any>>> = new Map();
  private processedEventIds: Set<string> = new Set();
  private recentEventIdQueue: string[] = [];
  private maxCacheSize = 500;

  private stats: EventBusStats = {
    totalProcessed: 0,
    duplicateCount: 0,
    invalidCount: 0,
    activeSubscriptions: 0,
  };

  private constructor() {}

  public static getInstance(): CampusEventBus {
    if (!CampusEventBus.instance) {
      CampusEventBus.instance = new CampusEventBus();
    }
    return CampusEventBus.instance;
  }

  /**
   * Validates that an incoming object satisfies the minimum normalized event schema.
   */
  public isValidEvent(event: unknown): event is CampusNormalizedEvent {
    if (!event || typeof event !== 'object') return false;
    const candidate = event as Partial<CampusNormalizedEvent>;

    return (
      typeof candidate.id === 'string' &&
      candidate.id.trim().length > 0 &&
      typeof candidate.type === 'string' &&
      typeof candidate.category === 'string' &&
      typeof candidate.source === 'string' &&
      typeof candidate.severity === 'string' &&
      candidate.payload !== undefined
    );
  }

  /**
   * Subscribe to events by category, exact type, or wildcard '*'.
   * Returns an unsubscribe function.
   */
  public subscribe<T extends CampusNormalizedEvent = CampusNormalizedEvent>(
    channel: CampusEventCategory | T['type'] | '*',
    callback: EventCallback<T>
  ): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    const set = this.subscribers.get(channel)!;
    set.add(callback as EventCallback<any>);
    this.updateSubscriptionCount();

    return () => {
      set.delete(callback as EventCallback<any>);
      if (set.size === 0) {
        this.subscribers.delete(channel);
      }
      this.updateSubscriptionCount();
    };
  }

  /**
   * Dispatches an event to all relevant subscribers.
   * Handles deduplication, validation, and subscriber isolation.
   */
  public dispatch<T extends CampusNormalizedEvent>(event: T): boolean {
    if (!this.isValidEvent(event)) {
      this.stats.invalidCount++;
      console.warn('[EventBus] Dropped invalid event schema:', event);
      return false;
    }

    // Idempotency: Check if already processed
    if (this.processedEventIds.has(event.id)) {
      this.stats.duplicateCount++;
      return false;
    }

    // Cache event ID with LRU ring eviction
    this.processedEventIds.add(event.id);
    this.recentEventIdQueue.push(event.id);
    if (this.recentEventIdQueue.length > this.maxCacheSize) {
      const oldestId = this.recentEventIdQueue.shift();
      if (oldestId) this.processedEventIds.delete(oldestId);
    }

    this.stats.totalProcessed++;
    this.stats.lastEventTime = event.timestamp || new Date().toISOString();

    // Notify listeners:
    // 1. Wildcard listeners '*'
    // 2. Category listeners (e.g. 'CAMERA', 'ACCESS', 'MQ2')
    // 3. Exact type listeners (e.g. 'MQ2_READING', 'ACCESS_GRANTED')
    const targets: Set<EventCallback<any>> = new Set();

    const wildcardSet = this.subscribers.get('*');
    if (wildcardSet) wildcardSet.forEach(cb => targets.add(cb));

    const categorySet = this.subscribers.get(event.category);
    if (categorySet) categorySet.forEach(cb => targets.add(cb));

    const typeSet = this.subscribers.get(event.type);
    if (typeSet) typeSet.forEach(cb => targets.add(cb));

    targets.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error(`[EventBus] Error in subscriber for ${event.type}:`, err);
      }
    });

    return true;
  }

  /**
   * Helper to normalize a partial event object and dispatch it.
   */
  public emit<T extends CampusNormalizedEvent>(
    partial: Omit<T, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
  ): boolean {
    const timeStr = partial.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const id = partial.id || `EVT-${partial.category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const event = {
      ...partial,
      id,
      timestamp: timeStr,
    } as T;

    return this.dispatch(event);
  }

  public getStats(): EventBusStats {
    return { ...this.stats };
  }

  public clearDeduplicationCache(): void {
    this.processedEventIds.clear();
    this.recentEventIdQueue = [];
  }

  private updateSubscriptionCount(): void {
    let count = 0;
    this.subscribers.forEach(set => { count += set.size; });
    this.stats.activeSubscriptions = count;
  }
}

export const eventBus = CampusEventBus.getInstance();
export default eventBus;
