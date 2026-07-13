import { Search, Filter, Printer, CheckCircle, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatModelLabel } from '@/lib/formatters'

interface VolunteersFiltersProps {
  searchTerm: string
  filterModel: string
  filterStatus: string
  models: any[]
  selectedIdsCount: number
  onSearchChange: (val: string) => void
  onModelChange: (val: string) => void
  onStatusChange: (val: string) => void
  onPrintSelected: () => void
  onBulkApprove: () => void
  onBulkDelete: () => void
}

export function VolunteersFilters({
  searchTerm,
  filterModel,
  filterStatus,
  models,
  selectedIdsCount,
  onSearchChange,
  onModelChange,
  onStatusChange,
  onPrintSelected,
  onBulkApprove,
  onBulkDelete,
}: VolunteersFiltersProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search name, SNK ID, mobile..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Select value={filterModel} onValueChange={(val) => onModelChange(val || 'all')}>
          <SelectTrigger className="w-full sm:w-48 bg-card border-primary/10 rounded-xl">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter by Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" label="All Exhibition Models">All Exhibition Models</SelectItem>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id} label={formatModelLabel(m)}>
                {formatModelLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(val) => onStatusChange(val || 'all')}>
          <SelectTrigger className="w-full sm:w-40 bg-card border-primary/10 rounded-xl">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" label="All Statuses">All Statuses</SelectItem>
            <SelectItem value="Approved" label="Approved">Approved</SelectItem>
            <SelectItem value="Pending" label="Pending">Pending</SelectItem>
            <SelectItem value="Rejected" label="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {selectedIdsCount > 0 && (
          <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrintSelected}
              className="gap-1.5 text-primary bg-card px-3"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Selected ({selectedIdsCount})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkApprove}
              className="gap-1.5 bg-card px-3"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approve
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive bg-card px-3"
                  />
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedIdsCount} volunteer record(s). This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onBulkDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Records
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  )
}
