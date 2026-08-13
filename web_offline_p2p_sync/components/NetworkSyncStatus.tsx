import React, { useEffect, useState } from 'react';
import { SyncManager, SyncState } from '../core/SyncManager';
import { Wifi, WifiOff, HardDrive, RefreshCw, Network } from 'lucide-react';

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

  const getStatusContent = () => {
    if (state.isSyncing) {
      return {
        icon: <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />,
        text: state.pendingCount > 0 ? `${state.pendingCount} left` : 'Syncing',
        styles: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
        pulse: true
      };
    }

    if (state.isOnline) {
      return {
        icon: <Wifi className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
        text: 'Online',
        styles: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50',
        pulse: false
      };
    }

    if (state.peerCount > 0) {
      return {
        icon: <Network className="w-4 h-4 text-sky-500 dark:text-sky-400" />,
        text: `${state.peerCount} Peer${state.peerCount > 1 ? 's' : ''}`,
        styles: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
        pulse: false
      };
    }

    return {
      icon: <WifiOff className="w-4 h-4 text-rose-500 dark:text-rose-400" />,
      text: state.pendingCount > 0 ? `${state.pendingCount} Saved` : 'Offline',
      styles: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
      pulse: false
    };
  };

  const content = getStatusContent();

  return (
    <div
      onClick={onOpenModal}
      className={`group cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 inline-flex items-center h-8 px-3 rounded-full border shadow-sm backdrop-blur-sm ${content.styles}`}
      title="View Sync Queue & Offline Details"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center">
          {content.pulse && (
            <span className="absolute w-full h-full rounded-full bg-current opacity-20 animate-ping"></span>
          )}
          {content.icon}
        </div>
        <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
          {content.text}
        </span>
      </div>
    </div>
  );
};
