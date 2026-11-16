'use client'

import React, { useEffect, useState, useCallback, useReducer } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchField } from '@/components/ui/search-field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Edit, Trash2, KeyRound, Download, Eye, EyeOff, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { exportToPDF } from '@/lib/pdf'
import { getLecturersAction, addLecturerAction, updateLecturerAction, deleteLecturerAction, resetLecturerPasswordAction } from '@/server/actions/lecturers'
import Image from 'next/image'
import { Users } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { LecturersTable } from './_components/LecturersTable'
import { LecturersModals } from './_components/LecturersModals'

export default function LecturersPage() {
  const [state, dispatch] = React.useReducer(
    (state: any, action: any) => typeof action === 'function' ? { ...state, ...action(state) } : { ...state, ...action },
    {
      lecturers: [],
      searchTerm: '',
      loading: true,
      isAddOpen: false,
      isEditOpen: false,
      isResetPassOpen: false,
      currentLecturer: null,
      name: '',
      email: '',
      mobile: '',
      password: '',
      status: 'Active',
      visiblePasswords: {}
    }
  )

  const {
    lecturers, searchTerm, loading, isAddOpen, isEditOpen,
    isResetPassOpen, currentLecturer, name, email, mobile,
    password, status, visiblePasswords
  } = state

  const setLecturers = useCallback((v: any) => dispatch((s: any) => ({ lecturers: typeof v === 'function' ? v(s.lecturers) : v })), [])
  const setSearchTerm = useCallback((v: any) => dispatch((s: any) => ({ searchTerm: typeof v === 'function' ? v(s.searchTerm) : v })), [])
  const setLoading = useCallback((v: any) => dispatch((s: any) => ({ loading: typeof v === 'function' ? v(s.loading) : v })), [])
  const setIsAddOpen = useCallback((v: any) => dispatch((s: any) => ({ isAddOpen: typeof v === 'function' ? v(s.isAddOpen) : v })), [])
  const setIsEditOpen = useCallback((v: any) => dispatch((s: any) => ({ isEditOpen: typeof v === 'function' ? v(s.isEditOpen) : v })), [])
  const setIsResetPassOpen = useCallback((v: any) => dispatch((s: any) => ({ isResetPassOpen: typeof v === 'function' ? v(s.isResetPassOpen) : v })), [])
  const setCurrentLecturer = useCallback((v: any) => dispatch((s: any) => ({ currentLecturer: typeof v === 'function' ? v(s.currentLecturer) : v })), [])
  const setName = useCallback((v: any) => dispatch((s: any) => ({ name: typeof v === 'function' ? v(s.name) : v })), [])
  const setEmail = useCallback((v: any) => dispatch((s: any) => ({ email: typeof v === 'function' ? v(s.email) : v })), [])
  const setMobile = useCallback((v: any) => dispatch((s: any) => ({ mobile: typeof v === 'function' ? v(s.mobile) : v })), [])
  const setPassword = useCallback((v: any) => dispatch((s: any) => ({ password: typeof v === 'function' ? v(s.password) : v })), [])
  const setStatus = useCallback((v: any) => dispatch((s: any) => ({ status: typeof v === 'function' ? v(s.status) : v })), [])
  const setVisiblePasswords = useCallback((v: any) => dispatch((s: any) => ({ visiblePasswords: typeof v === 'function' ? v(s.visiblePasswords) : v })), [])

  const togglePassword = (id: string) => {
    setVisiblePasswords({ ...visiblePasswords, [id]: !visiblePasswords[id] })
  }

  const fetchLecturers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getLecturersAction(1, 100, searchTerm, 'all')
      setLecturers(data || [])
    } catch (err: any) {
      toast.error('Error loading security')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, setLoading, setLecturers])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLecturers()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [fetchLecturers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await addLecturerAction({ name, email, mobile, password, status })
      if (res?.error) throw new Error(res.error)
      toast.success('Security added successfully')
      setIsAddOpen(false)
      setName(''); setEmail(''); setMobile(''); setPassword(''); setStatus('Active');
      fetchLecturers()
    } catch (err: any) {
      toast.error(err.message || 'Could not add security')
    }
  }

  const openEdit = (lect: any) => {
    setCurrentLecturer(lect)
    setName(lect.name)
    setEmail(lect.email)
    setMobile(lect.mobile || '')
    setStatus(lect.status || 'Active')
    setIsEditOpen(true)
  }

  const openResetPass = (lect: any) => {
    setCurrentLecturer(lect)
    setPassword('')
    setIsResetPassOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentLecturer) return
    try {
      // For general update, we don't change password here anymore to avoid overwriting with blank
      const res = await updateLecturerAction(currentLecturer.id, { name, email, mobile, password: currentLecturer.password, status })
      if (res?.error) throw new Error(res.error)
      toast.success('Security updated successfully')
      setIsEditOpen(false)
      fetchLecturers()
    } catch (err: any) {
      toast.error(err.message || 'Could not update security')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentLecturer) return
    try {
      const res = await resetLecturerPasswordAction(currentLecturer.id, password)
      if (res?.error) throw new Error(res.error)
      toast.success('Password reset successfully')
      setIsResetPassOpen(false)
      fetchLecturers()
    } catch (err: any) {
      toast.error(err.message || 'Could not reset password')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this security personnel?')) return
    try {
      const res = await deleteLecturerAction(id)
      if (res?.error) throw new Error(res.error)
      toast.success('Security deleted')
      fetchLecturers()
    } catch (err: any) {
      toast.error(err.message || 'Could not delete security')
    }
  }

  const handleExportCredentials = () => {
    try {
      const headers = ['Name', 'Email (Login ID)', 'Password', 'Mobile', 'Status']
      const rows = lecturers.map((l: any) => [
        `"${l.name.replace(/"/g, '""')}"`,
        `"${l.email.replace(/"/g, '""')}"`,
        `"${(l.password || 'N/A').replace(/"/g, '""')}"`,
        `"${(l.mobile || '').replace(/"/g, '""')}"`,
        `"${l.status}"`
      ])

      const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `lecturers_credentials_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Security credentials exported successfully!')
    } catch (err: any) {
      toast.error('Failed to export credentials')
    }
  }

  const handleExportPDF = () => {
    if (lecturers.length === 0) return
    const headers = ['Name', 'Email (Login ID)', 'Mobile', 'Status']
    const rows = lecturers.map((l: any) => [
        l.name,
        l.email,
        l.mobile || 'N/A',
        l.status || 'Active'
    ])
    const activeCount = lecturers.filter((l: any) => l.status === 'Active').length
    const inactiveCount = lecturers.filter((l: any) => l.status === 'Inactive').length

    exportToPDF({
      title: 'Security Directory',
      subtitle: 'Official roster of authorized security personnel and access officers',
      filename: 'Security_Directory.pdf',
      headers,
      data: rows,
      summaryStats: [
        { label: 'Total Personnel', value: lecturers.length },
        { label: 'Active Staff', value: activeCount },
        { label: 'Inactive', value: inactiveCount }
      ]
    })
  }

  const activeLecturers = lecturers.filter((l: any) => l.status === 'Active').length
  const inactiveLecturers = lecturers.filter((l: any) => l.status === 'Inactive').length

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <GlassCard className="p-8 md:p-10 relative overflow-hidden" glowColor="purple">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide uppercase border border-emerald-500/20">
            <Users className="w-4 h-4" /> 
            <span>Security</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Security Management
          </h1>
          <p className="font-sans text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
            Manage security personnel who will conduct sessions and mark attendance.
          </p>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-6" glowColor="blue">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Total Security</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{lecturers.length}</div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" glowColor="cyan">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Active Security</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{activeLecturers}</div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" glowColor="purple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Inactive Security</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{inactiveLecturers}</div>
          </div>
        </GlassCard>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchField id="security-search" label="Search security personnel" className="sm:w-72"
            placeholder="Search name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button onClick={handleExportCredentials} variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4" /> Export PDF
          </Button>
          <LecturersModals
            isAddOpen={isAddOpen} setIsAddOpen={setIsAddOpen}
            isEditOpen={isEditOpen} setIsEditOpen={setIsEditOpen}
            isResetPassOpen={isResetPassOpen} setIsResetPassOpen={setIsResetPassOpen}
            currentLecturer={currentLecturer}
            name={name} setName={setName}
            email={email} setEmail={setEmail}
            mobile={mobile} setMobile={setMobile}
            password={password} setPassword={setPassword}
            status={status} setStatus={setStatus}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            handleResetPassword={handleResetPassword}
          />
        </div>
      </div>

      <LecturersTable
        loading={loading}
        lecturers={lecturers}
        visiblePasswords={visiblePasswords}
        togglePassword={togglePassword}
        openEdit={openEdit}
        openResetPass={openResetPass}
        handleDelete={handleDelete}
      />
    </div>
  )
}
