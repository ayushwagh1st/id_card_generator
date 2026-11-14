'use client'

import type { ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { GlobalNotificationProvider } from '@/components/GlobalNotificationProvider'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell role="SUPER_ADMIN"><GlobalNotificationProvider />{children}</AppShell>
}
