'use client'

import React, { useEffect, useState, useCallback, useReducer } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Users, ScanLine, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { getSessionsAction, getSessionEnrollmentsAction } from '@/server/actions/sessions'
import { bulkCheckoutAllAction } from '@/server/actions/attendance'
import { getCurrentUserAction } from '@/server/actions/auth'
import { useRouter } from 'next/navigation'

const handleBulkCheckout = async (sessionId: string) => {
    if (!confirm('Are you sure you want to check out everyone who has checked in for this session?')) return;
    
    const loadingToast = toast.loading('Processing bulk checkout...')
    try {
        const res = await bulkCheckoutAllAction(sessionId)
        if (res?.error) {
            toast.error(res.error, { id: loadingToast })
        } else {
            toast.success(res.message, { id: loadingToast })
        }
    } catch (err: any) {
        toast.error('Failed to perform bulk checkout.', { id: loadingToast })
    }
}

export default function LecturerSessionsPage() {
  const [state, dispatch] = React.useReducer(
    (state: any, action: any) => typeof action === 'function' ? { ...state, ...action(state) } : { ...state, ...action },
    {
      sessions: [],
      searchTerm: '',
      loading: true,
      viewEnrollmentsOpen: false,
      selectedSession: null,
      enrollments: [],
      loadingEnrollments: false
    }
  )

  const {
    sessions, searchTerm, loading, viewEnrollmentsOpen,
    selectedSession, enrollments, loadingEnrollments
  } = state

  const setSessions = useCallback((v: any) => dispatch((s: any) => ({ sessions: typeof v === 'function' ? v(s.sessions) : v })), [])
  const setSearchTerm = useCallback((v: any) => dispatch((s: any) => ({ searchTerm: typeof v === 'function' ? v(s.searchTerm) : v })), [])
  const setLoading = useCallback((v: any) => dispatch((s: any) => ({ loading: typeof v === 'function' ? v(s.loading) : v })), [])
  const setViewEnrollmentsOpen = useCallback((v: any) => dispatch((s: any) => ({ viewEnrollmentsOpen: typeof v === 'function' ? v(s.viewEnrollmentsOpen) : v })), [])
  const setSelectedSession = useCallback((v: any) => dispatch((s: any) => ({ selectedSession: typeof v === 'function' ? v(s.selectedSession) : v })), [])
  const setEnrollments = useCallback((v: any) => dispatch((s: any) => ({ enrollments: typeof v === 'function' ? v(s.enrollments) : v })), [])
  const setLoadingEnrollments = useCallback((v: any) => dispatch((s: any) => ({ loadingEnrollments: typeof v === 'function' ? v(s.loadingEnrollments) : v })), [])

  const router = useRouter()

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const user = await getCurrentUserAction()
      if (!user) return

      const role = user.user_metadata?.role
      const lecturerFilter = 'all' // Security needs to see all sessions

      const res = await getSessionsAction(1, 100, searchTerm, 'all', lecturerFilter)
      setSessions(res.data || [])
    } catch (err: any) {
      toast.error('Failed to load your sessions')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, setLoading, setSessions])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSessions()
    }, 300)
    return () => clearTimeout(timeout)
  }, [fetchSessions])

  const openEnrollments = async (sess: any) => {
    setSelectedSession(sess)
    setViewEnrollmentsOpen(true)
    setLoadingEnrollments(true)
    try {
      const res = await getSessionEnrollmentsAction(sess.id)
      setEnrollments(res.data || [])
    } catch (err: any) {
      toast.error('Failed to load enrolled volunteers')
    } finally {
      setLoadingEnrollments(false)
    }
  }

  const navigateToScanner = (sessionId: string) => {
      // Store session in local storage or pass as query param
      router.push(`/lecturer/scanner?session=${sessionId}`)
  }



  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-[24px] bg-gradient-to-r from-[#fcfaff] to-[#f6f4ff] p-8 md:p-12 border border-[#f0ebff] shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ecfdf3] text-[#027a48] text-xs font-semibold tracking-wide uppercase">
            <ScanLine className="w-4 h-4 mr-2" /> Scanner
          </div>
          <div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight text-slate-900">All Sessions</h1>
            <div className="w-12 h-1 bg-[#8C6DFD] rounded-full mt-4 opacity-80"></div>
          </div>
          <p className="font-sans text-slate-500 text-lg max-w-xl leading-relaxed">
            View your assigned sessions and scan QR codes for attendance.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sessions..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bento-white overflow-hidden rounded-[32px] border-ink shadow-hard !p-0">
        <div className="p-0">
          {loading ? (
            <div className="p-4 space-y-4">
              <div className="rounded-md border">
                <div className="border-b px-4 py-3 flex gap-4 bg-muted/40">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32 ml-auto" />
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-4 py-4 flex items-center gap-4 border-b last:border-0">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <div className="flex gap-2 ml-auto">
                      <Skeleton className="h-8 w-24 rounded-md" />
                      <Skeleton className="h-8 w-24 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Session Name</TableHead>
                <TableHead>Lecturer Name</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((sess: any) => (
                <TableRow key={sess.id}>
                  <TableCell>
                    <div className="font-semibold">{sess.name}</div>
                    <div className="text-xs text-muted-foreground">{sess.category}</div>
                  </TableCell>
                  <TableCell>{sess.lecturer_name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <div className="text-sm">{sess.date}</div>
                    <div className="text-xs text-muted-foreground">{sess.start_time} - {sess.end_time}</div>
                  </TableCell>
                  <TableCell>{sess.venue}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      sess.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      sess.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                      sess.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {sess.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEnrollments(sess)}>
                            <Users className="w-4 h-4 mr-1" /> Volunteers
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleBulkCheckout(sess.id)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200">
                            <LogOut className="w-4 h-4 mr-1" /> Bulk Check-out
                        </Button>
                        <Button size="sm" onClick={() => navigateToScanner(sess.id)}>
                            <ScanLine className="w-4 h-4 mr-1" /> Scan QR
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && sessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No sessions found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </div>
      </div>

      <Dialog open={viewEnrollmentsOpen} onOpenChange={setViewEnrollmentsOpen}>
          <DialogContent className="sm:max-w-2xl rounded-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle>Enrolled Volunteers</DialogTitle>
                  <DialogDescription>
                      {selectedSession?.name} ({selectedSession?.date})
                  </DialogDescription>
              </DialogHeader>
              {loadingEnrollments ? (
                  <div className="p-4 space-y-4">
                    <div className="rounded-md border">
                      <div className="border-b px-4 py-3 flex gap-4 bg-muted/40">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="px-4 py-4 flex items-center gap-4 border-b last:border-0">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      ))}
                    </div>
                  </div>
              ) : (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>SNK ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Mobile</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {enrollments.map((e: any) => (
                              <TableRow key={e.id}>
                                  <TableCell className="font-medium text-xs">{e.volunteer?.snk_id || 'Pending'}</TableCell>
                                  <TableCell>{e.volunteer?.full_name}</TableCell>
                                  <TableCell>{e.volunteer?.mobile_number}</TableCell>
                              </TableRow>
                          ))}
                          {enrollments.length === 0 && (
                              <TableRow>
                                  <TableCell colSpan={3} className="text-center py-4">No volunteers enrolled.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              )}
          </DialogContent>
      </Dialog>
    </div>
  )
}
