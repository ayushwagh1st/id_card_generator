'use client'
import { ActionForm } from '@/components/ui/action-form'

import { useEffect, useReducer } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchField } from '@/components/ui/search-field'
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
import { Plus, Search, Edit, Trash2, Database, Shield, Layers, HelpCircle, Loader2, FileText, Download, CheckCircle, Users } from 'lucide-react'
import { toast } from 'sonner'
import { exportToPDF } from '@/lib/pdf'
import { formatHeadLabel } from '@/lib/formatters'
import { GlassCard } from '@/components/ui/GlassCard'
import Image from 'next/image'
import { getHeadsDataAction, getModelsDataAction, createModelAction, updateModelAction, deleteModelAction } from './actions.server'

export default function ModelsPage() {
  const [state, dispatch] = useReducer(
    (state: any, action: any) => {
      switch (action.type) {
        case 'SET_DATA':
          return { ...state, models: action.payload.models, heads: action.payload.heads, loading: false }
        case 'SET_LOADING':
          return { ...state, loading: action.payload }
        case 'SET_SEARCH_TERM':
          return { ...state, searchTerm: action.payload }
        case 'SET_FORM_FIELD':
          return { ...state, [action.field]: action.value }
        case 'OPEN_ADD':
          return { ...state, isAddOpen: true, name: '', category: '', description: '', headId: 'none', status: 'Active' }
        case 'CLOSE_ADD':
          return { ...state, isAddOpen: false }
        case 'OPEN_EDIT':
          return {
            ...state,
            isEditOpen: true,
            currentModel: action.payload,
            name: action.payload.name,
            category: action.payload.exhibition_category || '',
            description: action.payload.description || '',
            headId: action.payload.head_id || 'none',
            status: action.payload.status || 'Active'
          }
        case 'CLOSE_EDIT':
          return { ...state, isEditOpen: false, currentModel: null }
        default:
          return state
      }
    },
    {
      models: [], heads: [], searchTerm: '', loading: true,
      isAddOpen: false, isEditOpen: false, currentModel: null,
      name: '', category: '', description: '', headId: 'none', status: 'Active'
    }
  )

  const fetchData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const [headsData, modelsData] = await Promise.all([
        getHeadsDataAction(),
        getModelsDataAction()
      ])
      dispatch({ type: 'SET_DATA', payload: { heads: headsData, models: modelsData } })
    } catch (err: any) {
      toast.error(err.message || 'Error loading database records')
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.name.trim()) return toast.error('Model Name is required')

    try {
      await createModelAction({
        name: state.name,
        exhibition_category: state.category,
        description: state.description,
        status: state.status,
        head_id: state.headId === 'none' ? null : state.headId
      })
      toast.success('Model created successfully')
      dispatch({ type: 'CLOSE_ADD' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Could not create model')
    }
  }

  const handleUpdateModel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.currentModel) return

    try {
      await updateModelAction(state.currentModel.id, {
        name: state.name,
        exhibition_category: state.category,
        description: state.description,
        status: state.status,
        head_id: state.headId === 'none' ? null : state.headId
      })
      toast.success('Model updated successfully')
      dispatch({ type: 'CLOSE_EDIT' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Could not update model')
    }
  }

  const handleDeleteModel = async (id: string) => {
    try {
      await deleteModelAction(id)
      toast.success('Model deleted successfully')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting model')
    }
  }

  const handleExportCSV = () => {
    if (state.models.length === 0) return
    const headers = ['Model Name', 'Category', 'Description', 'Model Head', 'Status']
    const rows = state.models.map((m: any) => [
        m.name,
        m.exhibition_category || '',
        m.description || '',
        m.profiles?.full_name || 'Unassigned',
        m.status || 'Active'
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map((e: any) => `"${e.join('","')}"`)].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Exhibition_Models.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    if (state.models.length === 0) return
    const headers = ['Model Name', 'Category', 'Description', 'Model Head', 'Status']
    const rows = state.models.map((m: any) => [
        m.name,
        m.exhibition_category || '',
        m.description || '',
        m.profiles?.full_name || 'Unassigned',
        m.status || 'Active'
    ])
    const activeCount = state.models.filter((m: any) => m.status === 'Active').length
    const assignedHeadsCount = state.models.filter((m: any) => m.profiles?.full_name).length

    exportToPDF({
      title: 'Exhibition Models Directory',
      subtitle: 'Official allocation of exhibition models, zones, and supervising heads',
      filename: 'Exhibition_Models.pdf',
      headers,
      data: rows,
      summaryStats: [
        { label: 'Total Models', value: state.models.length },
        { label: 'Active Zones', value: activeCount },
        { label: 'Assigned Leads', value: assignedHeadsCount }
      ]
    })
  }

  const filteredModels = state.models.filter((m: any) => 
    m.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    (m.exhibition_category && m.exhibition_category.toLowerCase().includes(state.searchTerm.toLowerCase())) ||
    (m.profiles && m.profiles.full_name.toLowerCase().includes(state.searchTerm.toLowerCase()))
  )

  const activeModelsCount = state.models.filter((m: any) => m.status === 'Active').length
  const assignedHeadsCount = state.models.filter((m: any) => m.head_id !== null).length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <GlassCard className="p-8 md:p-10 relative overflow-hidden" glowColor="blue">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide uppercase border border-emerald-500/20">
            <Database className="w-4 h-4" /> 
            <span>Divisions</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Models & Heads
          </h1>
          <p className="font-sans text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
            Configure various samagam models, assign supervisors, and manage active exhibition categories.
          </p>
        </div>
      </GlassCard>

      {/* Modern Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-6" glowColor="blue">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Total Models</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{state.models.length}</div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" glowColor="cyan">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Active Divisions</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{activeModelsCount}</div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" glowColor="purple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Assigned Heads</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{assignedHeadsCount} / {state.heads.length}</div>
          </div>
        </GlassCard>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
          <SearchField id="model-search" label="Search models" className="sm:w-80"
            placeholder="Search models, categories, heads..."
            value={state.searchTerm}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
          />

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">

          <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
            <FileText className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4" /> Export PDF
          </Button>

          {/* Add Model Dialog */}
          <Dialog open={state.isAddOpen} onOpenChange={(val) => val ? dispatch({ type: 'OPEN_ADD' }) : dispatch({ type: 'CLOSE_ADD' })}>
            <DialogTrigger className="w-full sm:w-auto">
              <span className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 px-5 h-10 text-xs sm:text-sm font-semibold cursor-pointer transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add Exhibition Model
              </span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">Add New Model</DialogTitle>
              <DialogDescription>
                Create a new exhibition model division and link a model head.
              </DialogDescription>
            </DialogHeader>
            <ActionForm onSubmit={handleCreateModel} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Name</Label>
                <Input id="name" placeholder="e.g. Ground Traffic" value={state.name} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'name', value: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                <Input id="category" placeholder="e.g. Logistics" value={state.category} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'category', value: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                <Input id="description" placeholder="Brief duty details" value={state.description} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'description', value: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="head" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Head Assignment</Label>
                <Select value={state.headId} onValueChange={(val) => dispatch({ type: 'SET_FORM_FIELD', field: 'headId', value: val || 'none' })}>
                  <SelectTrigger id="head">
                    <SelectValue placeholder="Select a Model Head" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Head Assigned</SelectItem>
                    {state.heads.map((h: any) => (
                      <SelectItem key={h.id} value={h.id}>{formatHeadLabel(h)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={state.status} onValueChange={(val) => dispatch({ type: 'SET_FORM_FIELD', field: 'status', value: val || 'Active' })}>
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
                <Button type="button" variant="outline" onClick={() => dispatch({ type: 'CLOSE_ADD' })}>Cancel</Button>
                <Button type="submit">Create Model</Button>
              </DialogFooter>
            </ActionForm>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Edit Model Dialog */}
      <Dialog open={state.isEditOpen} onOpenChange={(val) => !val && dispatch({ type: 'CLOSE_EDIT' })}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Edit Model Details</DialogTitle>
            <DialogDescription>
              Modify name, assignment and categories for this model.
            </DialogDescription>
          </DialogHeader>
          <ActionForm onSubmit={handleUpdateModel} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Name</Label>
              <Input id="edit-name" value={state.name} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'name', value: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
              <Input id="edit-category" value={state.category} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'category', value: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
              <Input id="edit-description" value={state.description} onChange={e => dispatch({ type: 'SET_FORM_FIELD', field: 'description', value: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-head" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model Head Assignment</Label>
              <Select value={state.headId} onValueChange={(val) => dispatch({ type: 'SET_FORM_FIELD', field: 'headId', value: val || 'none' })}>
                <SelectTrigger id="edit-head">
                  <SelectValue placeholder="Select a Model Head" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Head Assigned</SelectItem>
                  {state.heads.map((h: any) => (
                    <SelectItem key={h.id} value={h.id}>{formatHeadLabel(h)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={state.status} onValueChange={(val) => dispatch({ type: 'SET_FORM_FIELD', field: 'status', value: val || 'Active' })}>
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
              <Button type="button" variant="outline" onClick={() => dispatch({ type: 'CLOSE_EDIT' })}>Cancel</Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </ActionForm>
        </DialogContent>
      </Dialog>

      {/* Models Glassmorphism Table */}
      <GlassCard className="p-0 overflow-hidden" glowColor="blue">
        <div className="p-0">
          {state.loading ? (
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
                {filteredModels.map((model: any) => (
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
                        <Button variant="ghost" size="icon" aria-label={`Edit ${model.name}`} onClick={() => dispatch({ type: 'OPEN_EDIT', payload: model })} className="hover:bg-primary/10 hover:text-primary rounded-xl">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button variant="ghost" size="icon" aria-label={`Delete ${model.name}`} className="text-destructive hover:bg-destructive/10" />}>
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
      </GlassCard>
    </div>
  )
}
