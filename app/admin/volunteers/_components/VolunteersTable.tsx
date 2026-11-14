import { Users, Edit, Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RecordIdentity as Identity, type VolunteerSummary } from '@/components/volunteers/RecordIdentity'

export type VolunteerRecord = VolunteerSummary
interface VolunteersTableProps {
  volunteers: VolunteerRecord[]; loading: boolean; selectedIds: string[]; page: number; totalPages: number; totalCount: number
  searchTerm: string; filterStatus: string; filterModel: string
  onToggleSelectAll: () => void; onToggleSelect: (id: string) => void; onOpenEdit: (volunteer: VolunteerRecord) => void
  onPrintSingle: (id: string) => void; onStatusChange: (id: string, status: string) => void
  onPageChange: (updater: number | ((previous: number) => number)) => void
}

function StatusControl({ volunteer, onChange }: { volunteer: VolunteerRecord; onChange: VolunteersTableProps['onStatusChange'] }) {
  return <Select value={volunteer.status} onValueChange={value => { if (value && ['Pending', 'Approved', 'Rejected'].includes(value)) onChange(volunteer.id, value) }}><SelectTrigger aria-label={`Status for ${volunteer.full_name}`} className={`roster-status-select status-${volunteer.status.toLowerCase()}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent></Select>
}

export function VolunteersTable({ volunteers, loading, selectedIds, page, totalPages, totalCount, searchTerm, filterStatus, filterModel, onToggleSelectAll, onToggleSelect, onOpenEdit, onPrintSingle, onStatusChange, onPageChange }: VolunteersTableProps) {
  const selected = new Set(selectedIds)
  const selectedOnPage = volunteers.filter(volunteer => selected.has(volunteer.id)).length
  const allOnPageSelected = volunteers.length > 0 && selectedOnPage === volunteers.length
  const filtered = !!searchTerm || filterStatus !== 'all' || filterModel !== 'all'
  const start = (page - 1) * 20 + 1

  if (loading) return <div className="ui-panel p-5 space-y-4" role="status"><p className="text-muted-foreground">Loading volunteer records…</p>{[1, 2, 3].map(id => <Skeleton key={id} className="h-20" />)}</div>
  if (!volunteers.length) return <div className="ui-panel task-empty"><Users size={26} aria-hidden="true" /><h2>{filtered ? 'No volunteers match these filters' : 'No volunteers registered yet'}</h2><p>{filtered ? 'Try a different name, status, or exhibition model.' : 'Add a volunteer or import a CSV roster to get started.'}</p></div>

  return <section className="roster-records" aria-label="Volunteer records">
    <div className="roster-page-selection"><Checkbox checked={allOnPageSelected} indeterminate={selectedOnPage > 0 && !allOnPageSelected} onCheckedChange={onToggleSelectAll} aria-label="Select all volunteers on this page" /><span>Select this page <small>({volunteers.length} records)</small></span></div>
    <div className="roster-mobile-list">{volunteers.map(volunteer => <article className="roster-mobile-record" key={volunteer.id} data-selected={selected.has(volunteer.id)}>
      <div className="roster-mobile-identity"><Identity volunteer={volunteer} /><Checkbox checked={selected.has(volunteer.id)} onCheckedChange={() => onToggleSelect(volunteer.id)} aria-label={`Select ${volunteer.full_name}`} /></div>
      <div className="roster-mobile-meta"><div><span>Exhibition model</span><strong>{volunteer.models?.name || 'Not assigned'}</strong></div><StatusControl volunteer={volunteer} onChange={onStatusChange} /></div>
      {volunteer.mobile_number && <p className="roster-mobile-contact">{volunteer.mobile_number}</p>}
      <div className="roster-mobile-actions"><Button variant="outline" onClick={() => onOpenEdit(volunteer)} aria-label={`Edit ${volunteer.full_name}`}><Edit size={15} aria-hidden="true" />Edit profile</Button><Button variant="ghost" onClick={() => onPrintSingle(volunteer.id)} aria-label={`Print card for ${volunteer.full_name}`}><Printer size={15} aria-hidden="true" />Print ID</Button></div>
    </article>)}</div>
    <div className="roster-desktop-table"><Table><TableHeader><TableRow><TableHead className="w-16"><span className="sr-only">Selection</span></TableHead><TableHead>Volunteer</TableHead><TableHead>Exhibition model</TableHead><TableHead>Mobile</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{volunteers.map(volunteer => <TableRow key={volunteer.id} data-state={selected.has(volunteer.id) ? 'selected' : undefined}>
      <TableCell><Checkbox checked={selected.has(volunteer.id)} onCheckedChange={() => onToggleSelect(volunteer.id)} aria-label={`Select ${volunteer.full_name}`} /></TableCell><TableCell><Identity volunteer={volunteer} /></TableCell><TableCell className="roster-model-cell">{volunteer.models?.name || 'Not assigned'}</TableCell><TableCell>{volunteer.mobile_number || <span className="text-muted-foreground">Not provided</span>}</TableCell><TableCell><StatusControl volunteer={volunteer} onChange={onStatusChange} /></TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => onOpenEdit(volunteer)} aria-label={`Edit ${volunteer.full_name}`}><Edit size={16} aria-hidden="true" /></Button><Button variant="ghost" size="icon" onClick={() => onPrintSingle(volunteer.id)} aria-label={`Print card for ${volunteer.full_name}`}><Printer size={16} aria-hidden="true" /></Button></div></TableCell>
    </TableRow>)}</TableBody></Table></div>
    <footer className="roster-pagination"><span>{start} to {Math.min(start + volunteers.length - 1, totalCount)} of {totalCount} volunteers</span><div><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(previous => Math.max(1, previous - 1))}><ChevronLeft size={15} aria-hidden="true" />Previous</Button><span aria-live="polite">{page} / {Math.max(1, totalPages)}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(previous => previous + 1)}>Next<ChevronRight size={15} aria-hidden="true" /></Button></div></footer>
  </section>
}
