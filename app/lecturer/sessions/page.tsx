'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Users, ScanLine } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { getSessionsAction, getSessionEnrollmentsAction } from '@/app/actions/sessions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LecturerSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [viewEnrollmentsOpen, setViewEnrollmentsOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const res = await getSessionsAction(1, 100, searchTerm, 'all', user.id)
      setSessions(res.data || [])
    } catch (err: any) {
      toast.error('Failed to load your sessions')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, supabase.auth])

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 p-6 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">My Sessions</h1>
          <p className="text-blue-100 mt-2 text-sm max-w-xl">
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
            className="pl-9 bg-card border-primary/10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-lg border-primary/10 overflow-hidden backdrop-blur-md bg-card">
        <CardContent className="p-0">
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
                <TableHead>Date & Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map(sess => (
                <TableRow key={sess.id}>
                  <TableCell>
                    <div className="font-semibold">{sess.name}</div>
                    <div className="text-xs text-muted-foreground">{sess.category}</div>
                  </TableCell>
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
                        <Button size="sm" onClick={() => navigateToScanner(sess.id)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <ScanLine className="w-4 h-4 mr-1" /> Scan QR
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && sessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No sessions found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

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
                          {enrollments.map(e => (
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
