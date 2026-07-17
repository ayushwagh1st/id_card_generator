'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Edit, KeyRound, Trash2, Eye, EyeOff } from 'lucide-react'

export function HeadsTable({ 
  state, 
  dispatch, 
  filteredHeads, 
  getSupervisedModelsStr 
}: { 
  state: any, 
  dispatch: any, 
  filteredHeads: any[], 
  getSupervisedModelsStr: (id: string) => string 
}) {
  return (
    <div className="bento-white overflow-hidden rounded-[32px] border-ink shadow-hard">
      <div className="p-0">
        {state.loading ? (
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
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 px-6">Name</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Login Email ID</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Temporary Password</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Supervised Models</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Assignment Status</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHeads.map((head: any) => {
                const supervisedModels = getSupervisedModelsStr(head.id)
                const isAssigned = supervisedModels !== 'None Assigned'
                return (
                  <TableRow key={head.id} className="hover:bg-muted/20 transition-colors duration-200">
                    <TableCell className="font-semibold text-sm text-foreground py-4 px-6">{head.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{head.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-amber-600 bg-amber-500/5 px-2 py-1.5 rounded w-fit">
                          {state.visiblePasswords[head.id] ? (head.temp_password || 'N/A') : '••••••'}
                        </span>
                        <button type="button" onClick={() => dispatch({ type: 'TOGGLE_PASSWORD', payload: head.id })} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle password visibility">
                          {state.visiblePasswords[head.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className={`font-semibold ${isAssigned ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'}`}>
                        {supervisedModels}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${
                        isAssigned 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' 
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
                      }`}>
                        {isAssigned ? 'Assigned' : 'Unassigned'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-4 space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'OPEN_EDIT', payload: head })} title="Edit Profile" className="h-8 w-8 hover:bg-primary/10 rounded-lg">
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'OPEN_RESET', payload: head })} title="Reset Password" className="h-8 w-8 hover:bg-amber-500/10 rounded-lg">
                        <KeyRound className="h-4 w-4 text-amber-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'OPEN_DELETE', payload: head })} title="Delete Account" className="h-8 w-8 hover:bg-rose-500/10 rounded-lg">
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredHeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm font-semibold">
                    No Model Heads found. Create one above!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
