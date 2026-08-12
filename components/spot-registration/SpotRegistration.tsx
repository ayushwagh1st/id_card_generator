'use client'

import React, { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { UserCheck, Camera, CheckCircle2, RefreshCw, QrCode, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner), {
  ssr: false,
})

export function SpotRegistration() {
  const [mode, setMode] = useState<'register' | 'attendance'>('register')
  const [scannedId, setScannedId] = useState<string | null>(null)
  const [scannedSerial, setScannedSerial] = useState<string | null>(null)
  const [childData, setChildData] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Form State
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    const { data, error } = await supabase.from('sessions').select('*').order('date', { ascending: true })
    if (!error && data) {
      setSessions(data)
    }
  }

  const handleScan = async (result: string) => {
    if (scannedId === result) return
    setScannedId(result)
    setLoading(true)

    try {
      const { data: qrData } = await supabase
        .from('qr_codes')
        .select('serial_number')
        .eq('id', result)
        .single()

      if (qrData) {
        setScannedSerial(`MSS-2027-${String(qrData.serial_number).padStart(3, '0')}`)
      } else {
        setScannedSerial(null)
      }

      const { data } = await supabase
        .from('children')
        .select('*, session:sessions(name)')
        .eq('qr_id', result)
        .single()

      if (data) {
        setChildData(data)
        if (mode === 'attendance') {
          const currentStatus = data.status || 'Registered'
          const newStatus = currentStatus === 'Checked In' ? 'Checked Out' : 'Checked In'
          const now = new Date().toISOString()

          await supabase
            .from('children')
            .update({
              status: newStatus,
              ...(newStatus === 'Checked In' ? { checked_in_at: now } : { checked_out_at: now }),
            })
            .eq('id', data.id)

          setChildData({ ...data, status: newStatus })
          toast.success(`Successfully ${newStatus === 'Checked In' ? 'checked in' : 'checked out'} ${data.name}`)

          setTimeout(() => {
            setScannedId(null)
            setScannedSerial(null)
            setChildData(null)
          }, 2000)
        } else {
          toast.info('Child already registered for this QR code!')
        }
      } else {
        if (mode === 'attendance') {
          toast.error('This QR code is not registered yet.')
          setTimeout(() => setScannedId(null), 2000)
        } else {
          setChildData(null)
          setName('')
          setContact('')
          setSessionId('')
          toast.success('New QR Scanned. Please register the attendee details.')
        }
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scannedId || !name || !contact || !sessionId) {
      toast.error('Please complete all required fields.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('children')
      .insert({
        name,
        contact_number: contact,
        session_id: sessionId,
        qr_id: scannedId,
        serial_number: scannedSerial || 'UNASSIGNED',
        status: 'Registered',
      })
      .select('*, session:sessions(name)')
      .single()

    if (error) {
      toast.error(error.message || 'Error registering child.')
    } else {
      toast.success(`Registered ${name} successfully!`)
      setChildData(data)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Mode Selector Glass Pill */}
      <GlassCard className="p-6" glowColor="blue">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>On-Site Registration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Spot Registration & Quick Scanner
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Scan pre-printed QR badges to pair attendee details or check in attendees.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-pill">
            <button
              onClick={() => setMode('register')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Register Mode
            </button>
            <button
              onClick={() => setMode('attendance')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'attendance'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Attendance Scanner
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Grid: Camera Scanner + Form Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera Scanner View */}
        <GlassCard className="p-6 flex flex-col justify-between" glowColor="purple">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-500" />
              Live QR Scanner
            </h3>
            {scannedId && (
              <button
                onClick={() => {
                  setScannedId(null)
                  setScannedSerial(null)
                  setChildData(null)
                }}
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Rescan
              </button>
            )}
          </div>

          <div className="relative aspect-square w-full rounded-2xl overflow-hidden glass-panel border border-purple-500/30 flex items-center justify-center bg-black/40">
            {!scannedId ? (
              <Scanner
                onScan={(results) => {
                  if (results && results.length > 0) {
                    handleScan(results[0].rawValue)
                  }
                }}
              />
            ) : (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Badge Scanned
                </div>
                <div className="text-xs font-mono px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 inline-block border border-blue-500/20">
                  {scannedSerial || scannedId}
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Form Registration View */}
        <GlassCard className="p-6" glowColor="cyan">
          <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-cyan-500" />
            {mode === 'register' ? 'Attendee Information' : 'Check-In Result'}
          </h3>

          {childData ? (
            <div className="space-y-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
                  Registered Name
                </span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{childData.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Contact:</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {childData.contact_number}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <p className="font-medium text-emerald-500">{childData.status}</p>
                </div>
              </div>
            </div>
          ) : mode === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  Contact Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  Event Session
                </label>
                <select
                  required
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">Select a session slot...</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !scannedId}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'Registering...' : 'Complete Spot Registration'}
              </button>
            </form>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Point the camera at an attendee badge to toggle attendance instantly.
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
