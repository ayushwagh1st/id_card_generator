'use client'

import type { ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'

export default function HeadLayout({ children }: { children: ReactNode }) {
  return <AppShell role="MODEL_HEAD">{children}</AppShell>
}
