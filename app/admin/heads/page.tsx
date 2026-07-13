'use client'

import { useEffect, useReducer } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Shield, Users, Database, Download, Edit, Trash2, KeyRound, Eye, EyeOff } from 'lucide-react'
import { AnimatedLoader } from '@/components/ui/animated-loader'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { createModelHeadAction, updateModelHeadAction, resetModelHeadPasswordAction, deleteModelHeadAction, getHeadsDataAction, getModelsDataAction } from '../models/actions.server'
import Image from 'next/image'
import { HeadsTable } from './_components/HeadsTable'
import { HeadsModals } from './_components/HeadsModals'

export default function HeadsPage() {
  const [state, dispatch] = useReducer(
    (state: any, action: any) => {
      switch (action.type) {
        case 'SET_DATA':
          return { ...state, heads: action.payload.heads, models: action.payload.models, loading: false }
        case 'SET_LOADING':
          return { ...state, loading: action.payload }
        case 'SET_SEARCH_TERM':
          return { ...state, searchTerm: action.payload }
        case 'SET_FORM_FIELD':
          return { ...state, [action.field]: action.value }
        case 'OPEN_ADD':
          return { ...state, isAddHeadOpen: true, headName: '', headEmail: '', headPassword: '' }
        case 'CLOSE_ADD':
          return { ...state, isAddHeadOpen: false }
        case 'OPEN_EDIT':
          return { ...state, isEditHeadOpen: true, currentHead: action.payload, headName: action.payload.full_name, headEmail: action.payload.email }
        case 'CLOSE_EDIT':
          return { ...state, isEditHeadOpen: false, currentHead: null }
        case 'OPEN_RESET':
          return { ...state, isResetPassOpen: true, currentHead: action.payload, headPassword: '' }
        case 'CLOSE_RESET':
          return { ...state, isResetPassOpen: false, currentHead: null }
        case 'OPEN_DELETE':
          return { ...state, isDeleteOpen: true, currentHead: action.payload }
        case 'CLOSE_DELETE':
          return { ...state, isDeleteOpen: false, currentHead: null }
        case 'SET_IS_UPDATING':
          return { ...state, isUpdating: action.payload }
        case 'SET_IS_CREATING':
          return { ...state, isCreatingHead: action.payload }
        case 'TOGGLE_PASSWORD':
          return { ...state, visiblePasswords: { ...state.visiblePasswords, [action.payload]: !state.visiblePasswords[action.payload] } }
        default:
          return state
      }
    },
    {
      heads: [], models: [], searchTerm: '', loading: true,
      isAddHeadOpen: false, headName: '', headEmail: '', headPassword: '', isCreatingHead: false,
      currentHead: null, isEditHeadOpen: false, isResetPassOpen: false, isDeleteOpen: false, isUpdating: false,
      visiblePasswords: {}
    }
  )

  const fetchData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const [profiles, modelsData] = await Promise.all([
        getHeadsDataAction(),
        getModelsDataAction()
      ])
      dispatch({ type: 'SET_DATA', payload: { heads: profiles, models: modelsData } })
    } catch (err: any) {
      toast.error(err.message || 'Error loading model heads')
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateHead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.headName.trim() || !state.headEmail.trim() || !state.headPassword.trim()) {
      return toast.error('All fields are required')
    }

    dispatch({ type: 'SET_IS_CREATING', payload: true })
    try {
      const formData = new FormData()
      formData.append('fullName', state.headName)
      formData.append('email', state.headEmail)
      formData.append('password', state.headPassword)

      const result = await createModelHeadAction(formData)
      if (result?.error) throw new Error(result.error)

      toast.success('Model Head account created successfully!')
      dispatch({ type: 'CLOSE_ADD' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create Model Head account')
    } finally {
      dispatch({ type: 'SET_IS_CREATING', payload: false })
    }
  }

  const handleUpdateHead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.currentHead) return
    dispatch({ type: 'SET_IS_UPDATING', payload: true })
    try {
      const formData = new FormData()
      formData.append('fullName', state.headName)
      formData.append('email', state.headEmail)
      const res = await updateModelHeadAction(state.currentHead.id, formData)
      if (res?.error) throw new Error(res.error)
      toast.success('Updated successfully')
      dispatch({ type: 'CLOSE_EDIT' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      dispatch({ type: 'SET_IS_UPDATING', payload: false })
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.currentHead) return
    dispatch({ type: 'SET_IS_UPDATING', payload: true })
    try {
      const res = await resetModelHeadPasswordAction(state.currentHead.id, state.headPassword)
      if (res?.error) throw new Error(res.error)
      toast.success('Password reset successfully')
      dispatch({ type: 'CLOSE_RESET' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      dispatch({ type: 'SET_IS_UPDATING', payload: false })
    }
  }

  const handleDeleteHead = async () => {
    if (!state.currentHead) return
    dispatch({ type: 'SET_IS_UPDATING', payload: true })
    try {
      const res = await deleteModelHeadAction(state.currentHead.id)
      if (res?.error) throw new Error(res.error)
      toast.success('Deleted successfully')
      dispatch({ type: 'CLOSE_DELETE' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      dispatch({ type: 'SET_IS_UPDATING', payload: false })
    }
  }

  // Helper to get supervised models for a head
  const getSupervisedModelsStr = (headId: string) => {
    const assigned = state.models.reduce((acc: string[], m: any) => {
      if (m.head_id === headId) acc.push(m.name)
      return acc
    }, [])
    return assigned.length > 0 ? assigned.join(', ') : 'None Assigned'
  }

  const handleExportHeads = () => {
    try {
      const headers = ['Full Name', 'Login Email ID', 'Temporary Password', 'Supervised Models', 'Status']
      const rows = state.heads.map((h: any) => [
        `"${h.full_name.replace(/"/g, '""')}"`,
        `"${h.email.replace(/"/g, '""')}"`,
        `"${(h.temp_password || 'N/A').replace(/"/g, '""')}"`,
        `"${getSupervisedModelsStr(h.id).replace(/"/g, '""')}"`,
        state.models.some((m: any) => m.head_id === h.id) ? 'Assigned' : 'Unassigned'
      ])

      const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
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
  const totalHeadsCount = state.heads.length
  const assignedHeadsCount = state.heads.filter((h: any) => state.models.some((m: any) => m.head_id === h.id)).length
  const unassignedHeadsCount = totalHeadsCount - assignedHeadsCount

  // Filter heads based on search term
  const filteredHeads = state.heads.filter((h: any) => {
    const supervised = getSupervisedModelsStr(h.id).toLowerCase()
    return (
      h.full_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      h.email.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      supervised.includes(state.searchTerm.toLowerCase())
    )
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Dynamic Header Banner */}
      <div className="rounded-[24px] bg-gradient-to-r from-[#fcfaff] to-[#f6f4ff] p-8 md:p-12 border border-[#f0ebff] shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ecfdf3] text-[#027a48] text-xs font-semibold tracking-wide uppercase">
            <Users className="w-4 h-4 mr-2" /> Model Heads
          </div>
          <div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight text-slate-900">Supervisor Directory</h1>
            <div className="w-12 h-1 bg-[#8C6DFD] rounded-full mt-4 opacity-80"></div>
          </div>
          <p className="font-sans text-slate-500 text-lg max-w-xl leading-relaxed">
            Register and manage accounts for exhibition supervisors. Assign them to specific models to grant access.
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bento-white flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-150 shadow-hard-sm !p-5 !rounded-2xl">
          <div className="icon-tile icon-tile-pink w-14 h-14 shadow-hard-xs transform rotate-2 overflow-hidden bg-white">
            <Image src="/images/icons/icon_users.png" alt="Users" width={56} height={56} className="object-cover" />
          </div>
          <div className="mt-2">
            <div className="font-display font-bold text-3xl text-ink leading-none">{totalHeadsCount}</div>
            <div className="font-display text-xs font-bold uppercase tracking-wider text-ink/60 mt-1.5">Total Model Heads</div>
          </div>
        </div>

        <div className="bento-white flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-150 shadow-hard-sm !p-5 !rounded-2xl">
          <div className="icon-tile icon-tile-yellow w-14 h-14 shadow-hard-xs transform -rotate-2 overflow-hidden bg-white">
            <Image src="/images/icons/icon_check.png" alt="Active" width={56} height={56} className="object-cover" />
          </div>
          <div className="mt-2">
            <div className="font-display font-bold text-3xl text-ink leading-none">{assignedHeadsCount}</div>
            <div className="font-display text-xs font-bold uppercase tracking-wider text-ink/60 mt-1.5">Active Assignments</div>
          </div>
        </div>

        <div className="bento-white flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-150 shadow-hard-sm !p-5 !rounded-2xl">
          <div className="icon-tile icon-tile-peach w-14 h-14 shadow-hard-xs transform rotate-2 overflow-hidden bg-white">
            <Image src="/images/icons/icon_clock.png" alt="Unassigned" width={56} height={56} className="object-cover" />
          </div>
          <div className="mt-2">
            <div className="font-display font-bold text-3xl text-ink leading-none">{unassignedHeadsCount}</div>
            <div className="font-display text-xs font-bold uppercase tracking-wider text-ink/60 mt-1.5">Unassigned Heads</div>
          </div>
        </div>
      </div>

      {/* Actions & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search name, email, model..."
            className="pl-9"
            value={state.searchTerm}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
          />
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportHeads} 
            disabled={state.heads.length === 0} 
            className="w-full sm:w-auto gap-2"
          >
            <Download className="h-4 w-4" />
            Export Credentials
          </Button>

          <HeadsModals 
            state={state} 
            dispatch={dispatch} 
            handleCreateHead={handleCreateHead}
            handleUpdateHead={handleUpdateHead}
            handleResetPassword={handleResetPassword}
            handleDeleteHead={handleDeleteHead}
          />
        </div>
      </div>

      {/* Directory Table */}
      <HeadsTable 
        state={state} 
        dispatch={dispatch} 
        filteredHeads={filteredHeads} 
        getSupervisedModelsStr={getSupervisedModelsStr} 
      />
    </div>
  )
}
