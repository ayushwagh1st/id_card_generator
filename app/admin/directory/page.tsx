'use client'

import { useEffect, useState } from 'react'
import { getChildrenDirectoryAction, bulkCheckOutAction, toggleAttendanceStatusAction } from '@/server/actions/children'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getSessionsAction } from '@/server/actions/sessions'
import { Button } from '@/components/ui/button'

import { Search, LogOut, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export default function DirectoryPage() {
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sessionFilter, setSessionFilter] = useState('all')
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const [childrenRes, sessionsRes] = await Promise.all([
      getChildrenDirectoryAction(),
      getSessionsAction(1, 100)
    ])
    
    if (childrenRes.error) toast.error(childrenRes.error)
    else setChildren(childrenRes.data || [])
    
    if (sessionsRes.data) {
      setSessions(sessionsRes.data)
    }
    setLoading(false)
  }

  const fetchChildren = async () => {
    setLoading(true)
    const res = await getChildrenDirectoryAction()
    if (res.error) {
      toast.error(res.error)
    } else {
      setChildren(res.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredChildren = children.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.serial_number.toLowerCase().includes(search.toLowerCase()) || (c.contact_number && c.contact_number.includes(search))
    const matchesStatus = statusFilter === 'all' || (c.status || 'Registered') === statusFilter
    const matchesSession = sessionFilter === 'all' || c.session_id === sessionFilter
    return matchesSearch && matchesStatus && matchesSession
  })

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredChildren.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredChildren.map(c => c.id)))
    }
  }

  const handleBulkCheckOut = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    const res = await bulkCheckOutAction(Array.from(selectedIds))
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`Successfully checked out ${selectedIds.size} children`)
      setSelectedIds(new Set())
      await fetchChildren()
    }
    setBulkLoading(false)
  }

  const handleToggleStatus = async (childId: string, currentStatus: string) => {
    const res = await toggleAttendanceStatusAction(childId, currentStatus)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Attendance updated')
      fetchChildren()
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'Checked In') return 'bg-green-500'
    if (status === 'Checked Out') return 'bg-gray-500'
    return 'bg-blue-500'
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Children Directory</CardTitle>
              <CardDescription>Search and manage registered children and their attendance</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search..." 
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Registered">Registered</SelectItem>
                  <SelectItem value="Checked In">Checked In</SelectItem>
                  <SelectItem value="Checked Out">Checked Out</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sessionFilter} onValueChange={(val) => setSessionFilter(val || 'all')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedIds.size > 0 && (
                <Button variant="destructive" onClick={handleBulkCheckOut} disabled={bulkLoading}>
                  {bulkLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                  Check Out ({selectedIds.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size > 0 && selectedIds.size === filteredChildren.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Serial No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChildren.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                        No children found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredChildren.map((child) => (
                      <TableRow key={child.id}>
                        <TableCell>
                          <input 
                            type="checkbox" 
                            checked={selectedIds.has(child.id)}
                            onChange={() => handleToggleSelect(child.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{child.serial_number}</TableCell>
                        <TableCell className="font-medium">{child.name}</TableCell>
                        <TableCell>{child.contact_number || 'N/A'}</TableCell>
                        <TableCell>{child.session_name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors text-white ${getStatusColor(child.status || 'Registered')}`}>
                            {child.status || 'Registered'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleStatus(child.id, child.status || 'Registered')}
                          >
                            {(child.status || 'Registered') === 'Checked In' ? 'Check Out' : 'Check In'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
