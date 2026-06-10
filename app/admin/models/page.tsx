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
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Edit, Trash2, Database, Shield, Layers, HelpCircle, Loader2, FileText, Download } from 'lucide-react'
import { toast } from 'sonner'
import { exportToPDF } from '@/lib/pdf'
import { formatHeadLabel } from '@/lib/formatters'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
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

  const handleExportCSV = () => {
    if (models.length === 0) return
    const headers = ['Model Name', 'Category', 'Description', 'Model Head', 'Status']
    const rows = models.map(m => [
        m.name,
        m.exhibition_category || '',
        m.description || '',
        m.profiles?.full_name || 'Unassigned',
        m.status || 'Active'
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => `"${e.join('","')}"`)].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Exhibition_Models.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    if (models.length === 0) return
    const headers = ['Model Name', 'Category', 'Description', 'Model Head', 'Status']
    const rows = models.map(m => [
        m.name,
        m.exhibition_category || '',
        m.description || '',
        m.profiles?.full_name || 'Unassigned',
        m.status || 'Active'
    ])
    exportToPDF({
      title: 'Exhibition Models',
      subtitle: 'Complete list of all models and their assigned heads',
      filename: 'Exhibition_Models.pdf',
      headers,
      data: rows,
      themeColor: [147, 51, 234] // Purple
    })
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
      <div className="rounded-[32px] bg-[var(--color-peach)] p-6 md:p-10 text-ink border-ink shadow-hard pattern-dots relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex badge-flat bg-white text-ink border-ink transform -rotate-2">
            <Database className="w-4 h-4 mr-2" /> Divisions
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight">Models & Heads</h1>
          <p className="font-sans font-medium text-ink/80 text-lg max-w-xl">
            Configure various samagam models, assign supervisors, and manage active exhibition categories.
          </p>
        </div>
      </div>

      {/* Modern Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bento-white flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-150 shadow-hard-sm !p-5 !rounded-2xl">
          <div className="icon-tile icon-tile-yellow w-14 h-14 shadow-hard-xs transform -rotate-2 overflow-hidden bg-white">
            <Image src="/images/icons/icon_database.png" alt="Models" width={56} height={56} className="object-cover" />
          </div>
          <div className="mt-2">
            <div className="font-display font-bold text-3xl text-ink leading-none">{models.length}</div>
            <div className="font-display text-xs font-bold uppercase tracking-wider text-ink/60 mt-1.5">Total Models</div>
          </div>
        </div>

        <div className="bento-white flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-150 shadow-hard-sm !p-5 !rounded-2xl">
          <div className="icon-tile icon-tile-mint w-14 h-14 shadow-hard-xs transform rotate-2 overflow-hidden bg-white">
            <Image src="/images/icons/icon_check.png" alt="Active" width={56} height={56} className="object-cover" />
          </div>
          <div className="mt-2">
            <div className="font-display font-bold text-3xl text-ink leading-none">{activeModelsCount}</div>
            <div className="font-display text-xs font-bold uppercase tracking-wider text-ink/60 mt-1.5">Active Divisions</div>
          </div>
        </div>

        <div className="bento-white flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-150 shadow-hard-sm !p-5 !rounded-2xl">
          <div className="icon-tile icon-tile-pink w-14 h-14 shadow-hard-xs transform -rotate-2 overflow-hidden bg-white">
            <Image src="/images/icons/icon_users.png" alt="Heads" width={56} height={56} className="object-cover" />
          </div>
          <div className="mt-2">
            <div className="font-display font-bold text-3xl text-ink leading-none">{assignedHeadsCount} / {heads.length}</div>
            <div className="font-display text-xs font-bold uppercase tracking-wider text-ink/60 mt-1.5">Assigned Heads</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search models, categories, heads..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">

          <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
            <FileText className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4" /> Export PDF
          </Button>

          {/* Add Model Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="w-full sm:w-auto" />}>
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
                    <SelectItem value="none" label="No Head Assigned">No Head Assigned</SelectItem>
                    {heads.map(h => (
                      <SelectItem key={h.id} value={h.id} label={formatHeadLabel(h)}>{formatHeadLabel(h)}</SelectItem>
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
                    <SelectItem value="Active" label="Active">Active</SelectItem>
                    <SelectItem value="Inactive" label="Inactive">Inactive</SelectItem>
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
                  <SelectItem value="none" label="No Head Assigned">No Head Assigned</SelectItem>
                  {heads.map(h => (
                    <SelectItem key={h.id} value={h.id} label={formatHeadLabel(h)}>{formatHeadLabel(h)}</SelectItem>
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
                  <SelectItem value="Active" label="Active">Active</SelectItem>
                  <SelectItem value="Inactive" label="Inactive">Inactive</SelectItem>
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
      <div className="bento-white overflow-hidden rounded-[32px] border-ink shadow-hard">
        <div className="p-0">
          {loading ? (
            <div className="p-4 space-y-4">
              <div className="rounded-md border">
                <div className="border-b px-4 py-3 flex gap-4 bg-muted/40">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="px-4 py-4 flex items-center gap-4 border-b last:border-0">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <div className="space-y-2 w-48">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <div className="flex gap-1.5 ml-auto">
                      <Skeleton className="h-8 w-8 rounded-xl" />
                      <Skeleton className="h-8 w-8 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
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
                          <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" />}>
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
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                          <Database className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground font-semibold">No models found</p>
                        <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto">
                          Create a new exhibition model to start organizing your volunteers.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}
