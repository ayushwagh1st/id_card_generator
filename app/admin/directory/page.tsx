'use client'

import { useEffect, useState } from 'react'
import {
  getChildrenDirectoryAction,
  bulkCheckOutAction,
  toggleAttendanceStatusAction,
} from '@/server/actions/children'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getSessionsAction } from '@/server/actions/sessions'
import { GlassCard } from '@/components/ui/GlassCard'
import { Search, LogOut, Loader2, Users, Filter, CheckCircle2, UserCheck, Shield, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchField } from '@/components/ui/search-field'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useSyncManager } from '@/components/SyncProvider'

export default function DirectoryPage() {
  const reduceMotion = useReducedMotion()
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sessionFilter, setSessionFilter] = useState('all')
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const { syncManager } = useSyncManager()

  const fetchChildren = async () => {
    if (!syncManager) { setLoading(false); return }
    try {
      const [rows, localSessions, qrCodes] = await Promise.all([
        syncManager.getLocalData('children'), syncManager.getLocalData('sessions'), syncManager.getLocalData('qrCodes'),
      ])
      const labels = new Map(localSessions.map(session => [session.id, session.name]))
      const serials = new Map(qrCodes.map(qr => [qr.id, 'MSS-2027-' + String(qr.serial_number).padStart(3, '0')]))
      setSessions(localSessions)
      setChildren(rows.map(row => ({ ...row, serial_number: row.serial_number || serials.get(row.qr_id) || String(row.qr_id || '').slice(0, 8), session_name: labels.get(row.session_id) || 'Unknown session' })))
    } catch (error: any) { toast.error(error.message || 'Could not read the local directory.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!syncManager) return
    let active = true
    const unsubscribe = syncManager.subscribeState(() => { if (active) void fetchChildren() })
    return () => { active = false; unsubscribe() }
  }, [syncManager])

  const filteredChildren = children.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      (c.contact_number && c.contact_number.includes(search))
    const matchesStatus = statusFilter === 'all' || (c.status || 'Registered') === statusFilter
    const matchesSession = sessionFilter === 'all' || c.session_id === sessionFilter
    return matchesSearch && matchesStatus && matchesSession
  })

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredChildren.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredChildren.map((c) => c.id)))
    }
  }

  const handleBulkCheckOut = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      if (!syncManager) throw new Error('Offline storage is not ready.')
      const now = await syncManager.eventTime()
      for (const id of selectedIds) await syncManager.mutate('children', 'UPDATE', { id, status: 'Checked Out', checked_out_at: now })
      toast.success(`Saved ${selectedIds.size} checkouts on this device`)
      setSelectedIds(new Set())
      await fetchChildren()
    } catch (error: any) { toast.error(error.message || 'Some checkouts could not be saved. Review the queue.') }
    finally { setBulkLoading(false) }
  }

  const handleToggleStatus = async (childId: string, currentStatus: string) => {
    try {
      if (!syncManager) throw new Error('Offline storage is not ready.')
      const now = await syncManager.eventTime()
      const status = currentStatus === 'Checked In' ? 'Checked Out' : 'Checked In'
      await syncManager.mutate('children', 'UPDATE', { id: childId, status, ...(status === 'Checked In' ? { checked_in_at: now } : { checked_out_at: now }) })
      toast.success('Attendance saved on this device')
      await fetchChildren()
    } catch (error: any) { toast.error(error.message || 'Attendance could not be saved.') }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'Checked In') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Checked In
        </span>
      )
    }
    if (status === 'Checked Out') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Checked Out
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Registered
      </span>
    )
  }

  return (
    <div className="space-y-6 relative pb-20">
      {/* Header Info Banner */}
      <GlassCard className="p-6 md:p-8" glowColor="cyan">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Children & Attendance</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Children’s directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Search, filter, and manage attendee check-ins across event slots.
            </p>
          </div>

          {/* Filter Bar Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
              <SearchField id="directory-search" label="Search attendee directory" className="flex-1 sm:w-72"
                type="text"
                placeholder="Search name or serial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

            {/* Status Dropdown Filter */}
            <select
              aria-label="Filter attendees by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Registered">Registered</option>
              <option value="Checked In">Checked In</option>
              <option value="Checked Out">Checked Out</option>
            </select>

            {/* Session Dropdown Filter */}
            <select
              aria-label="Filter attendees by session"
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Sessions</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            
            {/* Refresh Button */}
            <button
              onClick={fetchChildren}
              disabled={loading}
              className="p-2 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Main Table */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  aria-label="Select all attendees"
                  checked={selectedIds.size > 0 && selectedIds.size === filteredChildren.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Serial No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredChildren.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                  No children matched your search filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredChildren.map((child) => {
                const isSelected = selectedIds.has(child.id)
                return (
                  <TableRow
                    key={child.id}
                    className={isSelected ? 'bg-blue-500/10 dark:bg-blue-500/20' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        aria-label={`Select ${child.name}`}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelect(child.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      {child.serial_number}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                      {child.name}
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {child.contact_number || 'N/A'}
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {child.session_name}
                    </TableCell>
                    <TableCell>{getStatusBadge(child.status || 'Registered')}</TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleToggleStatus(child.id, child.status || 'Registered')}
                        className="px-3 py-1.5 rounded-xl glass-pill text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:border-blue-500/40 transition-colors"
                      >
                        {(child.status || 'Registered') === 'Checked In' ? 'Check Out' : 'Check In'}
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      )}

      {/* Floating Multi-Select Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, transform: reduceMotion ? 'none' : 'translateY(12px)' }}
            animate={{ opacity: 1, transform: reduceMotion ? 'none' : 'translateY(0)' }}
            exit={{ opacity: 0, transform: reduceMotion ? 'none' : 'translateY(12px)' }}
            transition={{ duration: reduceMotion ? 0.12 : 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="directory-selection-bar sticky bottom-4 mx-auto w-full max-w-xl z-40"
          >
            <div className="glass-panel p-3.5 flex flex-wrap gap-3 items-center justify-between border border-input">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {selectedIds.size}
                </span>
                <span className="text-xs font-medium text-slate-900 dark:text-white">
                  attendees selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Deselect
                </button>

                <button
                  onClick={handleBulkCheckOut}
                  disabled={bulkLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-500/25 flex items-center gap-2"
                >
                  {bulkLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5" />
                  )}
                  Bulk Check Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
