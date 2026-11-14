// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { generateKeyPairSync } from 'node:crypto';
import { DeviceIdentity } from '@/web_offline_p2p_sync/core/DeviceIdentity';
import { OfflineStore, type OutboxItem } from '@/web_offline_p2p_sync/core/OfflineStore';
import { EVENT_SCOPE } from '@/web_offline_p2p_sync/core/protocol';
import { SyncManager } from '@/web_offline_p2p_sync/core/SyncManager';
vi.mock('server-only', () => ({}));
import { issueCredential, verifyOperation } from '@/lib/offline/server';

const actor = '00000000-0000-4000-8000-000000000001';
beforeEach(() => { globalThis.indexedDB = new IDBFactory(); process.env.OFFLINE_SIGNING_SECRET = 'isolated-test-credential-secret'; });
async function signed() {
  const store = new OfflineStore(crypto.randomUUID()); const identity = new DeviceIdentity(store); const device = await identity.init();
  const certificate = issueCredential({ actorId: actor, deviceId: device.deviceId, publicKey: device.publicKey, role: 'LECTURER', scope: EVENT_SCOPE, expiresAt: Date.now() + 86400000 });
  await store.setMeta('credential', certificate.credential); await store.setMeta('server-public-key', certificate.serverPublicKey);
  const item = await identity.sign({ id: crypto.randomUUID(), entity: 'attendance_scans', action: 'CREATE', payload: { scanData: 'SNK-1', sessionId: '00000000-0000-4000-8000-000000000002', mode: 'check-in', timestamp: new Date().toISOString() }, timestamp: Date.now(), status: 'pending', retryCount: 0 });
  return { store, identity, item };
}
describe('offline device authorization', () => {
  it('accepts an operation signed by an enrolled device on browser and server', async () => {
    const { store, identity, item } = await signed(); expect(verifyOperation(item).actorId).toBe(actor); expect(await identity.verify(item)).toBe(true); store.close();
  });
  it('rejects a peer changing participant data after signing', async () => {
    const { store, identity, item } = await signed(); item.payload.scanData = 'FORGED'; expect(() => verifyOperation(item)).toThrow('signature'); expect(await identity.verify(item)).toBe(false); store.close();
  });
  it('rejects a forged original actor', async () => {
    const { store, item } = await signed(); item.actorId = crypto.randomUUID(); expect(() => verifyOperation(item)).toThrow('identity'); store.close();
  });
  it('rejects operations belonging to another event', async () => {
    const { store, identity, item } = await signed(); item.scope = 'different-event'; expect(() => verifyOperation(item)).toThrow('identity'); expect(await identity.verify(item)).toBe(false); store.close();
  });
  it('does not trust a self-issued peer credential', async () => {
    const { store, item } = await signed(); const parts = item.credential!.split('.'); const claims = JSON.parse(Buffer.from(parts[0], 'base64url').toString()); claims.role = 'SUPER_ADMIN';
    item.credential = Buffer.from(JSON.stringify(claims)).toString('base64url') + '.' + parts[1]; expect(() => verifyOperation(item)).toThrow('credential'); store.close();
  });
  it('does not let local delivery state affect the signed immutable command', async () => {
    const { store, item } = await signed(); item.status = 'failed'; item.retryCount = 99; item.error = 'Network failure'; expect(verifyOperation(item).actorId).toBe(actor); store.close();
  });
  it('does not export its private signing key', async () => {
    const { store, identity } = await signed(); const device = await identity.init(); await expect(crypto.subtle.exportKey('jwk', device.privateKey)).rejects.toThrow(); expect(await store.exportData()).not.toContain('privateKey'); store.close();
  });
  it('rejects signing when preparation has expired while preserving existing records', async () => {
    const { store, identity, item } = await signed(); await store.putItem(item);
    await expect(identity.sign({ ...item, timestamp: Date.now() + 2 * 86400000 })).rejects.toThrow('expired'); expect(await store.getAllItems()).toHaveLength(1); store.close();
  });
  it('does not accept a different server signing key', async () => {
    const { store, identity, item } = await signed(); const key = generateKeyPairSync('ec', { namedCurve: 'P-256' }).publicKey.export({ format: 'jwk' }); await store.setMeta('server-public-key', key); expect(await identity.verify(item)).toBe(false); store.close();
  });
  it('imports a verified backup once without trusting exported delivery status',async()=>{
    const {store,identity,item}=await signed();const manager=new SyncManager({dbName:crypto.randomUUID()});manager.setSigning(value=>identity.sign(value),value=>identity.verify(value));
    const backup=JSON.stringify({version:2,operations:[{...item,status:'synced'}]});
    await manager.importData(backup);await manager.importData(backup);
    expect(await manager.getPendingCount()).toBe(1);expect(await manager.getStore().getAllItems()).toHaveLength(1);manager.destroy();store.close();
  });
  it('rejects an entire tampered backup before inserting any operations',async()=>{
    const {store,identity,item}=await signed();const manager=new SyncManager({dbName:crypto.randomUUID()});manager.setSigning(value=>identity.sign(value),value=>identity.verify(value));
    const forged={...item,id:'changed'};
    await expect(manager.importData(JSON.stringify({version:2,operations:[item,forged]}))).rejects.toThrow('unverified');
    expect(await manager.getStore().getAllItems()).toHaveLength(0);manager.destroy();store.close();
  });
  it('shares one persistent device identity across concurrent tabs',async()=>{
    const dbName=crypto.randomUUID();const a=new OfflineStore(dbName),b=new OfflineStore(dbName);
    const [first,second]=await Promise.all([new DeviceIdentity(a).init(),new DeviceIdentity(b).init()]);expect(first.deviceId).toBe(second.deviceId);expect(first.publicKey).toEqual(second.publicKey);a.close();b.close();
  });
});
