'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Printer, Trash2, Edit, Plus, Users, Filter, CheckCircle, UploadCloud, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { AnimatedLoader } from '@/components/ui/animated-loader'
import { compressImage } from '@/lib/image'
import { CSVUpload } from '@/components/volunteers/CSVUpload'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { exportToPDF } from '@/lib/pdf'
import { getVolunteersAction, addVolunteerAction, updateVolunteerAction, deleteVolunteerAction, bulkDeleteVolunteersAction, bulkApproveVolunteersAction } from '@/app/actions/volunteers'
import { formatModelLabel } from '@/lib/formatters'

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 20

  // Filters
  const [filterModel, setFilterModel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Add/Edit Form states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [currentVolunteer, setCurrentVolunteer] = useState<any>(null)
  
  const [fullName, setFullName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [gender, setGender] = useState('Male')
  const [age, setAge] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [address, setAddress] = useState('')
  const [modelId, setModelId] = useState('none')
  const [role, setRole] = useState('Volunteer') // Designation
  const [branch, setBranch] = useState('')
  const [remarks, setRemarks] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [accommodation, setAccommodation] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const fetchModels = async () => {
    const { data: modelsData, error: modelsErr } = await supabase
      .from('models')
      .select('id, name')
    if (!modelsErr && modelsData) setModels(modelsData)
  }

  const fetchVolunteers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await getVolunteersAction(page, limit, searchTerm, filterStatus, filterModel)
      setVolunteers(data || [])
      setTotalCount(count || 0)
    } catch (err: any) {
      toast.error(err.message || 'Error loading volunteer records')
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchTerm, filterStatus, filterModel])

  useEffect(() => {
    fetchModels()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchVolunteers()
    }, 300) // debounce
    return () => clearTimeout(timeoutId)
  }, [fetchVolunteers])

  const handleCreateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return toast.error('Full Name is required')
    if (!mobileNumber.trim()) return toast.error('Mobile Number is required')

    try {
      const payload: any = {
        full_name: fullName,
        mobile_number: mobileNumber,
        gender,
        age: age ? parseInt(age) : null,
        emergency_contact: emergencyContact,
        address,
        model_id: modelId === 'none' ? null : modelId,
        role,
        branch,
        accommodation,
        designation: role,
        remarks,
        photo_url: photoUrl || null,
        status: 'Pending'
      }

      const res = await addVolunteerAction(payload)
      if (res?.error) throw new Error(res.error)

      toast.success('Volunteer added successfully')
      setIsAddOpen(false)
      // Reset
      setFullName(''); setMobileNumber(''); setAge(''); setEmergencyContact(''); setAddress(''); setRemarks(''); setPhotoUrl(''); setBranch(''); setRole('Volunteer'); setAccommodation(false);
      
      fetchVolunteers()
    } catch (err: any) {
      toast.error(err.message || 'Could not add volunteer')
    }
  }

  const openEditDialog = (vol: any) => {
    setCurrentVolunteer(vol)
    setFullName(vol.full_name)
    setMobileNumber(vol.mobile_number)
    setGender(vol.gender || 'Male')
    setAge(vol.age ? vol.age.toString() : '')
    setEmergencyContact(vol.emergency_contact || '')
    setAddress(vol.address || '')
    setModelId(vol.model_id || 'none')
    setRole(vol.role || 'Volunteer')
    setBranch(vol.branch || '')
    setAccommodation(vol.accommodation || false)
    setRemarks(vol.remarks || '')
    setPhotoUrl(vol.photo_url || '')
    setIsEditOpen(true)
  }

  const handleUpdateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentVolunteer) return

    try {
      const payload = {
        full_name: fullName,
        mobile_number: mobileNumber,
        gender,
        age: age ? parseInt(age) : null,
        emergency_contact: emergencyContact,
        address,
        model_id: modelId === 'none' ? null : modelId,
        role,
        branch,
        accommodation,
        designation: role,
        remarks,
        photo_url: photoUrl || null
      }

      const res = await updateVolunteerAction(currentVolunteer.id, payload)
      if (res?.error) throw new Error(res.error)

      toast.success('Volunteer updated successfully')
      setIsEditOpen(false)
      fetchVolunteers()
    } catch (err: any) {
      toast.error(err.message || 'Could not update volunteer')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await updateVolunteerAction(id, { status })
      if (res?.error) throw new Error(res.error)
      toast.success(`Status updated to ${status}`)
      fetchVolunteers()
    } catch (err: any) {
      toast.error(err.message || 'Could not update status')
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return
    try {
      const res = await bulkApproveVolunteersAction(selectedIds)
      if (res?.error) throw new Error(res.error)
      toast.success(`Approved ${selectedIds.length} volunteers`)
      setSelectedIds([])
      fetchVolunteers()
    } catch (err: any) {
      toast.error(err.message || 'Error executing bulk approval')
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    try {
      const res = await bulkDeleteVolunteersAction(selectedIds)
      if (res?.error) throw new Error(res.error)
      toast.success(`${selectedIds.length} volunteers deleted`)
      setSelectedIds([])
      fetchVolunteers()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting volunteers')
    }
  }

  const handleExportPDF = () => {
    if (volunteers.length === 0) {
      toast.error("No volunteers to export")
      return
    }

    const headers = ['SNK ID', 'Name', 'Mobile', 'Gender', 'Role', 'Status', 'Model']
    const rows = volunteers.map(v => [
        v.snk_id || 'Pending',
        v.full_name || 'N/A',
        v.mobile_number || 'N/A',
        v.gender || 'N/A',
        v.role || 'Volunteer',
        v.status || 'Pending',
        v.models?.name || 'N/A'
    ])

    exportToPDF({
      title: 'Volunteers Directory',
      subtitle: 'Official list of all registered volunteers',
      filename: 'Volunteers_Directory.pdf',
      headers,
      data: rows,
      themeColor: [79, 70, 229] // Indigo
    })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0]
      setUploadingPhoto(true)
      try {
        let file = await compressImage(originalFile, 800, 0.7)

        const fileExt = file.name.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        const { data, error: uploadError } = await supabase.storage
          .from('volunteer-photos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('volunteer-photos')
          .getPublicUrl(filePath)

        setPhotoUrl(urlData.publicUrl)
        toast.success('Photo uploaded successfully')
      } catch (err: any) {
        toast.error(err.message || 'Photo upload failed')
      } finally {
        setUploadingPhoto(false)
      }
    }
  }

  const handleCSVUploadSuccess = async (data: any[]) => {
    // Relying on the CSV component for validation
    fetchVolunteers()
  }

  const handlePrintSelected = () => {
    localStorage.setItem('print-volunteer-ids', JSON.stringify(selectedIds))
    router.push('/admin/print')
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === volunteers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(volunteers.map(v => v.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-[32px] bg-[var(--color-yellow)] p-6 md:p-10 text-ink border-ink shadow-hard pattern-grid relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex badge-flat bg-white text-ink border-ink transform -rotate-2">
            <Users className="w-4 h-4 mr-2" /> Directory
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight">Volunteer Directory</h1>
          <p className="font-sans font-medium text-ink/80 text-lg max-w-xl">
            Approve, manage, and print ID cards for all active volunteers. Import datasets via CSV securely.
          </p>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="list" className="rounded-lg">All Volunteers</TabsTrigger>
          <TabsTrigger value="import" className="rounded-lg">Bulk Import (CSV)</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search name, SNK ID, mobile..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>

              <Select value={filterModel} onValueChange={(val) => { setFilterModel(val || 'all'); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-48 bg-card border-primary/10 rounded-xl">
                  <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="All Exhibition Models">All Exhibition Models</SelectItem>
                  {models.map(m => (
                    <SelectItem key={m.id} value={m.id} label={formatModelLabel(m)}>{formatModelLabel(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val || 'all'); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-40 bg-card border-primary/10 rounded-xl">
                  <SelectValue placeholder="Filter by Status" />
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
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl">
                  <Button variant="outline" size="sm" onClick={handlePrintSelected} className="gap-1.5 text-primary bg-card px-3">
                    <Printer className="h-3.5 w-3.5" />
                    Print Selected ({selectedIds.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkApprove} className="gap-1.5 bg-card px-3">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5 text-destructive bg-card px-3" />}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {selectedIds.length} volunteer record(s). This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Records
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  window.open(`/api/export?type=volunteers&status=${filterStatus}&model=${filterModel}&search=${searchTerm}`, '_blank')
                }}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>

              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleExportPDF}
              >
                <Download className="w-4 h-4" />
                Export PDF
              </Button>

              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger render={<Button className="w-full sm:w-auto px-5 gap-2" />}>
                  <Plus className="h-4 w-4" />
                  Add Volunteer
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl rounded-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Add Volunteer Manually</DialogTitle>
                    <DialogDescription>SNK IDs are auto-generated sequentially.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateVolunteer} className="space-y-4 py-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Full Name</Label>
                        <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Contact Number *</Label>
                        <Input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Gender</Label>
                        <Select value={gender} onValueChange={(val) => setGender(val || 'Male')}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Age</Label>
                        <Input type="number" value={age} onChange={e => setAge(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Designation/Role</Label>
                        <Input value={role} onChange={e => setRole(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Branch</Label>
                        <Input value={branch} onChange={e => setBranch(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Model / Duty Area</Label>
                        <Select value={modelId} onValueChange={(val) => setModelId(val || 'none')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose Division">
                              {modelId === 'none' ? 'Not Assigned' : models.find(m => m.id === modelId) ? formatModelLabel(models.find(m => m.id === modelId)) : 'Not Assigned'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" label="Not Assigned">Not Assigned</SelectItem>
                            {models.map(m => (
                              <SelectItem key={m.id} value={m.id} label={formatModelLabel(m)}>{formatModelLabel(m)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Emergency Contact *</Label>
                        <Input value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} required />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Address</Label>
                        <Input value={address} onChange={e => setAddress(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="space-y-1 md:col-span-4">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Requirements</Label>
                        <div className="flex items-center space-x-2 h-10 px-3 rounded-md border border-input bg-muted/30 hover:bg-muted/50 transition-colors shadow-sm w-full">
                          <Checkbox id="add-accommodation" checked={accommodation} onCheckedChange={(checked) => setAccommodation(checked as boolean)} />
                          <Label htmlFor="add-accommodation" className="text-[11px] font-bold uppercase cursor-pointer whitespace-nowrap">Accommodation</Label>
                        </div>
                      </div>
                      <div className="space-y-1 md:col-span-8">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Remarks</Label>
                        <Input value={remarks} onChange={e => setRemarks(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-1.5 p-4 border border-dashed rounded-lg bg-muted/30">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Volunteer Photo</Label>
                      <div className="flex items-center gap-4 mt-2">
                        {photoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photoUrl} alt="Preview" className="w-16 h-20 object-cover rounded-md border" />
                        )}
                        <Input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                        {uploadingPhoto && <AnimatedLoader className="w-4 h-4" />}
                      </div>
                    </div>

                    <DialogFooter className="pt-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                      <Button type="submit">Create Volunteer</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-xl rounded-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Edit Volunteer Profile</DialogTitle>
                <DialogDescription>Modify fields and upload new assets for this volunteer card.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateVolunteer} className="space-y-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Full Name</Label>
                    <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Contact Number *</Label>
                    <Input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Gender</Label>
                    <Select value={gender} onValueChange={(val) => setGender(val || 'Male')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Age</Label>
                    <Input type="number" value={age} onChange={e => setAge(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Designation/Role</Label>
                    <Input value={role} onChange={e => setRole(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Branch</Label>
                    <Input value={branch} onChange={e => setBranch(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Model / Duty Area</Label>
                    <Select value={modelId} onValueChange={(val) => setModelId(val || 'none')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Division">
                          {modelId === 'none' ? 'Not Assigned' : models.find(m => m.id === modelId) ? formatModelLabel(models.find(m => m.id === modelId)) : 'Not Assigned'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" label="Not Assigned">Not Assigned</SelectItem>
                        {models.map(m => (
                          <SelectItem key={m.id} value={m.id} label={formatModelLabel(m)}>{formatModelLabel(m)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Emergency Contact *</Label>
                    <Input value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Address</Label>
                    <Input value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="space-y-1 md:col-span-4">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Requirements</Label>
                    <div className="flex items-center space-x-2 h-10 px-3 rounded-md border border-input bg-muted/30 hover:bg-muted/50 transition-colors shadow-sm w-full">
                      <Checkbox id="edit-accommodation" checked={accommodation} onCheckedChange={(checked) => setAccommodation(checked as boolean)} />
                      <Label htmlFor="edit-accommodation" className="text-[11px] font-bold uppercase cursor-pointer whitespace-nowrap">Accommodation</Label>
                    </div>
                  </div>
                  <div className="space-y-1 md:col-span-8">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Remarks</Label>
                    <Input value={remarks} onChange={e => setRemarks(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5 p-4 border border-dashed rounded-lg bg-muted/30">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Volunteer Photo</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl} alt="Preview" className="w-16 h-20 object-cover rounded-md border" />
                    )}
                    <Input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                    {uploadingPhoto && <AnimatedLoader className="w-4 h-4" />}
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="bento-white overflow-hidden rounded-[32px] border-ink shadow-hard">
            <div className="p-0">
              {loading ? (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-8 w-[150px]" />
                  </div>
                  <div className="rounded-md border">
                    <div className="border-b px-4 py-3 flex gap-4 bg-muted/40">
                      <Skeleton className="h-4 w-6" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="px-4 py-4 flex items-center gap-4 border-b last:border-0">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <div className="space-y-2 w-48">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                        <div className="space-y-2 w-48 hidden md:block">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                        <Skeleton className="h-8 w-16 ml-auto rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="w-12 py-4 px-4">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                              checked={selectedIds.length === volunteers.length && volunteers.length > 0}
                              onChange={toggleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[120px]">SNK ID</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Photo</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[150px]">Name & Role</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[130px]">Mobile</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[150px]">Model Area</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-right px-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {volunteers.map((vol) => (
                          <TableRow key={vol.id} className="hover:bg-muted/20 transition-colors duration-200">
                            <TableCell className="py-4 px-4">
                              <input 
                                type="checkbox" 
                                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                checked={selectedIds.includes(vol.id)}
                                onChange={() => toggleSelect(vol.id)}
                              />
                            </TableCell>
                            <TableCell className="font-bold text-sm text-primary">{vol.snk_id || 'Pending'}</TableCell>
                            <TableCell>
                              <div className="w-10 h-12 rounded bg-muted overflow-hidden flex items-center justify-center border shadow-sm">
                                {vol.photo_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={vol.photo_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{vol.full_name}</span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block text-[10px] text-muted-foreground">
                                  {vol.role || 'Volunteer'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium text-muted-foreground">{vol.mobile_number}</TableCell>
                            <TableCell className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                              {vol.models ? vol.models.name : <span className="text-xs font-medium text-zinc-400">None Assigned</span>}
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={vol.status} 
                                onValueChange={(val) => handleStatusChange(vol.id, val)}
                              >
                                <SelectTrigger className={`h-8 w-32 border-none font-bold text-xs rounded-full px-3 py-1 ${
                                  vol.status === 'Approved' 
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                    : vol.status === 'Rejected' 
                                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' 
                                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                                }`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="Pending" className="text-xs font-semibold">Pending</SelectItem>
                                  <SelectItem value="Approved" className="text-xs font-semibold">Approved</SelectItem>
                                  <SelectItem value="Rejected" className="text-xs font-semibold">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right px-6">
                              <div className="flex justify-end gap-1.5">
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(vol)} className="hover:bg-primary/10 rounded-xl">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => {
                                    localStorage.setItem('print-volunteer-ids', JSON.stringify([vol.id]))
                                    router.push('/admin/print')
                                  }} 
                                  className="hover:bg-primary/10 text-primary rounded-xl"
                                  title="Print Single Card"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {volunteers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-16">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                  <Users className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <p className="text-muted-foreground font-semibold">No volunteers found</p>
                                <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto">
                                  {searchTerm || filterStatus !== 'all' || filterModel !== 'all' 
                                    ? "Try adjusting your search or filters to find what you're looking for." 
                                    : "There are no volunteers in the system yet."}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination Footer */}
                  {totalCount > 0 && (
                  <div className="border-t border-ink/10 p-4 flex items-center justify-between bg-muted/20">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="font-bold border-ink shadow-hard-xs hover:-translate-y-0.5 transition-transform">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <div className="text-sm font-semibold text-muted-foreground bg-white px-3 py-1 rounded-full border border-ink shadow-hard-xs">
                      Page {page} of {Math.max(1, totalPages)}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="font-bold border-ink shadow-hard-xs hover:-translate-y-0.5 transition-transform">
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="import">
          <div className="grid gap-6 md:grid-cols-2">
            <CSVUpload onUploadSuccess={handleCSVUploadSuccess} />
            <Card className="">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Import CSV Guidelines</CardTitle>
                <CardDescription>Follow these validation checks to avoid parse compilation errors.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>The import engine maps headers dynamically. Download the template below for perfect mapping.</p>
                
                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-lg border border-primary/5 text-xs text-foreground font-semibold">
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Full Name</div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Mobile Number</div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />Gender</div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />Age</div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />Model Name</div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />Emergency Contact</div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />Designation</div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />Team</div>
                </div>
                <div className="text-xs flex items-center gap-2 p-2.5 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-700">
                  <Filter className="w-4 h-4 flex-shrink-0" />
                  <span>The <b>Model Name</b> column automatically assigns volunteers to their respective divisions!</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
