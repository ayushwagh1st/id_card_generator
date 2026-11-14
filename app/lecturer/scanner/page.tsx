'use client'

import React, { useState, useEffect, Suspense, useRef, useReducer, useCallback } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Scanner } from '@yudiel/react-qr-scanner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Clock, XCircle, Camera, Users, LogIn, LogOut, Wifi, WifiOff, RefreshCw, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { getSessionsAction } from '@/server/actions/sessions'
import { formatSessionLabel } from '@/lib/formatters'
import { useSyncManager } from '@/components/SyncProvider'
import { normalizeScan } from '@/web_offline_p2p_sync/core/protocol'
import { GlassCard } from '@/components/ui/GlassCard'

// Audio fallback if file isn't present
const playBeep = () => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        osc.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
    } catch (e) {
        console.error('Audio beep failed', e)
    }
}

function ScannerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialSession = searchParams.get('session')

  const [state, dispatch] = React.useReducer(
    (state: any, action: any) => typeof action === 'function' ? { ...state, ...action(state) } : { ...state, ...action },
    {
      sessions: [],
      selectedSessionId: initialSession || 'none',
      mode: 'check-in',
      isOnline: true,
      isBulkMode: false,
      pendingScans: [],
      recentScans: [],
      isSyncing: false,
      lastScanResult: null,
      isProcessing: false,
      manualId: ''
    }
  )

  const {
    sessions, selectedSessionId, mode, isOnline, isBulkMode,
    pendingScans, recentScans, isSyncing, lastScanResult, isProcessing, manualId
  } = state

  const setSessions = useCallback((v: any) => dispatch((s: any) => ({ sessions: typeof v === 'function' ? v(s.sessions) : v })), [])
  const setSelectedSessionId = useCallback((v: any) => dispatch((s: any) => ({ selectedSessionId: typeof v === 'function' ? v(s.selectedSessionId) : v })), [])
  const setMode = useCallback((v: any) => dispatch((s: any) => ({ mode: typeof v === 'function' ? v(s.mode) : v })), [])
  const setIsOnline = useCallback((v: any) => dispatch((s: any) => ({ isOnline: typeof v === 'function' ? v(s.isOnline) : v })), [])
  const setIsBulkMode = useCallback((v: any) => dispatch((s: any) => ({ isBulkMode: typeof v === 'function' ? v(s.isBulkMode) : v })), [])
  const setPendingScans = useCallback((v: any) => dispatch((s: any) => ({ pendingScans: typeof v === 'function' ? v(s.pendingScans) : v })), [])
  const setRecentScans = useCallback((v: any) => dispatch((s: any) => ({ recentScans: typeof v === 'function' ? v(s.recentScans) : v })), [])
  const setIsSyncing = useCallback((v: any) => dispatch((s: any) => ({ isSyncing: typeof v === 'function' ? v(s.isSyncing) : v })), [])
  const setLastScanResult = useCallback((v: any) => dispatch((s: any) => ({ lastScanResult: typeof v === 'function' ? v(s.lastScanResult) : v })), [])
  const setIsProcessing = useCallback((v: any) => dispatch((s: any) => ({ isProcessing: typeof v === 'function' ? v(s.isProcessing) : v })), [])
  const setManualId = useCallback((v: any) => dispatch((s: any) => ({ manualId: typeof v === 'function' ? v(s.manualId) : v })), [])

  const lastScannedIdRef = useRef<{id: string, time: number} | null>(null)

  const { syncManager, state: syncState, openModal } = useSyncManager()
  const processingRef = useRef(false)

  useEffect(() => {
    if (!syncManager) return
    let active = true
    const refresh = async () => {
      const [localSessions, queued] = await Promise.all([
        syncManager.getLocalData('sessions'),
        syncManager.getPendingItemsByEntity('attendance_scans'),
      ])
      if (active) { setSessions(localSessions); setPendingScans(queued) }
    }
    const unsubscribe = syncManager.subscribeState(value => {
      if (!active) return
      setIsOnline(value.isOnline)
      setIsSyncing(value.isSyncing)
      void refresh().catch(error => toast.error(error.message))
    })
    return () => { active = false; unsubscribe() }
  }, [syncManager, setSessions, setPendingScans, setIsOnline, setIsSyncing])

  const syncPendingScans = async () => {
    try { await syncManager?.retryFailed() }
    catch (error: any) { toast.error(error.message || 'Records are still saved on this device.') }
  }

  const pushRecentScan = (id: string, status: string, msg: string) => {
    setRecentScans((prev: any) => [{ id, time: new Date(), status, msg }, ...prev].slice(0, 5))
  }

  const handleScan = async (rawData: string) => {
    const data = normalizeScan(rawData)
    if (!data || selectedSessionId === 'none' || (!isBulkMode && processingRef.current)) return
    if (!syncManager) { toast.error('Offline storage is still opening. Wait, then scan again.'); return }
    const now = Date.now()
    const scanKey = data + ':' + selectedSessionId + ':' + mode
    if (lastScannedIdRef.current?.id === scanKey && now - lastScannedIdRef.current.time < 3000) return
    lastScannedIdRef.current = { id: scanKey, time: now }
    if (!isBulkMode) { processingRef.current = true; setIsProcessing(true) }
    try {
      const timestamp = await syncManager.eventTime()
      await syncManager.mutate('attendance_scans', 'CREATE', { scanData: data, sessionId: selectedSessionId, mode, timestamp })
      playBeep()
      const message = 'Saved on this device. Server validation will follow.'
      setLastScanResult({ status: 'offline', message })
      pushRecentScan(data, 'offline', message)
    } catch (error: any) {
      lastScannedIdRef.current = null
      const message = error.message || 'Scan was not saved. Keep the badge and try again.'
      setLastScanResult({ status: 'error', message })
      pushRecentScan(data, 'error', message)
      toast.error(message)
    } finally {
      processingRef.current = false
      setIsProcessing(false)
    }
  }

  const handleManualEntry = (e: React.FormEvent) => {
      e.preventDefault()
      if (manualId) {
          handleScan(manualId)
          setManualId('')
      }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <GlassCard className="p-6 md:p-8" glowColor="blue">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500">
              <Camera className="w-4 h-4" />
              <span>Security Access Control</span>
              <button type="button" onClick={openModal} className="underline">Prepare and review offline storage</button>
              {pendingScans.length > 0 && (
                <button 
                  onClick={() => isOnline && syncPendingScans()} 
                  disabled={!isOnline || isSyncing}
                  className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[11px] font-mono font-semibold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> {pendingScans.length} PENDING
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Volunteer attendance
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Scan volunteer ID cards to log venue entry. Every scan is saved locally before upload. {syncState.error && <span role="alert">{syncState.error}</span>}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Select value={selectedSessionId} onValueChange={(val: any) => setSelectedSessionId(val)}>
              <SelectTrigger aria-label="Attendance session" className="w-full sm:w-[250px]">
                <span data-slot="select-value" className="flex flex-1 text-left truncate">
                  {selectedSessionId !== 'none' && sessions.length > 0
                    ? formatSessionLabel(sessions.find((s: any) => s.id === selectedSessionId))
                    : "-- Select Session --"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Select Session --</SelectItem>
                {sessions.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{formatSessionLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={mode} onValueChange={(val: any) => setMode(val)}>
              <SelectTrigger aria-label="Attendance action" className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="check-in">
                  <div className="flex items-center gap-2"><LogIn className="w-4 h-4 text-emerald-500"/> Check-In</div>
                </SelectItem>
                <SelectItem value="check-out">
                  <div className="flex items-center gap-2"><LogOut className="w-4 h-4 text-rose-500"/> Check-Out</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {selectedSessionId === 'none' ? (
        <GlassCard className="p-12 text-center" glowColor="purple">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Select a Duty Session</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Choose an active duty session from the top menu before scanning volunteer ID credentials.
          </p>
        </GlassCard>
      ) : (
          <div className="grid md:grid-cols-2 gap-6">
              <GlassCard className="p-0 overflow-hidden relative flex flex-col" glowColor="blue">
                  <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/60 flex flex-row items-center justify-between">
                      <div>
                          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                              <Camera className="w-5 h-5 text-blue-500" /> Live Optical Scanner
                          </h3>
                          <p className="text-xs text-slate-400">Position the QR code inside the viewfinder</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                          <Switch id="bulk-mode" checked={isBulkMode} onCheckedChange={setIsBulkMode} />
                          <Label htmlFor="bulk-mode" className="text-xs font-semibold cursor-pointer">Bulk Mode</Label>
                      </div>
                  </div>
                  <CardContent className="p-0 bg-black flex-1 min-h-[400px] relative flex items-center justify-center">
                      {(!isProcessing || isBulkMode) ? (
                          <Scanner 
                            onScan={(result) => {
                                if (result && result.length > 0) {
                                    handleScan(result[0].rawValue)
                                }
                            }}
                            components={{
                                onOff: false,
                                torch: true,
                                zoom: false,
                                finder: true
                            }}
                            styles={{
                                container: { width: '100%', height: '100%' },
                                video: { objectFit: 'cover' }
                            }}
                          />
                      ) : (
                          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-10 backdrop-blur-sm">
                              <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-blue-200 animate-spin mb-4" />
                              <p className="font-semibold text-xs tracking-widest uppercase">Processing Scan...</p>
                          </div>
                      )}

                      {/* Overlay Result */}
                      {lastScanResult && (
                          <div role={lastScanResult.status === 'error' ? 'alert' : 'status'} className="scanner-result absolute bottom-0 left-0 right-0 p-5 z-20" data-status={lastScanResult.status}>
                              <div className="flex items-center gap-4">
                                  {lastScanResult.volunteer?.photo ? (
                                      <Image src={lastScanResult.volunteer.photo} alt={`${lastScanResult.volunteer.name || 'Volunteer'}'s profile avatar`} width={64} height={64} unoptimized className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover shrink-0 bg-white/20" />
                                  ) : (
                                      <div className="w-16 h-16 rounded-full border-2 border-white/50 bg-white/10 flex items-center justify-center shrink-0 shadow-md">
                                          {lastScanResult.status === 'success' && <CheckCircle className="w-8 h-8 opacity-80" />}
                                          {lastScanResult.status === 'late' && <Clock className="w-8 h-8 opacity-80" />}
                                          {lastScanResult.status === 'offline' && <WifiOff className="w-8 h-8 opacity-80" />}
                                          {lastScanResult.status === 'error' && <XCircle className="w-8 h-8 opacity-80" />}
                                      </div>
                                  )}
                                  
                                  <div className="flex flex-col">
                                      {lastScanResult.volunteer?.name && (
                                          <span className="text-xl font-bold tracking-tight drop-shadow-sm">
                                              {lastScanResult.volunteer.name}
                                          </span>
                                      )}
                                      <p className="font-semibold text-sm opacity-90 leading-tight mt-1">{lastScanResult.message}</p>
                                  </div>
                              </div>
                          </div>
                      )}
                  </CardContent>
              </GlassCard>

              <div className="space-y-6 flex flex-col">
                  {/* Recent Scans in Bulk Mode */}
                  {isBulkMode && (
                      <GlassCard className="p-4 flex-1 flex flex-col max-h-[300px]" glowColor="cyan">
                          <div className="pb-3 mb-2 border-b border-slate-200/50 dark:border-slate-800/60">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-blue-500" /> Recent Scans
                              </h4>
                          </div>
                          <div className="flex-1 overflow-y-auto pt-0">
                              {recentScans.length === 0 ? (
                                  <p className="text-xs text-slate-400 text-center py-8">Waiting for scans...</p>
                              ) : (
                                  <div className="space-y-2">
                                      {recentScans.map((r: any, i: number) => (
                                          <div key={r.time.getTime() + '-' + i} className={`text-xs p-2.5 rounded-xl border flex justify-between items-center ${
                                              r.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                              r.status === 'late' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                              r.status === 'offline' ? 'bg-slate-500/10 border-slate-500/20 text-slate-400' :
                                              'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                          }`}>
                                              <span className="font-semibold truncate max-w-[150px]">{r.id || 'Unknown Volunteer'}</span>
                                              <span className="font-medium text-[11px]">{r.msg}</span>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </GlassCard>
                  )}

                  <GlassCard className="p-6" glowColor="purple">
                      <div className="mb-4">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">Manual ID Entry</h4>
                          <p className="text-xs text-slate-400 mt-0.5">Use manual entry if the QR code is damaged or unreadable.</p>
                      </div>
                      <form onSubmit={handleManualEntry} className="flex gap-2">
                          <Input 
                            aria-label="Volunteer SNK ID"
                            placeholder="Enter Volunteer ID (SNK ID)" 
                            value={manualId}
                            onChange={(e) => setManualId(e.target.value)}
                            disabled={isProcessing && !isBulkMode}
                          />
                          <Button type="submit" disabled={!manualId || (isProcessing && !isBulkMode)}>Submit</Button>
                      </form>
                  </GlassCard>

                  <GlassCard className="p-6 flex-1" glowColor="blue">
                      <div className="pb-3 mb-3 border-b border-slate-200/50 dark:border-slate-800/60">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">Duty Instructions</h4>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 font-normal leading-relaxed">
                          <p><strong className="text-slate-900 dark:text-white font-semibold">Bulk Mode:</strong> Enable to scan multiple people rapidly without pausing the camera viewfinder.</p>
                          <p><strong className="text-slate-900 dark:text-white font-semibold">Offline Mode:</strong> If internet connectivity is interrupted, scans are stored locally and synced automatically once connection restores.</p>
                      </div>
                  </GlassCard>
              </div>
          </div>
      )}
    </div>
  )
}

export default function LecturerScannerPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ScannerContent />
        </Suspense>
    )
}
