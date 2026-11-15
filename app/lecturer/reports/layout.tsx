import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Attendance reports | Security | Bal Pradarshani',
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
