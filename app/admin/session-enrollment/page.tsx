'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { getSessionsAction, getSessionEnrollmentsAction, enrollVolunteersAction, removeEnrollmentAction } from '@/app/actions/sessions'
import { getVolunteersAction } from '@/app/actions/volunteers'
import { createClient } from '@/lib/supabase/client'

export default function SessionEnrollmentPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('none')
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Volunteers listing state
  const [volunteers, setVolunteers] = useState<any[]>([])
  const [searchVol, setSearchVol] = useState('')
  const [modelFilter, setModelFilter] = useState('all')
  const [models, setModels] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingVols, setLoadingVols] = useState(false)
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([])

  const limit = 20
  const supabase = createClient()

  const fetchSessions = async () => {
    try {
      const res = await getSessionsAction(1, 100, '', 'all', 'all')
      setSessions(res.data || [])
    } catch (err: any) {
      toast.error('Failed to load sessions')
    }
  }

  const fetchModels = async () => {
    try {
      const { data } = await supabase.from('models').select('id, name')
      setModels(data || [])
    } catch (err: any) {
      console.error('Failed to load models')
    }
  }

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
  }, [selectedSessionId])

  const searchVolunteers = useCallback(async () => {
    if (selectedSessionId === 'none') return
    
    setLoadingVols(true)
    try {
      // Get all approved volunteers matching search and model filter
      const res = await getVolunteersAction(page, limit, searchVol, 'Approved', modelFilter)
      
      // Filter out already enrolled from the current page
      const enrolledIds = enrollments.map(e => e.volunteer?.id)
      const filtered = (res.data || []).filter(v => !enrolledIds.includes(v.id))
      
      setVolunteers(filtered)
      setTotalCount(res.count || 0)
      setTotalPages(Math.ceil((res.count || 0) / limit))
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoadingVols(false)
    }
  }, [searchVol, modelFilter, page, enrollments, selectedSessionId])

  useEffect(() => {
    fetchSessions()
    fetchModels()
  }, [])

  useEffect(() => {
    fetchEnrollments()
    setPage(1)
    setSearchVol('')
    setModelFilter('all')
    setSelectedVolunteers([])
  }, [fetchEnrollments])

  useEffect(() => {
    const timeout = setTimeout(() => {
        searchVolunteers()
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchVolunteers])

  const handleToggleVolunteer = (id: string) => {
    setSelectedVolunteers(prev => 
      prev.includes(id) ? prev.filter(vId => vId !== id) : [...prev, id]
    )
  }

  const handleSelectAllVisible = () => {
    const visibleIds = volunteers.map(v => v.id)
    const allSelected = visibleIds.every(id => selectedVolunteers.includes(id))
    
    if (allSelected) {
      // Deselect all visible
      setSelectedVolunteers(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      // Select all visible
      setSelectedVolunteers(prev => Array.from(new Set([...prev, ...visibleIds])))
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Session Enrollment</h1>
          <p className="text-teal-100 mt-2 text-sm max-w-xl">
            Assign volunteers to sessions to enable attendance tracking.
          </p>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border border-primary/10 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <Label className="font-bold whitespace-nowrap">Select Session:</Label>
        <Select value={selectedSessionId} onValueChange={(val: any) => setSelectedSessionId(val)}>
          <SelectTrigger className="w-full sm:w-[400px]">
            <SelectValue placeholder="Choose a session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- Select a Session --</SelectItem>
            {sessions.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name} ({s.date})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSessionId !== 'none' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-4">
                  <Card className="shadow-lg border-primary/10 flex flex-col h-[700px]">
                      <CardHeader className="pb-3 border-b">
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
                                      <SelectValue placeholder="Filter by Model" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="all">All Models</SelectItem>
                                      {models.map(m => (
                                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                              
                              <div className="flex items-center justify-between pt-2">
                                  <Button variant="ghost" size="sm" onClick={handleSelectAllVisible} className="h-8 px-2 text-xs">
                                      <CheckSquare className="w-4 h-4 mr-2" />
                                      {volunteers.length > 0 && volunteers.every(v => selectedVolunteers.includes(v.id)) 
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
                                  {volunteers.map(v => (
                                      <div 
                                        key={v.id} 
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                          selectedVolunteers.includes(v.id) ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted/40'
                                        }`}
                                        onClick={() => handleToggleVolunteer(v.id)}
                                      >
                                          <Checkbox 
                                            checked={selectedVolunteers.includes(v.id)} 
                                            onCheckedChange={() => handleToggleVolunteer(v.id)}
                                          />
                                          <div className="flex flex-col flex-1">
                                              <span className="font-semibold text-sm">{v.full_name}</span>
                                              <span className="text-xs text-muted-foreground">{v.snk_id || 'Pending'} • {v.models?.name || 'No Model'}</span>
                                          </div>
                                      </div>
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
                      <CardFooter className="border-t p-3 flex justify-between items-center bg-muted/20">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
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
                            onClick={() => setPage(p => p + 1)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                      </CardFooter>
                  </Card>
              </div>

              <div className="md:col-span-7">
                  <Card className="shadow-lg border-primary/10 h-[700px] flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b shrink-0">
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
                            {enrollments.map(e => (
                                <TableRow key={e.id}>
                                    <TableCell>
                                        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                                            {e.volunteer?.photo_url && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={e.volunteer.photo_url} alt="" className="w-full h-full object-cover" />
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
                  </Card>
              </div>
          </div>
      )}
    </div>
  )
}
