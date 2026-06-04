'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Shield, Users, Database, Download, Edit, Trash2, KeyRound, Eye, EyeOff } from 'lucide-react'
import { AnimatedLoader } from '@/components/ui/animated-loader'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { createModelHeadAction, updateModelHeadAction, resetModelHeadPasswordAction, deleteModelHeadAction } from '../models/actions'

export default function HeadsPage() {
  const [heads, setHeads] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  // Form states
  const [isAddHeadOpen, setIsAddHeadOpen] = useState(false)
  const [headName, setHeadName] = useState('')
  const [headEmail, setHeadEmail] = useState('')
  const [headPassword, setHeadPassword] = useState('')
  const [isCreatingHead, setIsCreatingHead] = useState(false)

  const [currentHead, setCurrentHead] = useState<any>(null)
  const [isEditHeadOpen, setIsEditHeadOpen] = useState(false)
  const [isResetPassOpen, setIsResetPassOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch profiles with role MODEL_HEAD
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, temp_password, created_at')
        .eq('role', 'MODEL_HEAD')
        .order('full_name')

      if (profilesErr) throw profilesErr

      // 2. Fetch models to map assignments
      const { data: modelsData, error: modelsErr } = await supabase
        .from('models')
        .select('id, name, head_id')

      if (modelsErr) throw modelsErr

      setHeads(profiles || [])
      setModels(modelsData || [])
    } catch (err: any) {
      toast.error(err.message || 'Error loading model heads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Create Model Head
  const handleCreateHead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!headName.trim() || !headEmail.trim() || !headPassword.trim()) {
      return toast.error('All fields are required')
    }

    setIsCreatingHead(true)
    try {
      const formData = new FormData()
      formData.append('fullName', headName)
      formData.append('email', headEmail)
      formData.append('password', headPassword)

      const result = await createModelHeadAction(formData)
      if (result?.error) {
        throw new Error(result.error)
      }

      toast.success('Model Head account created successfully!')
      setIsAddHeadOpen(false)
      setHeadName('')
      setHeadEmail('')
      setHeadPassword('')

      fetchData() // Refresh list
    } catch (err: any) {
      toast.error(err.message || 'Failed to create Model Head account')
    } finally {
      setIsCreatingHead(false)
    }
  }

  // Handlers for Update, Reset, Delete
  const openEdit = (head: any) => {
    setCurrentHead(head)
    setHeadName(head.full_name)
    setHeadEmail(head.email)
    setIsEditHeadOpen(true)
  }

  const openResetPass = (head: any) => {
    setCurrentHead(head)
    setHeadPassword('')
    setIsResetPassOpen(true)
  }

  const openDelete = (head: any) => {
    setCurrentHead(head)
    setIsDeleteOpen(true)
  }

  const handleUpdateHead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHead) return
    setIsUpdating(true)
    try {
      const formData = new FormData()
      formData.append('fullName', headName)
      formData.append('email', headEmail)
      const res = await updateModelHeadAction(currentHead.id, formData)
      if (res?.error) throw new Error(res.error)
      toast.success('Updated successfully')
      setIsEditHeadOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentHead) return
    setIsUpdating(true)
    try {
      const res = await resetModelHeadPasswordAction(currentHead.id, headPassword)
      if (res?.error) throw new Error(res.error)
      toast.success('Password reset successfully')
      setIsResetPassOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteHead = async () => {
    if (!currentHead) return
    setIsUpdating(true)
    try {
      const res = await deleteModelHeadAction(currentHead.id)
      if (res?.error) throw new Error(res.error)
      toast.success('Deleted successfully')
      setIsDeleteOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  // Helper to get supervised models for a head
  const getSupervisedModelsStr = (headId: string) => {
    const assigned = models.filter(m => m.head_id === headId).map(m => m.name)
    return assigned.length > 0 ? assigned.join(', ') : 'None Assigned'
  }

  const handleExportHeads = () => {
    try {
      const headers = ['Full Name', 'Login Email ID', 'Temporary Password', 'Supervised Models', 'Status']
      const rows = heads.map(h => [
        `"${h.full_name.replace(/"/g, '""')}"`,
        `"${h.email.replace(/"/g, '""')}"`,
        `"${(h.temp_password || 'N/A').replace(/"/g, '""')}"`,
        `"${getSupervisedModelsStr(h.id).replace(/"/g, '""')}"`,
        models.some(m => m.head_id === h.id) ? 'Assigned' : 'Unassigned'
      ])

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `model_heads_credentials_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Model Heads credentials exported successfully!')
    } catch (err: any) {
      toast.error('Failed to export credentials')
    }
  }

  // Stats calculation
  const totalHeadsCount = heads.length
  const assignedHeadsCount = heads.filter(h => models.some(m => m.head_id === h.id)).length
  const unassignedHeadsCount = totalHeadsCount - assignedHeadsCount

  // Filter heads based on search term
  const filteredHeads = heads.filter(h => {
    const supervised = getSupervisedModelsStr(h.id).toLowerCase()
    return (
      h.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supervised.includes(searchTerm.toLowerCase())
    )
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Dynamic Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Model Heads Directory</h1>
          <p className="text-teal-100 mt-2 text-sm max-w-xl">
            Register and manage accounts for exhibition supervisors. Assign them to specific models to grant access.
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-primary/5 group-hover:scale-110 transition-transform duration-300">
            <Users className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Model Heads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{totalHeadsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Supervisor accounts registered</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-emerald-500/5 group-hover:scale-110 transition-transform duration-300">
            <Shield className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">{assignedHeadsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Heads currently managing divisions</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-amber-500/5 group-hover:scale-110 transition-transform duration-300">
            <Database className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Unassigned Heads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{unassignedHeadsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Waiting for division assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search name, email, model..."
            className="pl-9 bg-card shadow-sm border-primary/10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportHeads} 
            disabled={heads.length === 0} 
            className="w-full sm:w-auto gap-2 border-primary/20 hover:bg-primary/5 rounded-xl font-semibold px-4"
          >
            <Download className="h-4 w-4" />
            Export Credentials
          </Button>

          <Dialog open={isAddHeadOpen} onOpenChange={setIsAddHeadOpen}>
            <DialogTrigger render={<Button className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-550 hover:to-indigo-650 text-white shadow-md font-semibold rounded-xl px-5 gap-2" />}>
              <Plus className="h-4 w-4" />
              Create Model Head
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">Create Model Head</DialogTitle>
                <DialogDescription>
                  Generate credentials for a new exhibition supervisor.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateHead} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="head-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                  <Input id="head-name" placeholder="e.g. Ramesh Kumar" value={headName} onChange={e => setHeadName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="head-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email (Login ID)</Label>
                  <Input id="head-email" type="email" placeholder="ramesh@example.com" value={headEmail} onChange={e => setHeadEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="head-pass" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Temporary Password</Label>
                  <Input id="head-pass" type="password" placeholder="Min. 6 characters" value={headPassword} onChange={e => setHeadPassword(e.target.value)} required minLength={6} />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddHeadOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isCreatingHead}>
                    {isCreatingHead ? <><AnimatedLoader className="mr-2 h-4 w-4" /> Creating...</> : 'Create Account'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditHeadOpen} onOpenChange={setIsEditHeadOpen}>
            <DialogContent className="sm:max-w-md rounded-xl">
              <DialogHeader>
                <DialogTitle>Edit Model Head</DialogTitle>
                <DialogDescription>Update the name or login email for this user.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateHead} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Full Name</Label>
                  <Input value={headName} onChange={e => setHeadName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Email (Login ID)</Label>
                  <Input type="email" value={headEmail} onChange={e => setHeadEmail(e.target.value)} required />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditHeadOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? <AnimatedLoader className="h-4 w-4" /> : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Reset Password Dialog */}
          <Dialog open={isResetPassOpen} onOpenChange={setIsResetPassOpen}>
            <DialogContent className="sm:max-w-md rounded-xl">
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>Assign a new temporary password to {currentHead?.full_name}.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleResetPassword} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">New Password</Label>
                  <Input type="text" value={headPassword} onChange={e => setHeadPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters" />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsResetPassOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? <AnimatedLoader className="h-4 w-4" /> : 'Reset Password'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent className="sm:max-w-md rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-rose-600">Delete Account</DialogTitle>
                <DialogDescription>
                  Are you sure you want to permanently delete <strong>{currentHead?.full_name}</strong>? 
                  This will remove their login access. Reassign their models first if necessary.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteHead} disabled={isUpdating}>
                  {isUpdating ? <AnimatedLoader className="h-4 w-4" /> : 'Yes, Delete Account'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      {/* Directory Table */}
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
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 px-6">Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Login Email ID</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Temporary Password</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Supervised Models</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Assignment Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHeads.map((head) => {
                  const supervisedModels = getSupervisedModelsStr(head.id)
                  const isAssigned = supervisedModels !== 'None Assigned'
                  return (
                    <TableRow key={head.id} className="hover:bg-muted/20 transition-colors duration-200">
                      <TableCell className="font-semibold text-sm text-foreground py-4 px-6">{head.full_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{head.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-amber-600 bg-amber-500/5 px-2 py-1.5 rounded w-fit">
                            {visiblePasswords[head.id] ? (head.temp_password || 'N/A') : '••••••'}
                          </span>
                          <button onClick={() => togglePassword(head.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                            {visiblePasswords[head.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className={`font-semibold ${isAssigned ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'}`}>
                          {supervisedModels}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${
                          isAssigned 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' 
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
                        }`}>
                          {isAssigned ? 'Assigned' : 'Unassigned'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-4 space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(head)} title="Edit Profile" className="h-8 w-8 hover:bg-primary/10 rounded-lg">
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openResetPass(head)} title="Reset Password" className="h-8 w-8 hover:bg-amber-500/10 rounded-lg">
                          <KeyRound className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDelete(head)} title="Delete Account" className="h-8 w-8 hover:bg-rose-500/10 rounded-lg">
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredHeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm font-semibold">
                      No Model Heads found. Create one above!
                    </TableCell>
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
