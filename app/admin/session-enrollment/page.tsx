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
import { Search, Trash2, Users, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { getSessionsAction, getSessionEnrollmentsAction, enrollVolunteersAction, removeEnrollmentAction } from '@/server/actions/sessions'
import { getVolunteersAction } from '@/server/actions/volunteers'
import { getModelsDataAction } from '@/app/admin/models/actions.server'
import { formatSessionLabel, formatModelLabel, formatVolunteerLabel } from '@/lib/formatters'

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
      const filtered = (res.data || []).filter((v: any) => !enrolledIds.includes(v.id))
      
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
    const allSelected = visibleIds.every((id: any) => selectedVolunteers.includes(id))
    
    if (allSelected) {
      // Deselect all visible
      setSelectedVolunteers((prev: any) => prev.filter((id: any) => !visibleIds.includes(id)))
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
      <div className="rounded-[24px] bg-gradient-to-r from-[#fcfaff] to-[#f6f4ff] p-8 md:p-12 border border-[#f0ebff] shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ecfdf3] text-[#027a48] text-xs font-semibold tracking-wide uppercase">
            <Users className="w-4 h-4 mr-2" /> Enrollment
          </div>
          <div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight text-slate-900">Session Enrollment</h1>
            <div className="w-12 h-1 bg-[#8C6DFD] rounded-full mt-4 opacity-80"></div>
          </div>
          <p className="font-sans text-slate-500 text-lg max-w-xl leading-relaxed">
            Assign volunteers to sessions to enable attendance tracking.
          </p>
        </div>
      </div>

      <div className="bento-white flex flex-col sm:flex-row gap-4 items-center">
        <Label className="font-bold whitespace-nowrap">Select Session:</Label>
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
                <SelectItem key={s.id} value={s.id} label={formatSessionLabel(s)}>{formatSessionLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSessionId !== 'none' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-4">
                  <div className="bento-white flex flex-col h-[700px] !p-0">
                      <CardHeader className="pb-3 border-b border-ink/10 bg-muted/20">
                          <CardTitle className="text-lg flex justify-between items-center">
                            <span>Add Volunteers</span>
                            {selectedVolunteers.length > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                                    {selectedVolunteers.length} Selected
                                </span>
                            )}
                          </CardTitle>
                          <CardDescription>Select volunteers to assign.</CardDescription>
                          
                          <div className="flex flex-col gap-3 mt-2">
                              <div className="relative">
                                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    placeholder="Search name, SNK ID..." 
                                    className="pl-9"
                                    value={searchVol}
                                    onChange={e => setSearchVol(e.target.value)}
                                  />
                              </div>
                              <Select value={modelFilter} onValueChange={(val: any) => setModelFilter(val)}>
                                  <SelectTrigger>
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
                              
                              <div className="flex items-center justify-between pt-2">
                                  <Button variant="ghost" size="sm" onClick={handleSelectAllVisible} className="h-8 px-2 text-xs">
                                      <CheckSquare className="w-4 h-4 mr-2" />
                                      {volunteers.length > 0 && volunteers.every((v: any) => selectedVolunteers.includes(v.id)) 
                                        ? "Deselect All Visible" 
                                        : "Select All Visible"}
                                  </Button>
                                  
                                  <Button 
                                    size="sm" 
                                    onClick={handleBulkEnroll} 
                                    disabled={selectedVolunteers.length === 0}
                                    className="h-8"
                                  >
                                      Enroll Selected
                                  </Button>
                              </div>
                          </div>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-y-auto p-4">
                          {loadingVols ? (
                              <div className="space-y-3">
                                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                              </div>
                          ) : (
                              <div className="space-y-2">
                                  {volunteers.map((v: any) => (
                                      <label 
                                        key={v.id} 
                                        htmlFor={`checkbox-${v.id}`}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                          selectedVolunteers.includes(v.id) ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted/40'
                                        }`}
                                      >
                                          <Checkbox 
                                            id={`checkbox-${v.id}`}
                                            checked={selectedVolunteers.includes(v.id)} 
                                            onCheckedChange={() => handleToggleVolunteer(v.id)}
                                          />
                                          <div className="flex flex-col flex-1">
                                              <span className="font-semibold text-sm">{formatVolunteerLabel(v)}</span>
                                              <span className="text-xs text-muted-foreground">{v.models?.name ? formatModelLabel(v.models) : 'No Model'}</span>
                                          </div>
                                      </label>
                                  ))}
                                  {!loadingVols && volunteers.length === 0 && (
                                      <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                                        <Users className="h-8 w-8 mb-2 opacity-20" />
                                        <p className="text-sm">No available volunteers found.</p>
                                      </div>
                                  )}
                              </div>
                          )}
                      </CardContent>
                      <div className="p-3 flex justify-between items-center bg-muted/20 border-t border-ink/10">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={page === 1}
                            onClick={() => setPage((p: any) => Math.max(1, p - 1))}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-xs text-muted-foreground font-medium">
                            Page {page} of {Math.max(1, totalPages)}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={page >= totalPages}
                            onClick={() => setPage((p: any) => p + 1)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                      </div>
                  </div>
              </div>

              <div className="md:col-span-7">
                  <div className="bento-white h-[700px] flex flex-col !p-0">
                      <CardHeader className="flex flex-row items-center justify-between pb-4 shrink-0 border-b border-ink/10 bg-muted/20">
                          <div>
                              <CardTitle className="text-lg">Enrolled Volunteers</CardTitle>
                              <CardDescription>Total: {enrollments.length}</CardDescription>
                          </div>
                          <Users className="w-5 h-5 text-muted-foreground" />
                      </CardHeader>
                       <CardContent className="p-0 flex-1 overflow-auto">
                           {loading ? (
                              <div className="p-4 space-y-4">
                                <div className="rounded-md border">
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
                            <TableHeader className="bg-muted/40 sticky top-0 z-10">
                            <TableRow>
                                <TableHead>Photo</TableHead>
                                <TableHead>SNK ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {enrollments.map((e: any) => (
                                <TableRow key={e.id}>
                                    <TableCell>
                                        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                                            {e.volunteer?.photo_url && (
                                                <Image src={e.volunteer.photo_url} alt={`${e.volunteer.full_name || 'Volunteer'}'s avatar`} width={32} height={32} unoptimized className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-xs">{e.volunteer?.snk_id || 'Pending'}</TableCell>
                                    <TableCell>{e.volunteer?.full_name}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemove(e.id)} className="text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && enrollments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        No volunteers enrolled yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                        )}
                      </CardContent>
                  </div>
              </div>
          </div>
      )}
    </div>
  )
}
