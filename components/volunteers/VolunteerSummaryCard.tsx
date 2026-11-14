import { Edit, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecordIdentity, type VolunteerSummary } from './RecordIdentity'

export function VolunteerSummaryCard({ volunteer, onOpen }: { volunteer: VolunteerSummary; onOpen: () => void }) {
  const locked = volunteer.status === 'Approved'
  return <article className="roster-mobile-record">
    <RecordIdentity volunteer={volunteer} />
    <div className="roster-mobile-meta"><div><span>Exhibition model</span><strong>{volunteer.models?.name || 'Not assigned'}</strong></div><span className={`status-pill status-${volunteer.status.toLowerCase()}`}>{volunteer.status}</span></div>
    {volunteer.mobile_number && <p className="roster-mobile-contact">{volunteer.mobile_number}</p>}
    <div className="roster-mobile-actions"><Button variant="outline" onClick={onOpen} aria-label={`${locked ? 'View' : 'Edit'} ${volunteer.full_name}`}>{locked ? <Eye size={16} aria-hidden="true" /> : <Edit size={16} aria-hidden="true" />}{locked ? 'View details' : 'Edit profile'}</Button>{locked && <span className="text-xs text-muted-foreground">Approved profiles are locked.</span>}</div>
  </article>
}
