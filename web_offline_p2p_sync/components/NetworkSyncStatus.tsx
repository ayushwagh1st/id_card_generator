import React, { useEffect, useState } from 'react';
import { SyncManager, SyncState } from '../core/SyncManager';

interface NetworkSyncStatusProps {
  syncManager: SyncManager;
  onOpenModal?: () => void;
}

export const NetworkSyncStatus: React.FC<NetworkSyncStatusProps> = ({ syncManager, onOpenModal }) => {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<SyncState>({
    isOnline: true,
    isSyncing: false,
    peerCount: 0,
    pendingCount: 0,
    lastSyncedTime: null,
  });

  useEffect(() => {
    setMounted(true);
    const unsubscribe = syncManager.subscribeState(setState);
    return () => unsubscribe();
  }, [syncManager]);

  if (!mounted) return null;

  const getStatusBadge = () => {
    if (state.isSyncing) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm animate-pulse">
          <span className="w-2 h-2 mr-2 bg-amber-500 rounded-full animate-ping"></span>
          Syncing ({state.pendingCount} pending)...
        </span>
      );
    }

    if (state.isOnline) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
          <span className="w-2 h-2 mr-2 bg-emerald-500 rounded-full"></span>
          Online & Synced
        </span>
      );
    }

    if (state.peerCount > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300 shadow-sm">
          <span className="w-2 h-2 mr-2 bg-sky-500 rounded-full"></span>
          Offline (P2P Mesh Active • {state.peerCount} Peers)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 shadow-sm">
        <span className="w-2 h-2 mr-2 bg-rose-500 rounded-full"></span>
        Offline ({state.pendingCount} Saved Locally)
      </span>
    );
  };

  return (
    <div
      onClick={onOpenModal}
      className="cursor-pointer transition-all hover:opacity-90 inline-block"
      title="Click to view offline queue & sync details"
    >
      {getStatusBadge()}
    </div>
  );
};
