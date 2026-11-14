'use client'

import type { ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'

export default function LecturerLayout({ children }: { children: ReactNode }) {
  return <AppShell role="LECTURER">{children}</AppShell>
}
