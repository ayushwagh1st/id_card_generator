'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { getSessionsAction, addSessionAction, updateSessionAction, deleteSessionAction } from '@/app/actions/sessions'
import { getLecturersAction } from '@/app/actions/lecturers'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [lecturers, setLecturers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)
  
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [lecturerId, setLecturerId] = useState('none')
  const [venue, setVenue] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [capacity, setCapacity] = useState('')
  const [status, setStatus] = useState('Scheduled')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sessionsRes, lecturersRes] = await Promise.all([
        getSessionsAction(1, 100, searchTerm, 'all', 'all'),
        getLecturersAction(1, 100, '', 'Active')
      ])
      setSessions(sessionsRes.data || [])
      setLecturers(lecturersRes.data || [])
    } catch (err: any) {
      toast.error('Error loading data')
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

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
          lecturer_id: lecturerId === 'none' ? null : lecturerId,
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
    setLecturerId(sess.lecturer_id || 'none')
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
            lecturer_id: lecturerId === 'none' ? null : lecturerId,
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
      setName(''); setCategory(''); setDescription(''); setLecturerId('none');
      setVenue(''); setDate(''); setStartTime(''); setEndTime(''); setCapacity(''); setStatus('Scheduled');
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Session Management</h1>
          <p className="text-teal-100 mt-2 text-sm max-w-xl">
            Create and manage training sessions or workshops.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sessions..."
            className="pl-9 bg-card border-primary/10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button onClick={resetForm} className="w-full sm:w-auto bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 text-white font-semibold rounded-xl px-5 gap-2">
              <Plus className="h-4 w-4" /> Create Session
            </Button>
          } />
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
                  <Label>Lecturer / Trainer</Label>
                  <Select value={lecturerId} onValueChange={(val: any) => setLecturerId(val)}>
                    <SelectTrigger><SelectValue placeholder="Assign Lecturer" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {lecturers.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label>Lecturer / Trainer</Label>
                  <Select value={lecturerId} onValueChange={(val: any) => setLecturerId(val)}>
                    <SelectTrigger><SelectValue placeholder="Assign Lecturer" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {lecturers.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      <Card className="shadow-lg border-primary/10 overflow-hidden backdrop-blur-md bg-card">
        <CardContent className="p-0">
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
                <TableHead>Lecturer</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map(sess => (
                <TableRow key={sess.id}>
                  <TableCell>
                    <div className="font-semibold">{sess.name}</div>
                    <div className="text-xs text-muted-foreground">{sess.category}</div>
                  </TableCell>
                  <TableCell>{sess.lecturer?.name || 'Unassigned'}</TableCell>
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
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No sessions found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
