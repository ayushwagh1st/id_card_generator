'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Edit, Trash2, Database, Shield, Layers, HelpCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ModelsPage() {
  const [models, setModels] = useState<any[]>([])
  const [heads, setHeads] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [currentModel, setCurrentModel] = useState<any>(null)
  
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [headId, setHeadId] = useState('none')
  const [status, setStatus] = useState('Active')

  const supabase = createClient()

  // Fetch models and heads from Supabase
  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch profiles of Model Heads
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'MODEL_HEAD')
      
      if (profilesErr) throw profilesErr
      setHeads(profiles || [])

      // 2. Fetch models
      const { data: modelsData, error: modelsErr } = await supabase
        .from('models')
        .select(`
          id,
          name,
          exhibition_category,
          description,
          status,
          head_id,
          profiles:head_id (
            full_name,
            email
          )
        `)
        .order('name')
      
      if (modelsErr) throw modelsErr
      setModels(modelsData || [])
    } catch (err: any) {
      toast.error(err.message || 'Error loading database records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Create Model
  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Model Name is required')

    try {
      const payload: any = {
        name,
        exhibition_category: category,
        description,
        status,
        head_id: headId === 'none' ? null : headId
      }

      const { error } = await supabase.from('models').insert(payload)
      if (error) throw error

      toast.success('Model created successfully')
      setIsAddOpen(false)
      // Reset form
      setName('')
      setCategory('')
      setDescription('')
      setHeadId('none')
      setStatus('Active')
      
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Could not create model')
    }
  }

  // Edit Model Prep
  const openEditDialog = (model: any) => {
    setCurrentModel(model)
    setName(model.name)
    setCategory(model.exhibition_category || '')
    setDescription(model.description || '')
    setHeadId(model.head_id || 'none')
    setStatus(model.status)
    setIsEditOpen(true)
  }

  // Update Model
  const handleUpdateModel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentModel) return

    try {
      const payload = {
        name,
        exhibition_category: category,
        description,
        status,
        head_id: headId === 'none' ? null : headId
      }

      const { error } = await supabase
        .from('models')
        .update(payload)
        .eq('id', currentModel.id)

      if (error) throw error

      toast.success('Model updated successfully')
      setIsEditOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Could not update model')
    }
  }



  const handleDeleteModel = async (id: string) => {

    try {
      const { error } = await supabase.from('models').delete().eq('id', id)
      if (error) throw error
      toast.success('Model deleted successfully')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting model')
    }
  }

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.exhibition_category && m.exhibition_category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.profiles && m.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const activeModelsCount = models.filter(m => m.status === 'Active').length
  const assignedHeadsCount = models.filter(m => m.head_id !== null).length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Redesigned Colorful Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Models & Exhibition Heads</h1>
          <p className="text-purple-100 mt-2 text-sm max-w-xl">
            Configure various samagam models, assign supervisors, and manage active exhibition categories.
          </p>
        </div>
      </div>

      {/* Modern Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-primary/5 group-hover:scale-110 transition-transform duration-300">
            <Layers className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{models.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Exhibition divisions configured</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-emerald-500/5 group-hover:scale-110 transition-transform duration-300">
            <Database className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Divisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">{activeModelsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Operational right now</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-purple-500/5 group-hover:scale-110 transition-transform duration-300">
            <Shield className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Heads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-600">{assignedHeadsCount} / {heads.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Supervisors linked to models</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search models, categories, heads..."
            className="pl-9 bg-card shadow-sm border-primary/10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">

          {/* Add Model Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/95 hover:to-purple-600/95 text-white shadow-md font-semibold rounded-xl px-5 gap-2" />}>
              <Plus className="h-4 w-4" />
              Add Exhibition Model
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">Add New Model</DialogTitle>
              <DialogDescription>
                Create a new exhibition model division and link a model head.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateModel} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Name</Label>
                <Input id="name" placeholder="e.g. Ground Traffic" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                <Input id="category" placeholder="e.g. Logistics" value={category} onChange={e => setCategory(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                <Input id="description" placeholder="Brief duty details" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="head" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Head Assignment</Label>
                <Select value={headId} onValueChange={(val) => setHeadId(val || 'none')}>
                  <SelectTrigger id="head">
                    <SelectValue placeholder="Select a Model Head" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Head Assigned</SelectItem>
                    {heads.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.full_name} ({h.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val || 'Active')}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit">Create Model</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Edit Model Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Edit Model Details</DialogTitle>
            <DialogDescription>
              Modify name, assignment and categories for this model.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateModel} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Name</Label>
              <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
              <Input id="edit-category" value={category} onChange={e => setCategory(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
              <Input id="edit-description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-head" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Head Assignment</Label>
              <Select value={headId} onValueChange={(val) => setHeadId(val || 'none')}>
                <SelectTrigger id="edit-head">
                  <SelectValue placeholder="Select a Model Head" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Head Assigned</SelectItem>
                  {heads.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.full_name} ({h.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(val) => setStatus(val || 'Active')}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Models Glassmorphism Table */}
      <Card className="shadow-lg border-primary/10 overflow-hidden backdrop-blur-md bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-semibold">Loading model records...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 px-6">Model Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Category</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Assigned Head</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-right px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.map((model) => (
                  <TableRow key={model.id} className="hover:bg-muted/20 transition-colors duration-200">
                    <TableCell className="font-semibold text-sm text-foreground py-4 px-6">{model.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{model.exhibition_category || 'N/A'}</TableCell>
                    <TableCell className="text-sm">
                      {model.profiles ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{model.profiles.full_name}</span>
                          <span className="text-xs text-muted-foreground">{model.profiles.email}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/10 px-2.5 py-1 rounded-full">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${
                        model.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' 
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
                      }`}>
                        {model.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-4 px-6">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(model)} className="hover:bg-primary/10 hover:text-primary rounded-xl">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-xl" />}>
                            <Trash2 className="h-4 w-4" />
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. All associated volunteers may lose their assigned model.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteModel(model.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete Model
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredModels.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm font-semibold">
                      No models found in database. Create one above!
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
