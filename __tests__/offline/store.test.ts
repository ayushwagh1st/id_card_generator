// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { OfflineStore, type OutboxItem } from '@/web_offline_p2p_sync/core/OfflineStore';

let stores: OfflineStore[] = [];
beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });
afterEach(() => { stores.forEach(store => store.close()); stores = []; });
const open = (owner = 'a') => { const store = new OfflineStore('test', 3, owner); stores.push(store); return store; };
const operation = (id: string, extra: Partial<OutboxItem> = {}): OutboxItem => ({ id, entity: 'children', action: 'CREATE', payload: { id: 'child', name: 'Child', qr_id: 'qr', status: 'Registered' }, timestamp: 1, status: 'pending', retryCount: 0, ...extra });

describe('durable offline storage', () => {
  it('persists records across a database close and reopen', async () => {
    const store = open(); await store.putItem(operation('one')); store.close();
    expect((await open().getAllItems()).map(row => row.id)).toEqual(['one']);
  });
  it('rejects the save if a transaction aborts after an individual request succeeds', async () => {
    const store=open(); await store.init();
    const original=IDBObjectStore.prototype.put;
    const spy=vi.spyOn(IDBObjectStore.prototype,'put').mockImplementation(function(this: IDBObjectStore,...args: Parameters<IDBObjectStore['put']>) {
      const request=original.apply(this,args); if(this.name==='operations') request.addEventListener('success',()=>this.transaction.abort()); return request;
    });
    try { await expect(store.putItem(operation('aborted'))).rejects.toThrow(); expect(await store.getAllItems()).toEqual([]); }
    finally { spy.mockRestore(); }
  });
  it('isolates operator partitions', async () => {
    await open('a').putItem(operation('private'));
    expect(await open('b').getAllItems()).toEqual([]);
  });
  it('never lets a peer copy downgrade acknowledged delivery state', async () => {
    const store = open(); await store.putItem(operation('one', { status: 'synced' }));
    await store.putItem(operation('one'), true);
    expect((await store.getAllItems())[0].status).toBe('synced');
  });
  it('retains a durable operation lookup after more messages than the memory dedup cache',async()=>{
    const store=open();await store.putItem(operation('first'));
    for(let index=0;index<501;index++)await store.putItem(operation('later-'+index));
    expect((await store.getItem('first'))?.id).toBe('first');
  });
  it('does not trust delivery status received from a peer', async () => {
    const store = open(); await store.putItem(operation('one', { status: 'synced', terminal: true }), true);
    expect((await store.getAllItems())[0]).toMatchObject({ status: 'pending', terminal: false });
  });
  it('recovers interrupted uploads on startup', async () => {
    const store = open(); await store.putItem(operation('one', { status: 'syncing' }));
    await store.recoverInterrupted(); expect((await store.getPendingItems())[0].status).toBe('pending');
  });
  it('retries transient failed rows after backoff, while retaining terminal failures', async () => {
    const store = open(); await store.putItem(operation('one', { status: 'failed', nextAttemptAt: Date.now() + 10000 }));
    await store.putItem(operation('two', { status: 'failed', terminal: true }));
    expect(await store.getPendingItems()).toHaveLength(0);
    expect(await store.getPendingItems(true)).toHaveLength(1);
    expect(await store.getAllItems()).toHaveLength(2);
  });
  it('retains acknowledged history for reconnect catch-up', async () => {
    const store = open(); await store.putItem(operation('one', { status: 'synced' }));
    await store.clearSynced(); expect(await store.getAllItems()).toHaveLength(1);
  });
  it('sorts CREATE before UPDATE at the same timestamp instead of random ID suffix', async () => {
    const store = open(); await store.putItem(operation('z')); await store.putItem(operation('a', { action: 'UPDATE' }));
    expect((await store.getPendingItems()).map(row => row.action)).toEqual(['CREATE', 'UPDATE']);
  });
  it('merges status updates with full locally registered child data', async () => {
    const store = open(); await store.putItem(operation('one'));
    await store.putItem(operation('two', { action: 'UPDATE', timestamp: 2, payload: { id: 'child', checked_in_at: '2026-11-14T08:00:00Z' } }));
    expect((await store.project('children'))[0]).toMatchObject({ name: 'Child', qr_id: 'qr', status: 'Checked In' });
  });
  it('does not let replayed registrations reset snapshot attendance', async () => {
    const store = open(); await store.saveSnapshot({ sessions: [], volunteers: [], enrollments: [], qrCodes: [], preparedAt: 100, children: [{ id: 'child', name: 'Child', status: 'Checked Out', checked_out_at: '2026-11-14T09:00:00Z' }] });
    await store.putItem(operation('one', { status: 'synced' }));
    expect((await store.project('children'))[0].status).toBe('Checked Out');
  });
  it('keeps acknowledged late-arriving offline changes newer than snapshot state', async () => {
    const store = open(); await store.saveSnapshot({ sessions: [], volunteers: [], enrollments: [], qrCodes: [], preparedAt: 100, children: [{ id: 'child', name: 'Child', status: 'Registered' }] });
    await store.putItem(operation('two', { action: 'UPDATE', timestamp: 2, status: 'synced', payload: { id: 'child', checked_in_at: '2026-11-14T08:00:00Z' } }));
    expect((await store.project('children'))[0].status).toBe('Checked In');
  });
  it('projects child scans from the shared attendance queue', async () => {
    const store = open(); await store.putItem(operation('one'));
    await store.putItem(operation('scan', { entity: 'attendance_scans', timestamp: 2, payload: { scanData: 'qr', mode: 'check-out', timestamp: '2026-11-14T09:00:00Z' } }));
    expect((await store.project('children'))[0].status).toBe('Checked Out');
  });
  it('exports records including rejected ones without private device keys', async () => {
    const store = open(); await store.putItem(operation('one', { terminal: true, error: 'Conflict' })); await store.setMeta('device', { privateKey: 'secret' });
    const exported = await store.exportData(); expect(JSON.parse(exported).operations).toHaveLength(1); expect(exported).not.toContain('secret');
  });
  it('preserves the version-one outbox during migration and imports once', async () => {
    await new Promise<void>((resolve, reject) => { const request = indexedDB.open('test', 1); request.onupgradeneeded = () => request.result.createObjectStore('outbox', { keyPath: 'id' }); request.onerror = () => reject(request.error); request.onsuccess = () => { const db = request.result; const tx = db.transaction('outbox', 'readwrite'); tx.objectStore('outbox').put(operation('legacy', { status: 'failed' })); tx.oncomplete = () => { db.close(); resolve(); }; }; });
    const store = open(); expect(await store.importLegacy()).toBe(1); expect(await store.importLegacy()).toBe(0);
    expect((await store.getAllItems())[0]).toMatchObject({ id: 'legacy', legacy: true, status: 'pending' });
  });
});
