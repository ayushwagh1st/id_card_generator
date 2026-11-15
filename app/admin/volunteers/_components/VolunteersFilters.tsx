'use client'

import { useState } from 'react'
import { AsyncButton } from '@/components/ui/async-button'
import { CheckCircle, Filter, Printer, Trash2, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { SearchField } from '@/components/ui/search-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { formatModelLabel } from '@/lib/formatters'

interface ModelOption { id: string; name: string; category?: string | null }
interface VolunteersFiltersProps {
  searchTerm: string; filterModel: string; filterStatus: string; models: ModelOption[]; selectedIdsCount: number
  onSearchChange: (value: string) => void; onModelChange: (value: string) => void; onStatusChange: (value: string) => void
  onPrintSelected: () => void; onBulkApprove: () => Promise<unknown> | void; onBulkDelete: () => void; onClearSelection?: () => void
}

function ModelFilter({ id, value, models, onChange }: { id: string; value: string; models: ModelOption[]; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label htmlFor={id}>Exhibition model</Label><Select value={value} onValueChange={next => onChange(next || 'all')}>
    <SelectTrigger id={id}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All exhibition models</SelectItem>{models.map(model => <SelectItem key={model.id} value={model.id}>{formatModelLabel(model)}</SelectItem>)}</SelectContent>
  </Select></div>
}

export function VolunteersFilters({ searchTerm, filterModel, filterStatus, models, selectedIdsCount, onSearchChange, onModelChange, onStatusChange, onPrintSelected, onBulkApprove, onBulkDelete, onClearSelection }: VolunteersFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeModel = models.find(model => model.id === filterModel)
  return <div className="roster-controls">
    <div className="roster-search-row">
      <SearchField id="volunteer-search" label="Search volunteers" placeholder="Name, SNK ID, or mobile number" value={searchTerm} onChange={event => onSearchChange(event.target.value)} />
      <div className="roster-model-desktop"><ModelFilter id="volunteer-model-filter" value={filterModel} models={models} onChange={onModelChange} /></div>
      <Button variant="outline" className="roster-filter-trigger" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog"><Filter size={16} aria-hidden="true" />Filters{filterModel !== 'all' ? ' (1)' : ''}</Button>
    </div>
    <Tabs value={filterStatus} onValueChange={value => onStatusChange(String(value))}>
      <TabsList variant="line" aria-label="Filter volunteers by status" className="roster-status-tabs">{[['all', 'All volunteers'], ['Pending', 'Pending'], ['Approved', 'Approved'], ['Rejected', 'Rejected']].map(([value, label]) => <TabsTrigger key={value} value={value}>{label}</TabsTrigger>)}</TabsList>
    </Tabs>
    {filterModel !== 'all' && <div className="active-filter-row"><span>Model: {activeModel ? formatModelLabel(activeModel) : 'Selected model'}</span><Button variant="ghost" size="sm" onClick={() => onModelChange('all')} aria-label="Clear model filter"><X size={14} aria-hidden="true" />Clear</Button></div>}
    {selectedIdsCount > 0 && <div className="roster-selection-bar" aria-label="Selected volunteer actions">
      <div><strong>{selectedIdsCount} selected</strong><small>Selection is retained across pages and filters.</small></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={onPrintSelected}><Printer size={15} aria-hidden="true" />Print selected</Button><AsyncButton variant="outline" size="sm" onClick={onBulkApprove} busyLabel="Approving…"><CheckCircle size={15} aria-hidden="true" />Approve selected</AsyncButton>
        <AlertDialog><AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-destructive" />}><Trash2 size={15} aria-hidden="true" />Delete</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete selected volunteers?</AlertDialogTitle><AlertDialogDescription>This permanently deletes {selectedIdsCount} selected volunteer records, including any selected on other pages. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onBulkDelete}>Delete {selectedIdsCount} records</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        {onClearSelection && <Button variant="ghost" size="sm" onClick={onClearSelection}>Clear selection</Button>}
      </div>
    </div>}
    <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}><DialogContent><DialogTitle>Filter volunteers</DialogTitle><DialogDescription>Model filters apply immediately. Use the status tabs to switch between approvals.</DialogDescription><ModelFilter id="mobile-volunteer-model-filter" value={filterModel} models={models} onChange={onModelChange} /><DialogFooter><Button onClick={() => setFiltersOpen(false)}>Done</Button></DialogFooter></DialogContent></Dialog>
  </div>
}
