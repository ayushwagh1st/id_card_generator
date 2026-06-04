'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Edit, Trash2, KeyRound, Download, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { getLecturersAction, addLecturerAction, updateLecturerAction, deleteLecturerAction, resetLecturerPasswordAction } from '@/app/actions/lecturers'

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isResetPassOpen, setIsResetPassOpen] = useState(false)
  const [currentLecturer, setCurrentLecturer] = useState<any>(null)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('Active')

  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const fetchLecturers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getLecturersAction(1, 100, searchTerm, 'all')
      setLecturers(data || [])
    } catch (err: any) {
      toast.error('Error loading lecturers')
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLecturers()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [fetchLecturers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await addLecturerAction({ name, email, mobile, password, status })
      if (res?.error) throw new Error(res.error)
      toast.success('Lecturer added successfully')
      setIsAddOpen(false)
      setName(''); setEmail(''); setMobile(''); setPassword(''); setStatus('Active');
      fetchLecturers()
    } catch (err: any) {
      toast.error(err.message || 'Could not add lecturer')
    }
  }

  const openEdit = (lect: any) => {
    setCurrentLecturer(lect)
    setName(lect.name)
    setEmail(lect.email)
    setMobile(lect.mobile || '')
    setStatus(lect.status || 'Active')
    setIsEditOpen(true)
  }

  const openResetPass = (lect: any) => {
    setCurrentLecturer(lect)
    setPassword('')
    setIsResetPassOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentLecturer) return
    try {
      // For general update, we don't change password here anymore to avoid overwriting with blank
      const res = await updateLecturerAction(currentLecturer.id, { name, email, mobile, password: currentLecturer.password, status })
      if (res?.error) throw new Error(res.error)
      toast.success('Lecturer updated successfully')
      setIsEditOpen(false)
      fetchLecturers()
    } catch (err: any) {
      toast.error(err.message || 'Could not update lecturer')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentLecturer) return
    try {
      const res = await resetLecturerPasswordAction(currentLecturer.id, password)
      if (res?.error) throw new Error(res.error)
      toast.success('Password reset successfully')
      setIsResetPassOpen(false)
      fetchLecturers()
    } catch (err: any) {
      toast.error(err.message || 'Could not reset password')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lecturer?')) return
    try {
      const res = await deleteLecturerAction(id)
      if (res?.error) throw new Error(res.error)
      toast.success('Lecturer deleted')
      fetchLecturers()
    } catch (err: any) {
      toast.error(err.message || 'Could not delete lecturer')
    }
  }

  const handleExportCredentials = () => {
    try {
      const headers = ['Name', 'Email (Login ID)', 'Password', 'Mobile', 'Status']
      const rows = lecturers.map(l => [
        `"${l.name.replace(/"/g, '""')}"`,
        `"${l.email.replace(/"/g, '""')}"`,
        `"${(l.password || 'N/A').replace(/"/g, '""')}"`,
        `"${(l.mobile || '').replace(/"/g, '""')}"`,
        `"${l.status}"`
      ])

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `lecturers_credentials_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Lecturers credentials exported successfully!')
    } catch (err: any) {
      toast.error('Failed to export credentials')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Lecturer Management</h1>
          <p className="text-blue-100 mt-2 text-sm max-w-xl">
            Manage lecturers who will conduct sessions and mark attendance.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search name, email..."
            className="pl-9 bg-card border-primary/10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportCredentials} 
            disabled={lecturers.length === 0} 
            className="w-full sm:w-auto gap-2 border-primary/20 hover:bg-primary/5 rounded-xl font-semibold px-4"
          >
            <Download className="h-4 w-4" />
            Export Credentials
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
              <Button className="w-full sm:w-auto bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 text-white font-semibold rounded-xl px-5 gap-2">
                <Plus className="h-4 w-4" /> Add Lecturer
              </Button>
            } />
          <DialogContent className="sm:max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle>Add Lecturer</DialogTitle>
              <DialogDescription>Create a new lecturer profile.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input value={mobile} onChange={e => setMobile(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="text" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit Lecturer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Mobile</Label>
              <Input value={mobile} onChange={e => setMobile(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetPassOpen} onOpenChange={setIsResetPassOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Assign a new temporary password to {currentLecturer?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">New Password</Label>
              <Input type="text" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsResetPassOpen(false)}>Cancel</Button>
              <Button type="submit">Reset Password</Button>
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lecturers.map(lect => (
                <TableRow key={lect.id}>
                  <TableCell className="font-medium">{lect.name}</TableCell>
                  <TableCell>{lect.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-amber-600 bg-amber-500/5 px-2 py-1.5 rounded w-fit">
                        {visiblePasswords[lect.id] ? (lect.password || 'N/A') : '••••••'}
                      </span>
                      <button onClick={() => togglePassword(lect.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {visiblePasswords[lect.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>{lect.mobile}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${lect.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                      {lect.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(lect)} title="Edit Lecturer">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openResetPass(lect)} title="Reset Password" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                      <KeyRound className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(lect.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && lecturers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No lecturers found.</TableCell>
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
