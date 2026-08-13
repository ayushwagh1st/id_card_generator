'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { SyncManager, SyncState } from '@/web_offline_p2p_sync/core/SyncManager';
import { SyncProgressModal } from '@/web_offline_p2p_sync/components/SyncProgressModal';
import { createClient } from '@/lib/supabase/client';
import { P2PBridgeModal } from '@/web_offline_p2p_sync/components/P2PBridgeModal';

interface SyncContextType {
  syncManager: SyncManager | null;
  state: SyncState;
  isModalOpen: boolean;
  isBridgeModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  openBridgeModal: () => void;
  closeBridgeModal: () => void;
}

const defaultState: SyncState = {
  isOnline: true,
  isSyncing: false,
  peerCount: 0,
  pendingCount: 0,
  lastSyncedTime: null,
};

const SyncContext = createContext<SyncContextType>({
  syncManager: null,
  state: defaultState,
  isModalOpen: false,
  isBridgeModalOpen: false,
  openModal: () => {},
  closeModal: () => {},
  openBridgeModal: () => {},
  closeBridgeModal: () => {},
});

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const syncManagerRef = useRef<SyncManager | null>(null);
  const [state, setState] = useState<SyncState>(defaultState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (!syncManagerRef.current && typeof window !== 'undefined') {
    syncManagerRef.current = new SyncManager({
      pingUrl: '/api/health',
      dbName: 'app_offline_outbox',
      channelName: 'app_p2p_mesh',
    });
  }

  useEffect(() => {
    const manager = syncManagerRef.current;
    if (!manager) return;

    // Set server upload handler
    manager.setServerUploadHandler(async (batch) => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('AUTH_EXPIRED');
        }

        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batch }),
        });

        if (!response.ok) {
          throw new Error(`Sync server HTTP error ${response.status}`);
        }

        const data = await response.json();
        return {
          successIds: data.successIds || [],
          failedIds: data.failedIds || [],
        };
      } catch (err: any) {
        console.error('[SyncProvider] Server upload failed:', err);
        throw err;
      }
    });

    // Subscribe to state updates
    const unsubscribe = manager.subscribeState((newState) => {
      setState(newState);
    });

    // Initialize manager
    manager.init().then(() => setInitialized(true));

    return () => {
      unsubscribe();
      manager.destroy();
    };
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openBridgeModal = () => setIsBridgeModalOpen(true);
  const closeBridgeModal = () => setIsBridgeModalOpen(false);

  return (
    <SyncContext.Provider
      value={{
        syncManager: syncManagerRef.current,
        state,
        isModalOpen,
        isBridgeModalOpen,
        openModal,
        closeModal,
        openBridgeModal,
        closeBridgeModal,
      }}
    >
      {children}
      {syncManagerRef.current && (
        <>
          <SyncProgressModal
            syncManager={syncManagerRef.current}
            isOpen={isModalOpen}
            onClose={closeModal}
          />
          <P2PBridgeModal
            syncManager={syncManagerRef.current}
            isOpen={isBridgeModalOpen}
            onClose={closeBridgeModal}
          />
        </>
      )}
    </SyncContext.Provider>
  );
};

export const useSyncManager = () => useContext(SyncContext);
