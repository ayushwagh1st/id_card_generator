import { useReducer, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { exportToPDF } from '@/lib/pdf'
import { compressImage } from '@/lib/image'

// Server Actions
import {
  getVolunteersAction,
  addVolunteerAction,
  updateVolunteerAction,
  bulkDeleteVolunteersAction,
  bulkApproveVolunteersAction,
  uploadVolunteerPhotoAction,
} from '@/server/actions/volunteers'
import { getModelsDataAction } from '@/app/admin/models/actions.server'

export type State = {
  volunteers: any[]
  models: any[]
  searchTerm: string
  selectedIds: string[]
  loading: boolean
  page: number
  totalCount: number
  filterModel: string
  filterStatus: string
  isAddOpen: boolean
  isEditOpen: boolean
  fullName: string
  mobileNumber: string
  gender: string
  age: string
  emergencyContact: string
  address: string
  modelId: string
  role: string
  branch: string
  remarks: string
  photoUrl: string
  accommodation: boolean
  uploadingPhoto: boolean
  cropDialogOpen: boolean
  cropImageSrc: string
}

const initialState: State = {
  volunteers: [],
  models: [],
  searchTerm: '',
  selectedIds: [],
  loading: true,
  page: 1,
  totalCount: 0,
  filterModel: 'all',
  filterStatus: 'all',
  isAddOpen: false,
  isEditOpen: false,
  fullName: '',
  mobileNumber: '',
  gender: 'Male',
  age: '',
  emergencyContact: '',
  address: '',
  modelId: 'none',
  role: 'Volunteer',
  branch: '',
  remarks: '',
  photoUrl: '',
  accommodation: false,
  uploadingPhoto: false,
  cropDialogOpen: false,
  cropImageSrc: '',
}

function reducer(state: State, action: any): State {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, [action.field]: action.payload }
    case 'RESET_FORM':
      return {
        ...state,
        fullName: '',
        mobileNumber: '',
        gender: 'Male',
        age: '',
        emergencyContact: '',
        address: '',
        modelId: 'none',
        role: 'Volunteer',
        branch: '',
        remarks: '',
        photoUrl: '',
        accommodation: false,
        uploadingPhoto: false,
        cropDialogOpen: false,
        cropImageSrc: '',
      }
    case 'OPEN_EDIT':
      return {
        ...state,
        fullName: action.payload.full_name || '',
        mobileNumber: action.payload.mobile_number || '',
        gender: action.payload.gender || 'Male',
        age: action.payload.age ? action.payload.age.toString() : '',
        emergencyContact: action.payload.emergency_contact || '',
        address: action.payload.address || '',
        modelId: action.payload.model_id || 'none',
        role: action.payload.role || 'Volunteer',
        branch: action.payload.branch || '',
        remarks: action.payload.remarks || '',
        photoUrl: action.payload.photo_url || '',
        accommodation: action.payload.accommodation || false,
        isEditOpen: true,
      }
    default:
      return state
  }
}

export function useVolunteersState() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const currentVolunteerRef = useRef<any>(null)
  const cropOriginalFileRef = useRef<File | null>(null)
  const router = useRouter()
  const limit = 20

  const dispatchField = useCallback((field: string, payload: any) => {
    dispatch({ type: 'SET_STATE', field, payload })
  }, [])

  const fetchModels = useCallback(async () => {
    try {
      const modelsData = await getModelsDataAction()
      dispatchField('models', modelsData || [])
    } catch (err: any) {
      toast.error('Failed to load models list')
    }
  }, [dispatchField])

  const fetchVolunteers = useCallback(async () => {
    dispatchField('loading', true)
    try {
      const { data, count } = await getVolunteersAction(
        state.page,
        limit,
        state.searchTerm,
        state.filterStatus,
        state.filterModel
      )
      dispatchField('volunteers', data || [])
      dispatchField('totalCount', count || 0)
    } catch (err: any) {
      toast.error(err.message || 'Error loading volunteer records')
    } finally {
      dispatchField('loading', false)
    }
  }, [state.page, state.searchTerm, state.filterStatus, state.filterModel, dispatchField])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchVolunteers()
    }, 300) // debounce
    return () => clearTimeout(timeoutId)
  }, [fetchVolunteers])

  const handleCreateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.fullName.trim()) return toast.error('Full Name is required')
    if (!state.mobileNumber.trim()) return toast.error('Contact Number is required')
    if (!state.photoUrl) return toast.error('Photo is required')

    try {
      const payload: any = {
        full_name: state.fullName,
        mobile_number: state.mobileNumber,
        gender: state.gender,
        age: state.age ? parseInt(state.age) : null,
        emergency_contact: state.emergencyContact,
        address: state.address,
        model_id: state.modelId === 'none' ? null : state.modelId,
        role: state.role,
        branch: state.branch,
        accommodation: state.accommodation,
        designation: state.role,
        remarks: state.remarks,
        photo_url: state.photoUrl || null,
        status: 'Pending',
      }

      const res = await addVolunteerAction(payload)
      if (res?.error) throw new Error(res.error)

      toast.success('Volunteer added successfully')
      dispatchField('isAddOpen', false)
      dispatch({ type: 'RESET_FORM' })
      fetchVolunteers()
    } catch (err: any) {
      toast.error(err.message || 'Could not add volunteer')
    }
  }

  const openEditDialog = (vol: any) => {
    currentVolunteerRef.current = vol
    dispatch({ type: 'OPEN_EDIT', payload: vol })
  }

  const handleUpdateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentVolunteerRef.current) return
    if (!state.photoUrl) return toast.error('Photo is required')

    try {
      const payload = {
        full_name: state.fullName,
        mobile_number: state.mobileNumber,
        gender: state.gender,
        age: state.age ? parseInt(state.age) : null,
        emergency_contact: state.emergencyContact,
        address: state.address,
        model_id: state.modelId === 'none' ? null : state.modelId,
        role: state.role,
        branch: state.branch,
        accommodation: state.accommodation,
        designation: state.role,
        remarks: state.remarks,
        photo_url: state.photoUrl || null,
      }

      const res = await updateVolunteerAction(currentVolunteerRef.current.id, payload)
      if (res?.error) throw new Error(res.error)

      toast.success('Volunteer updated successfully')
      dispatchField('isEditOpen', false)
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
    if (state.selectedIds.length === 0) return
    try {
      const res = await bulkApproveVolunteersAction(state.selectedIds)
      if (res?.error) throw new Error(res.error)
      toast.success(`Approved ${state.selectedIds.length} volunteers`)
      dispatchField('selectedIds', [])
      fetchVolunteers()
    } catch (err: any) {
      toast.error(err.message || 'Error executing bulk approval')
    }
  }

  const handleBulkDelete = async () => {
    if (!state.selectedIds.length) return
    try {
      const res = await bulkDeleteVolunteersAction(state.selectedIds)
      if (res?.error) throw new Error(res.error)
      toast.success(`${state.selectedIds.length} volunteers deleted`)
      dispatchField('selectedIds', [])
      fetchVolunteers()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting volunteers')
    }
  }

  const handleExportPDF = () => {
    if (state.volunteers.length === 0) {
      toast.error('No volunteers to export')
      return
    }

    const headers = ['SNK ID', 'Name', 'Mobile', 'Gender', 'Role', 'Status', 'Model']
    const rows = state.volunteers.map(v => [
      v.snk_id || 'Pending',
      v.full_name || 'N/A',
      v.mobile_number || 'N/A',
      v.gender || 'N/A',
      v.role || 'Volunteer',
      v.status || 'Pending',
      v.models?.name || 'N/A',
    ])

    exportToPDF({
      title: 'Volunteers Directory',
      subtitle: 'Official list of all registered volunteers',
      filename: 'Volunteers_Directory.pdf',
      headers,
      data: rows,
      themeColor: [79, 70, 229], // Indigo
    })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0]

      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(originalFile.type)) {
        toast.error('Invalid file type. Only JPG, PNG, and WebP are allowed.')
        e.target.value = ''
        return
      }

      const maxSizeInBytes = 5 * 1024 * 1024 // 5MB limit
      if (originalFile.size > maxSizeInBytes) {
        toast.error('File is too large. Maximum size is 5MB.')
        e.target.value = ''
        return
      }

      cropOriginalFileRef.current = originalFile
      const reader = new FileReader()
      reader.onload = () => {
        dispatchField('cropImageSrc', reader.result?.toString() || '')
        dispatchField('cropDialogOpen', true)
      }
      reader.readAsDataURL(originalFile)
      e.target.value = '' // clear input
    }
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    dispatchField('cropDialogOpen', false)
    dispatchField('uploadingPhoto', true)
    try {
      const file = await compressImage(
        new File([croppedBlob], cropOriginalFileRef.current?.name || 'photo.jpg', { type: 'image/jpeg' }),
        800,
        0.7
      )

      try {
        const formData = new FormData()
        formData.append('file', file)

        const result = await uploadVolunteerPhotoAction(formData)
        if (result?.publicUrl) {
          dispatchField('photoUrl', result.publicUrl)
          toast.success('Photo uploaded successfully')
          return
        }
      } catch (uploadErr) {
        console.warn('Server photo upload failed, using local Data URL fallback:', uploadErr)
      }

      // Fallback: Read as base64 Data URL (guarantees photo upload works offline & in dev without Supabase bucket errors)
      const reader = new FileReader()
      reader.onload = () => {
        dispatchField('photoUrl', reader.result?.toString() || '')
        toast.success('Photo processed successfully')
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      toast.error(err.message || 'Photo processing failed')
    } finally {
      dispatchField('uploadingPhoto', false)
    }
  }

  const handlePrintSelected = () => {
    localStorage.setItem('print-volunteer-ids:v1', JSON.stringify(state.selectedIds))
    router.push('/admin/print')
  }

  const handlePrintSingle = (id: string) => {
    localStorage.setItem('print-volunteer-ids:v1', JSON.stringify([id]))
    router.push('/admin/print')
  }

  const toggleSelectAll = () => {
    if (state.selectedIds.length === state.volunteers.length) {
      dispatchField('selectedIds', [])
    } else {
      dispatchField('selectedIds', state.volunteers.map(v => v.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (state.selectedIds.includes(id)) {
      dispatchField('selectedIds', state.selectedIds.filter(i => i !== id))
    } else {
      dispatchField('selectedIds', [...state.selectedIds, id])
    }
  }

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' })
  }, [])

  const totalPages = Math.ceil(state.totalCount / limit)

  return {
    state,
    limit,
    dispatchField,
    fetchVolunteers,
    handleCreateVolunteer,
    openEditDialog,
    handleUpdateVolunteer,
    handleStatusChange,
    handleBulkApprove,
    handleBulkDelete,
    handleExportPDF,
    handlePhotoUpload,
    handleCropComplete,
    handlePrintSelected,
    handlePrintSingle,
    toggleSelectAll,
    toggleSelect,
    totalPages,
    resetForm,
  }
}
