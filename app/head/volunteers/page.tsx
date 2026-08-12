'use client'

import { useEffect, useReducer, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatModelLabel } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Printer, Trash2, Edit, Plus, Users, Filter, CheckCircle, UploadCloud, Download } from 'lucide-react'
import { AnimatedLoader } from '@/components/ui/animated-loader'
import { compressImage } from '@/lib/image'
import { CSVUpload } from '@/components/volunteers/CSVUpload'
import ImageCropperDialog from '@/components/volunteers/ImageCropperDialog'
import { toast } from 'sonner'
import { exportToPDF } from '@/lib/pdf'
import { GlassCard } from '@/components/ui/GlassCard'
import { getHeadVolunteersDataAction, createVolunteerAction, updateVolunteerAction, bulkImportVolunteersAction, uploadVolunteerPhotoAction } from './actions.server'

type State = {
  volunteers: any[]; myModels: any[]; loading: boolean; searchTerm: string;
  filterModel: string; filterStatus: string; isAddOpen: boolean; isEditOpen: boolean;
  currentVolunteer: any; fullName: string; mobileNumber: string; gender: string; age: string;
  emergencyContact: string; address: string; modelId: string; role: string; branch: string;
  remarks: string; photoUrl: string; accommodation: boolean; uploadingPhoto: boolean;
  cropDialogOpen: boolean; cropImageSrc: string; cropOriginalFile: File | null;
}

const initialState: State = {
  volunteers: [], myModels: [], loading: true, searchTerm: '',
  filterModel: 'all', filterStatus: 'all', isAddOpen: false, isEditOpen: false,
  currentVolunteer: null, fullName: '', mobileNumber: '', gender: 'Male', age: '',
  emergencyContact: '', address: '', modelId: '', role: 'Volunteer', branch: '',
  remarks: '', photoUrl: '', accommodation: false, uploadingPhoto: false,
  cropDialogOpen: false, cropImageSrc: '', cropOriginalFile: null
}

function reducer(state: State, action: any): State {
  switch (action.type) {
    case 'SET_DATA': return { ...state, volunteers: action.payload.volunteers, myModels: action.payload.models, modelId: action.payload.models[0]?.id || '', loading: false }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_STATE': return { ...state, [action.field]: action.payload }
    case 'RESET_FORM': return { ...state, fullName: '', mobileNumber: '', age: '', emergencyContact: '', address: '', remarks: '', photoUrl: '', branch: '', role: 'Volunteer', accommodation: false, modelId: state.myModels[0]?.id || '' }
    case 'OPEN_EDIT': return { ...state, currentVolunteer: action.payload, fullName: action.payload.full_name, mobileNumber: action.payload.mobile_number, gender: action.payload.gender || 'Male', age: action.payload.age ? action.payload.age.toString() : '', emergencyContact: action.payload.emergency_contact || '', address: action.payload.address || '', modelId: action.payload.model_id, role: action.payload.role || 'Volunteer', branch: action.payload.branch || '', accommodation: action.payload.accommodation || false, remarks: action.payload.remarks || '', photoUrl: action.payload.photo_url || '', isEditOpen: true }
    default: return state
  }
}

export default function HeadVolunteersPage() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const fetchData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const data = await getHeadVolunteersDataAction()
      dispatch({ type: 'SET_DATA', payload: data })
    } catch (err: any) {
      toast.error(err.message || 'Error loading records')
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Create Volunteer
  const handleCreateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.fullName.trim()) return toast.error('Full Name is required')
    if (!state.mobileNumber.trim()) return toast.error('Mobile Number is required')
    if (!state.modelId) return toast.error('Please assign to a model')
    if (!state.photoUrl) return toast.error('Photo is required')

    try {
      const payload: any = {
        full_name: state.fullName,
        mobile_number: state.mobileNumber,
        gender: state.gender,
        age: state.age ? parseInt(state.age) : null,
        emergency_contact: state.emergencyContact,
        address: state.address,
        model_id: state.modelId,
        role: state.role,
        branch: state.branch,
        remarks: state.remarks,
        photo_url: state.photoUrl || null,
        status: 'Pending'
      }

      const res: any = await createVolunteerAction(payload)
      if (res?.error) throw new Error(res.error)

      toast.success('Volunteer added successfully')
      dispatch({ type: 'SET_STATE', field: 'isAddOpen', payload: false })
      dispatch({ type: 'RESET_FORM' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Could not add volunteer')
    }
  }

  // Edit Prep
  const openEditDialog = (vol: any) => {
    dispatch({ type: 'OPEN_EDIT', payload: vol })
  }

  // Update Volunteer
  const handleUpdateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.currentVolunteer) return

    // Restriction: Cannot edit approved volunteers details
    if (state.currentVolunteer.status === 'Approved') {
      return toast.error('Approved volunteer details are locked and cannot be edited by Heads.')
    }
    if (!state.photoUrl) return toast.error('Photo is required')

    try {
      const payload = {
        full_name: state.fullName,
        mobile_number: state.mobileNumber,
        gender: state.gender,
        age: state.age ? parseInt(state.age) : null,
        emergency_contact: state.emergencyContact,
        address: state.address,
        model_id: state.modelId,
        role: state.role,
        branch: state.branch,
        remarks: state.remarks,
        photo_url: state.photoUrl || null
      }

      const res: any = await updateVolunteerAction(state.currentVolunteer.id, payload)

      if (res?.error) throw new Error(res.error)

      toast.success('Volunteer profile updated successfully')
      dispatch({ type: 'SET_STATE', field: 'isEditOpen', payload: false })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Could not update volunteer')
    }
  }

  const handleExportPDF = () => {
    if (state.volunteers.length === 0) {
      toast.error("No volunteers to export")
      return
    }

    const headers = ['SNK ID', 'Name', 'Mobile', 'Gender', 'Role', 'Status', 'Model']
    const rows = state.volunteers.map((v: any) => [
      v.snk_id || 'Pending',
      v.full_name || 'N/A',
      v.mobile_number || 'N/A',
      v.gender || 'N/A',
      v.role || 'Volunteer',
      v.status || 'Pending',
      v.models?.name || 'N/A'
    ])

    exportToPDF({
      title: 'My Volunteers Directory',
      subtitle: 'Official list of all registered volunteers in my models',
      filename: 'My_Volunteers_Directory.pdf',
      headers,
      data: rows,
      themeColor: [249, 115, 22] // Orange theme
    })
  }

  // Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0]
      dispatch({ type: 'SET_STATE', field: 'cropOriginalFile', payload: originalFile })
      const reader = new FileReader()
      reader.onload = () => {
        dispatch({ type: 'SET_STATE', field: 'cropImageSrc', payload: reader.result?.toString() || '' })
        dispatch({ type: 'SET_STATE', field: 'cropDialogOpen', payload: true })
      }
      reader.readAsDataURL(originalFile)
      e.target.value = '' // clear input
    }
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    dispatch({ type: 'SET_STATE', field: 'cropDialogOpen', payload: false })
    dispatch({ type: 'SET_STATE', field: 'uploadingPhoto', payload: true })
    try {
      const file = await compressImage(new File([croppedBlob], state.cropOriginalFile?.name || 'photo.jpg', { type: 'image/jpeg' }), 800, 0.7) // Compress before upload
      const fileExt = 'jpg'
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      const formData = new FormData()
      formData.append('file', file)
      formData.append('filePath', filePath)
      const { publicUrl } = await uploadVolunteerPhotoAction(formData)

      dispatch({ type: 'SET_STATE', field: 'photoUrl', payload: publicUrl })
      toast.success('Photo uploaded successfully')
    } catch (err: any) {
      toast.error(err.message || 'Photo upload failed')
    } finally {
      dispatch({ type: 'SET_STATE', field: 'uploadingPhoto', payload: false })
    }
  }

  // CSV Import Callback
  const handleCSVUploadSuccess = async (data: any[]) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      if (state.myModels.length === 0) {
        return toast.error('You are not assigned to supervise any models yet. Upload blocked.')
      }

      // Map models name to IDs
      const modelMap: Record<string, string> = {}
      state.myModels.forEach((m: any) => {
        modelMap[m.name.toLowerCase()] = m.id
      })

      const recordsToInsert: any[] = []
      const invalidRows: string[] = []

      data.forEach((row, idx) => {
        const rowModelName = row['Model Name'] || row['Model'] || ''
        const matchedModelId = modelMap[rowModelName.toLowerCase()]

        if (rowModelName && !matchedModelId) {
          invalidRows.push(`Row ${idx + 2}: Model "${rowModelName}" is not supervised by you.`)
        } else {
          recordsToInsert.push({
            full_name: row['Full Name'] || '',
            mobile_number: row['Mobile Number'] || row['Mobile'] || '',
            gender: row['Gender'] || 'Male',
            age: row['Age'] ? parseInt(row['Age']) : null,
            emergency_contact: row['Emergency Contact'] || row['Emergency'] || '',
            address: row['Address'] || '',
            role: row['Role'] || 'Volunteer',
            branch: row['Branch'] || '',
            status: 'Pending',
            model_id: matchedModelId || state.myModels[0].id // default to first supervised model
          })
        }
      })

      if (invalidRows.length > 0) {
        invalidRows.forEach(err => toast.error(err))
        throw new Error('Some rows contain models outside your authority.')
      }

      const res: any = await bulkImportVolunteersAction(recordsToInsert)
      if (res?.error) throw new Error(res.error)

      toast.success(`Successfully imported ${recordsToInsert.length} volunteers into database!`)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Database bulk insert failed')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Filtering
  const filteredVolunteers = state.volunteers.filter((v: any) => {
    const matchesSearch = v.full_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      v.id.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      v.mobile_number.includes(state.searchTerm)

    const matchesModel = state.filterModel === 'all' || v.model_id === state.filterModel
    const matchesStatus = state.filterStatus === 'all' || v.status === state.filterStatus

    return matchesSearch && matchesModel && matchesStatus
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ImageCropperDialog
        open={state.cropDialogOpen}
        onOpenChange={(val) => dispatch({ type: 'SET_STATE', field: 'cropDialogOpen', payload: val })}
        imageSrc={state.cropImageSrc}
        onCropComplete={handleCropComplete}
      />
      {/* Header */}
      <GlassCard className="p-6 md:p-8" glowColor="blue">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Supervised Volunteers</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Model Head Volunteer Roster
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Register and manage volunteers allocated to your supervised Samagam models. Add photo assets and submit for approval.
          </p>
        </div>
      </GlassCard>

      {state.myModels.length === 0 ? (
        <Card className="bg-card p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Supervised Models Assigned</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            You are not currently linked as head of any Samagam model. Contact the Super Admin to assign models to your profile.
          </p>
        </Card>
      ) : (
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="list" className="rounded-lg">Volunteers Directory</TabsTrigger>
            <TabsTrigger value="import" className="rounded-lg">Bulk Upload CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search name, ID, phone..."
                    className="pl-9"
                    value={state.searchTerm}
                    onChange={(e) => dispatch({ type: 'SET_STATE', field: 'searchTerm', payload: e.target.value })}
                  />
                </div>

                {/* Model Filter */}
                <Select value={state.filterModel} onValueChange={(val) => dispatch({ type: 'SET_STATE', field: 'filterModel', payload: val || 'all' })}>
                  <SelectTrigger className="w-full sm:w-44 bg-card border-primary/10 rounded-xl">
                    <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All My Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" label="All My Models">All My Models</SelectItem>
                    {state.myModels.map((m: any) => (
                      <SelectItem key={m.id} value={m.id} label={formatModelLabel(m)}>{formatModelLabel(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={state.filterStatus} onValueChange={(val) => dispatch({ type: 'SET_STATE', field: 'filterStatus', payload: val || 'all' })}>
                  <SelectTrigger className="w-full sm:w-36 bg-card border-primary/10 rounded-xl">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" label="All Statuses">All Statuses</SelectItem>
                    <SelectItem value="Approved" label="Approved">Approved</SelectItem>
                    <SelectItem value="Pending" label="Pending">Pending</SelectItem>
                    <SelectItem value="Rejected" label="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    window.location.href = `/api/export?status=${state.filterStatus}&model=${state.filterModel}&search=${state.searchTerm}`
                  }}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleExportPDF}
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>

                {/* Add Trigger */}
                <Dialog open={state.isAddOpen} onOpenChange={(val) => dispatch({ type: 'SET_STATE', field: 'isAddOpen', payload: val })}>
                  <DialogTrigger>
                    <Button
                      className="w-full sm:w-auto px-5 gap-2"
                      onClick={() => {
                        dispatch({ type: 'RESET_FORM' });
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Volunteer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xl rounded-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Register New Volunteer</DialogTitle>
                      <DialogDescription>Input profile details. Approved cards will be generated by the Super Admin.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateVolunteer} className="space-y-4 py-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase">Full Name *</Label>
                          <Input value={state.fullName} onChange={e => dispatch({ type: 'SET_STATE', field: 'fullName', payload: e.target.value })} required />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase">Contact Number *</Label>
                          <Input type="tel" value={state.mobileNumber} onChange={e => dispatch({ type: 'SET_STATE', field: 'mobileNumber', payload: e.target.value.replace(/\D/g, '') })} maxLength={10} required />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase">Gender *</Label>
                          <Select value={state.gender} onValueChange={(val) => dispatch({ type: 'SET_STATE', field: 'gender', payload: val || 'Male' })} required>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase">Age *</Label>
                          <Input type="number" value={state.age} onChange={e => dispatch({ type: 'SET_STATE', field: 'age', payload: e.target.value })} required />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase">Seva/Role</Label>
                          <Select value={state.role} onValueChange={(val) => dispatch({ type: 'SET_STATE', field: 'role', payload: val || 'Volunteer' })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Volunteer">Volunteer</SelectItem>
                              <SelectItem value="Model Incharge">Model Incharge</SelectItem>
                              <SelectItem value="Co-ordinator">Co-ordinator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase">Branch</Label>
                          <Input value={state.branch} onChange={e => dispatch({ type: 'SET_STATE', field: 'branch', payload: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase">Model / Duty Area</Label>
                          <Select value={state.modelId} onValueChange={(val) => dispatch({ type: 'SET_STATE', field: 'modelId', payload: val || '' })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose Division">
                                {state.myModels.find((m: any) => m.id === state.modelId) ? formatModelLabel(state.myModels.find((m: any) => m.id === state.modelId)) : "Choose Division"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {state.myModels.map((m: any) => (
                                <SelectItem key={m.id} value={m.id} label={formatModelLabel(m)}>{formatModelLabel(m)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase">Emergency Contact *</Label>
                          <Input type="tel" value={state.emergencyContact} onChange={e => dispatch({ type: 'SET_STATE', field: 'emergencyContact', payload: e.target.value.replace(/\D/g, '') })} maxLength={10} required />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase">Address</Label>
                          <Input value={state.address} onChange={e => dispatch({ type: 'SET_STATE', field: 'address', payload: e.target.value })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="space-y-1 md:col-span-4">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase">Requirements</Label>
                          <div className="flex items-center space-x-2 h-10 px-3 rounded-md border border-input bg-muted/30 hover:bg-muted/50 transition-colors shadow-sm w-full">
                            <Checkbox id="add-accommodation" checked={state.accommodation} onCheckedChange={(checked) => dispatch({ type: 'SET_STATE', field: 'accommodation', payload: checked as boolean })} />
                            <Label htmlFor="add-accommodation" className="text-[11px] font-bold uppercase cursor-pointer whitespace-nowrap">Accommodation</Label>
                          </div>
                        </div>
                        <div className="space-y-1 md:col-span-8">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase">Remarks</Label>
                          <Input value={state.remarks} onChange={e => dispatch({ type: 'SET_STATE', field: 'remarks', payload: e.target.value })} />
                        </div>
                      </div>

                      <div className="space-y-1.5 p-4 border border-dashed rounded-lg bg-muted/30">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Volunteer Photo *</Label>
                        <div className="flex items-center gap-4 mt-2">
                          {state.photoUrl && (
                            <Image src={state.photoUrl} alt="Volunteer preview" width={64} height={80} unoptimized className="w-16 h-20 object-cover rounded-md border" />
                          )}
                          <Input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={state.uploadingPhoto} />
                          {state.uploadingPhoto && <AnimatedLoader className="w-4 h-4" />}
                        </div>
                      </div>

                      <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => dispatch({ type: 'SET_STATE', field: 'isAddOpen', payload: false })}>Cancel</Button>
                        <Button type="submit">Submit Volunteer</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Edit Volunteer Dialog */}
            <Dialog open={state.isEditOpen} onOpenChange={(val) => dispatch({ type: 'SET_STATE', field: 'isEditOpen', payload: val })}>
              <DialogContent className="sm:max-w-xl rounded-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Edit Volunteer Details</DialogTitle>
                  <DialogDescription>Modify fields and save changes. Cards already approved are locked from head edits.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateVolunteer} className="space-y-4 py-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Full Name *</Label>
                      <Input value={state.fullName} onChange={e => dispatch({ type: 'SET_STATE', field: 'fullName', payload: e.target.value })} required disabled={state.currentVolunteer?.status === 'Approved'} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Contact Number *</Label>
                      <Input type="tel" value={state.mobileNumber} onChange={e => dispatch({ type: 'SET_STATE', field: 'mobileNumber', payload: e.target.value.replace(/\D/g, '') })} disabled={state.currentVolunteer?.status === 'Approved'} maxLength={10} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Gender *</Label>
                      <Select value={state.gender} onValueChange={(val) => dispatch({ type: 'SET_STATE', field: 'gender', payload: val || 'Male' })} disabled={state.currentVolunteer?.status === 'Approved'} required>
                        <SelectTrigger disabled={state.currentVolunteer?.status === 'Approved'}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Age *</Label>
                      <Input type="number" value={state.age} onChange={e => dispatch({ type: 'SET_STATE', field: 'age', payload: e.target.value })} disabled={state.currentVolunteer?.status === 'Approved'} required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Seva/Role</Label>
                      <Select value={state.role} onValueChange={(val) => dispatch({ type: 'SET_STATE', field: 'role', payload: val || 'Volunteer' })} disabled={state.currentVolunteer?.status === 'Approved'}>
                        <SelectTrigger disabled={state.currentVolunteer?.status === 'Approved'}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Volunteer">Volunteer</SelectItem>
                          <SelectItem value="Model Incharge">Model Incharge</SelectItem>
                          <SelectItem value="Co-ordinator">Co-ordinator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Branch</Label>
                      <Input value={state.branch} onChange={e => dispatch({ type: 'SET_STATE', field: 'branch', payload: e.target.value })} disabled={state.currentVolunteer?.status === 'Approved'} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Model / Duty Area</Label>
                      <Select value={state.modelId} onValueChange={(val) => dispatch({ type: 'SET_STATE', field: 'modelId', payload: val || '' })} disabled={state.currentVolunteer?.status === 'Approved'}>
                        <SelectTrigger disabled={state.currentVolunteer?.status === 'Approved'}>
                          <SelectValue placeholder="Choose Division">
                            {state.myModels.find((m: any) => m.id === state.modelId) ? formatModelLabel(state.myModels.find((m: any) => m.id === state.modelId)) : "Choose Division"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {state.myModels.map((m: any) => (
                            <SelectItem key={m.id} value={m.id} label={formatModelLabel(m)}>{formatModelLabel(m)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Emergency Contact *</Label>
                      <Input type="tel" value={state.emergencyContact} onChange={e => dispatch({ type: 'SET_STATE', field: 'emergencyContact', payload: e.target.value.replace(/\D/g, '') })} disabled={state.currentVolunteer?.status === 'Approved'} maxLength={10} required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Address</Label>
                      <Input value={state.address} onChange={e => dispatch({ type: 'SET_STATE', field: 'address', payload: e.target.value })} disabled={state.currentVolunteer?.status === 'Approved'} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="space-y-1 md:col-span-4">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Requirements</Label>
                      <div className="flex items-center space-x-2 h-10 px-3 rounded-md border border-input bg-muted/30 hover:bg-muted/50 transition-colors shadow-sm w-full">
                        <Checkbox id="edit-accommodation" checked={state.accommodation} onCheckedChange={(checked) => dispatch({ type: 'SET_STATE', field: 'accommodation', payload: checked as boolean })} disabled={state.currentVolunteer?.status === 'Approved'} />
                        <Label htmlFor="edit-accommodation" className="text-[11px] font-bold uppercase cursor-pointer whitespace-nowrap">Accommodation</Label>
                      </div>
                    </div>
                    <div className="space-y-1 md:col-span-8">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Remarks</Label>
                      <Input value={state.remarks} onChange={e => dispatch({ type: 'SET_STATE', field: 'remarks', payload: e.target.value })} disabled={state.currentVolunteer?.status === 'Approved'} />
                    </div>
                  </div>

                  <div className="space-y-1.5 p-4 border border-dashed rounded-lg bg-muted/30">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Volunteer Photo *</Label>
                    <div className="flex items-center gap-4 mt-2">
                      {state.photoUrl && (
                        <Image src={state.photoUrl} alt="Volunteer preview" width={64} height={80} unoptimized className="w-16 h-20 object-cover rounded-md border" />
                      )}
                      <Input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={state.uploadingPhoto || state.currentVolunteer?.status === 'Approved'} />
                      {state.uploadingPhoto && <AnimatedLoader className="w-4 h-4" />}
                    </div>
                  </div>

                  {state.currentVolunteer?.status === 'Approved' && (
                    <p className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/15 p-2 rounded border border-amber-100">
                      ⚠️ Profile is approved and locked. Contact the Super Admin to request edits.
                    </p>
                  )}

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => dispatch({ type: 'SET_STATE', field: 'isEditOpen', payload: false })}>Cancel</Button>
                    <Button type="submit" disabled={state.currentVolunteer?.status === 'Approved'}>Save Changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* List */}
            <div className="glass-panel overflow-hidden rounded-3xl border border-white/40 dark:border-slate-800/80 shadow-xl">
              <div className="p-0">
                {state.loading ? (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-8 w-[200px]" />
                      <Skeleton className="h-8 w-[150px]" />
                    </div>
                    <div className="rounded-md border">
                      <div className="border-b px-4 py-3 flex gap-4 bg-muted/40">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </div>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="px-4 py-4 flex items-center gap-4 border-b last:border-0">
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-10 w-10 rounded-md" />
                          <div className="space-y-2 w-48">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-8 w-8 ml-auto rounded-xl" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : state.volunteers.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm font-semibold">
                    No volunteers registered in your models. Add one above!
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 px-6">Volunteer ID</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Photo</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Name</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Mobile</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Assigned Area</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Card Status</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-right px-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVolunteers.map((vol: any) => (
                        <TableRow key={vol.id} className="hover:bg-muted/20 transition-colors duration-200">
                          <TableCell className="font-bold text-sm text-primary py-4 px-6">{vol.snk_id || 'Pending'}</TableCell>
                          <TableCell>
                            <div className="w-10 h-12 rounded bg-muted overflow-hidden flex items-center justify-center border shadow-sm">
                              {vol.photo_url ? (
                                <Image src={vol.photo_url} alt={`${vol.full_name}'s avatar`} width={40} height={48} unoptimized className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{vol.full_name}</span>
                              <span className="text-xs text-muted-foreground font-medium">{vol.role || 'Volunteer'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-muted-foreground">{vol.mobile_number}</TableCell>
                          <TableCell className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{vol.models?.name}</TableCell>
                          <TableCell>
                            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${vol.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                                : vol.status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
                              }`}>
                              {vol.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-4 space-x-1 px-6">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(vol)} title="Edit Details" className="h-8 w-8 hover:bg-primary/10 rounded-lg">
                              <Edit className="h-4 w-4 text-primary" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredVolunteers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-16">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                <Users className="w-8 h-8 text-muted-foreground/50" />
                              </div>
                              <p className="text-muted-foreground font-semibold">No volunteers found</p>
                              <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto">
                                {state.searchTerm || state.filterStatus !== 'all' || state.filterModel !== 'all'
                                  ? "Try adjusting your search or filters to find what you're looking for."
                                  : "There are no volunteers in the system yet."}
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
          </TabsContent>

          <TabsContent value="import">
            <Card className="bg-card shadow-sm border-primary/10 rounded-2xl">
              <CardHeader className="border-b border-primary/5 pb-6">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5 text-primary" />
                  </div>
                  Bulk Import via CSV
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Add multiple volunteers to your supervised models at once. Follow the template carefully.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="bg-muted/30 rounded-xl p-6 border border-dashed border-primary/20">
                  <CSVUpload
                    onUploadSuccess={handleCSVUploadSuccess}
                  />
                </div>

                <div className="mt-8 space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Guidelines for Head Import</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>You can only import volunteers into models that you supervise: <strong className="text-foreground">{state.myModels.map((m: any) => m.name).join(', ') || 'None'}</strong>.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>The <strong>Model Name</strong> column in the CSV must match exactly.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Photos must be uploaded manually for each imported volunteer later by editing their profile.</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
