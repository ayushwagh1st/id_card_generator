'use client'

import React, { useEffect, useState, useCallback, useReducer } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Edit, Trash2, FileText, Download, Database, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { exportToPDF } from '@/lib/pdf'
import { GlassCard } from '@/components/ui/GlassCard'
import Image from 'next/image'
import { getSessionsAction, addSessionAction, updateSessionAction, deleteSessionAction } from '@/server/actions/sessions'
export default function SessionsPage() {
  const [state, dispatch] = React.useReducer(
    (state: any, action: any) => typeof action === 'function' ? { ...state, ...action(state) } : { ...state, ...action },
    {
      sessions: [],
      searchTerm: '',
      loading: true,
      isAddOpen: false,
      isEditOpen: false,
      currentSession: null,
      name: '',
      category: '',
      description: '',
      lecturerName: '',
      venue: '',
      date: '',
      startTime: '',
      endTime: '',
      capacity: '',
      status: 'Scheduled'
    }
  )

  const {
    sessions, searchTerm, loading, isAddOpen, isEditOpen,
    currentSession, name, category, description, lecturerName,
    venue, date, startTime, endTime, capacity, status
  } = state

  const setSessions = useCallback((v: any) => dispatch((s: any) => ({ sessions: typeof v === 'function' ? v(s.sessions) : v })), [])
  const setSearchTerm = useCallback((v: any) => dispatch((s: any) => ({ searchTerm: typeof v === 'function' ? v(s.searchTerm) : v })), [])
  const setLoading = useCallback((v: any) => dispatch((s: any) => ({ loading: typeof v === 'function' ? v(s.loading) : v })), [])
  const setIsAddOpen = useCallback((v: any) => dispatch((s: any) => ({ isAddOpen: typeof v === 'function' ? v(s.isAddOpen) : v })), [])
  const setIsEditOpen = useCallback((v: any) => dispatch((s: any) => ({ isEditOpen: typeof v === 'function' ? v(s.isEditOpen) : v })), [])
  const setCurrentSession = useCallback((v: any) => dispatch((s: any) => ({ currentSession: typeof v === 'function' ? v(s.currentSession) : v })), [])
  const setName = useCallback((v: any) => dispatch((s: any) => ({ name: typeof v === 'function' ? v(s.name) : v })), [])
  const setCategory = useCallback((v: any) => dispatch((s: any) => ({ category: typeof v === 'function' ? v(s.category) : v })), [])
  const setDescription = useCallback((v: any) => dispatch((s: any) => ({ description: typeof v === 'function' ? v(s.description) : v })), [])
  const setLecturerName = useCallback((v: any) => dispatch((s: any) => ({ lecturerName: typeof v === 'function' ? v(s.lecturerName) : v })), [])
  const setVenue = useCallback((v: any) => dispatch((s: any) => ({ venue: typeof v === 'function' ? v(s.venue) : v })), [])
  const setDate = useCallback((v: any) => dispatch((s: any) => ({ date: typeof v === 'function' ? v(s.date) : v })), [])
  const setStartTime = useCallback((v: any) => dispatch((s: any) => ({ startTime: typeof v === 'function' ? v(s.startTime) : v })), [])
  const setEndTime = useCallback((v: any) => dispatch((s: any) => ({ endTime: typeof v === 'function' ? v(s.endTime) : v })), [])
  const setCapacity = useCallback((v: any) => dispatch((s: any) => ({ capacity: typeof v === 'function' ? v(s.capacity) : v })), [])
  const setStatus = useCallback((v: any) => dispatch((s: any) => ({ status: typeof v === 'function' ? v(s.status) : v })), [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const sessionsRes = await getSessionsAction(1, 100, searchTerm, 'all', 'all')
      setSessions(sessionsRes.data || [])
    } catch (err: any) {
      toast.error('Error loading data')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, setLoading, setSessions])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [fetchData])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
          name, category, description, venue, date, start_time: startTime, end_time: endTime, status,
          lecturer_name: lecturerName,
          capacity: capacity ? parseInt(capacity) : null
      }
      const res = await addSessionAction(payload)
      if (res?.error) throw new Error(res.error)
      toast.success('Session added successfully')
      setIsAddOpen(false)
      resetForm()
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Could not add session')
    }
  }

  const openEdit = (sess: any) => {
    setCurrentSession(sess)
    setName(sess.name)
    setCategory(sess.category || '')
    setDescription(sess.description || '')
    setLecturerName(sess.lecturer_name || '')
    setVenue(sess.venue || '')
    setDate(sess.date)
    setStartTime(sess.start_time)
    setEndTime(sess.end_time)
    setCapacity(sess.capacity ? sess.capacity.toString() : '')
    setStatus(sess.status || 'Scheduled')
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentSession) return
    try {
        const payload = {
            name, category, description, venue, date, start_time: startTime, end_time: endTime, status,
            lecturer_name: lecturerName,
            capacity: capacity ? parseInt(capacity) : null
        }
      const res = await updateSessionAction(currentSession.id, payload)
      if (res?.error) throw new Error(res.error)
      toast.success('Session updated successfully')
      setIsEditOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Could not update session')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return
    try {
      const res = await deleteSessionAction(id)
      if (res?.error) throw new Error(res.error)
      toast.success('Session deleted')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Could not delete session')
    }
  }

  const resetForm = () => {
      setName(''); setCategory(''); setDescription(''); setLecturerName('');
      setVenue(''); setDate(''); setStartTime(''); setEndTime(''); setCapacity(''); setStatus('Scheduled');
  }

  const handleExportCSV = () => {
    if (sessions.length === 0) return
    const headers = ['Session Name', 'Category', 'Lecturer Name', 'Venue', 'Date', 'Time', 'Status']
    const rows = sessions.map((s: any) => [
        s.name,
        s.category || '',
        s.lecturer_name || 'Unassigned',
        s.venue || '',
        s.date || '',
        `${s.start_time} - ${s.end_time}`,
        s.status || ''
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map((e: any) => `"${e.join('","')}"`)].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Sessions_List.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    if (sessions.length === 0) return
    const headers = ['Session Name', 'Category', 'Lecturer Name', 'Venue', 'Date', 'Time', 'Status']
    const rows = sessions.map((s: any) => [
        s.name,
        s.category || '',
        s.lecturer_name || 'Unassigned',
        s.venue || '',
        s.date || '',
        `${s.start_time} - ${s.end_time}`,
        s.status || ''
    ])
    exportToPDF({
      title: 'Sessions Directory',
      subtitle: 'Complete list of all scheduled sessions',
      filename: 'Sessions_Directory.pdf',
      headers,
      data: rows,
      themeColor: [16, 185, 129] // Emerald
    })
  }

  const activeSessions = sessions.filter((s: any) => s.status === 'Ongoing' || s.status === 'Scheduled').length
  const completedSessions = sessions.filter((s: any) => s.status === 'Completed').length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <GlassCard className="p-8 md:p-10 relative overflow-hidden" glowColor="indigo">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide uppercase border border-emerald-500/20">
            <Database className="w-4 h-4" /> 
            <span>Sessions</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Session Management
          </h1>
          <p className="font-sans text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
            Create and manage training sessions or workshops.
          </p>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-6" glowColor="blue">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Total Sessions</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{sessions.length}</div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" glowColor="cyan">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Active / Scheduled</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{activeSessions}</div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" glowColor="purple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Completed Sessions</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{completedSessions}</div>
          </div>
        </GlassCard>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sessions..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
            <FileText className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4" /> Export PDF
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger>
              <Button onClick={resetForm} className="w-full sm:w-auto text-white px-5 gap-2">
                <Plus className="h-4 w-4" /> Create Session
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-2xl rounded-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Session Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Yoga, Training" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lecturer Name</Label>
                  <Input value={lecturerName} onChange={e => setLecturerName(e.target.value)} placeholder="Name of lecturer" />
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input value={venue} onChange={e => setVenue(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-2">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Session Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={category} onChange={e => setCategory(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lecturer Name</Label>
                  <Input value={lecturerName} onChange={e => setLecturerName(e.target.value)} placeholder="Name of lecturer" />
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input value={venue} onChange={e => setVenue(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} />
              </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <GlassCard className="p-0 overflow-hidden" glowColor="blue">
        <div className="p-0">
          {loading ? (
            <div className="p-4 space-y-4">
              <div className="rounded-md border">
                <div className="border-b px-4 py-3 flex gap-4 bg-muted/40">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24 ml-auto" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="px-4 py-4 flex items-center gap-4 border-b last:border-0">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <div className="flex gap-1.5 ml-auto">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Lecturer Name</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((sess: any) => (
                <TableRow key={sess.id}>
                  <TableCell>
                    <div className="font-semibold">{sess.name}</div>
                    <div className="text-xs text-muted-foreground">{sess.category}</div>
                  </TableCell>
                  <TableCell>{sess.lecturer_name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <div className="text-sm">{sess.date}</div>
                    <div className="text-xs text-muted-foreground">{sess.start_time} - {sess.end_time}</div>
                  </TableCell>
                  <TableCell>{sess.venue}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      sess.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      sess.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                      sess.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {sess.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(sess)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(sess.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && sessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                        <Database className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground font-semibold">No sessions found</p>
                      <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto">
                        Create a new session to start tracking attendance.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
