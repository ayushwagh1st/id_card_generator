import { OfflineStore, type OutboxItem, type EventSnapshot, type LocalRecord } from './OfflineStore';
import { NetworkMonitor } from './NetworkMonitor';
import { P2PMeshEngine } from './P2PMeshEngine';
import { normalizeScan, operationSchema, scanSchema } from './protocol';
import { errorMessage } from './errors';

export type ServerSyncHandler = (batch: OutboxItem[]) => Promise<{ successIds: string[]; failedIds?: Array<{ id: string; error: string; retryable?: boolean }> }>;
export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  peerCount: number;
  pendingCount: number;
  lastSyncedTime: number | null;
  failedCount?: number;
  error?: string | null;
  preparedAt?: number | null;
  pagesPreparedAt?: number | null;
  authorizationExpiresAt?: number | null;
  ready?: boolean;
}

export class SyncManager {
  private store: OfflineStore;
  private network: NetworkMonitor;
  private mesh: P2PMeshEngine;
  private serverHandler: ServerSyncHandler | null = null;
  private state: SyncState = { isOnline: false, isSyncing: false, peerCount: 0, pendingCount: 0, lastSyncedTime: null, failedCount: 0, error: null, ready: false };
  private stateListeners = new Set<(state: SyncState) => void>();
  private running: Promise<void> | null = null;
  private initializing: Promise<void> | null = null;
  private destroyed = false;
  private retryTimer: ReturnType<typeof setInterval> | null = null;
  private cleanup: Array<() => void> = [];
  private signer?: (item: OutboxItem) => Promise<OutboxItem>;
  private verifier?: (item: OutboxItem) => Promise<boolean>;
  private lockName: string;

  constructor(options?: { pingUrl?: string; dbName?: string; channelName?: string; ownerId?: string }) {
    this.store = new OfflineStore(options?.dbName, 3, options?.ownerId);
    this.network = new NetworkMonitor(options?.pingUrl);
    this.mesh = new P2PMeshEngine(options?.channelName);
    this.lockName = `${options?.dbName || 'offline'}:${options?.ownerId || 'default'}:upload`;
  }

  public getMeshEngine(): P2PMeshEngine { return this.mesh; }
  public getStore(): OfflineStore { return this.store; }
  public setSigning(signer: (item: OutboxItem) => Promise<OutboxItem>, verifier: (item: OutboxItem) => Promise<boolean>): void { this.signer = signer; this.verifier = verifier; }
  public setServerUploadHandler(handler: ServerSyncHandler): void { this.serverHandler = handler; }
  public reportError(error: string | null): void { this.state.error = error; this.notifyState(); }

  public init(): Promise<void> {
    if (this.initializing) return this.initializing;
    this.destroyed = false;
    this.initializing = this.initialize();
    return this.initializing;
  }

  private async initialize(): Promise<void> {
    await this.store.init();
    if (this.destroyed) { this.store.close(); return; }
    await this.store.recoverInterrupted();
    if (this.destroyed) return;
    this.mesh.setHistoryProvider(async () => (await this.store.getAllItems()).filter(item => !item.terminal && operationSchema.safeParse(item).success && (!this.verifier || !!item.signature && !!item.credential)));
    this.cleanup.push(this.mesh.subscribe(async incoming => {
      if (!operationSchema.safeParse(incoming).success || (this.verifier && !await this.verifier(incoming))) throw new Error('Unverified peer operation rejected.');
      if(await this.store.getItem(incoming.id)) return false;
      await this.store.putItem(incoming, true);
      await this.updateState();
      this.wake();
      return true;
    }));
    this.cleanup.push(this.mesh.onPeerCountChange(peerCount => { this.state.peerCount = peerCount; this.notifyState(); }));
    this.cleanup.push(this.mesh.onError(error => { this.state.error = error; this.notifyState(); }));
    this.cleanup.push(this.network.subscribe(isOnline => { this.state.isOnline = isOnline; this.notifyState(); if (isOnline) this.wake(); }));
    this.mesh.init();
    this.network.start();
    this.retryTimer = setInterval(() => this.wake(), 5000);
    if (typeof window !== 'undefined') {
      const focus = () => { void this.network.checkServerReachability(); this.wake(); };
      window.addEventListener('focus', focus);
      this.cleanup.push(() => window.removeEventListener('focus', focus));
    }
    await this.updateState();
  }

  private wake(): void {
    if (!this.destroyed && this.state.isOnline) void this.syncWithServer().catch(error => { this.state.error = String(error.message || error); this.notifyState(); });
  }

  public async mutate<T extends LocalRecord>(entity: string, action: OutboxItem['action'], payload: T, extra: Pick<Partial<OutboxItem>, 'id' | 'timestamp' | 'legacy'> = {}): Promise<OutboxItem<T>> {
    if (this.destroyed) throw new Error('Offline storage is closed. Reload the page.');
    const item: OutboxItem<T> = { id: crypto.randomUUID(), entity, action, payload, timestamp: Date.now() + (await this.store.getMeta<number>('clock-offset') || 0), status: 'pending', retryCount: 0, ...extra };
    const validation = operationSchema.safeParse(item);
    if (!validation.success) throw new Error(validation.error.issues.map(issue => issue.message).join('; '));
    const signed = this.signer ? await this.signer(item) : item;
    await this.store.putItem(signed);
    await this.updateState();
    this.mesh.broadcastItem(signed);
    this.wake();
    return signed as OutboxItem<T>;
  }

  public syncWithServer(force = false): Promise<void> {
    if (this.running) return this.running;
    if (!this.serverHandler || this.destroyed) return Promise.resolve();
    // Set the promise synchronously, before any IndexedDB read can yield.
    this.running = Promise.resolve().then(async () => {
      const run = () => this.drain(force);
      if (typeof navigator !== 'undefined' && navigator.locks) await navigator.locks.request(this.lockName, run);
      else await run();
    }).finally(() => { this.running = null; });
    return this.running;
  }

  private async drain(force: boolean): Promise<void> {
    this.state.isSyncing = true;
    this.notifyState();
    let acknowledged = 0;
    try {
      const attempted = new Set<string>();
      while (!this.destroyed) {
        const pending = (await this.store.getPendingItems(force)).filter(item => !attempted.has(item.id));
        if (!pending.length) break;
        const batch: OutboxItem[] = [];
        let bytes = 0;
        for (const item of pending) {
          const size = new TextEncoder().encode(JSON.stringify(item)).length;
          if (batch.length && (batch.length >= 20 || bytes + size > 200_000)) break;
          batch.push(item); bytes += size;
        }
        for (const item of batch) { attempted.add(item.id); await this.store.markStatus(item.id, 'syncing'); }
        try {
          const result = await this.serverHandler!(batch);
          const success = new Set(result.successIds);
          const failures = new Map((result.failedIds || []).map(failure => [failure.id, failure]));
          for (const item of batch) {
            if (success.has(item.id) && !failures.has(item.id)) {
              await this.store.markStatus(item.id, 'synced', undefined, { terminal: false, nextAttemptAt: 0 });
              acknowledged++;
            } else {
              const failure = failures.get(item.id);
              await this.fail(item, failure?.error || 'Server did not acknowledge this operation.', failure?.retryable !== false);
            }
          }
          if (failures.size) this.state.error = [...failures.values()][0].error;
          else this.state.error = null;
        } catch (error: unknown) {
          this.state.error = errorMessage(error) || 'Upload interrupted. Records remain on this device.';
          for (const item of batch) await this.fail(item, this.state.error!, true);
          break;
        }
      }
      if (acknowledged) this.state.lastSyncedTime = Date.now();
    } finally {
      this.state.isSyncing = false;
      await this.updateState();
    }
  }

  private async fail(item: OutboxItem, error: string, retryable: boolean): Promise<void> {
    const delay = Math.min(120_000, 1000 * 2 ** Math.min(item.retryCount, 7)) + Math.floor(Math.random() * 500);
    await this.store.markStatus(item.id, 'failed', error, { terminal: !retryable, nextAttemptAt: Date.now() + delay });
  }

  public async retryFailed(): Promise<void> {
    for (const item of await this.store.getAllItems()) if (item.status === 'failed') await this.store.markStatus(item.id, 'pending', undefined, { terminal: false, nextAttemptAt: 0 });
    await this.syncWithServer(true);
  }

  public async importLegacyScans(scans: unknown[]): Promise<void> {
    const known = new Set((await this.store.getAllItems()).map(item => item.id));
    for (let index = 0; index < scans.length; index++) {
      const scan = scanSchema.parse(scans[index]);
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${index}:${JSON.stringify(scan)}`));
      const id = 'legacy-scan-' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (known.has(id)) continue;
      await this.mutate('attendance_scans', 'CREATE', { ...scan, scanData: normalizeScan(scan.scanData) }, { id, timestamp: Date.parse(scan.timestamp), legacy: true });
      known.add(id);
    }
  }

  public async saveSnapshot(snapshot: EventSnapshot): Promise<void> { await this.store.saveSnapshot(snapshot); await this.updateState(); }
  public async eventTime(): Promise<string> { return new Date(Date.now() + (await this.store.getMeta<number>('clock-offset') || 0)).toISOString(); }
  public async receiveConfirmed(item: OutboxItem): Promise<void> {
    if (!operationSchema.safeParse(item).success || (this.verifier && !await this.verifier(item))) throw new Error('Server returned an invalid signed operation.');
    await this.store.putItem({ ...item, status: 'synced', retryCount: 0 }, true);
    await this.store.markStatus(item.id, 'synced', undefined, { terminal: false, nextAttemptAt: 0 });
    await this.updateState();
  }
  public async getLocalData(entity: Parameters<OfflineStore['project']>[0]): Promise<LocalRecord[]> { return this.store.project(entity); }
  public async getPendingCount(): Promise<number> { return (await this.store.getStats()).pending; }
  public async findPendingItem(entity: string, field: string, value: unknown): Promise<LocalRecord | null> {
    if (entity === 'children') return (await this.store.project('children')).find(row => row[field] === value) || null;
    return null;
  }
  public async getPendingItemsByEntity(entity: string): Promise<OutboxItem[]> { return (await this.store.getItemsByEntity(entity)).filter(item => item.status !== 'synced'); }
  public async exportData(): Promise<string> { return this.store.exportData(); }
  public async importData(contents: string): Promise<number> {
    const backup=JSON.parse(contents);
    if (backup.version!==2 || !Array.isArray(backup.operations) || backup.operations.length>100000) throw new Error('Invalid event queue backup.');
    for (const item of backup.operations) {
      if (!operationSchema.safeParse(item).success || !this.verifier || !await this.verifier(item)) throw new Error('Backup contains an invalid or unverified operation. No records were imported.');
    }
    for (const item of backup.operations) await this.store.putItem(item,true);
    await this.updateState(); this.wake(); return backup.operations.length;
  }

  public subscribeState(listener: (state: SyncState) => void): () => void {
    this.stateListeners.add(listener); listener({ ...this.state }); return () => { this.stateListeners.delete(listener); };
  }
  private async updateState(): Promise<void> {
    const stats = await this.store.getStats();
    this.state.pendingCount = stats.pending;
    this.state.failedCount = stats.failed;
    this.state.preparedAt = (await this.store.getMeta<{preparedAt:number}>('snapshot:info'))?.preparedAt || null;
    this.state.pagesPreparedAt = await this.store.getMeta<number>('pages-prepared-at');
    this.state.authorizationExpiresAt = await this.store.getMeta<number>('authorization-expires-at');
    this.state.ready = true;
    this.notifyState();
  }
  private notifyState(): void { for (const listener of this.stateListeners) listener({ ...this.state }); }
  public destroy(): void {
    this.destroyed = true;
    this.network.stop(); this.mesh.destroy();
    if (this.retryTimer) clearInterval(this.retryTimer);
    for (const cleanup of this.cleanup.splice(0)) cleanup();
    // In-flight writes may still need the database; close only when the worker settles.
    void (this.running || Promise.resolve()).then(() => this.store.close(), () => this.store.close());
    this.initializing = null;
  }
}
