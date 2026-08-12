'use client'

import React, { useEffect, useState, useCallback, useReducer } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Trash2, Users, ChevronLeft, ChevronRight, CheckSquare, User } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { getSessionsAction, getSessionEnrollmentsAction, enrollVolunteersAction, removeEnrollmentAction } from '@/server/actions/sessions'
import { getVolunteersAction } from '@/server/actions/volunteers'
import { getModelsDataAction } from '@/app/admin/models/actions.server'
import { formatSessionLabel, formatModelLabel, formatVolunteerLabel } from '@/lib/formatters'
import { GlassCard } from '@/components/ui/GlassCard'

export default function SessionEnrollmentPage() {
  const [state, dispatch] = React.useReducer(
    (state: any, action: any) => typeof action === 'function' ? { ...state, ...action(state) } : { ...state, ...action },
    {
      sessions: [],
      selectedSessionId: 'none',
      enrollments: [],
      loading: true,
      volunteers: [],
      searchVol: '',
      modelFilter: 'all',
      models: [],
      page: 1,
      totalPages: 1,
      totalCount: 0,
      loadingVols: false,
      selectedVolunteers: []
    }
  )

  const {
    sessions, selectedSessionId, enrollments, loading,
    volunteers, searchVol, modelFilter, models,
    page, totalPages, totalCount, loadingVols, selectedVolunteers
  } = state

  const setSessions = useCallback((v: any) => dispatch((s: any) => ({ sessions: typeof v === 'function' ? v(s.sessions) : v })), [])
  const setSelectedSessionId = useCallback((v: any) => dispatch((s: any) => ({ selectedSessionId: typeof v === 'function' ? v(s.selectedSessionId) : v })), [])
  const setEnrollments = useCallback((v: any) => dispatch((s: any) => ({ enrollments: typeof v === 'function' ? v(s.enrollments) : v })), [])
  const setLoading = useCallback((v: any) => dispatch((s: any) => ({ loading: typeof v === 'function' ? v(s.loading) : v })), [])
  const setVolunteers = useCallback((v: any) => dispatch((s: any) => ({ volunteers: typeof v === 'function' ? v(s.volunteers) : v })), [])
  const setSearchVol = useCallback((v: any) => dispatch((s: any) => ({ searchVol: typeof v === 'function' ? v(s.searchVol) : v })), [])
  const setModelFilter = useCallback((v: any) => dispatch((s: any) => ({ modelFilter: typeof v === 'function' ? v(s.modelFilter) : v })), [])
  const setModels = useCallback((v: any) => dispatch((s: any) => ({ models: typeof v === 'function' ? v(s.models) : v })), [])
  const setPage = useCallback((v: any) => dispatch((s: any) => ({ page: typeof v === 'function' ? v(s.page) : v })), [])
  const setTotalPages = useCallback((v: any) => dispatch((s: any) => ({ totalPages: typeof v === 'function' ? v(s.totalPages) : v })), [])
  const setTotalCount = useCallback((v: any) => dispatch((s: any) => ({ totalCount: typeof v === 'function' ? v(s.totalCount) : v })), [])
  const setLoadingVols = useCallback((v: any) => dispatch((s: any) => ({ loadingVols: typeof v === 'function' ? v(s.loadingVols) : v })), [])
  // set selected volunteers has to correctly emulate the prev => function
  const setSelectedVolunteers = useCallback((v: any) => dispatch((s: any) => ({ selectedVolunteers: typeof v === 'function' ? v(s.selectedVolunteers) : v })), [])

  const limit = 20

  const fetchSessions = useCallback(async () => {
    try {
      const res = await getSessionsAction(1, 100, '', 'all', 'all')
      setSessions(res.data || [])
    } catch (err: any) {
      toast.error('Failed to load sessions')
    }
  }, [setSessions])

  const fetchModels = useCallback(async () => {
    try {
      const data = await getModelsDataAction()
      setModels(data || [])
    } catch (err: any) {
      console.error('Failed to load models')
    }
  }, [setModels])

  const fetchEnrollments = useCallback(async () => {
    if (selectedSessionId === 'none') {
        setEnrollments([])
        return
    }
    setLoading(true)
    try {
      const res = await getSessionEnrollmentsAction(selectedSessionId)
      setEnrollments(res.data || [])
    } catch (err: any) {
      toast.error('Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }, [selectedSessionId, setEnrollments, setLoading])

  const searchVolunteers = useCallback(async () => {
    if (selectedSessionId === 'none') return
    
    setLoadingVols(true)
    try {
      // Get all approved volunteers matching search and model filter
      const res = await getVolunteersAction(page, limit, searchVol, 'Approved', modelFilter)
      
      // Filter out already enrolled from the current page
      const enrolledIds = enrollments.map((e: any) => e.volunteer?.id)
      const enrolledSet = new Set(enrolledIds)
      const filtered = (res.data || []).filter((v: any) => !enrolledSet.has(v.id))
      
      setVolunteers(filtered)
      setTotalCount(res.count || 0)
      setTotalPages(Math.ceil((res.count || 0) / limit))
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoadingVols(false)
    }
  }, [searchVol, modelFilter, page, enrollments, selectedSessionId, setLoadingVols, setVolunteers, setTotalCount, setTotalPages])

  useEffect(() => {
    fetchSessions()
    fetchModels()
  }, [fetchSessions, fetchModels])

  useEffect(() => {
    fetchEnrollments()
    setPage(1)
    setSearchVol('')
    setModelFilter('all')
    setSelectedVolunteers([])
  }, [fetchEnrollments, setPage, setSearchVol, setModelFilter, setSelectedVolunteers])

  useEffect(() => {
    const timeout = setTimeout(() => {
        searchVolunteers()
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchVolunteers])

  const handleToggleVolunteer = (id: string) => {
    setSelectedVolunteers((prev: any) => 
      prev.includes(id) ? prev.filter((vId: any) => vId !== id) : [...prev, id]
    )
  }

  const handleSelectAllVisible = () => {
    const visibleIds = volunteers.map((v: any) => v.id)
    const selectedSet = new Set(selectedVolunteers)
    const allSelected = visibleIds.every((id: any) => selectedSet.has(id))
    
    if (allSelected) {
      // Deselect all visible
      const visibleSet = new Set(visibleIds)
      setSelectedVolunteers((prev: any) => prev.filter((id: any) => !visibleSet.has(id)))
    } else {
      // Select all visible
      setSelectedVolunteers((prev: any) => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const handleBulkEnroll = async () => {
    if (selectedSessionId === 'none' || selectedVolunteers.length === 0) return
    
    try {
        const res = await enrollVolunteersAction(selectedSessionId, selectedVolunteers)
        if (res?.error) throw new Error(res.error)
        toast.success(`Successfully enrolled ${selectedVolunteers.length} volunteer(s)`)
        setSelectedVolunteers([])
        fetchEnrollments() // This will also trigger searchVolunteers to refresh the list
    } catch (err: any) {
        toast.error(err.message || 'Failed to enroll volunteers')
    }
  }

  const handleRemove = async (enrollmentId: string) => {
    try {
        const res = await removeEnrollmentAction(enrollmentId)
        if (res?.error) throw new Error(res.error)
        toast.success('Volunteer removed from session')
        fetchEnrollments()
    } catch (err: any) {
        toast.error(err.message || 'Failed to remove')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <GlassCard className="p-8 md:p-10 relative overflow-hidden" glowColor="rose">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide uppercase border border-emerald-500/20">
            <Users className="w-4 h-4" /> 
            <span>Enrollment</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Session Enrollment
          </h1>
          <p className="font-sans text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
            Assign volunteers to sessions to enable attendance tracking.
          </p>
        </div>
      </GlassCard>

      <GlassCard className="p-6" glowColor="blue">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Label className="font-semibold text-xs uppercase tracking-wider text-slate-400 shrink-0">Select Session:</Label>
          <Select value={selectedSessionId} onValueChange={(val: any) => setSelectedSessionId(val)}>
            <SelectTrigger className="w-full sm:w-[400px]">
              <span data-slot="select-value" className="flex flex-1 text-left truncate">
                {selectedSessionId !== 'none' && sessions.length > 0
                  ? formatSessionLabel(sessions.find((s: any) => s.id === selectedSessionId))
                  : "Choose a session"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- Select a Session --</SelectItem>
              {sessions.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{formatSessionLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {selectedSessionId !== 'none' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Panel: Available Volunteers */}
          <div className="md:col-span-5 flex flex-col">
            <GlassCard className="flex flex-col h-[720px] p-0 overflow-hidden" glowColor="cyan">
              <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Add Volunteers
                  </CardTitle>
                  {selectedVolunteers.length > 0 && (
                    <span className="bg-blue-600 text-white text-[11px] font-semibold font-mono px-2.5 py-0.5 rounded-full shadow-sm">
                      {selectedVolunteers.length} Selected
                    </span>
                  )}
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Select volunteers to assign to this duty session.
                </CardDescription>

                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search name, SNK ID..." 
                      className="pl-9 text-xs sm:text-sm h-9"
                      value={searchVol}
                      onChange={e => setSearchVol(e.target.value)}
                    />
                  </div>
                  <Select value={modelFilter} onValueChange={(val: any) => setModelFilter(val)}>
                    <SelectTrigger className="h-9 text-xs sm:text-sm">
                      <span data-slot="select-value" className="flex flex-1 text-left truncate">
                        {modelFilter !== 'all' && models.length > 0
                          ? formatModelLabel(models.find((m: any) => m.id === modelFilter))
                          : "All Models"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Models</SelectItem>
                      {models.map((m: any) => (
                        <SelectItem key={m.id} value={m.id} label={formatModelLabel(m)}>{formatModelLabel(m)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center justify-between pt-1">
                    <Button variant="ghost" size="sm" onClick={handleSelectAllVisible} className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                      {(() => {
                        const selectedSet = new Set(selectedVolunteers)
                        return volunteers.length > 0 && volunteers.every((v: any) => selectedSet.has(v.id)) 
                          ? "Deselect All" 
                          : "Select All Visible"
                      })()}
                    </Button>

                    <Button 
                      size="sm" 
                      onClick={handleBulkEnroll} 
                      disabled={selectedVolunteers.length === 0}
                      className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                    >
                      Enroll Selected
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
                {loadingVols ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      const selectedSet = new Set(selectedVolunteers)
                      return volunteers.map((v: any) => (
                        <label 
                          key={v.id} 
                          htmlFor={`checkbox-${v.id}`}
                          className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                            selectedSet.has(v.id) 
                              ? 'border-blue-500/60 bg-blue-500/10 dark:bg-blue-500/20 shadow-sm' 
                              : 'border-slate-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <Checkbox 
                            id={`checkbox-${v.id}`}
                            checked={selectedSet.has(v.id)} 
                            onCheckedChange={() => handleToggleVolunteer(v.id)}
                          />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {formatVolunteerLabel(v)}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              {v.models?.name ? formatModelLabel(v.models) : 'No Model Assigned'}
                            </span>
                          </div>
                        </label>
                      ))
                    })()}
                    {!loadingVols && volunteers.length === 0 && (
                      <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                        <Users className="h-10 w-10 mb-2 opacity-30 text-blue-500" />
                        <p className="text-xs sm:text-sm font-medium">No available volunteers found.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>

              <div className="p-3.5 px-5 flex justify-between items-center border-t border-slate-200/60 dark:border-slate-800/80 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage((p: any) => Math.max(1, p - 1))}
                  className="h-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold font-mono">
                  Page {page} of {Math.max(1, totalPages)}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page >= totalPages}
                  onClick={() => setPage((p: any) => p + 1)}
                  className="h-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </GlassCard>
          </div>

          {/* Right Panel: Enrolled Volunteers List */}
          <div className="md:col-span-7 flex flex-col">
            <GlassCard className="h-[720px] flex flex-col p-0 overflow-hidden" glowColor="purple">
              <CardHeader className="p-5 sm:p-6 pb-4 flex flex-row items-center justify-between shrink-0 border-b border-slate-200/60 dark:border-slate-800/80">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Enrolled Volunteers
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Total Enrolled: {enrollments.length}
                  </CardDescription>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <Users className="w-5 h-5" />
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1 overflow-auto">
                {loading ? (
                  <div className="p-4 space-y-4">
                    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
                      <div className="border-b px-4 py-3 flex gap-4 bg-muted/40">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </div>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="px-4 py-4 flex items-center gap-4 border-b last:border-0">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-8 w-8 rounded-lg ml-auto" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/80 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-14">Photo</TableHead>
                        <TableHead className="w-36">SNK ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right w-20">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map((e: any) => (
                        <TableRow key={e.id} className="hover:bg-blue-500/5 transition-colors">
                          <TableCell>
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                              {e.volunteer?.photo_url ? (
                                <Image src={e.volunteer.photo_url} alt={`${e.volunteer.full_name || 'Volunteer'}'s avatar`} width={32} height={32} unoptimized className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {e.volunteer?.snk_id || 'Pending'}
                          </TableCell>
                          <TableCell className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {e.volunteer?.full_name}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon-sm" 
                              onClick={() => handleRemove(e.id)} 
                              className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              aria-label="Remove enrollment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!loading && enrollments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-20 text-slate-400">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-25 text-blue-500" />
                            <p className="text-sm font-medium">No volunteers enrolled yet.</p>
                            <p className="text-xs text-slate-400 mt-1">Select volunteers on the left panel to enroll them.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  )
}
