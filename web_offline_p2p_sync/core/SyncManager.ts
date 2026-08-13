/**
 * SyncManager.ts
 * Master coordinator orchestrating OfflineStore, NetworkMonitor, and P2PMeshEngine.
 * Handles local persistence, P2P mesh broadcasting, and background server sync.
 */

import { OfflineStore, OutboxItem } from './OfflineStore';
import { NetworkMonitor } from './NetworkMonitor';
import { P2PMeshEngine } from './P2PMeshEngine';

export type ServerSyncHandler = (batch: OutboxItem[]) => Promise<{
  successIds: string[];
  failedIds?: Array<{ id: string; error: string }>;
}>;

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  peerCount: number;
  pendingCount: number;
  lastSyncedTime: number | null;
}

export class SyncManager {
  private store: OfflineStore;
  private network: NetworkMonitor;
  private mesh: P2PMeshEngine;
  private serverHandler: ServerSyncHandler | null = null;

  private state: SyncState = {
    isOnline: true,
    isSyncing: false,
    peerCount: 0,
    pendingCount: 0,
    lastSyncedTime: null,
  };

  private stateListeners: Set<(state: SyncState) => void> = new Set();

  constructor(options?: { pingUrl?: string; dbName?: string; channelName?: string }) {
    this.store = new OfflineStore(options?.dbName);
    this.network = new NetworkMonitor(options?.pingUrl);
    this.mesh = new P2PMeshEngine(options?.channelName);
  }

  public async init(): Promise<void> {
    await this.store.init();
    this.mesh.init();

    // Listen for incoming mesh updates from nearby offline peers
    this.mesh.subscribe(async (incomingItem) => {
      await this.store.putItem(incomingItem);
      this.updateState();
    });

    // Listen for peer count changes
    this.mesh.onPeerCountChange((peerCount) => {
      this.state.peerCount = peerCount;
      this.notifyState();
    });

    // Listen for internet reachability changes
    this.network.subscribe(async (isOnline) => {
      this.state.isOnline = isOnline;
      this.notifyState();

      if (isOnline) {
        // Automatically flush pending items to server when connection returns
        await this.syncWithServer();
      }
    });

    this.network.start();
    await this.updateState();
  }

  public setServerUploadHandler(handler: ServerSyncHandler): void {
    this.serverHandler = handler;
  }

  /**
   * Save a change (CREATE, UPDATE, DELETE)
   * If offline: persists to IndexedDB outbox & broadcasts to offline P2P mesh.
   * If online: attempts immediate server upload (with offline fallback if request fails).
   */
  public async mutate<T>(entity: string, action: 'CREATE' | 'UPDATE' | 'DELETE', payload: T): Promise<OutboxItem<T>> {
    // Inject client-side timestamp for Last-Write-Wins (LWW) conflict resolution
    const timestampedPayload = {
      ...(payload as any),
      updated_at: (payload as any).updated_at || new Date().toISOString(),
    };
    
    const item = await this.store.enqueue(entity, action, timestampedPayload as T);

    if (!this.state.isOnline) {
      // Offline path: broadcast to nearby P2P mesh
      this.mesh.broadcastItem(item);
      await this.updateState();
      return item;
    }

    // Online path: trigger server sync
    await this.syncWithServer();
    return item;
  }

  /**
   * Triggers upload of all pending outbox items to backend server.
   */
  public async syncWithServer(): Promise<void> {
    if (!this.serverHandler || this.state.isSyncing) return;

    const pending = await this.store.getPendingItems();
    if (pending.length === 0) {
      await this.store.clearSynced();
      await this.updateState();
      return;
    }

    this.state.isSyncing = true;
    this.notifyState();

    try {
      // Chunk processing to avoid 413 Payload Too Large limits
      const CHUNK_SIZE = 5;
      for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
        const batch = pending.slice(i, i + CHUNK_SIZE);

        // Mark chunk items as syncing
        for (const item of batch) {
          await this.store.markStatus(item.id, 'syncing');
        }

        const result = await this.serverHandler(batch);

        // Process successful uploads
        for (const id of result.successIds) {
          await this.store.markStatus(id, 'synced');
        }

        // Process failed uploads
        if (result.failedIds) {
          for (const failure of result.failedIds) {
            await this.store.markStatus(failure.id, 'failed', failure.error);
          }
        }
      }

      // Cleanup synced items
      await this.store.clearSynced();
      this.state.lastSyncedTime = Date.now();
    } catch (err: any) {
      console.error('[SyncManager] Error syncing with server:', err);
      // Revert items back to pending for retry
      for (const item of pending) {
        await this.store.markStatus(item.id, 'pending', err.message || 'Network error during upload');
      }
    } finally {
      this.state.isSyncing = false;
      await this.updateState();
    }
  }

  public subscribeState(listener: (state: SyncState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  public getPendingCount(): Promise<number> {
    return this.store.getPendingItems().then((items) => items.length);
  }

  private async updateState(): Promise<void> {
    const pending = await this.store.getPendingItems();
    this.state.pendingCount = pending.length;
    this.notifyState();
  }

  private notifyState(): void {
    this.stateListeners.forEach((l) => l({ ...this.state }));
  }

  public destroy(): void {
    this.network.stop();
    this.mesh.destroy();
  }
}
