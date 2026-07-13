import Image from 'next/image'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AnimatedLoader } from '@/components/ui/animated-loader'
import ImageCropperDialog from '@/components/volunteers/ImageCropperDialog'
import { formatModelLabel } from '@/lib/formatters'

interface VolunteersModalsProps {
  // Common
  models: any[]
  
  // Add Dialog
  isAddOpen: boolean
  onAddOpenChange: (open: boolean) => void
  onCreate: (e: React.FormEvent) => void

  // Edit Dialog
  isEditOpen: boolean
  onEditOpenChange: (open: boolean) => void
  onUpdate: (e: React.FormEvent) => void

  // Form Fields (passed in from parent/reducer state)
  fullName: string
  mobileNumber: string
  gender: string
  age: string
  emergencyContact: string
  address: string
  modelId: string
  role: string
  branch: string
  accommodation: boolean
  remarks: string
  photoUrl: string
  uploadingPhoto: boolean
  cropDialogOpen: boolean
  cropImageSrc: string

  onFieldChange: (field: string, val: any) => void
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCropComplete: (blob: Blob) => void
}

export function VolunteersModals({
  models,
  isAddOpen,
  onAddOpenChange,
  onCreate,
  isEditOpen,
  onEditOpenChange,
  onUpdate,
  fullName,
  mobileNumber,
  gender,
  age,
  emergencyContact,
  address,
  modelId,
  role,
  branch,
  accommodation,
  remarks,
  photoUrl,
  uploadingPhoto,
  cropDialogOpen,
  cropImageSrc,
  onFieldChange,
  onPhotoUpload,
  onCropComplete,
}: VolunteersModalsProps) {
  return (
    <>
      <ImageCropperDialog
        open={cropDialogOpen}
        onOpenChange={(open) => onFieldChange('cropDialogOpen', open)}
        imageSrc={cropImageSrc}
        onCropComplete={onCropComplete}
      />

      <Dialog open={isAddOpen} onOpenChange={onAddOpenChange}>
        <DialogContent className="sm:max-w-xl rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Volunteer Manually</DialogTitle>
            <DialogDescription>SNK IDs are auto-generated sequentially.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Full Name *</Label>
                <Input value={fullName} onChange={e => onFieldChange('fullName', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Contact Number *</Label>
                <Input value={mobileNumber} onChange={e => onFieldChange('mobileNumber', e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Gender *</Label>
                <Select value={gender} onValueChange={(val) => onFieldChange('gender', val || 'Male')} required>
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
                <Input type="number" value={age} onChange={e => onFieldChange('age', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Seva/Role</Label>
                <Select value={role} onValueChange={(val) => onFieldChange('role', val || 'Volunteer')}>
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
                <Input value={branch} onChange={e => onFieldChange('branch', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Model / Duty Area</Label>
                <Select value={modelId} onValueChange={(val) => onFieldChange('modelId', val || 'none')}>
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
                <Input value={emergencyContact} onChange={e => onFieldChange('emergencyContact', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Address</Label>
                <Input value={address} onChange={e => onFieldChange('address', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="space-y-1 md:col-span-4">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Requirements</Label>
                <div className="flex items-center space-x-2 h-10 px-3 rounded-md border border-input bg-muted/30 hover:bg-muted/50 transition-colors shadow-sm w-full">
                  <Checkbox id="add-accommodation" checked={accommodation} onCheckedChange={(checked) => onFieldChange('accommodation', checked as boolean)} />
                  <Label htmlFor="add-accommodation" className="text-[11px] font-bold uppercase cursor-pointer whitespace-nowrap">Accommodation</Label>
                </div>
              </div>
              <div className="space-y-1 md:col-span-8">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Remarks</Label>
                <Input value={remarks} onChange={e => onFieldChange('remarks', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5 p-4 border border-dashed rounded-lg bg-muted/30">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase">Volunteer Photo *</Label>
              <div className="flex items-center gap-4 mt-2">
                {photoUrl && (
                  <Image src={photoUrl} alt="Volunteer preview" width={64} height={80} unoptimized className="w-16 h-20 object-cover rounded-md border" />
                )}
                <Input type="file" accept="image/*" onChange={onPhotoUpload} disabled={uploadingPhoto} />
                {uploadingPhoto && <AnimatedLoader className="w-4 h-4" />}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onAddOpenChange(false)}>Cancel</Button>
              <Button type="submit">Create Volunteer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={onEditOpenChange}>
        <DialogContent className="sm:max-w-xl rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Volunteer Profile</DialogTitle>
            <DialogDescription>Modify fields and upload new assets for this volunteer card.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onUpdate} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Full Name *</Label>
                <Input value={fullName} onChange={e => onFieldChange('fullName', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Contact Number *</Label>
                <Input value={mobileNumber} onChange={e => onFieldChange('mobileNumber', e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Gender *</Label>
                <Select value={gender} onValueChange={(val) => onFieldChange('gender', val || 'Male')} required>
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
                <Input type="number" value={age} onChange={e => onFieldChange('age', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Seva/Role</Label>
                <Select value={role} onValueChange={(val) => onFieldChange('role', val || 'Volunteer')}>
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
                <Input value={branch} onChange={e => onFieldChange('branch', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Model / Duty Area</Label>
                <Select value={modelId} onValueChange={(val) => onFieldChange('modelId', val || 'none')}>
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
                <Input value={emergencyContact} onChange={e => onFieldChange('emergencyContact', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Address</Label>
                <Input value={address} onChange={e => onFieldChange('address', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="space-y-1 md:col-span-4">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Requirements</Label>
                <div className="flex items-center space-x-2 h-10 px-3 rounded-md border border-input bg-muted/30 hover:bg-muted/50 transition-colors shadow-sm w-full">
                  <Checkbox id="edit-accommodation" checked={accommodation} onCheckedChange={(checked) => onFieldChange('accommodation', checked as boolean)} />
                  <Label htmlFor="edit-accommodation" className="text-[11px] font-bold uppercase cursor-pointer whitespace-nowrap">Accommodation</Label>
                </div>
              </div>
              <div className="space-y-1 md:col-span-8">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Remarks</Label>
                <Input value={remarks} onChange={e => onFieldChange('remarks', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5 p-4 border border-dashed rounded-lg bg-muted/30">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase">Volunteer Photo *</Label>
              <div className="flex items-center gap-4 mt-2">
                {photoUrl && (
                  <Image src={photoUrl} alt="Volunteer preview" width={64} height={80} unoptimized className="w-16 h-20 object-cover rounded-md border" />
                )}
                <Input type="file" accept="image/*" onChange={onPhotoUpload} disabled={uploadingPhoto} />
                {uploadingPhoto && <AnimatedLoader className="w-4 h-4" />}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onEditOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
