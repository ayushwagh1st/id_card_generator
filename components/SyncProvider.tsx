'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { SyncManager, type SyncState } from '@/web_offline_p2p_sync/core/SyncManager';
import { DeviceIdentity, decode } from '@/web_offline_p2p_sync/core/DeviceIdentity';
import { EVENT_SCOPE } from '@/web_offline_p2p_sync/core/protocol';
import { SyncProgressModal } from '@/web_offline_p2p_sync/components/SyncProgressModal';
import { P2PBridgeModal } from '@/web_offline_p2p_sync/components/P2PBridgeModal';
import { createClient } from '@/lib/supabase/client';
import { ACTIVE_USER, SESSION_LOCK, lockOfflineSession } from '@/lib/offline/session';
import { errorMessage } from '@/web_offline_p2p_sync/core/errors';

interface SyncContextType {
  syncManager: SyncManager | null;
  state: SyncState;
  isModalOpen: boolean;
  isBridgeModalOpen: boolean;
  isPreparing: boolean;
  prepareOffline: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  openBridgeModal: () => void;
  closeBridgeModal: () => void;
}
const defaultState: SyncState = { isOnline: false, isSyncing: false, peerCount: 0, pendingCount: 0, lastSyncedTime: null, ready: false };
const SyncContext = createContext<SyncContextType>({ syncManager: null, state: defaultState, isModalOpen: false, isBridgeModalOpen: false, isPreparing: false, prepareOffline: async () => {}, openModal() {}, closeModal() {}, openBridgeModal() {}, closeBridgeModal() {} });

async function preparePages(owner: string): Promise<void> {
  if (!process.env.NEXT_PUBLIC_OFFLINE_BUILD_ID) throw new Error('Offline access requires the published app. This development preview cannot verify offline files. Your saved records are safe.');
  if (!('serviceWorker' in navigator)) throw new Error('This browser does not support offline pages. Use a current browser over HTTPS.');
  const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
  await navigator.serviceWorker.ready;
  const worker = registration.installing || registration.waiting || registration.active;
  if (!worker) throw new Error('Offline worker is not active. Reload and prepare again.');
  if (worker.state !== 'activated') await new Promise<void>((resolve, reject) => {
    const finish = () => { clearTimeout(timer); worker.removeEventListener('statechange', changed); };
    const changed = () => {
      if (worker.state === 'activated') { finish(); resolve(); }
      else if (worker.state === 'redundant') { finish(); reject(new Error('Offline worker update failed. Keep the connection and retry preparation.')); }
    };
    const timer = setTimeout(() => { finish(); reject(new Error('Offline worker update timed out. Retry preparation.')); }, 15000);
    worker.addEventListener('statechange', changed); changed();
  });
  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); reject(new Error('Offline pages could not be verified. Keep the connection and retry preparation.')); }, 60000);
    channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); if (event.data?.ok) resolve(); else reject(new Error(event.data?.error || 'Offline page preparation failed.')); };
    worker.postMessage({ type: 'PREPARE_OFFLINE', owner, routes: ['/lecturer/scanner', '/admin/spot-registration', '/admin/directory'] }, [channel.port2]);
  });
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [state, setState] = useState<SyncState>(defaultState);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isBridgeModalOpen, setBridgeOpen] = useState(false);
  const [isPreparing, setPreparing] = useState(false);
  const [connection, setConnection] = useState<{ ownerId: string; manager: SyncManager } | null>(null);
  const prepareRef = useRef<() => Promise<void>>(async () => {});
  const prepareOffline = useCallback(async () => prepareRef.current(), []);

  useEffect(() => {
    let active = true;
    const cached = localStorage.getItem(ACTIVE_USER);
    if (cached && !localStorage.getItem(SESSION_LOCK)) queueMicrotask(() => { if(active) setOwnerId(cached); });
    const client = createClient();
    void client.auth.getSession().then(({ data }) => { if (active && data.session?.user.id && !localStorage.getItem(SESSION_LOCK)) setOwnerId(data.session.user.id); }).catch(() => {});
    const unlock=()=>{const owner=localStorage.getItem(ACTIVE_USER);if(active&&owner&&!localStorage.getItem(SESSION_LOCK))setOwnerId(owner);};
    const lock=()=>{if(active){setOwnerId(null);setState(defaultState);}};
    window.addEventListener('offline-session-unlocked',unlock);window.addEventListener('offline-session-locked',lock);
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        lockOfflineSession();
        setOwnerId(null); setState(defaultState);
      } else if (session?.user.id && !localStorage.getItem(SESSION_LOCK)) setOwnerId(session.user.id);
    });
    return () => { active = false; data.subscription.unsubscribe();window.removeEventListener('offline-session-unlocked',unlock);window.removeEventListener('offline-session-locked',lock); };
  }, []);

  useEffect(() => {
    if (!ownerId) return;
    let active = true;
    let pulling = false;
    let preparing = false;
    const manager = new SyncManager({ pingUrl: '/api/health', dbName: 'app_offline_outbox', channelName: `app_p2p_mesh:${EVENT_SCOPE}`, ownerId: `${EVENT_SCOPE}:${ownerId}` });
    const store = manager.getStore();
    const identity = new DeviceIdentity(store);
    manager.setSigning(item => identity.sign(item), item => identity.verify(item));
    const unsubscribe = manager.subscribeState(value => { if (active) setState(value); });
    const report = (error: unknown) => { if (active) manager.reportError(errorMessage(error)); };

    const pull = async () => {
      if (pulling || !active || !navigator.onLine || !await store.getMeta('credential')) return;
      pulling = true;
      try {
        for (let page = 0; page < 50 && active; page++) {
          const cursor = await store.getMeta<string>('cloud-cursor') || '0';
          const response = await fetch(`/api/offline/changes?after=${encodeURIComponent(cursor)}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
          if (!response.ok) throw new Error(response.status === 401 ? 'Sign in again to resume server reconciliation. Saved records remain on this device.' : 'Server reconciliation is unavailable. Retrying automatically.');
          const data = await response.json();
          if (!Array.isArray(data.items) || typeof data.cursor !== 'string') throw new Error('Invalid server reconciliation response.');
          for (const item of data.items) await manager.receiveConfirmed(item);
          await store.setMeta('cloud-cursor', data.cursor);
          if (!data.hasMore) break;
        }
      } finally { pulling = false; }
    };

    manager.setServerUploadHandler(async batch => {
      const response = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ batch }), signal: AbortSignal.timeout(25000) });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(response.status === 401 ? 'Sign in again to upload. All records remain on this device.' : error.error || `Upload failed (${response.status}).`);
      }
      const result = await response.json();
      if (!Array.isArray(result.successIds) || !Array.isArray(result.failedIds)) throw new Error('Server response did not contain per-record acknowledgments.');
      void pull().catch(report);
      return result;
    });

    const prepare = async () => {
      if (preparing) return;
      preparing = true;
      if (active) setPreparing(true);
      try {
        const device = await identity.init();
        const response = await fetch('/api/offline/bootstrap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId: device.deviceId, publicKey: device.publicKey }), signal: AbortSignal.timeout(60000) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Offline preparation failed.');
        if (!active) return;
        const claims = JSON.parse(new TextDecoder().decode(decode(data.credential.split('.')[0])));
        if (claims.actorId !== ownerId || claims.deviceId !== device.deviceId) throw new Error('The signed-in account changed during preparation. Reload before continuing.');
        await store.setMeta('server-public-key', data.serverPublicKey);
        await store.setMeta('credential', data.credential);
        await store.setMeta('authorization-expires-at', claims.expiresAt);
        await store.setMeta('clock-offset', data.serverTime - Date.now());
        await manager.saveSnapshot(data.snapshot);
        const legacyOwner = localStorage.getItem('offline-legacy-owner:v2');
        if (!legacyOwner || legacyOwner === ownerId) {
          localStorage.setItem('offline-legacy-owner:v2', ownerId);
          await store.importLegacy();
          for (const item of await store.getAllItems()) {
            if (!item.signature && item.legacy && item.status !== 'synced') {
              const copy = { ...item, payload: { ...item.payload } };
              delete copy.payload.updated_at;
              try { await store.putItem(await identity.sign(copy)); }
              catch (error: unknown) { await store.markStatus(item.id, 'failed', errorMessage(error), { terminal: true }); }
            }
          }
          const oldScans = localStorage.getItem('pending-scans:v1');
          if (oldScans && !await store.getMeta('legacy-scans-imported')) {
            const scans = JSON.parse(oldScans);
            if (!Array.isArray(scans)) throw new Error('Legacy scan backup is invalid. Export it before continuing.');
            await manager.importLegacyScans(scans);
            await store.setMeta('legacy-scans-imported', true);
          }
        }
        await preparePages(ownerId);
        await store.setMeta('pages-prepared-at', Date.now());
        localStorage.setItem(ACTIVE_USER, ownerId);
        navigator.serviceWorker?.controller?.postMessage({ type: 'SET_OWNER', owner: ownerId });
        await manager.syncWithServer(true);
        await pull();
        if (active) manager.reportError(null);
      } catch (error) { report(error); throw error; }
      finally { preparing = false; if (active) setPreparing(false); }
    };
    prepareRef.current = prepare;
    void manager.init().then(async () => {
      if (!active) return;
      setConnection({ownerId,manager});
      localStorage.setItem(ACTIVE_USER, ownerId);
      navigator.serviceWorker?.controller?.postMessage({ type: 'SET_OWNER', owner: ownerId });
      setState(value => ({ ...value }));
      if (navigator.onLine) await prepare();
    }).catch(report);
    const timer = setInterval(() => { void pull().catch(report); }, 20000);
    return () => { active = false; unsubscribe(); clearInterval(timer); manager.destroy(); prepareRef.current = async () => {}; };
  }, [ownerId]);

  const manager = connection?.ownerId === ownerId ? connection.manager : null;
  return <SyncContext.Provider value={{ syncManager: manager, state, isModalOpen, isBridgeModalOpen, isPreparing, prepareOffline, openModal: () => setModalOpen(true), closeModal: () => setModalOpen(false), openBridgeModal: () => setBridgeOpen(true), closeBridgeModal: () => setBridgeOpen(false) }}>
    {children}
    {manager && <><SyncProgressModal syncManager={manager} isOpen={isModalOpen} onClose={() => setModalOpen(false)} onPrepare={prepareOffline} isPreparing={isPreparing} /><P2PBridgeModal syncManager={manager} isOpen={isBridgeModalOpen} onClose={() => setBridgeOpen(false)} /></>}
  </SyncContext.Provider>;
}
export const useSyncManager = () => useContext(SyncContext);
