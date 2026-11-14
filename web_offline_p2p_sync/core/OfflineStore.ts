export interface LocalRecord {
  [key: string]: unknown;
  id?: string; qr_id?: string; name?: string; full_name?: string; snk_id?: string;
  status?: string; session_id?: string; volunteer_id?: string; model_id?: string;
  checked_in_at?: string; checked_out_at?: string; scanData?: string; mode?: string; timestamp?: string;
}
export interface OutboxItem<T = LocalRecord> {
  id: string;
  entity: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: T;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
  nextAttemptAt?: number;
  terminal?: boolean;
  actorId?: string;
  deviceId?: string;
  scope?: string;
  credential?: string;
  signature?: string;
  legacy?: boolean;
}

export interface EventSnapshot {
  sessions: LocalRecord[];
  children: LocalRecord[];
  volunteers: LocalRecord[];
  enrollments: LocalRecord[];
  qrCodes: LocalRecord[];
  preparedAt: number;
}

type StoredOperation = { key: string; owner: string; item: OutboxItem };

export class OfflineStore {
  private db: IDBDatabase | null = null;
  private opening: Promise<void> | null = null;

  constructor(private dbName = 'web_offline_sync_db', private dbVersion = 4, private owner = 'default') {}

  public init(): Promise<void> {
    if (this.db) return Promise.resolve();
    if (this.opening) return this.opening;
    this.opening = new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, Math.max(4, this.dbVersion));
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('operations')) {
          const operations = db.createObjectStore('operations', { keyPath: 'key' });
          operations.createIndex('owner', 'owner');
        }
        const operations = request.transaction!.objectStore('operations');
        if (!operations.indexNames.contains('delivery')) operations.createIndex('delivery', ['owner', 'item.status']);
        if (!operations.indexNames.contains('entity')) operations.createIndex('entity', ['owner', 'item.entity']);
        if (!db.objectStoreNames.contains('metadata')) db.createObjectStore('metadata', { keyPath: 'key' });
      };
      request.onsuccess = () => {
        this.db = request.result;
        this.db.onversionchange = () => { this.db?.close(); this.db = null; this.opening = null; };
        resolve();
      };
      request.onerror = () => { this.opening = null; reject(request.error); };
      request.onblocked = () => { this.opening = null; reject(new Error('Close other portal tabs so offline storage can be upgraded.')); };
    });
    return this.opening;
  }

  private key(id: string): string { return `${this.owner}:${id}`; }

  private async transaction<T>(stores: string[], mode: IDBTransactionMode, run: (tx: IDBTransaction, result: (value: T) => void) => void): Promise<T> {
    await this.init();
    return new Promise<T>((resolve, reject) => {
      const tx = this.db!.transaction(stores, mode);
      let value: T;
      tx.oncomplete = () => resolve(value);
      tx.onabort = () => reject(tx.error || new Error('Offline storage transaction aborted. Nothing was confirmed saved.'));
      tx.onerror = () => reject(tx.error || new Error('Offline storage write failed.'));
      try { run(tx, result => { value = result; }); } catch (error) { tx.abort(); reject(error); }
    });
  }

  public async enqueue<T>(entity: string, action: OutboxItem['action'], payload: T, extra: Partial<OutboxItem<T>> = {}): Promise<OutboxItem<T>> {
    const item: OutboxItem<T> = { id: crypto.randomUUID(), entity, action, payload, timestamp: Date.now(), status: 'pending', retryCount: 0, ...extra };
    await this.putItem(item);
    return item;
  }

  public async putItem<T>(item: OutboxItem<T>, incoming = false): Promise<OutboxItem<T>> {
    return this.transaction(['operations'], 'readwrite', (tx, done) => {
      const store = tx.objectStore('operations');
      const get = store.get(this.key(item.id));
      get.onsuccess = () => {
        const existing: StoredOperation | undefined = get.result;
        if (incoming && existing) { done(existing.item as OutboxItem<T>); return; }
        const copy = incoming ? { ...item, status: 'pending' as const, retryCount: 0, error: undefined, terminal: false, nextAttemptAt: 0 } : item;
        store.put({ key: this.key(item.id), owner: this.owner, item: copy });
        done(copy);
      };
    });
  }

  public async getAllItems(): Promise<OutboxItem[]> {
    const items = await this.transaction<OutboxItem[]>(['operations'], 'readonly', (tx, done) => {
      const request = tx.objectStore('operations').index('owner').getAll(this.owner);
      request.onsuccess = () => done(request.result.map((row: StoredOperation) => row.item));
    });
    return items.sort((a, b) => a.timestamp - b.timestamp || (a.action === b.action ? a.id.localeCompare(b.id) : a.action === 'CREATE' ? -1 : b.action === 'CREATE' ? 1 : a.id.localeCompare(b.id)));
  }
  public async getItem(id: string): Promise<OutboxItem | null> {
    return this.transaction(['operations'],'readonly',(tx,done)=>{const request=tx.objectStore('operations').get(this.key(id));request.onsuccess=()=>done(request.result?.item || null);});
  }

  public async getPendingItems(force = false): Promise<OutboxItem[]> {
    const items = await this.transaction<OutboxItem[]>(['operations'], 'readonly', (tx, done) => {
      const index = tx.objectStore('operations').index('delivery');
      const rows: OutboxItem[] = []; let remaining = 2;
      for (const status of ['pending', 'failed']) {
        const request = index.getAll([this.owner, status]);
        request.onsuccess = () => { rows.push(...request.result.map((row: StoredOperation) => row.item)); if (!--remaining) done(rows); };
      }
    });
    return items.filter(item => !item.terminal && (force || (item.nextAttemptAt || 0) <= Date.now())).sort((a,b) => a.timestamp-b.timestamp || (a.action === b.action ? a.id.localeCompare(b.id) : a.action === 'CREATE' ? -1 : 1));
  }

  public async getStats(): Promise<{ pending: number; failed: number }> {
    return this.transaction(['operations'], 'readonly', (tx, done) => {
      const index = tx.objectStore('operations').index('delivery'); const counts: Record<string, number> = {}; let remaining=3;
      for (const status of ['pending','failed','syncing']) { const request=index.count([this.owner,status]); request.onsuccess=()=>{ counts[status]=request.result; if (!--remaining) done({ pending: counts.pending+counts.failed+counts.syncing, failed: counts.failed }); }; }
    });
  }

  public async getItemsByEntity(entity: string): Promise<OutboxItem[]> {
    return this.transaction(['operations'], 'readonly', (tx, done) => { const request=tx.objectStore('operations').index('entity').getAll([this.owner,entity]); request.onsuccess=()=>done(request.result.map((row: StoredOperation)=>row.item).sort((a: OutboxItem,b: OutboxItem)=>a.timestamp-b.timestamp || (a.action===b.action ? a.id.localeCompare(b.id) : a.action==='CREATE' ? -1 : 1))); });
  }

  public async markStatus(id: string, status: OutboxItem['status'], error?: string, options: { terminal?: boolean; nextAttemptAt?: number } = {}): Promise<void> {
    await this.transaction<void>(['operations'], 'readwrite', (tx, done) => {
      const store = tx.objectStore('operations');
      const request = store.get(this.key(id));
      request.onsuccess = () => {
        const row: StoredOperation | undefined = request.result;
        if (row) {
          row.item = { ...row.item, status, error, ...options, retryCount: row.item.retryCount + (status === 'failed' ? 1 : 0) };
          store.put(row);
        }
        done();
      };
    });
  }

  public async recoverInterrupted(): Promise<void> {
    for (const item of await this.getAllItems()) if (item.status === 'syncing') await this.markStatus(item.id, 'pending', undefined, { nextAttemptAt: 0 });
  }

  public async removeItem(id: string): Promise<void> {
    await this.transaction<void>(['operations'], 'readwrite', (tx, done) => { tx.objectStore('operations').delete(this.key(id)); done(); });
  }

  // Keep receipts and history for replay protection and peer catch-up.
  public async clearSynced(): Promise<void> {}

  public async getMeta<T>(name: string): Promise<T | null> {
    return this.transaction<T | null>(['metadata'], 'readonly', (tx, done) => {
      const request = tx.objectStore('metadata').get(this.key(name));
      request.onsuccess = () => done(request.result?.value ?? null);
    });
  }

  public async setMeta<T>(name: string, value: T): Promise<void> {
    await this.transaction<void>(['metadata'], 'readwrite', (tx, done) => { tx.objectStore('metadata').put({ key: this.key(name), value }); done(); });
  }
  public async setMetaIfAbsent<T>(name: string, candidate: T): Promise<T> {
    return this.transaction<T>(['metadata'], 'readwrite', (tx, done) => {
      const store = tx.objectStore('metadata'); const request = store.get(this.key(name));
      request.onsuccess = () => {
        if (request.result) done(request.result.value);
        else { store.put({ key: this.key(name), value: candidate }); done(candidate); }
      };
    });
  }

  public async saveSnapshot(snapshot: EventSnapshot): Promise<void> {
    await this.transaction<void>(['metadata'], 'readwrite', (tx, done) => {
      const store=tx.objectStore('metadata');
      for (const [name,value] of Object.entries(snapshot)) store.put({key:this.key('snapshot:'+name),value});
      store.put({key:this.key('snapshot:info'),value:{preparedAt:snapshot.preparedAt}}); done();
    });
  }
  public async getSnapshot(): Promise<EventSnapshot | null> {
    const info=await this.getMeta<{preparedAt:number}>('snapshot:info');
    if (!info) return this.getMeta('snapshot');
    const [sessions,children,volunteers,enrollments,qrCodes]=await Promise.all(['sessions','children','volunteers','enrollments','qrCodes'].map(name=>this.getMeta<LocalRecord[]>('snapshot:'+name)));
    return {sessions:sessions||[],children:children||[],volunteers:volunteers||[],enrollments:enrollments||[],qrCodes:qrCodes||[],preparedAt:info.preparedAt};
  }

  public async project(entity: 'children' | 'sessions' | 'volunteers' | 'enrollments' | 'qrCodes'): Promise<LocalRecord[]> {
    const snapshot = await this.getMeta<LocalRecord[]>('snapshot:'+entity) || (await this.getMeta<EventSnapshot>('snapshot'))?.[entity] || [];
    const rows = new Map<string, LocalRecord>(snapshot.map(row => [row.id || `${row.volunteer_id}:${row.session_id}`, { ...row }]));
    const operations = await this.getItemsByEntity(entity);
    if (entity === 'children') operations.push(...await this.getItemsByEntity('attendance_scans'));
    operations.sort((a,b)=>a.timestamp-b.timestamp || (a.action===b.action ? a.id.localeCompare(b.id) : a.action==='CREATE' ? -1 : 1));
    for (const item of operations) {
      if (item.terminal) continue;
      let payload = item.payload;
      if (entity === 'children' && item.entity === 'attendance_scans') {
        const child = [...rows.values()].find(row => row.qr_id === payload.scanData);
        if (!child) continue;
        payload = { id: child.id, status: payload.mode === 'check-in' ? 'Checked In' : 'Checked Out', [payload.mode === 'check-in' ? 'checked_in_at' : 'checked_out_at']: payload.timestamp };
      } else if (item.entity !== entity) continue;
      const id = payload.id || [...rows.values()].find(row => row.qr_id === payload.qr_id)?.id;
      if (!id) continue;
      if (item.action === 'DELETE') rows.delete(id);
      else {
        const existing = rows.get(id);
        if (entity === 'children' && existing) {
          if (item.action === 'CREATE' && item.entity === 'children') continue;
          const latest = (a?: string, b?: string) => !a ? b : !b ? a : Date.parse(a) >= Date.parse(b) ? a : b;
          const checked_in_at = latest(existing.checked_in_at, payload.checked_in_at);
          const checked_out_at = latest(existing.checked_out_at, payload.checked_out_at);
          const status = checked_out_at && (!checked_in_at || Date.parse(checked_out_at) >= Date.parse(checked_in_at)) ? 'Checked Out' : checked_in_at ? 'Checked In' : existing.status;
          rows.set(id, { ...existing, checked_in_at, checked_out_at, status, isOfflineNode: existing.isOfflineNode || item.status !== 'synced' });
        } else rows.set(id, { ...existing, ...payload, isOfflineNode: item.status !== 'synced' });
      }
    }
    return [...rows.values()];
  }

  public async importLegacy(): Promise<number> {
    if (await this.getMeta('legacy-imported')) return 0;
    const legacy = await this.transaction<OutboxItem[]>(['outbox'], 'readonly', (tx, done) => {
      const request = tx.objectStore('outbox').getAll();
      request.onsuccess = () => done(request.result || []);
    });
    for (const item of legacy) await this.putItem({ ...item, legacy: true, status: item.status === 'synced' ? 'synced' : 'pending', nextAttemptAt: 0, terminal: false }, true);
    await this.setMeta('legacy-imported', true);
    return legacy.length;
  }

  public async exportData(): Promise<string> {
    return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), owner: this.owner, serverPublicKey: await this.getMeta('server-public-key'), snapshot: await this.getSnapshot(), operations: await this.getAllItems() }, null, 2);
  }

  public close(): void { this.db?.close(); this.db = null; this.opening = null; }
}
