import Image from 'next/image'
import { Users } from 'lucide-react'

export interface VolunteerSummary {
  id: string; full_name: string; snk_id?: string | null; role?: string | null; mobile_number?: string | null
  photo_url?: string | null; status: string; models?: { name: string } | null
}

export function RecordIdentity({ volunteer }: { volunteer: VolunteerSummary }) {
  return <div className="record-identity"><div className="record-photo">{volunteer.photo_url ? <Image src={volunteer.photo_url} alt="" width={36} height={44} unoptimized /> : <Users size={18} aria-hidden="true" />}</div><div><strong>{volunteer.full_name}</strong><span>{volunteer.snk_id || 'ID pending'} · {volunteer.role || 'Volunteer'}</span></div></div>
}
