/**
 * OfflineStore.ts
 * Robust IndexedDB persistent outbox queue & local state cache.
 * Keeps track of pending transactions, payload digests, and sync states.
 */

export interface OutboxItem<T = any> {
  id: string; // Unique GUID
  entity: string; // e.g. 'users', 'id_cards', 'orders'
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: T;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
}

export class OfflineStore {
  private dbName: string;
  private dbVersion: number;
  private db: IDBDatabase | null = null;

  constructor(dbName = 'web_offline_sync_db', dbVersion = 1) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
  }

  public async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('outbox')) {
          const store = db.createObjectStore('outbox', { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('entity', 'entity', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error('[OfflineStore] Failed to open IndexedDB:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  public async enqueue<T>(entity: string, action: 'CREATE' | 'UPDATE' | 'DELETE', payload: T): Promise<OutboxItem<T>> {
    await this.init();
    const item: OutboxItem<T> = {
      id: this.generateGuid(),
      entity,
      action,
      payload,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      const request = store.add(item);

      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  }

  public async putItem<T>(item: OutboxItem<T>): Promise<OutboxItem<T>> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      const request = store.put(item);

      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  }

  public async getPendingItems(): Promise<OutboxItem[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async getAllItems(): Promise<OutboxItem[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async markStatus(id: string, status: 'pending' | 'syncing' | 'synced' | 'failed', error?: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item: OutboxItem = getReq.result;
        if (item) {
          item.status = status;
          if (error) item.error = error;
          if (status === 'failed') item.retryCount += 1;
          const putReq = store.put(item);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  public async removeItem(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async clearSynced(): Promise<void> {
    await this.init();
    const items = await this.getAllItems();
    const synced = items.filter((i) => i.status === 'synced');
    for (const item of synced) {
      await this.removeItem(item.id);
    }
  }

  private generateGuid(): string {
    return 'out_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
  }
}
