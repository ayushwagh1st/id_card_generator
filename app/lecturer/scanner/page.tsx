'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
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
import { getSessionsAction } from '@/app/actions/sessions'
import { formatSessionLabel } from '@/lib/formatters'
import { recordAttendanceAction, bulkSyncAttendanceAction } from '@/app/actions/attendance'
import { createClient } from '@/lib/supabase/client'

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
  const supabase = createClient()

  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>(initialSession || 'none')
  const [mode, setMode] = useState<'check-in' | 'check-out'>('check-in')
  
  // Offline & Bulk Support
  const [isOnline, setIsOnline] = useState(true)
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [pendingScans, setPendingScans] = useState<any[]>([])
  const [recentScans, setRecentScans] = useState<{id: string, time: Date, status: string, msg: string}[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  
  const [lastScanResult, setLastScanResult] = useState<{status: 'success'|'error'|'late'|'offline', message: string, volunteer?: {name: string, photo: string | null}} | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [manualId, setManualId] = useState('')

  const lastScannedIdRef = useRef<{id: string, time: number} | null>(null)

  // 1. Load Sessions & Offline Data
  useEffect(() => {
      async function loadSessions() {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          try {
            const role = user.user_metadata?.role
            const lecturerFilter = role === 'LECTURER' ? user.id : 'all'
            const res = await getSessionsAction(1, 100, '', 'all', lecturerFilter)
            setSessions(res.data || [])
            // Save sessions locally for offline use
            localStorage.setItem('lecturer_sessions', JSON.stringify(res.data || []))
          } catch (e) {
              // Fallback to local
              const localSessions = localStorage.getItem('lecturer_sessions')
              if (localSessions) setSessions(JSON.parse(localSessions))
          }
      }
      loadSessions()

      // Load pending scans
      const localScans = localStorage.getItem('pending_scans')
      if (localScans) setPendingScans(JSON.parse(localScans))

      // Network Listeners
      setIsOnline(navigator.onLine)
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      return () => {
          window.removeEventListener('online', handleOnline)
          window.removeEventListener('offline', handleOffline)
      }
  }, [supabase.auth])

  // 2. Auto Sync
  useEffect(() => {
      if (isOnline && pendingScans.length > 0 && !isSyncing) {
          syncPendingScans()
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  const syncPendingScans = async () => {
      if (pendingScans.length === 0 || isSyncing) return
      setIsSyncing(true)
      toast('Syncing offline scans...')
      try {
          const res = await bulkSyncAttendanceAction(pendingScans)
          if (res?.success) {
              toast.success(`Successfully synced ${pendingScans.length} offline scans!`)
              setPendingScans([])
              localStorage.removeItem('pending_scans')
          } else {
              throw new Error('Sync failed')
          }
      } catch (e: any) {
          toast.error('Failed to sync. Will retry later.')
      } finally {
          setIsSyncing(false)
      }
  }

  const pushRecentScan = (id: string, status: string, msg: string) => {
      setRecentScans(prev => [{ id, time: new Date(), status, msg }, ...prev].slice(0, 5))
  }

  const handleScan = async (rawData: string) => {
      // Extract ID from URL if QR contains a verify URL
      let data = rawData;
      if (data && data.includes('/verify/')) {
          const split = data.split('/verify/');
          if (split.length > 1) {
              data = split[1];
          }
      }

      if (!data || selectedSessionId === 'none' || isProcessing) return
      
      // Cooldown check for same ID (prevent accidental double scan of same person within 3 seconds)
      const now = Date.now()
      if (lastScannedIdRef.current && lastScannedIdRef.current.id === data && now - lastScannedIdRef.current.time < 3000) {
          return // Ignore rapid double scan of the SAME person
      }
      lastScannedIdRef.current = { id: data, time: now }
      
      playBeep()

      if (!isBulkMode) setIsProcessing(true)

      const timestamp = new Date().toISOString()

      if (!isOnline) {
          // OFFLINE MODE: Save to local storage
          const newScan = { scanData: data, sessionId: selectedSessionId, mode, timestamp }
          const updatedPending = [...pendingScans, newScan]
          setPendingScans(updatedPending)
          localStorage.setItem('pending_scans', JSON.stringify(updatedPending))
          
          setLastScanResult({ status: 'offline', message: `Saved offline: ${data}` })
          pushRecentScan(data, 'offline', 'Saved Offline')
          
          if (!isBulkMode) {
              setTimeout(() => {
                  setIsProcessing(false)
                  setTimeout(() => setLastScanResult(null), 2000)
              }, 1000)
          }
          return
      }

      // ONLINE MODE
      try {
          // If bulk mode, we don't await blocking UI
          if (isBulkMode) {
              recordAttendanceAction(data, selectedSessionId, mode).then(res => {
                  if (res?.error) {
                      pushRecentScan(data, 'error', res.error)
                      toast.error(res.error)
                  } else {
                      const st = res.message?.includes('Late') ? 'late' : 'success'
                      pushRecentScan(data, st, res.message || 'Success')
                  }
              })
              setLastScanResult({ status: 'success', message: 'Processing...' })
              setTimeout(() => setLastScanResult(null), 1000)
          } else {
              const res = await recordAttendanceAction(data, selectedSessionId, mode)
              if (res?.error) {
                  setLastScanResult({ status: 'error', message: res.error })
                  pushRecentScan(data, 'error', res.error)
              } else {
                  const st = res.message?.includes('Late') ? 'late' : 'success'
                  setLastScanResult({ status: st, message: res.message || 'Success', volunteer: res.volunteer })
                  pushRecentScan(data, st, res.message || 'Success')
              }
          }
      } catch (err: any) {
          setLastScanResult({ status: 'error', message: err.message || 'Scan failed' })
          pushRecentScan(data, 'error', 'Network Error')
      } finally {
          if (!isBulkMode) {
              setTimeout(() => {
                  setIsProcessing(false)
                  setTimeout(() => setLastScanResult(null), 2000)
              }, 1500)
          }
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row gap-4 justify-between md:items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
                {isOnline ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-100 rounded-full text-xs font-bold backdrop-blur-md border border-emerald-400/20">
                        <Wifi className="w-3.5 h-3.5" /> ONLINE
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-100 rounded-full text-xs font-bold backdrop-blur-md border border-rose-400/20">
                        <WifiOff className="w-3.5 h-3.5" /> OFFLINE
                    </div>
                )}
                {pendingScans.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-100 rounded-full text-xs font-bold backdrop-blur-md border border-amber-400/20 cursor-pointer" onClick={syncPendingScans}>
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> {pendingScans.length} PENDING SYNC
                    </div>
                )}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">QR Attendance Scanner</h1>
            <p className="text-blue-100 mt-2 text-sm max-w-xl">
              Scan volunteer ID cards to record attendance. {isOnline ? 'Data saved in real-time.' : 'Data saved locally.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-md">
            <Select value={selectedSessionId} onValueChange={(val: any) => setSelectedSessionId(val)}>
                <SelectTrigger className="w-full sm:w-[250px] bg-white text-zinc-900 border-none font-semibold">
                    <span data-slot="select-value" className="flex flex-1 text-left truncate">
                      {selectedSessionId !== 'none' && sessions.length > 0
                        ? formatSessionLabel(sessions.find(s => s.id === selectedSessionId))
                        : "-- Select Session --"}
                    </span>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">-- Select Session --</SelectItem>
                    {sessions.map(s => (
                        <SelectItem key={s.id} value={s.id} label={formatSessionLabel(s)}>{formatSessionLabel(s)}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={mode} onValueChange={(val: any) => setMode(val)}>
                <SelectTrigger className="w-full sm:w-[150px] bg-white text-zinc-900 border-none font-semibold">
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
      </div>

      {selectedSessionId === 'none' ? (
          <Card className="border-dashed border-2 bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                      <Camera className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold">Please select a session</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                      You must select an active session from the top menu before you can start scanning ID cards.
                  </p>
              </CardContent>
          </Card>
      ) : (
          <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-lg border-primary/10 overflow-hidden relative flex flex-col">
                  <CardHeader className="bg-muted/30 pb-4 border-b flex flex-row items-center justify-between">
                      <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                              <Camera className="w-5 h-5 text-indigo-500" /> Live Scanner
                          </CardTitle>
                          <CardDescription>Position the QR code inside the frame</CardDescription>
                      </div>
                      <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-lg border">
                          <Switch id="bulk-mode" checked={isBulkMode} onCheckedChange={setIsBulkMode} />
                          <Label htmlFor="bulk-mode" className="font-bold cursor-pointer">Bulk Mode</Label>
                      </div>
                  </CardHeader>
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
                              <div className="w-12 h-12 rounded-full border-4 border-t-indigo-500 border-indigo-200 animate-spin mb-4" />
                              <p className="font-bold tracking-widest uppercase">Processing...</p>
                          </div>
                      )}

                      {/* Overlay Result */}
                      {lastScanResult && (
                          <div className={`absolute bottom-0 left-0 right-0 p-6 transform transition-transform animate-in slide-in-from-bottom-10 z-20 ${
                              lastScanResult.status === 'success' ? 'bg-emerald-500/95 backdrop-blur-md text-white border-t border-emerald-400' :
                              lastScanResult.status === 'late' ? 'bg-amber-500/95 backdrop-blur-md text-white border-t border-amber-400' :
                              lastScanResult.status === 'offline' ? 'bg-zinc-800/95 backdrop-blur-md text-white border-t border-zinc-700' :
                              'bg-rose-500/95 backdrop-blur-md text-white border-t border-rose-400'
                          }`}>
                              <div className="flex items-center gap-4">
                                  {lastScanResult.volunteer?.photo ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={lastScanResult.volunteer.photo} alt="Volunteer" className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover shrink-0 bg-white/20" />
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
                                          <span className="text-xl font-extrabold tracking-tight drop-shadow-sm">
                                              {lastScanResult.volunteer.name}
                                          </span>
                                      )}
                                      <p className="font-semibold text-sm opacity-90 leading-tight mt-1">{lastScanResult.message}</p>
                                  </div>
                              </div>
                          </div>
                      )}
                  </CardContent>
              </Card>

              <div className="space-y-6 flex flex-col">
                  {/* Recent Scans in Bulk Mode */}
                  {isBulkMode && (
                      <Card className="shadow-lg border-primary/10 flex-1 flex flex-col max-h-[300px]">
                          <CardHeader className="py-4">
                              <CardTitle className="text-sm flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-indigo-500" /> Recent Scans
                              </CardTitle>
                          </CardHeader>
                          <CardContent className="flex-1 overflow-y-auto pt-0">
                              {recentScans.length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-8">Waiting for scans...</p>
                              ) : (
                                  <div className="space-y-2">
                                      {recentScans.map((r, i) => (
                                          <div key={i} className={`text-xs p-2 rounded-lg border flex justify-between items-center ${
                                              r.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' :
                                              r.status === 'late' ? 'bg-amber-50 border-amber-100 text-amber-900' :
                                              r.status === 'offline' ? 'bg-zinc-100 border-zinc-200 text-zinc-900' :
                                              'bg-rose-50 border-rose-100 text-rose-900'
                                          }`}>
                                              <span className="font-bold truncate max-w-[150px]">{r.snk_id || r.volunteer?.full_name || 'Unknown Volunteer'}</span>
                                              <span className="font-semibold">{r.msg}</span>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </CardContent>
                      </Card>
                  )}

                  <Card className="shadow-lg border-primary/10">
                      <CardHeader>
                          <CardTitle className="text-lg">Manual Entry</CardTitle>
                          <CardDescription>If the QR code cannot be scanned.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <form onSubmit={handleManualEntry} className="flex gap-2">
                              <Input 
                                placeholder="Enter Volunteer ID (SNK ID)" 
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                                disabled={isProcessing && !isBulkMode}
                              />
                              <Button type="submit" disabled={!manualId || (isProcessing && !isBulkMode)}>Submit</Button>
                          </form>
                      </CardContent>
                  </Card>

                  <Card className="shadow-lg border-primary/10 flex-1">
                      <CardHeader>
                          <CardTitle className="text-lg">Instructions</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground space-y-2">
                          <p><strong>Bulk Mode:</strong> Enable to scan multiple people rapidly without pausing the camera.</p>
                          <p><strong>Offline Mode:</strong> If you lose connection, scans are saved to your device. Keep this page open. They will sync automatically when connection restores.</p>
                      </CardContent>
                  </Card>
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
