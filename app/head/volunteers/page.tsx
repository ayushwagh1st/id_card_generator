'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Printer, Trash2, Edit, Plus, Users, Filter, CheckCircle, UploadCloud, Loader2, Download } from 'lucide-react'
import { CSVUpload } from '@/components/volunteers/CSVUpload'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function HeadVolunteersPage() {
  const [volunteers, setVolunteers] = useState<any[]>([])
  const [myModels, setMyModels] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [filterModel, setFilterModel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [currentVolunteer, setCurrentVolunteer] = useState<any>(null)
  
  const [fullName, setFullName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [gender, setGender] = useState('Male')
  const [age, setAge] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [address, setAddress] = useState('')
  const [modelId, setModelId] = useState('')
  const [role, setRole] = useState('Volunteer')
  const [branch, setBranch] = useState('')
  const [remarks, setRemarks] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const supabase = createClient()

  // Fetch logged in head's details and volunteers
  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Get logged in user from supabase auth or cookie
      let profileId = ''
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        profileId = user.id
      } else {
        const sessionUserStr = document.cookie
          .split('; ')
          .find(row => row.startsWith('mock-user='))
          ?.split('=')[1]
        
        if (sessionUserStr) {
          const sessionUser = JSON.parse(decodeURIComponent(sessionUserStr))
          // Look up profile ID by email
          const { data: profile, error: pErr } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', sessionUser.email)
            .single()
          if (!pErr && profile) {
            profileId = profile.id
          }
        }
      }

      if (!profileId) {
        // Fallback to seeded head
        profileId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'
      }

      // 2. Fetch models supervised by this head
      const { data: modelsData, error: modelsErr } = await supabase
        .from('models')
        .select('id, name')
        .eq('head_id', profileId)
      
      if (modelsErr) throw modelsErr
      setMyModels(modelsData || [])

      if (modelsData && modelsData.length > 0) {
        const modelIds = modelsData.map(m => m.id)
        
        // 3. Fetch volunteers in these models
        const { data: volData, error: volErr } = await supabase
          .from('volunteers')
          .select(`
            *,
            models:model_id (
              name
            )
          `)
          .in('model_id', modelIds)
          .order('created_at', { ascending: false })
        
        if (volErr) throw volErr
        setVolunteers(volData || [])

        // Set default model in form if empty
        if (!modelId) {
          setModelId(modelsData[0].id)
        }
      } else {
        setVolunteers([])
      }
    } catch (err: any) {
      toast.error(err.message || 'Error loading records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Create Volunteer
  const handleCreateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return toast.error('Full Name is required')
    if (!mobileNumber.trim()) return toast.error('Mobile Number is required')
    if (!modelId) return toast.error('Please assign to a model')

    try {
      const payload: any = {
        full_name: fullName,
        mobile_number: mobileNumber,
        gender,
        age: age ? parseInt(age) : null,
        emergency_contact: emergencyContact,
        address,
        model_id: modelId,
        role,
        branch,
        remarks,
        photo_url: photoUrl || null,
        status: 'Pending'
      }

      const { error } = await supabase.from('volunteers').insert(payload)
      if (error) throw error

      toast.success('Volunteer added successfully')
      setIsAddOpen(false)
      // Reset
      setFullName(''); setMobileNumber(''); setAge(''); setEmergencyContact(''); setAddress(''); setRemarks(''); setPhotoUrl(''); setBranch(''); setRole('Volunteer');
      
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Could not add volunteer')
    }
  }

  // Edit Prep
  const openEditDialog = (vol: any) => {
    setCurrentVolunteer(vol)
    setFullName(vol.full_name)
    setMobileNumber(vol.mobile_number)
    setGender(vol.gender || 'Male')
    setAge(vol.age ? vol.age.toString() : '')
    setEmergencyContact(vol.emergency_contact || '')
    setAddress(vol.address || '')
    setModelId(vol.model_id)
    setRole(vol.role || 'Volunteer')
    setBranch(vol.branch || '')
    setRemarks(vol.remarks || '')
    setPhotoUrl(vol.photo_url || '')
    setIsEditOpen(true)
  }

  // Update Volunteer
  const handleUpdateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentVolunteer) return

    // Restriction: Cannot edit approved volunteers details
    if (currentVolunteer.status === 'Approved') {
      return toast.error('Approved volunteer details are locked and cannot be edited by Model Heads.')
    }

    try {
      const payload = {
        full_name: fullName,
        mobile_number: mobileNumber,
        gender,
        age: age ? parseInt(age) : null,
        emergency_contact: emergencyContact,
        address,
        model_id: modelId,
        role,
        branch,
        remarks,
        photo_url: photoUrl || null
      }

      const { error } = await supabase
        .from('volunteers')
        .update(payload)
        .eq('id', currentVolunteer.id)

      if (error) throw error

      toast.success('Volunteer profile updated successfully')
      setIsEditOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Could not update volunteer')
    }
  }

  // Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadingPhoto(true)
      try {
        const fileExt = file.name.split('.').pop()
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

  // CSV Import Callback
  const handleCSVUploadSuccess = async (data: any[]) => {
    setLoading(true)
    try {
      if (myModels.length === 0) {
        return toast.error('You are not assigned to supervise any models yet. Upload blocked.')
      }

      // Map models name to IDs
      const modelMap: Record<string, string> = {}
      myModels.forEach(m => {
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
            model_id: matchedModelId || myModels[0].id // default to first supervised model
          })
        }
      })

      if (invalidRows.length > 0) {
        invalidRows.forEach(err => toast.error(err))
        throw new Error('Some rows contain models outside your authority.')
      }

      const { error } = await supabase.from('volunteers').insert(recordsToInsert)
      if (error) throw error

      toast.success(`Successfully imported ${recordsToInsert.length} volunteers into database!`)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Database bulk insert failed')
    } finally {
      setLoading(false)
    }
  }

  // Filtering
  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch = v.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.mobile_number.includes(searchTerm)
    
    const matchesModel = filterModel === 'all' || v.model_id === filterModel
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus

    return matchesSearch && matchesModel && matchesStatus
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-pink-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Supervised Volunteers</h1>
          <p className="text-orange-100 mt-2 text-sm max-w-xl">
            Register and manage volunteers allocated to your supervised Samagam models. Add photo assets and submit for approval.
          </p>
        </div>
      </div>

      {myModels.length === 0 ? (
        <Card className="shadow-lg border-primary/10 bg-card p-12 text-center">
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search & Filters */}
              <div className="flex flex-wrap gap-2.5">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search name, ID, phone..."
                    className="pl-9 bg-card border-primary/10 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Model Filter */}
                <Select value={filterModel} onValueChange={(val) => setFilterModel(val || 'all')}>
                  <SelectTrigger className="w-full sm:w-44 bg-card border-primary/10 rounded-xl">
                    <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All My Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All My Models</SelectItem>
                    {myModels.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || 'all')}>
                  <SelectTrigger className="w-full sm:w-36 bg-card border-primary/10 rounded-xl">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline"
                className="w-full sm:w-auto border-primary/20 hover:bg-primary/5 rounded-xl font-semibold px-5 gap-2"
                onClick={() => {
                  window.location.href = `/api/export?status=${filterStatus}&model=${filterModel}`
                }}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>

              {/* Add Trigger */}
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger render={<Button className="w-full sm:w-auto bg-gradient-to-r from-primary to-orange-600 hover:from-primary/95 text-white font-semibold rounded-xl px-5 gap-2" />}>
                  <Plus className="h-4 w-4" />
                  Add Volunteer
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Register New Volunteer</DialogTitle>
                    <DialogDescription>Input profile details. Approved cards will be generated by the Super Admin.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateVolunteer} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Full Name</Label>
                        <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Mobile Number</Label>
                        <Input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
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
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Role/Duty</Label>
                        <Input value={role} onChange={e => setRole(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Branch</Label>
                        <Input value={branch} onChange={e => setBranch(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Emergency Contact</Label>
                        <Input value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase">Assigned Model</Label>
                        <Select value={modelId} onValueChange={(val) => setModelId(val || '')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose Division" />
                          </SelectTrigger>
                          <SelectContent>
                            {myModels.map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Address</Label>
                      <Input value={address} onChange={e => setAddress(e.target.value)} />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Remarks</Label>
                      <Input value={remarks} onChange={e => setRemarks(e.target.value)} />
                    </div>

                    <div className="space-y-1.5 p-4 border border-dashed rounded-lg bg-muted/30">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Volunteer Photo</Label>
                      <div className="flex items-center gap-4 mt-2">
                        {photoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photoUrl} alt="Preview" className="w-16 h-20 object-cover rounded-md border" />
                        )}
                        <Input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                        {uploadingPhoto && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      </div>
                    </div>

                    <DialogFooter className="pt-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                      <Button type="submit">Submit Volunteer</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Edit Volunteer Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Edit Volunteer Details</DialogTitle>
                  <DialogDescription>Modify fields and save changes. Cards already approved are locked from head edits.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateVolunteer} className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Full Name</Label>
                      <Input value={fullName} onChange={e => setFullName(e.target.value)} required disabled={currentVolunteer?.status === 'Approved'} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Mobile Number</Label>
                      <Input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required disabled={currentVolunteer?.status === 'Approved'} />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Gender</Label>
                      <Select value={gender} onValueChange={(val) => setGender(val || 'Male')} disabled={currentVolunteer?.status === 'Approved'}>
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
                      <Input type="number" value={age} onChange={e => setAge(e.target.value)} disabled={currentVolunteer?.status === 'Approved'} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Role/Duty</Label>
                      <Input value={role} onChange={e => setRole(e.target.value)} disabled={currentVolunteer?.status === 'Approved'} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Branch</Label>
                      <Input value={branch} onChange={e => setBranch(e.target.value)} disabled={currentVolunteer?.status === 'Approved'} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Emergency Contact</Label>
                      <Input value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} disabled={currentVolunteer?.status === 'Approved'} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Assigned Model</Label>
                      <Select value={modelId} onValueChange={(val) => setModelId(val || '')} disabled={currentVolunteer?.status === 'Approved'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose Division" />
                        </SelectTrigger>
                        <SelectContent>
                          {myModels.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Address</Label>
                    <Input value={address} onChange={e => setAddress(e.target.value)} disabled={currentVolunteer?.status === 'Approved'} />
                  </div>

                  <div className="space-y-1.5 p-4 border border-dashed rounded-lg bg-muted/30">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">Volunteer Photo</Label>
                    <div className="flex items-center gap-4 mt-2">
                      {photoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoUrl} alt="Preview" className="w-16 h-20 object-cover rounded-md border" />
                      )}
                      <Input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto || currentVolunteer?.status === 'Approved'} />
                      {uploadingPhoto && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    </div>
                  </div>

                  {currentVolunteer?.status === 'Approved' && (
                    <p className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/15 p-2 rounded border border-amber-100">
                      ⚠️ Profile is approved and locked. Contact the Super Admin to request edits.
                    </p>
                  )}

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={currentVolunteer?.status === 'Approved'}>Save Changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* List */}
            <Card className="shadow-lg border-primary/10 overflow-hidden backdrop-blur-md bg-card">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm font-semibold">Retrieving volunteers list...</p>
                  </div>
                ) : volunteers.length === 0 ? (
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
                      {filteredVolunteers.map((vol) => (
                        <TableRow key={vol.id} className="hover:bg-muted/20 transition-colors duration-200">
                          <TableCell className="font-bold text-sm text-primary py-4 px-6">{vol.id}</TableCell>
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
                              <span className="text-xs text-muted-foreground font-medium">{vol.role || 'Volunteer'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-muted-foreground">{vol.mobile_number}</TableCell>
                          <TableCell className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{vol.models?.name}</TableCell>
                          <TableCell>
                            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${
                              vol.status === 'Approved' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : vol.status === 'Rejected' 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {vol.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right px-6">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(vol)} className="hover:bg-primary/10 rounded-xl">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredVolunteers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm font-semibold">
                            No volunteers match the filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <div className="grid gap-6 md:grid-cols-2">
              <CSVUpload onUploadSuccess={handleCSVUploadSuccess} />
              <Card className="shadow-lg border-primary/10">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">CSV Import Rules for Heads</CardTitle>
                  <CardDescription>System access validation parameters.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>You can import multiple volunteer entries directly under your supervised models:</p>
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-amber-700 text-xs font-semibold leading-relaxed">
                    ⚠️ CRITICAL RULE: The <b>Model Name</b> column in your CSV file must match one of your assigned models:
                    <ul className="list-disc pl-5 mt-1 text-amber-900">
                      {myModels.map(m => <li key={m.id}>{m.name}</li>)}
                    </ul>
                    Any rows matching other models will block the upload.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
