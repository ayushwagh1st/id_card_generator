import React, { useEffect, useState } from 'react';
import { SyncManager, SyncState } from '../core/SyncManager';

interface SyncProgressModalProps {
  syncManager: SyncManager;
  isOpen: boolean;
  onClose: () => void;
}

export const SyncProgressModal: React.FC<SyncProgressModalProps> = ({ syncManager, isOpen, onClose }) => {
  const [state, setState] = useState<SyncState>({
    isOnline: true,
    isSyncing: false,
    peerCount: 0,
    pendingCount: 0,
    lastSyncedTime: null,
  });

  useEffect(() => {
    const unsubscribe = syncManager.subscribeState(setState);
    return () => unsubscribe();
  }, [syncManager]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🔄</span> Offline P2P & Server Sync
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold"
          >
            &times;
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Connection Mode:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {state.isOnline ? '🌐 Cloud Connected' : '📡 Offline (Local Mesh)'}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Local P2P Peers:</span>
              <span className="font-semibold text-sky-600 dark:text-sky-400">{state.peerCount} Active Devices</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Pending Outbox Items:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">{state.pendingCount} Items Queued</span>
            </div>

            {state.lastSyncedTime && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Last Successful Sync:</span>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {new Date(state.lastSyncedTime).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-200 dark:border-blue-900">
            💡 <strong>Offline Mode Active:</strong> All changes are safely saved in IndexedDB and automatically relayed to nearby peer devices via WebRTC/BroadcastChannel. When internet is restored, data will automatically upload to the backend server.
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Close
          </button>
          <button
            disabled={!state.isOnline || state.isSyncing || state.pendingCount === 0}
            onClick={() => syncManager.syncWithServer()}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition flex items-center gap-2"
          >
            {state.isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
