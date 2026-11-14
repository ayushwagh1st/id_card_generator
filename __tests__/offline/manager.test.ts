// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { SyncManager, type SyncState } from '@/web_offline_p2p_sync/core/SyncManager';
import type { OutboxItem } from '@/web_offline_p2p_sync/core/OfflineStore';

const managers: SyncManager[] = [];
beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });
afterEach(() => { for (const manager of managers.splice(0)) manager.destroy(); vi.restoreAllMocks(); });
const make = () => { const manager = new SyncManager({ dbName: crypto.randomUUID() }); managers.push(manager); return manager; };
const row = (id: string): OutboxItem => ({ id, entity: 'attendance_scans', action: 'CREATE', payload: { scanData: 'SNK-1', sessionId: '00000000-0000-4000-8000-000000000002', mode: 'check-in', timestamp: '2026-11-14T08:00:00Z' }, timestamp: 1, status: 'pending', retryCount: 0 });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const until = async (check: () => boolean) => { for (let i = 0; i < 100 && !check(); i++) await tick(); expect(check()).toBe(true); };

describe('upload recovery', () => {
  it('uses one upload for concurrent sync calls', async () => {
    const manager = make(); await manager.getStore().putItem(row('one'));
    const upload = vi.fn(async (batch: OutboxItem[]) => { await tick(); return { successIds: batch.map(item => item.id) }; }); manager.setServerUploadHandler(upload);
    await Promise.all([manager.syncWithServer(), manager.syncWithServer(), manager.syncWithServer()]);
    expect(upload).toHaveBeenCalledTimes(1);
  });
  it('drains records added while an earlier batch is uploading', async () => {
    const manager = make(); await manager.getStore().putItem(row('one'));
    let release!: () => void;
    const upload = vi.fn(async (batch: OutboxItem[]) => { if (batch[0].id === 'one') await new Promise<void>(resolve => { release = resolve; }); return { successIds: batch.map(item => item.id) }; }); manager.setServerUploadHandler(upload);
    const active = manager.syncWithServer(); await until(() => !!release);
    await manager.mutate('attendance_scans', 'CREATE', row('two').payload, { id: 'two' }); release(); await active;
    expect(upload).toHaveBeenCalledTimes(2); expect(await manager.getPendingCount()).toBe(0);
  });
  it('preserves earlier acknowledgments when a later batch disconnects', async () => {
    const manager = make(); for (let i = 0; i < 21; i++) await manager.getStore().putItem(row(String(i).padStart(3, '0')));
    let calls = 0; manager.setServerUploadHandler(async batch => { if (++calls === 2) throw Error('Disconnected'); return { successIds: batch.map(item => item.id) }; });
    await manager.syncWithServer(); const all = await manager.getStore().getAllItems();
    expect(all.filter(item => item.status === 'synced')).toHaveLength(20); expect(await manager.getPendingCount()).toBe(1);
  });
  it('counts partial failures and retries them without replaying accepted rows', async () => {
    const manager = make(); await manager.getStore().putItem(row('one')); await manager.getStore().putItem(row('two'));
    const upload = vi.fn().mockResolvedValueOnce({ successIds: ['one'], failedIds: [{ id: 'two', error: 'DB unavailable', retryable: true }] }).mockResolvedValue({ successIds: ['two'], failedIds: [] }); manager.setServerUploadHandler(upload);
    await manager.syncWithServer(); expect(await manager.getPendingCount()).toBe(1);
    await manager.syncWithServer(true); expect(upload.mock.calls[1][0].map((item: OutboxItem) => item.id)).toEqual(['two']);
  });
  it('retains unacknowledged IDs after an incomplete response', async () => {
    const manager = make(); await manager.getStore().putItem(row('one')); manager.setServerUploadHandler(async () => ({ successIds: [] })); await manager.syncWithServer();
    expect((await manager.getStore().getAllItems())[0]).toMatchObject({ status: 'failed', terminal: false });
  });
  it('does not record a successful sync time for an all-failed batch', async () => {
    const manager = make(); await manager.getStore().putItem(row('one')); let state!: SyncState; manager.subscribeState(value => { state = value; });
    manager.setServerUploadHandler(async () => ({ successIds: [], failedIds: [{ id: 'one', error: 'Rejected', retryable: false }] })); await manager.syncWithServer();
    expect(state.lastSyncedTime).toBeNull(); expect(state.pendingCount).toBe(1); expect(state.failedCount).toBe(1);
  });
  it('broadcasts durable mutations even when server access is unavailable', async () => {
    const manager = make(); const broadcast = vi.spyOn(manager.getMeshEngine(), 'broadcastItem'); manager.setServerUploadHandler(async () => { throw Error('Offline'); });
    await manager.mutate('attendance_scans', 'CREATE', row('one').payload);
    expect(broadcast).toHaveBeenCalledOnce(); expect(await manager.getPendingCount()).toBe(1);
  });
  it('never uploads when a local save fails', async () => {
    const manager = make(); vi.spyOn(manager.getStore(), 'putItem').mockRejectedValue(new Error('Quota exceeded'));
    const upload = vi.fn(); manager.setServerUploadHandler(upload);
    await expect(manager.mutate('attendance_scans', 'CREATE', row('one').payload)).rejects.toThrow('Quota exceeded'); expect(upload).not.toHaveBeenCalled();
  });
  it('deduplicates repeated import of legacy localStorage scans', async () => {
    const manager = make(); const scans = [row('one').payload]; await manager.importLegacyScans(scans); await manager.importLegacyScans(scans);
    expect(await manager.getPendingCount()).toBe(1);
  });
});
