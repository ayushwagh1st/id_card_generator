'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { 
  Camera, 
  UserPlus, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Network, 
  ShieldCheck, 
  Sun, 
  Moon, 
  ArrowRight, 
  Share2, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle, 
  DownloadCloud,
  QrCode
} from 'lucide-react';
import { toast } from 'sonner';
import { useSyncManager } from '@/components/SyncProvider';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';

// Dynamically import operational sub-views to keep initial bundle light
const ScannerPage = dynamic(() => import('@/app/lecturer/scanner/page'), {
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground">Loading attendance scanner module…</p>
    </div>
  ),
  ssr: false
});

const SpotRegistration = dynamic(() => import('@/components/spot-registration/SpotRegistration').then(mod => mod.SpotRegistration), {
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground">Loading spot registration form…</p>
    </div>
  ),
  ssr: false
});

type OfflineTab = 'scanner' | 'registration' | 'sync' | 'mesh';

export default function OfflineOperationsPage() {
  const [activeTab, setActiveTab] = useState<OfflineTab>('scanner');
  const [screenLocked, setScreenLocked] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { resolvedTheme, setTheme } = useTheme();
  const { 
    state, 
    syncManager, 
    openModal, 
    openBridgeModal, 
    prepareOffline, 
    isPreparing 
  } = useSyncManager();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Screen Wake Lock to prevent phone screen from timing out during busy scanning
  useEffect(() => {
    let wakeLockSentinel: any = null;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator && (activeTab === 'scanner' || activeTab === 'registration')) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          setScreenLocked(true);
          wakeLockSentinel.addEventListener('release', () => {
            setScreenLocked(false);
          });
        }
      } catch {
        setScreenLocked(false);
      }
    };

    void requestLock();

    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [activeTab]);

  const toggleWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        if (screenLocked) {
          setScreenLocked(false);
          toast.info('Screen wake lock released');
        } else {
          await (navigator as any).wakeLock.request('screen');
          setScreenLocked(true);
          toast.success('Screen will remain awake during scanning');
        }
      } else {
        toast.info('Screen Wake Lock is not supported on this browser');
      }
    } catch (err: any) {
      toast.error('Could not acquire screen lock: ' + (err.message || 'Permission denied'));
    }
  }, [screenLocked]);

  const handleManualSync = async () => {
    if (!syncManager) return;
    setIsRetryingSync(true);
    try {
      await syncManager.retryFailed();
      toast.success('Sync triggered. Reconciling queued operations…');
    } catch (err: any) {
      toast.error(err.message || 'Sync failed. Records remain safely stored locally.');
    } finally {
      setIsRetryingSync(false);
    }
  };

  const handlePrepareOffline = async () => {
    try {
      await prepareOffline();
      toast.success('Device cache and offline resources successfully prepared!');
    } catch (err: any) {
      toast.error(err.message || 'Could not verify offline package.');
    }
  };

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div className="app-workspace min-h-screen flex flex-col bg-background text-foreground selection:bg-amber-500/20">
      {/* Top Mission Control Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand & Context */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-600/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Sant Nirankari Mandal
                </span>
                <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-border" />
                <span className="hidden sm:inline-block text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  Bal Pradarshani 2027
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground truncate">
                Offline Field Operations Hub
              </h1>
            </div>
          </div>

          {/* Real-time Status Badge & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Connectivity Pill */}
            <button
              type="button"
              onClick={openModal}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium border transition-colors ${
                state.isSyncing
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : state.isOnline
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : state.peerCount > 0
                  ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
              }`}
              title="Click to view queue & synchronization details"
            >
              {state.isSyncing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-500" />
                  <span className="hidden sm:inline">Syncing</span>
                  <span>{state.pendingCount}</span>
                </>
              ) : state.isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Online</span>
                  {state.pendingCount > 0 && <span className="font-semibold">({state.pendingCount} queued)</span>}
                </>
              ) : state.peerCount > 0 ? (
                <>
                  <Network className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>{state.peerCount} Peer{state.peerCount > 1 ? 's' : ''}</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Offline</span>
                  {state.pendingCount > 0 && <span className="font-semibold">({state.pendingCount})</span>}
                </>
              )}
            </button>

            {/* Screen Awake Toggle for Volunteers */}
            <button
              type="button"
              onClick={toggleWakeLock}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border ${
                screenLocked 
                  ? 'bg-primary/10 text-primary border-primary/30' 
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              }`}
              title="Toggle screen wake lock"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>{screenLocked ? 'Screen Awake' : 'Awake: Off'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Link to Online Portal */}
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-card border border-border text-foreground hover:bg-muted transition-colors"
            >
              <span className="hidden sm:inline">Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Error Notification Banner if present */}
        {state.error && (
          <div 
            role="alert" 
            className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-medium">Operational Notice</p>
              <p className="text-xs opacity-90">{state.error}</p>
            </div>
            {state.isOnline && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManualSync}
                disabled={isRetryingSync}
                className="shrink-0 text-xs border-destructive/40 hover:bg-destructive/10"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRetryingSync ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Telemetry & Quick Action Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Network Mode */}
          <GlassCard className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Operating Mode
              </span>
              {state.isOnline ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Local Mesh
                </span>
              )}
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold tracking-tight">
                {state.isOnline ? 'Online Connected' : 'Offline Autonomous'}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {state.isOnline ? 'Direct Supabase cloud link' : 'IndexedDB encrypted store active'}
              </p>
            </div>
          </GlassCard>

          {/* Card 2: Queued Mutations */}
          <GlassCard className="p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-colors" onClick={openModal}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Unsynced Outbox
              </span>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold tracking-tight flex items-baseline gap-2">
                <span>{state.pendingCount}</span>
                <span className="text-xs font-normal text-muted-foreground">records pending</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary mt-1 font-medium">
                <span>Review queue</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </GlassCard>

          {/* Card 3: P2P Peer Mesh */}
          <GlassCard className="p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-colors" onClick={openBridgeModal}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Nearby Peers
              </span>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold tracking-tight flex items-baseline gap-2">
                <span>{state.peerCount}</span>
                <span className="text-xs font-normal text-muted-foreground">linked devices</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary mt-1 font-medium">
                <span>Pair via QR code</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Tab Navigation Controls */}
        <nav 
          role="tablist" 
          aria-label="Offline operational views" 
          className="flex flex-wrap items-center gap-2 border-b border-border pb-3"
        >
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'scanner'}
            aria-controls="panel-scanner"
            id="tab-scanner"
            onClick={() => setActiveTab('scanner')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'scanner'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground border border-border hover:text-foreground hover:bg-muted'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Attendance Scanner</span>
          </button>

          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'registration'}
            aria-controls="panel-registration"
            id="tab-registration"
            onClick={() => setActiveTab('registration')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'registration'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground border border-border hover:text-foreground hover:bg-muted'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Spot Registration</span>
          </button>

          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'sync'}
            aria-controls="panel-sync"
            id="tab-sync"
            onClick={() => setActiveTab('sync')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'sync'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground border border-border hover:text-foreground hover:bg-muted'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            <span>Outbox & Sync</span>
            {state.pendingCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold leading-none ${
                activeTab === 'sync' 
                  ? 'bg-primary-foreground text-primary' 
                  : 'bg-amber-500 text-white'
              }`}>
                {state.pendingCount}
              </span>
            )}
          </button>

          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'mesh'}
            aria-controls="panel-mesh"
            id="tab-mesh"
            onClick={() => setActiveTab('mesh')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'mesh'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground border border-border hover:text-foreground hover:bg-muted'
            }`}
          >
            <Share2 className="h-4 w-4" />
            <span>Device Mesh (P2P)</span>
          </button>
        </nav>

        {/* View Content Panels */}
        {!syncManager ? (
          /* Uninitialized / First-Time Setup State */
          <GlassCard className="p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Initializing Local Storage & Encryption Keys
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Opening your device&apos;s encrypted IndexedDB database and verifying cryptographic volunteer identity tokens.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-muted/40 text-left text-xs space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-amber-500" />
                First time using this device in the field?
              </p>
              <p className="text-muted-foreground leading-normal">
                To enable tamper-proof offline operations, this device must be signed in once while connected to the internet. This downloads the offline roster cache and provisions your device keys.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link 
                href="/login" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:opacity-95"
              >
                <span>Sign in online to prepare device</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </GlassCard>
        ) : (
          <div className="min-w-0">
            {/* Tab 1: Attendance Scanner */}
            {activeTab === 'scanner' && (
              <div 
                id="panel-scanner" 
                role="tabpanel" 
                aria-labelledby="tab-scanner"
                className="animate-in fade-in duration-200"
              >
                <ScannerPage />
              </div>
            )}

            {/* Tab 2: Spot Registration */}
            {activeTab === 'registration' && (
              <div 
                id="panel-registration" 
                role="tabpanel" 
                aria-labelledby="tab-registration"
                className="animate-in fade-in duration-200"
              >
                <SpotRegistration />
              </div>
            )}

            {/* Tab 3: Outbox & Sync Hub */}
            {activeTab === 'sync' && (
              <div 
                id="panel-sync" 
                role="tabpanel" 
                aria-labelledby="tab-sync"
                className="animate-in fade-in duration-200 space-y-6"
              >
                <GlassCard className="p-6 md:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">Synchronization & Outbox Center</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Review mutations pending cloud ingestion, inspect conflict proofs, or verify offline assets.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        variant="outline" 
                        onClick={openModal}
                        className="text-xs"
                      >
                        <HardDrive className="h-3.5 w-3.5 mr-1.5" />
                        Inspect Outbox Queue
                      </Button>
                      <Button 
                        onClick={handleManualSync}
                        disabled={isRetryingSync || !state.isOnline}
                        className="text-xs"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRetryingSync ? 'animate-spin' : ''}`} />
                        Sync to Server Now
                      </Button>
                    </div>
                  </div>

                  {/* Outbox Metrics & Offline Assets Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-card">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Pending Queue</span>
                      <div className="text-2xl font-bold mt-1 text-foreground">{state.pendingCount} records</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {state.pendingCount === 0 
                          ? 'All local operations reconciled with server.' 
                          : 'Awaiting cloud verification or peer connection.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-card">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Last Cloud Sync</span>
                      <div className="text-lg font-bold mt-1 text-foreground">
                        {state.lastSyncedTime 
                          ? new Date(state.lastSyncedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                          : 'Not synced this session'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {state.isOnline ? 'Background polling active every 15s.' : 'Paused while disconnected.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-card">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Offline Bundle</span>
                      <div className="text-lg font-bold mt-1 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Ready & Cached</span>
                      </div>
                      <button
                        type="button"
                        onClick={handlePrepareOffline}
                        disabled={isPreparing}
                        className="text-xs text-primary font-medium hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        <DownloadCloud className="h-3.5 w-3.5" />
                        <span>{isPreparing ? 'Verifying bundle…' : 'Re-verify offline assets'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Safety Guidance Card */}
                  <div className="p-4 sm:p-5 rounded-xl border border-border bg-muted/30 text-xs text-foreground space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span>Local Storage Guidelines</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground leading-relaxed">
                      <li>Every scan and registration is saved to IndexedDB <strong>before</strong> visual confirmation is given.</li>
                      <li>Even if your browser or device restarts, all queued mutations persist safely on disk.</li>
                      <li>Do not clear browser storage, wipe site data, or use disposable Incognito windows until pending records reach 0.</li>
                      <li>When internet connectivity is restored anywhere on the grounds, queued records automatically reconcile.</li>
                    </ul>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Tab 4: Peer Mesh Network (P2P) */}
            {activeTab === 'mesh' && (
              <div 
                id="panel-mesh" 
                role="tabpanel" 
                aria-labelledby="tab-mesh"
                className="animate-in fade-in duration-200 space-y-6"
              >
                <GlassCard className="p-6 md:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">Offline Peer-to-Peer Data Bridge</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Synchronize records directly between two devices using camera QR codes — zero internet or local router needed.
                      </p>
                    </div>
                    <Button onClick={openBridgeModal} className="text-xs shrink-0">
                      <QrCode className="h-4 w-4 mr-2" />
                      Launch Pairing Bridge
                    </Button>
                  </div>

                  {/* 3 Step Explanation Flow */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-xl border border-border bg-card space-y-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                        1
                      </div>
                      <h3 className="font-semibold text-sm">Generate QR Offer</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Device A selects &quot;Create Bridge Offer&quot; to generate an encrypted connection QR code containing its WebRTC network description.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl border border-border bg-card space-y-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                        2
                      </div>
                      <h3 className="font-semibold text-sm">Scan with Camera</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Device B scans the code with its camera and generates a return confirmation QR. Device A scans back to complete the handshake.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl border border-border bg-card space-y-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                        3
                      </div>
                      <h3 className="font-semibold text-sm">High-Speed Mesh Sync</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        A direct, high-bandwidth WebRTC DataChannel opens, synchronizing all missing attendee records and attendance logs in milliseconds.
                      </p>
                    </div>
                  </div>

                  {/* Connected Peers Status */}
                  <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Network className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {state.peerCount} Active Remote Mesh Channel{state.peerCount !== 1 ? 's' : ''}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {state.peerCount > 0 
                            ? 'Actively broadcasting and reconciling records with nearby peers.' 
                            : 'No remote peer devices currently paired. Open the bridge above to connect.'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={openBridgeModal}
                      className="text-xs"
                    >
                      Connect
                    </Button>
                  </div>
                </GlassCard>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Field Troubleshooting & Instructions Accordion */}
        <div className="border border-border/80 rounded-xl bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span>Event Field Operations & Battery Guide</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {showGuide ? 'Collapse guidance ▲' : 'Expand guidance ▼'}
            </span>
          </button>

          {showGuide && (
            <div className="p-4 sm:p-6 border-t border-border bg-muted/20 text-xs text-muted-foreground space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Camera Scanning in Low Light / Glare</p>
                  <p>Hold the ID badge 15–20cm away from the camera. If outdoor sunlight creates glare on plastic pouches, angle the card slightly (15 degrees) away from the sun.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Screen Always On</p>
                  <p>Keep the &quot;Screen Awake&quot; toggle enabled in the header to prevent your phone or tablet from sleeping between attendee scans.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Intermittent Wi-Fi or No Cellular</p>
                  <p>Do not reload or disconnect. Continue scanning as normal. All operations queue into local IndexedDB and sync automatically once in range of network.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Low Battery or Device Swap</p>
                  <p>Before swapping devices, pair with another volunteer&apos;s phone via the &quot;Device Mesh (P2P)&quot; tab to transfer your pending records so none remain stranded.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
