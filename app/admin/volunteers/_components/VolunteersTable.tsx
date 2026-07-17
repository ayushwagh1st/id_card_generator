import Image from 'next/image'
import { Users, Edit, Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface VolunteersTableProps {
  volunteers: any[]
  loading: boolean
  selectedIds: string[]
  page: number
  totalPages: number
  totalCount: number
  searchTerm: string
  filterStatus: string
  filterModel: string
  onToggleSelectAll: () => void
  onToggleSelect: (id: string) => void
  onOpenEdit: (vol: any) => void
  onPrintSingle: (id: string) => void
  onStatusChange: (id: string, status: string) => void
  onPageChange: (updater: number | ((prev: number) => number)) => void
}

export function VolunteersTable({
  volunteers,
  loading,
  selectedIds,
  page,
  totalPages,
  totalCount,
  searchTerm,
  filterStatus,
  filterModel,
  onToggleSelectAll,
  onToggleSelect,
  onOpenEdit,
  onPrintSingle,
  onStatusChange,
  onPageChange,
}: VolunteersTableProps) {
  if (loading) {
    return (
      <div className="bento-white overflow-hidden rounded-[32px] border-ink shadow-hard">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-8 w-[150px]" />
          </div>
          <div className="rounded-md border">
            <div className="border-b px-4 py-3 flex gap-4 bg-muted/40">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-full" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-4 flex items-center gap-4 border-b last:border-0">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-2 w-48">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <div className="space-y-2 w-48 hidden md:block">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-8 w-16 ml-auto rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bento-white overflow-hidden rounded-[32px] border-ink shadow-hard">
      <div className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 py-4 px-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    checked={selectedIds.length === volunteers.length && volunteers.length > 0}
                    onChange={onToggleSelectAll}
                    aria-label="Select all volunteers"
                  />
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[120px]">
                  SNK ID
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Photo
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[150px]">
                  Name & Role
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[130px]">
                  Mobile
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground min-w-[150px]">
                  Model Area
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-right px-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const selectedSet = new Set(selectedIds)
                return volunteers.map((vol) => (
                  <TableRow key={vol.id} className="hover:bg-muted/20 transition-colors duration-200">
                    <TableCell className="py-4 px-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                        checked={selectedSet.has(vol.id)}
                        onChange={() => onToggleSelect(vol.id)}
                        aria-label={`Select ${vol.full_name}`}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-sm text-primary">
                    {vol.snk_id || 'Pending'}
                  </TableCell>
                  <TableCell>
                    <div className="w-10 h-12 rounded bg-muted overflow-hidden flex items-center justify-center border shadow-sm">
                      {vol.photo_url ? (
                        <Image
                          src={vol.photo_url}
                          alt={`${vol.full_name}'s avatar`}
                          width={40}
                          height={48}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{vol.full_name}</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block text-[10px] text-muted-foreground">
                        {vol.role || 'Volunteer'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-muted-foreground">
                    {vol.mobile_number}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {vol.models ? vol.models.name : <span className="text-xs font-medium text-zinc-400">None Assigned</span>}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={vol.status}
                      onValueChange={(val) => onStatusChange(vol.id, val)}
                    >
                      <SelectTrigger
                        className={`h-8 w-32 border-none font-bold text-xs rounded-full px-3 py-1 ${
                          vol.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : vol.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Pending" className="text-xs font-semibold">
                          Pending
                        </SelectItem>
                        <SelectItem value="Approved" className="text-xs font-semibold">
                          Approved
                        </SelectItem>
                        <SelectItem value="Rejected" className="text-xs font-semibold">
                          Rejected
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenEdit(vol)}
                        className="hover:bg-primary/10 rounded-xl"
                        aria-label={`Edit ${vol.full_name}`}
                        title="Edit Volunteer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onPrintSingle(vol.id)}
                        className="hover:bg-primary/10 text-primary rounded-xl"
                        title="Print Single Card"
                        aria-label={`Print card for ${vol.full_name}`}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            })()}
              {volunteers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                        <Users className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground font-semibold">No volunteers found</p>
                      <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto">
                        {searchTerm || filterStatus !== 'all' || filterModel !== 'all'
                          ? "Try adjusting your search or filters to find what you're looking for."
                          : "There are no volunteers in the system yet."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalCount > 0 && (
          <div className="border-t border-ink/10 p-4 flex items-center justify-between bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="font-bold border-ink shadow-hard-xs hover:-translate-y-0.5 transition-transform"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <div className="text-sm font-semibold text-muted-foreground bg-white px-3 py-1 rounded-full border border-ink shadow-hard-xs">
              Page {page} of {Math.max(1, totalPages)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange((p) => p + 1)}
              disabled={page >= totalPages}
              className="font-bold border-ink shadow-hard-xs hover:-translate-y-0.5 transition-transform"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
