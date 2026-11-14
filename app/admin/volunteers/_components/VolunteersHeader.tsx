import type { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'

export function VolunteersHeader({ actions }: { actions?: ReactNode }) {
  return <PageHeader title="Volunteers" description="Review profiles, approve registrations, and prepare event IDs." actions={actions} />
}
