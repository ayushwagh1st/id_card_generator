'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Edit, KeyRound, Trash2, Eye, EyeOff } from 'lucide-react'

export function LecturersTable({
  loading,
  lecturers,
  visiblePasswords,
  togglePassword,
  openEdit,
  openResetPass,
  handleDelete
}: {
  loading: boolean
  lecturers: any[]
  visiblePasswords: Record<string, boolean>
  togglePassword: (id: string) => void
  openEdit: (lecturer: any) => void
  openResetPass: (lecturer: any) => void
  handleDelete: (id: string) => void
}) {
  return (
    <div className="glass-panel overflow-hidden rounded-3xl border border-white/40 dark:border-slate-800/80 shadow-xl">
      <div className="p-0">
        {loading ? (
          <div className="p-4 space-y-4">
            <div className="rounded-md border">
              <div className="border-b px-4 py-3 flex gap-4 bg-muted/40">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24 ml-auto" />
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-4 py-4 flex items-center gap-4 border-b last:border-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-6 w-24 rounded-md" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <div className="flex gap-1.5 ml-auto">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lecturers.map(lect => (
              <TableRow key={lect.id}>
                <TableCell className="font-medium">{lect.name}</TableCell>
                <TableCell>{lect.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-600 bg-amber-500/5 px-2 py-1.5 rounded w-fit">
                      {visiblePasswords[lect.id] ? (lect.password || 'N/A') : '••••••'}
                    </span>
                    <button type="button" onClick={() => togglePassword(lect.id)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle password visibility">
                      {visiblePasswords[lect.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </TableCell>
                <TableCell>{lect.mobile}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${lect.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                    {lect.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(lect)} title="Edit Security">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openResetPass(lect)} title="Reset Password" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                    <KeyRound className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(lect.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && lecturers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No security personnel found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        )}
      </div>
    </div>
  )
}
