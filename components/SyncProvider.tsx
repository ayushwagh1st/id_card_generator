'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { SyncManager, SyncState } from '@/web_offline_p2p_sync/core/SyncManager';
import { SyncProgressModal } from '@/web_offline_p2p_sync/components/SyncProgressModal';

interface SyncContextType {
  syncManager: SyncManager | null;
  state: SyncState;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
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
  openModal: () => {},
  closeModal: () => {},
});

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const syncManagerRef = useRef<SyncManager | null>(null);
  const [state, setState] = useState<SyncState>(defaultState);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  return (
    <SyncContext.Provider
      value={{
        syncManager: syncManagerRef.current,
        state,
        isModalOpen,
        openModal,
        closeModal,
      }}
    >
      {children}
      {syncManagerRef.current && (
        <SyncProgressModal
          syncManager={syncManagerRef.current}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}
    </SyncContext.Provider>
  );
};

export const useSyncManager = () => useContext(SyncContext);
