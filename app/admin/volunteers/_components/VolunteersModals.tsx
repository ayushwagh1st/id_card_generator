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
        <DialogContent className="volunteer-editor sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Volunteer Manually</DialogTitle>
            <DialogDescription>SNK IDs are generated automatically. Fields marked * are required.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-4 py-2">
            <fieldset className="volunteer-form-section"><legend>Personal details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="volunteer-name" className="text-[11px] font-bold text-muted-foreground uppercase">Full Name *</Label>
                <Input id="volunteer-name" value={fullName} onChange={e => onFieldChange('fullName', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="volunteer-mobile" className="text-[11px] font-bold text-muted-foreground uppercase">Contact Number *</Label>
                <Input id="volunteer-mobile" type="tel" value={mobileNumber} onChange={e => onFieldChange('mobileNumber', e.target.value.replace(/\D/g, ''))} maxLength={10} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="volunteer-gender" className="text-[11px] font-bold text-muted-foreground uppercase">Gender *</Label>
                <Select value={gender} onValueChange={(val) => onFieldChange('gender', val || 'Male')} required>
                  <SelectTrigger id="volunteer-gender"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="volunteer-age" className="text-[11px] font-bold text-muted-foreground uppercase">Age *</Label>
                <Input id="volunteer-age" type="number" value={age} onChange={e => onFieldChange('age', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="volunteer-role" className="text-[11px] font-bold text-muted-foreground uppercase">Seva/Role</Label>
                <Select value={role} onValueChange={(val) => onFieldChange('role', val || 'Volunteer')}>
                  <SelectTrigger id="volunteer-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Volunteer">Volunteer</SelectItem>
                    <SelectItem value="Model Incharge">Model Incharge</SelectItem>
                    <SelectItem value="Co-ordinator">Co-ordinator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            </fieldset><fieldset className="volunteer-form-section"><legend>Assignment</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="volunteer-branch" className="text-[11px] font-bold text-muted-foreground uppercase">Branch</Label>
                <Input id="volunteer-branch" value={branch} onChange={e => onFieldChange('branch', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="volunteer-model" className="text-[11px] font-bold text-muted-foreground uppercase">Model / Duty Area</Label>
                <Select value={modelId} onValueChange={(val) => onFieldChange('modelId', val || 'none')}>
                  <SelectTrigger id="volunteer-model">
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

            </fieldset><fieldset className="volunteer-form-section"><legend>Emergency contact & address</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="volunteer-emergency" className="text-[11px] font-bold text-muted-foreground uppercase">Emergency Contact *</Label>
                <Input id="volunteer-emergency" type="tel" value={emergencyContact} onChange={e => onFieldChange('emergencyContact', e.target.value.replace(/\D/g, ''))} maxLength={10} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="volunteer-address" className="text-[11px] font-bold text-muted-foreground uppercase">Address</Label>
                <Input id="volunteer-address" value={address} onChange={e => onFieldChange('address', e.target.value)} />
              </div>
            </div>

            </fieldset><fieldset className="volunteer-form-section"><legend>Requirements & notes</legend>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="space-y-1 md:col-span-4">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Requirements</Label>
                <div className="flex items-center space-x-2 h-10 px-3 rounded-md border border-input bg-muted/30 hover:bg-muted/50 transition-colors shadow-sm w-full">
                  <Checkbox id="add-accommodation" checked={accommodation} onCheckedChange={(checked) => onFieldChange('accommodation', checked as boolean)} />
                  <Label htmlFor="add-accommodation" className="text-[11px] font-bold uppercase cursor-pointer whitespace-nowrap">Accommodation</Label>
                </div>
              </div>
              <div className="space-y-1 md:col-span-8">
                <Label htmlFor="volunteer-remarks" className="text-[11px] font-bold text-muted-foreground uppercase">Remarks</Label>
                <Input id="volunteer-remarks" value={remarks} onChange={e => onFieldChange('remarks', e.target.value)} />
              </div>
            </div>

            </fieldset>
            <div className="space-y-2 border-t border-border pt-4">
              <Label htmlFor="volunteer-photo" className="text-[11px] font-bold text-muted-foreground uppercase">Volunteer Photo *</Label>
              <p className="text-sm text-muted-foreground">Choose a clear portrait. You can crop it before saving.</p>
              <div className="flex items-center gap-4 mt-2">
                {photoUrl && (
                  <Image src={photoUrl} alt="Volunteer preview" width={64} height={80} unoptimized className="w-16 h-20 object-cover rounded-md border" />
                )}
                <Input id="volunteer-photo" type="file" accept="image/*" onChange={onPhotoUpload} disabled={uploadingPhoto} />
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
        <DialogContent className="volunteer-editor sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Volunteer Profile</DialogTitle>
            <DialogDescription>Modify fields and upload new assets for this volunteer card.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onUpdate} className="space-y-4 py-2">
            <fieldset className="volunteer-form-section"><legend>Personal details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-volunteer-name" className="text-[11px] font-bold text-muted-foreground uppercase">Full Name *</Label>
                <Input id="edit-volunteer-name" value={fullName} onChange={e => onFieldChange('fullName', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-volunteer-mobile" className="text-[11px] font-bold text-muted-foreground uppercase">Contact Number *</Label>
                <Input id="edit-volunteer-mobile" type="tel" value={mobileNumber} onChange={e => onFieldChange('mobileNumber', e.target.value.replace(/\D/g, ''))} maxLength={10} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-volunteer-gender" className="text-[11px] font-bold text-muted-foreground uppercase">Gender *</Label>
                <Select value={gender} onValueChange={(val) => onFieldChange('gender', val || 'Male')} required>
                  <SelectTrigger id="edit-volunteer-gender"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-volunteer-age" className="text-[11px] font-bold text-muted-foreground uppercase">Age *</Label>
                <Input id="edit-volunteer-age" type="number" value={age} onChange={e => onFieldChange('age', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-volunteer-role" className="text-[11px] font-bold text-muted-foreground uppercase">Seva/Role</Label>
                <Select value={role} onValueChange={(val) => onFieldChange('role', val || 'Volunteer')}>
                  <SelectTrigger id="edit-volunteer-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Volunteer">Volunteer</SelectItem>
                    <SelectItem value="Model Incharge">Model Incharge</SelectItem>
                    <SelectItem value="Co-ordinator">Co-ordinator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            </fieldset><fieldset className="volunteer-form-section"><legend>Assignment</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-volunteer-branch" className="text-[11px] font-bold text-muted-foreground uppercase">Branch</Label>
                <Input id="edit-volunteer-branch" value={branch} onChange={e => onFieldChange('branch', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-volunteer-model" className="text-[11px] font-bold text-muted-foreground uppercase">Model / Duty Area</Label>
                <Select value={modelId} onValueChange={(val) => onFieldChange('modelId', val || 'none')}>
                  <SelectTrigger id="edit-volunteer-model">
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

            </fieldset><fieldset className="volunteer-form-section"><legend>Emergency contact & address</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-volunteer-emergency" className="text-[11px] font-bold text-muted-foreground uppercase">Emergency Contact *</Label>
                <Input id="edit-volunteer-emergency" type="tel" value={emergencyContact} onChange={e => onFieldChange('emergencyContact', e.target.value.replace(/\D/g, ''))} maxLength={10} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-volunteer-address" className="text-[11px] font-bold text-muted-foreground uppercase">Address</Label>
                <Input id="edit-volunteer-address" value={address} onChange={e => onFieldChange('address', e.target.value)} />
              </div>
            </div>

            </fieldset><fieldset className="volunteer-form-section"><legend>Requirements & notes</legend>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="space-y-1 md:col-span-4">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Requirements</Label>
                <div className="flex items-center space-x-2 h-10 px-3 rounded-md border border-input bg-muted/30 hover:bg-muted/50 transition-colors shadow-sm w-full">
                  <Checkbox id="edit-accommodation" checked={accommodation} onCheckedChange={(checked) => onFieldChange('accommodation', checked as boolean)} />
                  <Label htmlFor="edit-accommodation" className="text-[11px] font-bold uppercase cursor-pointer whitespace-nowrap">Accommodation</Label>
                </div>
              </div>
              <div className="space-y-1 md:col-span-8">
                <Label htmlFor="edit-volunteer-remarks" className="text-[11px] font-bold text-muted-foreground uppercase">Remarks</Label>
                <Input id="edit-volunteer-remarks" value={remarks} onChange={e => onFieldChange('remarks', e.target.value)} />
              </div>
            </div>

            </fieldset>
            <div className="space-y-2 border-t border-border pt-4">
              <Label htmlFor="edit-volunteer-photo" className="text-[11px] font-bold text-muted-foreground uppercase">Volunteer Photo *</Label>
              <div className="flex items-center gap-4 mt-2">
                {photoUrl && (
                  <Image src={photoUrl} alt="Volunteer preview" width={64} height={80} unoptimized className="w-16 h-20 object-cover rounded-md border" />
                )}
                <Input id="edit-volunteer-photo" type="file" accept="image/*" onChange={onPhotoUpload} disabled={uploadingPhoto} />
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
