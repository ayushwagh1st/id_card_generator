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
import { Search, LogOut, Loader2, Users, Filter, CheckCircle2, UserCheck, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, AnimatePresence } from 'framer-motion'

export default function DirectoryPage() {
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sessionFilter, setSessionFilter] = useState('all')
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const [childrenRes, sessionsRes] = await Promise.all([
      getChildrenDirectoryAction(),
      getSessionsAction(1, 100),
    ])

    if (childrenRes.error) toast.error(childrenRes.error)
    else setChildren(childrenRes.data || [])

    if (sessionsRes.data) {
      setSessions(sessionsRes.data)
    }
    setLoading(false)
  }

  const fetchChildren = async () => {
    setLoading(true)
    const res = await getChildrenDirectoryAction()
    if (res.error) {
      toast.error(res.error)
    } else {
      setChildren(res.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

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
    const res = await bulkCheckOutAction(Array.from(selectedIds))
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`Successfully checked out ${selectedIds.size} children`)
      setSelectedIds(new Set())
      await fetchChildren()
    }
    setBulkLoading(false)
  }

  const handleToggleStatus = async (childId: string, currentStatus: string) => {
    const res = await toggleAttendanceStatusAction(childId, currentStatus)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Attendance status updated')
      fetchChildren()
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'Checked In') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
              Directory & Real-Time Roster
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Search, filter, and manage attendee check-ins across event slots.
            </p>
          </div>

          {/* Filter Bar Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name or serial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Status Dropdown Filter */}
            <select
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
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === filteredChildren.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
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
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(child.id)}
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 inset-x-0 mx-auto w-full max-w-lg z-50 px-4"
          >
            <div className="glass-panel glass-edge-light p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-blue-500/30">
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
