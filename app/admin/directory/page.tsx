'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getChildrenDirectoryAction,
  bulkCheckInAction,
  bulkCheckOutAction,
  recordChildCheckInAction,
  recordChildCheckOutAction,
  updateChildAttendanceTimesAction,
  toggleAttendanceStatusAction,
} from '@/server/actions/children'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GlassCard } from '@/components/ui/GlassCard'
import {
  Search,
  LogOut,
  Loader2,
  Users,
  Filter,
  CheckCircle2,
  RefreshCw,
  Clock,
  CalendarClock,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchField } from '@/components/ui/search-field'
import { useSyncManager } from '@/components/SyncProvider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

function formatTimeDisplay(dateString?: string | null) {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

function formatDateDisplay(dateString?: string | null) {
  if (!dateString) return null
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return null
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch {
    return null
  }
}

function toDatetimeLocal(isoString?: string | null) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    const year = d.getFullYear()
    const month = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hours = pad(d.getHours())
    const minutes = pad(d.getMinutes())
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ''
  }
}

export default function DirectoryPage() {
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sessionFilter, setSessionFilter] = useState('all')
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null)

  // Time editing modal state
  const [timeModalChild, setTimeModalChild] = useState<any | null>(null)
  const [modalCheckIn, setModalCheckIn] = useState('')
  const [modalCheckOut, setModalCheckOut] = useState('')
  const [savingTimes, setSavingTimes] = useState(false)

  const { syncManager } = useSyncManager()

  const fetchChildren = useCallback(async () => {
    try {
      if (syncManager) {
        const [rows, localSessions, qrCodes] = await Promise.all([
          syncManager.getLocalData('children'),
          syncManager.getLocalData('sessions'),
          syncManager.getLocalData('qrCodes'),
        ])
        const labels = new Map(localSessions.map((session) => [session.id, session.name]))
        const serials = new Map(
          qrCodes.map((qr) => [qr.id, 'MSS-2027-' + String(qr.serial_number).padStart(3, '0')])
        )
        setSessions(localSessions)

        if (rows && rows.length > 0) {
          setChildren(
            rows.map((row) => ({
              ...row,
              serial_number:
                row.serial_number || serials.get(row.qr_id) || String(row.qr_id || '').slice(0, 8),
              session_name: labels.get(row.session_id) || 'Unknown session',
            }))
          )
          return
        }
      }

      // Online fallback to server action when offline cache is empty or syncManager not initialized
      const res = await getChildrenDirectoryAction()
      if (res.data) {
        setChildren(res.data)
      } else if (res.error) {
        toast.error(res.error)
      }
    } catch (error: any) {
      toast.error(error.message || 'Could not read the children directory.')
    } finally {
      setLoading(false)
    }
  }, [syncManager])

  useEffect(() => {
    void fetchChildren()
    if (!syncManager) return
    let active = true
    const unsubscribe = syncManager.subscribeState(() => {
      if (active) void fetchChildren()
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [syncManager, fetchChildren])

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

  const handleCheckIn = async (childId: string) => {
    setActionInProgressId(childId)
    try {
      const now = syncManager ? await syncManager.eventTime() : new Date().toISOString()
      if (syncManager) {
        await syncManager.mutate('children', 'UPDATE', {
          id: childId,
          status: 'Checked In',
          checked_in_at: now,
        })
      } else {
        const res = await recordChildCheckInAction(childId, now)
        if (res.error) throw new Error(res.error)
      }
      toast.success('Check-in time recorded')
      await fetchChildren()
    } catch (error: any) {
      toast.error(error.message || 'Check-in could not be recorded.')
    } finally {
      setActionInProgressId(null)
    }
  }

  const handleCheckOut = async (childId: string) => {
    setActionInProgressId(childId)
    try {
      const now = syncManager ? await syncManager.eventTime() : new Date().toISOString()
      if (syncManager) {
        await syncManager.mutate('children', 'UPDATE', {
          id: childId,
          status: 'Checked Out',
          checked_out_at: now,
        })
      } else {
        const res = await recordChildCheckOutAction(childId, now)
        if (res.error) throw new Error(res.error)
      }
      toast.success('Check-out time recorded')
      await fetchChildren()
    } catch (error: any) {
      toast.error(error.message || 'Check-out could not be recorded.')
    } finally {
      setActionInProgressId(null)
    }
  }

  const handleBulkCheckIn = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      const now = syncManager ? await syncManager.eventTime() : new Date().toISOString()
      if (syncManager) {
        for (const id of selectedIds) {
          await syncManager.mutate('children', 'UPDATE', {
            id,
            status: 'Checked In',
            checked_in_at: now,
          })
        }
      } else {
        const res = await bulkCheckInAction(Array.from(selectedIds), now)
        if (res.error) throw new Error(res.error)
      }
      toast.success(`Recorded check-in for ${selectedIds.size} attendees`)
      setSelectedIds(new Set())
      await fetchChildren()
    } catch (error: any) {
      toast.error(error.message || 'Bulk check-in could not be completed.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkCheckOut = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      const now = syncManager ? await syncManager.eventTime() : new Date().toISOString()
      if (syncManager) {
        for (const id of selectedIds) {
          await syncManager.mutate('children', 'UPDATE', {
            id,
            status: 'Checked Out',
            checked_out_at: now,
          })
        }
      } else {
        const res = await bulkCheckOutAction(Array.from(selectedIds), now)
        if (res.error) throw new Error(res.error)
      }
      toast.success(`Recorded check-out for ${selectedIds.size} attendees`)
      setSelectedIds(new Set())
      await fetchChildren()
    } catch (error: any) {
      toast.error(error.message || 'Some checkouts could not be saved.')
    } finally {
      setBulkLoading(false)
    }
  }

  const openTimeModal = (child: any) => {
    setTimeModalChild(child)
    setModalCheckIn(toDatetimeLocal(child.checked_in_at))
    setModalCheckOut(toDatetimeLocal(child.checked_out_at))
  }

  const handleSaveCustomTimes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!timeModalChild) return
    setSavingTimes(true)

    try {
      const checkInIso = modalCheckIn ? new Date(modalCheckIn).toISOString() : null
      const checkOutIso = modalCheckOut ? new Date(modalCheckOut).toISOString() : null

      let newStatus = 'Registered'
      if (
        checkOutIso &&
        (!checkInIso || new Date(checkOutIso).getTime() >= new Date(checkInIso).getTime())
      ) {
        newStatus = 'Checked Out'
      } else if (checkInIso) {
        newStatus = 'Checked In'
      }

      if (syncManager) {
        await syncManager.mutate('children', 'UPDATE', {
          id: timeModalChild.id,
          status: newStatus,
          checked_in_at: checkInIso || undefined,
          checked_out_at: checkOutIso || undefined,
        })
      } else {
        const res = await updateChildAttendanceTimesAction(timeModalChild.id, {
          checked_in_at: checkInIso,
          checked_out_at: checkOutIso,
          status: newStatus,
        })
        if (res.error) throw new Error(res.error)
      }

      toast.success('Attendance times recorded')
      setTimeModalChild(null)
      await fetchChildren()
    } catch (error: any) {
      toast.error(error.message || 'Failed to record attendance times.')
    } finally {
      setSavingTimes(false)
    }
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

  const totalRegistered = children.length
  const checkedInCount = children.filter((c) => c.status === 'Checked In').length
  const checkedOutCount = children.filter((c) => c.status === 'Checked Out').length
  const notCheckedInCount = children.filter((c) => (c.status || 'Registered') === 'Registered').length

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
              Search, filter, and record attendee check-in and check-out times across event slots.
            </p>
          </div>

          {/* Filter Bar Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <SearchField
              id="directory-search"
              label="Search attendee directory"
              className="flex-1 sm:w-72"
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
              onClick={() => void fetchChildren()}
              disabled={loading}
              className="p-2 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Attendance Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/60">
          <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Total Registered
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {totalRegistered}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
              Checked In
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {checkedInCount}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-500/5 border border-slate-500/20">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
              Checked Out
            </span>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {checkedOutCount}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 block">
              Not Checked In
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {notCheckedInCount}
            </span>
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
              <TableHead>Check-In Time</TableHead>
              <TableHead>Check-Out Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredChildren.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                  No children matched your search filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredChildren.map((child) => {
                const isSelected = selectedIds.has(child.id)
                const isActionBusy = actionInProgressId === child.id

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
                    <TableCell>
                      {child.checked_in_at ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            {formatTimeDisplay(child.checked_in_at)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {formatDateDisplay(child.checked_in_at)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {child.checked_out_at ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <LogOut className="w-3 h-3 text-slate-400" />
                            {formatTimeDisplay(child.checked_out_at)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {formatDateDisplay(child.checked_out_at)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {child.status === 'Checked In' ? (
                          <button
                            onClick={() => handleCheckOut(child.id)}
                            disabled={isActionBusy}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                            title="Record Check Out"
                          >
                            {isActionBusy ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <LogOut className="w-3 h-3" />
                            )}
                            Check Out
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCheckIn(child.id)}
                            disabled={isActionBusy}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                            title="Record Check In"
                          >
                            {isActionBusy ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {child.status === 'Checked Out' ? 'Re-check In' : 'Check In'}
                          </button>
                        )}

                        <button
                          onClick={() => openTimeModal(child)}
                          className="p-1.5 rounded-xl glass-pill text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/40 transition-colors"
                          title="Record or Edit Attendance Times"
                          aria-label={`Record or edit attendance times for ${child.name}`}
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      )}

      {/* Floating Multi-Select Action Bar */}
      {selectedIds.size > 0 && (
        <div className="directory-selection-bar sticky bottom-4 mx-auto w-full max-w-xl z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                onClick={handleBulkCheckIn}
                disabled={bulkLoading}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/25 flex items-center gap-1.5"
              >
                {bulkLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                Bulk Check In
              </button>

              <button
                onClick={handleBulkCheckOut}
                disabled={bulkLoading}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-500/25 flex items-center gap-1.5"
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
        </div>
      )}

      {/* Modal: Record / Edit Attendance Times */}
      {timeModalChild && (
        <Dialog
          open={Boolean(timeModalChild)}
          onOpenChange={(open) => {
            if (!open) setTimeModalChild(null)
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-blue-500" />
                Record Attendance Time
              </DialogTitle>
              <DialogDescription>
                Record or adjust check-in and check-out timestamps for{' '}
                <strong className="text-foreground">{timeModalChild.name}</strong>{' '}
                <span className="font-mono text-xs text-blue-500">
                  ({timeModalChild.serial_number})
                </span>
                .
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveCustomTimes} className="space-y-4 py-2">
              {/* Check-In Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="checkInTime"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    Check-In Time
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setModalCheckIn(toDatetimeLocal(new Date().toISOString()))}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline px-1 py-0.5"
                    >
                      Set to Now
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={() => setModalCheckIn('')}
                      className="text-[11px] text-rose-500 hover:underline px-1 py-0.5"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <Input
                  id="checkInTime"
                  name="checkInTime"
                  type="datetime-local"
                  value={modalCheckIn}
                  onChange={(e) => setModalCheckIn(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              {/* Check-Out Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="checkOutTime"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    Check-Out Time
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setModalCheckOut(toDatetimeLocal(new Date().toISOString()))}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline px-1 py-0.5"
                    >
                      Set to Now
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={() => setModalCheckOut('')}
                      className="text-[11px] text-rose-500 hover:underline px-1 py-0.5"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <Input
                  id="checkOutTime"
                  name="checkOutTime"
                  type="datetime-local"
                  value={modalCheckOut}
                  onChange={(e) => setModalCheckOut(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setTimeModalChild(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTimes}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/25 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingTimes && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Timestamps
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
